import { describe, expect, it } from 'vitest';
import { analyze } from '../src/engine/analyze';
import { buildStory } from '../src/engine/context';
import type { Bar } from '../src/engine/types';

// Chạy với dữ liệu thật: LIVE=1 npx vitest run tests/live.test.ts
const live = process.env.LIVE ? describe : describe.skip;

async function binance(symbol: string, interval: string, perp = false): Promise<Bar[]> {
  const base = perp ? 'https://fapi.binance.com/fapi/v1/klines' : 'https://api.binance.com/api/v3/klines';
  const rows: any[] = await (await fetch(`${base}?symbol=${symbol}&interval=${interval}&limit=1000`)).json();
  return rows.map((r) => ({ t: r[0], o: +r[1], h: +r[2], l: +r[3], c: +r[4], v: +r[5] }));
}

live('live data', () => {
  for (const [sym, tf, perp] of [['BTCUSDT', '1h', false], ['ETHUSDT', '15m', false], ['XAUUSDT', '1h', true], ['CLUSDT', '5m', true]] as const) {
    it(`${sym} ${tf}`, async () => {
      const bars = await binance(sym, tf, perp);
      const a = analyze(bars);
      const counts: Record<string, number> = {};
      a.events.forEach((e) => { counts[e.code] = (counts[e.code] || 0) + 1; });
      const s = buildStory(bars, a, 'vi');
      console.log(`\n== ${sym} ${tf} (${bars.length} nến, ${a.events.length} sự kiện, ${a.boxes.length} vùng)`);
      console.log(JSON.stringify(counts));
      console.log([s.supplyDemand, s.effort, s.cause, s.phase, s.matches.map((m) => `#${m.def.id}(${m.score})`).join(' '), s.scenario, s.invalidation].join('\n'));
      expect(a.events.length).toBeLessThan(bars.length / 4);
    }, 30_000);
  }
});
