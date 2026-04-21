import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

const repoRoot = 'C:/AbWork/AbWork-Website';
const heroPath = path.join(
  repoRoot,
  'react-site',
  'src',
  'components',
  'landing',
  'HeroSection.jsx'
);
const source = fs.readFileSync(heroPath, 'utf8');

assert.match(
  source,
  /One daily fitness loop/,
  'HeroSection should lead with a shorter, stronger all-in-one headline.'
);

assert.match(
  source,
  /launch-loop-list/,
  'HeroSection should include a scan-friendly loop list instead of relying on paragraph copy alone.'
);

assert.match(
  source,
  /launch-hero__signal-grid/,
  'HeroSection should add a visual signal grid around the live preview.'
);

assert.match(
  source,
  /launch-hero__signal/,
  'HeroSection should render multiple connected signal cards to explain the unified system.'
);

console.log('hero-loop-story.test.mjs passed');
