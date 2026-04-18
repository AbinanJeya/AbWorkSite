import { clone, dateKeyForOffset, ensureDiary, getAllMealsFromState, localDateKey, previewState } from './previewData.js';

function sumFoods(foods = []) {
  return foods.reduce(
    (totals, food) => ({
      calories: totals.calories + (Number(food.calories) || 0),
      protein: totals.protein + (Number(food.protein) || 0),
      carbs: totals.carbs + (Number(food.carbs) || 0),
      fat: totals.fat + (Number(food.fat) || 0),
    }),
    { calories: 0, protein: 0, carbs: 0, fat: 0 }
  );
}

function todayKey() {
  return localDateKey(new Date());
}

export async function getSettings() {
  return clone(previewState.settings);
}

export async function saveSettings(nextSettings) {
  previewState.settings = {
    ...previewState.settings,
    ...clone(nextSettings),
  };

  return clone(previewState.settings);
}

export function buildWorkoutTargetSettingsPatch(_currentSettings, workoutDaysPerWeekTarget) {
  return {
    workoutDaysPerWeekTarget,
  };
}

export async function getUserProfile() {
  return clone(previewState.profile);
}

export async function saveUserProfile(profile) {
  previewState.profile = {
    ...previewState.profile,
    ...clone(profile),
  };

  return clone(previewState.profile);
}

export async function getMeals() {
  return clone(getAllMealsFromState());
}

export function getTodaysMeals(allMeals = []) {
  return clone(allMeals.filter((meal) => meal.date === todayKey()));
}

export async function getDiaryForDate(dateKey = todayKey()) {
  return clone(ensureDiary(dateKey));
}

export async function addFoodToDiary(dateKey, mealType, food) {
  const diary = ensureDiary(dateKey);
  const nextFood = {
    id: food.id || `${mealType}-${Date.now()}`,
    ...clone(food),
  };
  diary[mealType] = [...(diary[mealType] || []), nextFood];
  return clone(nextFood);
}

export async function addFoodToDiaryAutoSlot(dateKey, food) {
  const nowHour = new Date().getHours();
  const mealType = nowHour < 11 ? 'breakfast' : nowHour < 15 ? 'lunch' : nowHour < 20 ? 'dinner' : 'snacks';
  return addFoodToDiary(dateKey, mealType, food);
}

export async function removeFoodFromDiary(dateKey, mealType, foodId) {
  const diary = ensureDiary(dateKey);
  diary[mealType] = (diary[mealType] || []).filter((food) => food.id !== foodId);
  return clone(diary[mealType]);
}

export function calcDiaryTotals(diary = {}) {
  return ['breakfast', 'lunch', 'dinner', 'snacks'].reduce((totals, mealType) => {
    const nextTotals = sumFoods(diary[mealType] || []);
    return {
      calories: totals.calories + nextTotals.calories,
      protein: totals.protein + nextTotals.protein,
      carbs: totals.carbs + nextTotals.carbs,
      fat: totals.fat + nextTotals.fat,
    };
  }, { calories: 0, protein: 0, carbs: 0, fat: 0 });
}

export function calcMealTypeTotal(foods = []) {
  return foods.reduce((total, food) => total + (Number(food.calories) || 0), 0);
}

export function calcMacroTotals(foods = []) {
  return sumFoods(foods);
}

export async function getWorkouts() {
  return clone(previewState.workoutLogs);
}

export function getTodaysWorkouts(allWorkouts = []) {
  return clone(allWorkouts.filter((workout) => workout.timestamp?.slice(0, 10) === todayKey()));
}

export function calcWorkoutTotals(workouts = []) {
  return workouts.reduce(
    (totals, workout) => ({
      caloriesBurned: totals.caloriesBurned + (Number(workout.caloriesBurned) || 0),
      totalMinutes: totals.totalMinutes + (Number(workout.totalMinutes) || 0),
    }),
    { caloriesBurned: 0, totalMinutes: 0 }
  );
}

export async function getRecentWorkouts(limit = 5) {
  return clone(
    [...previewState.workoutHistory]
      .sort((left, right) => new Date(right.startedAt) - new Date(left.startedAt))
      .slice(0, limit)
  );
}

export async function getWorkoutHistory() {
  return clone(previewState.workoutHistory);
}

export async function getWorkoutStreak() {
  return (await getWorkoutStreakStatus()).streak;
}

export async function getWorkoutStreakStatus() {
  return {
    streak: 3,
    currentWeekCount: 2,
    currentWeekTarget: previewState.profile.workoutDaysPerWeekTarget || previewState.settings.workoutDaysPerWeekTarget || 3,
    currentWeekMet: false,
  };
}

export async function getRoutines() {
  return clone(previewState.routines);
}

export async function saveRoutines(routines) {
  previewState.routines = clone(routines);
  return clone(previewState.routines);
}

