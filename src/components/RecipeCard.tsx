import React from "react";
import { Clock, Flame, ChefHat, Check, AlertTriangle, Star } from "lucide-react";
import { Recipe, RecipeReview } from "../types";

interface RecipeCardProps {
  key?: string;
  recipe: Recipe;
  onSelect: (recipe: Recipe) => void;
  userIngredients: string[];
  reviews?: RecipeReview[];
}

export default function RecipeCard({ recipe, onSelect, userIngredients, reviews = [] }: RecipeCardProps) {
  // Normalize user ingredients for robust case-insensitive matching
  const cleanUserIngredients = userIngredients.map((i) => i.toLowerCase().trim());

  // Determine if ingredient is in stock dynamically
  const matchDetails = recipe.ingredients.map((ing) => {
    const ingNameLower = ing.name.toLowerCase().trim();
    const inStock =
      !ing.missing ||
      cleanUserIngredients.some(
        (ui) => ingNameLower.includes(ui) || ui.includes(ingNameLower)
      );
    return { ...ing, inStock };
  });

  const matchedCount = matchDetails.filter((i) => i.inStock).length;
  const totalCount = recipe.ingredients.length;
  const missingCount = totalCount - matchedCount;
  const matchPercentage = totalCount > 0 ? Math.round((matchedCount / totalCount) * 100) : 0;

  const difficultyColors = {
    Easy: "bg-lime-400/10 text-lime-400 border-lime-400/20",
    Medium: "bg-amber-400/10 text-amber-400 border-amber-400/20",
    Hard: "bg-rose-400/10 text-rose-400 border-rose-400/20",
  };

  // Calculate rating stats
  const totalReviews = reviews.length;
  const avgRating =
    totalReviews > 0
      ? Number((reviews.reduce((sum, r) => sum + r.rating, 0) / totalReviews).toFixed(1))
      : 0;

  return (
    <div
      id={`recipe-card-${recipe.id}`}
      className="bg-[#0D0D0D] border border-white/5 rounded-3xl p-6 shadow-2xl hover:border-white/10 hover:shadow-emerald-500/5 transition-all flex flex-col justify-between gap-5 group"
    >
      <div>
        {/* Header Badges */}
        <div className="flex flex-wrap items-center justify-between gap-2 mb-3.5">
          <span
            className={`px-3 py-1 rounded-full text-[11px] font-bold border tracking-wider uppercase ${
              difficultyColors[recipe.difficulty] || "bg-white/5 text-zinc-300 border-white/5"
            }`}
          >
            {recipe.difficulty}
          </span>
          <div className="flex items-center gap-3 text-zinc-500 text-xs font-semibold font-mono">
            <span className="flex items-center gap-1">
              <Clock className="w-3.5 h-3.5 text-zinc-500" />
              <span>{recipe.prepTime}m</span>
            </span>
            <span className="flex items-center gap-1">
              <Flame className="w-3.5 h-3.5 text-zinc-500" />
              <span>{recipe.calories} kcal</span>
            </span>
          </div>
        </div>

        {/* Title */}
        <h3 className="text-lg font-bold text-white leading-snug group-hover:text-lime-400 transition-colors">
          {recipe.name}
        </h3>

        {/* Rating and Reviews Display */}
        <div className="flex items-center gap-1.5 mt-1.5">
          {totalReviews > 0 ? (
            <>
              <div className="flex items-center text-amber-400">
                <Star className="w-4 h-4 fill-amber-400 stroke-[2]" />
                <span className="text-xs font-bold text-zinc-200 ml-1">{avgRating}</span>
              </div>
              <span className="text-zinc-600 text-xs">•</span>
              <span className="text-zinc-400 text-xs font-medium">
                {totalReviews} {totalReviews === 1 ? "review" : "reviews"}
              </span>
            </>
          ) : (
            <div className="flex items-center text-zinc-600">
              <Star className="w-3.5 h-3.5 stroke-[2]" />
              <span className="text-xs text-zinc-500 ml-1 font-medium">No reviews yet</span>
            </div>
          )}
        </div>
        
        {/* Description */}
        <p className="text-sm text-zinc-400 mt-2 line-clamp-2 leading-relaxed">
          {recipe.description}
        </p>

        {/* Dietary tags */}
        {recipe.dietaryTags.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mt-4">
            {recipe.dietaryTags.map((tag) => (
              <span
                key={tag}
                className="px-2.5 py-0.5 bg-[#141414] text-zinc-400 text-xs font-semibold rounded-md border border-white/5"
              >
                {tag}
              </span>
            ))}
          </div>
        )}
      </div>

      <div className="space-y-4">
        {/* Match rating */}
        <div className="bg-[#141414] border border-white/5 rounded-2xl p-3.5 space-y-2">
          <div className="flex items-center justify-between text-xs font-semibold">
            <span className="text-zinc-400">Ingredient Match</span>
            <span className="text-lime-400 font-mono">{matchPercentage}%</span>
          </div>
          
          <div className="w-full bg-zinc-800 rounded-full h-1.5 overflow-hidden">
            <div
              className="bg-lime-400 h-1.5 rounded-full transition-all"
              style={{ width: `${matchPercentage}%` }}
            ></div>
          </div>

          <div className="flex items-center justify-between text-[11px] font-medium">
            <span className="flex items-center gap-1 text-lime-400">
              <Check className="w-3 h-3 stroke-[3]" />
              <span>{matchedCount} in stock</span>
            </span>
            {missingCount > 0 ? (
              <span className="flex items-center gap-1 text-amber-400">
                <AlertTriangle className="w-3 h-3 stroke-[2.5]" />
                <span>{missingCount} missing</span>
              </span>
            ) : (
              <span className="text-lime-400 font-bold">Ready to cook!</span>
            )}
          </div>
        </div>

        {/* Action Button */}
        <button
          onClick={() => onSelect(recipe)}
          className="w-full py-3 px-4 bg-zinc-900 hover:bg-[#1a1a1a] border border-white/10 text-white font-bold text-sm rounded-2xl flex items-center justify-center gap-2 transition-all group-hover:bg-lime-400 group-hover:text-black group-hover:border-transparent group-hover:shadow-[0_0_15px_rgba(163,230,53,0.3)] cursor-pointer"
        >
          <ChefHat className="w-4 h-4" />
          <span>View Recipe & Steps</span>
        </button>
      </div>
    </div>
  );
}
