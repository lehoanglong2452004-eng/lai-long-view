import { lastAnchor, type Analysis } from './analyze';
import { avwap, vwapPeriodic, volumeProfile, type VolumeProfile } from './indicators';
import { scorePatterns, type PatternMatch } from './patterns';
import type { Bar, Box, Dir, EngineEvent, EventCode } from './types';

export type Lang = 'vi' | 'en';

export const EVENT_TEXT: Record<EventCode, { vi: string; en: string }> = {
  SC: { vi: 'Cao trào bán: volume cực lớn, biên độ rộng ở đáy mới', en: 'Selling climax: huge volume, wide bar at a new low' },
  BC: { vi: 'Cao trào mua: volume cực lớn, biên độ rộng ở đỉnh mới', en: 'Buying climax: huge volume, wide bar at a new high' },
  ABS_LO: { vi: 'Hấp thụ ở vùng thấp: nỗ lực lớn, kết quả nhỏ', en: 'Absorption low: big effort, small result' },
  ABS_HI: { vi: 'Hấp thụ ở vùng cao: nỗ lực lớn, kết quả nhỏ', en: 'Absorption high: big effort, small result' },
  NS: { vi: 'Không còn cung: nến giảm hẹp, volume cạn', en: 'No supply: narrow down bar on dry volume' },
  ND: { vi: 'Không còn cầu: nến tăng hẹp, volume cạn', en: 'No demand: narrow up bar on dry volume' },
  DIV_TOP: { vi: 'Phân kỳ đỉnh: đỉnh cao hơn nhưng volume sóng tăng yếu hơn', en: 'Top divergence: higher high on a weaker up-wave' },
  DIV_BOT: { vi: 'Test đáy: đáy không thấp hơn đáng kể, volume sóng giảm yếu hơn', en: 'Bottom test: no real lower low, weaker down-wave' },
  HARM_UP: { vi: 'Đồng biến tăng: sóng tăng volume lớn hơn sóng giảm', en: 'Bullish harmony: up-waves outweigh down-waves' },
  HARM_DN: { vi: 'Đồng biến giảm: sóng giảm volume lớn hơn sóng hồi', en: 'Bearish harmony: down-waves outweigh rallies' },
  SHIFT_UP: { vi: 'Cầu quay lại: trong xu hướng giảm, sóng hồi có volume lớn hơn', en: 'Demand returning inside a downtrend' },
  RANGE: { vi: 'Đang sideway', en: 'Trading range' },
  RANGE_ACC: { vi: 'Sideway sau xu hướng giảm (tích lũy?)', en: 'Range after a decline (accumulation?)' },
  RANGE_DIST: { vi: 'Sideway sau xu hướng tăng (phân phối?)', en: 'Range after an advance (distribution?)' },
  SQZ: { vi: 'Nén volume trong vùng sideway', en: 'Volume dry-up inside the range' },
  SOS: { vi: 'SOS: phá đỉnh vùng kèm volume lớn', en: 'SOS: range breakout on high volume' },
  SOW: { vi: 'SOW: thủng đáy vùng kèm volume lớn', en: 'SOW: range breakdown on high volume' },
  BO_UP_WEAK: { vi: 'Phá đỉnh vùng nhưng volume thấp — nghi phá vỡ giả', en: 'Upside break on low volume — suspect' },
  BO_DN_WEAK: { vi: 'Thủng đáy vùng nhưng volume thấp — nghi phá vỡ giả', en: 'Downside break on low volume — suspect' },
  UT: { vi: 'Upthrust: vượt đỉnh vùng rồi đóng cửa quay lại', en: 'Upthrust: poked above the range and closed back in' },
  SPRING: { vi: 'Spring: thủng đáy vùng rồi đóng cửa quay lại', en: 'Spring: dipped below the range and closed back in' },
  LPS: { vi: 'LPS: test lại đỉnh vùng cũ với volume thấp', en: 'LPS: low-volume retest of the old range top' },
  LPSY: { vi: 'LPSY: hồi test đáy vùng cũ với volume thấp', en: 'LPSY: low-volume retest of the old range bottom' },
  PARA_UP: { vi: 'Tăng parabol, volume dồn dập', en: 'Parabolic advance on heavy volume' },
  TL_DN: { vi: 'Gãy xu hướng tăng kèm volume', en: 'Uptrend line broken on volume' },
  TL_UP: { vi: 'Gãy xu hướng giảm kèm volume', en: 'Downtrend line broken on volume' },
  DT: { vi: 'Hai đỉnh, đỉnh sau volume thấp hơn', en: 'Double top, lighter volume on the second peak' },
  DB: { vi: 'Hai đáy, đáy sau volume thấp hơn', en: 'Double bottom, lighter volume on the retest' },
  HS: { vi: 'Vai–đầu–vai đỉnh, vai phải volume thấp', en: 'Head and shoulders, light right shoulder' },
  IHS: { vi: 'Vai–đầu–vai đảo ngược', en: 'Inverse head and shoulders' },
  NECK_DN: { vi: 'Thủng đường viền cổ kèm volume', en: 'Neckline broken down on volume' },
  NECK_UP: { vi: 'Vượt đường viền cổ kèm volume', en: 'Neckline broken up on volume' },
  TRI: { vi: 'Tam giác hội tụ, volume co lại', en: 'Converging triangle, contracting volume' },
  ROUND_BOT: { vi: 'Đáy tròn, volume hình chữ U', en: 'Rounding bottom, U-shaped volume' },
  ROUND_TOP: { vi: 'Đỉnh tròn', en: 'Rounding top' },
  FLAT_BASE: { vi: 'Nền phẳng hẹp trên EMA50 dốc lên', en: 'Tight flat base above a rising EMA50' },
  CUP: { vi: 'Cốc: giá về gần đỉnh vùng, nhịp chỉnh volume thấp', en: 'Cup: price back near the top on a quiet pullback' },
};

