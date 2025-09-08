const CATEGORIES = [
  { id: "frukost", label: "Frukost" },
  { id: "lunch", label: "Lunch" },
  { id: "middag", label: "Middag" },
  { id: "dessert", label: "Dessert" },
  { id: "soppa", label: "Soppa" },
  { id: "pasta", label: "Pasta" },
  { id: "kyckling", label: "Kyckling" },
  { id: "nöt", label: "Nötkött" },
  { id: "fisk", label: "Fisk" },
  { id: "veg", label: "Vegetariskt" },
  { id: "vegansk", label: "Veganskt" },
  { id: "asiatiskt", label: "Asiatiskt" },
  { id: "italienskt", label: "Italienskt" },
];

export default function FilterPanel({ className = "" }) {
  return (
    <aside className={`flex flex-col ${className}`}>
      <div className="flex-1 flex flex-col rounded-2xl bg-white shadow-xl border overflow-hidden">
        <header className="px-5 py-4 border-b bg-gray-50 shrink-0">
          <h3 className="text-lg font-semibold">Filter</h3>
          <p className="text-xs text-gray-500">Välj kategorier</p>
        </header>

        <div className="flex-1 overflow-y-auto p-4">
          <div className="grid grid-cols-2 gap-2">
            {CATEGORIES.map(cat => (
              <label
                key={cat.id}
                className="flex items-center gap-2 rounded-xl border px-3 py-2 text-sm hover:bg-gray-50 cursor-pointer"
              >
                <input type="checkbox" className="rounded border-gray-300" disabled />
                <span>{cat.label}</span>
              </label>
            ))}
          </div>
        </div>
      </div>
    </aside>
  );
}
