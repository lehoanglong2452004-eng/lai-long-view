# Lai Long View — Bản đặc tả v0.1

Tài liệu gốc cho cả hai sản phẩm: **indicator Pine Script trên TradingView** và **web Lai Long View**.
Mọi luật phân tích nằm ở đây; code Pine (`pine/`) và code web (`src/engine/`) phải cho cùng kết quả với cùng dữ liệu.

## 1. Mục tiêu và phạm vi

- Công cụ cá nhân (không thương mại) cho trader intraday và swing.
- Nền tảng gốc là ba quy luật Wyckoff: **cung – cầu**, **nhân – quả**, **nỗ lực – kết quả**.
- Kiến thức tham chiếu: 31 mẫu hình khối lượng (tài liệu "Tinh túy 31 mẫu hình khối lượng").
  Hình minh họa trong tài liệu gốc có bản quyền của sách khác, nên sản phẩm **tự vẽ lại**, không dùng ảnh gốc.
- Phần phân loại bối cảnh **chỉ để tham khảo và cảnh báo**, không tự đặt lệnh.
- Chỉ dùng nguồn dữ liệu miễn phí. Chấp nhận dữ liệu trễ, nhưng luôn ưu tiên nguồn realtime khi có, và luôn ghi rõ trạng thái realtime hay trễ.

## 2. Các quyết định đã chốt

| Chủ đề | Quyết định |
|---|---|
| Đối tượng dùng | Cá nhân |
| Nền mặc định | Trắng, chữ đen; màu chart tùy chỉnh được |
| Phông chữ | Monospace kiểu terminal tài chính: IBM Plex Mono (tự host, có tiếng Việt) |
| Thương hiệu | Logo 龍 + chữ `lailong` ở góc dưới bên trái mỗi chart; chữ chìm "Lai Long" giữa nền (bật/tắt được) |
| Ngôn ngữ | Song ngữ Việt / Anh, chuyển bằng một nút |
| Số chart | 1 → 12 chart mỗi màn hình |
| Mặc định khi mở | 3 chart: DXY 5m · Vàng 1H · Dầu WTI 1D |
| Khung thời gian | 1M · 1W · 1D · 4H · 1H · 30m · 15m · 5m · 1m |
| Khung thời gian mỗi chart | Mỗi chart tự chọn; có công tắc **Đồng bộ** để mọi chart dùng chung khung và chung con trỏ thời gian |
| Volume profile | Nút bật/tắt cạnh khung thời gian; mặc định nằm bên phải; vị trí, độ rộng, số hàng tùy chỉnh |
| VWAP | Phiên / tuần / tháng + dải σ; AVWAP tự neo tại sự kiện Wyckoff + neo thủ công bằng click |
| Crypto | Spot và perp; gộp volume nhiều sàn là tùy chọn trong phần cài đặt, mặc định tắt |
| Câu chuyện bối cảnh | Tab riêng tên **Bối cảnh** (EN: *Context*) |
| Cảnh báo | Có (Pine: alertcondition; web: thông báo trình duyệt — giai đoạn sau) |
| TradingView | Gói Free → gộp mọi thứ vào **một** indicator duy nhất |

## 3. Giao diện web

```
┌──────────────────────────────────────────────────────────────────────────────┐
│ [Tìm mã: vàng / gold / XAU / GC=F]  1M 1W 1D 4H 1H 30m 15m 5m 1m  [VP] [VWAP] │
│ [Đồng bộ ◯]  [Bố cục ▦ 1..12]  [Màu]  [VI|EN]          [ Biểu đồ | Bối cảnh ] │
├───────────────────────────────┬──────────────────────────────────────────────┤
│ DXY · Hyperliquid · RT  5m [–][□]│ XAUUSDT · Binance Perp · RT  1H  [–][□]   │
│        (chữ chìm Lai Long)     │                                              │
│                         ▐▐▐ VP │                                              │
│ 龍 lailong                      │ 龍 lailong                                    │
└───────────────────────────────┴──────────────────────────────────────────────┘
```

