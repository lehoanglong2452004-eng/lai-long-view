import type { Dir, EventCode } from './types';

export type Family = 'A' | 'B' | 'C' | 'D' | 'E' | 'F';

export interface Variant { dir: Dir; w: Array<[EventCode, number]> }

export interface PatternDef {
  id: number;
  family: Family | null;
  vi: string;
  en: string;
  variants: Variant[];
}

export const FAMILY_NAMES: Record<Family, { vi: string; en: string }> = {
  A: { vi: 'Đồng biến', en: 'Harmony' },
  B: { vi: 'Phân kỳ, cạn kiệt', en: 'Divergence, exhaustion' },
  C: { vi: 'Cao trào', en: 'Climax' },
  D: { vi: 'Nền giá (nguyên nhân)', en: 'Base (cause)' },
  E: { vi: 'Phá vỡ (kết quả)', en: 'Breakout (effect)' },
  F: { vi: 'Kiểm định', en: 'Test' },
};

const up = (...w: Array<[EventCode, number]>): Variant => ({ dir: 1, w });
const dn = (...w: Array<[EventCode, number]>): Variant => ({ dir: -1, w });

/** The 31 volume patterns. Patterns without an explanation in the source document have no rules. */
export const PATTERNS: PatternDef[] = [
  { id: 1, family: 'E', vi: 'Nền phẳng, phá vỡ kèm volume tăng mạnh', en: 'Flat base breakout on surging volume', variants: [up(['FLAT_BASE', 0.5], ['SOS', 0.5])] },
  { id: 2, family: 'B', vi: 'Xu hướng giảm suy yếu: giảm volume giảm, hồi volume tăng', en: 'Weakening downtrend: volume falls on drops, rises on rallies', variants: [up(['SHIFT_UP', 0.6], ['DIV_BOT', 0.4])] },
  { id: 3, family: 'A', vi: 'Volume thuận xu hướng (cần xem khung lớn hơn)', en: 'Volume follows the trend (check a higher timeframe)', variants: [up(['HARM_UP', 0.7], ['NS', 0.3])] },
  { id: 4, family: 'B', vi: 'Đỉnh A-B-C cao dần, volume giảm dần', en: 'Higher peaks A-B-C on falling volume', variants: [dn(['DIV_TOP', 1])] },
  { id: 5, family: 'B', vi: 'Hồi lên trong xu hướng giảm, volume giảm', en: 'Rally in a downtrend on falling volume', variants: [dn(['HARM_DN', 0.5], ['ND', 0.5])] },
  { id: 6, family: 'A', vi: 'Giảm mạnh kèm volume tăng', en: 'Sharp decline on rising volume', variants: [dn(['HARM_DN', 0.6], ['SOW', 0.4])] },
  { id: 7, family: 'A', vi: 'Quy tắc đồng biến ở cả thị trường tăng và giảm', en: 'Volume goes with the trend, both ways', variants: [up(['HARM_UP', 1]), dn(['HARM_DN', 1])] },
  { id: 8, family: 'C', vi: 'Tăng parabol, volume dốc đứng tạo đỉnh', en: 'Parabolic blow-off with steep volume', variants: [dn(['PARA_UP', 0.6], ['BC', 0.4])] },
  { id: 9, family: 'C', vi: 'Cao trào bán: volume cực đại ở đáy', en: 'Selling climax: peak volume at the low', variants: [up(['SC', 0.6], ['ABS_LO', 0.2], ['NS', 0.2])] },
  { id: 10, family: 'F', vi: 'Hai đáy, đáy sau volume thấp hơn', en: 'Double bottom, lower volume on the retest', variants: [up(['DB', 0.6], ['SC', 0.2], ['DIV_BOT', 0.2])] },
  { id: 11, family: 'E', vi: 'Gãy trendline kèm volume tăng', en: 'Trendline break on rising volume', variants: [dn(['TL_DN', 1]), up(['TL_UP', 1])] },
  { id: 12, family: 'D', vi: 'Phân phối ở đỉnh', en: 'Distribution at the top', variants: [dn(['ABS_HI', 0.5], ['RANGE_DIST', 0.3], ['BC', 0.2])] },
  { id: 13, family: 'D', vi: 'Tích lũy ở đáy', en: 'Accumulation at the bottom', variants: [up(['ABS_LO', 0.4], ['RANGE_ACC', 0.4], ['SC', 0.2])] },
  { id: 14, family: 'D', vi: 'Nghỉ (volume cạn, biên độ hẹp) rồi bứt phá', en: 'Rest (dry volume, tight range) then a sharp move', variants: [up(['SQZ', 0.5], ['SOS', 0.5]), dn(['SQZ', 0.5], ['SOW', 0.5])] },
  { id: 15, family: 'B', vi: 'Lập đỉnh nhưng volume suy giảm', en: 'New high on fading volume', variants: [dn(['DIV_TOP', 0.5], ['ND', 0.5])] },
  { id: 16, family: 'E', vi: 'Sideway hẹp, phá cản trên kèm volume', en: 'Tight range, upside breakout on volume', variants: [up(['SQZ', 0.4], ['SOS', 0.6])] },
  { id: 17, family: 'E', vi: 'Phá vỡ giả: volume giảm khi phá vỡ', en: 'False breakout on shrinking volume', variants: [dn(['BO_UP_WEAK', 0.4], ['UT', 0.6]), up(['BO_DN_WEAK', 0.4], ['SPRING', 0.6])] },
  { id: 18, family: 'E', vi: 'Phá vỡ xuống thật: volume tăng khi thủng hỗ trợ', en: 'True breakdown on expanding volume', variants: [dn(['SOW', 1])] },
  { id: 19, family: 'F', vi: 'Hồi test vùng phá vỡ với volume giảm', en: 'Low-volume retest of the breakout level', variants: [dn(['LPSY', 0.7], ['SOW', 0.3]), up(['LPS', 0.7], ['SOS', 0.3])] },
  { id: 20, family: null, vi: 'Tài liệu không có lời giải thích', en: 'No explanation in the source', variants: [] },
  { id: 21, family: 'D', vi: 'Vai–đầu–vai đỉnh dưới góc nhìn volume', en: 'Head and shoulders top with volume', variants: [dn(['HS', 1])] },
  { id: 22, family: 'E', vi: 'Mục tiêu giá vai–đầu–vai sau phá vỡ', en: 'Head and shoulders measured target', variants: [dn(['HS', 0.4], ['NECK_DN', 0.6])] },
  { id: 23, family: 'D', vi: 'Vai–đầu–vai đảo ngược, phá vỡ kèm volume', en: 'Inverse head and shoulders, breakout on volume', variants: [up(['IHS', 0.5], ['NECK_UP', 0.5])] },
  { id: 24, family: 'D', vi: 'Hai đỉnh, đỉnh sau volume thấp hơn', en: 'Double top, lower volume on the second peak', variants: [dn(['DT', 0.6], ['NECK_DN', 0.4])] },
  { id: 25, family: 'D', vi: 'Hai đáy (ngược với hai đỉnh)', en: 'Double bottom', variants: [up(['DB', 0.6], ['NECK_UP', 0.4])] },
  { id: 26, family: null, vi: 'Tài liệu không có lời giải thích', en: 'No explanation in the source', variants: [] },
  { id: 27, family: 'E', vi: 'Tam giác, phá vỡ tại đường trendline', en: 'Triangle, breakout through the trendline', variants: [up(['TRI', 0.5], ['SOS', 0.5]), dn(['TRI', 0.5], ['SOW', 0.5])] },
  { id: 28, family: null, vi: 'Tài liệu không có lời giải thích', en: 'No explanation in the source', variants: [] },
  { id: 29, family: 'D', vi: 'Đáy tròn, volume hình chữ U', en: 'Rounding bottom with U-shaped volume', variants: [up(['ROUND_BOT', 1])] },
  { id: 30, family: 'D', vi: 'Đỉnh tròn', en: 'Rounding top', variants: [dn(['ROUND_TOP', 1])] },
  { id: 31, family: 'D', vi: 'Cốc – tay cầm, xác nhận bằng phá vỡ kèm volume', en: 'Cup with handle, confirmed by a volume breakout', variants: [up(['CUP', 0.6], ['SOS', 0.4])] },
];

export interface PatternMatch { def: PatternDef; dir: Dir; score: number }

/** Freshness of an event: 1 within 3 bars, fading linearly to 0 at `decay` bars. */
export function freshness(barsSince: number | undefined, decay: number): number {
  if (barsSince === undefined || barsSince < 0) return 0;
  if (barsSince <= 3) return 1;
  return Math.max(0, 1 - (barsSince - 3) / (decay - 3));
}

export function scorePatterns(lastSeen: Partial<Record<EventCode, number>>, at: number, decay: number): PatternMatch[] {
  const out: PatternMatch[] = [];
  for (const def of PATTERNS) {
    let best: PatternMatch | null = null;
    for (const v of def.variants) {
      let s = 0, tw = 0;
      for (const [code, w] of v.w) {
        const seen = lastSeen[code];
        s += w * freshness(seen === undefined ? undefined : at - seen, decay);
        tw += w;
      }
      const score = tw > 0 ? Math.round((100 * s) / tw) : 0;
      if (!best || score > best.score) best = { def, dir: v.dir, score };
    }
    if (best) out.push(best);
  }
  return out.sort((a, b) => b.score - a.score);
}
