// Quyền chọn crypto gộp từ Deribit, Bybit, OKX, Binance: open interest và volume 24h theo kỳ hạn,
// giá thực hiện, Call/Put. Mọi số quy về đơn vị coin (1 hợp đồng Deribit/Bybit/Binance = 1 coin,
// OKX dùng oiCcy / volCcy24h đã quy sẵn ra coin).

export const OPTION_COINS = ['BTC', 'ETH', 'SOL'];

const MONTHS = { JAN: 0, FEB: 1, MAR: 2, APR: 3, MAY: 4, JUN: 5, JUL: 6, AUG: 7, SEP: 8, OCT: 9, NOV: 10, DEC: 11 };

/** "27NOV26" → "2026-11-27" */
function fromDmy(s) {
  const m = /^(\d{1,2})([A-Z]{3})(\d{2})$/.exec(s);
  return m ? new Date(Date.UTC(2000 + Number(m[3]), MONTHS[m[2]], Number(m[1]))).toISOString().slice(0, 10) : null;
}

/** "261127" → "2026-11-27" */
function fromYmd(s) {
  return /^\d{6}$/.test(s) ? `20${s.slice(0, 2)}-${s.slice(2, 4)}-${s.slice(4, 6)}` : null;
}

// Deribit writes decimal strikes with a "d" (e.g. 2d5 = 2.5).
const strikeOf = (s) => Number(String(s).replace('d', '.'));

async function deribit(coin, getJson) {
  const url = (cur) => `https://www.deribit.com/api/v2/public/get_book_summary_by_currency?currency=${cur}&kind=option`;
  const lists = await Promise.all([coin === 'SOL' ? Promise.resolve({ result: [] }) : getJson(url(coin)), getJson(url('USDC'))]);
  const rows = [];
  for (const x of [...lists[0].result, ...lists[1].result]) {
    const [under, date, strike, cp] = x.instrument_name.split('-');
    if (under !== coin && under !== `${coin}_USDC`) continue;
    rows.push({ e: fromDmy(date), k: strikeOf(strike), c: cp, oi: x.open_interest || 0, v: x.volume || 0 });
  }
  return rows;
}

async function bybit(coin, getJson) {
  const j = await getJson(`https://api.bybit.com/v5/market/tickers?category=option&baseCoin=${coin}`);
  return (j.result?.list || []).map((x) => {
    const [, date, strike, cp] = x.symbol.split('-');
    return { e: fromDmy(date), k: Number(strike), c: cp, oi: Number(x.openInterest) || 0, v: Number(x.volume24h) || 0 };
  });
}

async function okx(coin, getJson) {
  if (coin === 'SOL') return [];
  const fam = `${coin}-USD`;
  const [oi, tk] = await Promise.all([
    getJson(`https://www.okx.com/api/v5/public/open-interest?instType=OPTION&instFamily=${fam}`),
    getJson(`https://www.okx.com/api/v5/market/tickers?instType=OPTION&instFamily=${fam}`),
  ]);
  if (oi.code !== '0') throw new Error(`OKX ${oi.code}`);
  const vol = new Map((tk.data || []).map((x) => [x.instId, Number(x.volCcy24h) || 0]));
  return (oi.data || []).map((x) => {
    const [, , date, strike, cp] = x.instId.split('-');
    return { e: fromYmd(date), k: Number(strike), c: cp, oi: Number(x.oiCcy) || 0, v: vol.get(x.instId) || 0 };
  });
}

async function binance(coin, getJson) {
  const [info, tickers] = await Promise.all([getJson('https://eapi.binance.com/eapi/v1/exchangeInfo'), getJson('https://eapi.binance.com/eapi/v1/ticker')]);
  const syms = info.optionSymbols.filter((s) => s.underlying === `${coin}USDT`);
  const unit = new Map(syms.map((s) => [s.symbol, Number(s.unit) || 1]));
  const vol = new Map(tickers.map((t) => [t.symbol, Number(t.volume) || 0]));
  const expiries = [...new Set(syms.map((s) => s.symbol.split('-')[1]))];
  const oiLists = await Promise.all(expiries.map((e) => getJson(`https://eapi.binance.com/eapi/v1/openInterest?underlyingAsset=${coin}&expiration=${e}`).catch(() => [])));
  const oi = new Map(oiLists.flat().map((x) => [x.symbol, Number(x.sumOpenInterest) || 0]));
  return syms.map((s) => {
    const [, date, strike, cp] = s.symbol.split('-');
    const u = unit.get(s.symbol);
    return { e: fromYmd(date), k: Number(strike), c: cp, oi: (oi.get(s.symbol) || 0) * u, v: (vol.get(s.symbol) || 0) * u };
  });
}

const EXCHANGES = { Deribit: deribit, Bybit: bybit, OKX: okx, Binance: binance };

/** Rows of every exchange that answered; expired and empty contracts are dropped. */
export async function optionsSnapshot(coin, getJson) {
  const today = new Date().toISOString().slice(0, 10);
  const names = Object.keys(EXCHANGES);
  const settled = await Promise.allSettled(names.map((n) => EXCHANGES[n](coin, getJson)));
  const sources = [];
  const rows = [];
  settled.forEach((r, i) => {
    const x = names[i];
    if (r.status === 'rejected') { sources.push({ name: x, ok: false, error: String(r.reason?.message || r.reason) }); return; }
    const own = r.value.filter((q) => q.e && q.e >= today && Number.isFinite(q.k) && (q.c === 'C' || q.c === 'P') && (q.oi > 0 || q.v > 0));
    sources.push({ name: x, ok: true, contracts: own.length });
    for (const q of own) rows.push({ x, ...q });
  });
  return { coin, updatedAt: Date.now(), sources, rows };
}
