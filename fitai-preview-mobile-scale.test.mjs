import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

const repoRoot = 'C:/AbWork/AbWork-Website';
const previewComponentPath = path.join(repoRoot, 'react-site', 'src', 'components', 'FitAiPreview.jsx');
const source = fs.readFileSync(previewComponentPath, 'utf8');

assert.match(
  source,
  /PREVIEW_VIEWPORT_WIDTH\s*=\s*390/,
  'FitAiPreview should keep a canonical mobile preview width.'
);

assert.match(
  source,
  /PREVIEW_VIEWPORT_HEIGHT\s*=\s*844/,
  'FitAiPreview should keep a canonical mobile preview height.'
);

assert.match(
  source,
  /new ResizeObserver\(/,
  'FitAiPreview should observe the phone shell size so it can scale the preview viewport.'
);

assert.match(
  source,
  /transform:\s*`scale\(\$\{scale\}\)`/,
  'FitAiPreview should scale the embedded preview instead of forcing the Expo app to reflow to the shell size.'
);

console.log('fitai-preview-mobile-scale.test.mjs passed');
