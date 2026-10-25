import { atr, ema, highest, linreg, lowest, sma, stdev } from './indicators';
import { DEFAULT_PARAMS, STATE_CODES, type Bar, type Box, type Dir, type EngineEvent, type EventCode, type Params } from './types';

interface Pivot { i: number; price: number; type: 1 | -1 }

interface Neck { dir: Dir; level: number; head: number; expires: number; from: EventCode }

export interface Target { from: EventCode; dir: Dir; level: number; t1: number; t2?: number }

export interface Analysis {
  params: Params;
  hasVolume: boolean;
  events: EngineEvent[];
  /** Last bar index each code (events and states) was true. */
  lastSeen: Partial<Record<EventCode, number>>;
  boxes: Box[];
  /** The latest range/triangle box, active or recently broken. */
  box: Box | null;
  targets: Target[];
  rvol: number[];
  spread: number[];
  atr: number[];
  ema50: number[];
  ema50Slope: number[];
}

/** Minimum bars between two events with the same code, so one move is not reported many times. */
const COOLDOWN: Partial<Record<EventCode, number>> = {
  NS: 5, ND: 5, UT: 5, SPRING: 5, SC: 5, BC: 5, TRI: 15, PARA_UP: 15, TL_DN: 10, TL_UP: 10,
  HARM_UP: 8, HARM_DN: 8, SHIFT_UP: 8, DT: 10, DB: 10, HS: 10, IHS: 10, DIV_TOP: 5, DIV_BOT: 5,
};

const BULL_ANCHORS: EventCode[] = ['SC', 'SPRING', 'SOS'];
const BEAR_ANCHORS: EventCode[] = ['BC', 'UT', 'SOW'];

export function lastAnchor(a: Analysis, dir: 1 | -1): EngineEvent | null {
  const set = dir === 1 ? BULL_ANCHORS : BEAR_ANCHORS;
  for (let k = a.events.length - 1; k >= 0; k--) if (set.includes(a.events[k].code)) return a.events[k];
  return null;
}

