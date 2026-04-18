import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

const repoRoot = 'C:/AbWork/AbWork-Website';
const proofPath = path.join(
  repoRoot,
  'react-site',
  'src',
  'components',
  'landing',
  'ProofStripSection.jsx'
);
const source = fs.readFileSync(proofPath, 'utf8');

assert.match(
  source,
  /proof-strip__experience/,
  'ProofStripSection should render a motion-led proof experience instead of only text cards.'
);

assert.match(
  source,
  /proof-strip__stack-item/,
  'ProofStripSection should visualize the scattered tool stack with animated items.'
);

assert.match(
  source,
  /proof-strip__checklist/,
  'ProofStripSection should include scan-friendly checklist proof points.'
);

assert.match(
  source,
  /One place to train/,
  'ProofStripSection should replace long card copy with concise, glanceable proof points.'
);

console.log('proof-strip-motion.test.mjs passed');
