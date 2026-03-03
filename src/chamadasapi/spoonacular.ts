const API_KEY = "d451424625e3479192ee09e73a42b6dd";
console.log('API Key:', API_KEY);
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
export const getRandomRecipes = async (number: number = 5) => {
  const response = await fetch(
    `${BASE_URL}/recipes/random?number=${number}&apiKey=${API_KEY}`
  );
  const data = await response.json();
  console.log('Resposta da API:', data);  
  return data.recipes;
};

export const getRecipesByIngredients = async (ingredients: string[]) => {
  const response = await fetch(
    `${BASE_URL}/recipes/findByIngredients?ingredients=${ingredients.join(',')}&apiKey=${API_KEY}`
  );
  return await response.json();
};

export const getRecipeNutrition = async (id: number) => {
  const response = await fetch(
    `${BASE_URL}/recipes/${id}/nutritionWidget.json?apiKey=${API_KEY}`
  );
  return await response.json();
};

export const getRecipeInstructions = async (id: number) => {
  const response = await fetch(
    `${BASE_URL}/recipes/${id}/analyzedInstructions?apiKey=${API_KEY}`
  );
  return await response.json();
};

export const getRecipeSummary = async (id: number) => {
  const response = await fetch(
    `${BASE_URL}/recipes/${id}/summary?apiKey=${API_KEY}`
  );
  return await response.json();
};

export const getRecipeInformation = async (id: number) => {
  const response = await fetch(
    `${BASE_URL}/recipes/${id}/information?apiKey=${API_KEY}`
  );
  return await response.json();
};


