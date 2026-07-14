import React from "react";
import { ArrowLeft, Clock, Flame, ShoppingCart, CheckCircle2, AlertTriangle, ChefHat, Plus, Check, Star } from "lucide-react";
import { Recipe, RecipeReview } from "../types";

interface RecipeDetailProps {
  recipe: Recipe;
  onBack: () => void;
  onStartCooking: () => void;
  shoppingList: string[];
  addToShoppingList: (items: string[]) => void;
  userIngredients: string[]; // Combined fridge + pantry ingredients
  reviews?: RecipeReview[];
}

export default function RecipeDetail({
  recipe,
  onBack,
  onStartCooking,
  shoppingList,
  addToShoppingList,
  userIngredients = [],
  reviews = [],
}: RecipeDetailProps) {
  // Normalize user ingredients for robust matching
  const cleanUserIngredients = userIngredients.map((i) => i.toLowerCase().trim());

  // Determine available and missing ingredients dynamically considering combined user ingredients (fridge + pantry)
  const matchDetails = recipe.ingredients.map((ing) => {
    const ingNameLower = ing.name.toLowerCase().trim();
    const inStock =
      !ing.missing ||
      cleanUserIngredients.some(
        (ui) => ingNameLower.includes(ui) || ui.includes(ingNameLower)
      );
    return { ...ing, inStock };
  });

  const availableIngredients = matchDetails.filter((i) => i.inStock);
  const missingIngredients = matchDetails.filter((i) => !i.inStock);

  const handleAddAllMissing = () => {
    const names = missingIngredients.map((i) => i.name.toLowerCase());
    addToShoppingList(names);
  };

  const handleAddSingleMissing = (name: string) => {
    addToShoppingList([name.toLowerCase()]);
  };

  const isAlreadyInShoppingList = (name: string) => {
    return shoppingList.includes(name.toLowerCase());
  };

  // Calculate rating stats
  const totalReviews = reviews.length;
  const avgRating =
    totalReviews > 0
      ? (reviews.reduce((sum, r) => sum + r.rating, 0) / totalReviews).toFixed(1)
      : null;

  return (
    <div id="recipe-detail" className="bg-[#0D0D0D] border border-white/5 rounded-3xl p-6 md:p-8 shadow-2xl space-y-6">
      {/* Header Navigation */}
      <button
        onClick={onBack}
        className="flex items-center gap-2 text-zinc-500 hover:text-white text-sm font-bold transition-colors group cursor-pointer"
      >
        <ArrowLeft className="w-4 h-4 group-hover:-translate-x-0.5 transition-transform" />
        <span>Back to Suggestions</span>
      </button>

      {/* Hero Header */}
      <div className="space-y-3">
        <h1 className="text-2xl md:text-3xl font-extrabold text-white tracking-tight leading-tight">
          {recipe.name}
        </h1>
        <p className="text-zinc-400 text-sm md:text-base leading-relaxed max-w-3xl">
          {recipe.description}
        </p>

        {/* Nutritional, Rating & Time Meta */}
        <div className="flex flex-wrap items-center gap-3 pt-2">
          <span className="flex items-center gap-2 px-3.5 py-1.5 bg-[#141414] text-zinc-300 text-xs font-semibold rounded-xl border border-white/5">
            <Clock className="w-4 h-4 text-lime-400" />
            <span>{recipe.prepTime} Mins Prep/Cook</span>
          </span>
          <span className="flex items-center gap-2 px-3.5 py-1.5 bg-[#141414] text-zinc-300 text-xs font-semibold rounded-xl border border-white/5">
            <Flame className="w-4 h-4 text-amber-400" />
            <span>{recipe.calories} kcal Per Serving</span>
          </span>
          <span className="flex items-center gap-2 px-3.5 py-1.5 bg-[#141414] text-zinc-300 text-xs font-semibold rounded-xl border border-white/5">
            <ChefHat className="w-4 h-4 text-lime-400" />
            <span>{recipe.difficulty} Level</span>
          </span>
          {avgRating && (
            <span className="flex items-center gap-1.5 px-3.5 py-1.5 bg-[#141414] text-zinc-300 text-xs font-bold rounded-xl border border-white/5 text-amber-400">
              <Star className="w-4 h-4 fill-amber-400" />
              <span>{avgRating} ({totalReviews} Reviews)</span>
            </span>
          )}
        </div>
      </div>

      <hr className="border-white/5" />

      {/* Main Grid: Ingredients & Steps Outline */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Ingredients Column */}
        <div className="lg:col-span-5 space-y-6">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-white text-base">Ingredients Needed</h3>
            {missingIngredients.length > 0 && (
              <button
                onClick={handleAddAllMissing}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-extrabold bg-[#141414] text-lime-400 hover:text-lime-300 hover:bg-white/5 border border-white/10 rounded-xl transition-all cursor-pointer"
              >
                <ShoppingCart className="w-3.5 h-3.5" />
                <span>Add Missing to List</span>
              </button>
            )}
          </div>

          {/* Available Ingredients */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold text-lime-400 tracking-wider uppercase flex items-center gap-1.5 font-mono">
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>In Stock / In Pantry ({availableIngredients.length})</span>
            </h4>
            
            <div className="bg-[#141414]/40 border border-white/5 rounded-2xl p-4 space-y-2.5">
              {availableIngredients.length === 0 ? (
                <p className="text-xs text-zinc-500 italic">No available ingredients from your photo or pantry are required for this recipe.</p>
              ) : (
                availableIngredients.map((ing) => (
                  <div key={ing.name} className="flex items-center justify-between text-sm">
                    <span className="capitalize text-lime-100 font-medium">{ing.name}</span>
                    <span className="text-lime-400 text-xs bg-lime-400/10 border border-lime-400/20 px-2.5 py-0.5 rounded-lg font-mono">{ing.amount}</span>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Missing Ingredients */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold text-amber-400 tracking-wider uppercase flex items-center gap-1.5 font-mono">
              <AlertTriangle className="w-3.5 h-3.5" />
              <span>Missing Essentials ({missingIngredients.length})</span>
            </h4>

            <div className="bg-amber-400/5 border border-amber-400/10 rounded-2xl p-4 space-y-2.5">
              {missingIngredients.length === 0 ? (
                <p className="text-xs text-lime-400 font-bold flex items-center gap-1.5">
                  <Check className="w-4 h-4 stroke-[3]" />
                  <span>You have all ingredients in stock!</span>
                </p>
              ) : (
                missingIngredients.map((ing) => {
                  const added = isAlreadyInShoppingList(ing.name);
                  return (
                    <div key={ing.name} className="flex items-center justify-between text-sm group/item">
                      <div className="flex flex-col">
                        <span className="capitalize text-zinc-300 font-semibold">{ing.name}</span>
                        {ing.essential && (
                          <span className="text-[10px] text-amber-400 font-bold tracking-wider uppercase font-mono mt-0.5">Essential</span>
                        )}
                      </div>
                      
                      <div className="flex items-center gap-2">
                        <span className="text-zinc-400 text-xs bg-[#141414] border border-white/5 px-2.5 py-0.5 rounded-lg font-mono">{ing.amount}</span>
                        <button
                          onClick={() => handleAddSingleMissing(ing.name)}
                          disabled={added}
                          className={`p-1.5 rounded-lg border transition-all cursor-pointer ${
                            added
                              ? "bg-lime-400/10 border-lime-400/30 text-lime-400"
                              : "bg-zinc-900 border-white/10 text-zinc-400 hover:border-lime-400/40 hover:bg-lime-400/10 hover:text-lime-400"
                          }`}
                          title={added ? "Already in Shopping List" : "Add to Shopping List"}
                        >
                          {added ? <Check className="w-3.5 h-3.5 stroke-[3]" /> : <Plus className="w-3.5 h-3.5" />}
                        </button>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>

        {/* Steps Column & Call to Action */}
        <div className="lg:col-span-7 flex flex-col justify-between gap-6">
          <div className="space-y-4">
            <h3 className="font-bold text-white text-base">Steps Overview</h3>
            <div className="space-y-4">
              {recipe.steps.map((step, idx) => (
                <div key={idx} className="flex gap-4 items-start">
                  <span className="flex-shrink-0 w-6 h-6 flex items-center justify-center bg-zinc-900 border border-white/10 text-lime-400 text-xs font-bold rounded-full mt-0.5 font-mono">
                    {idx + 1}
                  </span>
                  <p className="text-sm text-zinc-300 leading-relaxed pt-0.5">{step}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Action Call */}
          <div className="bg-lime-400 text-black rounded-2xl p-6 flex flex-col sm:flex-row items-center justify-between gap-4 mt-4 shadow-[0_0_20px_rgba(163,230,53,0.15)]">
            <div className="space-y-1 text-center sm:text-left">
              <h4 className="font-extrabold text-black text-sm uppercase tracking-wider font-mono">Ready to cook?</h4>
              <p className="text-xs text-black/80 font-medium leading-relaxed">
                Start our smart, read-aloud cooking companion to guide you hands-free step-by-step.
              </p>
            </div>
            
            <button
              onClick={onStartCooking}
              className="w-full sm:w-auto py-3.5 px-6 bg-black hover:bg-zinc-900 text-lime-400 font-extrabold text-xs uppercase tracking-widest rounded-xl flex items-center justify-center gap-2 shadow-xl transition-all active:scale-[0.98] cursor-pointer"
            >
              <ChefHat className="w-4.5 h-4.5" />
              <span>Start Interactive Cooking</span>
            </button>
          </div>
        </div>
      </div>

      {/* Ratings & Reviews Feed */}
      <hr className="border-white/5" />
      <div className="space-y-4">
        <h3 className="font-bold text-white text-base">Community Reviews</h3>
        {reviews.length === 0 ? (
          <div className="py-8 text-center bg-[#141414]/30 border border-white/5 rounded-2xl">
            <p className="text-sm text-zinc-500 italic">No reviews yet. Be the first to complete this recipe and leave a rating!</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {reviews.map((rev, idx) => (
              <div key={idx} className="bg-[#141414] border border-white/5 rounded-2xl p-4 space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-0.5">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <Star
                        key={i}
                        className={`w-3.5 h-3.5 ${
                          i < rev.rating ? "fill-amber-400 text-amber-400" : "text-zinc-700"
                        }`}
                      />
                    ))}
                  </div>
                  <span className="text-[10px] text-zinc-500 font-mono">{rev.date}</span>
                </div>
                <p className="text-xs text-zinc-300 leading-relaxed italic">
                  "{rev.comment || "No written review comments left."}"
                </p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
