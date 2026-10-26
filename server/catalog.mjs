// Danh mục song ngữ cho các mã phổ biến. `q` là các từ khóa tìm kiếm (không dấu, chữ thường).
// Mỗi mục có thể có nhiều nguồn; nguồn đầu tiên là nguồn mặc định (ưu tiên realtime).

export const CATALOG = [
  {
    key: 'DXY', kind: 'index', vi: 'Chỉ số đô la Mỹ', en: 'US Dollar Index',
    q: ['dxy', 'dollar index', 'chi so do la', 'do la my', 'usd index', 'usdx', 'dx'],
    sources: [
      { source: 'yahoo', symbol: 'DX-Y.NYB', note: 'ICE · không volume' },
      { source: 'yahoo', symbol: 'UUP', note: 'ETF UUP · có volume' },
    ],
  },
  {
    key: 'XAUUSD', kind: 'commodity', vi: 'Vàng', en: 'Gold',
    q: ['vang', 'gold', 'xau', 'xauusd', 'gc', 'vang the gioi'],
    sources: [
      { source: 'binance-perp', symbol: 'XAUUSDT' },
      { source: 'hyperliquid', symbol: 'xyz:GOLD' },
      { source: 'yahoo', symbol: 'GC=F', note: 'COMEX' },
      { source: 'binance', symbol: 'PAXGUSDT', note: 'PAXG' },
    ],
  },
  {
    key: 'XAGUSD', kind: 'commodity', vi: 'Bạc', en: 'Silver',
    q: ['bac', 'silver', 'xag', 'xagusd', 'si'],
    sources: [
      { source: 'binance-perp', symbol: 'XAGUSDT' },
      { source: 'hyperliquid', symbol: 'xyz:SILVER' },
      { source: 'yahoo', symbol: 'SI=F', note: 'COMEX' },
    ],
  },
  {
    key: 'WTI', kind: 'commodity', vi: 'Dầu thô WTI', en: 'WTI crude oil',
    q: ['wti', 'dau', 'dau tho', 'dau wti', 'crude', 'crude oil', 'oil', 'cl', 'usoil'],
    sources: [
      { source: 'binance-perp', symbol: 'CLUSDT' },
      { source: 'hyperliquid', symbol: 'xyz:CL' },
      { source: 'yahoo', symbol: 'CL=F', note: 'NYMEX' },
    ],
  },
  {
    key: 'BRENT', kind: 'commodity', vi: 'Dầu Brent', en: 'Brent crude oil',
    q: ['brent', 'dau brent', 'ukoil', 'bz'],
    sources: [
      { source: 'binance-perp', symbol: 'BZUSDT' },
      { source: 'hyperliquid', symbol: 'xyz:BRENTOIL' },
      { source: 'yahoo', symbol: 'BZ=F', note: 'NYMEX' },
    ],
  },
  { key: 'NG', kind: 'commodity', vi: 'Khí tự nhiên', en: 'Natural gas', q: ['khi tu nhien', 'khi dot', 'natural gas', 'natgas', 'ng'], sources: [{ source: 'hyperliquid', symbol: 'xyz:NATGAS' }, { source: 'yahoo', symbol: 'NG=F', note: 'NYMEX' }] },
  { key: 'HG', kind: 'commodity', vi: 'Đồng', en: 'Copper', q: ['dong', 'kim loai dong', 'copper', 'hg'], sources: [{ source: 'hyperliquid', symbol: 'xyz:COPPER' }, { source: 'yahoo', symbol: 'HG=F', note: 'COMEX' }] },
  { key: 'PL', kind: 'commodity', vi: 'Bạch kim', en: 'Platinum', q: ['bach kim', 'platinum', 'pl'], sources: [{ source: 'hyperliquid', symbol: 'xyz:PLATINUM' }, { source: 'yahoo', symbol: 'PL=F', note: 'NYMEX' }] },
  { key: 'PA', kind: 'commodity', vi: 'Palladium', en: 'Palladium', q: ['palladium', 'pa'], sources: [{ source: 'hyperliquid', symbol: 'xyz:PALLADIUM' }, { source: 'yahoo', symbol: 'PA=F', note: 'NYMEX' }] },
  { key: 'ZC', kind: 'commodity', vi: 'Ngô', en: 'Corn', q: ['ngo', 'bap', 'corn', 'zc'], sources: [{ source: 'yahoo', symbol: 'ZC=F', note: 'CBOT' }, { source: 'hyperliquid', symbol: 'xyz:CORN' }] },
  { key: 'ZS', kind: 'commodity', vi: 'Đậu tương', en: 'Soybeans', q: ['dau tuong', 'dau nanh', 'soybean', 'soybeans', 'zs'], sources: [{ source: 'yahoo', symbol: 'ZS=F', note: 'CBOT' }] },
  { key: 'ZW', kind: 'commodity', vi: 'Lúa mì', en: 'Wheat', q: ['lua mi', 'wheat', 'zw'], sources: [{ source: 'yahoo', symbol: 'ZW=F', note: 'CBOT' }, { source: 'hyperliquid', symbol: 'xyz:WHEAT' }] },
  { key: 'KC', kind: 'commodity', vi: 'Cà phê Arabica', en: 'Arabica coffee', q: ['ca phe', 'cafe', 'coffee', 'arabica', 'kc'], sources: [{ source: 'yahoo', symbol: 'KC=F', note: 'ICE US' }] },
  { key: 'SB', kind: 'commodity', vi: 'Đường', en: 'Sugar', q: ['duong', 'sugar', 'sb'], sources: [{ source: 'yahoo', symbol: 'SB=F', note: 'ICE US' }] },
  { key: 'CT', kind: 'commodity', vi: 'Bông', en: 'Cotton', q: ['bong', 'cotton', 'ct'], sources: [{ source: 'yahoo', symbol: 'CT=F', note: 'ICE US' }] },
  { key: 'CC', kind: 'commodity', vi: 'Ca cao', en: 'Cocoa', q: ['ca cao', 'cocoa', 'cc'], sources: [{ source: 'yahoo', symbol: 'CC=F', note: 'ICE US' }] },

  { key: 'SPX', kind: 'index', vi: 'Chỉ số S&P 500', en: 'S&P 500', q: ['sp500', 's&p 500', 'spx', 'es', 'chi so my'], sources: [{ source: 'hyperliquid', symbol: 'xyz:SP500' }, { source: 'yahoo', symbol: '^GSPC' }, { source: 'yahoo', symbol: 'ES=F', note: 'CME' }] },
  { key: 'NDX', kind: 'index', vi: 'Chỉ số Nasdaq 100', en: 'Nasdaq 100', q: ['nasdaq', 'nasdaq 100', 'ndx', 'nq'], sources: [{ source: 'yahoo', symbol: '^NDX' }, { source: 'yahoo', symbol: 'NQ=F', note: 'CME' }] },
  { key: 'DJI', kind: 'index', vi: 'Chỉ số Dow Jones', en: 'Dow Jones Industrial Average', q: ['dow', 'dow jones', 'dji', 'ym'], sources: [{ source: 'yahoo', symbol: '^DJI' }, { source: 'yahoo', symbol: 'YM=F', note: 'CBOT' }] },
  { key: 'VIX', kind: 'index', vi: 'Chỉ số biến động VIX', en: 'CBOE Volatility Index', q: ['vix', 'bien dong', 'volatility'], sources: [{ source: 'yahoo', symbol: '^VIX' }] },
  { key: 'N225', kind: 'index', vi: 'Chỉ số Nikkei 225', en: 'Nikkei 225', q: ['nikkei', 'n225', 'nhat', 'japan'], sources: [{ source: 'yahoo', symbol: '^N225' }, { source: 'hyperliquid', symbol: 'xyz:JP225' }] },
  { key: 'HSI', kind: 'index', vi: 'Chỉ số Hang Seng', en: 'Hang Seng', q: ['hang seng', 'hsi', 'hong kong'], sources: [{ source: 'yahoo', symbol: '^HSI' }] },
  { key: 'DAX', kind: 'index', vi: 'Chỉ số DAX (Đức)', en: 'DAX', q: ['dax', 'duc', 'germany'], sources: [{ source: 'yahoo', symbol: '^GDAXI' }] },
  { key: 'FTSE', kind: 'index', vi: 'Chỉ số FTSE 100 (Anh)', en: 'FTSE 100', q: ['ftse', 'anh', 'uk'], sources: [{ source: 'yahoo', symbol: '^FTSE' }] },
  { key: 'VNINDEX', kind: 'index', vi: 'Chỉ số VN-Index', en: 'VN-Index', q: ['vnindex', 'vn-index', 'vn index', 'chung khoan viet nam', 'hose'], sources: [{ source: 'vn', symbol: 'VNINDEX' }] },
  { key: 'VN30', kind: 'index', vi: 'Chỉ số VN30', en: 'VN30', q: ['vn30'], sources: [{ source: 'vn', symbol: 'VN30' }] },
  { key: 'HNX', kind: 'index', vi: 'Chỉ số HNX-Index', en: 'HNX-Index', q: ['hnx', 'hnxindex', 'hnx-index'], sources: [{ source: 'vn', symbol: 'HNX' }] },

  { key: 'US10Y', kind: 'bond', vi: 'Lợi suất trái phiếu Mỹ 10 năm', en: 'US 10-year Treasury yield', q: ['trai phieu', 'loi suat', 'us10y', '10 nam', 'tnx', 'treasury', 'bond'], sources: [{ source: 'yahoo', symbol: '^TNX' }] },
  { key: 'US30Y', kind: 'bond', vi: 'Lợi suất trái phiếu Mỹ 30 năm', en: 'US 30-year Treasury yield', q: ['trai phieu 30 nam', 'us30y', 'tyx'], sources: [{ source: 'yahoo', symbol: '^TYX' }] },
  { key: 'US5Y', kind: 'bond', vi: 'Lợi suất trái phiếu Mỹ 5 năm', en: 'US 5-year Treasury yield', q: ['trai phieu 5 nam', 'us5y', 'fvx'], sources: [{ source: 'yahoo', symbol: '^FVX' }] },
  { key: 'ZN', kind: 'bond', vi: 'Hợp đồng trái phiếu Mỹ 10 năm', en: '10-year T-Note futures', q: ['zn', 't-note', 'tnote'], sources: [{ source: 'yahoo', symbol: 'ZN=F', note: 'CBOT' }] },

  { key: 'EURUSD', kind: 'forex', vi: 'Euro / Đô la Mỹ', en: 'Euro / US Dollar', q: ['eurusd', 'euro', 'eur'], sources: [{ source: 'yahoo', symbol: 'EURUSD=X' }, { source: 'hyperliquid', symbol: 'xyz:EUR' }] },
  { key: 'GBPUSD', kind: 'forex', vi: 'Bảng Anh / Đô la Mỹ', en: 'British Pound / US Dollar', q: ['gbpusd', 'bang anh', 'pound', 'gbp'], sources: [{ source: 'yahoo', symbol: 'GBPUSD=X' }, { source: 'hyperliquid', symbol: 'xyz:GBP' }] },
  { key: 'USDJPY', kind: 'forex', vi: 'Đô la Mỹ / Yên Nhật', en: 'US Dollar / Japanese Yen', q: ['usdjpy', 'yen', 'jpy'], sources: [{ source: 'yahoo', symbol: 'JPY=X' }, { source: 'hyperliquid', symbol: 'xyz:JPY' }] },
  { key: 'AUDUSD', kind: 'forex', vi: 'Đô la Úc / Đô la Mỹ', en: 'Australian Dollar / US Dollar', q: ['audusd', 'do la uc', 'aud'], sources: [{ source: 'yahoo', symbol: 'AUDUSD=X' }] },
  { key: 'USDCAD', kind: 'forex', vi: 'Đô la Mỹ / Đô la Canada', en: 'US Dollar / Canadian Dollar', q: ['usdcad', 'cad'], sources: [{ source: 'yahoo', symbol: 'CAD=X' }] },
  { key: 'USDCHF', kind: 'forex', vi: 'Đô la Mỹ / Franc Thụy Sĩ', en: 'US Dollar / Swiss Franc', q: ['usdchf', 'franc', 'chf'], sources: [{ source: 'yahoo', symbol: 'CHF=X' }] },
  { key: 'USDVND', kind: 'forex', vi: 'Đô la Mỹ / Việt Nam Đồng', en: 'US Dollar / Vietnamese Dong', q: ['usdvnd', 'vnd', 'ty gia', 'viet nam dong'], sources: [{ source: 'yahoo', symbol: 'VND=X' }] },
  { key: 'USDCNH', kind: 'forex', vi: 'Đô la Mỹ / Nhân dân tệ', en: 'US Dollar / Chinese Yuan', q: ['usdcnh', 'usdcny', 'nhan dan te', 'yuan', 'cny'], sources: [{ source: 'yahoo', symbol: 'CNY=X' }] },

  ...[
    ['VNM', 'Vinamilk', 'vinamilk'], ['VIC', 'Vingroup', 'vingroup'], ['VHM', 'Vinhomes', 'vinhomes'], ['VRE', 'Vincom Retail', 'vincom'],
    ['HPG', 'Hòa Phát', 'hoa phat'], ['FPT', 'FPT', 'fpt'], ['VCB', 'Vietcombank', 'vietcombank'], ['BID', 'BIDV', 'bidv'],
    ['CTG', 'VietinBank', 'vietinbank'], ['TCB', 'Techcombank', 'techcombank'], ['VPB', 'VPBank', 'vpbank'], ['MBB', 'MB Bank', 'mb bank'],
    ['ACB', 'ACB', 'a chau'], ['HDB', 'HDBank', 'hdbank'], ['STB', 'Sacombank', 'sacombank'], ['TPB', 'TPBank', 'tien phong'],
    ['VIB', 'VIB', 'quoc te'], ['SHB', 'SHB', 'sai gon ha noi'], ['SSB', 'SeABank', 'seabank'], ['LPB', 'LPBank', 'loc phat'],
    ['SSI', 'Chứng khoán SSI', 'chung khoan ssi'], ['MSN', 'Masan', 'masan'], ['MWG', 'Thế Giới Di Động', 'the gioi di dong'], ['PNJ', 'PNJ', 'phu nhuan'],
    ['SAB', 'Sabeco', 'sabeco'], ['GAS', 'PV Gas', 'pv gas'], ['PLX', 'Petrolimex', 'petrolimex'], ['POW', 'PV Power', 'pv power'],
    ['VJC', 'Vietjet Air', 'vietjet'], ['GVR', 'Cao su Việt Nam', 'cao su viet nam'], ['BCM', 'Becamex', 'becamex'],
  ].map(([code, name, words]) => ({
    key: code, kind: 'stock', vi: `${name} (HOSE)`, en: `${name} (HOSE)`,
    q: [code.toLowerCase(), words],
    sources: [{ source: 'vn', symbol: code }, { source: 'yahoo', symbol: `${code}.VN`, note: 'HOSE' }],
  })),

  { key: 'BTC', kind: 'crypto', vi: 'Bitcoin', en: 'Bitcoin', q: ['btc', 'bitcoin'], sources: [{ source: 'binance', symbol: 'BTCUSDT' }, { source: 'binance-perp', symbol: 'BTCUSDT' }, { source: 'okx', symbol: 'BTC-USDT' }, { source: 'okx-swap', symbol: 'BTC-USDT-SWAP' }, { source: 'bybit', symbol: 'BTCUSDT' }, { source: 'bybit-perp', symbol: 'BTCUSDT' }, { source: 'hyperliquid', symbol: 'BTC' }] },
  { key: 'ETH', kind: 'crypto', vi: 'Ethereum', en: 'Ethereum', q: ['eth', 'ethereum'], sources: [{ source: 'binance', symbol: 'ETHUSDT' }, { source: 'binance-perp', symbol: 'ETHUSDT' }, { source: 'okx', symbol: 'ETH-USDT' }, { source: 'okx-swap', symbol: 'ETH-USDT-SWAP' }, { source: 'bybit', symbol: 'ETHUSDT' }, { source: 'bybit-perp', symbol: 'ETHUSDT' }, { source: 'hyperliquid', symbol: 'ETH' }] },
];
