import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

const repoRoot = 'C:/AbWork/AbWork-Website';
const stylesPath = path.join(repoRoot, 'styles.css');
const styles = fs.readFileSync(stylesPath, 'utf8');

assert.match(
  styles,
  /\.hero__phone-frame\.fitai-device\s*\{[\s\S]*?width:\s*360px;[\s\S]*?aspect-ratio:\s*390\s*\/\s*844;/,
  'Desktop FitAI phone shell should match the preview viewport aspect ratio.'
);

assert.match(
  styles,
  /@media \(max-width: 768px\)\s*\{[\s\S]*?\.hero__phone-frame\.fitai-device\s*\{[\s\S]*?width:\s*302px;[\s\S]*?aspect-ratio:\s*390\s*\/\s*844;/,
  'Mobile FitAI phone shell should match the preview viewport aspect ratio.'
);

console.log('fitai-phone-ratio.test.mjs passed');
