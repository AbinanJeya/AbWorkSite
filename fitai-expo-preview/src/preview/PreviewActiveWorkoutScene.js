import React, { useEffect, useMemo } from 'react';
import ActiveWorkoutScreen from '../screens/ActiveWorkoutScreen';
import { useWorkout } from '../contexts/WorkoutContext';
import { usePreviewEnvironment } from './PreviewEnvironment';
import { previewState } from '../services/previewData.js';

const PREVIEW_ELAPSED_SECONDS = 32 * 60 + 19;
const PREVIEW_REST_DURATION = 90;
const PREVIEW_REST_REMAINING = 42;

function buildPreviewExerciseLogs(routine) {
  return (routine.exercises || []).map((exercise, exerciseIndex) => {
    const totalSets = Number(exercise.sets) || 3;
    const completedCount = exerciseIndex === 0 ? Math.min(3, totalSets) : 0;
    const unit = (exercise.weightUnit || 'lb').toLowerCase();
    const defaultWeight = exercise.weight || '';
    const defaultReps = exercise.reps || '10';

    return {
      id: `preview-exercise-${exerciseIndex}`,
      name: exercise.name,
      muscleGroup: exercise.muscleGroup || '',
      equipment: exercise.equipment || '',
      weightUnit: unit,
      restMin: String(Math.floor(PREVIEW_REST_DURATION / 60)).padStart(2, '0'),
      restSec: String(PREVIEW_REST_DURATION % 60).padStart(2, '0'),
      bestWeight: defaultWeight || '185',
      bestE1RM: '205',
      sets: Array.from({ length: totalSets }, (_, setIndex) => ({
        id: `preview-set-${exerciseIndex}-${setIndex}`,
        setNum: setIndex + 1,
        weight: defaultWeight,
        reps: defaultReps,
        prev: defaultWeight ? `${defaultWeight}${unit} x ${defaultReps}` : '',
        completed: setIndex < completedCount,
        isPR: false,
      })),
    };
  });
}

function buildPreviewWorkoutSession(routineId) {
  const routine =
    previewState.routines.find((candidate) => candidate.id === routineId) ?? previewState.routines[0];

  return {
    routine,
    exerciseLogs: buildPreviewExerciseLogs(routine),
    startTime: Date.now() - PREVIEW_ELAPSED_SECONDS * 1000,
    restDuration: PREVIEW_REST_DURATION,
    restTimer: PREVIEW_REST_REMAINING,
  };
}

export default function PreviewActiveWorkoutScene() {
  const { previewWorkoutId } = usePreviewEnvironment();
  const workout = useWorkout();

  const previewSession = useMemo(
    () => buildPreviewWorkoutSession(previewWorkoutId),
    [previewWorkoutId]
  );

  useEffect(() => {
    const activeRoutineId = workout.activeWorkout?.routine?.id;

    if (activeRoutineId === previewSession.routine.id) {
      return;
    }

    workout.loadPreviewWorkout(previewSession);
  }, [previewSession, workout]);

  return <ActiveWorkoutScreen isOverlay={false} />;
}