export async function saveRoutineOrder(routineIds) {
  const routineMap = new Map(previewState.routines.map((routine) => [routine.id, routine]));
  previewState.routines = routineIds.map((routineId) => routineMap.get(routineId)).filter(Boolean);
  return clone(previewState.routines);
}

export async function deleteRoutine(routineId) {
  previewState.routines = previewState.routines.filter((routine) => routine.id !== routineId);
}

export async function getExerciseHistory(exerciseName) {
  const presets = {
    'Bench Press': { bestWeight: '185', bestE1RM: '205', lastSets: [{ weight: '165', reps: '8' }, { weight: '165', reps: '8' }, { weight: '160', reps: '10' }] },
    'Back Squat': { bestWeight: '245', bestE1RM: '270', lastSets: [{ weight: '225', reps: '6' }, { weight: '225', reps: '6' }, { weight: '215', reps: '8' }] },
  };

  return clone(
    presets[exerciseName] || {
      bestWeight: '60',
      bestE1RM: '72',
      lastSets: [{ weight: '60', reps: '10' }, { weight: '60', reps: '10' }],
    }
  );
}

export async function getStepHistory(days = 7) {
  return clone(previewState.stepHistory.slice(-days));
}

export function isHealthConnectEntry(entry) {
  return entry?.source === 'health_connect';
}

export async function getDiaryStreak() {
  return 4;
}

export async function getRecentMeals(limit = 8) {
  return clone(
    getAllMealsFromState()
      .slice()
      .sort((left, right) => (right.date + right.id).localeCompare(left.date + left.id))
      .slice(0, limit)
  );
}

export async function getFrequentFoods(limit = 8) {
  return clone(
    [
      { name: 'Greek Yogurt', calories: 130, protein: 15, carbs: 8, fat: 4 },
      { name: 'Protein Bar', calories: 210, protein: 20, carbs: 24, fat: 8 },
      { name: 'Chicken Breast (150g)', calories: 248, protein: 46, carbs: 0, fat: 5 },
      { name: 'Protein Shake', calories: 180, protein: 25, carbs: 8, fat: 3 },
      { name: 'Cottage Cheese', calories: 110, protein: 14, carbs: 5, fat: 4 },
      { name: 'Tuna Can', calories: 120, protein: 28, carbs: 0, fat: 1 },
      { name: 'Almonds (30g)', calories: 170, protein: 6, carbs: 6, fat: 15 },
      { name: 'Boiled Eggs (2)', calories: 156, protein: 12, carbs: 1, fat: 11 },
    ].slice(0, limit)
  );
}

export async function getVersionedChatHistory() {
  return clone(previewState.chatHistory);
}

export async function saveVersionedChatHistory(messages) {
  previewState.chatHistory = clone(messages);
  return clone(previewState.chatHistory);
}

export async function clearVersionedChatHistory() {
  previewState.chatHistory = [];
}

export async function saveMeal(meal) {
  previewState.savedMeals.push(clone(meal));
}

export async function saveRecipe(recipe) {
  previewState.savedRecipes.push(clone(recipe));
}

export async function getWater(dateKey = todayKey()) {
  return clone(previewState.waterByDate[dateKey] || []);
}

export async function saveWater(dateKey, waterLogs) {
  previewState.waterByDate[dateKey] = clone(waterLogs);
  return clone(previewState.waterByDate[dateKey]);
}

export async function setStepsToday(stepCount) {
  const todayEntry = previewState.stepHistory.find((entry) => entry.date === todayKey());
  if (todayEntry) {
    todayEntry.steps = Number(stepCount) || 0;
  }
}

export async function getXPData() {
  return clone(previewState.xpData);
}

export const XP_AMOUNTS = {
  DAILY_MISSION_COMPLETED: 75,
  DIARY_LOG: 25,
};

export async function addXP(amount) {
  previewState.xpData.totalXP += Number(amount) || 0;
  return clone(previewState.xpData);
}

export function getLevelInfo(totalXP = 0) {
  const xp = Math.max(0, Number(totalXP) || 0);
  const level = Math.floor(xp / 1000) + 1;
  const xpInLevel = xp % 1000;
  const xpNeeded = 1000;

  return {
    level,
    title: level >= 6 ? 'Momentum Builder' : 'Focused Starter',
    progress: xpInLevel / xpNeeded,
    totalXP: xp,
    xpInLevel,
    xpNeeded,
  };
}

export async function awardDailyBonus() {
  return clone(previewState.xpData);
}

export async function getWaterHistoryWindow() {
  return clone(previewState.waterByDate);
}

export async function getMealsForRecentWindow() {
  const keys = [todayKey(), dateKeyForOffset(1), dateKeyForOffset(2), dateKeyForOffset(3)];
  return clone(keys.map((key) => ({ date: key, diary: ensureDiary(key) })));
}
