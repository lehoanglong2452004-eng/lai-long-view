export type TF = '1M' | '1W' | '1D' | '4H' | '1H' | '30m' | '15m' | '5m' | '1m';

export const TIMEFRAMES: TF[] = ['1M', '1W', '1D', '4H', '1H', '30m', '15m', '5m', '1m'];

const MIN = 60_000;
export const TF_MS: Record<TF, number> = {
  '1m': MIN, '5m': 5 * MIN, '15m': 15 * MIN, '30m': 30 * MIN, '1H': 60 * MIN, '4H': 240 * MIN,
  '1D': 1440 * MIN, '1W': 7 * 1440 * MIN, '1M': 30 * 1440 * MIN,
};

export type SourceId = 'binance' | 'binance-perp' | 'okx' | 'okx-swap' | 'bybit' | 'bybit-perp' | 'hyperliquid' | 'yahoo' | 'vn';

export const SOURCE_LABEL: Record<SourceId, string> = {
  binance: 'Binance Spot', 'binance-perp': 'Binance Futures', okx: 'OKX Spot', 'okx-swap': 'OKX Futures', bybit: 'Bybit Spot',
  'bybit-perp': 'Bybit Futures', hyperliquid: 'Hyperliquid Futures', yahoo: 'Yahoo', vn: 'VNDirect',
};

/** Crypto-exchange markets, split so spot and futures volume are never mixed up. */
export const MARKET_TYPE: Partial<Record<SourceId, 'spot' | 'futures'>> = {
  binance: 'spot', okx: 'spot', bybit: 'spot',
  'binance-perp': 'futures', 'okx-swap': 'futures', 'bybit-perp': 'futures', hyperliquid: 'futures',
};

export interface Status { mode: 'rt' | 'delay' | 'eod' | 'unknown'; delayMin?: number }

export interface SourceRef { source: SourceId; symbol: string; note?: string; status: Status }

export type Kind = 'crypto' | 'stock' | 'index' | 'forex' | 'commodity' | 'bond' | 'future' | 'etf' | 'fund' | 'other';

/** A search result / chart subject: one market, possibly available from several sources. */
export interface Instrument {
  key: string;
  kind: Kind;
  vi: string;
  en: string;
  display: string;
  sources: SourceRef[];
}
