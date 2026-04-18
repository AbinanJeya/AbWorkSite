import { clone, previewState } from './previewData.js';

function scaleRecipe(recipe, targetCalories) {
  const factor = targetCalories > 0 ? targetCalories / recipe.calories : 1;
  return {
    ...recipe,
    calories: Math.round(recipe.calories * factor),
    protein: Math.round(recipe.protein * factor),
    carbs: Math.round(recipe.carbs * factor),
    fat: Math.round(recipe.fat * factor),
  };
}

export async function getInteractiveNutritionCoach(_macros, _settings, context = {}) {
  const proteinGap = Math.max(0, 130 - (context?.habitSnapshot?.today?.protein || 0));
  return {
    tone: proteinGap > 30 ? 'amber' : 'primary',
    message:
      proteinGap > 30
        ? `You are still about ${proteinGap}g short on protein. A simple snack now keeps dinner flexible later.`
        : 'You are pacing well. Keep intake steady and give hydration a quick bump before lunch.',
    supportingNote:
      context?.habitSnapshot?.flags?.hydrationLagging
        ? 'Coach read your steps, hydration, and recent diary history. Hydration is lagging more than calories right now.'
        : 'Coach read your step trend, recovery habits, and the last few logged meals.',
    action: {
      ctaType: 'open-advice',
      ctaLabel: 'Open nutrition chat',
    },
    foodSuggestion: {
      name: 'Greek Yogurt Power Cup',
      protein: 28,
      calories: 310,
      reason: 'Fast protein with almost no prep and an easy macro fit for today.',
    },
  };
}

export async function askNutritionQuestion(text, context = {}) {
  if (/protein/i.test(text)) {
    return `Protein is the biggest lever right now. A 25g to 30g serving would close the gap fastest and still leave room for dinner.`;
  }

  if (/meal|eat|recipe/i.test(text)) {
    return `Aim for something simple: lean protein, a moderate carb, and fruit or veg. Based on today, around ${Math.max(
      250,
      Math.min(650, context?.remaining?.calories || 450)
    )} kcal is a clean fit.`;
  }

  return 'Keep the next move simple: log a protein-forward meal, add some water, and let the coach rebalance the rest of the day.';
}

export async function getMacroSolverSuggestion(remaining) {
  return `A yogurt bowl or a protein shake would quickly close the ${remaining.protein}g protein gap without blowing the rest of your calories.`;
}

export async function getSmartRecipes(remaining = {}, filter = 'All') {
  const recipes = clone(previewState.previewRecipes);
  const filterMatchers = {
    All: () => true,
    'Under 10 Min': (recipe) => /10|min/i.test(recipe.prepTime),
    'No-Cook': (recipe) => /NO-COOK/i.test(recipe.tag),
    'High Protein': (recipe) => recipe.protein >= 30,
    'Post-Workout': (recipe) => /POST/i.test(recipe.tag),
  };

  const matcher = filterMatchers[filter] || filterMatchers.All;
  const filteredRecipes = recipes.filter(matcher);

  if (remaining.calories && remaining.calories > 0) {
    return filteredRecipes.map((recipe) =>
      remaining.calories < recipe.calories ? scaleRecipe(recipe, Math.max(remaining.calories, 220)) : recipe
    );
  }

  return filteredRecipes;
}

export async function generateMeal(text) {
  const lowerText = text.toLowerCase();
  if (!/meal|bowl|lunch|breakfast|dinner|protein/.test(lowerText)) {
    return null;
  }

  return {
    name: 'Coach Built Protein Bowl',
    calories: 480,
    protein: 41,
    carbs: 39,
    fat: 16,
    ingredients: [
      { name: 'Chicken Breast', calories: 220, protein: 34, carbs: 0, fat: 8 },
      { name: 'Jasmine Rice', calories: 160, protein: 3, carbs: 35, fat: 1 },
      { name: 'Roasted Veg', calories: 60, protein: 2, carbs: 8, fat: 2 },
      { name: 'Light Sauce', calories: 40, protein: 2, carbs: 4, fat: 5 },
    ],
  };
}

export async function addIngredientToMeal(meal, ingredientText) {
  const extraIngredient = {
    name: ingredientText,
    calories: 60,
    protein: 4,
    carbs: 6,
    fat: 2,
  };
  const ingredients = [...(meal.ingredients || []), extraIngredient];
  const totals = ingredients.reduce(
    (nextTotals, ingredient) => ({
      calories: nextTotals.calories + (ingredient.calories || 0),
      protein: nextTotals.protein + (ingredient.protein || 0),
      carbs: nextTotals.carbs + (ingredient.carbs || 0),
      fat: nextTotals.fat + (ingredient.fat || 0),
    }),
    { calories: 0, protein: 0, carbs: 0, fat: 0 }
  );

  return {
    ...meal,
    ...totals,
    ingredients,
  };
}

export async function generateRecipeFromChat(text) {
  const lowerText = text.toLowerCase();
  const matchedRecipe =
    clone(previewState.previewRecipes).find((recipe) =>
      lowerText.includes(recipe.name.toLowerCase().split(' ')[0].toLowerCase())
    ) || clone(previewState.previewRecipes[0]);

  return matchedRecipe;
}
