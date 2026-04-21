import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

const workspace = 'C:/AbWork/AbWork-Website';

const previewEnvironmentPath = path.join(
  workspace,
  'fitai-expo-preview',
  'src',
  'preview',
  'PreviewEnvironment.js'
);
const appNavigatorPath = path.join(
  workspace,
  'fitai-expo-preview',
  'src',
  'navigation',
  'AppNavigator.js'
);
const previewActiveWorkoutScenePath = path.join(
  workspace,
  'fitai-expo-preview',
  'src',
  'preview',
  'PreviewActiveWorkoutScene.js'
);
const previewInteractionGatePath = path.join(
  workspace,
  'fitai-expo-preview',
  'src',
  'preview',
  'PreviewInteractionGate.js'
);
const workoutContextPath = path.join(
  workspace,
  'fitai-expo-preview',
  'src',
  'contexts',
  'WorkoutContext.js'
);
const exportedPreviewRoot = path.join(workspace, 'react-site', 'public', 'fitai-preview');

const previewEnvironmentSource = fs.readFileSync(previewEnvironmentPath, 'utf8');
const appNavigatorSource = fs.readFileSync(appNavigatorPath, 'utf8');
const previewActiveWorkoutSceneSource = fs.readFileSync(previewActiveWorkoutScenePath, 'utf8');
const previewInteractionGateSource = fs.readFileSync(previewInteractionGatePath, 'utf8');
const workoutContextSource = fs.readFileSync(workoutContextPath, 'utf8');
const exportedPreviewFiles = fs
  .readdirSync(path.join(exportedPreviewRoot, '_expo', 'static', 'js', 'web'))
  .filter((fileName) => fileName.endsWith('.js'))
  .map((fileName) => fs.readFileSync(path.join(exportedPreviewRoot, '_expo', 'static', 'js', 'web', fileName), 'utf8'));

assert.match(
  previewEnvironmentSource,
  /URLSearchParams/,
  'Preview environment should parse query params so a preview iframe can request specific scenes.'
);

assert.match(
  previewEnvironmentSource,
  /previewScene/,
  'Preview environment should expose a previewScene setting.'
);

assert.match(
  appNavigatorSource,
  /PREVIEW_ACTIVE_WORKOUT_SCENE/,
  'AppNavigator should recognize the active-workout preview scene.'
);

assert.match(
  appNavigatorSource,
  /PreviewActiveWorkoutScene/,
  'AppNavigator should route the active-workout preview scene through a dedicated preview wrapper.'
);

assert.match(
  previewActiveWorkoutSceneSource,
  /ActiveWorkoutScreen/,
  'The dedicated preview wrapper should render the real ActiveWorkoutScreen.'
);

assert.match(
  previewInteractionGateSource,
  /previewScene === PREVIEW_ACTIVE_WORKOUT_SCENE/,
  'The preview interaction gate should fully allow interaction inside the active-workout scene.'
);

assert.match(
  workoutContextSource,
  /loadPreviewWorkout/,
  'WorkoutContext should expose a way to hydrate a sample active workout session for preview mode.'
);

assert.ok(
  exportedPreviewFiles.some((source) => /active-workout/.test(source)),
  'The site-served exported preview bundle should include the active-workout scene.'
);

console.log('active-workout-preview-mode.test.mjs passed');
