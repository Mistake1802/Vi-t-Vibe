# VIỆT VIBE — Nền tảng Việt Phục Remix 2D kết hợp AI Gemini

VIỆT VIBE là web app full-stack Node.js + Express giúp Gen Z phối Việt phục truyền thống với streetwear hiện đại, thử đồ bằng avatar paper-doll SVG và dùng Google Gemini cho AI Creator + kiểm định văn hóa.

## 1. Yêu cầu

- Node.js 18.18+ (khuyến nghị Node.js LTS)
- Một Gemini API key từ Google AI Studio

## 2. Chạy project

Mở terminal tại thư mục `viet-vibe`:

```bash
npm install
```

Copy `.env.example` thành `.env`, sau đó điền:

```env
GEMINI_API_KEY=your_real_key_here
PORT=3000
```

Khởi động:

```bash
npm start
```

Mở `http://localhost:3000`.

Trong quá trình phát triển có thể dùng:

```bash
npm run dev
```

Script dev dùng `node --watch`, không cần cài thêm nodemon.

## 3. Tính năng

### Studio & Tủ đồ
- Avatar paper-doll SVG theo từng layer.
- Kho 20+ món Việt phục, streetwear và phụ kiện.
- Lọc theo nhóm và loại: truyền thống / hiện đại / AI.
- Mặc/cởi item theo slot.
- Chỉnh màu da, chiều cao, cân nặng và dáng người.
- Item AI được lưu trong `localStorage`.

### AI Creator
- `POST /api/ai/optimize-prompt`: biến mô tả tiếng Việt thành prompt tiếng Anh cho hình minh họa 2D.
- `POST /api/ai/create-item`: gọi Gemini thật, tự phân loại slot và tạo item lưu vào tủ.
- Không đặt API key ở frontend.

### Kiểm định văn hóa
- `POST /api/ai/cultural-check`.
- Gửi set đồ, hoàn cảnh và thông tin vóc dáng tới Gemini.
- Kết quả gồm trạng thái, điểm số, cảnh báo, đánh giá di sản, tư vấn stylist và gợi ý.

### Lookbook
- `GET /api/lookbooks`
- `POST /api/lookbooks`
- `POST /api/lookbooks/:id/like`
- Dữ liệu lưu trong `data/lookbooks.json`.

## 4. Gemini fallback

Backend thử các model theo thứ tự:

1. `gemini-flash-latest`
2. `gemini-2.5-flash`
3. `gemini-2.0-flash`

Với HTTP 429/503, server chờ 2 giây rồi chuyển model tiếp theo. Lỗi 400/401/403 không retry.

## 5. Cấu trúc

```text
viet-vibe/
├── server.js
├── package.json
├── .env.example
├── .gitignore
├── README.md
├── data/
│   └── lookbooks.json
└── public/
    ├── index.html
    ├── css/
    │   └── style.css
    └── js/
        ├── app.js
        ├── items.js
        ├── avatar.js
        ├── studio.js
        ├── ai-gemini.js
        └── social.js
```

## 6. Bảo mật

- `.env` bị Git bỏ qua.
- API key chỉ được đọc bằng `process.env.GEMINI_API_KEY` ở server.
- Frontend chỉ gọi API nội bộ `/api/ai/*`.
- Không commit API key thật lên GitHub.

## 7. Lưu ý

Avatar hiện là minh họa SVG paper-doll, không phải hệ thống sinh ảnh. Gemini được dùng thật cho phần AI Creator và Cultural Checker. Nếu Google thay đổi model/API hoặc quota, có thể cần cập nhật danh sách model trong `server.js`.
