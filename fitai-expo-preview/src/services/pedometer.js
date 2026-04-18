import { previewState } from './previewData.js';

export async function getTodayStepCount() {
  return previewState.stepHistory[previewState.stepHistory.length - 1]?.steps || 0;
}

export function startStepWatcher(listener) {
  listener?.(previewState.stepHistory[previewState.stepHistory.length - 1]?.steps || 0);
}

export function stopStepWatcher() {}

export async function getActiveStepSourceInfo() {
  return {
    deviceId: 'health_connect',
    label: 'Health Connect',
  };
}
