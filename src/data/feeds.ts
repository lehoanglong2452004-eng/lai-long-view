import type { Bar } from '../engine/types';
import { TF_MS, type SourceId, type Status, type TF } from './types';

export interface History { bars: Bar[]; status?: Status; name?: string }

type OnBar = (b: Bar) => void;

const num = (x: unknown) => Number(x);

async function getJson<T = any>(url: string, init?: RequestInit): Promise<T> {
  const res = await fetch(url, init);
  if (!res.ok) {
    let msg = `${res.status}`;
    try { msg = (await res.json()).error || msg; } catch { /* keep status */ }
    throw new Error(msg);
  }
  return res.json() as Promise<T>;
}

/** WebSocket that reconnects with backoff and sends a keep-alive ping. */
function socket(url: string, onOpen: (ws: WebSocket) => void, onMsg: (data: any) => void, ping?: { every: number; msg: string }) {
  let ws: WebSocket | null = null;
  let closed = false;
  let retry = 0;
  let timer: ReturnType<typeof setInterval> | undefined;
  const connect = () => {
    if (closed) return;
    ws = new WebSocket(url);
    ws.onopen = () => {
      retry = 0;
      onOpen(ws!);
      if (ping) timer = setInterval(() => ws?.readyState === 1 && ws.send(ping.msg), ping.every);
    };
    ws.onmessage = (e) => {
      if (typeof e.data !== 'string' || e.data === 'pong') return;
      try { onMsg(JSON.parse(e.data)); } catch { /* ignore non-JSON frames */ }
    };
    ws.onclose = () => {
      clearInterval(timer);
      if (!closed) setTimeout(connect, Math.min(30_000, 1000 * 2 ** retry++));
    };
    ws.onerror = () => ws?.close();
  };
  connect();
  return () => { closed = true; clearInterval(timer); ws?.close(); };
}

function poll(fn: () => Promise<void>, every: number) {
  let stop = false;
  const tick = async () => {
    if (stop) return;
    try { await fn(); } catch { /* next tick retries */ }
    if (!stop) setTimeout(tick, every);
  };
  setTimeout(tick, every);
  return () => { stop = true; };
}

// ---------- Binance ----------

const BN_TF: Record<TF, string> = { '1m': '1m', '5m': '5m', '15m': '15m', '30m': '30m', '1H': '1h', '4H': '4h', '1D': '1d', '1W': '1w', '1M': '1M' };

const binance = (perp: boolean) => ({
  async history(symbol: string, tf: TF): Promise<History> {
    const base = perp ? 'https://fapi.binance.com/fapi/v1/klines' : 'https://api.binance.com/api/v3/klines';
    const rows = await getJson<any[]>(`${base}?symbol=${symbol}&interval=${BN_TF[tf]}&limit=${perp ? 1500 : 1000}`);
    return { bars: rows.map((r) => ({ t: r[0], o: num(r[1]), h: num(r[2]), l: num(r[3]), c: num(r[4]), v: num(r[5]) })), status: { mode: 'rt' } };
  },
  subscribe(symbol: string, tf: TF, onBar: OnBar) {
    // USDⓈ-M futures market streams are served under /market/ws (the old /ws route no longer pushes klines).
    const host = perp ? 'wss://fstream.binance.com/market/ws' : 'wss://stream.binance.com:9443/ws';
    return socket(`${host}/${symbol.toLowerCase()}@kline_${BN_TF[tf]}`, () => {}, (m) => {
      const k = m.k;
      if (k) onBar({ t: k.t, o: num(k.o), h: num(k.h), l: num(k.l), c: num(k.c), v: num(k.v) });
    });
  },
});

// ---------- OKX ----------

const OKX_TF: Record<TF, string> = { '1m': '1m', '5m': '5m', '15m': '15m', '30m': '30m', '1H': '1H', '4H': '4H', '1D': '1Dutc', '1W': '1Wutc', '1M': '1Mutc' };

const okx = (swap: boolean) => {
  // Spot: index 5 is volume in base currency. Swap: index 6 is volume in base currency (index 5 is contracts).
  const vi = swap ? 6 : 5;
  const row = (r: string[]): Bar => ({ t: num(r[0]), o: num(r[1]), h: num(r[2]), l: num(r[3]), c: num(r[4]), v: num(r[vi]) });
  return {
    async history(symbol: string, tf: TF): Promise<History> {
      const first = await getJson<{ data: string[][] }>(`https://www.okx.com/api/v5/market/candles?instId=${symbol}&bar=${OKX_TF[tf]}&limit=300`);
      const all = [...first.data];
      for (let page = 0; page < 5 && all.length; page++) {
        const after = all[all.length - 1][0];
        const more = await getJson<{ data: string[][] }>(`https://www.okx.com/api/v5/market/history-candles?instId=${symbol}&bar=${OKX_TF[tf]}&after=${after}&limit=100`);
        if (!more.data.length) break;
        all.push(...more.data);
      }
      return { bars: all.map(row).reverse(), status: { mode: 'rt' } };
    },
    subscribe(symbol: string, tf: TF, onBar: OnBar) {
      return socket('wss://ws.okx.com:8443/ws/v5/business', (ws) => {
        ws.send(JSON.stringify({ op: 'subscribe', args: [{ channel: `candle${OKX_TF[tf]}`, instId: symbol }] }));
      }, (m) => m.data?.forEach((r: string[]) => onBar(row(r))), { every: 25_000, msg: 'ping' });
    },
  };
};

