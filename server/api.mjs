// Máy chủ dữ liệu cục bộ: proxy Yahoo Finance và VNDirect (không cho gọi thẳng từ trình duyệt),
// và tìm kiếm mã gộp từ mọi nguồn. Chỉ dùng cá nhân.
import { CATALOG } from './catalog.mjs';
import { handleLayouts } from './layouts.mjs';
import { OPTION_COINS, optionsSnapshot } from './options.mjs';

const UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130 Safari/537.36';
const HOUR = 3600_000;

// Độ trễ (phút) Yahoo công bố theo mã sàn; 0 = realtime. Nguồn: help.yahoo.com/kb/SLN2310.html
export const YAHOO_DELAY = {
  CMX: 30, NYM: 30, NYB: 30, CME: 10, CBT: 10,
  CCY: 0, CCC: 0, SNP: 0, DJI: 0, NIM: 0, NMS: 0, NGM: 0, NCM: 0, NYQ: 0, PCX: 0, ASE: 0, BTS: 0,
  CGI: 15, WCB: 15, NYS: 15, VSE: 15, HKG: 15, GER: 15, FGI: 15, LSE: 20, OSA: 30, JPX: 20,
  TOR: 0, VAN: 0, NSI: 0, BSE: 15, KSC: 20, KOE: 20, TAI: 20, SHH: 30, SHZ: 30, ASX: 20, SES: 20,
};

const cache = new Map();
async function cached(key, ttl, fn) {
  const hit = cache.get(key);
  if (hit && Date.now() - hit.at < ttl) return hit.value;
  const value = await fn();
  cache.set(key, { at: Date.now(), value });
  return value;
}

async function getJson(url, init = {}) {
  const res = await fetch(url, { ...init, headers: { 'User-Agent': UA, Accept: '*/*', ...(init.headers || {}) }, signal: AbortSignal.timeout(12_000) });
  if (!res.ok) throw new Error(`${res.status} ${url}`);
  return res.json();
}

export function normalize(s) {
  return String(s).toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/đ/g, 'd').trim();
}

// ---------- Yahoo ----------

const YAHOO_TF = {
  '1m': ['1m', '7d'], '5m': ['5m', '60d'], '15m': ['15m', '60d'], '30m': ['30m', '60d'],
  // range=max makes Yahoo fall back to 3-month bars, so weekly/monthly use the longest range that keeps them.
  '1H': ['60m', '730d'], '4H': ['60m', '730d'], '1D': ['1d', '10y'], '1W': ['1wk', '20y'], '1M': ['1mo', '50y'],
};

const WEEK = 7 * 24 * HOUR;
const MONDAY = 4 * 24 * HOUR; // 1970-01-05, the first Monday after the epoch

/** Bucket start for fixed-length buckets, or calendar weeks (Monday, UTC) and months. */
function bucketOf(t, size) {
  if (size === 'W') return Math.floor((t - MONDAY) / WEEK) * WEEK + MONDAY;
  if (size === 'M') { const d = new Date(t); return Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), 1); }
  return Math.floor(t / size) * size;
}

export function aggregate(bars, size) {
  const out = [];
  for (const b of bars) {
    const t = bucketOf(b.t, size);
    const last = out[out.length - 1];
    if (last && last.t === t) {
      last.h = Math.max(last.h, b.h); last.l = Math.min(last.l, b.l); last.c = b.c; last.v += b.v;
    } else out.push({ ...b, t });
  }
  return out;
}

async function yahooChart(symbol, tf) {
  const [interval, range] = YAHOO_TF[tf] || YAHOO_TF['1D'];
  const url = `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(symbol)}?interval=${interval}&range=${range}&includePrePost=false`;
  const j = await getJson(url);
  const r = j?.chart?.result?.[0];
  if (!r) throw new Error(j?.chart?.error?.description || 'Yahoo: no data');
  const q = r.indicators?.quote?.[0] || {};
  const ts = r.timestamp || [];
  let bars = [];
  for (let k = 0; k < ts.length; k++) {
    const o = q.open?.[k], h = q.high?.[k], l = q.low?.[k], c = q.close?.[k];
    if (o == null || h == null || l == null || c == null) continue;
    bars.push({ t: ts[k] * 1000, o, h, l, c, v: q.volume?.[k] || 0 });
  }
  if (tf === '4H') bars = aggregate(bars, 4 * HOUR);
  const m = r.meta || {};
  const delay = YAHOO_DELAY[m.exchangeName];
  return {
    bars: bars.slice(-3000),
    meta: {
      name: m.longName || m.shortName || symbol,
      exchange: m.fullExchangeName || m.exchangeName,
      type: m.instrumentType,
      currency: m.currency,
      status: delay === undefined ? { mode: 'unknown' } : delay === 0 ? { mode: 'rt' } : { mode: 'delay', delayMin: delay },
    },
  };
}

