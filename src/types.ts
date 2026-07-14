export interface RecipeIngredient {
  name: string;
  amount: string;
  essential: boolean;
  missing?: boolean;
}

export interface Recipe {
  id: string;
  name: string;
  description: string;
  difficulty: "Easy" | "Medium" | "Hard";
  prepTime: number; // in minutes
  calories: number;
  dietaryTags: string[];
  ingredients: RecipeIngredient[];
  steps: string[];
}

export interface FridgeAnalysisResult {
  ingredients: string[];
  recipes: Recipe[];
}

export interface PantryItem {
  id: string;
  name: string;
  quantity: string;
}

export interface RecipeReview {
  rating: number; // 1-5
  comment: string;
  date: string;
}

export const DIETARY_RESTRICTIONS = [
  "Vegetarian",
  "Vegan",
  "Keto",
  "Gluten-Free",
  "Dairy-Free",
  "Low-Carb"
];

