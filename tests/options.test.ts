import { describe, expect, it } from 'vitest';
import { buildOptionsProfile, optionCoinOf, type OptionsSnapshot } from '../src/data/options';
import type { Instrument } from '../src/data/types';

const snap: OptionsSnapshot = {
  coin: 'BTC',
  updatedAt: 0,
  sources: [],
  rows: [
    // Near expiry: a big put block at 90 and a call block at 110.
    { x: 'Deribit', e: '2026-10-30', k: 90, c: 'P', oi: 50, v: 5 },
    { x: 'Deribit', e: '2026-10-30', k: 110, c: 'C', oi: 40, v: 1 },
    { x: 'Bybit', e: '2026-10-30', k: 100, c: 'C', oi: 10, v: 20 },
    { x: 'Bybit', e: '2026-10-30', k: 100, c: 'P', oi: 5, v: 0 },
    // Far expiry: calls stacked at 120.
    { x: 'OKX', e: '2026-12-25', k: 120, c: 'C', oi: 200, v: 2 },
    { x: 'Binance', e: '2026-12-25', k: 95, c: 'P', oi: 20, v: 0 },
  ],
};

describe('options profile', () => {
  it('filters by expiry and finds walls within ±25% of price', () => {
    const near = buildOptionsProfile(snap, 'oi', '2026-10-30', 100);
    expect(near.strikes.map((s) => s.k)).toEqual([90, 100, 110]);
    expect(near.callWall).toBe(110);
    expect(near.putWall).toBe(90);
    expect(near.sources.sort()).toEqual(['Bybit', 'Deribit']);

    const all = buildOptionsProfile(snap, 'oi', 'all', 100);
    expect(all.callWall).toBe(120);
    expect(all.expiries.map((e) => e.date)).toEqual(['2026-10-30', '2026-12-25']);
    expect(buildOptionsProfile(snap, 'oi', 'nearest', 100).strikes).toEqual(near.strikes);
  });

  it('puts max pain where option holders lose the most', () => {
    // At 90 the 100-put pays 5×10, at 110 the 100-call pays 10×10; at 100 nothing pays out.
    expect(buildOptionsProfile(snap, 'oi', '2026-10-30', 100).maxPain).toBe(100);
  });

  it('switches bars to 24h volume but keeps walls on open interest', () => {
    const vol = buildOptionsProfile(snap, 'vol', '2026-10-30', 100);
    expect(vol.strikes.find((s) => s.k === 100)?.call).toBe(20);
    expect(vol.callWall).toBe(110);
    expect(vol.pcr).toBeCloseTo(5 / 21);
  });

  it('recognises BTC, ETH and SOL charts only', () => {
    const inst = (display: string, symbol: string, kind: Instrument['kind'] = 'crypto'): Instrument =>
      ({ key: display, kind, vi: display, en: display, display, sources: [{ source: 'binance', symbol, status: { mode: 'rt' } }] });
    expect(optionCoinOf(inst('BTC', 'BTCUSDT'))).toBe('BTC');
    expect(optionCoinOf(inst('SOLUSDT', 'SOLUSDT'))).toBe('SOL');
    expect(optionCoinOf(inst('ETHBTC', 'ETHBTC'))).toBeNull();
    expect(optionCoinOf(inst('SOLVUSDT', 'SOLVUSDT'))).toBeNull();
    expect(optionCoinOf(inst('XAUUSD', 'XAUUSDT', 'commodity'))).toBeNull();
  });
});