const YAHOO_KIND = { EQUITY: 'stock', ETF: 'etf', INDEX: 'index', CURRENCY: 'forex', FUTURE: 'future', CRYPTOCURRENCY: 'crypto', MUTUALFUND: 'fund' };

async function yahooSearch(q) {
  const j = await getJson(`https://query1.finance.yahoo.com/v1/finance/search?q=${encodeURIComponent(q)}&quotesCount=12&newsCount=0&listsCount=0`);
  return (j.quotes || []).filter((x) => x.symbol && x.quoteType !== 'OPTION').map((x) => {
    const delay = YAHOO_DELAY[x.exchange];
    return {
      key: `yahoo:${x.symbol}`,
      kind: YAHOO_KIND[x.quoteType] || 'other',
      vi: x.longname || x.shortname || x.symbol,
      en: x.longname || x.shortname || x.symbol,
      display: x.symbol,
      sources: [{ source: 'yahoo', symbol: x.symbol, note: x.exchDisp, status: delay === undefined ? { mode: 'unknown' } : delay === 0 ? { mode: 'rt' } : { mode: 'delay', delayMin: delay } }],
    };
  });
}

// ---------- Việt Nam (VNDirect dchart) ----------

// dchart has no weekly/monthly resolution: those are built from daily bars.
const VN_RES = { '1m': '1', '5m': '5', '15m': '15', '30m': '30', '1H': '60', '4H': '60', '1D': 'D', '1W': 'D', '1M': 'D' };
// dchart trả 406 nếu khoảng intraday quá dài (> ~120 ngày với nến 60 phút).
const VN_SPAN_DAYS = { '1m': 5, '5m': 20, '15m': 40, '30m': 60, '1H': 120, '4H': 120, '1D': 3650, '1W': 7300, '1M': 9000 };

async function vnHistory(symbol, tf) {
  const to = Math.floor(Date.now() / 1000);
  const from = to - (VN_SPAN_DAYS[tf] || 365) * 86400;
  const j = await getJson(`https://dchart-api.vndirect.com.vn/dchart/history?resolution=${VN_RES[tf] || 'D'}&symbol=${encodeURIComponent(symbol)}&from=${from}&to=${to}`);
  let bars = (j.t || []).map((t, k) => ({ t: t * 1000, o: j.o[k], h: j.h[k], l: j.l[k], c: j.c[k], v: j.v?.[k] || 0 }));
  if (tf === '4H') bars = aggregate(bars, 4 * HOUR);
  if (tf === '1W') bars = aggregate(bars, 'W');
  if (tf === '1M') bars = aggregate(bars, 'M');
  return { bars: bars.slice(-3000), meta: { name: symbol, exchange: 'VN', status: { mode: 'unknown' } } };
}

async function vnSearch(q) {
  const j = await getJson(`https://dchart-api.vndirect.com.vn/dchart/search?limit=8&query=${encodeURIComponent(q)}&type=&exchange=`);
  return (j || []).map((x) => ({
    key: `vn:${x.symbol}`,
    kind: /CHỈ SỐ/i.test(x.type) ? 'index' : /PHIẾU/i.test(x.type) ? 'stock' : 'other',
    vi: `${x.description} (${x.exchange})`,
    en: `${x.description} (${x.exchange})`,
    display: x.symbol,
    sources: [{ source: 'vn', symbol: x.symbol, note: x.exchange, status: { mode: 'unknown' } }],
  }));
}

// ---------- Danh sách mã crypto ----------