// ---------- Bybit ----------

const BY_TF: Record<TF, string> = { '1m': '1', '5m': '5', '15m': '15', '30m': '30', '1H': '60', '4H': '240', '1D': 'D', '1W': 'W', '1M': 'M' };

const bybit = (linear: boolean) => ({
  async history(symbol: string, tf: TF): Promise<History> {
    const j = await getJson<any>(`https://api.bybit.com/v5/market/kline?category=${linear ? 'linear' : 'spot'}&symbol=${symbol}&interval=${BY_TF[tf]}&limit=1000`);
    const list: string[][] = j.result?.list || [];
    return { bars: list.map((r) => ({ t: num(r[0]), o: num(r[1]), h: num(r[2]), l: num(r[3]), c: num(r[4]), v: num(r[5]) })).reverse(), status: { mode: 'rt' } };
  },
  subscribe(symbol: string, tf: TF, onBar: OnBar) {
    return socket(`wss://stream.bybit.com/v5/public/${linear ? 'linear' : 'spot'}`, (ws) => {
      ws.send(JSON.stringify({ op: 'subscribe', args: [`kline.${BY_TF[tf]}.${symbol}`] }));
    }, (m) => m.data?.forEach?.((k: any) => onBar({ t: num(k.start), o: num(k.open), h: num(k.high), l: num(k.low), c: num(k.close), v: num(k.volume) })),
    { every: 20_000, msg: JSON.stringify({ op: 'ping' }) });
  },
});

// ---------- Hyperliquid ----------

const HL_TF: Record<TF, string> = { '1m': '1m', '5m': '5m', '15m': '15m', '30m': '30m', '1H': '1h', '4H': '4h', '1D': '1d', '1W': '1w', '1M': '1M' };
const hlBar = (k: any): Bar => ({ t: num(k.t), o: num(k.o), h: num(k.h), l: num(k.l), c: num(k.c), v: num(k.v) });

const hyperliquid = {
  async history(symbol: string, tf: TF): Promise<History> {
    const endTime = Date.now();
    const startTime = endTime - TF_MS[tf] * 1500;
    const rows = await getJson<any[]>('https://api.hyperliquid.xyz/info', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ type: 'candleSnapshot', req: { coin: symbol, interval: HL_TF[tf], startTime, endTime } }),
    });
    return { bars: rows.map(hlBar), status: { mode: 'rt' } };
  },
  subscribe(symbol: string, tf: TF, onBar: OnBar) {
    return socket('wss://api.hyperliquid.xyz/ws', (ws) => {
      ws.send(JSON.stringify({ method: 'subscribe', subscription: { type: 'candle', coin: symbol, interval: HL_TF[tf] } }));
    }, (m) => { if (m.channel === 'candle' && m.data) onBar(hlBar(m.data)); }, { every: 50_000, msg: JSON.stringify({ method: 'ping' }) });
  },
};

// ---------- Yahoo / Việt Nam (qua máy chủ cục bộ) ----------

const viaServer = (path: string) => ({
  async history(symbol: string, tf: TF): Promise<History> {
    const j = await getJson<any>(`/api/${path}?symbol=${encodeURIComponent(symbol)}&tf=${tf}`);
    return { bars: j.bars, status: j.meta?.status, name: j.meta?.name };
  },
  subscribe(symbol: string, tf: TF, onBar: OnBar) {
    return poll(async () => {
      const j = await getJson<any>(`/api/${path}?symbol=${encodeURIComponent(symbol)}&tf=${tf}`);
      (j.bars as Bar[]).slice(-2).forEach(onBar);
    }, 20_000);
  },
});

export interface Feed {
  history(symbol: string, tf: TF): Promise<History>;
  subscribe(symbol: string, tf: TF, onBar: OnBar): () => void;
}

export const FEEDS: Record<SourceId, Feed> = {
  binance: binance(false),
  'binance-perp': binance(true),
  okx: okx(false),
  'okx-swap': okx(true),
  bybit: bybit(false),
  'bybit-perp': bybit(true),
  hyperliquid,
  yahoo: viaServer('yahoo/chart'),
  vn: viaServer('vn/history'),
};

/** Merge a streamed bar into the series: replace the bar with the same open time or append a newer one. */
export function mergeBar(bars: Bar[], b: Bar): Bar[] {
  if (!Number.isFinite(b.c)) return bars;
  const last = bars[bars.length - 1];
  if (!last || b.t > last.t) return [...bars, b];
  if (b.t === last.t) {
    const next = bars.slice();
    next[next.length - 1] = b;
    return next;
  }
  return bars;
}
