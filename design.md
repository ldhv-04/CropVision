# CropVision AI — Master Design Specification (`design.md`)

> **Phiên bản**: 3.0.0-Minimalist (Thuần Khiết & Tối Giản)  
> **Phong cách**: Pure White Minimalist Agronomy (Áp dụng tiêu chuẩn `/impeccable` và `/distill`)  
> **Mục tiêu cốt lõi**: Loại bỏ hoàn toàn sự rườm rà, tập trung 100% vào chức năng thực tế, thông tin thoáng đãng, dễ đọc tuyệt đối.

---

## 1. Triết Lý Thiết Kế: "Tối Giản & Hiệu Quả"

Giao diện mới từ bỏ hoàn toàn các yếu tố đồ họa mang tính trang trí phức tạp (không nền đen sci-fi, không viền phát quang neon, không card lồng card, không thuật ngữ viễn tưởng). 

Mọi màn hình đều tuân thủ các nguyên tắc vàng của `/impeccable`:
- **Nền trắng thuần khiết (`#FFFFFF`)**: Không gian thoáng đãng, tận dụng tối đa ánh sáng tự nhiên để mắt thư thái khi nhìn lâu.
- **Phân cấp bằng khoảng trắng, không lạm dụng khung viền**: Thay vì đóng khung từng cụm chữ vào thẻ card, sử dụng khoảng cách dòng và đường kẻ mờ `$1\text{px}$` (`#E2E8F0`) để phân tách nội dung.
- **Bãi bỏ hoàn toàn Kicker/Eyebrow**: Tiêu đề đứng độc lập, ngắn gọn, súc tích. Không dùng chữ hoa giả dạng máy móc.
- **Typography rõ ràng, chuẩn tiếng Việt**: Dùng `Be Vietnam Pro` / `Inter`, cỡ chữ vừa vặn, độ đậm chuẩn mực (400 cho nội dung, 600 cho tiêu đề), xóa bỏ phong cách monospace giả kỹ thuật.
- **Sử dụng màu sắc có trách nhiệm (Quy tắc 90-10)**: 90% giao diện là sắc trắng, xám nhạt và đen; chỉ 10% màu xanh lá thực vật (`#15803D`) cho nút bấm chính và đỏ (`#DC2626`) cho cảnh báo sâu bệnh.

---

## 2. Hệ Thống Token Màu Sắc Tối Giản

Hệ thống màu sắc rút gọn tối đa xuống một bảng màu thống nhất dùng chung cho cả PC và Mobile:

| Tên Token | Mã Hex | Ý nghĩa & Vị trí sử dụng |
| :--- | :--- | :--- |
| `color-bg` | `#FFFFFF` | Nền trắng chủ đạo của toàn bộ ứng dụng |
| `color-surface` | `#F8FAFC` | Nền phụ cho thanh điều hướng, bảng chọn nhẹ |
| `color-border` | `#E2E8F0` | Đường phân cách mảnh 1px giữa các hàng dữ liệu |
| `color-primary` | `#15803D` | Xanh lá nông nghiệp chuẩn (Nút bấm chính, trạng thái khỏe) |
| `color-primary-soft` | `#DCFCE7` | Nền thẻ trạng thái nhẹ (`badge`) cho cây khỏe |
| `color-danger` | `#DC2626` | Đỏ cảnh báo dịch bệnh, sâu hại |
| `color-danger-soft` | `#FEE2E2` | Nền thẻ trạng thái nhẹ cho bệnh hại |
| `color-warning` | `#D97706` | Vàng cam cho việc cần xử lý hôm nay |
| `color-text-main` | `#0F172A` | Đen xám đậm nhất cho tiêu đề và số liệu chính |
| `color-text-sub` | `#475569` | Xám trung tính cho mô tả, hướng dẫn, tên khoa học |
| `color-text-muted` | `#94A3B8` | Xám nhạt cho ngày giờ, đơn vị tính (`ha`, `m²`) |

---

## 3. Quy Chuẩn Typography & Phân Cấp Nội Dung

Không dùng font chữ lạ mắt hay trang trí viền chữ. Sử dụng kiểu chữ đơn giản, tròn trịa, dễ quét bằng mắt:

- **Tiêu đề trang (Page Title)**: $22\text{px}$ · Bold (600) · `#0F172A`
- **Tiêu đề mục (Section Title)**: $16\text{px}$ · SemiBold (600) · `#0F172A`
- **Chữ nội dung chính (Body Text)**: $15\text{px}$ · Regular (400) · Dòng cao $22\text{px}$ · `#334155`
- **Thông số & Đơn vị**: $14\text{px}$ · Medium (500) · `#0F172A`
- **Nhãn trạng thái (Status Badge)**: $12\text{px}$ · Medium (500) · Đệm $4\text{px} \times 8\text{px}$ bo góc tròn $4\text{px}$

---

## 4. Thiết Kế Các Chức Năng Cốt Lõi Trên Nền Tảng

### 4.1. 📱 MOBILE: ỨNG DỤNG QUẢN LÝ NÔNG TRẠI (Tối Giản & Dễ Đọc)

