import { describe, expect, it } from 'vitest';
// @ts-expect-error plain ESM module shared with the production server
import { aggregate } from '../server/api.mjs';

const DAY = 86_400_000;
const bar = (t: number, c: number, v = 1) => ({ t, o: c, h: c + 1, l: c - 1, c, v });

describe('aggregate', () => {
  it('builds Monday-based weeks from daily bars', () => {
    const fri = Date.UTC(2026, 9, 23), mon = Date.UTC(2026, 9, 26);
    const out = aggregate([bar(fri, 10), bar(mon, 11), bar(mon + DAY, 12, 2)], 'W');
    expect(out.map((b: { t: number }) => new Date(b.t).toISOString().slice(0, 10))).toEqual(['2026-10-19', '2026-10-26']);
    expect(out[1]).toMatchObject({ o: 11, c: 12, h: 13, l: 10, v: 3 });
  });

  it('builds calendar months from daily bars', () => {
    const out = aggregate([bar(Date.UTC(2026, 8, 30), 5), bar(Date.UTC(2026, 9, 1), 6), bar(Date.UTC(2026, 9, 31), 7)], 'M');
    expect(out.map((b: { t: number }) => new Date(b.t).toISOString().slice(0, 10))).toEqual(['2026-09-01', '2026-10-01']);
    expect(out[1]).toMatchObject({ o: 6, c: 7, v: 2 });
  });
});
