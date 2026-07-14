import React, { useState } from "react";
import { Plus, X, RotateCw, Filter, Sparkles } from "lucide-react";
import { DIETARY_RESTRICTIONS } from "../types";

interface SidebarFiltersProps {
  detectedIngredients: string[];
  setDetectedIngredients: React.Dispatch<React.SetStateAction<string[]>>;
  selectedFilters: string[];
  toggleFilter: (filter: string) => void;
  onRefreshRecipes: () => void;
  isRefreshing: boolean;
}

export default function SidebarFilters({
  detectedIngredients,
  setDetectedIngredients,
  selectedFilters,
  toggleFilter,
  onRefreshRecipes,
  isRefreshing,
}: SidebarFiltersProps) {
  const [newIngredient, setNewIngredient] = useState("");

  const handleAddIngredient = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = newIngredient.trim().toLowerCase();
    if (trimmed && !detectedIngredients.includes(trimmed)) {
      setDetectedIngredients((prev) => [...prev, trimmed]);
      setNewIngredient("");
    }
  };

  const handleRemoveIngredient = (ingredient: string) => {
    setDetectedIngredients((prev) => prev.filter((item) => item !== ingredient));
  };

  return (
    <div id="sidebar-filters" className="w-full lg:w-80 bg-[#0D0D0D] border border-white/5 rounded-3xl p-6 shadow-2xl flex flex-col gap-6">
      {/* Dietary Restrictions */}
      <div>
        <div className="flex items-center gap-2 mb-4">
          <Filter className="w-4 h-4 text-lime-400" />
          <h3 className="font-bold text-zinc-300 text-xs tracking-wider uppercase">Dietary Restrictions</h3>
        </div>
        <div className="flex flex-col gap-2.5">
          {DIETARY_RESTRICTIONS.map((diet) => {
            const isChecked = selectedFilters.includes(diet);
            return (
              <label
                key={diet}
                className={`flex items-center gap-3 p-2.5 rounded-xl border cursor-pointer transition-all ${
                  isChecked
                    ? "bg-lime-400/10 border-lime-400/30 text-lime-400"
                    : "bg-white/2 bg-opacity-5 border-white/5 text-zinc-300 hover:bg-white/5 hover:border-white/10"
                }`}
              >
                <input
                  type="checkbox"
                  checked={isChecked}
                  onChange={() => toggleFilter(diet)}
                  className="w-4.5 h-4.5 text-lime-400 bg-zinc-800 border-white/10 rounded-lg focus:ring-lime-400 focus:ring-2 accent-lime-400"
                />
                <span className="text-sm font-semibold">{diet}</span>
              </label>
            );
          })}
        </div>
      </div>

      <hr className="border-white/5" />

      {/* Ingredients List */}
      <div className="flex-1 flex flex-col min-h-[250px]">
        <div className="flex items-center gap-2 mb-3">
          <Sparkles className="w-4 h-4 text-amber-400" />
          <h3 className="font-bold text-zinc-300 text-xs tracking-wider uppercase">Your Ingredients</h3>
        </div>
        
        <p className="text-xs text-zinc-500 mb-4 leading-relaxed">
          Manage items detected in your fridge or manually add pantry essentials.
        </p>

        {/* Add ingredient input */}
        <form onSubmit={handleAddIngredient} className="flex gap-2 mb-4">
          <input
            type="text"
            placeholder="Add pantry staple..."
            value={newIngredient}
            onChange={(e) => setNewIngredient(e.target.value)}
            className="flex-1 px-3.5 py-2.5 text-sm bg-[#141414] border border-white/5 rounded-xl focus:outline-none focus:ring-2 focus:ring-lime-400/20 focus:border-lime-400 text-white placeholder-zinc-500 transition-all"
          />
          <button
            type="submit"
            className="p-2.5 bg-lime-400 hover:bg-lime-300 text-black font-bold rounded-xl transition-all"
            title="Add ingredient"
          >
            <Plus className="w-5 h-5 stroke-[2.5]" />
          </button>
        </form>

        {/* List of active ingredients */}
        <div className="flex-1 overflow-y-auto max-h-[300px] border border-white/5 rounded-xl p-3 bg-[#141414]/50">
          {detectedIngredients.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center p-4">
              <span className="text-xs text-zinc-500 font-medium">No ingredients identified yet.</span>
            </div>
          ) : (
            <div className="flex flex-wrap gap-2">
              {detectedIngredients.map((ing) => (
                <div
                  key={ing}
                  className="flex items-center gap-1.5 px-3 py-1 bg-[#1a1a1a] border border-white/5 rounded-full text-xs text-zinc-300 font-semibold hover:border-rose-500/30 hover:bg-rose-500/10 hover:text-rose-300 transition-all group"
                >
                  <span className="capitalize">{ing}</span>
                  <button
                    onClick={() => handleRemoveIngredient(ing)}
                    className="p-0.5 text-zinc-500 group-hover:text-rose-400 transition-colors"
                    title={`Remove ${ing}`}
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Refresh recipes button */}
      <button
        onClick={onRefreshRecipes}
        disabled={isRefreshing || detectedIngredients.length === 0}
        className="w-full flex items-center justify-center gap-2 py-3.5 px-4 bg-lime-400 hover:bg-lime-300 disabled:bg-zinc-800 disabled:text-zinc-500 disabled:cursor-not-allowed text-black font-extrabold rounded-2xl shadow-[0_0_15px_rgba(163,230,53,0.15)] transition-all active:scale-[0.98]"
      >
        <RotateCw className={`w-4 h-4 ${isRefreshing ? "animate-spin" : ""}`} />
        <span>{isRefreshing ? "Finding Recipes..." : "Update & Suggest Recipes"}</span>
      </button>
    </div>
  );
}
