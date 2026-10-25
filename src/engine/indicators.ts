import type { Bar } from './types';

export function sma(src: number[], len: number): number[] {
  const out = new Array<number>(src.length).fill(NaN);
  let sum = 0;
  for (let i = 0; i < src.length; i++) {
    sum += src[i];
    if (i >= len) sum -= src[i - len];
    if (i >= len - 1) out[i] = sum / len;
  }
  return out;
}

export function ema(src: number[], len: number): number[] {
  const out = new Array<number>(src.length).fill(NaN);
  const k = 2 / (len + 1);
  let prev = NaN;
  for (let i = 0; i < src.length; i++) {
    prev = Number.isNaN(prev) ? src[i] : src[i] * k + prev * (1 - k);
    out[i] = prev;
  }
  return out;
}

/** Wilder ATR (RMA of true range), matching Pine's ta.atr. */
export function atr(bars: Bar[], len: number): number[] {
  const out = new Array<number>(bars.length).fill(NaN);
  let prev = NaN;
  let seed = 0;
  for (let i = 0; i < bars.length; i++) {
    const b = bars[i];
    const tr = i === 0 ? b.h - b.l : Math.max(b.h - b.l, Math.abs(b.h - bars[i - 1].c), Math.abs(b.l - bars[i - 1].c));
    if (i < len) {
      seed += tr;
      if (i === len - 1) prev = seed / len;
    } else {
      prev = (prev * (len - 1) + tr) / len;
    }
    out[i] = Number.isNaN(prev) ? (i > 0 ? seed / (i + 1) : tr) : prev;
  }
  return out;
}

export function stdev(src: number[], len: number): number[] {
  const out = new Array<number>(src.length).fill(NaN);
  for (let i = len - 1; i < src.length; i++) {
    let m = 0;
    for (let j = i - len + 1; j <= i; j++) m += src[j];
    m /= len;
    let s = 0;
    for (let j = i - len + 1; j <= i; j++) s += (src[j] - m) ** 2;
    out[i] = Math.sqrt(s / len);
  }
  return out;
}

/** Linear regression value at the current bar (Pine ta.linreg(src, len, 0)). */
export function linreg(src: number[], len: number): number[] {
  const out = new Array<number>(src.length).fill(NaN);
  for (let i = len - 1; i < src.length; i++) {
    let sx = 0, sy = 0, sxy = 0, sxx = 0;
    for (let k = 0; k < len; k++) {
      const y = src[i - len + 1 + k];
      sx += k; sy += y; sxy += k * y; sxx += k * k;
    }
    const slope = (len * sxy - sx * sy) / (len * sxx - sx * sx);
    const icpt = (sy - slope * sx) / len;
    out[i] = icpt + slope * (len - 1);
  }
  return out;
}

export function highest(src: number[], len: number, i: number): number {
  let m = -Infinity;
  for (let j = Math.max(0, i - len + 1); j <= i; j++) m = Math.max(m, src[j]);
  return m;
}

export function lowest(src: number[], len: number, i: number): number {
  let m = Infinity;
  for (let j = Math.max(0, i - len + 1); j <= i; j++) m = Math.min(m, src[j]);
  return m;
}

export type VwapAnchor = 'D' | 'W' | 'M';

function periodKey(t: number, anchor: VwapAnchor): number {
  const d = new Date(t);
  if (anchor === 'D') return Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate());
  if (anchor === 'M') return Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), 1);
  const dow = (d.getUTCDay() + 6) % 7; // Monday = 0
  return Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate() - dow);
}

export interface VwapSeries {
  vwap: number[];
  sd: number[];
}

/** Periodic VWAP (UTC day / week / month) with volume-weighted standard deviation. */
export function vwapPeriodic(bars: Bar[], anchor: VwapAnchor): VwapSeries {
  const vwap = new Array<number>(bars.length).fill(NaN);
  const sd = new Array<number>(bars.length).fill(NaN);
  let key = NaN, pv = 0, vv = 0, p2v = 0;
  for (let i = 0; i < bars.length; i++) {
    const b = bars[i];
    const k = periodKey(b.t, anchor);
    if (k !== key) { key = k; pv = 0; vv = 0; p2v = 0; }
    const tp = (b.h + b.l + b.c) / 3;
    const v = b.v > 0 ? b.v : 1e-9;
    pv += tp * v; vv += v; p2v += tp * tp * v;
    vwap[i] = pv / vv;
    sd[i] = Math.sqrt(Math.max(0, p2v / vv - vwap[i] * vwap[i]));
  }
  return { vwap, sd };
}

/** Anchored VWAP starting at bar `from`; NaN before the anchor. */
export function avwap(bars: Bar[], from: number): number[] {
  const out = new Array<number>(bars.length).fill(NaN);
  let pv = 0, vv = 0;
  for (let i = Math.max(0, from); i < bars.length; i++) {
    const b = bars[i];
    const v = b.v > 0 ? b.v : 1e-9;
    pv += ((b.h + b.l + b.c) / 3) * v;
    vv += v;
    out[i] = pv / vv;
  }
  return out;
}

export interface VolumeProfile {
  lo: number;
  hi: number;
  step: number;
  rows: number[];
  poc: number;
  vah: number;
  val: number;
}

/** Each bar's volume is spread evenly over the price rows its high–low range covers. */
export function volumeProfile(bars: Bar[], from: number, to: number, rowCount: number, valueArea = 0.7): VolumeProfile | null {
  from = Math.max(0, from);
  to = Math.min(bars.length - 1, to);
  if (to < from) return null;
  let lo = Infinity, hi = -Infinity;
  for (let i = from; i <= to; i++) { lo = Math.min(lo, bars[i].l); hi = Math.max(hi, bars[i].h); }
  if (!(hi > lo)) return null;
  const step = (hi - lo) / rowCount;
  const rows = new Array<number>(rowCount).fill(0);
  for (let i = from; i <= to; i++) {
    const b = bars[i];
    const a = Math.min(rowCount - 1, Math.floor((b.l - lo) / step));
    const z = Math.min(rowCount - 1, Math.floor((b.h - lo) / step));
    const share = b.v / (z - a + 1);
    for (let r = a; r <= z; r++) rows[r] += share;
  }
  let poc = 0;
  for (let r = 1; r < rowCount; r++) if (rows[r] > rows[poc]) poc = r;
  const total = rows.reduce((s, x) => s + x, 0);
  let inVa = rows[poc], up = poc, dn = poc;
  while (inVa < total * valueArea && (up < rowCount - 1 || dn > 0)) {
    const nu = up < rowCount - 1 ? rows[up + 1] : -1;
    const nd = dn > 0 ? rows[dn - 1] : -1;
    if (nu >= nd) { up++; inVa += nu; } else { dn--; inVa += nd; }
  }
  return { lo, hi, step, rows, poc, vah: lo + (up + 1) * step, val: lo + dn * step };
}
