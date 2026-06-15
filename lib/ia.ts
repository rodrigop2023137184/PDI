// Wrapper sobre as Edge Functions de IA do Supabase.
//
// Arquitetura:
//   App móvel  →  supabase.functions.invoke()  →  Edge Function (Deno)  →  Anthropic API
//
// A API key da Anthropic vive como secret no Supabase, nunca no cliente.
// Os schemas Zod abaixo validam a resposta no cliente como segunda linha
// de defesa contra respostas malformadas da IA.

import { z } from 'zod';
import { supabase } from './supabase';

// ── Helpers ───────────────────────────────────────────────────────────────
// Limpa cada instrução antes de a UI a mostrar.
//
// 1. Normaliza espaços brancos: a IA por vezes devolve quebras de linha
//    embutidas (\n, \r\n) ou múltiplos espaços dentro de uma instrução. Isso
//    causava quebras de linha prematuras (palavras a saltar para baixo com
//    espaço a sobrar) e, no Android, o \r aparecia como um caráter solto
//    (parecia um "R") no fim da frase. Colapsamos tudo num único espaço.
// 2. Remove numeração que a IA por vezes adiciona mesmo com instrução no
//    prompt. Apanha: "1.", "1)", "1:", "1 -", "Passo 1.", "**1.**", etc. —
//    sempre no início. A UI já renderiza o número via index, daí o strip
//    evitar "1. 1. ...".
function limparNumeracao(passo: string): string {
  return passo
    .replace(/\s+/g, ' ')
    .replace(/^\s*\**\s*(?:passo\s+)?\d+\s*[.\):\-]\s*\**\s*/i, '')
    .trim();
}

// Extrai a mensagem de erro real de uma falha do supabase.functions.invoke.
//
// Quando a Edge Function devolve um status non-2xx, o supabase-js cria um
// FunctionsHttpError cuja `.message` é sempre o genérico
// "Edge Function returned a non-2xx status code". A mensagem útil (ex.:
// "Limite de pedidos atingido", "Configuração do servidor incompleta") está
// no corpo da resposta, acessível via `error.context` (um objeto Response).
async function mensagemDeErro(
  error: unknown,
  fallback: string
): Promise<string> {
  const ctx = (error as { context?: unknown })?.context;
  // `context` é um Response clonável quando a função respondeu com corpo.
  if (ctx && typeof (ctx as Response).json === 'function') {
    try {
      const corpo = await (ctx as Response).json();
      if (corpo && typeof corpo === 'object' && 'error' in corpo) {
        return String((corpo as { error: unknown }).error);
      }
    } catch {
      // Corpo não-JSON ou já consumido — cai para a mensagem genérica.
    }
  }
  if (error instanceof Error && error.message) return error.message;
  return fallback;
}

// ── Schemas ───────────────────────────────────────────────────────────────
const IngredienteIASchema = z.object({
  nome: z.string(),
  quantidade: z.string(),
});

const ReceitaIASchema = z.object({
  nome: z.string(),
  tempo_min: z.number(),
  ingredientes: z.array(IngredienteIASchema),
  instrucoes: z.array(z.string().transform(limparNumeracao)),
});

const SugestoesSchema = z.object({
  receitas: z.array(ReceitaIASchema),
});

const VariacaoReceitaSchema = ReceitaIASchema.extend({
  notas: z.string().optional(),
});

const VariacaoSchema = z.object({
  receita: VariacaoReceitaSchema,
});

// ── Tipos exportados ──────────────────────────────────────────────────────
export type IngredienteIA = z.infer<typeof IngredienteIASchema>;
export type ReceitaIA = z.infer<typeof ReceitaIASchema>;
export type VariacaoReceita = z.infer<typeof VariacaoReceitaSchema>;

export type TipoVariacao =
  | 'vegetariana'
  | 'vegan'
  | 'sem_gluten'
  | 'menos_calorias';

// ── API ───────────────────────────────────────────────────────────────────

/**
 * Sugere 1-2 receitas que o utilizador consegue fazer com os ingredientes
 * que tem em casa.
 *
 * @throws Error se a Edge Function falhar ou a resposta for inválida
 */
export async function sugerirReceitas(
  ingredientes: string[]
): Promise<ReceitaIA[]> {
  if (ingredientes.length === 0) {
    throw new Error('Tens de introduzir pelo menos um ingrediente.');
  }

  const { data, error } = await supabase.functions.invoke('sugerir-receitas', {
    body: { ingredientes },
  });

  if (error) {
    throw new Error(await mensagemDeErro(error, 'Falha ao chamar o servidor de IA.'));
  }

  // A função pode devolver { error: "..." } com status 4xx/5xx.
  // O supabase-js só põe `error` em casos de rede/non-2xx, mas defensivamente:
  if (data && typeof data === 'object' && 'error' in data) {
    throw new Error(String((data as { error: unknown }).error));
  }

  const resultado = SugestoesSchema.safeParse(data);
  if (!resultado.success) {
    console.error('Validação Zod falhou:', resultado.error);
    throw new Error('A IA devolveu uma resposta em formato inesperado.');
  }

  return resultado.data.receitas;
}

/**
 * Gera uma variação (vegetariana, vegan, sem glúten, etc.) de uma receita
 * existente.
 *
 * @throws Error se a Edge Function falhar ou a resposta for inválida
 */
export async function gerarVariacao(
  receita: { nome: string; ingredientes: IngredienteIA[]; instrucoes: string[] },
  tipoVariacao: TipoVariacao
): Promise<VariacaoReceita> {
  const { data, error } = await supabase.functions.invoke('gerar-variacao', {
    body: { receita, tipoVariacao },
  });

  if (error) {
    throw new Error(await mensagemDeErro(error, 'Falha ao chamar o servidor de IA.'));
  }

  if (data && typeof data === 'object' && 'error' in data) {
    throw new Error(String((data as { error: unknown }).error));
  }

  const resultado = VariacaoSchema.safeParse(data);
  if (!resultado.success) {
    console.error('Validação Zod falhou:', resultado.error);
    throw new Error('A IA devolveu uma resposta em formato inesperado.');
  }

  return resultado.data.receita;
}

/**
 * Etiqueta human-readable para mostrar na UI.
 */
export const ROTULO_VARIACAO: Record<TipoVariacao, string> = {
  vegetariana: 'Vegetariana',
  vegan: 'Vegan',
  sem_gluten: 'Sem glúten',
  menos_calorias: 'Menos calorias',
};
