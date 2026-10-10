// ===== VIỆT VIBE — Dữ liệu dùng chung cho cả bản Pages (trình duyệt) lẫn server.js (Node) =====
// Một nguồn duy nhất cho: danh sách model Gemini, 2 system prompt, hàm tách JSON, và 3 bài Lookbook mẫu.
// Trình duyệt: đọc qua window.VietVibeShared.  Node: require('./docs/js/shared.js').
(function (root) {
const GEMINI_MODELS = ['gemini-flash-latest', 'gemini-2.5-flash', 'gemini-2.0-flash'];

const SYSTEM_PROMPT_1 = `Bạn là một AI Prompt Optimizer chuyên về thời trang Việt phục và minh họa 2D Flat Vector.

Nhiệm vụ: Nhận một ý tưởng thời trang thô bằng tiếng Việt từ người dùng, phân tích đặc trưng văn hóa và dịch sang một Prompt tiếng Anh chi tiết, chuẩn cấu trúc cho các mô hình tạo ảnh (như Imagen / Midjourney / Stable Diffusion).

YÊU CẦU ĐẶC BIỆT:
- Bắt buộc phải có từ khóa: "2D flat fashion vector illustration, paper-doll outfit asset, isolated on clean white background, front view, clean crisp outlines".
- Mô tả chi tiết chất liệu, đường may, hoa văn cổ truyền kết hợp hơi thở hiện đại.
- suggested_color phải là mã hex hợp lệ.
- Trả về JSON duy nhất:
{
  "original_prompt": "câu gốc tiếng Việt",
  "heritage_category": "phân loại cổ phục hoặc phong cách",
  "optimized_english_prompt": "câu lệnh tiếng Anh hoàn chỉnh",
  "suggested_color": "#hex",
  "design_rationale": "giải thích ngắn gọn về cách phối chất liệu"
}`;

const SYSTEM_PROMPT_2 = `Bạn là "Việt Vibe AI Stylist" - Chuyên gia nghiên cứu Cổ phục Việt Nam (triều Nguyễn, Lê) kiêm Stylist thời trang Gen Z.

Hệ thống luật của ứng dụng ĐÃ kiểm tra set đồ và chốt trạng thái, điểm số cùng các cảnh báo. Bạn KHÔNG chấm điểm lại và KHÔNG được mâu thuẫn với kết quả đó.

Nhiệm vụ của bạn chỉ là GIẢI THÍCH và TƯ VẤN dựa trên "KẾT QUẢ KIỂM TRA TỰ ĐỘNG" được gửi kèm:
1. cultural_review: 2-4 câu về giá trị di sản/lịch sử của các món cổ phục trong set và vì sao các cảnh báo (nếu có) quan trọng. Bối cảnh tham khảo: chốn tôn nghiêm (chùa chiền, lăng tẩm, nơi thờ tự) cần trang phục kín đáo; Áo Nhật Bình có cổ hình chữ nhật và dải ngũ hành là phẩm phục cung đình, cần phối thanh lịch; dạo phố/nghệ thuật là không gian khuyến khích remix cổ phục × streetwear như áo tấc với sneaker chunky, áo ngũ thân với chân váy dài hoặc quần baggy.
2. stylist_advice: lời khuyên phối đồ dựa trên vóc dáng (chiều cao, cân nặng, dáng người).
3. suggestions: 2-3 gợi ý cụ thể, khả thi để cải thiện set đồ (hoặc nâng tầm nếu đã ổn).

Giọng văn thân thiện, tôn trọng văn hóa, bằng tiếng Việt. Luôn trả về JSON hợp lệ, không kèm giải thích ngoài JSON:
{
  "cultural_review": "...",
  "stylist_advice": "...",
  "suggestions": ["gợi ý 1", "gợi ý 2"]
}`;


function extractJson(text) {
  const match = String(text || '').match(/\{[\s\S]*\}/);
  if (!match) throw new Error('Gemini không trả về JSON hợp lệ.');
  try {
    return JSON.parse(match[0]);
  } catch {
    throw new Error('Gemini trả về JSON nhưng dữ liệu không hợp lệ.');
  }
}


const SEED_LOOKBOOKS = [
  {
    id: 'lb_1',
    author: 'GenZ_Stylist',
    title: 'Cháy phố với Áo Tấc & Baggy',
    likes: 12,
    outfit: { top: 'top_aotac_1', bottom: 'bot_baggy_1', shoes: 'shoe_sneaker_1', hat: null, accessory: 'acc_cyber_1' },
    timestamp: Date.now() - 2 * 86400000
  },
  {
    id: 'lb_2',
    author: 'Heritage_Lover',
    title: 'Dạ tiệc Nhật Bình',
    likes: 45,
    outfit: { top: 'top_nhatbinh_1', bottom: 'bot_suonglua_1', shoes: 'shoe_guoc_1', hat: 'hat_khandong_1', accessory: 'acc_vongngoc_1' },
    timestamp: Date.now() - 86400000
  },
  {
    id: 'lb_3',
    author: 'VietVibe_Studio',
    title: 'Ngũ Thân Cyber đi cà phê',
    likes: 28,
    outfit: { top: 'top_nguthan_1', bottom: 'bot_jeanrach_1', shoes: 'shoe_boots_1', hat: 'hat_beret_1', accessory: 'acc_cyber_1' },
    timestamp: Date.now() - 6 * 3600000
  }
];

  const api = { GEMINI_MODELS, SYSTEM_PROMPT_1, SYSTEM_PROMPT_2, extractJson, SEED_LOOKBOOKS };
  root.VietVibeShared = api;
  if (typeof module !== 'undefined') module.exports = api;
})(typeof window !== 'undefined' ? window : globalThis);
