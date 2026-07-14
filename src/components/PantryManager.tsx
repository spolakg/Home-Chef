import React, { useState } from "react";
import { Package, Plus, Trash2, Edit2, RotateCcw, Sparkles } from "lucide-react";
import { PantryItem } from "../types";

interface PantryManagerProps {
  pantryItems: PantryItem[];
  setPantryItems: React.Dispatch<React.SetStateAction<PantryItem[]>>;
}

const COMMON_STAPLES = [
  { name: "Flour", quantity: "1 kg" },
  { name: "Sugar", quantity: "500g" },
  { name: "Olive Oil", quantity: "1 bottle" },
  { name: "Salt", quantity: "1 pack" },
  { name: "Black Pepper", quantity: "1 jar" },
  { name: "Rice", quantity: "2 kg" },
  { name: "Garlic Powder", quantity: "1 jar" },
  { name: "Canned Tomato", quantity: "2 cans" },
];

export default function PantryManager({ pantryItems, setPantryItems }: PantryManagerProps) {
  const [name, setName] = useState("");
  const [quantity, setQuantity] = useState("");

  const handleAddItem = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const cleanName = name.trim();
    if (!cleanName) return;

    // Check if item already exists
    const existingIndex = pantryItems.findIndex(
      (item) => item.name.toLowerCase() === cleanName.toLowerCase()
    );

    if (existingIndex > -1) {
      // Update quantity of existing item
      setPantryItems((prev) => {
        const updated = [...prev];
        updated[existingIndex].quantity = quantity.trim() || "In Stock";
        return updated;
      });
    } else {
      // Add new item
      const newItem: PantryItem = {
        id: Date.now().toString(),
        name: cleanName,
        quantity: quantity.trim() || "In Stock",
      };
      setPantryItems((prev) => [...prev, newItem]);
    }

    setName("");
    setQuantity("");
  };

  const handleQuickAdd = (staple: { name: string; quantity: string }) => {
    const existing = pantryItems.find(
      (item) => item.name.toLowerCase() === staple.name.toLowerCase()
    );
    if (!existing) {
      const newItem: PantryItem = {
        id: Date.now().toString(),
        name: staple.name,
        quantity: staple.quantity,
      };
      setPantryItems((prev) => [...prev, newItem]);
    }
  };

  const handleRemoveItem = (id: string) => {
    setPantryItems((prev) => prev.filter((item) => item.id !== id));
  };

  const handleUpdateQuantity = (id: string, newQty: string) => {
    setPantryItems((prev) =>
      prev.map((item) => (item.id === id ? { ...item, quantity: newQty } : item))
    );
  };

  const handleClearAll = () => {
    if (window.confirm("Are you sure you want to clear all pantry items?")) {
      setPantryItems([]);
    }
  };

  const handleResetToDefault = () => {
    if (window.confirm("Reset pantry to standard kitchen staples?")) {
      const defaults: PantryItem[] = COMMON_STAPLES.map((staple, idx) => ({
        id: idx.toString(),
        name: staple.name,
        quantity: staple.quantity,
      }));
      setPantryItems(defaults);
    }
  };

  return (
    <div
      id="pantry-manager-panel"
      className="bg-[#0D0D0D] border border-white/5 rounded-3xl p-6 md:p-8 shadow-2xl max-w-3xl mx-auto w-full space-y-6"
    >
      {/* Header section */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-white/5 pb-5">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-lime-400/10 text-lime-400 rounded-2xl border border-lime-400/10">
            <Package className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-xl font-extrabold text-white">Pantry Staples</h2>
            <p className="text-xs text-zinc-400 mt-0.5">
              Keep track of long-lasting spices, grains, baking goods, and oils.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <button
            onClick={handleResetToDefault}
            className="flex-1 sm:flex-initial flex items-center justify-center gap-1.5 py-2 px-3.5 bg-[#141414] border border-white/10 text-zinc-300 hover:text-white hover:bg-white/5 text-xs font-bold rounded-xl transition-all cursor-pointer"
            title="Reset to default staples"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Load Staples</span>
          </button>
          {pantryItems.length > 0 && (
            <button
              onClick={handleClearAll}
              className="p-2 bg-[#141414] border border-white/10 text-zinc-400 hover:text-rose-400 hover:bg-rose-500/10 hover:border-rose-500/20 rounded-xl transition-all cursor-pointer"
              title="Clear all"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* Quick suggest staple tags */}
      <div className="space-y-2">
        <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest block font-mono">
          Quick-Add Suggested Staples
        </span>
        <div className="flex flex-wrap gap-2">
          {COMMON_STAPLES.map((staple) => {
            const alreadyAdded = pantryItems.some(
              (item) => item.name.toLowerCase() === staple.name.toLowerCase()
            );
            return (
              <button
                key={staple.name}
                onClick={() => handleQuickAdd(staple)}
                disabled={alreadyAdded}
                className={`py-1.5 px-3 rounded-xl text-xs font-bold transition-all flex items-center gap-1 cursor-pointer border ${
                  alreadyAdded
                    ? "bg-zinc-900/40 border-white/5 text-zinc-600 cursor-not-allowed"
                    : "bg-[#141414] border-white/10 text-zinc-300 hover:text-lime-400 hover:border-lime-400/30"
                }`}
              >
                <span>{staple.name}</span>
                <span className="text-[10px] text-zinc-500 font-normal">({staple.quantity})</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Manual Input Form */}
      <form onSubmit={handleAddItem} className="flex flex-col sm:flex-row gap-3">
        <input
          type="text"
          placeholder="Staple name (e.g. Flour, Soy Sauce)..."
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="flex-1 px-4 py-3 text-sm bg-[#141414] border border-white/5 rounded-xl focus:outline-none focus:ring-2 focus:ring-lime-400/20 focus:border-lime-400 text-white placeholder-zinc-500 transition-all"
          required
        />
        <input
          type="text"
          placeholder="Quantity (e.g. 500g, 2 bottles)..."
          value={quantity}
          onChange={(e) => setQuantity(e.target.value)}
          className="sm:w-48 px-4 py-3 text-sm bg-[#141414] border border-white/5 rounded-xl focus:outline-none focus:ring-2 focus:ring-lime-400/20 focus:border-lime-400 text-white placeholder-zinc-500 transition-all"
        />
        <button
          type="submit"
          className="py-3 px-5 bg-lime-400 hover:bg-lime-300 text-black font-extrabold text-sm rounded-xl flex items-center justify-center gap-1.5 transition-all shadow-sm active:scale-[0.98] cursor-pointer"
        >
          <Plus className="w-4 h-4 stroke-[2.5]" />
          <span>Add Staple</span>
        </button>
      </form>

      {/* Pantry List */}
      <div className="space-y-2">
        {pantryItems.length === 0 ? (
          <div className="py-12 px-4 border border-dashed border-white/5 rounded-2xl flex flex-col items-center justify-center text-center gap-3">
            <div className="p-4 bg-[#141414] text-zinc-600 rounded-full border border-white/5">
              <Package className="w-8 h-8 stroke-[1.5]" />
            </div>
            <div className="space-y-1">
              <h4 className="font-extrabold text-white text-sm">Your Pantry is Empty</h4>
              <p className="text-xs text-zinc-500 max-w-sm leading-relaxed">
                Click "Load Staples" above to quickly populate standard staples, or add custom spices and baking essentials manually. They will be included alongside fridge items when generating recipes!
              </p>
            </div>
          </div>
        ) : (
          <div className="border border-white/5 bg-[#141414]/50 rounded-2xl divide-y divide-white/5 overflow-hidden">
            {pantryItems.map((item) => (
              <div
                key={item.id}
                className="flex items-center justify-between py-3 px-4 transition-colors hover:bg-white/[0.02]"
              >
                <div className="flex items-center gap-3 flex-1 min-w-0">
                  <Package className="w-4 h-4 text-lime-400/70 shrink-0" />
                  <span className="text-sm font-bold text-zinc-200 capitalize truncate">
                    {item.name}
                  </span>
                </div>

                <div className="flex items-center gap-3 shrink-0">
                  {/* Quantity Edit Field */}
                  <div className="flex items-center gap-1.5">
                    <span className="text-[11px] text-zinc-500 uppercase font-bold tracking-wider font-mono hidden md:inline">
                      Qty:
                    </span>
                    <input
                      type="text"
                      value={item.quantity}
                      onChange={(e) => handleUpdateQuantity(item.id, e.target.value)}
                      placeholder="e.g. 500g"
                      className="w-28 md:w-36 px-2.5 py-1 text-xs bg-[#141414] border border-white/10 rounded-lg text-zinc-200 focus:outline-none focus:border-lime-400 font-semibold transition-all text-center"
                      title="Click to edit quantity directly"
                    />
                  </div>

                  <button
                    onClick={() => handleRemoveItem(item.id)}
                    className="p-1.5 text-zinc-500 hover:text-rose-400 hover:bg-rose-500/10 rounded-lg transition-all cursor-pointer"
                    title={`Delete ${item.name}`}
                  >
                    <Trash2 className="w-3.5 h-3.5 stroke-[2]" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Informative Tip Box */}
      <div className="bg-[#141414] border border-white/5 rounded-2xl p-4 flex items-start gap-3">
        <Sparkles className="w-4 h-4 text-lime-400 shrink-0 mt-0.5" />
        <p className="text-xs text-zinc-400 leading-relaxed">
          <strong>Pro-Tip:</strong> Staples entered here (like flour, spices, sugar, oils, and grains) will be sent to the Gemini cooking brain during generation. The AI will know you have these on hand and use them to compose better recipes without flagging them as missing!
        </p>
      </div>
    </div>
  );
}
