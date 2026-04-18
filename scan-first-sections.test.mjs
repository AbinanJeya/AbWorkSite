import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

const repoRoot = 'C:/AbWork/AbWork-Website';
const signaturePath = path.join(
  repoRoot,
  'react-site',
  'src',
  'components',
  'landing',
  'SignatureFeaturesSection.jsx'
);
const trustPath = path.join(
  repoRoot,
  'react-site',
  'src',
  'components',
  'landing',
  'TrustSection.jsx'
);

const signatureSource = fs.readFileSync(signaturePath, 'utf8');
const trustSource = fs.readFileSync(trustPath, 'utf8');

assert.match(
  signatureSource,
  /signature-card__list/,
  'Signature features should use checklist-style lists instead of paragraph-heavy cards.'
);

assert.match(
  signatureSource,
  /Build your split fast/,
  'Signature features should use short, glanceable proof points.'
);

assert.match(
  trustSource,
  /trust-card__list/,
  'Trust section should use compact evidence lists instead of long body copy.'
);

assert.match(
  trustSource,
  /Real UI, not a concept render/,
  'Trust section should lead with concise product-proof bullets.'
);

console.log('scan-first-sections.test.mjs passed');
