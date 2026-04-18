import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

const repoRoot = 'C:/AbWork/AbWork-Website';
const showcasePath = path.join(
  repoRoot,
  'react-site',
  'src',
  'components',
  'landing',
  'ShowcaseSection.jsx'
);
const source = fs.readFileSync(showcasePath, 'utf8');

assert.match(
  source,
  /showcase-story/,
  'ShowcaseSection should render phone screens inside paired story blocks, not a tiny gallery.'
);

assert.match(
  source,
  /showcase-story__list/,
  'ShowcaseSection should render checklist-style supporting points for fast scanning.'
);

assert.match(
  source,
  /Dashboard that drives action/,
  'ShowcaseSection should keep screen-specific supporting copy.'
);

assert.match(
  source,
  /AI nutrition that feels useful in the moment/,
  'ShowcaseSection should pair the AI screen with descriptive product copy.'
);

assert.match(
  source,
  /Live habit signals/,
  'ShowcaseSection should include concise checklist bullets instead of paragraph-only explanations.'
);

console.log('showcase-pairing.test.mjs passed');
