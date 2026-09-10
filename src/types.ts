export interface RecipeTranslation {
  recipeName: string;
  prepTime: string;
  cookTime: string;
  ingredientsList: string[];
  instructions: string[];
}

export interface Recipe {
  id: string;
  translations: {
    en: RecipeTranslation;
    id: RecipeTranslation;
  };
}
