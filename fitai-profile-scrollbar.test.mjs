import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

const repoRoot = 'C:/AbWork/AbWork-Website';
const settingsScreenPath = path.join(
  repoRoot,
  'fitai-expo-preview',
  'src',
  'screens',
  'SettingsScreen.js'
);
const source = fs.readFileSync(settingsScreenPath, 'utf8');

assert.match(
  source,
  /showsVerticalScrollIndicator=\{false\}/,
  'Profile preview should hide the vertical scroll indicator so the phone UI does not show a white scrollbar.'
);

console.log('fitai-profile-scrollbar.test.mjs passed');
