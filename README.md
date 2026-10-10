# VIỆT VIBE — Nền tảng Việt Phục Remix 2D kết hợp AI Gemini

Web app giúp Gen Z phối Việt phục truyền thống (áo tấc, áo ngũ thân, áo nhật bình, áo dài, khăn đóng...) với streetwear hiện đại (sneaker, jean, blazer...), thử đồ bằng avatar paper-doll SVG, sáng tạo món đồ mới bằng AI và kiểm định văn hóa set đồ bằng Google Gemini.

🌐 **Bản demo đang chạy:** https://mistake1802.github.io/Vi-t-Vibe/

## Repo này có 3 phiên bản

| Phiên bản | Thư mục | Chạy ở đâu | AI hoạt động thế nào |
|---|---|---|---|
| **Bản Pages (đang live)** | `docs/` | GitHub Pages, không cần server | Gemini gọi trực tiếp từ trình duyệt — mỗi người xem tự nhập API key của mình (lưu localStorage) |
| **Bản full-stack** | `server.js` (phục vụ chính thư mục `docs/`) | Chạy local bằng Node.js | Gemini gọi qua backend — key nằm trong `.env` ở server, người dùng không cần key |
| **Bản frontend-v2 (prototype)** | `frontend-v2/` | Mở `index.html` trực tiếp hoặc host tĩnh | ⚠️ Chấm điểm & Culture Check hiện là mock (logic cứng phía client), chưa gọi Gemini |

**Chọn bản nào?**
- Xem demo nhanh → mở link Pages (bản `docs/`).
- Dev tiếp / demo đầy đủ có backend → chạy bản full-stack.
- Xem prototype giao diện v2 → mở `frontend-v2/index.html`.

## 1. Chạy bản full-stack (server.js)

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
├── docs/                # FRONTEND DUY NHẤT — GitHub Pages serve thư mục này, server.js cũng serve nó
│   ├── index.html, css/
│   └── js/
│       ├── config.js        # chế độ chạy: 'static' (mặc định) — server.js ghi đè thành 'server'
│       ├── shared.js        # prompt, danh sách model Gemini, Lookbook mẫu (dùng chung với server.js)
│       ├── culture.js       # LUẬT kiểm định văn hóa (dùng chung với server.js) — xem mục 10
│       ├── providers/       # static.js (Gemini trực tiếp + localStorage) · server.js (gọi /api/*)
│       ├── ai.js, social.js # UI dùng chung, chỉ nói chuyện với `Provider`
│       └── avatar.js, items.js, studio.js, app.js
│   └── img/items/           # ảnh minh họa WebP 400x1200 của từng món — xem mục 11
├── art/reference/body.webp  # thân tham chiếu: ảnh layer phải vẽ khớp thân này (không được web dùng)
├── tools/                   # clean_layers.py (dọn ảnh AI → WebP) · measure_body.py (đo mốc cơ thể)
├── frontend-v2/         # Prototype frontend độc lập
├── test/                # npm test — kiểm thử luật văn hóa + tủ đồ
└── data/
    └── lookbooks.json   # Tự tạo khi chạy server (đã gitignore)
