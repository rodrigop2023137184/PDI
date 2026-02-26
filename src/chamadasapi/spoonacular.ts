const API_KEY = process.env.EXPO_PUBLIC_SPOONACULAR_KEY;
const BASE_URL = "https://api.spoonacular.com";

export const searchRecipes = async (query: string) => {
  const response = await fetch(
    `${BASE_URL}/recipes/complexSearch?query=${query}&apiKey=${API_KEY}&addRecipeNutrition=true`
  );
  const data = await response.json();
  return data.results;
};

export const getRecipeById = async (id: number) => {
  const response = await fetch(
    `${BASE_URL}/recipes/${id}/information?apiKey=${API_KEY}`
  );
  return await response.json();
};