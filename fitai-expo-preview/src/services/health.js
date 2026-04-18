import { clone, previewState } from './previewData.js';

export async function fetchWeeklySteps() {
  return previewState.stepHistory.reduce((stepsByDay, entry) => {
    stepsByDay[entry.date] = entry.steps;
    return stepsByDay;
  }, {});
}

export async function fetchWorkoutsData() {
  return clone(
    previewState.workoutHistory
      .filter((entry) => entry.source === 'health_connect')
      .map((entry) => ({
        startTime: entry.startedAt,
        endTime: entry.finishedAt,
        caloriesBurned: entry.caloriesBurned,
      }))
  );
}