export function analyze(bars: Bar[], params: Params = DEFAULT_PARAMS): Analysis {
  const P = params;
  const n = bars.length;
  const H = bars.map((b) => b.h), L = bars.map((b) => b.l), C = bars.map((b) => b.c), V = bars.map((b) => (b.v > 0 ? b.v : 0));
  const hasVolume = V.filter((v) => v > 0).length > n * 0.6;

  const atrA = atr(bars, P.atrLen);
  const smaV = sma(V, P.volLen);
  const rvol = V.map((v, i) => (hasVolume && smaV[i] > 0 ? v / smaV[i] : 1));
  const spread = bars.map((b, i) => (atrA[i] > 0 ? (b.h - b.l) / atrA[i] : 1));
  const ema20 = ema(C, 20), ema50 = ema(C, 50);
  const ema50Slope = ema50.map((x, i) => (i >= 10 ? x - ema50[i - 10] : 0));
  const lin20 = linreg(C, 20), sd20 = stdev(C, 20);
  const smaV5 = sma(V, 5), smaV10 = sma(V, 10), smaV50 = sma(V, 50);
  const smaRvol5 = sma(rvol, 5);
  const cumV = new Array<number>(n + 1).fill(0);
  for (let i = 0; i < n; i++) cumV[i + 1] = cumV[i] + V[i];
  const avgVol = (a: number, b: number) => (b > a ? (cumV[b + 1] - cumV[a + 1]) / (b - a) : V[b] ?? 0);

  const events: EngineEvent[] = [];
  const lastSeen: Partial<Record<EventCode, number>> = {};
  const seenKey = new Set<string>();
  const emit = (code: EventCode, i: number, dir: Dir, price: number, at = i): boolean => {
    const key = `${code}@${at}`;
    const prev = lastSeen[code];
    if (seenKey.has(key) || (prev !== undefined && i - prev < (COOLDOWN[code] ?? 3))) return false;
    seenKey.add(key);
    lastSeen[code] = i;
    if (!STATE_CODES.has(code)) events.push({ code, i, at, dir, price });
    return true;
  };
  const state = (code: EventCode, i: number) => { lastSeen[code] = i; };

  const zig: Pivot[] = [];
  const necks: Neck[] = [];
  const targets: Target[] = [];
  const boxes: Box[] = [];
  let box: Box | null = null;
  let prevPara = false, prevTlDn = false, prevTlUp = false;
  let lastLps = -99, lastLpsy = -99;

  const priorTrend = (start: number): Dir => {
    const back = start - P.rangeLen;
    if (back < 0) return 0;
    const d = (C[start] - C[back]) / (atrA[start] || 1);
    return d < -2 ? -1 : d > 2 ? 1 : 0;
  };

  const onPivot = (i: number) => {
    const k = zig.length - 1;
    const z = (j: number) => zig[k - j];
    if (k < 3) return;
    const last = z(0);
    const a = atrA[last.i] || 1;
    if (last.type === 1) {
      const hn = z(0), ln = z(1), hp = z(2), lp = z(3);
      const upNew = avgVol(ln.i, hn.i), upPrev = avgVol(lp.i, hp.i), dnLast = avgVol(hp.i, ln.i);
      if (hasVolume && hn.price > hp.price && upNew < 0.85 * upPrev) emit('DIV_TOP', i, -1, hn.price, hn.i);
      if (Math.abs(hn.price - hp.price) <= 0.5 * a && (!hasVolume || upNew < upPrev) && emit('DT', i, -1, hn.price, hn.i)) {
        necks.push({ dir: -1, level: ln.price, head: Math.max(hn.price, hp.price), expires: i + 40, from: 'DT' });
      }
      if (k >= 5) {
        const hpp = z(4), lpp = z(5);
        const leftVol = avgVol(lpp.i, hpp.i);
        if (hp.price > hpp.price && hp.price > hn.price && Math.abs(hpp.price - hn.price) <= a && (!hasVolume || upNew < leftVol) && emit('HS', i, -1, hp.price, hn.i)) {
          necks.push({ dir: -1, level: (lp.price + ln.price) / 2, head: hp.price, expires: i + 40, from: 'HS' });
        }
      }
      harmony(i, hn.price > hp.price && ln.price > lp.price, hn.price < hp.price && ln.price < lp.price, upNew, dnLast, hn.price);
      triangle(i, hn.price < hp.price && ln.price > lp.price && hn.price - ln.price <= 0.75 * (hp.price - lp.price), hn.price, ln.price, hp.i);
    } else {
      const ln = z(0), hn = z(1), lp = z(2), hp = z(3);
      const dnNew = avgVol(hn.i, ln.i), dnPrev = avgVol(hp.i, lp.i), upLast = avgVol(lp.i, hn.i);
      if (hasVolume && ln.price <= lp.price + 0.3 * a && dnNew < 0.85 * dnPrev) emit('DIV_BOT', i, 1, ln.price, ln.i);
      if (Math.abs(ln.price - lp.price) <= 0.5 * a && (!hasVolume || dnNew < dnPrev) && emit('DB', i, 1, ln.price, ln.i)) {
        necks.push({ dir: 1, level: hn.price, head: Math.min(ln.price, lp.price), expires: i + 40, from: 'DB' });
      }
      if (k >= 5) {
        const lpp = z(4), hpp = z(5);
        const leftVol = avgVol(hpp.i, lpp.i);
        if (lp.price < lpp.price && lp.price < ln.price && Math.abs(lpp.price - ln.price) <= a && (!hasVolume || dnNew < leftVol) && emit('IHS', i, 1, lp.price, ln.i)) {
          necks.push({ dir: 1, level: (hp.price + hn.price) / 2, head: lp.price, expires: i + 40, from: 'IHS' });
        }
      }
      harmony(i, ln.price > lp.price && hn.price > hp.price, ln.price < lp.price && hn.price < hp.price, upLast, dnNew, ln.price);
      triangle(i, hn.price < hp.price && ln.price > lp.price && hn.price - ln.price <= 0.75 * (hp.price - lp.price), hn.price, ln.price, hp.i);
    }
  };

  function harmony(i: number, up: boolean, down: boolean, upV: number, dnV: number, price: number) {
    if (!hasVolume) return;
    if (up && upV > 1.3 * dnV) emit('HARM_UP', i, 1, price);
    if (down && dnV > 1.3 * upV) emit('HARM_DN', i, -1, price);
    if (down && upV > 1.3 * dnV) emit('SHIFT_UP', i, 1, price);
  }

  function triangle(i: number, converging: boolean, top: number, bot: number, start: number) {
    if (!converging) return;
    if (hasVolume && !(smaV10[i] / smaV50[i] < 0.85)) return;
    emit('TRI', i, 0, (top + bot) / 2);
    if (!box || box.broken !== 0) {
      box = { start, end: i, top, bot, prior: priorTrend(start), broken: 0, brokenAt: -1, strongBreak: false, kind: 'tri' };
      boxes.push(box);
    }
  }

  const warm = Math.max(P.volLen, 50);
  for (let i = 0; i < n; i++) {
    const b = bars[i];
    const a = atrA[i] || 1;

    // Pivots, confirmed pivotR bars later.
    const p = i - P.pivotR;
    if (p - P.pivotL >= 0) {
      const isH = H[p] > highest(H, P.pivotL, p - 1) && H[p] >= highest(H, P.pivotR, i);
      const isL = L[p] < lowest(L, P.pivotL, p - 1) && L[p] <= lowest(L, P.pivotR, i);
      const add = (type: 1 | -1, price: number) => {
        const last = zig[zig.length - 1];
        if (last && last.type === type) {
          if ((type === 1 && price > last.price) || (type === -1 && price < last.price)) { zig[zig.length - 1] = { i: p, price, type }; return true; }
          return false;
        }
        zig.push({ i: p, price, type });
        return true;
      };
      const order: Array<1 | -1> = zig.length && zig[zig.length - 1].type === 1 ? [-1, 1] : [1, -1];
      for (const t of order) {
        if (t === 1 && isH && add(1, H[p]) && i >= warm) onPivot(i);
        if (t === -1 && isL && add(-1, L[p]) && i >= warm) onPivot(i);
      }
    }
    if (i < warm) continue;

    const rv = rvol[i], sp = spread[i];
    const hh50 = highest(H, 50, i), ll50 = lowest(L, 50, i);
    const pos50 = hh50 > ll50 ? (b.c - ll50) / (hh50 - ll50) : 0.5;
    const downTrend = b.c < ema50[i] || ema50Slope[i] < 0;
    const upTrend = b.c > ema50[i] || ema50Slope[i] > 0;

    if (hasVolume) {
      const move30 = (b.c - C[i - 30]) / a;
      const act = box as Box | null;
      const breakingOut = !!act && act.broken === 0 && (b.c > act.top || b.c < act.bot);
      if (rv >= P.ultra && sp >= P.wide && b.l <= ll50 && downTrend && move30 < -3 && !breakingOut) emit('SC', i, 1, b.l);
      if (rv >= P.ultra && sp >= P.wide && b.h >= hh50 && upTrend && move30 > 3 && !breakingOut) emit('BC', i, -1, b.h);
      if (rv >= P.hi && sp <= P.narrow && pos50 <= 0.33) emit('ABS_LO', i, 1, b.l);
      if (rv >= P.hi && sp <= P.narrow && pos50 >= 0.67) emit('ABS_HI', i, -1, b.h);
      // No supply / no demand only mean something as a test after a move into support / resistance.
      const quiet = rv < 0.6 && sp < P.narrow && V[i] < V[i - 1] && V[i] < V[i - 2];
      if (quiet && b.c < C[i - 1] && b.c < C[i - 5] && pos50 <= 0.5) emit('NS', i, 1, b.l);
      if (quiet && b.c > C[i - 1] && b.c > C[i - 5] && pos50 >= 0.5) emit('ND', i, -1, b.h);
      const s5 = ema20[i] - ema20[i - 5], s5p = ema20[i - 10] - ema20[i - 15];
      const para = b.c > ema20[i] && s5p > 0 && s5 > 2 * s5p && b.h >= hh50 && smaRvol5[i] > 1.5;
      if (para && !prevPara) emit('PARA_UP', i, -1, b.h);
      prevPara = para;
      const tlDn = ema50Slope[i] > 0 && b.c < lin20[i] - 1.5 * sd20[i] && rv >= P.hi;
      const tlUp = ema50Slope[i] < 0 && b.c > lin20[i] + 1.5 * sd20[i] && rv >= P.hi;
      if (tlDn && !prevTlDn) emit('TL_DN', i, -1, b.c);
      if (tlUp && !prevTlUp) emit('TL_UP', i, 1, b.c);
      prevTlDn = tlDn; prevTlUp = tlUp;
    }

    // Necklines of DT / DB / HS / IHS.
    for (let k = necks.length - 1; k >= 0; k--) {
      const nk = necks[k];
      const volOk = !hasVolume || rv >= P.hi;
      if (nk.dir === -1 && b.c < nk.level && volOk) {
        emit('NECK_DN', i, -1, b.c);
        targets.push({ from: nk.from, dir: -1, level: nk.level, t1: nk.level - (nk.head - nk.level) });
        necks.splice(k, 1);
      } else if (nk.dir === 1 && b.c > nk.level && volOk) {
        emit('NECK_UP', i, 1, b.c);
        targets.push({ from: nk.from, dir: 1, level: nk.level, t1: nk.level + (nk.level - nk.head) });
        necks.splice(k, 1);
      } else if (i > nk.expires || (nk.dir === -1 && b.c > nk.head) || (nk.dir === 1 && b.c < nk.head)) {
        necks.splice(k, 1);
      }
    }

    // Range box: breakouts, failed breakouts, tests.
    const cur = box as Box | null;
    if (cur && cur.broken === 0) {
      if (b.c > cur.top) {
        cur.broken = 1; cur.brokenAt = i; cur.strongBreak = hasVolume && rv >= P.hi;
        if (cur.strongBreak) emit('SOS', i, 1, b.c);
        else if (hasVolume && rv < 1) emit('BO_UP_WEAK', i, 0, b.c);
        targets.push({ from: 'RANGE', dir: 1, level: cur.top, t1: cur.top + (cur.top - cur.bot), t2: cur.top + 1.618 * (cur.top - cur.bot) });
      } else if (b.c < cur.bot) {
        cur.broken = -1; cur.brokenAt = i; cur.strongBreak = hasVolume && rv >= P.hi;
        if (cur.strongBreak) emit('SOW', i, -1, b.c);
        else if (hasVolume && rv < 1) emit('BO_DN_WEAK', i, 0, b.c);
        targets.push({ from: 'RANGE', dir: -1, level: cur.bot, t1: cur.bot - (cur.top - cur.bot), t2: cur.bot - 1.618 * (cur.top - cur.bot) });
      } else {
        cur.end = i;
        // Phase C tests need an established range (phase B) behind them.
        if (cur.kind === 'range' && i - cur.start >= 10) {
          if (b.h > cur.top + 0.2 * a && b.c < cur.top) emit('UT', i, -1, b.h);
          if (b.l < cur.bot - 0.2 * a && b.c > cur.bot) emit('SPRING', i, 1, b.l);
        }
      }
    } else if (cur && cur.broken !== 0) {
      const since = i - cur.brokenAt;
      if (since > 0 && since <= 5 && cur.broken === 1 && b.c < cur.top) {
        emit('UT', i, -1, b.h); cur.broken = 0; cur.end = i; cur.strongBreak = false; targets.pop();
      } else if (since > 0 && since <= 5 && cur.broken === -1 && b.c > cur.bot) {
        emit('SPRING', i, 1, b.l); cur.broken = 0; cur.end = i; cur.strongBreak = false; targets.pop();
      } else if (since > 0 && since <= 20 && cur.strongBreak) {
        const quietTest = !hasVolume || rv <= 0.85;
        if (cur.broken === 1 && Math.abs(b.l - cur.top) <= 0.5 * a && quietTest && b.c > cur.top && i - lastLps >= 3) { emit('LPS', i, 1, b.l); lastLps = i; }
        if (cur.broken === -1 && Math.abs(b.h - cur.bot) <= 0.5 * a && quietTest && b.c < cur.bot && i - lastLpsy >= 3) { emit('LPSY', i, -1, b.h); lastLpsy = i; }
      }
    }

    if (i >= P.rangeLen) {
      const hh = highest(H, P.rangeLen, i), ll = lowest(L, P.rangeLen, i);
      const inRange = (hh - ll) / a <= P.rangeAtr;
      const old = box as Box | null;
      const free = !old || (old.broken !== 0 && i - old.brokenAt >= P.rangeLen / 2);
      if (inRange && free) {
        let start = i - P.rangeLen + 1;
        let top = hh, bot = ll;
        const climax = [lastSeen.SC, lastSeen.BC].filter((x): x is number => x !== undefined && x >= start).sort((x, y) => y - x)[0];
        if (climax !== undefined && i - climax >= 5) {
          const t2 = highest(H, i - climax + 1, i), b2 = lowest(L, i - climax + 1, i);
          if ((t2 - b2) / a <= P.rangeAtr * 1.25) { start = climax; top = t2; bot = b2; }
        }
        box = { start, end: i, top, bot, prior: priorTrend(start), broken: 0, brokenAt: -1, strongBreak: false, kind: 'range' };
        boxes.push(box);
      }
    }

    // States derived from the active box.
    const bx = box as Box | null;
    if (bx && bx.broken === 0) {
      state('RANGE', i);
      if (bx.prior === -1) state('RANGE_ACC', i);
      if (bx.prior === 1) state('RANGE_DIST', i);
      const width = bx.top - bx.bot;
      if (hasVolume && smaV10[i] / smaV50[i] < 0.75) state('SQZ', i);
      if (width / a <= 3 && b.c > ema50[i] && ema50Slope[i] > 0) state('FLAT_BASE', i);
      if (bx.prior === 1 && b.c >= bx.top - 0.25 * width && i - bx.start >= 15 && (!hasVolume || smaV5[i] < smaV[i])) state('CUP', i);
    }
    if (bx && hasVolume && (bx.broken === 0 || i - bx.brokenAt <= 5) && i - bx.start >= 20) {
      const third = Math.floor((i - bx.start + 1) / 3);
      const m1 = avgVol(bx.start - 1, bx.start + third - 1);
      const m2 = avgVol(bx.start + third - 1, bx.start + 2 * third - 1);
      const m3 = avgVol(bx.start + 2 * third - 1, i);
      const ushape = m2 < 0.8 * m1 && m2 < 0.8 * m3;
      const mid = (bx.top + bx.bot) / 2;
      if (ushape && bx.prior === -1 && b.c > mid) state('ROUND_BOT', i);
      if (ushape && bx.prior === 1 && b.c < mid) state('ROUND_TOP', i);
    }
  }

  return { params: P, hasVolume, events, lastSeen, boxes, box, targets, rvol, spread, atr: atrA, ema50, ema50Slope };
}
