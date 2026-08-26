import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.dirname(fileURLToPath(import.meta.url));
const html = fs.readFileSync(path.join(root, 'index.html'));
const port = Number(process.env.PORT || 3000);

http.createServer((req, res) => {
  if (req.method !== 'GET' || (req.url !== '/' && req.url !== '/index.html')) {
    res.writeHead(404, { 'content-type': 'text/plain; charset=utf-8' });
    res.end('Not found');
    return;
  }
  res.writeHead(200, {
    'content-type': 'text/html; charset=utf-8',
    'cache-control': 'no-cache',
    'x-content-type-options': 'nosniff'
  });
  res.end(html);
}).listen(port, '0.0.0.0');
