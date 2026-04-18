import React, { createContext, useContext, useMemo } from 'react';

export const PREVIEW_ROOT_TABS = ['Dashboard', 'Diary', 'Advice', 'Workout', 'Profile'];
export const PREVIEW_INITIAL_ROUTE = 'Dashboard';
export const PREVIEW_PROFILE = {
  onboardingComplete: true,
  firstName: 'Alex',
  goal: 'maintain',
  dailyCalories: 1717,
  tdee: 2500,
  weight: 163,
  weightUnit: 'lbs',
  workoutDaysPerWeekTarget: 3,
  profileImage: null,
};

export const PREVIEW_SAFE_AREA_METRICS = {
  frame: { x: 0, y: 0, width: 390, height: 844 },
  insets: { top: 28, right: 0, bottom: 20, left: 0 },
};

const PreviewEnvironmentContext = createContext(null);

export function PreviewEnvironmentProvider({ children }) {
  const value = useMemo(
    () => ({
      initialRoute: PREVIEW_INITIAL_ROUTE,
      profile: PREVIEW_PROFILE,
      rootTabs: PREVIEW_ROOT_TABS,
      safeAreaMetrics: PREVIEW_SAFE_AREA_METRICS,
    }),
    []
  );

  return (
    <PreviewEnvironmentContext.Provider value={value}>
      {children}
    </PreviewEnvironmentContext.Provider>
  );
}

export function usePreviewEnvironment() {
  const context = useContext(PreviewEnvironmentContext);

  if (!context) {
    throw new Error('usePreviewEnvironment must be used within PreviewEnvironmentProvider');
  }

  return context;
}
