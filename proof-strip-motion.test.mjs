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
  'ActionProofSection.jsx'
);
const source = fs.readFileSync(proofPath, 'utf8');

assert.match(
  source,
  /FitAiPreview/,
  'ActionProofSection should use the real preview component for the workout panel instead of a mockup.'
);

assert.match(
  source,
  /previewRoute:\s*'Workout'/,
  'ActionProofSection should open the embedded preview directly on the Workout route.'
);

assert.match(
  source,
  /previewScene:\s*'active-workout'/,
  'ActionProofSection should request the dedicated active-workout preview scene.'
);

assert.match(
  source,
  /exerciseDatabase/,
  'ActionProofSection should reuse the real local exercise database.'
);

assert.match(
  source,
  /action-proof__preview-shell/,
  'ActionProofSection should dedicate the workout side to a real preview shell.'
);

assert.match(
  source,
  /action-proof__results/,
  'ActionProofSection should render searchable exercise results alongside the workout demo.'
);

console.log('proof-strip-motion.test.mjs passed');
