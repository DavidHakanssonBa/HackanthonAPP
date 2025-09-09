
import { useState } from "react";

const API_CATEGORIES = [
  { id: "Beef", label: "Beef" },
  { id: "Breakfast", label: "Breakfast" },
  { id: "Chicken", label: "Chicken" },
  { id: "Dessert", label: "Dessert" },
  { id: "Goat", label: "Goat" },
  { id: "Lamb", label: "Lamb" },
  { id: "Pasta", label: "Pasta" },
  { id: "Pork", label: "Pork" },
  { id: "Seafood", label: "Seafood" },
  { id: "Side", label: "Side" },
  { id: "Starter", label: "Starter" },
  { id: "Vegan", label: "Vegan" },
  { id: "Vegetarian", label: "Vegetarian" },
];

export default function FilterPanel({ onApply }) {
  const [open, setOpen] = useState(true);
  const [selected, setSelected] = useState([]);

  const toggle = (id) => {
    setSelected((prev) =>
      prev.includes(id) ? prev.filter((c) => c !== id) : [...prev, id]
    );
  };

  const handleApply = () => {
    onApply(selected); // pass selected list up to parent
  };

  const handleClear = () => {
    setSelected([]);
    onApply([]); // reset
  };

  return (
    <aside className="w-full flex-1 flex flex-col">
      <div className="flex-1 flex flex-col rounded-2xl bg-white shadow-xl border overflow-hidden">
        <header className="px-5 py-4 border-b bg-gray-50 flex items-center justify-between shrink-0">
          <div>
            <h3 className="text-lg font-semibold">Filter</h3>
            <p className="text-xs text-gray-500">Select categories</p>
          </div>
          <button
            onClick={() => setOpen((o) => !o)}
            className="text-sm px-3 py-1.5 rounded-lg border hover:bg-white"
          >
            {open ? "Hide" : "Show"}
          </button>
        </header>

        {open && (
          <div className="flex-1 overflow-y-auto p-4">
            <div className="grid grid-cols-2 gap-2">
              {API_CATEGORIES.map((cat) => (
                <label
                  key={cat.id}
                  className={`flex items-center gap-2 rounded-xl border px-3 py-2 text-sm cursor-pointer ${
                    selected.includes(cat.id) ? "bg-gray-100 border-gray-400" : "hover:bg-gray-50"
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={selected.includes(cat.id)}
                    onChange={() => toggle(cat.id)}
                  />
                  <span>{cat.label}</span>
                </label>
              ))}
            </div>

            <div className="mt-4 flex gap-2">
              <button
                onClick={handleApply}
                className="flex-1 px-3 py-2 rounded-xl bg-gray-900 text-white text-sm font-medium"
              >
                Apply
              </button>
              <button
                onClick={handleClear}
                className="flex-1 px-3 py-2 rounded-xl border text-sm font-medium"
              >
                Clear
              </button>
            </div>
          </div>
        )}
      </div>
    </aside>
  );
}