Mọi thông tin hiển thị trên điện thoại đều phục vụ nhu cầu thực tế của người nông dân ngoài đồng ruộng:

#### Màn hình 1: Danh sách Thửa ruộng (Nông Trại Của Tôi)
- **Đầu trang**: Tên nông trại ("Nông trại An Giang"), biểu tượng cài đặt ở góc phải.
- **Danh sách phẳng (Flat List)**: Thay vì dùng các thẻ card cồng kềnh, sử dụng danh sách phẳng với đường kẻ chia dòng `$1\text{px}$`:
  - Dòng 1: Tên thửa đất ("Thửa 01 - Ruộng Trên") + Huy hiệu trạng thái ("Khỏe mạnh" - chữ xanh nền `#DCFCE7` hoặc "Có bệnh" - chữ đỏ nền `#FEE2E2`).
  - Dòng 2: Giống cây trồng ("Lúa OM5451") · Diện tích ("1.8 ha").
  - Dòng 3 (nếu có): Lịch việc cần làm ("Bón phân đón đòng - Ngày mai").
- **Nút hành động chính (Primary Action Button)**:
  - Một nút xanh lá duy nhất đặt ở tầm ngón tay cái: `[ 📷 Chụp ảnh lá cây ]` (Cao $50\text{px}$, chữ trắng đậm, không hiệu ứng phát quang).
- **Thanh chuyển tab dưới cùng (3 tab thiết yếu)**:
  - `Thửa ruộng` (Trang chủ) · `Chụp lá` (Camera) · `Sổ tay bệnh` (Tra cứu).

#### Màn hình 2: Kết quả Quét bệnh Lá AI
- **Ảnh chụp thực tế**: Chiều cao $240\text{px}$, bo góc nhẹ $8\text{px}$, viền mờ $1\text{px}$.
- **Thông tin chẩn đoán (Cắt bỏ thuật ngữ máy móc)**:
  - Tên bệnh to rõ: **Bệnh Đạo Ôn Lá** ($20\text{px}$ - Bold)
  - Độ tin cậy: Tỷ lệ chính xác $98\%$
  - Tên khoa học: *Magnaporthe oryzae*
- **Đơn thuốc khuyến nghị (Rõ ràng, ngắn gọn)**:
  - Hoạt chất: Tricyclazole 75% WP
  - Liều lượng: Pha 25g vào bình 25 lít nước
  - Cách phun: Phun vào buổi sáng sớm khi lá ráo sương
- **Nút bấm**: `[ Lưu lại vào thửa ruộng ]` và `[ Chụp ảnh khác ]`.

---

### 4.2. 🖥️ PC: BÀN LÀM VIỆC BẢN ĐỒ & QUẢN LÝ THỰC ĐỊA

Giao diện máy tính thanh thoát như một trang tài liệu hiện đại (tương tự Notion hoặc Linear dạng sáng):

- **Thanh trên cùng (Header - Cao 54px)**:
  - Logo CropVision đơn giản.
  - Tên trang hiện tại: "Bản đồ Giám sát Thửa đất".
  - Ô tìm kiếm thửa ruộng nhanh.
- **Bố cục 2 cột rõ ràng**:
  - **Cột trái (320px - Nền trắng `#FFFFFF`, viền phải `#E2E8F0`)**:
    - Danh sách các thửa ruộng, kèm bộ lọc nhanh: `Tất cả` · `Cần xử lý`.
    - Click vào thửa nào thì bản đồ tự di chuyển đến thửa đó.
  - **Khu vực bản đồ chính (Toàn màn hình còn lại)**:
    - Bản đồ GIS nền sáng (OpenStreetMap hoặc MapLibre vector phong cách xám/trắng thanh lịch).
    - Các thửa đất vẽ bằng nét viền mảnh màu xanh lá đậm (`#15803D`) với độ mờ nền $15\%$. Thửa có bệnh viền đỏ mảnh (`#DC2626`).
  - **Bảng chi tiết trượt từ bên phải (Drawer - 360px)**:
    - Khi người dùng click vào một thửa đất trên bản đồ, bảng này trượt ra hiển thị: Tên chủ hộ, diện tích, lịch sử các lần chụp lá gần nhất và đơn thuốc đã đề xuất.

---

## 5. Tham Số Cấu Hình Cho Stitch

- `colorMode`: `LIGHT` (Nền trắng)
- `customColor`: `#15803D` (Xanh lá thực vật tự nhiên)
- `headlineFont`: `INTER` hoặc `BE_VIETNAM_PRO`
- `bodyFont`: `INTER` hoặc `BE_VIETNAM_PRO`
- `roundness`: `ROUND_FOUR` hoặc `ROUND_EIGHT` (Góc bo tinh tế, không bo tròn quá mức)
- `themeRules`: "Giao diện trắng hoàn toàn, tối giản tuyệt đối, dễ đọc, không màu mè, không hiệu ứng glow, không dùng thẻ lồng thẻ".

---
*Tài liệu thiết kế giao diện tối giản CropVision AI theo chuẩn Impeccable.*
