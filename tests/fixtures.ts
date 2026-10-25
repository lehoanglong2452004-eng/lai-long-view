import type { Bar } from '../src/engine/types';

const HOUR = 3600_000;

/** Deterministic noise in [-1, 1]. */
function noise(i: number) {
  const x = Math.sin(i * 12.9898) * 43758.5453;
  return (x - Math.floor(x)) * 2 - 1;
}

/** Downtrend → selling climax → range with a spring → SOS → low-volume retest (LPS) → markup. */
export function accumulation(): Bar[] {
  const bars: Bar[] = [];
  let t = Date.UTC(2026, 0, 5);
  const push = (o: number, h: number, l: number, c: number, v: number) => {
    bars.push({ t, o, h, l, c, v });
    t += HOUR;
  };
  let p = 200;
  for (let i = 0; i < 120; i++) {
    const o = p;
    p -= 0.65 + noise(i) * 0.4;
    push(o, Math.max(o, p) + 0.8, Math.min(o, p) - 0.8, p, 1000 + noise(i + 7) * 150);
  }
  push(p, p + 0.5, 117, 119, 4500); // SC
  p = 119;
  for (let i = 0; i < 5; i++) { const o = p; p += 2.2; push(o, p + 0.6, o - 0.6, p, 1500); }
  for (let i = 0; i < 50; i++) {
    const o = p;
    p = 125 + Math.sin(i / 3) * 5.5 + noise(i + 300) * 0.6;
    push(o, Math.min(131.5, Math.max(o, p) + 0.7), Math.max(118.5, Math.min(o, p) - 0.7), p, 700 + noise(i + 500) * 80);
  }
  push(p, p + 0.4, 114, 120.5, 1200); // Spring
  p = 120.5;
  for (let i = 0; i < 9; i++) { const o = p; p += 1.1; push(o, p + 0.5, o - 0.5, p, 800); }
  push(p, 136.5, p - 0.3, 136, 3200); // SOS
  p = 136;
  for (let i = 0; i < 4; i++) { const o = p; p += 1; push(o, p + 0.4, o - 0.4, p, 1400); }
  for (let i = 0; i < 4; i++) { const o = p; p -= 1.8; push(o, o + 0.3, Math.max(132.3, p - 0.3), Math.max(133, p), 450); } // LPS
  return bars;
}

