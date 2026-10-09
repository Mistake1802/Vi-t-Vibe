# VIỆT VIBE — Nền tảng Việt Phục Remix 2D kết hợp AI Gemini

Web app giúp Gen Z phối Việt phục truyền thống (áo tấc, áo ngũ thân, áo nhật bình, áo dài, khăn đóng...) với streetwear hiện đại (sneaker, jean, blazer...), thử đồ bằng avatar paper-doll SVG, sáng tạo món đồ mới bằng AI và kiểm định văn hóa set đồ bằng Google Gemini.

🌐 **Bản demo đang chạy:** https://mistake1802.github.io/Vi-t-Vibe/

## Repo này có 3 phiên bản

| Phiên bản | Thư mục | Chạy ở đâu | AI hoạt động thế nào |
|---|---|---|---|
| **Bản Pages (đang live)** | `docs/` | GitHub Pages, không cần server | Gemini gọi trực tiếp từ trình duyệt — mỗi người xem tự nhập API key của mình (lưu localStorage) |
| **Bản full-stack** | `server.js` + `public/` | Chạy local bằng Node.js | Gemini gọi qua backend — key nằm trong `.env` ở server, người dùng không cần key |
| **Bản frontend-v2 (prototype)** | `frontend-v2/` | Mở `index.html` trực tiếp hoặc host tĩnh | ⚠️ Chấm điểm & Culture Check hiện là mock (logic cứng phía client), chưa gọi Gemini |

**Chọn bản nào?**
- Xem demo nhanh → mở link Pages (bản `docs/`).
- Dev tiếp / demo đầy đủ có backend → chạy bản full-stack.
- Xem prototype giao diện v2 → mở `frontend-v2/index.html`.

## 1. Chạy bản full-stack (server.js + public/)

Yêu cầu: Node.js 18.18+, một Gemini API key (lấy miễn phí tại https://aistudio.google.com/apikey).

```bash
npm install
```

Copy `.env.example` thành `.env`, điền key:

```env
GEMINI_API_KEY=your_real_key_here
PORT=3000
```

```bash
npm start
```

Mở `http://localhost:3000`. Khi dev có thể dùng `npm run dev` (tự reload khi sửa code, không cần nodemon).

## 2. Chạy / cập nhật bản Pages (docs/)

Không cần cài gì. Thư mục `docs/` chính là bản web tĩnh đang chạy tại link demo trên — GitHub Pages đang cấu hình serve thư mục `/docs`.

Muốn cập nhật bản live: sửa file trong `docs/`, commit, push — Pages tự rebuild sau 1–2 phút.

Lưu ý:
- 2 tính năng AI gọi Gemini **trực tiếp từ trình duyệt** — người xem phải tự dán API key của mình vào ô "Gemini API key" ở tab AI Creator (key chỉ lưu trong localStorage của trình duyệt đó).
- Lookbook (đăng bài, like) lưu trong localStorage — mỗi trình duyệt thấy bài của riêng mình, không đồng bộ giữa các máy.

## 3. Chạy bản frontend-v2

Mở `frontend-v2/index.html` trực tiếp bằng trình duyệt, hoặc copy cả thư mục lên bất kỳ host tĩnh nào. Đây là prototype giao diện độc lập, không cần backend.

## 4. Tính năng (bản full-stack & bản Pages)

### Studio & Tủ đồ
- Avatar paper-doll SVG render theo layer (body → quần/váy → giày → áo → phụ kiện → mũ/khăn).
- Kho 20+ món Việt phục, streetwear và phụ kiện.
- Lọc theo nhóm (áo/quần/giày/mũ/phụ kiện) và loại (truyền thống / hiện đại / AI).
- Mặc/cởi item theo slot; chỉnh màu da, chiều cao, cân nặng, dáng người.
- Item AI lưu trong `localStorage`.

### AI Creator
- **Tối ưu prompt:** biến mô tả tiếng Việt thành prompt tiếng Anh chuẩn cho minh họa 2D.
- **Tạo món đồ:** Gemini gợi ý màu + phân loại, tự nhận diện slot (áo/quần/giày/mũ/phụ kiện) từ tiếng Việt, thêm vào tủ và mặc thử ngay.

### Kiểm định văn hóa
- Gửi set đồ đang mặc + hoàn cảnh + vóc dáng cho Gemini.
- Trả về: trạng thái (`tuyet_voi` / `hop_le` / `canh_bao`), điểm số, cảnh báo văn hóa (ví dụ mặc ngắn đi chùa), đánh giá di sản, tư vấn stylist, gợi ý đổi đồ.

### Lookbook
- Đăng set đồ, thả like, "mặc thử" lại set đồ của người khác.
- Bản full-stack: lưu trong `data/lookbooks.json` (restart server không mất).
- Bản Pages: lưu trong localStorage của từng trình duyệt.

## 5. API (bản full-stack)

| Method | Endpoint | Mô tả |
|---|---|---|
| GET | `/api/lookbooks` | Lấy feed lookbook |
| POST | `/api/lookbooks` | Đăng bài (`{ title, outfit, author }`) |
| POST | `/api/lookbooks/:id/like` | Thả like |
| POST | `/api/ai/optimize-prompt` | Tối ưu prompt (`{ prompt }`) |
| POST | `/api/ai/create-item` | Tạo món đồ AI (`{ prompt }`) |
| POST | `/api/ai/cultural-check` | Kiểm định (`{ outfit, occasion, avatarStats }`) |

### Gemini fallback

Thử các model theo thứ tự `gemini-flash-latest` → `gemini-2.5-flash` → `gemini-2.0-flash`. Gặp HTTP 429/503 thì chờ 2 giây rồi chuyển model tiếp theo; lỗi 400/401/403 báo ngay, không retry.

## 6. Cấu trúc repo

```text
Vi-t-Vibe/
├── server.js            # Backend Express (bản full-stack)
├── package.json
├── .env.example
├── public/              # Frontend của bản full-stack (gọi /api/* nội bộ)
├── docs/                # Bản web tĩnh đang chạy trên GitHub Pages
├── frontend-v2/         # Prototype frontend độc lập
└── data/
    └── lookbooks.json   # Tự tạo khi chạy server (đã gitignore)
```

⚠️ `public/` và `docs/` là hai bản frontend riêng biệt — sửa UI hay thêm món đồ thì nhớ đồng bộ cả hai.

## 7. Bảo mật

- `.env` đã nằm trong `.gitignore` — không bao giờ commit key thật.
- Bản full-stack: key chỉ đọc qua `process.env.GEMINI_API_KEY` ở server, frontend chỉ gọi `/api/*` nội bộ.
- Bản Pages: mỗi người dùng tự nhập key của mình, key chỉ nằm trong localStorage trình duyệt của họ.

## 8. Lưu ý

- Avatar hiện là minh họa SVG paper-doll (mỗi slot dùng chung 1 template, chỉ khác màu), không phải hệ thống sinh ảnh.
- Nếu Google đổi tên model hoặc chính sách quota, cập nhật danh sách `GEMINI_MODELS` trong `server.js` (bản full-stack) hoặc `docs/js/ai-gemini.js` (bản Pages).
