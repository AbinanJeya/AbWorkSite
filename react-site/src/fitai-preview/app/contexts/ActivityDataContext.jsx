import React, { createContext, useContext, useMemo } from 'react';
import { previewState } from '../services/previewData.js';

const ActivityDataContext = createContext(null);

export function ActivityDataProvider({ children }) {
  const value = useMemo(() => {
    const diaryHistory = Object.entries(previewState.diaryByDate).map(([date, diary]) => ({
      date,
      diary,
    }));
    const workoutDates = new Set(
      previewState.workoutHistory
        .map((workout) => workout.startedAt?.slice(0, 10))
        .filter(Boolean)
    );

    return {
      stepHistory: previewState.stepHistory,
      diaryHistory,
      workoutDates,
      stepGoal: previewState.settings.stepGoal,
    };
  }, []);

  return <ActivityDataContext.Provider value={value}>{children}</ActivityDataContext.Provider>;
}

export function useActivityData() {
  const context = useContext(ActivityDataContext);

  if (!context) {
    throw new Error('useActivityData must be used inside ActivityDataProvider');
  }

  return context;
}
