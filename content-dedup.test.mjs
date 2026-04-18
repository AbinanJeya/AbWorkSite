import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

const repoRoot = 'C:/AbWork/AbWork-Website';

function readLanding(name) {
  return fs.readFileSync(
    path.join(repoRoot, 'react-site', 'src', 'components', 'landing', name),
    'utf8'
  );
}

const hero = readLanding('HeroSection.jsx');
const proof = readLanding('ProofStripSection.jsx');
const signature = readLanding('SignatureFeaturesSection.jsx');
const showcase = readLanding('ShowcaseSection.jsx');
const sticks = readLanding('WhyItSticksSection.jsx');
const trust = readLanding('TrustSection.jsx');
const download = readLanding('DownloadSection.jsx');
const footer = readLanding('FooterSection.jsx');

assert.match(
  hero,
  /training, food, and progress in sync/i,
  'Hero should own the high-level sync value proposition in a concise way.'
);

assert.match(
  signature,
  /core behaviors that make the app useful every day/i,
  'Signature section should focus on everyday usefulness instead of repeating the whole-system pitch.'
);

assert.match(
  trust,
  /Trust should come from seeing the product move/i,
  'Trust section should focus on proof and credibility, not repeat the product positioning.'
);

assert.match(
  sticks,
  /Quicker check-ins lower the odds of falling off/i,
  'Why it sticks should focus on retention behavior, not re-explain the feature stack.'
);

assert.match(
  footer,
  /Workouts, nutrition, movement, and recovery in sync/i,
  'Footer should end on a concise brand summary instead of restating the whole pitch.'
);

assert.doesNotMatch(
  signature,
  /complete system than a basic tracker/i,
  'Signature section should not repeat the same system-level positioning from other sections.'
);

assert.doesNotMatch(
  proof,
  /finally feel like one system/i,
  'Proof section should avoid repeating the exact one-system phrasing from the hero.'
);

assert.doesNotMatch(
  footer,
  /whole system moving together/i,
  'Footer should avoid reusing the older whole-system phrasing.'
);

assert.match(
  showcase,
  /daily visibility,\s*smoother training flow,\s*and\s*AI help in the moment/i,
  'Showcase section should stay focused on interface-level experience.'
);

assert.match(
  download,
  /Android is the live entry point today/i,
  'Download section should stay focused on the current install path.'
);

console.log('content-dedup.test.mjs passed');
