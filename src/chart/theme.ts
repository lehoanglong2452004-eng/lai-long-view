/** Colors the user can edit are plain hex; translucent fills are derived when drawing. */
export interface ChartTheme {
  bg: string;
  text: string;
  muted: string;
  grid: string;
  axisLine: string;
  up: string;
  down: string;
  vwapD: string;
  vwapW: string;
  vwapM: string;
  vp: string;
  vpPoc: string;
  volSpot: string;
  volFut: string;
  crosshair: string;
  watermark: string;
}

export const LIGHT_THEME: ChartTheme = {
  bg: '#ffffff',
  text: '#111111',
  muted: '#6b6b6b',
  grid: '#f0f0ee',
  axisLine: '#d9d9d6',
  up: '#127a55',
  down: '#c23a2b',
  vwapD: '#e08a00',
  vwapW: '#2b5fb8',
  vwapM: '#7a3db8',
  vp: '#5a5a5a',
  vpPoc: '#e08a00',
  volSpot: '#2b5fb8',
  volFut: '#b8742b',
  crosshair: '#8a8a8a',
  watermark: '#000000',
};

export const DARK_THEME: ChartTheme = {
  ...LIGHT_THEME,
  bg: '#0d0d0d',
  text: '#e8e8e8',
  muted: '#9a9a9a',
  grid: '#1c1c1c',
  axisLine: '#333333',
  up: '#26b07a',
  down: '#e0554a',
  vp: '#c8c8c8',
  watermark: '#ffffff',
};

export const THEME_LABELS: Array<[keyof ChartTheme, string, string]> = [
  ['bg', 'Nền', 'Background'],
  ['text', 'Chữ', 'Text'],
  ['grid', 'Lưới', 'Grid'],
  ['up', 'Nến tăng', 'Up candle'],
  ['down', 'Nến giảm', 'Down candle'],
  ['vwapD', 'VWAP phiên', 'Session VWAP'],
  ['vwapW', 'VWAP tuần', 'Weekly VWAP'],
  ['vwapM', 'VWAP tháng', 'Monthly VWAP'],
  ['vp', 'Volume profile', 'Volume profile'],
  ['vpPoc', 'POC', 'POC'],
  ['volSpot', 'Volume Spot (gộp)', 'Spot volume (merged)'],
  ['volFut', 'Volume Futures (gộp)', 'Futures volume (merged)'],
  ['watermark', 'Chữ chìm', 'Watermark'],
];

export function withAlpha(hex: string, a: number): string {
  const m = /^#?([0-9a-f]{6})$/i.exec(hex.trim());
  if (!m) return hex;
  const n = parseInt(m[1], 16);
  return `rgba(${(n >> 16) & 255},${(n >> 8) & 255},${n & 255},${a})`;
}
