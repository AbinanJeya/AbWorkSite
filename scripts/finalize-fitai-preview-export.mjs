import fs from 'node:fs';
import path from 'node:path';

const previewIndexPath = path.resolve('react-site/public/fitai-preview/index.html');

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

console.log(`finalized ${previewIndexPath}`);
