import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

const repoRoot = 'C:/AbWork/AbWork-Website';
const stylesPath = path.join(repoRoot, 'styles.css');
const styles = fs.readFileSync(stylesPath, 'utf8');

assert.match(
  styles,
  /\.hero__phone\s*\{[\s\S]*?flex:\s*0 0 384px;[\s\S]*?width:\s*384px;/,
  'Desktop hero phone column should be 20% larger.'
);

assert.match(
  styles,
  /\.hero__phone-frame\.fitai-device\s*\{[\s\S]*?width:\s*360px;[\s\S]*?aspect-ratio:\s*390\s*\/\s*844;/,
  'Desktop FitAI phone shell should be 20% larger.'
);

assert.match(
  styles,
  /@media \(max-width: 768px\)\s*\{[\s\S]*?\.hero__phone-frame\.fitai-device\s*\{[\s\S]*?width:\s*302px;[\s\S]*?aspect-ratio:\s*390\s*\/\s*844;/,
  'Mobile FitAI phone shell should be 20% larger.'
);

console.log('fitai-phone-size.test.mjs passed');
