export interface Bar {
  /** Open time, epoch milliseconds (UTC). */
  t: number;
  o: number;
  h: number;
  l: number;
  c: number;
  v: number;
}

export type Dir = 1 | -1 | 0;

export type EventCode =
  | 'SC' | 'BC' | 'ABS_LO' | 'ABS_HI' | 'NS' | 'ND'
  | 'DIV_TOP' | 'DIV_BOT' | 'HARM_UP' | 'HARM_DN' | 'SHIFT_UP'
  | 'RANGE' | 'RANGE_ACC' | 'RANGE_DIST' | 'SQZ' | 'SOS' | 'SOW' | 'BO_UP_WEAK' | 'BO_DN_WEAK'
  | 'UT' | 'SPRING' | 'LPS' | 'LPSY' | 'PARA_UP' | 'TL_DN' | 'TL_UP'
  | 'DT' | 'DB' | 'HS' | 'IHS' | 'NECK_DN' | 'NECK_UP' | 'TRI'
  | 'ROUND_BOT' | 'ROUND_TOP' | 'FLAT_BASE' | 'CUP';

/** Codes that describe a lasting condition rather than a single bar. They feed scoring but are not listed as events. */
export const STATE_CODES: ReadonlySet<EventCode> = new Set<EventCode>([
  'RANGE', 'RANGE_ACC', 'RANGE_DIST', 'SQZ', 'FLAT_BASE', 'CUP', 'ROUND_BOT', 'ROUND_TOP',
]);

export interface EngineEvent {
  code: EventCode;
  /** Bar index where the event became known (no look-ahead). */
  i: number;
  /** Bar index the event refers to (a pivot can be confirmed later than it formed). */
  at: number;
  dir: Dir;
  price: number;
}

export interface Box {
  start: number;
  end: number;
  top: number;
  bot: number;
  /** Trend before the range formed: 1 up, -1 down, 0 flat. */
  prior: Dir;
  /** 0 still active, 1 broke up, -1 broke down. */
  broken: Dir;
  brokenAt: number;
  strongBreak: boolean;
  kind: 'range' | 'tri';
}

export interface Params {
  volLen: number;
  atrLen: number;
  hi: number;
  lo: number;
  ultra: number;
  wide: number;
  narrow: number;
  pivotL: number;
  pivotR: number;
  rangeLen: number;
  rangeAtr: number;
  decay: number;
}

export const DEFAULT_PARAMS: Params = {
  volLen: 20,
  atrLen: 14,
  hi: 1.5,
  lo: 0.7,
  ultra: 2.5,
  wide: 1.3,
  narrow: 0.7,
  pivotL: 5,
  pivotR: 5,
  rangeLen: 30,
  rangeAtr: 6,
  decay: 40,
};
