// src/components/SideMenu.jsx

export default function SideMenu() {
  
  return (
    <aside
      className="rounded-2xl bg-white shadow border overflow-hidden flex flex-col"
      role="complementary"
      aria-label="Detaljmeny"
    >
      <div className="p-4 border-b flex items-center justify-between">
        <h3 className="text-base font-semibold">Detaljer</h3>
        {onClose && (
          <button
            onClick={onClose}
            className="px-3 py-1.5 rounded-lg border hover:bg-gray-50"
          >
            Stäng
          </button>
        )}
      </div>

      <div className="p-4 flex-1 overflow-y-auto">
        <h4 className="text-sm font-semibold mb-2">Ingredienser</h4>
        <ul className="space-y-1 mb-5">
          {ingredients.map((it, i) => (
            <li key={i} className="text-sm text-gray-800">
              <span className="font-medium">{it.ingredient}</span>
              {it.measure && <span className="text-gray-600"> — {it.measure}</span>}
            </li>
          ))}
        </ul>

      </div>
    </aside>
  );
}
