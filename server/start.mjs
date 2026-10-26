// Chạy bản đã build: `npm run build` rồi `npm start`, mở http://localhost:5173 (cổng của cửa sổ app Lai Long View)
import { spawn } from 'node:child_process';
import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import { extname, join, normalize as normPath } from 'node:path';
import { fileURLToPath } from 'node:url';
import { apiMiddleware } from './api.mjs';

const root = fileURLToPath(new URL('../dist/', import.meta.url));
const port = Number(process.env.PORT || 5173);
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
}).listen(port, '127.0.0.1', () => {
  const url = `http://localhost:${port}`;
  console.log(`Lai Long View: ${url}`);
  // `--open` (used by "Mo Lai Long View.cmd") opens the browser once the server is listening.
  if (process.argv.includes('--open') && !process.env.LL_NO_OPEN) {
    const [cmd, args] = process.platform === 'win32' ? ['cmd', ['/c', 'start', '', url]] : process.platform === 'darwin' ? ['open', [url]] : ['xdg-open', [url]];
    spawn(cmd, args, { stdio: 'ignore', detached: true }).unref();
  }
}).on('error', (e) => {
  console.error(e.code === 'EADDRINUSE' ? `Cổng ${port} đang bận: có thể Lai Long View đã chạy sẵn, mở ${`http://localhost:${port}`}` : e.message);
  // Exit code 3 tells server/chay-ngam.cmd another copy already serves the port, so it must not restart.
  process.exit(e.code === 'EADDRINUSE' ? 3 : 1);
});
