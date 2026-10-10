// ===== Provider "static": Gemini gọi TRỰC TIẾP từ trình duyệt + Lookbook lưu localStorage =====
// Dùng cho GitHub Pages / mở index.html trực tiếp. Mỗi người dùng tự nhập API key (lưu localStorage).
// Interface giống hệt ServerProvider (xem providers/server.js) nên ai.js / social.js không cần biết đang ở chế độ nào.
const StaticProvider = (() => {
  const { GEMINI_MODELS, SYSTEM_PROMPT_1, SYSTEM_PROMPT_2, extractJson, SEED_LOOKBOOKS } = VietVibeShared;
  const LB_KEY = 'vietvibe_lookbooks';
  const SLOT_ICONS = { top: '👘', outer: '🧥', bottom: '👖', shoes: '👟', hat: '👒', accessory: '🕶️' };
  const isValidHex = c => /^#[0-9a-fA-F]{6}$/.test(c || '');

  const getGeminiKey = () => (localStorage.getItem('vietvibe_gemini_key') || '').trim();
  const sleep = ms => new Promise(resolve => setTimeout(resolve, ms));

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

  function getLookbooks() {
    try {
      const raw = localStorage.getItem(LB_KEY);
      if (raw) { const data = JSON.parse(raw); if (Array.isArray(data)) return data; }
    } catch {}
    const seed = JSON.parse(JSON.stringify(SEED_LOOKBOOKS));
    localStorage.setItem(LB_KEY, JSON.stringify(seed));
    return seed;
  }
  const saveLookbooks = list => { try { localStorage.setItem(LB_KEY, JSON.stringify(list)); } catch {} };

  return {
    // Gắn ô nhập API key (chỉ có ở chế độ static)
    init() {
      const keyInput = document.getElementById('gemini-key-input');
      if (!keyInput) return;
      keyInput.value = getGeminiKey();
      document.getElementById('btn-save-key').addEventListener('click', () => {
        const v = keyInput.value.trim();
        if (v) localStorage.setItem('vietvibe_gemini_key', v);
        else localStorage.removeItem('vietvibe_gemini_key');
        showToast(v ? 'Đã lưu API key vào trình duyệt.' : 'Đã xóa API key.');
      });
    },

    async optimizePrompt(prompt) {
      const r = await callGemini(SYSTEM_PROMPT_1, prompt);
      return { text: r.optimized_english_prompt || '', colorHex: r.suggested_color || '', notes: r.design_rationale || '' };
    },

    async createItem(prompt) {
      const r = await callGemini(SYSTEM_PROMPT_1, prompt);
      const slot = detectSlot(prompt);
      const color = isValidHex(r.suggested_color) ? r.suggested_color : '#ec4899';
      return {
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
    },

    // Luật chạy trước (culture.js) -> AI chỉ giải thích. AI lỗi/không có key vẫn trả kết quả của luật.
    culturalCheck({ outfit, occasionId, occasionLabel, stats }) {
      return VietVibeCulture.cultureCheck({
        outfit, occasionId, occasionLabel, stats,
        explain: text => callGemini(SYSTEM_PROMPT_2, text)
      });
    },

    async listLookbooks() { return getLookbooks(); },

    async postLookbook({ title, outfit, author }) {
      const all = getLookbooks();
      all.unshift({ id: 'lb_' + Date.now(), author, title, likes: 0, outfit: { ...outfit }, timestamp: Date.now() });
      saveLookbooks(all);
    },

    async likeLookbook(id) {
      const all = getLookbooks();
      const target = all.find(p => p.id === id);
      if (!target) throw new Error('Không tìm thấy bài đăng.');
      target.likes = (Number(target.likes) || 0) + 1;
      saveLookbooks(all);
      return target.likes;
    }
  };
})();
