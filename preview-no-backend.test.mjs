import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

const repoRoot = 'C:/AbWork/AbWork-Website';
const previewRoot = path.join(repoRoot, 'fitai-expo-preview');
const previewSrc = path.join(previewRoot, 'src');
const previewPackage = JSON.parse(fs.readFileSync(path.join(previewRoot, 'package.json'), 'utf8'));

function readFilesRecursively(dirPath) {
  const entries = fs.readdirSync(dirPath, { withFileTypes: true });
  return entries.flatMap((entry) => {
    const fullPath = path.join(dirPath, entry.name);
    if (entry.isDirectory()) {
      return readFilesRecursively(fullPath);
    }

    return [fullPath];
  });
}

assert.equal(
  fs.existsSync(path.join(previewSrc, 'services', 'firebase.js')),
  false,
  'The preview app should not keep a Firebase initializer in the tree.'
);

assert.equal(
  fs.existsSync(path.join(previewSrc, 'services', 'cloudSync.js')),
  false,
  'The preview app should not keep cloud sync backend code in the tree.'
);

assert.equal(
  Boolean(previewPackage.dependencies.firebase),
  false,
  'The preview app should not depend on firebase once the backend path is removed.'
);

assert.equal(
  Boolean(previewPackage.dependencies['@react-native-google-signin/google-signin']),
  false,
  'The preview app should not depend on Google sign-in once the backend path is removed.'
);

const previewSource = readFilesRecursively(previewSrc)
  .filter((filePath) => filePath.endsWith('.js'))
  .map((filePath) => fs.readFileSync(filePath, 'utf8'))
  .join('\n');

assert.doesNotMatch(
  previewSource,
  /AIzaSyCgPyRiIboztB5HxtbuyfJE45OdCsHRHR8/,
  'The leaked API key should no longer appear anywhere in the preview source tree.'
);

assert.doesNotMatch(
  previewSource,
  /from ['"]\.\.\/services\/cloudSync['"]/,
  'No preview source should import the removed cloud sync backend.'
);

assert.doesNotMatch(
  previewSource,
  /from ['"]\.\.\/services\/firebase['"]/,
  'No preview source should import the removed Firebase initializer.'
);

console.log('preview-no-backend.test.mjs passed');