async function cryptoMarkets() {
  return cached('crypto-markets', 24 * HOUR, async () => {
    const list = [];
    const add = (source, symbol, base, quote) => list.push({ source, symbol, base: base.toUpperCase(), quote: quote.toUpperCase() });
    const jobs = [
      getJson('https://api.binance.com/api/v3/exchangeInfo?symbolStatus=TRADING&showPermissionSets=false').then((j) => j.symbols.forEach((s) => add('binance', s.symbol, s.baseAsset, s.quoteAsset))),
      getJson('https://fapi.binance.com/fapi/v1/exchangeInfo').then((j) => j.symbols.filter((s) => s.status === 'TRADING' && s.contractType === 'PERPETUAL').forEach((s) => add('binance-perp', s.symbol, s.baseAsset, s.quoteAsset))),
      getJson('https://www.okx.com/api/v5/public/instruments?instType=SPOT').then((j) => j.data.filter((s) => s.state === 'live').forEach((s) => add('okx', s.instId, s.baseCcy, s.quoteCcy))),
      getJson('https://www.okx.com/api/v5/public/instruments?instType=SWAP').then((j) => j.data.filter((s) => s.state === 'live').forEach((s) => { const [b, qt] = s.instId.split('-'); add('okx-swap', s.instId, b, qt); })),
      bybitAll('spot').then((xs) => xs.forEach((s) => add('bybit', s.symbol, s.baseCoin, s.quoteCoin))),
      bybitAll('linear').then((xs) => xs.filter((s) => s.contractType === 'LinearPerpetual').forEach((s) => add('bybit-perp', s.symbol, s.baseCoin, s.quoteCoin))),
      getJson('https://api.hyperliquid.xyz/info', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ type: 'meta' }) })
        .then((j) => j.universe.filter((u) => !u.isDelisted).forEach((u) => add('hyperliquid', u.name, u.name, 'USD'))),
      getJson('https://api.hyperliquid.xyz/info', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ type: 'meta', dex: 'xyz' }) })
        .then((j) => j.universe.filter((u) => !u.isDelisted).forEach((u) => add('hyperliquid', u.name, u.name.replace(/^xyz:/, ''), 'USD'))),
    ];
    const settled = await Promise.allSettled(jobs);
    settled.filter((s) => s.status === 'rejected').forEach((s) => console.warn('[catalog]', s.reason?.message));
    return list;
  });
}

async function bybitAll(category) {
  const out = [];
  let cursor = '';
  for (let page = 0; page < 5; page++) {
    const j = await getJson(`https://api.bybit.com/v5/market/instruments-info?category=${category}&limit=1000${cursor ? `&cursor=${encodeURIComponent(cursor)}` : ''}`);
    out.push(...(j.result?.list || []).filter((s) => s.status === 'Trading'));
    cursor = j.result?.nextPageCursor;
    if (!cursor) break;
  }
  return out;
}

const SOURCE_ORDER = ['binance', 'binance-perp', 'okx', 'okx-swap', 'bybit', 'bybit-perp', 'hyperliquid'];
const QUOTE_ORDER = ['USDT', 'USD', 'USDC', 'FDUSD', 'BTC', 'ETH'];

async function cryptoSearch(q) {
  // Vietnamese words ("bạc", "dầu") are names, not tickers.
  if (normalize(q) !== q.toLowerCase().trim()) return [];
  const markets = await cryptoMarkets();
  const Q = q.toUpperCase().replace(/[^A-Z0-9:]/g, '');
  if (!Q) return [];
  const groups = new Map();
  for (const m of markets) {
    const flat = m.symbol.toUpperCase().replace(/[^A-Z0-9:]/g, '');
    const hit = m.base === Q ? 0 : flat === Q || `${m.base}${m.quote}` === Q ? 0 : m.base.startsWith(Q) ? 1 : flat.startsWith(Q) ? 2 : -1;
    if (hit < 0) continue;
    const quote = m.source === 'hyperliquid' ? 'USDT' : m.quote; // Hyperliquid USD perps sit with USDT pairs
    const key = `${m.base}${quote}`;
    const g = groups.get(key) || { key: `crypto:${key}`, kind: 'crypto', vi: `${m.base} / ${quote}`, en: `${m.base} / ${quote}`, display: key, rank: hit * 10 + Math.max(0, QUOTE_ORDER.indexOf(quote)) + (QUOTE_ORDER.includes(quote) ? 0 : 8), sources: [] };
    g.sources.push({ source: m.source, symbol: m.symbol, status: { mode: 'rt' } });
    groups.set(key, g);
  }
  return [...groups.values()]
    .sort((a, b) => a.rank - b.rank)
    .slice(0, 12)
    .map(({ rank, ...g }) => ({ ...g, sources: g.sources.sort((a, b) => SOURCE_ORDER.indexOf(a.source) - SOURCE_ORDER.indexOf(b.source)) }));
}

