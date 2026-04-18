import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

const workspace = 'C:/AbWork/AbWork-Website';
const previewIndexPath = path.join(workspace, 'react-site', 'public', 'fitai-preview', 'index.html');
const previewIndex = fs.readFileSync(previewIndexPath, 'utf8');

assert.doesNotMatch(
  previewIndex,
  /href="\/favicon\.ico"/,
  'The exported FitAI preview should not use a root-absolute favicon path on GitHub Pages.'
);

assert.doesNotMatch(
  previewIndex,
  /src="\/_expo\//,
  'The exported FitAI preview should not use root-absolute Expo asset paths on GitHub Pages.'
);

assert.match(
  previewIndex,
  /href="\.\.?\/?favicon\.ico"/,
  'The exported FitAI preview should use a relative favicon path.'
);

assert.match(
  previewIndex,
  /src="\.\.?\/?_expo\//,
  'The exported FitAI preview should use a relative Expo script path.'
);

console.log('fitai-preview-pages-paths.test.mjs passed');
