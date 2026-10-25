// Chạy bản đã build: `npm run build` rồi `npm start`, mở http://localhost:4173
import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import { extname, join, normalize as normPath } from 'node:path';
import { fileURLToPath } from 'node:url';
import { apiMiddleware } from './api.mjs';

const root = fileURLToPath(new URL('../dist/', import.meta.url));
const port = Number(process.env.PORT || 4173);
const TYPES = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript', '.css': 'text/css', '.svg': 'image/svg+xml', '.png': 'image/png', '.webp': 'image/webp', '.woff2': 'font/woff2', '.woff': 'font/woff', '.json': 'application/json' };

createServer((req, res) => {
  apiMiddleware(req, res, async () => {
    const path = normPath(decodeURIComponent(new URL(req.url, 'http://local').pathname)).replace(/^([/\\])+/, '');
    const file = join(root, path || 'index.html');
    if (!file.startsWith(root)) { res.statusCode = 403; return res.end(); }
    try {
      const body = await readFile(file);
      res.setHeader('Content-Type', TYPES[extname(file)] || 'application/octet-stream');
      res.end(body);
    } catch {
      res.setHeader('Content-Type', TYPES['.html']);
      res.end(await readFile(join(root, 'index.html')));
    }
  });
}).listen(port, '127.0.0.1', () => console.log(`Lai Long View: http://localhost:${port}`));