- Mỗi chart có: tên mã, nguồn, huy hiệu trạng thái dữ liệu, khung thời gian riêng, nút thu nhỏ, nút phóng lớn, menu đổi nguồn.
- Thu nhỏ: chart xuống thanh dock phía dưới. Phóng lớn: chart chiếm cả lưới, bấm lần nữa để trở lại.
- Bố cục tự xếp theo số chart: 1, 2, 3 (1 lớn + 2 nhỏ), 4, 6, 8, 9, 12.
- Tab **Bối cảnh**: mỗi chart một thẻ kể chuyện (mục 7.8).

### Huy hiệu trạng thái dữ liệu

| Huy hiệu | Ý nghĩa |
|---|---|
| `RT` (xanh) | Realtime qua WebSocket hoặc nguồn công bố realtime |
| `TRỄ 10'` / `TRỄ 30'`… (vàng) | Nguồn công bố trễ N phút |
| `EOD` (xám) | Chỉ có dữ liệu cuối ngày |
| `?` | Chưa rõ; hệ thống đo độ trễ thực tế (thời điểm nến cuối so với giờ hiện tại khi thị trường mở) |

## 4. Nguồn dữ liệu (miễn phí)

| Nguồn | Phủ | Trạng thái | Volume | Cách gọi |
|---|---|---|---|---|
| Binance Spot / USDT-M Perp | Crypto; perp vàng `XAUUSDT`, bạc `XAGUSDT`, dầu `CLUSDT`, Brent `BZUSDT` | RT (WebSocket) | Volume thật của sàn | Trực tiếp từ trình duyệt |
| OKX | Crypto spot/swap | RT | Volume sàn | Trực tiếp |
| Bybit | Crypto spot/linear | RT | Volume sàn | Trực tiếp |
| Hyperliquid (gồm sàn con `xyz`) | Crypto; `xyz:DXY`, `xyz:GOLD`, `xyz:CL`, `xyz:SILVER`, `xyz:BRENTOIL`, cổ phiếu Mỹ, chỉ số… | RT | Volume sàn | Trực tiếp |
| Yahoo Finance (không chính thức) | Chỉ số, cổ phiếu toàn cầu, forex, futures, lợi suất trái phiếu | Theo sàn: CME/CBOT trễ 10', COMEX/NYMEX/ICE US trễ 30', forex RT, HOSE trễ 15'… | Có với cổ phiếu/futures; forex và nhiều chỉ số không có volume | Qua máy chủ cục bộ `/api/yahoo` (dùng cá nhân) |
| VNDirect dchart (không chính thức) | Cổ phiếu, chỉ số Việt Nam | Trễ | Có | Qua `/api/vn` |

