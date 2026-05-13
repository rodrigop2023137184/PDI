// Edge Function: sugere 1-2 receitas com base nos ingredientes do utilizador.
//
// Runtime: Deno (Supabase Edge Runtime)
// Backend:  Google Gemini API (free tier — sem cartão de crédito necessário)
// Modelo:   gemini-2.5-flash (rápido, qualidade adequada, free tier ativo)
// Secret:   GEMINI_API_KEY (Project Settings → Edge Functions → Secrets)
//
// Entrada: { ingredientes: string[] }
// Saída:   { receitas: [{ nome, tempo_min, ingredientes, instrucoes }] }

import { createClient } from 'npm:@supabase/supabase-js@2';

// ── Helpers de auth/CORS/rate-limit (inlinados para evitar problemas
// de bundling em deploys via Dashboard) ──────────────────────────────────

function corsHeaders(req: Request): Record<string, string> {
  const allowedRaw = Deno.env.get('ALLOWED_ORIGINS') ?? '';
  const allowed = allowedRaw.split(',').map((s: string) => s.trim()).filter(Boolean);
  const origin = req.headers.get('origin');

  let allowOrigin: string;
  if (allowed.length === 0) allowOrigin = '*';
  else if (!origin) allowOrigin = allowed[0];
  else if (allowed.includes(origin)) allowOrigin = origin;
  else allowOrigin = 'null';

  return {
    'Access-Control-Allow-Origin': allowOrigin,
    'Access-Control-Allow-Headers':
      'authorization, x-client-info, apikey, content-type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Vary': 'Origin',
  };
}

async function getAuthenticatedUser(
  req: Request
): Promise<{ id: string } | null> {
  const authHeader = req.headers.get('authorization');
  if (!authHeader?.toLowerCase().startsWith('bearer ')) return null;

  const url = Deno.env.get('SUPABASE_URL');
  const anonKey = Deno.env.get('SUPABASE_ANON_KEY');
  if (!url || !anonKey) {
    console.error('SUPABASE_URL/SUPABASE_ANON_KEY em falta');
    return null;
  }

  const client = createClient(url, anonKey, {
    global: { headers: { Authorization: authHeader } },
  });
  const { data, error } = await client.auth.getUser();
  if (error || !data.user) return null;
  return { id: data.user.id };
}

const rateLimitStore = new Map<string, { count: number; resetAt: number }>();
const RATE_LIMIT = 10;
const RATE_WINDOW_MS = 60 * 60 * 1000; // 1 hora

function checkRateLimit(
  userId: string,
  funcao: string
): { allowed: boolean; resetAt: number } {
  const key = `${funcao}:${userId}`;
  const now = Date.now();
  const existing = rateLimitStore.get(key);
  if (!existing || existing.resetAt < now) {
    const resetAt = now + RATE_WINDOW_MS;
    rateLimitStore.set(key, { count: 1, resetAt });
    return { allowed: true, resetAt };
  }
  if (existing.count >= RATE_LIMIT) {
    return { allowed: false, resetAt: existing.resetAt };
  }
  existing.count++;
  return { allowed: true, resetAt: existing.resetAt };
}

const SYSTEM_PROMPT = `És um chef profissional que cria receitas práticas e saborosas.
Quando te derem uma lista de ingredientes que o utilizador tem em casa, sugeres 1 a 2 receitas
que ele pode preparar.

Regras:
- Usa APENAS os ingredientes fornecidos. Sal, pimenta, azeite e água assume sempre disponíveis
- Se faltar algum ingrediente essencial, sugere mesmo assim mas indica nas instruções
- Receitas práticas, com instruções claras
- Cada instrução é uma frase isolada, SEM numerar nem prefixar com "1.", "Passo 1:" ou similar — o cliente é que adiciona a numeração
- Português europeu (não brasileiro)
- Tempos realistas em minutos (preparação + cozedura)
- Quantidades em medidas práticas: "2 ovos", "1 chávena", "200g", "q.b."`;

const RESPONSE_SCHEMA = {
  type: 'object',
  properties: {
    receitas: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          nome: { type: 'string' },
          tempo_min: { type: 'integer' },
          ingredientes: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                nome: { type: 'string' },
                quantidade: { type: 'string' },
              },
              required: ['nome', 'quantidade'],
              propertyOrdering: ['nome', 'quantidade'],
            },
          },
          instrucoes: {
            type: 'array',
            items: { type: 'string' },
          },
        },
        required: ['nome', 'tempo_min', 'ingredientes', 'instrucoes'],
        propertyOrdering: ['nome', 'tempo_min', 'ingredientes', 'instrucoes'],
      },
    },
  },
  required: ['receitas'],
  propertyOrdering: ['receitas'],
};

