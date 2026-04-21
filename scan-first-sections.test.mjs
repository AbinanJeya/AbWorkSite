import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

const repoRoot = 'C:/AbWork/AbWork-Website';
const trustPath = path.join(
  repoRoot,
  'react-site',
  'src',
  'components',
  'landing',
  'TrustSection.jsx'
);
const actionProofPath = path.join(
  repoRoot,
  'react-site',
  'src',
  'components',
  'landing',
  'ActionProofSection.jsx'
);
const stickPath = path.join(
  repoRoot,
  'react-site',
  'src',
  'components',
  'landing',
  'WhyItSticksSection.jsx'
);
const showcasePath = path.join(
  repoRoot,
  'react-site',
  'src',
  'components',
  'landing',
  'ShowcaseSection.jsx'
);

const trustSource = fs.readFileSync(trustPath, 'utf8');
const actionProofSource = fs.readFileSync(actionProofPath, 'utf8');
const stickSource = fs.readFileSync(stickPath, 'utf8');
const showcaseSource = fs.readFileSync(showcasePath, 'utf8');

assert.match(
  actionProofSource,
  /Watch a set land\.\s*Search the full exercise library\./i,
  'Action proof should open with a short visual-first headline.'
);

assert.match(
  actionProofSource,
  /action-proof__panel--workout/,
  'Action proof should dedicate one panel to the live workout logging demo.'
);

assert.match(
  actionProofSource,
  /action-proof__panel--search/,
  'Action proof should dedicate one panel to the real exercise database search.'
);

assert.match(
  trustSource,
  /trust-board/,
  'Trust section should use a more visual proof board instead of plain text cards.'
);

assert.match(
  trustSource,
  /trust-board__metric/,
  'Trust section should include scan-first proof metrics inside each evidence card.'
);

assert.match(
  trustSource,
  /The product proves the pitch in seconds/,
  'Trust section should lead with a shorter, more visual-first headline.'
);

assert.match(
  stickSource,
  /stick-card__metric/,
  'WhyItSticksSection should use compact visual metrics instead of paragraph-heavy cards.'
);

assert.match(
  stickSource,
  /Fast daily check-ins/,
  'WhyItSticksSection should keep the consistency story in short, glanceable cards.'
);

assert.match(
  showcaseSource,
  /daily visibility,\s*smoother training flow,\s*and\s*AI help in the moment/i,
  'Showcase section should carry the product story that used to be repeated in the removed section.'
);

console.log('scan-first-sections.test.mjs passed');
