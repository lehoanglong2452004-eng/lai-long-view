# Dữ liệu xem được trong Lai Long View

Đo thực tế ngày 26/10/2026 bằng đúng các lệnh tải mà web đang dùng (`src/data/feeds.ts`, `server/api.mjs`).
Con số "từ ngày" là nến cũ nhất web tải về ở lần mở chart; sàn có thể còn dữ liệu cũ hơn.

## 1. Theo loại sản phẩm

| Loại | Nguồn | Số mã | Trạng thái | Volume |
|---|---|---|---|---|
| Crypto Spot | Binance Spot | 1.383 cặp (517 coin) | Realtime | Có (volume thật của sàn) |
| | OKX Spot | 1.198 cặp | Realtime | Có |
| | Bybit Spot | 527 cặp | Realtime | Có |
| Crypto Futures (perp) | Binance Futures | 566 hợp đồng | Realtime | Có |
| | OKX Futures | 522 hợp đồng | Realtime | Có |
| | Bybit Futures | 876 hợp đồng | Realtime | Có |
| | Hyperliquid Futures | 178 hợp đồng | Realtime | Có |
| Hàng hóa, cổ phiếu, chỉ số dạng perp trên sàn crypto | Binance Futures: vàng `XAUUSDT`, bạc `XAGUSDT`, WTI `CLUSDT`, Brent `BZUSDT` | ~5 | Realtime | Có, nhưng là volume người chơi sàn crypto |
| | Hyperliquid `xyz:`: vàng, bạc, dầu, khí, đồng, S&P 500, cổ phiếu Mỹ/Hàn/Nhật, forex… | 116 | Realtime | Có, như trên |
| Hàng hóa futures sàn gốc | Yahoo: COMEX (vàng, bạc, đồng), NYMEX (dầu, khí), ICE US (cà phê, đường, bông, ca cao) | Hàng trăm | Trễ 30' | Có (volume thật của sàn) |
| | Yahoo: CME, CBOT (S&P, Nasdaq, Dow futures, ngô, đậu tương, lúa mì, trái phiếu) | | Trễ 10' | Có |
| Chỉ số | Yahoo: S&P 500, Dow, Nasdaq | Hầu hết chỉ số toàn cầu | Realtime | S&P/Dow/Nasdaq: có |
| | Yahoo: DXY | | Trễ 30' | **Không** |
| | Yahoo: VIX | | Trễ 15' | **Không** |
| | Yahoo: Nikkei, Hang Seng, DAX, FTSE… | | Trễ 15–30' | Nikkei: chỉ nến ngày |
| Forex | Yahoo: mọi cặp tiền (`EURUSD=X`, `JPY=X`, `VND=X`…) | Hầu hết cặp tiền | Realtime | **Không** (forex không có volume tập trung) |
| Trái phiếu | Yahoo: lợi suất Mỹ 5/10/30 năm | | Trễ 15' | **Không** |
| | Yahoo: hợp đồng trái phiếu CBOT (`ZN=F`…) | | Trễ 10' | Có |
| Cổ phiếu thế giới | Yahoo: Mỹ, châu Âu, châu Á… | Hàng chục nghìn | Mỹ: realtime; sàn khác trễ 15–30' | Có |
| Cổ phiếu, chỉ số Việt Nam | VNDirect: HOSE, HNX, UPCoM, VN-Index, VN30, HNX-Index | Toàn bộ sàn VN | Không công bố độ trễ | Có |
| | Yahoo: mã HOSE dạng `VNM.VN` | | Trễ 15' | Có |

## 2. Lịch sử tải được theo khung thời gian

| Nguồn (mã đo) | 1m | 5m | 1H | 4H | 1D | 1W | 1M |
|---|---|---|---|---|---|---|---|
| Binance Spot (BTC) | ~17 giờ | ~3,5 ngày | 6 tuần | 5,5 tháng | từ 01/2024 | từ 2017 | từ 2017 |
| OKX Spot (BTC) | ~13 giờ | ~3 ngày | 5 tuần | 4,5 tháng | từ 08/2024 | từ 2018 | từ 2018 |
| Bybit Spot (BTC) | ~17 giờ | ~3,5 ngày | 6 tuần | 5,5 tháng | từ 01/2024 | từ 2021 | từ 2021 |
| Binance Futures (BTC) | ~25 giờ | ~5 ngày | 2 tháng | 8 tháng | từ 09/2022 | từ 2019 | từ 2019 |
| OKX Futures (BTC) | ~13 giờ | ~3 ngày | 5 tuần | 4,5 tháng | từ 08/2024 | từ 2019 | từ 2020 |
| Bybit Futures (BTC) | ~17 giờ | ~3,5 ngày | 6 tuần | 5,5 tháng | từ 01/2024 | từ 2020 | từ 2020 |
| Hyperliquid Futures (BTC) | ~25 giờ | ~5 ngày | 2 tháng | 8 tháng | từ 09/2022 | từ 2019 | từ 2019 |
| Binance Futures vàng `XAUUSDT` | ~25 giờ | ~5 ngày | 2 tháng | 8 tháng | từ 12/2025 (mới niêm yết) | | |
| Binance Futures WTI `CLUSDT` | ~25 giờ | ~5 ngày | 2 tháng | từ 04/2026 (mới niêm yết) | | | |
| Hyperliquid vàng `xyz:GOLD` | ~25 giờ | ~5 ngày | 2 tháng | 8 tháng | từ 12/2025 (mới niêm yết) | | |
| Yahoo futures (vàng, dầu) | 7 ngày | 60 ngày | 6 tháng | 2 năm | 10 năm | từ 2006 | từ 2000 |
| Yahoo chỉ số, cổ phiếu Mỹ | 8 ngày | 2 tháng | 20 tháng | 3 năm | 10 năm | từ 2006 | từ 1985 |
| Yahoo forex | 7 ngày | 60 ngày | 6 tháng | 2 năm | 10 năm | từ 2006 | từ 2003 |
| VNDirect (VNM) | 5 ngày | 20 ngày | 4 tháng | 4 tháng | 10 năm | từ 2012 | từ 2013 |
| VNDirect (VN-Index) | 5 ngày | 20 ngày | 4 tháng | 4 tháng | từ 2017 | từ 2017 | từ 2017 |

## 3. Những điều cần biết

- **Không có volume**: DXY, VIX, lợi suất trái phiếu, mọi cặp forex, Nikkei trong ngày. Với các mã này engine chỉ chạy luật về giá và báo "NO VOL".
- **Volume vàng, dầu trên sàn crypto** (Binance Futures, Hyperliquid) là volume của người chơi các sàn đó, có cả cuối tuần khi COMEX/NYMEX đóng cửa. Muốn volume COMEX/NYMEX thật thì chọn nguồn Yahoo `GC=F` / `CL=F` (trễ 30').
- **Khung 1m và 5m của crypto** chỉ tải được 1–5 ngày gần nhất, vì web mới tải một lần mỗi chart. Có thể làm thêm phần tải tiếp khi kéo chart về quá khứ.
- **Yahoo và VNDirect** là nguồn không chính thức, chỉ dùng cá nhân; nguồn có thể đổi cách trả dữ liệu bất cứ lúc nào.
