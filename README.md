# Lai Long View

Biểu đồ đa khung cho trader cá nhân, đọc thị trường theo ba quy luật Wyckoff (cung – cầu, nhân – quả, nỗ lực – kết quả), 31 mẫu hình khối lượng, VWAP và volume profile.

- `docs/SPEC.md` — bản đặc tả: mọi quyết định, nguồn dữ liệu, định nghĩa sự kiện và cách chấm điểm mẫu hình.
- `pine/LaiLong_VolumeContext.pine` — indicator TradingView (Pine Script v6), một indicator gộp tất cả.
- `src/` — web Lai Long View (React + TypeScript, engine vẽ chart tự viết trên Canvas).
- `server/` — máy chủ dữ liệu cục bộ (proxy Yahoo Finance, VNDirect và tìm kiếm mã).

## Chạy web

Cần Node.js 20 trở lên.

```bash
npm install
npm run dev
```

Mở http://localhost:5173

Bản build để dùng hằng ngày:

```bash
npm run build
npm start
```

Mở http://localhost:4173

## Dùng indicator trên TradingView

1. Mở TradingView → Pine Editor → tạo script mới.
2. Dán toàn bộ nội dung `pine/LaiLong_VolumeContext.pine`, bấm "Add to chart".
3. Cảnh báo: tạo alert với điều kiện "Lai Long Volume Context" và chọn sự kiện (SC, Spring, SOS…), hoặc "Any alert() function call" để nhận mọi sự kiện.

## Dữ liệu

| Nguồn | Trạng thái |
|---|---|
| Binance (spot, perp), OKX (spot, swap), Bybit (spot, perp), Hyperliquid | Realtime, gọi thẳng từ trình duyệt |
| Yahoo Finance | Theo sàn: forex RT, CME/CBOT trễ 10', COMEX/NYMEX/ICE trễ 30', HOSE trễ 15'… |
| VNDirect | Cổ phiếu, chỉ số Việt Nam; độ trễ không công bố |

Mỗi chart hiện huy hiệu `RT`, `TRỄ n'` hoặc `?`, và `NO VOL` khi nguồn không có volume (ví dụ DXY). Yahoo và VNDirect là nguồn không chính thức, chỉ dùng cá nhân.

## Kiểm thử

```bash
npm test
```

Chạy engine với dữ liệu Binance thật (cần mạng):

```bash
LIVE=1 npx vitest run tests/live.test.ts
```

Chỉ để tham khảo. Điểm của mẫu hình là mức khớp luật, không phải tỉ lệ thắng.