function catalogSearch(q) {
  const nq = normalize(q);
  const out = [];
  for (const c of CATALOG) {
    const names = [normalize(c.vi), normalize(c.en), normalize(c.key)];
    const exact = c.q.includes(nq) || names.includes(nq);
    const prefix = c.q.some((x) => x.startsWith(nq)) || names.some((x) => x.startsWith(nq) || x.includes(` ${nq}`));
    const symbolHit = c.sources.some((s) => normalize(s.symbol).replace(/^xyz:/, '') === nq);
    if (exact || symbolHit || (nq.length >= 2 && prefix)) out.push({ rank: exact || symbolHit ? 0 : 1, item: c });
  }
  return out.sort((a, b) => a.rank - b.rank).map(({ item }) => catalogResult(item));
}

function catalogResult(item) {
  return {
    key: `cat:${item.key}`,
    kind: item.kind,
    vi: item.vi,
    en: item.en,
    display: item.key,
    sources: item.sources.map((s) => ({ ...s, status: statusOf(s.source, s.symbol) })),
  };
}

function statusOf(source, symbol) {
  if (source === 'yahoo') {
    if (/=X$/.test(symbol)) return { mode: 'rt' };
    if (/\.NYB$/.test(symbol) || /^(GC|SI|HG|PL|PA|CL|BZ|NG|KC|SB|CT|CC)=F$/.test(symbol)) return { mode: 'delay', delayMin: 30 };
    if (/^(ES|NQ|YM|ZC|ZS|ZW|ZN)=F$/.test(symbol)) return { mode: 'delay', delayMin: 10 };
    if (/^\^(GSPC|DJI|NDX)$/.test(symbol) || symbol === 'UUP') return { mode: 'rt' };
    if (/^\^(VIX|TNX|TYX|FVX)$/.test(symbol)) return { mode: 'delay', delayMin: 15 };
    if (/^\^N225$/.test(symbol)) return { mode: 'delay', delayMin: 30 };
    if (/^\^/.test(symbol)) return { mode: 'delay', delayMin: 15 };
    return { mode: 'unknown' };
  }
  if (source === 'vn') return { mode: 'unknown' };
  return { mode: 'rt' };
}

async function search(q) {
  q = String(q || '').trim();
  if (!q) return CATALOG.slice(0, 12).map(catalogResult);
  const [cat, crypto, yahoo, vn] = await Promise.all([
    Promise.resolve(catalogSearch(q)),
    cryptoSearch(q).catch(() => []),
    cached(`ys:${normalize(q)}`, HOUR, () => yahooSearch(q)).catch(() => []),
    q.length >= 2 ? cached(`vs:${normalize(q)}`, HOUR, () => vnSearch(q)).catch(() => []) : [],
  ]);
  const seen = new Set();
  const out = [];
  for (const r of [...cat, ...crypto, ...yahoo, ...vn]) {
    const id = r.sources.map((s) => `${s.source}:${s.symbol}`).join('|');
    if (seen.has(id)) continue;
    seen.add(id);
    out.push(r);
  }
  return out.slice(0, 40);
}

// ---------- HTTP ----------

function send(res, code, body) {
  res.statusCode = code;
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  res.setHeader('Cache-Control', 'no-store');
  res.end(JSON.stringify(body));
}

export async function apiMiddleware(req, res, next) {
  if (!req.url || !req.url.startsWith('/api/')) return next();
  const url = new URL(req.url, 'http://local');
  const p = url.searchParams;
  try {
    if (url.pathname === '/api/search') return send(res, 200, await search(p.get('q')));
    if (url.pathname === '/api/catalog') return send(res, 200, CATALOG.map(catalogResult));
    if (url.pathname === '/api/options') {
      const coin = String(p.get('coin') || '').toUpperCase();
      if (!OPTION_COINS.includes(coin)) return send(res, 400, { error: 'unsupported coin' });
      return send(res, 200, await cached(`opt:${coin}`, 60_000, () => optionsSnapshot(coin, getJson)));
    }
    if (url.pathname === '/api/layouts') {
      const r = await handleLayouts(req, url);
      return send(res, r.status, r.body);
    }
    if (url.pathname === '/api/yahoo/chart') {
      const sym = p.get('symbol'), tf = p.get('tf') || '1D';
      return send(res, 200, await cached(`yc:${sym}:${tf}`, 10_000, () => yahooChart(sym, tf)));
    }
    if (url.pathname === '/api/vn/history') {
      const sym = p.get('symbol'), tf = p.get('tf') || '1D';
      return send(res, 200, await cached(`vn:${sym}:${tf}`, 10_000, () => vnHistory(sym, tf)));
    }
    return send(res, 404, { error: 'not found' });
  } catch (e) {
    return send(res, 502, { error: String(e?.message || e) });
  }
}
