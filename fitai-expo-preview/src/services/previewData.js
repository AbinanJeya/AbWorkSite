const WEEKDAY_LABELS = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'];

function atLocalNoon(date = new Date()) {
  const nextDate = new Date(date);
  nextDate.setHours(12, 0, 0, 0);
  return nextDate;
}

export function dateKeyForOffset(offset = 0) {
  const date = atLocalNoon(new Date());
  date.setDate(date.getDate() - offset);
  return date.toISOString().slice(0, 10);
}

export function localDateKey(date = new Date()) {
  return atLocalNoon(date).toISOString().slice(0, 10);
}

export function clone(value) {
  return JSON.parse(JSON.stringify(value));
}

function entryId(prefix, index) {
  return `${prefix}-${index}`;
}

const today = dateKeyForOffset(0);
const yesterday = dateKeyForOffset(1);
const twoDaysAgo = dateKeyForOffset(2);
const threeDaysAgo = dateKeyForOffset(3);
const fourDaysAgo = dateKeyForOffset(4);
const fiveDaysAgo = dateKeyForOffset(5);
const sixDaysAgo = dateKeyForOffset(6);

function meal(id, name, calories, protein, carbs, fat, serving) {
  return { id, name, calories, protein, carbs, fat, serving };
}

export const previewState = {
  settings: {
    language: 'en',
    themeMode: 'oled',
    isDark: true,
    stepGoal: 10000,
    calorieGoal: 1717,
    userName: 'Alex Rivera',
    workoutDaysPerWeekTarget: 3,
    macros: {
      carbs: 40,
      protein: 30,
      fats: 30,
    },
    wearableConnections: {
      health_connect: {
        syncSteps: true,
        syncWorkouts: true,
      },
    },
    baseHSV: {
      h: 142,
      s: 0.85,
      v: 1,
    },
  },
  profile: {
    onboardingComplete: true,
    firstName: 'Alex',
    goal: 'maintain',
    dailyCalories: 1717,
    tdee: 2500,
    weight: 163,
    weightUnit: 'lbs',
    workoutDaysPerWeekTarget: 3,
    profileImage: null,
  },
  diaryByDate: {
    [today]: {
      breakfast: [],
      lunch: [],
      dinner: [],
      snacks: [],
    },
    [yesterday]: {
      breakfast: [meal(entryId('breakfast', 1), 'Greek Yogurt Bowl', 310, 28, 24, 10, '1 bowl')],
      lunch: [meal(entryId('lunch', 1), 'Chicken Rice Bowl', 540, 42, 54, 14, '1 bowl')],
      dinner: [meal(entryId('dinner', 1), 'Salmon & Potatoes', 620, 40, 46, 24, '1 plate')],
      snacks: [meal(entryId('snack', 1), 'Protein Shake', 180, 25, 8, 3, '1 bottle')],
    },
    [twoDaysAgo]: {
      breakfast: [meal(entryId('breakfast', 2), 'Egg & Avocado Toast', 420, 23, 28, 21, '2 slices')],
      lunch: [meal(entryId('lunch', 2), 'Turkey Wrap', 460, 34, 41, 14, '1 wrap')],
      dinner: [meal(entryId('dinner', 2), 'Steak Bowl', 700, 48, 52, 22, '1 bowl')],
      snacks: [],
    },
    [threeDaysAgo]: {
      breakfast: [meal(entryId('breakfast', 3), 'Overnight Oats', 330, 18, 42, 10, '1 jar')],
      lunch: [meal(entryId('lunch', 3), 'Tuna Sandwich', 430, 31, 38, 14, '1 sandwich')],
      dinner: [meal(entryId('dinner', 3), 'Chicken Pasta', 690, 44, 63, 19, '1 bowl')],
      snacks: [meal(entryId('snack', 3), 'Apple & Peanut Butter', 220, 6, 20, 13, '1 snack')],
    },
  },
  waterByDate: {
    [today]: [
      { id: 'water-1', amount: 250, time: '8:14 AM' },
      { id: 'water-2', amount: 250, time: '10:42 AM' },
    ],
    [yesterday]: [
      { id: 'water-3', amount: 500, time: '8:02 AM' },
      { id: 'water-4', amount: 500, time: '12:12 PM' },
      { id: 'water-5', amount: 500, time: '4:22 PM' },
    ],
    [twoDaysAgo]: [
      { id: 'water-6', amount: 500, time: '9:10 AM' },
      { id: 'water-7', amount: 500, time: '1:35 PM' },
    ],
  },
  routines: [
    {
      id: 'routine-upper-strength',
      name: 'Upper Strength',
      exercises: [
        { name: 'Bench Press', muscleGroup: 'Chest', sets: 4, reps: '8', weight: '165', weightUnit: 'lb' },
        { name: 'Bent Over Row', muscleGroup: 'Back', sets: 4, reps: '10', weight: '145', weightUnit: 'lb' },
        { name: 'Overhead Press', muscleGroup: 'Shoulders', sets: 3, reps: '10', weight: '95', weightUnit: 'lb' },
      ],
    },
    {
      id: 'routine-lower-power',
      name: 'Lower Power',
      exercises: [
        { name: 'Back Squat', muscleGroup: 'Legs', sets: 4, reps: '6', weight: '225', weightUnit: 'lb' },
        { name: 'Romanian Deadlift', muscleGroup: 'Posterior Chain', sets: 3, reps: '8', weight: '185', weightUnit: 'lb' },
        { name: 'Walking Lunges', muscleGroup: 'Legs', sets: 3, reps: '12', weight: '40', weightUnit: 'lb' },
      ],
    },
    {
      id: 'routine-conditioning',
      name: 'Conditioning Mix',
      exercises: [
        { name: 'Bike Intervals', muscleGroup: 'Conditioning', sets: 5, reps: '2 min', weight: '', weightUnit: '' },
        { name: 'Sled Push', muscleGroup: 'Conditioning', sets: 4, reps: '30m', weight: '', weightUnit: '' },
        { name: 'Battle Ropes', muscleGroup: 'Conditioning', sets: 4, reps: '30 sec', weight: '', weightUnit: '' },
      ],
    },
  ],
  workoutLogs: [
    {
      id: 'workout-log-1',
      name: 'Upper Strength',
      timestamp: `${yesterday}T18:30:00.000Z`,
      caloriesBurned: 410,
      totalMinutes: 52,
    },
    {
      id: 'workout-log-2',
      name: 'Lower Power',
      timestamp: `${threeDaysAgo}T19:10:00.000Z`,
      caloriesBurned: 475,
      totalMinutes: 58,
    },
  ],
  workoutHistory: [
    {
      id: 'workout-history-1',
      routineName: 'Upper Strength',
      startedAt: `${yesterday}T18:30:00.000Z`,
      finishedAt: `${yesterday}T19:22:00.000Z`,
      elapsedSeconds: 52 * 60,
      caloriesBurned: 410,
      type: 'routine',
      source: 'local',
    },
    {
      id: 'workout-history-2',
      routineName: 'Lower Power',
      startedAt: `${threeDaysAgo}T19:10:00.000Z`,
      finishedAt: `${threeDaysAgo}T20:08:00.000Z`,
      elapsedSeconds: 58 * 60,
      caloriesBurned: 475,
      type: 'routine',
      source: 'local',
    },
    {
      id: 'workout-history-3',
      routineName: 'Conditioning Mix',
      startedAt: `${fiveDaysAgo}T17:45:00.000Z`,
      finishedAt: `${fiveDaysAgo}T18:21:00.000Z`,
      elapsedSeconds: 36 * 60,
      caloriesBurned: 360,
      type: 'routine',
      source: 'health_connect',
    },
  ],
  stepHistory: [
    { date: sixDaysAgo, steps: 7824 },
    { date: fiveDaysAgo, steps: 9312 },
    { date: fourDaysAgo, steps: 11054 },
    { date: threeDaysAgo, steps: 8456 },
    { date: twoDaysAgo, steps: 12492 },
    { date: yesterday, steps: 7068 },
    { date: today, steps: 1561 },
  ].map((entry) => {
    const date = new Date(`${entry.date}T12:00:00`);
    return {
      ...entry,
      isToday: entry.date === today,
      dayLabel: WEEKDAY_LABELS[date.getDay()],
    };
  }),
  xpData: {
    totalXP: 4680,
  },
  chatHistory: [],
  savedMeals: [],
  savedRecipes: [],
  previewRecipes: [
    {
      id: 'recipe-1',
      name: 'Chicken Burrito Bowl',
      calories: 520,
      protein: 42,
      carbs: 44,
      fat: 18,
      prepTime: '12 min',
      tag: 'HIGH PROTEIN',
      ingredients: ['150g chicken breast', '120g jasmine rice', 'black beans', 'corn salsa', 'avocado'],
      steps: ['Cook the chicken.', 'Warm the rice and beans.', 'Assemble the bowl and finish with salsa.'],
    },
    {
      id: 'recipe-2',
      name: 'Greek Yogurt Power Cup',
      calories: 310,
      protein: 28,
      carbs: 24,
      fat: 10,
      prepTime: '5 min',
      tag: 'NO-COOK',
      ingredients: ['1 cup Greek yogurt', 'berries', 'granola', 'chia seeds'],
      steps: ['Spoon the yogurt into a bowl.', 'Top with berries and granola.', 'Finish with chia seeds.'],
    },
    {
      id: 'recipe-3',
      name: 'Post-Gym Steak Wrap',
      calories: 470,
      protein: 39,
      carbs: 34,
      fat: 18,
      prepTime: '10 min',
      tag: 'POST-WORKOUT',
      ingredients: ['sliced steak', 'large wrap', 'peppers', 'spinach', 'light sauce'],
      steps: ['Warm the steak and peppers.', 'Layer ingredients into the wrap.', 'Fold and toast until crisp.'],
    },
    {
      id: 'recipe-4',
      name: 'Egg White Breakfast Tacos',
      calories: 360,
      protein: 31,
      carbs: 26,
      fat: 11,
      prepTime: '9 min',
      tag: 'UNDER 10 MIN',
      ingredients: ['egg whites', '2 tortillas', 'salsa', 'reduced-fat cheese'],
      steps: ['Scramble the egg whites.', 'Warm the tortillas.', 'Build the tacos and top with salsa.'],
    },
  ],
};

export function getAllMealsFromState() {
  return Object.entries(previewState.diaryByDate).flatMap(([date, diary]) =>
    ['breakfast', 'lunch', 'dinner', 'snacks'].flatMap((mealType) =>
      (diary[mealType] || []).map((item) => ({
        ...item,
        date,
        mealType,
      }))
    )
  );
}

export function ensureDiary(dateKey) {
  if (!previewState.diaryByDate[dateKey]) {
    previewState.diaryByDate[dateKey] = {
      breakfast: [],
      lunch: [],
      dinner: [],
      snacks: [],
    };
  }

  return previewState.diaryByDate[dateKey];
}
