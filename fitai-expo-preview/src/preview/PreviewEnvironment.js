import React, { createContext, useContext, useMemo } from 'react';

export const PREVIEW_ROOT_TABS = ['Dashboard', 'Diary', 'Advice', 'Workout', 'Profile'];
export const PREVIEW_INITIAL_ROUTE = 'Dashboard';
export const PREVIEW_DEFAULT_SCENE = 'tabs';
export const PREVIEW_ACTIVE_WORKOUT_SCENE = 'active-workout';
export const PREVIEW_DEFAULT_WORKOUT_ID = 'routine-upper-strength';
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

function normalizePreviewRoute(candidateRoute) {
  return PREVIEW_ROOT_TABS.includes(candidateRoute) ? candidateRoute : PREVIEW_INITIAL_ROUTE;
}

function normalizePreviewScene(candidateScene) {
  return candidateScene === PREVIEW_ACTIVE_WORKOUT_SCENE
    ? PREVIEW_ACTIVE_WORKOUT_SCENE
    : PREVIEW_DEFAULT_SCENE;
}

export function resolvePreviewEnvironment(search = '') {
  const params = new URLSearchParams(search);
  const previewScene = normalizePreviewScene(params.get('previewScene'));
  const requestedRoute = params.get('previewRoute');
  const initialRoute =
    previewScene === PREVIEW_ACTIVE_WORKOUT_SCENE
      ? 'Workout'
      : normalizePreviewRoute(requestedRoute);

  return {
    initialRoute,
    previewScene,
    previewWorkoutId: params.get('previewWorkout') || PREVIEW_DEFAULT_WORKOUT_ID,
    profile: PREVIEW_PROFILE,
    rootTabs: PREVIEW_ROOT_TABS,
    safeAreaMetrics: PREVIEW_SAFE_AREA_METRICS,
  };
}

export function PreviewEnvironmentProvider({ children }) {
  const value = useMemo(() => {
    const search = typeof window !== 'undefined' ? window.location.search : '';
    return resolvePreviewEnvironment(search);
  }, []);

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
