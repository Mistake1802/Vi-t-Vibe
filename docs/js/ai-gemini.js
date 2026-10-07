// ===== VIỆT VIBE — Gemini client-side =====
// AI gọi TRỰC TIẾP từ trình duyệt. Mỗi người dùng tự nhập API key của mình
// (lưu trong localStorage của trình duyệt, không gửi đi đâu ngoài Google).

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

const getGeminiKey = () => (localStorage.getItem('vietvibe_gemini_key') || '').trim();
const sleep = ms => new Promise(resolve => setTimeout(resolve, ms));

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
  const key = getGeminiKey();
  if (!key) {
    throw new Error('Chưa nhập API key. Dán key vào ô "Gemini API key" phía trên (lấy miễn phí tại https://aistudio.google.com/apikey).');
  }
  const body = JSON.stringify({
    systemInstruction: { parts: [{ text: systemInstruction }] },
    contents: [{ parts: [{ text: userText }] }],
    generationConfig: { responseMimeType: 'application/json', temperature: 0.7 }
  });
  let lastErr = new Error('Không gọi được Gemini, vui lòng thử lại sau.');
  for (const model of GEMINI_MODELS) {
    for (let attempt = 1; attempt <= 2; attempt++) {
      let res;
      try {
        res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${encodeURIComponent(key)}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body
        });
      } catch (e) { lastErr = new Error('Lỗi mạng khi gọi Gemini: ' + e.message); break; }
      if (res.ok) {
        const data = await res.json();
        const parts = (data && data.candidates && data.candidates[0] && data.candidates[0].content && data.candidates[0].content.parts) || [];
        return extractJson(parts.map(p => p.text || '').join(''));
      }
      let msg = `HTTP ${res.status}`;
      try { const e = await res.json(); if (e && e.error && e.error.message) msg = e.error.message; } catch {}
      lastErr = new Error(msg);
      if (res.status === 503 || res.status === 429) { await sleep(2000); continue; }
      if (res.status === 400 || res.status === 401 || res.status === 403) throw lastErr;
      break;
    }
  }
  throw lastErr;
}

// Nhận diện slot trang phục từ mô tả tiếng Việt
function detectSlot(text) {
  const t = (text || '').toLowerCase();
  if (/quần|jean|váy/.test(t)) return 'bottom';
  if (/giày|dép|guốc|sneaker|boots/.test(t)) return 'shoes';
  if (/khăn|mũ|nón|beret/.test(t)) return 'hat';
  if (/kính|vòng|quạt|túi|phụ kiện/.test(t)) return 'accessory';
  return 'top';
}

const isValidHex = c => /^#[0-9a-fA-F]{6}$/.test(c || '');
const SLOT_ICONS = { top: '👘', bottom: '👖', shoes: '👟', hat: '👒', accessory: '🕶️' };

// ---- Lưu / nạp API key ----
const keyInput = document.getElementById('gemini-key-input');
if (keyInput) {
  keyInput.value = getGeminiKey();
  document.getElementById('btn-save-key').addEventListener('click', () => {
    const v = keyInput.value.trim();
    if (v) localStorage.setItem('vietvibe_gemini_key', v);
    else localStorage.removeItem('vietvibe_gemini_key');
    showToast(v ? 'Đã lưu API key vào trình duyệt.' : 'Đã xóa API key.');
  });
}

// ---- Tối ưu prompt ----
document.getElementById('btn-ai-optimize').addEventListener('click', async () => {
  const prompt = document.getElementById('ai-prompt-input').value.trim();
  if (!prompt) return showToast('Vui lòng nhập mô tả món đồ.');
  const btn = document.getElementById('btn-ai-optimize');
  btn.disabled = true; btn.textContent = 'Gemini đang phân tích...'; setLoading(true);

  try {
    const r = await callGemini(SYSTEM_PROMPT_1, prompt);
    document.getElementById('ai-output').classList.remove('hidden');
    document.getElementById('ai-opt-text').textContent = r.optimized_english_prompt || '';
    document.getElementById('ai-opt-color').textContent = `Màu gợi ý: ${r.suggested_color || '—'}`;
    document.getElementById('ai-opt-note').textContent = `Ghi chú: ${r.design_rationale || ''}`;
    showToast('Gemini đã tối ưu prompt.');
  } catch (error) {
    showToast(error.message);
  } finally {
    btn.disabled = false; btn.textContent = 'Tối ưu Prompt'; setLoading(false);
  }
});

