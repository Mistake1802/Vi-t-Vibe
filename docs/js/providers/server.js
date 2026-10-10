// ===== Provider "server": mọi thứ đi qua backend (server.js) – API key nằm trong .env ở server =====
const ServerProvider = (() => {
  const apiJson = async (url, options = {}) => {
    const response = await fetch(url, {
      ...options,
      headers: { 'Content-Type': 'application/json', ...(options.headers || {}) }
    });
    let data = {};
    try { data = await response.json(); } catch {}
    if (!response.ok) throw new Error(data.error || `Yêu cầu thất bại (${response.status}).`);
    return data;
  };
  const post = (url, body) => apiJson(url, { method: 'POST', body: JSON.stringify(body) });

  return {
    init() {},

    async optimizePrompt(prompt) {
      const d = await post('/api/ai/optimize-prompt', { prompt });
      return {
        text: d.optimizedPrompt || d.optimized_english_prompt || '',
        colorHex: d.colorHex || d.suggested_color || '',
        notes: d.designNotes || d.design_rationale || ''
      };
    },

    async createItem(prompt) { return (await post('/api/ai/create-item', { prompt })).item; },

    async culturalCheck({ outfit, occasionId, occasionLabel, stats }) {
      const d = await post('/api/ai/cultural-check', { outfit, occasion: occasionLabel, occasionId, avatarStats: stats });
      return {
        status: d.status, score: d.score, alert: d.culturalAlert || null, findings: d.findings || [],
        review: d.culturalReview || '', advice: d.stylistAdvice || '', suggestions: d.suggestions || [],
        aiError: d.aiError || null
      };
    },

    async listLookbooks() { return (await apiJson('/api/lookbooks')).lookbooks || []; },
    async postLookbook(post_) { await post('/api/lookbooks', post_); },
    async likeLookbook(id) { return (await post(`/api/lookbooks/${encodeURIComponent(id)}/like`, {})).likes; }
  };
})();

// Chọn provider theo chế độ chạy (config.js; server.js ghi đè thành 'server')
const Provider = MODE === 'server' ? ServerProvider : StaticProvider;
