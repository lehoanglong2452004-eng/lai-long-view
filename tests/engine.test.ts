import { describe, expect, it } from 'vitest';
import { analyze } from '../src/engine/analyze';
import { buildStory } from '../src/engine/context';
import { volumeProfile, vwapPeriodic } from '../src/engine/indicators';
import { scorePatterns } from '../src/engine/patterns';
import type { Bar } from '../src/engine/types';
import { accumulation } from './fixtures';

const HOUR = 3600_000;

describe('engine', () => {
  const bars = accumulation();
  const a = analyze(bars);
  const codes = a.events.map((e) => e.code);

  it('finds the Wyckoff events of an accumulation', () => {
    expect(a.hasVolume).toBe(true);
    expect(codes).toContain('SC');
    expect(codes).toContain('SPRING');
    expect(codes).toContain('SOS');
    expect(codes).toContain('LPS');
    expect(codes.indexOf('SC')).toBeLessThan(codes.indexOf('SPRING'));
    expect(codes.indexOf('SPRING')).toBeLessThan(codes.indexOf('SOS'));
  });

  it('marks the range as accumulation broken upward', () => {
    expect(a.box?.prior).toBe(-1);
    expect(a.box?.broken).toBe(1);
    expect(a.box?.strongBreak).toBe(true);
  });

  it('tells the phase D story and ranks the retest pattern', () => {
    const s = buildStory(bars, a, 'vi');
    expect(s.phase).toContain('Tích lũy');
    expect(s.phase).toContain('pha D');
    const ids = scorePatterns(a.lastSeen, bars.length - 1, a.params.decay).slice(0, 4).map((m) => m.def.id);
    expect(ids).toContain(19);
  });

  it('never looks ahead: events on a prefix match events on the full series', () => {
    const cut = bars.length - 10;
    const early = analyze(bars.slice(0, cut)).events.filter((e) => e.i < cut - 1);
    const full = a.events.filter((e) => e.i < cut - 1);
    expect(early.map((e) => `${e.code}@${e.i}`)).toEqual(full.map((e) => `${e.code}@${e.i}`));
  });
});

describe('indicators', () => {
  it('resets session VWAP each UTC day', () => {
    const day = Date.UTC(2026, 0, 5);
    const bars: Bar[] = [
      { t: day + 22 * HOUR, o: 10, h: 10, l: 10, c: 10, v: 1 },
      { t: day + 23 * HOUR, o: 20, h: 20, l: 20, c: 20, v: 1 },
      { t: day + 24 * HOUR, o: 30, h: 30, l: 30, c: 30, v: 1 },
    ];
    expect(vwapPeriodic(bars, 'D').vwap).toEqual([10, 15, 30]);
  });

  it('puts the POC where most volume traded', () => {
    const bars: Bar[] = Array.from({ length: 20 }, (_, i) => ({ t: i, o: 100, h: 101, l: 99, c: 100, v: i === 5 ? 50 : 1 }));
    bars.push({ t: 99, o: 110, h: 111, l: 109, c: 110, v: 1 });
    const vp = volumeProfile(bars, 0, bars.length - 1, 12)!;
    const poc = vp.lo + (vp.poc + 0.5) * vp.step;
    expect(poc).toBeGreaterThan(99);
    expect(poc).toBeLessThan(101);
    expect(vp.val).toBeLessThanOrEqual(99.1);
  });
});