export interface Story {
  lang: Lang;
  hasVolume: boolean;
  supplyDemand: string;
  sdBias: Dir;
  effort: string;
  cause: string;
  phase: string;
  matches: PatternMatch[];
  scenario: string;
  invalidation: string;
  recent: Array<{ ev: EngineEvent; text: string; time: number }>;
  profile: VolumeProfile | null;
}

const T = {
  demand: { vi: 'Cầu kiểm soát', en: 'Demand in control' },
  supply: { vi: 'Cung kiểm soát', en: 'Supply in control' },
  balance: { vi: 'Cân bằng', en: 'Balanced' },
  noVol: { vi: 'Nguồn này không có volume: chỉ chạy các luật về giá, kết luận hạn chế.', en: 'No volume from this source: price-only rules, limited conclusions.' },
};

function fmt(x: number, d: number) {
  return Number.isFinite(x) ? x.toFixed(d) : '—';
}

export function decimalsFor(price: number) {
  const a = Math.abs(price);
  return a >= 1000 ? 1 : a >= 10 ? 2 : a >= 1 ? 3 : a >= 0.01 ? 5 : 8;
}

export function buildStory(bars: Bar[], a: Analysis, lang: Lang, vpFrom?: number): Story {
  const n = bars.length;
  const i = n - 1;
  const b = bars[i];
  const d = decimalsFor(b.c);
  const L = (x: { vi: string; en: string }) => x[lang];

  // Supply – demand.
  const vd = vwapPeriodic(bars, 'D').vwap;
  const vw = vwapPeriodic(bars, 'W').vwap;
  const profile = volumeProfile(bars, vpFrom ?? Math.max(0, n - 200), i, 40);
  let s = 0;
  s += b.c > vd[i] ? 1 : -1;
  s += b.c > vw[i] ? 1 : -1;
  if (i >= 5) s += vw[i] > vw[i - 5] ? 1 : vw[i] < vw[i - 5] ? -1 : 0;
  const poc = profile ? profile.lo + (profile.poc + 0.5) * profile.step : NaN;
  if (Number.isFinite(poc)) s += b.c > poc ? 1 : -1;
  const sdBias: Dir = s >= 2 ? 1 : s <= -2 ? -1 : 0;
  const sdLabel = L(sdBias === 1 ? T.demand : sdBias === -1 ? T.supply : T.balance);
  const sdDetail = lang === 'vi'
    ? `giá ${b.c > vw[i] ? '>' : '<'} VWAP tuần ${fmt(vw[i], d)}, ${b.c > vd[i] ? '>' : '<'} VWAP phiên ${fmt(vd[i], d)}, POC ${fmt(poc, d)}`
    : `price ${b.c > vw[i] ? '>' : '<'} weekly VWAP ${fmt(vw[i], d)}, ${b.c > vd[i] ? '>' : '<'} session VWAP ${fmt(vd[i], d)}, POC ${fmt(poc, d)}`;

  // Effort – result on the last bar, plus the latest notable event.
  const rv = a.rvol[i], sp = a.spread[i];
  const P = a.params;
  let quad: string;
  if (!a.hasVolume) quad = L(T.noVol);
  else if (rv >= P.hi && sp >= P.wide) quad = lang === 'vi' ? 'Đồng thuận: nỗ lực lớn, kết quả lớn' : 'Harmony: big effort, big result';
  else if (rv >= P.hi && sp <= P.narrow) quad = lang === 'vi' ? 'Hấp thụ: nỗ lực lớn, kết quả nhỏ' : 'Absorption: big effort, small result';
  else if (rv <= P.lo && sp >= P.wide) quad = lang === 'vi' ? 'Đi dễ: nỗ lực nhỏ, kết quả lớn' : 'Ease of movement: small effort, big result';
  else if (rv <= P.lo && sp <= P.narrow) quad = lang === 'vi' ? 'Nghỉ / test: nỗ lực nhỏ, kết quả nhỏ' : 'Rest / test: small effort, small result';
  else quad = lang === 'vi' ? 'Bình thường' : 'Normal';
  const effort = a.hasVolume ? `${quad} (RVOL ${fmt(rv, 2)}, ${lang === 'vi' ? 'biên độ' : 'range'} ${fmt(sp, 2)} ATR)` : quad;

  // Cause – effect.
  const box = a.box;
  let cause = lang === 'vi' ? 'Chưa có vùng sideway rõ ràng' : 'No clear trading range';
  if (box) {
    const len = (box.broken === 0 ? i : box.brokenAt) - box.start + 1;
    const h = box.top - box.bot;
    const wAtr = h / (a.atr[i] || 1);
    const kind = box.kind === 'tri' ? (lang === 'vi' ? 'Tam giác' : 'Triangle') : 'Sideway';
    const base = `${kind} ${len} ${lang === 'vi' ? 'nến' : 'bars'}, ${lang === 'vi' ? 'rộng' : 'width'} ${fmt(wAtr, 1)} ATR [${fmt(box.bot, d)} – ${fmt(box.top, d)}]`;
    if (box.broken === 1) cause = `${base} → ${lang === 'vi' ? 'mục tiêu' : 'targets'} ${fmt(box.top + h, d)} / ${fmt(box.top + 1.618 * h, d)}`;
    else if (box.broken === -1) cause = `${base} → ${lang === 'vi' ? 'mục tiêu' : 'targets'} ${fmt(box.bot - h, d)} / ${fmt(box.bot - 1.618 * h, d)}`;
    else cause = `${base} → ${lang === 'vi' ? 'nếu phá lên' : 'if up'} ${fmt(box.top + h, d)}, ${lang === 'vi' ? 'nếu phá xuống' : 'if down'} ${fmt(box.bot - h, d)}`;
  }
  const pt = a.targets.filter((t) => t.from !== 'RANGE').at(-1);
  if (pt) cause += ` · ${pt.from} ${lang === 'vi' ? 'mục tiêu' : 'target'} ${fmt(pt.t1, d)}`;

  // Wyckoff phase.
  const since = (c: EventCode) => (a.lastSeen[c] === undefined ? Infinity : i - (a.lastSeen[c] as number));
  const { phase, scenario, invalidation } = phaseOf(bars, a, box, since, lang, d);

  const matches = scorePatterns(a.lastSeen, i, P.decay).filter((m) => m.score >= 40).slice(0, 3);
  const recent = a.events.slice(-8).reverse().map((ev) => ({ ev, text: L(EVENT_TEXT[ev.code]), time: bars[ev.at].t }));

  return {
    lang,
    hasVolume: a.hasVolume,
    supplyDemand: `${sdLabel} (${sdDetail})`,
    sdBias,
    effort,
    cause,
    phase,
    matches,
    scenario,
    invalidation,
    recent,
    profile,
  };
}