// ---- Tạo món đồ AI ----
document.getElementById('btn-ai-create').addEventListener('click', async () => {
  const prompt = document.getElementById('ai-prompt-input').value.trim();
  if (!prompt) return showToast('Vui lòng nhập mô tả món đồ.');
  const btn = document.getElementById('btn-ai-create');
  btn.disabled = true; btn.textContent = 'Gemini đang sáng tạo...'; setLoading(true);

  try {
    const r = await callGemini(SYSTEM_PROMPT_1, prompt);
    const slot = detectSlot(prompt);
    const color = isValidHex(r.suggested_color) ? r.suggested_color : '#ec4899';
    const item = {
      id: 'ai_item_' + Date.now(),
      name: (r.heritage_category || prompt.slice(0, 24)) + ' [AI]',
      category: slot,
      type: 'ai',
      color,
      defaultColor: color,
      icon: SLOT_ICONS[slot] || '✨',
      isAiGenerated: true,
      pattern: r.design_rationale || 'Thiết kế độc bản từ AI Fashion Creator',
      description: `Thiết kế độc bản sinh bởi AI Fashion Creator: ${r.design_rationale || prompt}`
    };
    const items = JSON.parse(localStorage.getItem('vietvibe_ai_items') || '[]');
    items.push(item);
    localStorage.setItem('vietvibe_ai_items', JSON.stringify(items));

    document.getElementById('ai-created').classList.remove('hidden');
    document.getElementById('ai-created').textContent = `✨ Đã tạo "${item.name}" → nhóm ${slot}. Món này có trong Tủ đồ (lọc ✨ AI).`;
    AppState.outfit[slot] = item.id;
    renderInventory(); renderAvatar();
    showToast('Đã tạo và mặc món AI.');
  } catch (error) {
    showToast(error.message);
  } finally {
    btn.disabled = false; btn.textContent = 'Tạo & thêm vào tủ'; setLoading(false);
  }
});

// ---- Kiểm định văn hóa ----
const getCurrentOutfitPayload = () => {
  const result = {};
  for (const slot of Object.keys(AppState.outfit)) {
    const item = AppState.outfit[slot] ? findItemById(AppState.outfit[slot]) : null;
    if (item) result[slot] = item;
  }
  return result;
};

document.getElementById('btn-run-check').addEventListener('click', async () => {
  const btn = document.getElementById('btn-run-check');
  btn.disabled = true; btn.textContent = 'Gemini đang kiểm định...'; setLoading(true);

  try {
    const outfit = getCurrentOutfitPayload();
    const slotLabel = { top: 'Áo', bottom: 'Quần/Váy', shoes: 'Giày dép', hat: 'Mũ/Khăn', accessory: 'Phụ kiện' };
    const lines = Object.entries(outfit).map(([slot, item]) =>
      `- ${slotLabel[slot]}: ${item.name} (màu ${item.color || item.defaultColor || 'mặc định'})`);
    const stats = AppState.avatarStats;
    const userText =
      `Hoàn cảnh: ${document.getElementById('cultural-occasion').value}\n` +
      `Các món đang mặc:\n${lines.join('\n') || '(chưa mặc món nào)'}\n` +
      `Vóc dáng: cao ${stats.height}cm, nặng ${stats.weight}kg, dáng người "${stats.bodyShape}".`;

    const r = await callGemini(SYSTEM_PROMPT_2, userText);
    const status = ['tuyet_voi', 'hop_le', 'canh_bao'].includes(r.status) ? r.status : 'hop_le';
    const score = Math.max(0, Math.min(100, parseInt(r.score, 10) || 0));

    document.getElementById('check-result').classList.remove('hidden');
    document.getElementById('check-score').textContent = score;
    document.getElementById('check-status').textContent =
      status === 'tuyet_voi' ? 'TUYỆT VỜI' : status === 'canh_bao' ? 'CẦN LƯU Ý' : 'HỢP LỆ';

    const alertBox = document.getElementById('check-alert');
    if (r.cultural_alert) {
      alertBox.textContent = `CẢNH BÁO: ${r.cultural_alert}`;
      alertBox.classList.remove('hidden');
    } else alertBox.classList.add('hidden');

    document.getElementById('check-review').innerHTML = `<b>Di sản:</b> ${escapeHtml(r.cultural_review || '')}`;
    document.getElementById('check-advice').innerHTML = `<b>Stylist:</b> ${escapeHtml(r.stylist_advice || '')}`;

    const list = document.getElementById('check-suggestions');
    list.innerHTML = '';
    (Array.isArray(r.suggestions) ? r.suggestions : []).forEach(s => {
      const li = document.createElement('li'); li.textContent = s; list.appendChild(li);
    });
    showToast('Gemini đã kiểm định xong.');
  } catch (error) {
    showToast(error.message);
  } finally {
    btn.disabled = false; btn.textContent = 'Phân tích set đồ đang mặc'; setLoading(false);
  }
});