interface Pedido {
  ingredientes: string[];
}

Deno.serve(async (req: Request) => {
  const cors = corsHeaders(req);

  // Preflight CORS
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: cors });
  }

  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Método não permitido' }), {
      status: 405,
      headers: { ...cors, 'Content-Type': 'application/json' },
    });
  }

  // Autenticação obrigatória — bloqueia anon/guest
  const user = await getAuthenticatedUser(req);
  if (!user) {
    return new Response(
      JSON.stringify({ error: 'Tens de iniciar sessão para usar a IA.' }),
      {
        status: 401,
        headers: { ...cors, 'Content-Type': 'application/json' },
      }
    );
  }

  // Rate limit por utilizador
  const rl = checkRateLimit(user.id, 'sugerir-receitas');
  if (!rl.allowed) {
    const minutos = Math.ceil((rl.resetAt - Date.now()) / 60000);
    return new Response(
      JSON.stringify({
        error: `Limite de pedidos atingido. Tenta novamente em ${minutos} min.`,
      }),
      {
        status: 429,
        headers: { ...cors, 'Content-Type': 'application/json' },
      }
    );
  }

  try {
    const { ingredientes } = (await req.json()) as Pedido;

    if (!Array.isArray(ingredientes) || ingredientes.length === 0) {
      return new Response(
        JSON.stringify({ error: 'Lista de ingredientes vazia ou inválida' }),
        {
          status: 400,
          headers: { ...cors, 'Content-Type': 'application/json' },
        }
      );
    }

    const apiKey = Deno.env.get('GEMINI_API_KEY');
    if (!apiKey) {
      console.error('GEMINI_API_KEY não configurada nos secrets');
      return new Response(
        JSON.stringify({ error: 'Configuração do servidor incompleta' }),
        {
          status: 500,
          headers: { ...cors, 'Content-Type': 'application/json' },
        }
      );
    }

    const userMessage = `Tenho em casa estes ingredientes: ${ingredientes.join(', ')}.
Sugere 1 ou 2 receitas que eu possa fazer.`;

    const geminiResponse = await fetch(
      'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent',
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-goog-api-key': apiKey,
        },
        body: JSON.stringify({
          systemInstruction: {
            parts: [{ text: SYSTEM_PROMPT }],
          },
          contents: [
            { role: 'user', parts: [{ text: userMessage }] },
          ],
          generationConfig: {
            temperature: 0.7,
            maxOutputTokens: 8192,
            responseMimeType: 'application/json',
            responseSchema: RESPONSE_SCHEMA,
            thinkingConfig: { thinkingBudget: 0 },
          },
        }),
      }
    );

    if (!geminiResponse.ok) {
      const errText = await geminiResponse.text();
      console.error('Gemini API erro:', geminiResponse.status, errText);
      return new Response(
        JSON.stringify({ error: 'Falha na chamada à API Gemini' }),
        {
          status: 502,
          headers: { ...cors, 'Content-Type': 'application/json' },
        }
      );
    }

    const geminiData = await geminiResponse.json();
    const texto = geminiData?.candidates?.[0]?.content?.parts?.[0]?.text;

    if (!texto) {
      console.error('Resposta Gemini sem texto:', JSON.stringify(geminiData));
      return new Response(
        JSON.stringify({ error: 'Resposta da IA vazia' }),
        {
          status: 502,
          headers: { ...cors, 'Content-Type': 'application/json' },
        }
      );
    }

    // Com responseMimeType="application/json" + responseSchema, o texto é JSON válido.
    // Mesmo assim defendemo-nos com try-catch para podermos diagnosticar se cortar.
    let parsed;
    try {
      parsed = JSON.parse(texto);
    } catch (parseError) {
      console.error('JSON inválido recebido do Gemini:', texto);
      console.error('Erro de parse:', parseError);
      return new Response(
        JSON.stringify({
          error:
            'A IA devolveu uma resposta truncada. Tenta com menos ingredientes.',
        }),
        {
          status: 502,
          headers: { ...cors, 'Content-Type': 'application/json' },
        }
      );
    }

    return new Response(JSON.stringify(parsed), {
      status: 200,
      headers: { ...cors, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Erro:', error);
    const mensagem = error instanceof Error ? error.message : 'Erro desconhecido';
    return new Response(JSON.stringify({ error: mensagem }), {
      status: 500,
      headers: { ...cors, 'Content-Type': 'application/json' },
    });
  }
});
