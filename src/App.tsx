import React, { useState, useEffect } from "react";
import { Camera, ShoppingCart, RefreshCw, AlertCircle, ChefHat, Sparkles, BookOpen, Package, Star, X } from "lucide-react";
import SidebarFilters from "./components/SidebarFilters";
import FridgeUploader from "./components/FridgeUploader";
import RecipeCard from "./components/RecipeCard";
import RecipeDetail from "./components/RecipeDetail";
import CookingMode from "./components/CookingMode";
import ShoppingList from "./components/ShoppingList";
import PantryManager from "./components/PantryManager";
import { Recipe, FridgeAnalysisResult, PantryItem, RecipeReview } from "./types";

export default function App() {
  // Global States
  const [detectedIngredients, setDetectedIngredients] = useState<string[]>([]);
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [shoppingList, setShoppingList] = useState<string[]>(() => {
    const saved = localStorage.getItem("smart-fridge-shopping-list");
    return saved ? JSON.parse(saved) : [];
  });
  const [dietaryFilters, setDietaryFilters] = useState<string[]>(() => {
    const saved = localStorage.getItem("smart-fridge-dietary-filters");
    return saved ? JSON.parse(saved) : [];
  });

  const [pantryItems, setPantryItems] = useState<PantryItem[]>(() => {
    const saved = localStorage.getItem("smart-fridge-pantry");
    return saved ? JSON.parse(saved) : [
      { id: "1", name: "Flour", quantity: "1 kg" },
      { id: "2", name: "Sugar", quantity: "500g" },
      { id: "3", name: "Olive Oil", quantity: "1 bottle" },
      { id: "4", name: "Salt", quantity: "1 pack" },
      { id: "5", name: "Black Pepper", quantity: "1 jar" }
    ];
  });

  const [recipeReviews, setRecipeReviews] = useState<Record<string, RecipeReview[]>>(() => {
    const saved = localStorage.getItem("smart-fridge-reviews");
    return saved ? JSON.parse(saved) : {};
  });

  const [currentTab, setCurrentTab] = useState<"fridge" | "pantry" | "shopping">("fridge");
  const [activeRecipe, setActiveRecipe] = useState<Recipe | null>(null);
  const [isCooking, setIsCooking] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Sorting & Filtering by Rating states
  const [sortBy, setSortBy] = useState<"match" | "rating" | "time" | "calories">("match");
  const [minRating, setMinRating] = useState<number>(0);

  // States for the 5-star Rating Prompt overlay modal
  const [reviewingRecipe, setReviewingRecipe] = useState<Recipe | null>(null);
  const [userRating, setUserRating] = useState<number>(5);
  const [userComment, setUserComment] = useState<string>("");
  const [hoverRating, setHoverRating] = useState<number | null>(null);

  // Sync states to LocalStorage
  useEffect(() => {
    localStorage.setItem("smart-fridge-shopping-list", JSON.stringify(shoppingList));
  }, [shoppingList]);

  useEffect(() => {
    localStorage.setItem("smart-fridge-dietary-filters", JSON.stringify(dietaryFilters));
  }, [dietaryFilters]);

  useEffect(() => {
    localStorage.setItem("smart-fridge-pantry", JSON.stringify(pantryItems));
  }, [pantryItems]);

  useEffect(() => {
    localStorage.setItem("smart-fridge-reviews", JSON.stringify(recipeReviews));
  }, [recipeReviews]);

  // Handle Fridge Analysis
  const handleAnalyzeFridge = async (payload: { image?: string; sampleKey?: string }) => {
    setIsAnalyzing(true);
    setError(null);
    setActiveRecipe(null);
    try {
      const response = await fetch("/api/analyze-fridge", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...payload,
          pantry: pantryItems, // Pass pantry items so AI can suggest recipes considering them
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to analyze the fridge image.");
      }

      const data: FridgeAnalysisResult = await response.json();
      setDetectedIngredients(data.ingredients);
      setRecipes(data.recipes);
    } catch (err: any) {
      console.error(err);
      setError(err.message || "An error occurred while connecting to the backend.");
    } finally {
      setIsAnalyzing(false);
    }
  };

  // Handle manual Refresh of Recipes from Sidebar
  const handleRefreshRecipes = async () => {
    setIsRefreshing(true);
    setError(null);
    try {
      const response = await fetch("/api/generate-recipes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ingredients: detectedIngredients,
          dietaryFilters: dietaryFilters,
          pantry: pantryItems, // Pass pantry items to guide suggestion logic
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to generate customized recipes.");
      }

      const data = await response.json();
      setRecipes(data.recipes);
      // If activeRecipe is currently open, update its references if it is part of the new list
      if (activeRecipe) {
        const updated = data.recipes.find((r: Recipe) => r.id === activeRecipe.id);
        if (updated) {
          setActiveRecipe(updated);
        }
      }
    } catch (err: any) {
      console.error(err);
      setError(err.message || "Failed to refresh recipes.");
    } finally {
      setIsRefreshing(false);
    }
  };

  // Calculate average rating helper
  const getAverageRating = (recipeId: string) => {
    const reviews = recipeReviews[recipeId] || [];
    if (reviews.length === 0) return 0;
    return reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length;
  };

  // Combined ingredient list for dynamic stock checking in client cards
  const combinedIngredients = [
    ...detectedIngredients,
    ...pantryItems.map((item) => item.name.toLowerCase().trim()),
  ];

  // Filter and sort recipes locally
  const filteredRecipes = recipes
    .filter((recipe) => {
      // 1. Dietary filters
      if (dietaryFilters.length > 0) {
        const hasAllTags = dietaryFilters.every((filter) =>
          recipe.dietaryTags.some((tag) => tag.toLowerCase() === filter.toLowerCase())
        );
        if (!hasAllTags) return false;
      }

      // 2. Minimum Rating filter
      if (minRating > 0) {
        const avg = getAverageRating(recipe.id);
        if (avg < minRating) return false;
      }

      return true;
    })
    .sort((a, b) => {
      if (sortBy === "rating") {
        return getAverageRating(b.id) - getAverageRating(a.id);
      }
      if (sortBy === "time") {
        return a.prepTime - b.prepTime;
      }
      if (sortBy === "calories") {
        return a.calories - b.calories;
      }

      // Default: Match percentage descending
      const getMatchPercentage = (r: Recipe) => {
        const total = r.ingredients.length;
        if (total === 0) return 0;
        const matched = r.ingredients.filter((ing) => {
          const ingName = ing.name.toLowerCase().trim();
          return (
            !ing.missing ||
            combinedIngredients.some((ui) => ingName.includes(ui) || ui.includes(ingName))
          );
        }).length;
        return matched / total;
      };
      return getMatchPercentage(b) - getMatchPercentage(a);
    });

  const toggleDietaryFilter = (filter: string) => {
    setDietaryFilters((prev) =>
      prev.includes(filter) ? prev.filter((f) => f !== filter) : [...prev, filter]
    );
  };

  // Add items to Shopping List
  const handleAddToShoppingList = (items: string[]) => {
    setShoppingList((prev) => {
      const updated = [...prev];
      items.forEach((item) => {
        const clean = item.trim().toLowerCase();
        if (clean && !updated.includes(clean)) {
          updated.push(clean);
        }
      });
      return updated;
    });
  };

  // Triggered when step-by-step cooking completes
  const handleCookingComplete = (recipe: Recipe) => {
    setIsCooking(false);
    setReviewingRecipe(recipe);
  };

  // Handle submitting review rating
  const handleSubmitReview = () => {
    if (!reviewingRecipe) return;

    const newReview: RecipeReview = {
      rating: userRating,
      comment: userComment.trim(),
      date: new Date().toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
      }),
    };

    setRecipeReviews((prev) => {
      const recipeId = reviewingRecipe.id;
      const existing = prev[recipeId] || [];
      return {
        ...prev,
        [recipeId]: [newReview, ...existing],
      };
    });

    setReviewingRecipe(null);
    setUserRating(5);
    setUserComment("");
  };

  return (
    <div className="min-h-screen bg-[#0A0A0A] text-zinc-100 flex flex-col antialiased font-sans pb-16">
      {/* Navigation Topbar */}
      <header className="sticky top-0 z-40 bg-[#0A0A0A]/85 backdrop-blur-md border-b border-white/5">
        <div className="max-w-7xl mx-auto px-4 md:px-8 py-4 flex flex-col sm:flex-row items-center justify-between gap-4">
          {/* Logo */}
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-lime-400 text-black rounded-xl shadow-[0_0_15px_rgba(163,230,53,0.3)] flex items-center justify-center">
              <ChefHat className="w-5.5 h-5.5 stroke-[2.5]" />
            </div>
            <div>
              <span className="text-[10px] font-bold text-lime-400 uppercase tracking-widest block leading-none font-mono">Smart Fridge</span>
              <h1 className="text-lg font-extrabold text-white tracking-tight leading-none mt-1 font-mono">KULINAR AI</h1>
            </div>
          </div>

          {/* Tab Selection Controls */}
          <div className="flex items-center gap-1 bg-zinc-900 border border-white/5 p-1 rounded-2xl w-full sm:w-auto overflow-x-auto">
            <button
              onClick={() => {
                setCurrentTab("fridge");
                setActiveRecipe(null);
              }}
              className={`flex-1 sm:flex-initial flex items-center justify-center gap-1.5 px-4 py-2 text-xs font-bold rounded-xl transition-all cursor-pointer whitespace-nowrap ${
                currentTab === "fridge"
                  ? "bg-lime-400 text-black shadow-md"
                  : "text-zinc-400 hover:text-white"
              }`}
            >
              <Camera className="w-3.5 h-3.5" />
              <span>Fridge Scanner</span>
            </button>
            <button
              onClick={() => {
                setCurrentTab("pantry");
                setActiveRecipe(null);
              }}
              className={`flex-1 sm:flex-initial flex items-center justify-center gap-1.5 px-4 py-2 text-xs font-bold rounded-xl transition-all cursor-pointer whitespace-nowrap ${
                currentTab === "pantry"
                  ? "bg-lime-400 text-black shadow-md"
                  : "text-zinc-400 hover:text-white"
              }`}
            >
              <Package className="w-3.5 h-3.5" />
              <span>Pantry Staples</span>
            </button>
            <button
              onClick={() => {
                setCurrentTab("shopping");
                setActiveRecipe(null);
              }}
              className={`relative flex-1 sm:flex-initial flex items-center justify-center gap-1.5 px-4 py-2 text-xs font-bold rounded-xl transition-all cursor-pointer whitespace-nowrap ${
                currentTab === "shopping"
                  ? "bg-lime-400 text-black shadow-md"
                  : "text-zinc-400 hover:text-white"
              }`}
            >
              <ShoppingCart className="w-3.5 h-3.5" />
              <span>Shopping List</span>
              {shoppingList.length > 0 && (
                <span className="absolute -top-1 -right-1 w-5 h-5 flex items-center justify-center bg-rose-600 text-white font-extrabold text-[10px] rounded-full shadow-[0_0_10px_rgba(225,29,72,0.5)] animate-pulse">
                  {shoppingList.length}
                </span>
              )}
            </button>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="max-w-7xl mx-auto px-4 md:px-8 py-8 flex-1 w-full flex flex-col gap-8">
        
        {/* Error Alert Display */}
        {error && (
          <div className="bg-rose-950/20 border border-rose-900/40 rounded-2xl p-4 flex items-start gap-3 text-rose-200">
            <AlertCircle className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />
            <div className="space-y-1">
              <h4 className="font-bold text-sm">Action Required</h4>
              <p className="text-xs text-rose-300 font-medium leading-relaxed">{error}</p>
            </div>
          </div>
        )}

        {currentTab === "fridge" ? (
          <div className="flex flex-col lg:flex-row gap-8 items-start">
            
            {/* Sidebar Filters */}
            <SidebarFilters
              detectedIngredients={detectedIngredients}
              setDetectedIngredients={setDetectedIngredients}
              selectedFilters={dietaryFilters}
              toggleFilter={toggleDietaryFilter}
              onRefreshRecipes={handleRefreshRecipes}
              isRefreshing={isRefreshing}
            />

            {/* Main Stage Content */}
            <div className="flex-1 w-full space-y-8">
              
              {/* Active recipe details or Scanner */}
              {activeRecipe ? (
                <RecipeDetail
                  recipe={activeRecipe}
                  onBack={() => setActiveRecipe(null)}
                  onStartCooking={() => setIsCooking(true)}
                  shoppingList={shoppingList}
                  addToShoppingList={handleAddToShoppingList}
                  userIngredients={combinedIngredients}
                  reviews={recipeReviews[activeRecipe.id] || []}
                />
              ) : (
                <>
                  {/* Image analysis dropzone */}
                  <FridgeUploader onAnalyze={handleAnalyzeFridge} isAnalyzing={isAnalyzing} />

                  {/* Recipes suggestion list */}
                  {recipes.length > 0 && (
                    <div className="space-y-5">
                      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-white/5 pb-4">
                        <div className="flex items-center gap-2">
                          <BookOpen className="w-5 h-5 text-lime-400" />
                          <h3 className="text-lg font-extrabold text-white">
                            Suggested Recipes for You
                          </h3>
                        </div>

                        {/* Sorting and Filtering parameters */}
                        <div className="flex flex-wrap items-center gap-3 text-xs font-bold text-zinc-400">
                          <div className="flex items-center gap-1.5">
                            <span>Sort:</span>
                            <select
                              value={sortBy}
                              onChange={(e) => setSortBy(e.target.value as any)}
                              className="bg-[#141414] border border-white/10 rounded-xl py-1.5 px-3 text-zinc-200 outline-none cursor-pointer hover:border-white/20 hover:text-white transition-all font-mono"
                            >
                              <option value="match">Highest Match %</option>
                              <option value="rating">User Rating</option>
                              <option value="time">Fastest Cooking</option>
                              <option value="calories">Lowest Calorie</option>
                            </select>
                          </div>

                          <div className="flex items-center gap-1.5">
                            <span>Rating:</span>
                            <select
                              value={minRating}
                              onChange={(e) => setMinRating(Number(e.target.value))}
                              className="bg-[#141414] border border-white/10 rounded-xl py-1.5 px-3 text-zinc-200 outline-none cursor-pointer hover:border-white/20 hover:text-white transition-all font-mono"
                            >
                              <option value={0}>All Ratings</option>
                              <option value={4}>★ 4.0+ Stars</option>
                              <option value={3}>★ 3.0+ Stars</option>
                            </select>
                          </div>
                        </div>
                      </div>

                      {filteredRecipes.length === 0 ? (
                        <div className="bg-amber-400/5 border border-amber-400/20 rounded-2xl p-8 text-center flex flex-col items-center justify-center gap-3">
                          <div className="p-3 bg-amber-400/10 text-amber-400 rounded-full">
                            <AlertCircle className="w-6 h-6" />
                          </div>
                          <div>
                            <h4 className="font-bold text-white text-sm">No match satisfies criteria</h4>
                            <p className="text-xs text-zinc-400 mt-1 max-w-sm leading-relaxed">
                              No recipes in the current view match your filter selection. Try changing the sorting, clearing dietary checks, or click <strong>"Update & Suggest Recipes"</strong> in the sidebar.
                            </p>
                          </div>
                        </div>
                      ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          {filteredRecipes.map((recipe) => (
                            <RecipeCard
                              key={recipe.id}
                              recipe={recipe}
                              onSelect={setActiveRecipe}
                              userIngredients={combinedIngredients}
                              reviews={recipeReviews[recipe.id] || []}
                            />
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        ) : currentTab === "pantry" ? (
          <PantryManager pantryItems={pantryItems} setPantryItems={setPantryItems} />
        ) : (
          /* Shopping List Tab */
          <ShoppingList shoppingList={shoppingList} setShoppingList={setShoppingList} />
        )}
      </main>

      {/* Full-Screen Step-by-Step Cooking Modal */}
      {isCooking && activeRecipe && (
        <CookingMode
          recipe={activeRecipe}
          onClose={() => setIsCooking(false)}
          onComplete={handleCookingComplete}
        />
      )}

      {/* 5-Star Recipe Completion Rating Prompt Overlay Modal */}
      {reviewingRecipe && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-md p-4 animate-fade-in">
          <div className="bg-[#0D0D0D] border border-white/10 rounded-3xl p-6 md:p-8 max-w-md w-full shadow-[0_0_50px_rgba(163,230,53,0.1)] space-y-6 relative">
            <button
              onClick={() => setReviewingRecipe(null)}
              className="absolute top-4 right-4 p-1.5 text-zinc-500 hover:text-white bg-[#141414] hover:bg-white/5 rounded-full transition-all"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="text-center space-y-2">
              <div className="mx-auto w-12 h-12 bg-lime-400/10 text-lime-400 rounded-full flex items-center justify-center border border-lime-400/20">
                <ChefHat className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-extrabold text-white">How was it?</h3>
              <p className="text-xs text-zinc-400 max-w-xs mx-auto leading-relaxed">
                Congratulations on cooking <strong>{reviewingRecipe.name}</strong>! Rate your experience and leave a brief review.
              </p>
            </div>

            {/* Interactive Stars */}
            <div className="flex justify-center items-center gap-2">
              {[1, 2, 3, 4, 5].map((starValue) => {
                const isActive = hoverRating !== null ? starValue <= hoverRating : starValue <= userRating;
                return (
                  <button
                    key={starValue}
                    type="button"
                    onClick={() => setUserRating(starValue)}
                    onMouseEnter={() => setHoverRating(starValue)}
                    onMouseLeave={() => setHoverRating(null)}
                    className="p-1 focus:outline-none transition-all hover:scale-110 cursor-pointer"
                  >
                    <Star
                      className={`w-9 h-9 transition-all ${
                        isActive
                          ? "fill-amber-400 text-amber-400 filter drop-shadow-[0_0_8px_rgba(251,191,36,0.3)]"
                          : "text-zinc-700"
                      }`}
                    />
                  </button>
                );
              })}
            </div>

            {/* Comment Field */}
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest font-mono">
                Short Review (Optional)
              </label>
              <textarea
                placeholder="Delicious! Highly recommend adding some freshly cracked black pepper at the end..."
                value={userComment}
                onChange={(e) => setUserComment(e.target.value)}
                maxLength={200}
                rows={3}
                className="w-full px-4 py-3 text-sm bg-[#141414] border border-white/5 rounded-xl focus:outline-none focus:ring-2 focus:ring-lime-400/20 focus:border-lime-400 text-zinc-200 placeholder-zinc-600 transition-all resize-none"
              />
              <div className="text-right text-[10px] text-zinc-600 font-medium">
                {userComment.length}/200 chars
              </div>
            </div>

            {/* Submit Actions */}
            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => setReviewingRecipe(null)}
                className="flex-1 py-3 bg-[#141414] hover:bg-white/5 border border-white/5 text-zinc-400 hover:text-white font-bold text-sm rounded-xl transition-all cursor-pointer"
              >
                Skip
              </button>
              <button
                type="button"
                onClick={handleSubmitReview}
                className="flex-1 py-3 bg-lime-400 hover:bg-lime-300 text-black font-extrabold text-sm rounded-xl transition-all shadow-[0_0_15px_rgba(163,230,53,0.2)] active:scale-[0.98] cursor-pointer"
              >
                Submit Review
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
