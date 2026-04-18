import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

const repoRoot = 'C:/AbWork/AbWork-Website';
const appPath = path.join(repoRoot, 'react-site', 'src', 'App.jsx');
const appSource = fs.readFileSync(appPath, 'utf8');
const landingDir = path.join(repoRoot, 'react-site', 'src', 'components', 'landing');
const landingSources = fs
  .readdirSync(landingDir)
  .filter((fileName) => fileName.endsWith('.jsx'))
  .map((fileName) => fs.readFileSync(path.join(landingDir, fileName), 'utf8'))
  .join('\n');

const requiredComponents = [
  'NavBar',
  'HeroSection',
  'ProofStripSection',
  'SignatureFeaturesSection',
  'ShowcaseSection',
  'WhyItSticksSection',
  'TrustSection',
  'DownloadSection',
  'FooterSection',
];

for (const componentName of requiredComponents) {
  assert.match(
    appSource,
    new RegExp(`import\\s+${componentName}\\s+from\\s+'\\.\\/components\\/landing\\/${componentName}\\.jsx';`),
    `App should import ${componentName} from the landing components directory.`
  );

  assert.match(
    appSource,
    new RegExp(`<${componentName}`),
    `App should render ${componentName} as part of the premium launch funnel.`
  );
}

assert.match(
  landingSources,
  /Download APK/,
  'The premium launch site should make Download APK the primary conversion language.'
);

for (const relativePath of requiredComponents.map(
  (componentName) => ['react-site', 'src', 'components', 'landing', `${componentName}.jsx`]
)) {
  const componentPath = path.join(repoRoot, ...relativePath);
  assert.ok(fs.existsSync(componentPath), `${componentPath} should exist.`);
}

console.log('premium-launch-site.test.mjs passed');
