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
const proof = readLanding('ActionProofSection.jsx');
const showcase = readLanding('ShowcaseSection.jsx');
const sticks = readLanding('WhyItSticksSection.jsx');
const trust = readLanding('TrustSection.jsx');
const download = readLanding('DownloadSection.jsx');
const footer = readLanding('FooterSection.jsx');

assert.match(
  hero,
  /workouts, meals, steps, and recovery stay in sync/i,
  'Hero should own the high-level sync value proposition in a concise way.'
);

assert.match(
  trust,
  /The product proves the pitch in seconds/i,
  'Trust section should focus on proof and credibility, not repeat the product positioning.'
);

assert.match(
  sticks,
  /When logging feels light, staying on plan feels easier to repeat/i,
  'Why it sticks should focus on retention behavior, not re-explain the feature stack.'
);

assert.match(
  footer,
  /Workouts, nutrition, movement, and recovery in sync/i,
  'Footer should end on a concise brand summary instead of restating the whole pitch.'
);

assert.doesNotMatch(
  proof,
  /One daily fitness loop/i,
  'Action proof should not repeat the hero headline.'
);

assert.doesNotMatch(
  proof,
  /Everything finally moves together/i,
  'Action proof should replace the old abstract loop message with concrete product action.'
);

assert.match(
  proof,
  /Watch a set land\.\s*Search the full exercise library\./i,
  'Action proof should lead with a tight visual-first headline.'
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
