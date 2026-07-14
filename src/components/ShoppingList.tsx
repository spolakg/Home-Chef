import React, { useState } from "react";
import { ShoppingCart, Plus, Check, Trash2, Copy, Trash, CheckSquare, Square } from "lucide-react";

interface ShoppingListProps {
  shoppingList: string[];
  setShoppingList: React.Dispatch<React.SetStateAction<string[]>>;
}

interface ShoppingItem {
  id: string;
  name: string;
  checked: boolean;
}

export default function ShoppingList({ shoppingList, setShoppingList }: ShoppingListProps) {
  const [newItemName, setNewItemName] = useState("");
  const [crossedItems, setCrossedItems] = useState<string[]>([]);
  const [copied, setCopied] = useState(false);

  const handleAddItem = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = newItemName.trim().toLowerCase();
    if (trimmed) {
      if (!shoppingList.includes(trimmed)) {
        setShoppingList((prev) => [...prev, trimmed]);
      }
      setNewItemName("");
    }
  };

  const handleToggleCheck = (item: string) => {
    setCrossedItems((prev) =>
      prev.includes(item) ? prev.filter((i) => i !== item) : [...prev, item]
    );
  };

  const handleRemoveItem = (itemToRemove: string) => {
    setShoppingList((prev) => prev.filter((i) => i !== itemToRemove));
    setCrossedItems((prev) => prev.filter((i) => i !== itemToRemove));
  };

  const handleClearAll = () => {
    if (confirm("Are you sure you want to clear your shopping list?")) {
      setShoppingList([]);
      setCrossedItems([]);
    }
  };

  const handleCopyList = () => {
    if (shoppingList.length === 0) return;
    const formattedList = shoppingList
      .map((item) => {
        const isChecked = crossedItems.includes(item);
        return `${isChecked ? "[x]" : "[ ]"} ${item.charAt(0).toUpperCase() + item.slice(1)}`;
      })
      .join("\n");

    navigator.clipboard.writeText(`Culinary Assistant Shopping List:\n\n${formattedList}`);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div id="shopping-list-panel" className="bg-[#0D0D0D] border border-white/5 rounded-3xl p-6 md:p-8 shadow-2xl max-w-2xl mx-auto w-full space-y-6">
      {/* Title & Actions */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-white/5 pb-5">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-lime-400/10 text-lime-400 rounded-2xl border border-lime-400/10">
            <ShoppingCart className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-xl font-extrabold text-white">Your Shopping List</h2>
            <p className="text-xs text-zinc-400 mt-0.5">Keep track of missing ingredients needed for recipes.</p>
          </div>
        </div>

        {shoppingList.length > 0 && (
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <button
              onClick={handleCopyList}
              className="flex-1 sm:flex-initial flex items-center justify-center gap-1.5 py-2 px-3.5 bg-[#141414] border border-white/10 text-zinc-300 hover:text-white hover:bg-white/5 text-xs font-bold rounded-xl transition-all cursor-pointer"
              title="Copy formatted list"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-lime-400 stroke-[3]" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copied ? "Copied!" : "Copy List"}</span>
            </button>

            <button
              onClick={handleClearAll}
              className="p-2 bg-[#141414] border border-white/10 text-zinc-400 hover:text-rose-400 hover:bg-rose-500/10 hover:border-rose-500/20 rounded-xl transition-all cursor-pointer"
              title="Clear list"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>

      {/* Manual Input Entry */}
      <form onSubmit={handleAddItem} className="flex gap-2">
        <input
          type="text"
          placeholder="Add groceries (e.g. olive oil, eggs)..."
          value={newItemName}
          onChange={(e) => setNewItemName(e.target.value)}
          className="flex-1 px-4 py-3 text-sm bg-[#141414] border border-white/5 rounded-xl focus:outline-none focus:ring-2 focus:ring-lime-400/20 focus:border-lime-400 text-white placeholder-zinc-500 transition-all"
        />
        <button
          type="submit"
          className="py-3 px-5 bg-lime-400 hover:bg-lime-300 text-black font-extrabold text-sm rounded-xl flex items-center gap-1.5 transition-all shadow-sm active:scale-[0.98] cursor-pointer"
        >
          <Plus className="w-4 h-4 stroke-[2.5]" />
          <span>Add</span>
        </button>
      </form>

      {/* Checklist items list */}
      <div className="space-y-2">
        {shoppingList.length === 0 ? (
          <div className="py-12 px-4 border border-dashed border-white/5 rounded-2xl flex flex-col items-center justify-center text-center gap-3">
            <div className="p-4 bg-[#141414] text-zinc-600 rounded-full border border-white/5">
              <ShoppingCart className="w-8 h-8 stroke-[1.5]" />
            </div>
            <div className="space-y-1">
              <h4 className="font-extrabold text-white text-sm">Shopping List is Empty</h4>
              <p className="text-xs text-zinc-500 max-w-xs leading-relaxed">
                Add ingredients manually or click "Add Missing" inside any recipe card or overview detail to stock up.
              </p>
            </div>
          </div>
        ) : (
          <div className="border border-white/5 bg-[#141414]/50 rounded-2xl divide-y divide-white/5 overflow-hidden">
            {shoppingList.map((item) => {
              const isChecked = crossedItems.includes(item);
              return (
                <div
                  key={item}
                  className={`flex items-center justify-between py-3 px-4 transition-colors hover:bg-white/2 ${
                    isChecked ? "bg-white/1 bg-opacity-[0.02] text-zinc-500" : "text-zinc-200"
                  }`}
                >
                  <button
                    onClick={() => handleToggleCheck(item)}
                    className="flex items-center gap-3 text-left flex-1 py-1 cursor-pointer"
                  >
                    <div className="flex-shrink-0 text-zinc-600 hover:text-lime-400 transition-colors">
                      {isChecked ? (
                        <CheckSquare className="w-5 h-5 text-lime-400 stroke-[2.5]" />
                      ) : (
                        <Square className="w-5 h-5 text-zinc-600" />
                      )}
                    </div>
                    <span className={`text-sm capitalize select-none ${isChecked ? "line-through text-zinc-500 font-normal" : "font-semibold"}`}>
                      {item}
                    </span>
                  </button>

                  <button
                    onClick={() => handleRemoveItem(item)}
                    className="p-1.5 text-zinc-500 hover:text-rose-400 hover:bg-rose-500/10 rounded-lg transition-all cursor-pointer"
                    title={`Delete ${item}`}
                  >
                    <Trash className="w-4 h-4 stroke-[2]" />
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
