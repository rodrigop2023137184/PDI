// Edge Function: gera uma variação (vegetariana/vegan/sem glúten/menos calorias)
// de uma receita existente.
//
// Runtime: Deno (Supabase Edge Runtime)
// Backend:  Google Gemini API (free tier — sem cartão de crédito necessário)
// Modelo:   gemini-2.5-flash
// Secret:   GEMINI_API_KEY
//
// Entrada: {
//   receita: { nome, ingredientes: [{nome, quantidade}], instrucoes: string[] },
//   tipoVariacao: 'vegetariana' | 'vegan' | 'sem_gluten' | 'menos_calorias'
// }
// Saída:   { receita: { nome, tempo_min, ingredientes, instrucoes, notas } }

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

const SYSTEM_PROMPT = `És um chef que adapta receitas existentes mantendo o espírito original.
Recebes uma receita e um tipo de variação. Geras a versão adaptada.

Tipos de variação:
- vegetariana: substitui carne/peixe por alternativas vegetarianas (ovos e lacticínios permitidos)
- vegan: sem produtos animais (sem ovos, lacticínios, mel)
- sem_gluten: substitui ingredientes com glúten (farinha trigo → farinha sem glúten/amêndoa, etc.)
- menos_calorias: reduz calorias mantendo sabor (substitui ingredientes calóricos por alternativas)

Regras:
- Mantém-te próximo do original — substituições inteligentes, não receita totalmente diferente
- Inclui um campo "notas" explicando as principais alterações em relação ao original
- Cada instrução é uma frase isolada, SEM numerar nem prefixar com "1.", "Passo 1:" ou similar — o cliente é que adiciona a numeração
- Português europeu (não brasileiro)
- Quantidades em medidas práticas`;

const RESPONSE_SCHEMA = {
  type: 'object',
  properties: {
    receita: {
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
        notas: { type: 'string' },
      },
      required: ['nome', 'tempo_min', 'ingredientes', 'instrucoes'],
      propertyOrdering: ['nome', 'tempo_min', 'ingredientes', 'instrucoes', 'notas'],
    },
  },
  required: ['receita'],
  propertyOrdering: ['receita'],
};

type TipoVariacao = 'vegetariana' | 'vegan' | 'sem_gluten' | 'menos_calorias';

interface IngredienteIA {
  nome: string;
  quantidade: string;
}

interface ReceitaEntrada {
  nome: string;
  ingredientes: IngredienteIA[];
  instrucoes: string[];
}

interface Pedido {
  receita: ReceitaEntrada;
  tipoVariacao: TipoVariacao;
}

const TIPOS_VALIDOS: TipoVariacao[] = [
  'vegetariana',
  'vegan',
  'sem_gluten',
  'menos_calorias',
];

Deno.serve(async (req: Request) => {
  const cors = corsHeaders(req);

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
  const rl = checkRateLimit(user.id, 'gerar-variacao');
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
    const { receita, tipoVariacao } = (await req.json()) as Pedido;

    if (!receita || !receita.nome || !Array.isArray(receita.ingredientes)) {
      return new Response(
        JSON.stringify({ error: 'Receita inválida ou incompleta' }),
        {
          status: 400,
          headers: { ...cors, 'Content-Type': 'application/json' },
        }
      );
    }

    if (!TIPOS_VALIDOS.includes(tipoVariacao)) {
      return new Response(
        JSON.stringify({
          error: `Tipo de variação inválido. Valores aceites: ${TIPOS_VALIDOS.join(', ')}`,
        }),
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

    const userMessage = `Receita original:
Nome: ${receita.nome}
Ingredientes: ${receita.ingredientes
      .map((i) => `${i.quantidade} ${i.nome}`)
      .join(', ')}
Instruções:
${receita.instrucoes.map((p, i) => `${i + 1}. ${p}`).join('\n')}

Gera a variação: ${tipoVariacao}`;

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

    let parsed;
    try {
      parsed = JSON.parse(texto);
    } catch (parseError) {
      console.error('JSON inválido recebido do Gemini:', texto);
      console.error('Erro de parse:', parseError);
      return new Response(
        JSON.stringify({
          error: 'A IA devolveu uma resposta truncada. Tenta novamente.',
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
