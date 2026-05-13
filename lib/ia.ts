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
// Remove numeração que a IA por vezes adiciona mesmo com instrução no prompt.
// Apanha: "1.", "1)", "1:", "1 -", "Passo 1.", "**1.**", etc. — sempre no início.
// A UI já renderiza o número via index, daí o strip evitar "1. 1. ...".
function limparNumeracao(passo: string): string {
  return passo
    .replace(/^\s*\**\s*(?:passo\s+)?\d+\s*[.\):\-]\s*\**\s*/i, '')
    .trim();
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
    throw new Error(error.message ?? 'Falha ao chamar o servidor de IA.');
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
    throw new Error(error.message ?? 'Falha ao chamar o servidor de IA.');
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
