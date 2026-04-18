import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

const workspace = 'C:/AbWork/AbWork-Website';
const rootPackagePath = path.join(workspace, 'package.json');
const previewComponentPath = path.join(workspace, 'react-site/src/components/FitAiPreview.jsx');
const previewRoot = path.join(workspace, 'fitai-expo-preview');

const requiredPreviewFiles = [
  'App.js',
  'app.json',
  'babel.config.js',
  'index.js',
  'metro.config.js',
  'package.json',
  'src/navigation/AppNavigator.js',
  'src/screens/DashboardScreen.js',
  'src/screens/DiaryScreen.js',
  'src/screens/AdviceScreen.js',
  'src/screens/WorkoutPlannerScreen.js',
  'src/screens/SettingsScreen.js',
  'src/preview/PreviewApp.js',
  'src/preview/PreviewInteractionGate.js',
  'src/preview/PreviewEnvironment.js',
];

function expectFile(filePath) {
  assert.ok(fs.existsSync(filePath), `expected file to exist: ${filePath}`);
}

function run() {
  expectFile(rootPackagePath);
  expectFile(previewComponentPath);
  expectFile(previewRoot);

  const rootPackage = JSON.parse(fs.readFileSync(rootPackagePath, 'utf8'));
  assert.equal(typeof rootPackage.scripts?.['preview:dev'], 'string');
  assert.equal(typeof rootPackage.scripts?.['preview:export'], 'string');
  assert.equal(typeof rootPackage.scripts?.['preview:sync'], 'string');

  requiredPreviewFiles.forEach((relativePath) => {
    expectFile(path.join(previewRoot, relativePath));
  });

  const previewSource = fs.readFileSync(previewComponentPath, 'utf8');
  assert.match(previewSource, /<iframe/i);
  assert.match(previewSource, /fitai-preview/i);
  assert.doesNotMatch(previewSource, /FitAiRealPreview/);

  const previewPackage = JSON.parse(fs.readFileSync(path.join(previewRoot, 'package.json'), 'utf8'));
  assert.equal(typeof previewPackage.scripts?.web, 'string');

  const previewAppSource = fs.readFileSync(path.join(previewRoot, 'src/preview/PreviewApp.js'), 'utf8');
  assert.match(previewAppSource, /NavigationContainer/);
  assert.match(previewAppSource, /AppNavigator/);
  assert.match(previewAppSource, /PreviewInteractionGate/);

  const previewEnvironmentSource = fs.readFileSync(path.join(previewRoot, 'src/preview/PreviewEnvironment.js'), 'utf8');
  assert.match(previewEnvironmentSource, /onboardingComplete/);
  assert.match(previewEnvironmentSource, /Dashboard/);

  console.log('fitai expo preview embed tests passed');
}

run();
