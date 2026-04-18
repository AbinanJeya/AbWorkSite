export function buildDashboardHabitSnapshot(input = {}) {
  return {
    timeBlock: 'morning',
    today: {
      calories: input.intake?.calories || 0,
      protein: input.intake?.protein || 0,
      mealsLogged: input.todayDiaryEntry
        ? ['breakfast', 'lunch', 'dinner', 'snacks'].reduce(
            (count, mealType) => count + ((input.todayDiaryEntry[mealType] || []).length > 0 ? 1 : 0),
            0
          )
        : 0,
      water: input.water || 0,
      steps: input.steps || 0,
      didWorkout: (input.workoutStats?.totalMinutes || 0) > 0,
    },
    goals: {
      stepGoal: input.settings?.stepGoal || 10000,
    },
    recent: {
      loggingDays: 4,
      workoutDays: 3,
      hydrationDays: 5,
      stepTrendDiff: -820,
    },
    flags: {
      likelyUnderLoggedToday: true,
      hydrationLagging: (input.water || 0) < 1000,
    },
  };
}
