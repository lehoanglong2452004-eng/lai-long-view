import type { Lang } from './engine/context';
import type { Kind, Status } from './data/types';

const DICT = {
  search: { vi: 'Tìm mã: vàng, gold, XAU, BTC, VNM, AAPL…', en: 'Search: gold, XAU, BTC, AAPL, EURUSD…' },
  charts: { vi: 'Biểu đồ', en: 'Charts' },
  context: { vi: 'Bối cảnh', en: 'Context' },
  sync: { vi: 'Đồng bộ', en: 'Sync' },
  syncHint: { vi: 'Mọi chart dùng chung khung thời gian, con trỏ và vị trí thời gian', en: 'All charts share timeframe, crosshair and time position' },
  vpHint: { vi: 'Volume profile (vùng đang nhìn thấy)', en: 'Volume profile (visible range)' },
  events: { vi: 'Wyckoff', en: 'Wyckoff' },
  eventsHint: { vi: 'Nhãn sự kiện Wyckoff và hộp vùng sideway', en: 'Wyckoff event labels and range boxes' },
  settings: { vi: 'Cài đặt', en: 'Settings' },
  layout: { vi: 'Số chart', en: 'Charts' },
  minimize: { vi: 'Thu nhỏ', en: 'Minimize' },
  maximize: { vi: 'Phóng lớn', en: 'Maximize' },
  restore: { vi: 'Thu về', en: 'Restore' },
  remove: { vi: 'Bỏ chart này', en: 'Remove chart' },
  loading: { vi: 'Đang tải…', en: 'Loading…' },
  loadError: { vi: 'Không tải được dữ liệu', en: "Couldn't load data" },
  noResults: { vi: 'Không tìm thấy mã phù hợp', en: 'No matching symbols' },
  colors: { vi: 'Màu biểu đồ', en: 'Chart colors' },
  resetColors: { vi: 'Màu mặc định', en: 'Default colors' },
  vpSide: { vi: 'Vị trí VP', en: 'VP side' },
  right: { vi: 'Phải', en: 'Right' },
  left: { vi: 'Trái', en: 'Left' },
  vpWidth: { vi: 'Độ rộng VP', en: 'VP width' },
  vpRows: { vi: 'Số hàng VP', en: 'VP rows' },
  vwapSession: { vi: 'VWAP phiên', en: 'Session VWAP' },
  vwapWeek: { vi: 'VWAP tuần', en: 'Weekly VWAP' },
  vwapMonth: { vi: 'VWAP tháng', en: 'Monthly VWAP' },
  avwap: { vi: 'AVWAP tự neo (SC/Spring/SOS, BC/UT/SOW)', en: 'Auto-anchored AVWAP (SC/Spring/SOS, BC/UT/SOW)' },
  watermark: { vi: 'Chữ chìm Lai Long', en: 'Lai Long watermark' },
  supplyDemand: { vi: 'Cung – cầu', en: 'Supply – demand' },
  effort: { vi: 'Nỗ lực / kết quả', en: 'Effort / result' },
  cause: { vi: 'Nhân – quả', en: 'Cause – effect' },
  phase: { vi: 'Pha', en: 'Phase' },
  patterns: { vi: 'Mẫu gần nhất', en: 'Closest patterns' },
  scenario: { vi: 'Kịch bản', en: 'Scenario' },
  invalidation: { vi: 'Vô hiệu', en: 'Invalidation' },
  recent: { vi: 'Sự kiện gần đây', en: 'Recent events' },
  none: { vi: 'Chưa có', en: 'None yet' },
  disclaimer: {
    vi: 'Chỉ để tham khảo. Điểm của mẫu là mức khớp luật, không phải tỉ lệ thắng.',
    en: 'For reference only. Pattern scores measure rule fit, not win rate.',
  },
  openChart: { vi: 'Xem chart', en: 'Open chart' },
  noVolume: { vi: 'Không có volume', en: 'No volume' },
  layouts: { vi: 'Bố cục', en: 'Layouts' },
  saveLayout: { vi: 'Lưu bố cục đang xem', en: 'Save current layout' },
  layoutName: { vi: 'Tên, ví dụ Hàng hóa', en: 'Name, e.g. Commodities' },
  save: { vi: 'Lưu', en: 'Save' },
  savedLayouts: { vi: 'Đã lưu', en: 'Saved' },
  noLayouts: { vi: 'Chưa lưu bố cục nào', en: 'No saved layouts yet' },
  layoutNameRequired: { vi: 'Nhập tên bố cục trước', en: 'Enter a layout name first' },
  layoutServerError: { vi: 'Không kết nối được máy chủ Lai Long View', en: "Can't reach the Lai Long View server" },
  deleteLayout: { vi: 'Xóa bố cục', en: 'Delete layout' },
  aggVol: { vi: 'Gộp vol', en: 'Merge vol' },
  aggHint: { vi: 'Cộng volume của cùng cặp trên các sàn khác; tách riêng Spot và Futures', en: 'Adds this pair’s volume from the other exchanges; Spot and Futures kept apart' },
  aggSkipped: { vi: 'Bỏ qua', en: 'Skipped' },
  aggLoading: { vi: 'Đang gộp…', en: 'Merging…' },
  aggError: { vi: 'không tải được', en: 'failed to load' },
  aggMismatch: { vi: 'giờ nến không khớp', en: 'bar times differ' },
  copyright: { vi: '© 2026 Lai Long View. Bảo lưu mọi quyền.', en: '© 2026 Lai Long View. All rights reserved.' },
} satisfies Record<string, Record<Lang, string>>;

export type Key = keyof typeof DICT;

export const t = (k: Key, lang: Lang) => DICT[k][lang];

export const KIND_LABEL: Record<Kind, Record<Lang, string>> = {
  crypto: { vi: 'Crypto', en: 'Crypto' },
  stock: { vi: 'Cổ phiếu', en: 'Stock' },
  index: { vi: 'Chỉ số', en: 'Index' },
  forex: { vi: 'Ngoại hối', en: 'Forex' },
  commodity: { vi: 'Hàng hóa', en: 'Commodity' },
  bond: { vi: 'Trái phiếu', en: 'Bond' },
  future: { vi: 'Hợp đồng TL', en: 'Futures' },
  etf: { vi: 'ETF', en: 'ETF' },
  fund: { vi: 'Quỹ', en: 'Fund' },
  other: { vi: 'Khác', en: 'Other' },
};

export function statusLabel(s: Status | undefined, lang: Lang): string {
  if (!s) return '?';
  if (s.mode === 'rt') return 'RT';
  if (s.mode === 'eod') return 'EOD';
  if (s.mode === 'delay') return lang === 'vi' ? `TRỄ ${s.delayMin}'` : `${s.delayMin}m DELAY`;
  return '?';
}

export function statusTitle(s: Status | undefined, lang: Lang): string {
  if (!s || s.mode === 'unknown') return lang === 'vi' ? 'Nguồn không công bố độ trễ' : 'Source does not publish its delay';
  if (s.mode === 'rt') return lang === 'vi' ? 'Realtime' : 'Real-time';
  if (s.mode === 'eod') return lang === 'vi' ? 'Dữ liệu cuối ngày' : 'End of day';
  return lang === 'vi' ? `Dữ liệu trễ ${s.delayMin} phút` : `Delayed ${s.delayMin} minutes`;
}
