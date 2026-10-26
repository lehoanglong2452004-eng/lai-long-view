// Bố cục chart đã lưu, nằm trong data/layouts.json trên máy chạy Lai Long View,
// để mọi thiết bị mở vào cùng máy chủ (máy tính, điện thoại) thấy chung một danh sách.
import { mkdir, readFile, rename, writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';

const dir = fileURLToPath(new URL('../data/', import.meta.url));
const file = `${dir}layouts.json`;
const MAX_LAYOUTS = 50;
const MAX_BODY = 512 * 1024;

async function readAll() {
  try {
    const list = JSON.parse(await readFile(file, 'utf8'));
    return Array.isArray(list) ? list : [];
  } catch {
    return [];
  }
}

// Write to a temp file then rename, so a crash never leaves half a file.
async function writeAll(list) {
  await mkdir(dir, { recursive: true });
  await writeFile(`${file}.tmp`, JSON.stringify(list, null, 2), 'utf8');
  await rename(`${file}.tmp`, file);
}

function readBody(req) {
  return new Promise((resolve, reject) => {
    let size = 0;
    const chunks = [];
    req.on('data', (c) => {
      size += c.length;
      if (size > MAX_BODY) { reject(new Error('body too large')); req.destroy(); return; }
      chunks.push(c);
    });
    req.on('end', () => {
      try { resolve(JSON.parse(Buffer.concat(chunks).toString('utf8') || '{}')); } catch { reject(new Error('invalid JSON')); }
    });
    req.on('error', reject);
  });
}

function validLayout(body) {
  const name = typeof body?.name === 'string' ? body.name.trim().slice(0, 60) : '';
  const charts = body?.state?.charts;
  if (!name || !Array.isArray(charts) || charts.length < 1 || charts.length > 12) return null;
  if (!charts.every((c) => c && c.inst && Array.isArray(c.inst.sources) && typeof c.tf === 'string')) return null;
  return { name, savedAt: Date.now(), state: { charts, sync: !!body.state.sync, syncTf: body.state.syncTf } };
}

/** GET → list, POST {name, state} → save (replaces same name), DELETE ?name= → remove. Returns the list. */
export async function handleLayouts(req, url) {
  if (req.method === 'GET') return { status: 200, body: await readAll() };
  if (req.method === 'POST') {
    const layout = validLayout(await readBody(req));
    if (!layout) return { status: 400, body: { error: 'invalid layout' } };
    const list = (await readAll()).filter((l) => l.name !== layout.name);
    list.unshift(layout);
    await writeAll(list.slice(0, MAX_LAYOUTS));
    return { status: 200, body: list.slice(0, MAX_LAYOUTS) };
  }
  if (req.method === 'DELETE') {
    const name = url.searchParams.get('name');
    const list = (await readAll()).filter((l) => l.name !== name);
    await writeAll(list);
    return { status: 200, body: list };
  }
  return { status: 405, body: { error: 'method not allowed' } };
}
