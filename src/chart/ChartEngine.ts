import { decimalsFor } from '../engine/context';
import { volumeProfile } from '../engine/indicators';
import type { Bar, Box, EngineEvent, EventCode } from '../engine/types';
import { withAlpha, type ChartTheme } from './theme';

export interface Overlays {
  vwapD?: number[];
  vwapW?: number[];
  vwapM?: number[];
  avwapBull?: number[];
  avwapBear?: number[];
  events?: EngineEvent[];
  boxes?: Box[];
}

export interface ChartOptions {
  theme: ChartTheme;
  showVP: boolean;
  vpSide: 'left' | 'right';
  vpWidth: number;
  vpRows: number;
  showEvents: boolean;
  showBoxes: boolean;
  watermark: boolean;
  tfMs: number;
  font: string;
}

export interface ViewState { rightTime: number; barSpacing: number }

const EVENT_LABEL: Partial<Record<EventCode, string>> = {
  SC: 'SC', BC: 'BC', SPRING: 'SPR', UT: 'UT', SOS: 'SOS', SOW: 'SOW', LPS: 'LPS', LPSY: 'LPSY',
  DIV_TOP: 'DIV', DIV_BOT: 'TEST', HS: 'H&S', IHS: 'iH&S', DT: '2T', DB: '2B', NECK_DN: 'NECK', NECK_UP: 'NECK',
  BO_UP_WEAK: 'BO?', BO_DN_WEAK: 'BO?', ABS_LO: 'ABS', ABS_HI: 'ABS', PARA_UP: 'PARA', TL_DN: 'TL', TL_UP: 'TL',
};

const AXIS_W = 72;
const TIME_H = 22;

function niceStep(raw: number) {
  const p = Math.pow(10, Math.floor(Math.log10(raw)));
  const f = raw / p;
  return (f < 1.5 ? 1 : f < 3 ? 2 : f < 7 ? 5 : 10) * p;
}

function fmtVol(v: number) {
  if (v >= 1e9) return (v / 1e9).toFixed(2) + 'B';
  if (v >= 1e6) return (v / 1e6).toFixed(2) + 'M';
  if (v >= 1e3) return (v / 1e3).toFixed(1) + 'K';
  return v.toFixed(v < 10 ? 2 : 0);
}

const pad2 = (x: number) => String(x).padStart(2, '0');

export class ChartEngine {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private w = 0;
  private h = 0;
  private dpr = 1;
  private bars: Bar[] = [];
  private ov: Overlays = {};
  private opts: ChartOptions;
  private bs = 8;
  private edge = 0;
  private follow = true;
  private mouse: { x: number; y: number } | null = null;
  private extTime: number | null = null;
  private drag: { x: number; edge: number } | null = null;
  private logo = new Image();
  private raf = 0;
  private ro: ResizeObserver;
  private hasVol = true;

  onCrosshair?: (t: number | null) => void;
  onView?: (v: ViewState) => void;

  constructor(private host: HTMLElement, opts: ChartOptions) {
    this.opts = opts;
    this.canvas = document.createElement('canvas');
    this.canvas.style.display = 'block';
    this.canvas.style.width = '100%';
    this.canvas.style.height = '100%';
    this.canvas.style.cursor = 'crosshair';
    host.appendChild(this.canvas);
    this.ctx = this.canvas.getContext('2d')!;
    this.logo.src = '/logo-96.png';
    this.logo.onload = () => this.invalidate();
    this.ro = new ResizeObserver(() => this.resize());
    this.ro.observe(host);
    this.resize();
    this.bindEvents();
    document.fonts?.ready.then(() => this.invalidate());
  }

  destroy() {
    cancelAnimationFrame(this.raf);
    this.ro.disconnect();
    this.canvas.remove();
  }

  setOptions(o: Partial<ChartOptions>) {
    this.opts = { ...this.opts, ...o };
    this.invalidate();
  }

