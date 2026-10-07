const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const fs = require('fs');
const path = require('path');

dotenv.config();

const app = express();
const PORT = Number(process.env.PORT) || 3000;
const DATA_DIR = path.join(__dirname, 'data');
const LOOKBOOK_FILE = path.join(DATA_DIR, 'lookbooks.json');

app.use(cors());
app.use(express.json({ limit: '100kb' }));
app.use(express.static(path.join(__dirname, 'public')));

const DEFAULT_LOOKBOOKS = [
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

function ensureDataFile() {
  if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
  if (!fs.existsSync(LOOKBOOK_FILE)) {
    fs.writeFileSync(LOOKBOOK_FILE, JSON.stringify(DEFAULT_LOOKBOOKS, null, 2), 'utf8');
  }
}

function getLookbooks() {
  ensureDataFile();
  try {
    const parsed = JSON.parse(fs.readFileSync(LOOKBOOK_FILE, 'utf8'));
    return Array.isArray(parsed) ? parsed : [...DEFAULT_LOOKBOOKS];
  } catch {
    return [...DEFAULT_LOOKBOOKS];
  }
}

function saveLookbooks(data) {
  ensureDataFile();
  fs.writeFileSync(LOOKBOOK_FILE, JSON.stringify(data, null, 2), 'utf8');
}

ensureDataFile();

// -------------------- LOOKBOOK API --------------------
app.get('/api/lookbooks', (req, res) => {
  res.json({ lookbooks: getLookbooks() });
});

app.post('/api/lookbooks', (req, res) => {
  const { title, outfit, author } = req.body || {};

  if (!title || typeof title !== 'string' || !title.trim()) {
    return res.status(400).json({ error: 'Vui lòng nhập tên Lookbook.' });
  }
  if (!outfit || typeof outfit !== 'object') {
    return res.status(400).json({ error: 'Set đồ không hợp lệ.' });
  }

  const lookbooks = getLookbooks();
  const post = {
    id: `lb_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
    author: typeof author === 'string' && author.trim() ? author.trim().slice(0, 30) : 'Ẩn danh',
    title: title.trim().slice(0, 100),
    likes: 0,
    outfit,
    timestamp: Date.now()
  };

  lookbooks.unshift(post);
  saveLookbooks(lookbooks);
  res.status(201).json({ success: true, post });
});

app.post('/api/lookbooks/:id/like', (req, res) => {
  const lookbooks = getLookbooks();
  const post = lookbooks.find(item => item.id === req.params.id);

  if (!post) return res.status(404).json({ error: 'Không tìm thấy bài đăng.' });

  post.likes = Math.max(0, Number(post.likes) || 0) + 1;
  saveLookbooks(lookbooks);
  res.json({ success: true, likes: post.likes });
});

// -------------------- GEMINI API --------------------
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

Nhiệm vụ: Kiểm duyệt và tư vấn các set đồ phối giữa cổ phục truyền thống và trang phục hiện đại.

CÁC NGUYÊN TẮC VĂN HÓA BẮT BUỘC:
1. Chốn tôn nghiêm (Chùa chiền, Lăng tẩm, Nơi thờ tự): Nghiêm cấm mặc áo cổ phục kết hợp quần short ngắn, váy quá ngắn hoặc quần rách tả tơi. Nếu phát hiện, BẮT BUỘC trả về status = "canh_bao" và nêu rõ lý do bảo vệ thuần phong mỹ tục.
2. Phẩm phục cung đình (Áo Nhật Bình): Cổ áo hình chữ nhật và dải ngũ hành đại diện cho cấp bậc hoàng tộc cao quý. Cần phối với trang phục thanh lịch, không phối hở hang hoặc phụ kiện phản cảm.
3. Không gian dạo phố/nghệ thuật: Khuyến khích sự sáng tạo lành mạnh như phối áo tấc với sneaker chunky, áo ngũ thân với chân váy dài hoặc quần baggy.

Luôn trả về JSON hợp lệ, không kèm giải thích ngoài JSON:
{
  "status": "tuyet_voi" | "hop_le" | "canh_bao",
  "score": 0,
  "cultural_alert": "thông báo cảnh báo hoặc null",
  "cultural_review": "đánh giá về mặt di sản và giá trị lịch sử",
  "stylist_advice": "lời khuyên phối đồ dựa trên vóc dáng",
  "suggestions": ["gợi ý 1", "gợi ý 2"]
}`;

const GEMINI_MODELS = ['gemini-flash-latest', 'gemini-2.5-flash', 'gemini-2.0-flash'];

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

function extractJson(text) {
  const match = String(text || '').match(/\{[\s\S]*\}/);
  if (!match) throw new Error('Gemini không trả về JSON hợp lệ.');
  try {
    return JSON.parse(match[0]);
  } catch {
    throw new Error('Gemini trả về JSON nhưng dữ liệu không hợp lệ.');
  }
}

async function callGemini(systemInstruction, userText) {
  const key = process.env.GEMINI_API_KEY;
  if (!key || key === 'your_gemini_api_key_here') {
    const error = new Error('NO_KEY');
    error.code = 'NO_KEY';
    throw error;
  }

  let lastError = null;

  for (let i = 0; i < GEMINI_MODELS.length; i++) {
    const model = GEMINI_MODELS[i];
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${encodeURIComponent(key)}`;

    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          systemInstruction: { parts: [{ text: systemInstruction }] },
          contents: [{ role: 'user', parts: [{ text: userText }] }],
          generationConfig: {
            responseMimeType: 'application/json',
            temperature: 0.7
          }
        })
      });

      if (response.ok) {
        const data = await response.json();
        const output = data.candidates?.[0]?.content?.parts?.[0]?.text;
        return extractJson(output);
      }

      const raw = await response.text().catch(() => '');
      const error = new Error(`Google Gemini API trả về HTTP ${response.status}.`);
      error.status = response.status;
      error.details = raw.slice(0, 500);

      if (response.status === 400 || response.status === 401 || response.status === 403) {
        throw error;
      }

      if ((response.status === 429 || response.status === 503) && i < GEMINI_MODELS.length - 1) {
        lastError = error;
        await sleep(2000);
        continue;
      }

      throw error;
    } catch (error) {
      if (error.code === 'NO_KEY' || [400, 401, 403].includes(error.status)) throw error;

      lastError = error;
      if (i < GEMINI_MODELS.length - 1) {
        await sleep(2000);
        continue;
      }
    }
  }

  throw lastError || new Error('Không thể kết nối Gemini.');
}

function aiErrorResponse(res, error, prefix) {
  if (error.code === 'NO_KEY') {
    return res.status(500).json({
      error: 'Chưa cấu hình GEMINI_API_KEY. Hãy copy .env.example thành .env và dán API key Gemini vào.'
    });
  }
  if (error.status === 429 || error.status === 503) {
    return res.status(503).json({
      error: 'Gemini đang quá tải hoặc giới hạn lượt gọi. Hệ thống đã thử các model dự phòng nhưng chưa thành công. Vui lòng thử lại sau.'
    });
  }
  if (error.status === 401 || error.status === 403) {
    return res.status(502).json({ error: 'API key Gemini không hợp lệ hoặc không có quyền dùng model này.' });
  }
  if (error.status === 400) {
    return res.status(400).json({ error: 'Gemini từ chối yêu cầu. Hãy kiểm tra nội dung prompt.' });
  }
  return res.status(500).json({ error: `${prefix}: ${error.message}` });
}

app.post('/api/ai/optimize-prompt', async (req, res) => {
  const prompt = typeof req.body?.prompt === 'string' ? req.body.prompt.trim() : '';
  if (!prompt) return res.status(400).json({ error: 'Vui lòng nhập mô tả tiếng Việt.' });
  if (prompt.length > 2000) return res.status(400).json({ error: 'Prompt tối đa 2000 ký tự.' });

  try {
    const result = await callGemini(SYSTEM_PROMPT_1, prompt);
    res.json({
      originalPrompt: result.original_prompt || prompt,
      optimizedPrompt: result.optimized_english_prompt || '',
      itemCategory: result.heritage_category || 'Việt phục remix',
      designNotes: result.design_rationale || '',
      colorHex: result.suggested_color || '#ec4899',
      ...result
    });
  } catch (error) {
    aiErrorResponse(res, error, 'Lỗi khi gọi Gemini');
  }
});

app.post('/api/ai/create-item', async (req, res) => {
  const prompt = typeof req.body?.prompt === 'string' ? req.body.prompt.trim() : '';
  if (!prompt) return res.status(400).json({ error: 'Vui lòng nhập mô tả món đồ.' });
  if (prompt.length > 2000) return res.status(400).json({ error: 'Mô tả tối đa 2000 ký tự.' });

  try {
    const result = await callGemini(SYSTEM_PROMPT_1, prompt);
    const low = prompt.toLowerCase();

    let category = 'top';
    let icon = '✨';
    if (/(quần|jean|váy)/i.test(low)) {
      category = 'bottom'; icon = '👖';
    } else if (/(giày|dép|guốc|sneaker|boots)/i.test(low)) {
      category = 'shoes'; icon = '👟';
    } else if (/(khăn|mũ|nón|beret)/i.test(low)) {
      category = 'hat'; icon = '👒';
    } else if (/(kính|vòng|quạt|túi|phụ kiện)/i.test(low)) {
      category = 'accessory'; icon = '💎';
    }

    const color = /^#[0-9a-f]{6}$/i.test(result.suggested_color || '') ? result.suggested_color : '#ec4899';

    const item = {
      id: `ai_item_${Date.now()}`,
      name: `AI: ${result.heritage_category || 'Thiết kế mới'}`,
      category,
      type: 'modern',
      color,
      defaultColor: color,
      icon,
      isAiGenerated: true,
      pattern: result.optimized_english_prompt || '',
      description: result.design_rationale || 'Thiết kế được tạo bởi Gemini.'
    };

    res.status(201).json({ success: true, item });
  } catch (error) {
    aiErrorResponse(res, error, 'Lỗi tạo đồ AI');
  }
});

app.post('/api/ai/cultural-check', async (req, res) => {
  const { outfit, occasion, avatarStats } = req.body || {};
  if (!outfit || typeof outfit !== 'object') {
    return res.status(400).json({ error: 'Set đồ không hợp lệ.' });
  }

  const safeStats = avatarStats && typeof avatarStats === 'object'
    ? avatarStats
    : { gender: 'không xác định', height: 170, weight: 60, bodyShape: 'không xác định' };

  const outfitDesc = Object.entries(outfit)
    .filter(([, item]) => item)
    .map(([slot, item]) => {
      if (typeof item === 'object') {
        return `- ${slot}: ${item.name || 'Món đồ không tên'} (${item.type || 'không rõ loại'}), màu ${item.defaultColor || item.color || 'không rõ'}, họa tiết ${item.pattern || 'không rõ'}`;
      }
      return `- ${slot}: ${item}`;
    }).join('\n');

  const userText = `Hoàn cảnh: ${occasion || 'Không xác định'}
Set đồ đang mặc:
${outfitDesc || '- Không mặc gì'}

Vóc dáng:
- Giới tính: ${safeStats.gender || 'không xác định'}
- Chiều cao: ${safeStats.height || 'không xác định'} cm
- Cân nặng: ${safeStats.weight || 'không xác định'} kg
- Dáng người: ${safeStats.bodyShape || 'không xác định'}`;

  try {
    const result = await callGemini(SYSTEM_PROMPT_2, userText);
    const score = Math.min(100, Math.max(0, Number.parseInt(result.score, 10) || 0));
    const status = ['tuyet_voi', 'hop_le', 'canh_bao'].includes(result.status) ? result.status : 'hop_le';

    res.json({
      status,
      score,
      occasion: occasion || '',
      culturalAlert: result.cultural_alert ?? null,
      culturalReview: result.cultural_review || '',
      stylistAdvice: result.stylist_advice || '',
      suggestions: Array.isArray(result.suggestions) ? result.suggestions : []
    });
  } catch (error) {
    aiErrorResponse(res, error, 'Lỗi kiểm định AI');
  }
});

app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.listen(PORT, () => {
  console.log(`🚀 Việt Vibe Server chạy tại http://localhost:${PORT}`);
});
