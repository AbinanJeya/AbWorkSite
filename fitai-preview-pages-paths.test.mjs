import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

const workspace = 'C:/AbWork/AbWork-Website';
const previewIndexPath = path.join(workspace, 'react-site', 'public', 'fitai-preview', 'index.html');
const previewBundleDir = path.join(
  workspace,
  'react-site',
  'public',
  'fitai-preview',
  '_expo',
  'static',
  'js',
  'web'
);
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

const previewBundleFiles = fs
  .readdirSync(previewBundleDir)
  .filter((fileName) => fileName.endsWith('.js'));

assert.ok(
  previewBundleFiles.length > 0,
  'The exported FitAI preview should include at least one Expo web bundle.'
);

for (const previewBundleFileName of previewBundleFiles) {
  const previewBundle = fs.readFileSync(path.join(previewBundleDir, previewBundleFileName), 'utf8');

  assert.doesNotMatch(
    previewBundle,
    /(["'])\/assets\//,
    `The preview bundle ${previewBundleFileName} should not use root-absolute asset URLs on GitHub Pages.`
  );
}

console.log('fitai-preview-pages-paths.test.mjs passed');