  /** `reset` re-centers the view (new symbol or timeframe); otherwise the view follows new bars. */
  setData(bars: Bar[], ov: Overlays, reset = false) {
    const prevLen = this.bars.length;
    this.bars = bars;
    this.ov = ov;
    this.hasVol = bars.some((b) => b.v > 0);
    if (reset || !prevLen) this.resetView();
    else if (this.follow && bars.length > prevLen) this.edge += bars.length - prevLen;
    this.invalidate();
  }

  resetView() {
    this.bs = 8;
    this.edge = this.bars.length - 1 + 4;
    this.follow = true;
    this.invalidate();
  }

  /** Align the right edge to a time (used by "sync" mode). */
  setView(v: ViewState) {
    if (!this.bars.length) return;
    this.bs = v.barSpacing;
    this.edge = this.indexOfTime(v.rightTime);
    this.follow = this.edge >= this.bars.length - 1;
    this.invalidate();
  }

  setCrosshairTime(t: number | null) {
    this.extTime = t;
    this.invalidate();
  }

  private get plotW() { return this.w - AXIS_W; }
  private get plotH() { return this.h - TIME_H; }

  private resize() {
    const r = this.host.getBoundingClientRect();
    this.dpr = window.devicePixelRatio || 1;
    this.w = Math.max(50, Math.floor(r.width));
    this.h = Math.max(50, Math.floor(r.height));
    this.canvas.width = Math.floor(this.w * this.dpr);
    this.canvas.height = Math.floor(this.h * this.dpr);
    this.invalidate();
  }

  private invalidate() {
    cancelAnimationFrame(this.raf);
    this.raf = requestAnimationFrame(() => this.draw());
  }

  private x(i: number) { return this.plotW - this.bs / 2 - (this.edge - i) * this.bs; }
  private indexAt(x: number) { return this.edge - (this.plotW - this.bs / 2 - x) / this.bs; }

  private timeAt(i: number) {
    const n = this.bars.length;
    if (!n) return 0;
    if (i <= n - 1) return this.bars[Math.max(0, Math.round(i))].t;
    return this.bars[n - 1].t + (i - (n - 1)) * this.opts.tfMs;
  }

  private indexOfTime(t: number) {
    const b = this.bars;
    const n = b.length;
    if (t >= b[n - 1].t) return n - 1 + (t - b[n - 1].t) / this.opts.tfMs;
    let lo = 0, hi = n - 1;
    while (lo < hi) {
      const mid = (lo + hi + 1) >> 1;
      if (b[mid].t <= t) lo = mid; else hi = mid - 1;
    }
    return lo;
  }

  private clampEdge() {
    const n = this.bars.length;
    const span = this.plotW / this.bs;
    this.edge = Math.min(n - 1 + span * 0.8, Math.max(Math.min(10, n - 1), this.edge));
    this.follow = this.edge >= n - 1;
  }

  private emitView() {
    this.onView?.({ rightTime: this.timeAt(this.edge), barSpacing: this.bs });
  }

  private bindEvents() {
    const c = this.canvas;
    const pos = (e: MouseEvent) => {
      const r = c.getBoundingClientRect();
      return { x: e.clientX - r.left, y: e.clientY - r.top };
    };
    c.addEventListener('mousedown', (e) => {
      const p = pos(e);
      this.drag = { x: p.x, edge: this.edge };
      c.style.cursor = 'grabbing';
    });
    window.addEventListener('mouseup', () => {
      if (this.drag) { this.drag = null; c.style.cursor = 'crosshair'; }
    });
    c.addEventListener('mousemove', (e) => {
      const p = pos(e);
      this.mouse = p;
      if (this.drag) {
        this.edge = this.drag.edge - (p.x - this.drag.x) / this.bs;
        this.clampEdge();
        this.emitView();
      }
      const i = Math.round(this.indexAt(p.x));
      this.onCrosshair?.(p.x < this.plotW && i >= 0 && i < this.bars.length ? this.bars[i].t : null);
      this.invalidate();
    });
    c.addEventListener('mouseleave', () => {
      this.mouse = null;
      this.onCrosshair?.(null);
      this.invalidate();
    });
    c.addEventListener('wheel', (e) => {
      e.preventDefault();
      const p = pos(e);
      const ax = Math.min(p.x, this.plotW);
      const idx = this.indexAt(ax);
      const f = Math.exp(-e.deltaY * 0.0015);
      this.bs = Math.min(40, Math.max(1.5, this.bs * f));
      this.edge = idx + (this.plotW - this.bs / 2 - ax) / this.bs;
      this.clampEdge();
      this.emitView();
      this.invalidate();
    }, { passive: false });
    c.addEventListener('dblclick', () => {
      this.resetView();
      this.emitView();
    });
  }

