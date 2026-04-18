import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

const repoRoot = 'C:/AbWork/AbWork-Website';
const read = (...parts) => fs.readFileSync(path.join(repoRoot, ...parts), 'utf8');

const previewAppSource = read('fitai-expo-preview', 'src', 'preview', 'PreviewApp.js');
const appNavigatorSource = read('fitai-expo-preview', 'src', 'navigation', 'AppNavigator.js');
const interactionGateSource = read(
  'fitai-expo-preview',
  'src',
  'preview',
  'PreviewInteractionGate.js'
);
const previewAutoDemoPath = path.join(
  repoRoot,
  'fitai-expo-preview',
  'src',
  'preview',
  'PreviewAutoDemo.js'
);

assert.ok(
  fs.existsSync(previewAutoDemoPath),
  'Preview app should define a dedicated auto-demo controller for tab rotation and in-screen panning.'
);

assert.match(
  previewAppSource,
  /PreviewAutoDemoProvider/,
  'PreviewApp should wrap the copied FitAI runtime in the auto-demo provider.'
);

assert.match(
  appNavigatorSource,
  /usePreviewAutoDemo/,
  'AppNavigator should connect the real root tab navigator to the auto-demo controller.'
);

assert.match(
  interactionGateSource,
  /pauseAutomation/,
  'PreviewInteractionGate should pause the auto-demo when the user interacts manually.'
);

for (const [fileName, tabName] of [
  ['DashboardScreen.js', 'Dashboard'],
  ['DiaryScreen.js', 'Diary'],
  ['AdviceScreen.js', 'Advice'],
  ['WorkoutPlannerScreen.js', 'Workout'],
  ['SettingsScreen.js', 'Profile'],
]) {
  const screenSource = read('fitai-expo-preview', 'src', 'screens', fileName);

  assert.match(
    screenSource,
    new RegExp(`usePreviewAutoScroll\\(\\s*['"]${tabName}['"]`),
    `${fileName} should register its primary scroll surface with the preview auto-demo controller.`
  );
}

console.log('fitai-preview-auto-pan.test.mjs passed');