function phaseOf(bars: Bar[], a: Analysis, box: Box | null, since: (c: EventCode) => number, lang: Lang, d: number) {
  const i = bars.length - 1;
  const c = bars[i].c;
  const vi = lang === 'vi';
  const f = (x: number) => fmt(x, d);
  const trendUp = c > a.ema50[i] && a.ema50Slope[i] > 0;
  const volVi = a.hasVolume ? ` với RVOL ≥ ${a.params.hi}` : ' (nguồn không có volume để xác nhận)';
  const volEn = a.hasVolume ? ` with RVOL ≥ ${a.params.hi}` : ' (no volume to confirm)';
  const trendDn = c < a.ema50[i] && a.ema50Slope[i] < 0;

  if (box && box.broken === 0) {
    const accum = box.prior === -1, dist = box.prior === 1;
    const kind = accum ? (vi ? 'Tích lũy' : 'Accumulation') : dist ? (vi ? 'Phân phối' : 'Distribution') : (vi ? 'Sideway chưa rõ hướng' : 'Range, direction unclear');
    const springAgo = since('SPRING'), utAgo = since('UT');
    if (springAgo <= 15 && (accum || springAgo < utAgo)) {
      const sp = lastOf(a, 'SPRING');
      return {
        phase: `${kind} – ${vi ? 'pha C (Spring)' : 'phase C (Spring)'}`,
        scenario: vi ? `Chờ SOS: đóng cửa > ${f(box.top)}${volVi}` : `Wait for SOS: close > ${f(box.top)}${volEn}`,
        invalidation: vi ? `Đóng cửa < ${f(sp?.price ?? box.bot)} (đáy Spring)` : `Close < ${f(sp?.price ?? box.bot)} (Spring low)`,
      };
    }
    if (utAgo <= 15) {
      const ut = lastOf(a, 'UT');
      return {
        phase: `${kind} – ${vi ? 'pha C (Upthrust)' : 'phase C (Upthrust)'}`,
        scenario: vi ? `Chờ SOW: đóng cửa < ${f(box.bot)}${volVi}` : `Wait for SOW: close < ${f(box.bot)}${volEn}`,
        invalidation: vi ? `Đóng cửa > ${f(ut?.price ?? box.top)} (đỉnh Upthrust)` : `Close > ${f(ut?.price ?? box.top)} (Upthrust high)`,
      };
    }
    const climax = Math.min(since('SC'), since('BC'));
    const age = i - box.start;
    const ph = climax < 10 || (age < 10 && climax <= age + 10) ? 'A' : 'B';
    return {
      phase: `${kind} – ${vi ? 'pha' : 'phase'} ${ph}`,
      scenario: vi
        ? `Sideway ${f(box.bot)} – ${f(box.top)}: theo dõi test hai biên với volume thấp; chưa có tín hiệu vào lệnh`
        : `Range ${f(box.bot)} – ${f(box.top)}: watch low-volume tests of both edges; no entry signal yet`,
      invalidation: vi ? `Phá vỡ kèm volume lớn sẽ xác định hướng` : `A high-volume break will set the direction`,
    };
  }

  if (box && box.broken !== 0) {
    const ago = i - box.brokenAt;
    const upBreak = box.broken === 1;
    const kind = upBreak
      ? (box.prior === -1 ? (vi ? 'Tích lũy' : 'Accumulation') : (vi ? 'Tái tích lũy' : 'Re-accumulation'))
      : (box.prior === 1 ? (vi ? 'Phân phối' : 'Distribution') : (vi ? 'Tái phân phối' : 'Redistribution'));
    const mid = (box.top + box.bot) / 2;
    if (ago <= 20) {
      return {
        phase: `${kind} – ${vi ? 'pha D' : 'phase D'}${box.strongBreak ? (upBreak ? ' (SOS)' : ' (SOW)') : vi ? ' (phá vỡ chưa có volume xác nhận)' : ' (break not confirmed by volume)'}`,
        scenario: upBreak
          ? (vi ? `Canh LPS: giá về ${f(box.top)} hoặc AVWAP với volume thấp` : `Look for LPS: pullback to ${f(box.top)} or AVWAP on low volume`)
          : (vi ? `Canh LPSY: giá hồi về ${f(box.bot)} hoặc AVWAP với volume thấp` : `Look for LPSY: rally to ${f(box.bot)} or AVWAP on low volume`),
        invalidation: upBreak
          ? (vi ? `Đóng cửa < ${f(mid)} (giữa vùng)` : `Close < ${f(mid)} (range middle)`)
          : (vi ? `Đóng cửa > ${f(mid)} (giữa vùng)` : `Close > ${f(mid)} (range middle)`),
      };
    }
    if ((upBreak && c > a.ema50[i]) || (!upBreak && c < a.ema50[i])) {
      const anchor = lastAnchor(a, upBreak ? 1 : -1);
      const av = anchor ? avwap(bars, anchor.i)[i] : NaN;
      return {
        phase: upBreak ? (vi ? 'Pha E – xu hướng tăng (markup)' : 'Phase E – markup') : (vi ? 'Pha E – xu hướng giảm (markdown)' : 'Phase E – markdown'),
        scenario: upBreak
          ? (vi ? 'Đi theo xu hướng; cảnh giác phân kỳ đỉnh và cao trào mua' : 'Trend-follow; watch for top divergence and buying climax')
          : (vi ? 'Đi theo xu hướng giảm; cảnh giác test đáy và cao trào bán' : 'Trend-follow down; watch for bottom tests and selling climax'),
        invalidation: Number.isFinite(av)
          ? (vi ? `Đóng cửa ${upBreak ? '<' : '>'} AVWAP ${f(av)} (neo từ ${anchor!.code})` : `Close ${upBreak ? '<' : '>'} AVWAP ${f(av)} (anchored at ${anchor!.code})`)
          : (vi ? `Đóng cửa ${upBreak ? '<' : '>'} EMA50 ${f(a.ema50[i])}` : `Close ${upBreak ? '<' : '>'} EMA50 ${f(a.ema50[i])}`),
      };
    }
  }

  if (trendUp || trendDn) {
    return {
      phase: trendUp ? (vi ? 'Xu hướng tăng (markup)' : 'Uptrend (markup)') : (vi ? 'Xu hướng giảm (markdown)' : 'Downtrend (markdown)'),
      scenario: trendUp
        ? (vi ? 'Ưu tiên mua khi test lại với volume thấp' : 'Favor buying low-volume pullbacks')
        : (vi ? 'Ưu tiên bán khi hồi lên với volume thấp' : 'Favor selling low-volume rallies'),
      invalidation: vi ? `Đóng cửa ${trendUp ? '<' : '>'} EMA50 ${f(a.ema50[i])}` : `Close ${trendUp ? '<' : '>'} EMA50 ${f(a.ema50[i])}`,
    };
  }
  return {
    phase: vi ? 'Chưa rõ cấu trúc' : 'No clear structure',
    scenario: vi ? 'Đứng ngoài hoặc chờ vùng sideway hình thành' : 'Stand aside or wait for a range to form',
    invalidation: '—',
  };
}

function lastOf(a: Analysis, code: EventCode): EngineEvent | undefined {
  for (let k = a.events.length - 1; k >= 0; k--) if (a.events[k].code === code) return a.events[k];
  return undefined;
}