```

✅ Chỉ có **một** frontend (`docs/`). Hai chế độ khác nhau ở đúng một chỗ: `Provider` (`providers/static.js` ↔ `providers/server.js`, cùng interface `optimizePrompt / createItem / culturalCheck / listLookbooks / postLookbook / likeLookbook`). Muốn đổi UI hay thêm món đồ thì chỉ sửa một nơi. Phần tử chỉ thuộc một chế độ (vd. ô nhập API key) được đánh dấu `data-only="static"` / `data-only="server"` trong `index.html`.

## 7. Bảo mật

- `.env` đã nằm trong `.gitignore` — không bao giờ commit key thật.
- Bản full-stack: key chỉ đọc qua `process.env.GEMINI_API_KEY` ở server, frontend chỉ gọi `/api/*` nội bộ.
- Bản Pages: mỗi người dùng tự nhập key của mình, key chỉ nằm trong localStorage trình duyệt của họ.

## 8. Lưu ý

- Avatar là SVG paper-doll sinh bằng code (không phải hệ thống sinh ảnh). Xem mục 9 để biết cách thêm món đồ mới.
- Nếu Google đổi tên model hoặc chính sách quota, cập nhật `GEMINI_MODELS` (và 2 system prompt) **một lần** trong `docs/js/shared.js` — cả `server.js` lẫn bản Pages đều đọc từ đó.

## 9. Avatar v2 & hệ thống layer

Logic vẽ nằm trong `js/avatar.js` (hàm thuần `buildAvatarSvg`, không đụng DOM nên test được bằng Node).

- **Cơ thể theo anchor:** vai / ngực / eo / hông / tay / chân được tính từ chiều cao, cân nặng, dáng người và giới tính (`computeBody`). Mọi món đồ được vẽ *từ các anchor này* nên tự ôm theo dáng người.
- **Mỗi món có `shape` riêng** (áo dài, áo tấc, ngũ thân, nhật bình, giao lĩnh, tee, blazer, crop jacket, áo choàng, quần suông/baggy/jean/short, váy xếp ly, guốc/sneaker/boots, khăn đóng/nón quai thao/beret, kính/vòng/quạt/tote).
- **Slot:** `top` (áo chính) · `outer` (áo khoác mặc chồng) · `bottom` · `shoes` · `hat` · `accessory`.
- **Thứ tự lớp:** mỗi slot có `z` mặc định (shoes 10 → bottom 20 → top 30 → outer 40 → accessory 50 → hat 60). Món đồ có thể override:
  - `z: 15` → áo sơ vin (vẽ *dưới* quần), vd. `top_tee_1`.
  - `covers: ['bottom']` → che hẳn slot khác, vd. `outer_cloak_1` (áo choàng dài).
- **Thêm món mới:** (1) thêm 1 hàm vẽ vào `G.<slot>.<shape>` trong `avatar.js`; (2) thêm 1 dòng vào `CATALOGUE` trong `items.js` với `shape` tương ứng. Món AI tự chọn `shape` gần nhất theo mô tả tiếng Việt (`detectShape`), không khớp thì dùng shape mặc định của slot.
- `normalizeOutfit()` đưa outfit cũ (vd. blazer từng nằm ở slot `top`) về đúng slot.

## 10. Kiểm định văn hóa: luật chạy trước, AI chỉ giải thích

Logic nằm trong `docs/js/culture.js` (cùng một file cho trình duyệt và `server.js`).

- **`evaluateOutfit()`** là hàm thuần, chạy offline, quyết định **trạng thái + điểm + cảnh báo**. Kết quả hiện ngay, không chờ mạng.
- **AI (Gemini) chỉ viết phần giải thích**: di sản, lời khuyên theo vóc dáng, gợi ý. Nó nhận kết quả của luật làm đầu vào và **không thể đổi status/điểm**. Gemini lỗi / hết quota / chưa nhập key thì vẫn có kết quả đầy đủ từ luật, kèm một dòng báo AI chưa giải thích được.
- Mỗi phát hiện (finding) có mức độ `block` (cấm) · `warn` · `info` · `good`, và có thể kèm `fix` → nút "Dùng Quần Suông Lụa" / "Bỏ món" để sửa ngay.
- **Điểm:** bắt đầu 80, cộng/trừ theo từng phát hiện; có `block` thì tối đa 45 và luôn là "cần lưu ý".
- **Thuộc tính văn hóa** của món đồ suy ra từ `shape` qua `SHAPE_META` (vd. `short: exposed_legs`, `nhat_binh: courtly`). Có thể override từng món bằng `culture: { tags: [...] }` trong `CATALOGUE`.
- **Áo choàng `covers: ['bottom']`** được tính như khi vẽ avatar: quần bị che thì không bị luật soi.

**Thêm một luật:** viết 1 khối `if` trong `evaluateOutfit()` gọi `add(severity, id, text, delta, fix?)`, rồi thêm 1 test trong `test/culture.test.js`.
**Thêm món mới:** ngoài hàm vẽ trong `avatar.js` và dòng trong `CATALOGUE`, thêm `shape` vào `SHAPE_META` — test `mọi món trong tủ có shape…` sẽ báo lỗi nếu quên.

```bash
npm test     # 17 test, cần Node 18.18+, không cài thêm gì
```

## 11. Ảnh minh họa cho đồ (ghép lên thân vector)

Nhân vật **luôn là vector** nên cân nặng / dáng người / giới tính / màu da luôn có tác dụng. Mỗi món đồ có thể là:

- **hình vector** (theo `shape`, trong `avatar.js`) — món nào cũng có, hoặc
- **ảnh minh họa** (`image` trong `CATALOGUE`) — đẹp hơn, dùng thay hình vector khi có.

Hai loại mặc lẫn được (vd. Áo Tấc dạng ảnh + Quần Baggy vector). Công tắc dưới avatar: **Ảnh + vector** (mặc định) hoặc **Chỉ vector** (bỏ qua mọi ảnh).

**Ảnh được kéo cho khớp thân vector thế nào:** ảnh layer vẽ theo cơ thể trong `art/reference/body.webp`, tỉ lệ khác thân vector. `avatar.js` cắt ảnh thành các dải ngang (3 đơn vị/dải) rồi kéo từng dải về đúng độ cao và bề ngang của thân vector tại các mốc cổ · vai · ngực · eo · hông · đáy quần · gối · cổ chân. Vì bề ngang bám theo thân vector nên kéo thanh cân nặng hoặc đổi dáng thì đồ dạng ảnh cũng ôm theo (xấp xỉ — thay đổi quá lớn sẽ thấy méo hoạ tiết). Giày chỉ phóng/thu đều theo khoảng cách hai bàn chân; mũ dời về tâm đầu. Các mốc nằm ở `ART_REF` (`avatar.js`); đổi ảnh body tham chiếu thì chạy `python tools/measure_body.py` để đo lại.

**Thêm một món có ảnh:**
1. Tạo ảnh layer **cùng khung 400×1200 với `art/reference/body.webp`**, nền trong suốt, món đồ nằm đúng vị trí trên cơ thể mẫu (chỉ vẽ món đó, không vẽ người). Mũ thì đặt tên `hat_*`.
2. Dọn + nén: `python tools/clean_layers.py <thư_mục_ảnh_gốc> docs/img/items` (cần `pip install pillow numpy scipy`). Tool xoá mảnh vụn và vùng mờ do tách nền, **xoá phần đầu/hoa tai lọt vào layer áo**, từ chối ảnh sai khung và xuất WebP (~10× nhẹ hơn PNG).
3. Thêm vào `CATALOGUE` (`items.js`): `image:'img/items/<id>.webp'` cùng `category` + `shape` (shape dùng cho luật văn hoá và hình vector khi chọn "Chỉ vector").
4. Nếu ảnh **đã vẽ sẵn cả phần khác** (vd. Áo Ngũ Thân vẽ liền quần) thêm `imageCovers:['bottom']`: khi dùng ảnh, slot đó bị che (luật văn hoá cũng bỏ qua nó); ở "Chỉ vector" thì quần vẫn hiện.

Giới hạn cần biết: phần da trong ảnh đồ (vd. cổ chữ V của Áo Ngũ Thân) là màu da trong tranh, không đổi theo ô màu da. Hình vector vẫn đơn giản hơn ảnh nên mặc lẫn sẽ thấy khác phong cách.

`npm test` kiểm tra mọi `image` tồn tại, là WebP, đúng khung 400×1200, các dải phủ kín không hở và đồ ảnh rộng ra khi tăng cân.
