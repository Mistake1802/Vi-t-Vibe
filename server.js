const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const fs = require('fs');
const path = require('path');

dotenv.config();

// Dữ liệu dùng chung với frontend (prompt, danh sách model, extractJson, Lookbook mẫu)
const { GEMINI_MODELS, SYSTEM_PROMPT_1, SYSTEM_PROMPT_2, extractJson, SEED_LOOKBOOKS } = require('./docs/js/shared.js');
const { cultureCheck } = require('./docs/js/culture.js');   // luật kiểm định văn hóa (dùng chung với frontend)
const WEB_DIR = path.join(__dirname, 'docs');   // frontend duy nhất (cũng là thư mục GitHub Pages)

const app = express();
const PORT = Number(process.env.PORT) || 3000;
const DATA_DIR = path.join(__dirname, 'data');
const LOOKBOOK_FILE = path.join(DATA_DIR, 'lookbooks.json');

app.use(cors());
app.use(express.json({ limit: '100kb' }));
// Frontend dùng chung với bản Pages; ở đây ghi đè config.js để bật chế độ 'server' (gọi /api/* thay vì Gemini trực tiếp)
app.get('/js/config.js', (req, res) => {
  res.type('application/javascript').send("window.VIETVIBE_MODE = 'server';\n");
});
app.use(express.static(WEB_DIR));

const DEFAULT_LOOKBOOKS = SEED_LOOKBOOKS;

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
function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
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

// Chuyển lỗi Gemini thành { status, message } thân thiện (dùng cho cả response lỗi lẫn aiError của cultural-check)
function aiErrorInfo(error, prefix) {
  if (error.code === 'NO_KEY') {
    return { status: 500, message: 'Chưa cấu hình GEMINI_API_KEY. Hãy copy .env.example thành .env và dán API key Gemini vào.' };
  }
  if (error.status === 429 || error.status === 503) {
    return { status: 503, message: 'Gemini đang quá tải hoặc giới hạn lượt gọi. Hệ thống đã thử các model dự phòng nhưng chưa thành công. Vui lòng thử lại sau.' };
  }
  if (error.status === 401 || error.status === 403) {
    return { status: 502, message: 'API key Gemini không hợp lệ hoặc không có quyền dùng model này.' };
  }
  if (error.status === 400) {
    return { status: 400, message: 'Gemini từ chối yêu cầu. Hãy kiểm tra nội dung prompt.' };
  }
  return { status: 500, message: `${prefix}: ${error.message}` };
}

function aiErrorResponse(res, error, prefix) {
  const { status, message } = aiErrorInfo(error, prefix);
  return res.status(status).json({ error: message });
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
    } else if (/(khoác|choàng|blazer|jacket|vest)/i.test(low)) {
      category = 'outer'; icon = '🧥';
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
  const { outfit, occasion, occasionId, avatarStats } = req.body || {};
  if (!outfit || typeof outfit !== 'object') {
    return res.status(400).json({ error: 'Set đồ không hợp lệ.' });
  }

  const stats = avatarStats && typeof avatarStats === 'object'
    ? avatarStats
    : { gender: 'không xác định', height: 170, weight: 60, bodyShape: 'không xác định' };
  const items = Object.fromEntries(Object.entries(outfit).filter(([, item]) => item && typeof item === 'object'));

  // Luật chạy trước và tự chốt status/score. Gemini chỉ viết phần giải thích; Gemini lỗi thì vẫn trả 200 kèm aiError.
  const result = await cultureCheck({
    outfit: items,
    occasionId,
    occasionLabel: occasion,
    stats,
    explain: async text => {
      try { return await callGemini(SYSTEM_PROMPT_2, text); }
      catch (error) { throw new Error(aiErrorInfo(error, 'Lỗi giải thích AI').message); }
    }
  });

  res.json({
    status: result.status,
    score: result.score,
    occasion: occasion || '',
    occasionId: result.occasionId,
    culturalAlert: result.alert,
    findings: result.findings,
    culturalReview: result.review,
    stylistAdvice: result.advice,
    suggestions: result.suggestions,
    aiError: result.aiError
  });
});

app.get('*', (req, res) => {
  res.sendFile(path.join(WEB_DIR, 'index.html'));
});

app.listen(PORT, () => {
  console.log(`🚀 Việt Vibe Server chạy tại http://localhost:${PORT}`);
});