Ghi chú quan trọng về volume:
- DXY là chỉ số, **không có volume** ở nguồn gốc. Volume của `xyz:DXY` là volume của người giao dịch perp trên Hyperliquid.
- Volume perp vàng/dầu trên sàn crypto phản ánh người chơi sàn đó, **không phải** COMEX/NYMEX. Khi cần volume COMEX/NYMEX thật thì đổi nguồn sang Yahoo `GC=F` / `CL=F` (trễ 30').
- Forex giao ngay không có volume tập trung. Engine sẽ báo "thiếu volume" và chỉ chạy các luật không cần volume.

Nguồn mặc định cho 3 chart mở đầu (ưu tiên realtime):

| Chart | Nguồn mặc định | Nguồn thay thế |
|---|---|---|
| DXY | Hyperliquid `xyz:DXY` (RT) | Yahoo `DX-Y.NYB` (trễ 30', không volume) |
| Vàng | Binance Perp `XAUUSDT` (RT) | Hyperliquid `xyz:GOLD`, Yahoo `GC=F` (COMEX, trễ 30') |
| Dầu WTI | Binance Perp `CLUSDT` (RT) | Hyperliquid `xyz:CL`, Yahoo `CL=F` (NYMEX, trễ 30') |

## 5. Tìm kiếm mã

- Tìm theo tên tiếng Việt, tên tiếng Anh, mã, ký hiệu: `vàng`, `vang`, `gold`, `XAU`, `GC=F` đều ra vàng.
- Bỏ dấu tiếng Việt khi so khớp (`dau tho` = `dầu thô`).
- Gộp kết quả từ: danh mục cục bộ song ngữ (hàng hóa, chỉ số, forex, trái phiếu phổ biến) + danh sách mã của 4 sàn crypto + Yahoo search + mã Việt Nam.
- Mỗi kết quả hiện: mã, tên, loại (crypto / cổ phiếu / chỉ số / forex / hàng hóa / trái phiếu / futures), nguồn, huy hiệu RT/trễ.

## 6. Chỉ số nền (mỗi nến)

Tham số mặc định (chỉnh được):

| Ký hiệu | Công thức | Mặc định |
|---|---|---|
| `RVOL` | Volume / SMA(Volume, 20) | — |
| `SPREAD` | (High − Low) / ATR(14) | — |
| `CLV` | (Close − Low) / (High − Low); bằng 0.5 nếu High = Low | — |
| Ngưỡng volume | cao `HI` / thấp `LO` / cực đại `ULTRA` | 1.5 / 0.7 / 2.5 |
| Ngưỡng biên độ | rộng `WIDE` / hẹp `NARROW` | 1.3 / 0.7 |
| Xu hướng | EMA(50) và độ dốc EMA(50) trong 10 nến | — |
| Đỉnh/đáy | pivot trái 5, phải 5 (xác nhận sau 5 nến) | 5 / 5 |
| Vùng sideway | (cao nhất − thấp nhất) trong 30 nến ≤ 6 × ATR | 30 / 6 |

### Nỗ lực – kết quả (4 ô)

| | Kết quả lớn (`SPREAD ≥ WIDE`) | Kết quả nhỏ (`SPREAD ≤ NARROW`) |
|---|---|---|
| **Nỗ lực lớn** (`RVOL ≥ HI`) | Đồng thuận — lực thật | **Hấp thụ** — có phe đang đỡ/chặn |
| **Nỗ lực nhỏ** (`RVOL ≤ LO`) | Đi dễ — không có phe cản | Nghỉ / test |

Ở cấp con sóng: khối lượng một sóng = tổng volume giữa hai pivot liên tiếp. So sóng tăng với sóng giảm liền trước.

## 7. Sự kiện (events)

Mỗi sự kiện có chiều: tăng (▲) hoặc giảm (▼).

| Mã | Tên | Điều kiện |
|---|---|---|
| `SC` ▲ | Selling climax | `RVOL ≥ ULTRA`, `SPREAD ≥ WIDE`, Low thấp nhất 50 nến, đang xu hướng giảm, giá đã giảm > 3 ATR trong 30 nến, không phải nến phá vỡ vùng sideway |
| `BC` ▼ | Buying climax | Ngược lại `SC` (giá đã tăng > 3 ATR trong 30 nến) |
| `ABS_LO` ▲ | Hấp thụ ở vùng thấp | `RVOL ≥ HI`, `SPREAD ≤ NARROW`, giá ở 1/3 dưới của 50 nến |
| `ABS_HI` ▼ | Hấp thụ ở vùng cao | Ngược lại |
| `NS` ▲ | No supply | Nến giảm, `RVOL < LO`, `SPREAD < NARROW`, volume thấp hơn 2 nến trước |
| `ND` ▼ | No demand | Nến tăng, cùng điều kiện |
| `DIV_TOP` ▼ | Phân kỳ đỉnh | Pivot cao mới > pivot cao trước, volume sóng tăng mới < 85% sóng tăng trước |
| `DIV_BOT` ▲ | Phân kỳ đáy / test đáy | Pivot thấp mới ≤ pivot thấp trước + 0.3 ATR, volume sóng giảm mới < 85% sóng giảm trước |
| `HARM_UP` ▲ | Đồng biến tăng | Đỉnh cao dần, đáy cao dần, volume sóng tăng > 1.15 × sóng giảm |
| `HARM_DN` ▼ | Đồng biến giảm | Ngược lại |
| `SHIFT_UP` ▲ | Cầu quay lại trong xu hướng giảm | Xu hướng giảm nhưng volume sóng tăng > sóng giảm |
| `RANGE` | Đang sideway | Theo định nghĩa vùng sideway. Nếu trong cửa sổ có `SC`/`BC` thì vùng bắt đầu từ nến cao trào đó |
| `RANGE_ACC` / `RANGE_DIST` | Sideway sau xu hướng giảm / tăng | Như `RANGE`, phân theo xu hướng trước vùng |
| `SQZ` | Nén volume | Đang sideway và SMA(V,10) / SMA(V,50) < 0.75 |
| `SOS` ▲ | Phá vỡ lên thật | Đóng cửa trên đỉnh vùng với `RVOL ≥ HI` |
| `BO_UP_WEAK` | Phá vỡ lên yếu | Đóng cửa trên đỉnh vùng với `RVOL < 1` |
| `SOW` ▼ | Phá vỡ xuống thật | Ngược lại `SOS` |
| `BO_DN_WEAK` | Phá vỡ xuống yếu | Ngược lại |
| `UT` ▼ | Upthrust / phá vỡ giả lên | Có phá vỡ lên trong 5 nến và đóng cửa quay lại dưới đỉnh vùng |
| `SPRING` ▲ | Spring / phá vỡ giả xuống | Ngược lại |
| `LPS` ▲ | Test lại sau SOS | Trong 20 nến sau `SOS`, Low về đỉnh vùng ± 0.5 ATR, `RVOL ≤ 0.85`, đóng cửa trên đỉnh vùng |
| `LPSY` ▼ | Test lại sau SOW | Ngược lại |
| `PARA_UP` ▼ | Tăng parabol | Giá trên EMA20, độ dốc EMA20 (5 nến) dương ở cả hiện tại và 10 nến trước, hiện tại > 1.5 lần, SMA(RVOL,5) > 1.3 |
| `TL_DN` ▼ | Gãy đường xu hướng tăng | Xu hướng tăng, Close < hồi quy tuyến tính(20) − 1.5σ, `RVOL ≥ HI` |
| `TL_UP` ▲ | Gãy đường xu hướng giảm | Ngược lại |
| `DT` ▼ / `DB` ▲ | Hai đỉnh / hai đáy | Hai pivot cùng phía lệch ≤ 0.5 ATR, sóng thứ hai volume thấp hơn |
| `HS` ▼ / `IHS` ▲ | Vai–đầu–vai / đảo ngược | 3 pivot, giữa cao (thấp) nhất, hai vai lệch ≤ 1 ATR, vai phải volume thấp hơn vai trái |
| `NECK_DN` ▼ / `NECK_UP` ▲ | Phá đường viền cổ | Close vượt viền cổ của `HS`/`IHS`/`DT`/`DB` với `RVOL ≥ HI` |
| `TRI` | Tam giác | 2 pivot cao giảm dần + 2 pivot thấp tăng dần + `SQZ` |
| `ROUND_BOT` ▲ / `ROUND_TOP` ▼ | Đáy tròn / đỉnh tròn | Sideway sau xu hướng giảm (tăng), volume hình chữ U, giá ở nửa trên (dưới) vùng |
| `FLAT_BASE` | Nền phẳng | Sideway hẹp (≤ 3 ATR) trên EMA50 đang dốc lên |
| `CUP` | Cốc | Sideway sau xu hướng tăng, giá về gần đỉnh vùng, nhịp chỉnh cuối volume thấp |

### 7.1 Độ "tươi" của sự kiện

`r(e) = 1` nếu sự kiện xảy ra trong 3 nến gần nhất, giảm tuyến tính về 0 tại 40 nến.

### 7.2 Chấm điểm mẫu hình

Mỗi mẫu có một hoặc hai biến thể (▲/▼). Điểm biến thể = 100 × Σ(trọng số × r(sự kiện)) / Σ trọng số.
Điểm mẫu = điểm cao nhất trong các biến thể. Hiển thị 3 mẫu điểm cao nhất (≥ 40).
**Điểm là mức khớp luật, không phải tỉ lệ thắng.**

| # | Mẫu | Họ | Biến thể và trọng số |
|---|---|---|---|
| 1 | Nền phẳng, phá vỡ kèm volume | E | ▲ FLAT_BASE .5 + SOS .5 |
| 2 | Xu hướng giảm suy yếu, volume đổi chiều | B | ▲ SHIFT_UP .6 + DIV_BOT .4 |
| 3 | Volume thuận xu hướng (cần khung lớn) | A | ▲ HARM_UP .7 + NS .3 |
| 4 | Đỉnh A-B-C cao dần, volume giảm | B | ▼ DIV_TOP 1 |
| 5 | Hồi lên trong xu hướng giảm, volume giảm | B | ▼ HARM_DN .5 + ND .5 |
| 6 | Giảm mạnh kèm volume tăng | A | ▼ HARM_DN .6 + SOW .4 |
| 7 | Quy tắc đồng biến hai chiều | A | ▲ HARM_UP 1 · ▼ HARM_DN 1 |
| 8 | Tăng parabol, volume dốc đứng | C | ▼ PARA_UP .6 + BC .4 |
| 9 | Cao trào bán | C | ▲ SC .6 + ABS_LO .2 + NS .2 |
| 10 | Hai đáy, đáy sau volume thấp | F | ▲ DB .6 + SC .2 + DIV_BOT .2 |
| 11 | Gãy trendline kèm volume | E | ▼ TL_DN 1 · ▲ TL_UP 1 |
| 12 | Phân phối ở đỉnh | D | ▼ ABS_HI .5 + RANGE_DIST .3 + BC .2 |
| 13 | Tích lũy ở đáy | D | ▲ ABS_LO .4 + RANGE_ACC .4 + SC .2 |
| 14 | Nghỉ (volume cạn) rồi bứt phá | D | ▲ SQZ .5 + SOS .5 · ▼ SQZ .5 + SOW .5 |
| 15 | Lập đỉnh, volume suy giảm | B | ▼ DIV_TOP .5 + ND .5 |
| 16 | Sideway hẹp, phá lên kèm volume | E | ▲ SQZ .4 + SOS .6 |
| 17 | Phá vỡ giả (volume giảm) | E | ▼ BO_UP_WEAK .4 + UT .6 · ▲ BO_DN_WEAK .4 + SPRING .6 |
| 18 | Phá vỡ xuống thật | E | ▼ SOW 1 |
| 19 | Hồi test cản, volume giảm | F | ▼ LPSY .7 + SOW .3 · ▲ LPS .7 + SOS .3 |
| 20 | (Tài liệu không có lời giải thích — để trống) | — | — |
| 21 | Vai–đầu–vai đỉnh | D | ▼ HS 1 |
| 22 | Mục tiêu vai–đầu–vai | E | ▼ HS .4 + NECK_DN .6 |
| 23 | Vai–đầu–vai đảo ngược | D | ▲ IHS .5 + NECK_UP .5 |
| 24 | Hai đỉnh, đỉnh sau volume thấp | D | ▼ DT .6 + NECK_DN .4 |
| 25 | Hai đáy | D | ▲ DB .6 + NECK_UP .4 |
| 26 | (Tài liệu không có lời giải thích — để trống) | — | — |
| 27 | Tam giác, phá trendline | E | ▲ TRI .5 + SOS .5 · ▼ TRI .5 + SOW .5 |
| 28 | (Tài liệu không có lời giải thích — để trống) | — | — |
| 29 | Đáy tròn | D | ▲ ROUND_BOT 1 |
| 30 | Đỉnh tròn | D | ▼ ROUND_TOP 1 |
| 31 | Cốc – tay cầm | D | ▲ CUP .6 + SOS .4 |

Họ: A đồng biến · B phân kỳ/cạn kiệt · C cao trào · D nền giá (nguyên nhân) · E phá vỡ (kết quả) · F kiểm định.

### 7.3 Pha Wyckoff

| Pha | Điều kiện |
|---|---|
| A | Có `SC`/`BC` trong vùng sideway hiện tại hoặc 10 nến trước khi vùng hình thành |
| B | Đang sideway, chưa có `SPRING`/`UT`, đã qua ≥ 10 nến từ pha A |
| C | `SPRING` (tích lũy) hoặc `UT` (phân phối) trong 15 nến gần nhất |
| D | `SOS`/`SOW` hoặc `LPS`/`LPSY` trong 20 nến gần nhất |
| E | Không còn sideway, giá cùng phía EMA50 với hướng phá vỡ, > 20 nến sau phá vỡ |
| — | Ngoài vùng sideway, không có phá vỡ gần: "Xu hướng tăng (markup)" / "Xu hướng giảm (markdown)" / "Chưa rõ" |

Loại cấu trúc: vùng sideway hình thành sau xu hướng giảm → **tích lũy**; sau xu hướng tăng → **phân phối**.

### 7.4 Cung – cầu

- Giá so với VWAP phiên và VWAP tuần, độ dốc VWAP tuần.
- Giá so với POC / vùng giá trị (VAH–VAL) của volume profile đang hiển thị.
- Kết luận: "Cầu kiểm soát" / "Cung kiểm soát" / "Cân bằng".

### 7.5 Nhân – quả

- Vùng sideway: số nến, độ rộng (theo ATR), tổng volume.
- Mục tiêu (ước lượng): điểm phá vỡ ± chiều cao vùng × 1 và × 1.618.
- Với `HS`/`DT`/`DB`: mục tiêu = viền cổ ± khoảng cách đầu – viền cổ.

### 7.6 VWAP và AVWAP

- VWAP phiên (ngày), tuần, tháng; dải ±1σ, ±2σ.
- AVWAP tự neo: một đường từ sự kiện tăng gần nhất (`SC`, `SPRING`, `SOS`), một đường từ sự kiện giảm gần nhất (`BC`, `UT`, `SOW`).
- AVWAP thủ công: click vào nến để neo (web).
- Luật ví dụ: giá test lại AVWAP từ `SOS` với `RVOL ≤ 0.85` → tăng điểm cho `LPS` (mẫu 19 biến thể ▲).

### 7.7 Volume profile

- Chế độ: vùng đang nhìn thấy (mặc định), phiên, vùng sideway tự phát hiện, vùng tự chọn.
- Volume mỗi nến được chia đều cho các hàng giá mà nến đó phủ (High–Low).
- POC, vùng giá trị 70% (VAH/VAL). Mặc định bên phải, 24% độ rộng chart, 40 hàng.

### 7.8 Câu chuyện bối cảnh (tab Bối cảnh / bảng Pine)

```
XAUUSDT · 1H · Binance Perp · RT
Cung–cầu     : Cầu kiểm soát (giá > VWAP tuần, VWAP dốc lên)
Nỗ lực/KQ    : Hấp thụ ở vùng thấp (RVOL 2.3, biên độ 0.6 ATR)
Nhân–quả     : Sideway 46 nến, rộng 4.1 ATR → mục tiêu 2415 / 2440
Pha          : Tích lũy – pha C
Mẫu gần nhất : #10 (78) · #13 (64) · #17 (52)
Kịch bản     : Chờ SOS: đóng cửa > 2388 với RVOL ≥ 1.5
Vô hiệu      : Đóng cửa < 2351
```

Kèm danh sách sự kiện gần nhất (thời gian, mã, giải thích một câu) và mô tả ngắn các mẫu khớp.

## 8. Cảnh báo

Sự kiện có cảnh báo: `SC`, `BC`, `SPRING`, `UT`, `SOS`, `SOW`, `LPS`, `LPSY`, `DIV_TOP`, `DIV_BOT`, và "mẫu mới vào top 1 với điểm ≥ 70".
TradingView gói Free giới hạn số cảnh báo đang chạy, nên chọn sự kiện quan trọng nhất.

## 9. Bản quyền

- Không dùng tên, logo, bộ icon, màu nhận diện hay bố cục sao chép của TradingView; không lấy dữ liệu và không nhúng widget của TradingView.
- Engine vẽ chart tự viết (Canvas), không phụ thuộc thư viện chart của bên thứ ba.
- Code Pine Script là của chủ dự án; publish (nếu có) theo House Rules của TradingView.
- Phông IBM Plex Mono: giấy phép SIL Open Font License.
- Yahoo Finance và VNDirect là nguồn không chính thức, chỉ dùng cá nhân.

## 10. Lộ trình

| Giai đoạn | Nội dung |
|---|---|
| 0 | Bản đặc tả này |
| 1 | Indicator Pine Script v6 "Lai Long Volume Context" (một indicator gộp tất cả) |
| 2 | Web: khung giao diện, engine chart, đa biểu đồ, dữ liệu crypto + Hyperliquid + Yahoo + VN, tìm kiếm song ngữ, VP, VWAP, tab Bối cảnh |
| 3 | AVWAP thủ công, gộp volume nhiều sàn, cảnh báo trên web, lưu bố cục |
| 4 | Công cụ vẽ, backtest luật, tinh chỉnh trọng số theo kết quả thống kê |
