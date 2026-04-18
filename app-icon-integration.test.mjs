import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

const repoRoot = 'C:/AbWork/AbWork-Website';

const navSource = fs.readFileSync(
  path.join(repoRoot, 'react-site', 'src', 'components', 'landing', 'NavBar.jsx'),
  'utf8'
);
const footerSource = fs.readFileSync(
  path.join(repoRoot, 'react-site', 'src', 'components', 'landing', 'FooterSection.jsx'),
  'utf8'
);
const htmlSource = fs.readFileSync(path.join(repoRoot, 'react-site', 'index.html'), 'utf8');

assert.match(
  navSource,
  /\/branding\/app-icon\.png/,
  'Nav bar should use the real app icon asset.'
);

assert.match(
  footerSource,
  /\/branding\/app-icon\.png/,
  'Footer should use the real app icon asset.'
);

assert.match(
  htmlSource,
  /\/branding\/favicon\.png/,
  'The site head should use the copied app favicon.'
);

assert.ok(
  fs.existsSync(path.join(repoRoot, 'react-site', 'public', 'branding', 'app-icon.png')),
  'The copied app icon should exist in the website public assets.'
);

assert.ok(
  fs.existsSync(path.join(repoRoot, 'react-site', 'public', 'branding', 'favicon.png')),
  'The copied favicon should exist in the website public assets.'
);

console.log('app-icon-integration.test.mjs passed');