  private draw() {
    const { ctx, dpr, w, h } = this;
    const T = this.opts.theme;
    const F = this.opts.font;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.fillStyle = T.bg;
    ctx.fillRect(0, 0, w, h);
    const bars = this.bars;
    const n = bars.length;
    const pw = this.plotW, ph = this.plotH;
    const volH = this.hasVol ? Math.round(ph * 0.18) : 0;
    const pTop = 26, pBot = ph - volH - 8;

    if (this.opts.watermark) {
      const size = Math.max(18, Math.min(pw * 0.11, (pBot - pTop) * 0.24));
      ctx.font = `600 ${size}px ${F}`;
      ctx.fillStyle = withAlpha(T.watermark, 0.06);
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('Lai Long', pw / 2, (pTop + pBot) / 2);
    }

    if (!n) {
      this.drawLogo(ph, volH);
      return;
    }

    const from = Math.max(0, Math.floor(this.indexAt(0)));
    const to = Math.min(n - 1, Math.ceil(this.edge));
    let lo = Infinity, hi = -Infinity, maxV = 0;
    for (let i = from; i <= to; i++) {
      lo = Math.min(lo, bars[i].l); hi = Math.max(hi, bars[i].h); maxV = Math.max(maxV, bars[i].v);
    }
    if (!Number.isFinite(lo)) { lo = bars[n - 1].l; hi = bars[n - 1].h; }
    if (hi === lo) { hi += Math.abs(hi) * 0.001 || 1; lo -= Math.abs(lo) * 0.001 || 1; }
    const padP = (hi - lo) * 0.06;
    lo -= padP; hi += padP;
    const y = (p: number) => pTop + ((hi - p) / (hi - lo)) * (pBot - pTop);
    const d = decimalsFor(bars[n - 1].c);
    const bs = this.bs;
    const bodyW = Math.max(1, Math.round(bs * 0.7));

    // Grid and price ticks.
    const step = niceStep((hi - lo) / Math.max(2, (pBot - pTop) / 46));
    ctx.strokeStyle = T.grid;
    ctx.lineWidth = 1;
    ctx.font = `11px ${F}`;
    const ticks: number[] = [];
    for (let p = Math.ceil(lo / step) * step; p <= hi; p += step) ticks.push(p);
    ctx.beginPath();
    for (const p of ticks) { const yy = Math.round(y(p)) + 0.5; ctx.moveTo(0, yy); ctx.lineTo(pw, yy); }
    const tStep = Math.max(1, Math.ceil(90 / bs));
    const timeTicks: number[] = [];
    for (let i = from - (from % tStep); i <= to; i += tStep) if (i >= 0) timeTicks.push(i);
    for (const i of timeTicks) { const xx = Math.round(this.x(i)) + 0.5; ctx.moveTo(xx, 0); ctx.lineTo(xx, ph); }
    ctx.stroke();

    ctx.save();
    ctx.beginPath();
    ctx.rect(0, 0, pw, ph);
    ctx.clip();

    // Range boxes.
    if (this.opts.showBoxes && this.ov.boxes) {
      for (const bx of this.ov.boxes.slice(-4)) {
        const end = bx.broken !== 0 ? bx.brokenAt : bx.end;
        if (end < from || bx.start > to) continue;
        const x1 = this.x(bx.start) - bs / 2, x2 = this.x(end) + bs / 2;
        ctx.fillStyle = withAlpha(T.vwapW, 0.06);
        ctx.fillRect(x1, y(bx.top), x2 - x1, y(bx.bot) - y(bx.top));
        ctx.setLineDash([4, 3]);
        ctx.strokeStyle = withAlpha(T.vwapW, 0.45);
        ctx.strokeRect(x1 + 0.5, y(bx.top) + 0.5, x2 - x1, y(bx.bot) - y(bx.top));
        ctx.setLineDash([]);
      }
    }

    // Volume profile of the visible bars.
    if (this.opts.showVP && this.hasVol) {
      const vp = volumeProfile(bars, from, to, this.opts.vpRows);
      if (vp) {
        const maxRow = Math.max(...vp.rows);
        const maxW = pw * this.opts.vpWidth;
        for (let r = 0; r < vp.rows.length; r++) {
          const pLo = vp.lo + r * vp.step, pHi = pLo + vp.step;
          const y1 = y(pHi), y2 = y(pLo);
          const ww = (vp.rows[r] / maxRow) * maxW;
          const inVa = pLo >= vp.val - 1e-12 && pHi <= vp.vah + 1e-12;
          ctx.fillStyle = r === vp.poc ? withAlpha(T.vpPoc, 0.7) : withAlpha(inVa ? T.vwapW : T.vp, inVa ? 0.22 : 0.16);
          const xx = this.opts.vpSide === 'right' ? pw - ww : 0;
          ctx.fillRect(xx, y1 + 0.5, ww, Math.max(1, y2 - y1 - 1));
        }
        const pocY = y(vp.lo + (vp.poc + 0.5) * vp.step);
        ctx.strokeStyle = withAlpha(T.vpPoc, 0.8);
        ctx.setLineDash([2, 3]);
        ctx.beginPath(); ctx.moveTo(0, pocY); ctx.lineTo(pw, pocY); ctx.stroke();
        ctx.setLineDash([]);
      }
    }

    // Volume bars.
    if (this.hasVol && maxV > 0) {
      for (let i = from; i <= to; i++) {
        const b = bars[i];
        const vh = (b.v / maxV) * (volH - 4);
        ctx.fillStyle = withAlpha(b.c >= b.o ? T.up : T.down, 0.35);
        ctx.fillRect(Math.round(this.x(i) - bodyW / 2), ph - vh, bodyW, vh);
      }
    }

    // Candles.
    for (let i = from; i <= to; i++) {
      const b = bars[i];
      const col = b.c >= b.o ? T.up : T.down;
      const xx = Math.round(this.x(i));
      ctx.fillStyle = col;
      ctx.fillRect(xx, Math.round(y(b.h)), 1, Math.max(1, Math.round(y(b.l) - y(b.h))));
      const top = Math.round(y(Math.max(b.o, b.c)));
      const bh = Math.max(1, Math.round(y(Math.min(b.o, b.c))) - top);
      if (bs >= 3) ctx.fillRect(xx - Math.floor(bodyW / 2), top, bodyW, bh);
    }

    // VWAP lines.
    const line = (arr: number[] | undefined, color: string, width = 1.4, dash: number[] = []) => {
      if (!arr) return;
      ctx.strokeStyle = color;
      ctx.lineWidth = width;
      ctx.setLineDash(dash);
      ctx.beginPath();
      let on = false;
      for (let i = Math.max(0, from - 1); i <= to; i++) {
        const v = arr[i];
        if (!Number.isFinite(v)) { on = false; continue; }
        const prevBreak = i > 0 && this.opts.tfMs < 86_400_000 && arr === this.ov.vwapD && Number.isFinite(arr[i - 1]) && new Date(bars[i].t).getUTCDate() !== new Date(bars[i - 1].t).getUTCDate();
        if (!on || prevBreak) { ctx.moveTo(this.x(i), y(v)); on = true; } else ctx.lineTo(this.x(i), y(v));
      }
      ctx.stroke();
      ctx.setLineDash([]);
      ctx.lineWidth = 1;
    };
    line(this.ov.vwapM, T.vwapM);
    line(this.ov.vwapW, T.vwapW);
    line(this.ov.vwapD, T.vwapD);
    line(this.ov.avwapBull, T.up, 1.2, [6, 4]);
    line(this.ov.avwapBear, T.down, 1.2, [6, 4]);

    // Wyckoff event labels.
    if (this.opts.showEvents && this.ov.events) {
      ctx.font = `600 10px ${F}`;
      ctx.textAlign = 'center';
      const stack = new Map<number, number>();
      for (const ev of this.ov.events) {
        const lbl = EVENT_LABEL[ev.code];
        if (!lbl || ev.at < from || ev.at > to) continue;
        const b = bars[ev.at];
        const k = (stack.get(ev.at * 2 + (ev.dir === 1 ? 1 : 0)) || 0);
        stack.set(ev.at * 2 + (ev.dir === 1 ? 1 : 0), k + 1);
        const below = ev.dir === 1;
        const yy = below ? y(b.l) + 12 + k * 11 : y(b.h) - 6 - k * 11;
        ctx.fillStyle = ev.dir === 1 ? T.up : ev.dir === -1 ? T.down : T.muted;
        ctx.textBaseline = below ? 'top' : 'bottom';
        ctx.fillText(lbl, this.x(ev.at), below ? yy - 6 : yy);
      }
    }
    ctx.restore();

    // Last price line.
    const last = bars[n - 1];
    const lastCol = last.c >= last.o ? T.up : T.down;
    const ly = Math.round(y(last.c)) + 0.5;
    if (ly > 0 && ly < ph) {
      ctx.strokeStyle = withAlpha(lastCol, 0.7);
      ctx.setLineDash([2, 2]);
      ctx.beginPath(); ctx.moveTo(0, ly); ctx.lineTo(pw, ly); ctx.stroke();
      ctx.setLineDash([]);
    }

    // Axes.
    ctx.fillStyle = T.bg;
    ctx.fillRect(pw, 0, AXIS_W, h);
    ctx.fillRect(0, ph, w, TIME_H);
    ctx.strokeStyle = T.axisLine;
    ctx.beginPath();
    ctx.moveTo(pw + 0.5, 0); ctx.lineTo(pw + 0.5, ph);
    ctx.moveTo(0, ph + 0.5); ctx.lineTo(w, ph + 0.5);
    ctx.stroke();
    ctx.fillStyle = T.muted;
    ctx.font = `11px ${F}`;
    ctx.textAlign = 'left';
    ctx.textBaseline = 'middle';
    for (const p of ticks) { const yy = y(p); if (yy > 8 && yy < pBot + 4) ctx.fillText(p.toFixed(d), pw + 6, yy); }
    if (ly > 0 && ly < ph) this.axisTag(ly, last.c.toFixed(d), lastCol, '#ffffff');

    ctx.textAlign = 'center';
    ctx.fillStyle = T.muted;
    let prevDay = -1;
    for (const i of timeTicks) {
      const dt = new Date(bars[i].t);
      const day = dt.getDate();
      const label = this.fmtTime(dt, prevDay !== -1 && day !== prevDay);
      prevDay = day;
      ctx.fillText(label, this.x(i), ph + TIME_H / 2 + 1);
    }

    this.drawLogo(ph, volH);
    this.drawLegend(d);

    // Crosshair.
    const m = this.mouse;
    let ci: number | null = null;
    if (m && m.x < pw) ci = Math.round(this.indexAt(m.x));
    else if (this.extTime !== null) ci = Math.round(this.indexOfTime(this.extTime));
    if (ci !== null && ci >= 0 && ci <= n - 1) {
      const cx = Math.round(this.x(ci)) + 0.5;
      ctx.strokeStyle = T.crosshair;
      ctx.setLineDash([3, 3]);
      ctx.beginPath();
      ctx.moveTo(cx, 0); ctx.lineTo(cx, ph);
      if (m && m.y < ph) { ctx.moveTo(0, Math.round(m.y) + 0.5); ctx.lineTo(pw, Math.round(m.y) + 0.5); }
      ctx.stroke();
      ctx.setLineDash([]);
      if (m && m.y < pBot) this.axisTag(m.y, (hi - ((m.y - pTop) / (pBot - pTop)) * (hi - lo)).toFixed(d), T.text, T.bg);
      const tl = this.fmtFull(new Date(bars[ci].t));
      ctx.font = `11px ${F}`;
      const tw = ctx.measureText(tl).width + 10;
      ctx.fillStyle = T.text;
      ctx.fillRect(cx - tw / 2, ph + 1, tw, TIME_H - 2);
      ctx.fillStyle = T.bg;
      ctx.textAlign = 'center';
      ctx.fillText(tl, cx, ph + TIME_H / 2 + 1);
    }
  }

