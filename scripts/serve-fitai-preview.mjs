import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';

const host = '127.0.0.1';
const port = 8081;
const rootDir = path.resolve('react-site/public/fitai-preview');

const mimeTypes = new Map([
  ['.css', 'text/css; charset=utf-8'],
  ['.html', 'text/html; charset=utf-8'],
  ['.ico', 'image/x-icon'],
  ['.js', 'application/javascript; charset=utf-8'],
  ['.json', 'application/json; charset=utf-8'],
  ['.map', 'application/json; charset=utf-8'],
  ['.png', 'image/png'],
  ['.svg', 'image/svg+xml'],
  ['.ttf', 'font/ttf'],
  ['.txt', 'text/plain; charset=utf-8'],
  ['.woff', 'font/woff'],
  ['.woff2', 'font/woff2'],
]);

function sendFile(response, filePath) {
  const ext = path.extname(filePath);
  const contentType = mimeTypes.get(ext) || 'application/octet-stream';

  response.writeHead(200, { 'Content-Type': contentType });
  fs.createReadStream(filePath).pipe(response);
}

function sendNotFound(response) {
  response.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
  response.end('Not found');
}

if (!fs.existsSync(rootDir)) {
  console.error(`FitAI preview bundle not found at ${rootDir}`);
  process.exit(1);
}

const server = http.createServer((request, response) => {
  const requestUrl = new URL(request.url || '/', `http://${host}:${port}`);
  const requestPath = decodeURIComponent(requestUrl.pathname);
  const safePath = path.normalize(requestPath).replace(/^(\.\.[/\\])+/, '');
  let filePath = path.join(rootDir, safePath);

  if (!filePath.startsWith(rootDir)) {
    sendNotFound(response);
    return;
  }

  if (fs.existsSync(filePath) && fs.statSync(filePath).isDirectory()) {
    filePath = path.join(filePath, 'index.html');
  }

  if (!fs.existsSync(filePath)) {
    const spaFallback = path.join(rootDir, 'index.html');
    if (fs.existsSync(spaFallback)) {
      sendFile(response, spaFallback);
      return;
    }

    sendNotFound(response);
    return;
  }

  sendFile(response, filePath);
});

server.listen(port, host, () => {
  console.log(`FitAI preview available at http://${host}:${port}/`);
});
