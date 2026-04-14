export interface User {
  id: string;
  display_name: string | null;
  created_at: string;
  updated_at: string;
}
export interface Instrucao {
  step: number;
  text: string;
}

// Tabela ingredientes
export interface Ingrediente {
  id: string;
  nome: string;
  imagem_url: string | null;
}

// Item do JSONB dentro de receitas.ingredientes
export interface ReceitaIngrediente {
  ingrediente_id: string;
  quantity: string;
  ingrediente?: Ingrediente; // join opcional
}

// Atualizar Receita
export interface Receita {
  id: string;
  nome: string;
  imagem_url: string | null;
  prep_tempo_min: number;
  dieta_type: 'vegetariana' | 'vegan' | 'sem_gluten' | 'omnivora' | null;
  ingredientes: ReceitaIngrediente[]; // ← atualizado
  instrucoes: Instrucao[];
  calorias: number | null;
  proteinas_g: number | null;
  carbs_g: number | null;
  fats_g: number | null;
  data_criacao: string;
  data_update: string;
}

export interface UserFavorito {
  user_id: string;
  receitas_id: string;
  saved_at: string;
  receita?: Receita; // join opcional
}