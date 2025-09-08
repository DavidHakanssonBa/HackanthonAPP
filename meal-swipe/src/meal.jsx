// Minimal klient mot TheMealDB
export async function getRandomMeal() {
  const r = await fetch('https://www.themealdb.com/api/json/v1/1/random.php');
  if (!r.ok) throw new Error('Failed fetching meal');
  const data = await r.json();
  return data.meals?.[0] ?? null;
}

// Plocka ut [ {ingredient, measure}, ... ] från strIngredient1..20
export function parseIngredients(meal) {
  const items = [];
  for (let i = 1; i <= 20; i++) {
    const ing = meal[`strIngredient${i}`];
    const measure = meal[`strMeasure${i}`];
    if (ing && ing.trim()) {
      items.push({ ingredient: ing.trim(), measure: (measure || '').trim() });
    }
  }
  return items;
}
