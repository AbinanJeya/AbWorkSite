import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

const workspace = 'C:/AbWork/AbWork-Website';
const previewComponentPath = path.join(workspace, 'react-site/src/components/FitAiPreview.jsx');
const copiedAppRoot = path.join(workspace, 'react-site/src/fitai-preview/app');
const viteConfigPath = path.join(workspace, 'vite.config.js');
const requiredScreens = [
  'DashboardScreen.js',
  'DiaryScreen.js',
  'AdviceScreen.js',
  'WorkoutPlannerScreen.js',
  'SettingsScreen.js',
];

function expectFile(filePath) {
  assert.ok(fs.existsSync(filePath), `expected file to exist: ${filePath}`);
}

function run() {
  expectFile(previewComponentPath);

  const previewSource = fs.readFileSync(previewComponentPath, 'utf8');
  assert.match(previewSource, /fitai-preview/);
  assert.doesNotMatch(previewSource, /FitAiDashboardScreen/);
  assert.doesNotMatch(previewSource, /FitAiDiaryScreen/);
  assert.doesNotMatch(previewSource, /FitAiAdviceScreen/);
  assert.doesNotMatch(previewSource, /FitAiWorkoutScreen/);
  assert.doesNotMatch(previewSource, /FitAiProfileScreen/);

  expectFile(copiedAppRoot);
  expectFile(viteConfigPath);

  const screensDir = path.join(copiedAppRoot, 'screens');
  expectFile(screensDir);

  requiredScreens.forEach((screenName) => {
    expectFile(path.join(screensDir, screenName));
  });

  const viteConfigSource = fs.readFileSync(viteConfigPath, 'utf8');
  assert.match(viteConfigSource, /dedupe:\s*\[['"]react['"],\s*['"]react-dom['"]\]/);
  assert.match(viteConfigSource, /react\/jsx-runtime/);
  assert.match(viteConfigSource, /react-dom\/client/);

  console.log('fitai real preview tests passed');
}

run();
