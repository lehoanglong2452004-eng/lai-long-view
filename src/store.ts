import { LIGHT_THEME, type ChartTheme } from './chart/theme';
import type { Lang } from './engine/context';
import type { Instrument, TF } from './data/types';

export interface ChartCfg {
  id: string;
  inst: Instrument;
  /** Index into inst.sources. */
  src: number;
  tf: TF;
  minimized: boolean;
  /** Crypto only: add the volume of the same market on the other exchanges (spot and futures kept apart). */
  agg?: boolean;
  /** Options profile expiry filter: 'all', 'nearest' or a date (YYYY-MM-DD). */
  ovpExpiry?: string;
}

export interface Settings {
  lang: Lang;
  theme: ChartTheme;
  showVP: boolean;
  /** Options Volume Profile (BTC, ETH, SOL charts). */
  ovp: boolean;
  ovpMetric: 'oi' | 'vol';
  vpSide: 'left' | 'right';
  vpWidth: number;
  vpRows: number;
  showVWAP: boolean;
  vwap: { D: boolean; W: boolean; M: boolean };
  avwap: boolean;
  wyckoff: boolean;
  watermark: boolean;
  sync: boolean;
  syncTf: TF;
}

export interface AppState {
  charts: ChartCfg[];
  activeId: string;
  maxId: string | null;
  tab: 'charts' | 'context';
  settings: Settings;
}

export const DEFAULT_SETTINGS: Settings = {
  lang: 'vi',
  theme: LIGHT_THEME,
  showVP: true,
  ovp: false,
  ovpMetric: 'oi',
  vpSide: 'right',
  vpWidth: 0.24,
  vpRows: 40,
  showVWAP: true,
  vwap: { D: true, W: true, M: false },
  avwap: true,
  wyckoff: true,
  watermark: true,
  sync: false,
  syncTf: '1H',
};

/** Charts opened on first launch, then the order in which extra charts are added. */
export const DEFAULT_KEYS: Array<[string, TF]> = [
  ['DXY', '5m'], ['XAUUSD', '1H'], ['WTI', '1D'],
  ['BTC', '1H'], ['SPX', '1H'], ['EURUSD', '1H'], ['XAGUSD', '1H'], ['US10Y', '1D'],
  ['VNINDEX', '1D'], ['ETH', '1H'], ['BRENT', '1H'], ['NDX', '1H'],
];

const KEY = 'lailong:v1';

export function loadState(): AppState | null {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return null;
    const s = JSON.parse(raw) as AppState;
    if (!Array.isArray(s.charts) || !s.charts.length) return null;
    return { ...s, settings: { ...DEFAULT_SETTINGS, ...s.settings, theme: { ...LIGHT_THEME, ...s.settings?.theme } } };
  } catch {
    return null;
  }
}

export function saveState(s: AppState) {
  try { localStorage.setItem(KEY, JSON.stringify(s)); } catch { /* private mode or quota: settings stay in memory */ }
}

let seq = 0;
export const newId = () => `c${Date.now().toString(36)}${(seq++).toString(36)}`;

/** Grid columns and rows for a number of visible charts (max 12). */
export function gridFor(count: number): { cols: number; rows: number } {
  if (count <= 1) return { cols: 1, rows: 1 };
  if (count === 2) return { cols: 2, rows: 1 };
  if (count === 3) return { cols: 2, rows: 2 };
  if (count === 4) return { cols: 2, rows: 2 };
  if (count <= 6) return { cols: 3, rows: 2 };
  if (count <= 8) return { cols: 4, rows: 2 };
  if (count === 9) return { cols: 3, rows: 3 };
  return { cols: 4, rows: 3 };
}