  private axisTag(yy: number, text: string, bg: string, fg: string) {
    const { ctx } = this;
    ctx.fillStyle = bg;
    ctx.fillRect(this.plotW + 1, yy - 9, AXIS_W - 1, 18);
    ctx.fillStyle = fg;
    ctx.font = `11px ${this.opts.font}`;
    ctx.textAlign = 'left';
    ctx.textBaseline = 'middle';
    ctx.fillText(text, this.plotW + 6, yy);
  }

  private drawLogo(ph: number, volH: number) {
    const { ctx } = this;
    const T = this.opts.theme;
    const small = this.h < 260;
    const s = small ? 13 : 18;
    const yy = ph - (volH ? Math.min(volH, 30) : 8) - s + (volH ? 4 : 0) - 4;
    if (this.logo.complete && this.logo.naturalWidth) ctx.drawImage(this.logo, 8, yy, s, s);
    ctx.font = `600 ${small ? 10 : 12}px ${this.opts.font}`;
    ctx.fillStyle = T.text;
    ctx.textAlign = 'left';
    ctx.textBaseline = 'middle';
    ctx.fillText('lailong', 8 + s + 6, yy + s / 2 + 1);
  }

  private drawLegend(d: number) {
    const { ctx } = this;
    const T = this.opts.theme;
    const n = this.bars.length;
    let i = n - 1;
    if (this.mouse && this.mouse.x < this.plotW) i = Math.round(this.indexAt(this.mouse.x));
    else if (this.extTime !== null) i = Math.round(this.indexOfTime(this.extTime));
    i = Math.min(n - 1, Math.max(0, i));
    const b = this.bars[i];
    const col = b.c >= b.o ? T.up : T.down;
    const parts: Array<[string, string]> = [['O', b.o.toFixed(d)], ['H', b.h.toFixed(d)], ['L', b.l.toFixed(d)], ['C', b.c.toFixed(d)]];
    if (this.hasVol) parts.push(['V', fmtVol(b.v)]);
    const chg = i > 0 ? ((b.c - this.bars[i - 1].c) / this.bars[i - 1].c) * 100 : 0;
    ctx.font = `11px ${this.opts.font}`;
    ctx.textAlign = 'left';
    ctx.textBaseline = 'middle';
    let xx = 8;
    for (const [k, v] of parts) {
      ctx.fillStyle = T.muted; ctx.fillText(k, xx, 12); xx += ctx.measureText(k).width + 3;
      ctx.fillStyle = col; ctx.fillText(v, xx, 12); xx += ctx.measureText(v).width + 10;
    }
    ctx.fillStyle = col;
    ctx.fillText(`${chg >= 0 ? '+' : ''}${chg.toFixed(2)}%`, xx, 12);
  }

  private fmtTime(dt: Date, newDay: boolean) {
    const tf = this.opts.tfMs;
    if (tf >= 28 * 86_400_000) return `${pad2(dt.getMonth() + 1)}/${dt.getFullYear()}`;
    if (tf >= 86_400_000) return `${pad2(dt.getDate())}/${pad2(dt.getMonth() + 1)}`;
    return newDay ? `${pad2(dt.getDate())}/${pad2(dt.getMonth() + 1)}` : `${pad2(dt.getHours())}:${pad2(dt.getMinutes())}`;
  }

  private fmtFull(dt: Date) {
    const date = `${pad2(dt.getDate())}/${pad2(dt.getMonth() + 1)}/${String(dt.getFullYear()).slice(2)}`;
    return this.opts.tfMs >= 86_400_000 ? date : `${date} ${pad2(dt.getHours())}:${pad2(dt.getMinutes())}`;
  }
}
