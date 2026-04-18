import fs from 'node:fs';
import path from 'node:path';

const previewIndexPath = path.resolve('react-site/public/fitai-preview/index.html');
const previewBundleDir = path.resolve('react-site/public/fitai-preview/_expo/static/js/web');

if (!fs.existsSync(previewIndexPath)) {
  console.error(`FitAI preview export not found at ${previewIndexPath}`);
  process.exit(1);
}

const source = fs.readFileSync(previewIndexPath, 'utf8');
const rewritten = source
  .replace(/href="\/favicon\.ico"/g, 'href="./favicon.ico"')
  .replace(/src="\/_expo\//g, 'src="./_expo/');

if (rewritten !== source) {
  fs.writeFileSync(previewIndexPath, rewritten, 'utf8');
}

if (fs.existsSync(previewBundleDir)) {
  const bundleFiles = fs
    .readdirSync(previewBundleDir)
    .filter((fileName) => fileName.endsWith('.js'));

  for (const bundleFileName of bundleFiles) {
    const bundlePath = path.join(previewBundleDir, bundleFileName);
    const bundleSource = fs.readFileSync(bundlePath, 'utf8');
    const rewrittenBundle = bundleSource.replace(/(["'])\/assets\//g, '$1./assets/');

    if (rewrittenBundle !== bundleSource) {
      fs.writeFileSync(bundlePath, rewrittenBundle, 'utf8');
    }
  }
}

console.log(`finalized ${previewIndexPath}`);
