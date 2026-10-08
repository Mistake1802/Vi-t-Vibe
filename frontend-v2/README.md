# VIỆT PHỤC REMIX — V2 Audition

## Mục tiêu
Một prototype Frontend cho đề “Việt phục Remix — Phối trang phục truyền thống theo phong cách Gen Z”.

## Có gì trong website?
1. Trang chủ: giới thiệu website làm gì, vì sao có Culture Check.
2. Khám phá: thẻ giới thiệu Việt phục và ngày lễ / bối cảnh.
3. Remix Studio:
   - Chọn model Nữ/Nam.
   - Chỉnh chiều cao 145–195 cm.
   - Chỉnh cân nặng 42–95 kg.
   - Chọn Tết, Đi học, Đám cưới, Lễ hội, Chụp ảnh, Đi chơi.
   - Chọn Áo dài, Áo tứ thân, Áo ngũ thân, Áo bà ba.
   - Chọn màu, phong cách, phụ kiện.
   - Model thay đổi tỷ lệ hiển thị theo hồ sơ.
   - Xoay model.
   - Chấm điểm hài hòa.
4. Culture Check: nguồn gốc / đặc trưng / cảnh báo bối cảnh.
5. Lookbook: lưu, dùng lại, xóa outfit.
6. Compare: so sánh 2 phương án.

## Phần Frontend bạn có thể nhận
- Thiết kế UI/UX.
- HTML: cấu trúc các trang.
- CSS: layout, responsive, màu sắc, typography, model stage.
- JavaScript: state giao diện, click/slider/select, cập nhật model, score, Culture Check, Lookbook và Compare.
- Tích hợp model thật: thay model CSS trong `#model` bằng model GLB/Three.js của nhóm.

## Chạy
Mở `index.html` trực tiếp bằng Chrome/Edge hoặc copy nguyên thư mục vào XAMPP `htdocs`.

## Ghi chú về model
Model trong V2 là mannequin Frontend mới, gồm Nam/Nữ và thay đổi tỷ lệ theo chiều cao/cân nặng. Nó không phải là file GLB gốc trong RAR của bạn, vì môi trường hiện tại không giải nén được RAR5 để chỉnh trực tiếp file GLB. Bố cục `#model` được tách riêng để nhóm dễ thay bằng GLB thật sau này.
