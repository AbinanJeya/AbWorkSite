import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

const repoRoot = 'C:/AbWork/AbWork-Website';
const sectionPath = path.join(
  repoRoot,
  'react-site',
  'src',
  'components',
  'landing',
  'DownloadSection.jsx'
);
const source = fs.readFileSync(sectionPath, 'utf8');

assert.match(
  source,
  /Download APK/,
  'Landing page should expose a Download APK call to action.'
);

assert.match(
  source,
  /Coming soon/,
  'Landing page should label the store badges as coming soon.'
);

assert.match(
  source,
  /download__badge--disabled/,
  'Store badges should be rendered as disabled cards instead of links.'
);

console.log('download-cta.test.mjs passed');
