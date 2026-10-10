// ===== VIỆT VIBE — Kiểm định văn hóa: LUẬT chạy trước, AI chỉ giải thích =====
// Một nguồn duy nhất cho cả trình duyệt (window.VietVibeCulture) lẫn server.js (require).
//
//  evaluateOutfit()  hàm thuần, offline, tất định: quyết định status + score + danh sách phát hiện (findings).
//  cultureCheck()    chạy luật rồi (tuỳ chọn) nhờ AI viết phần giải thích. AI lỗi/hết quota/không có key
//                    -> vẫn trả kết quả của luật, kèm `aiError`. AI KHÔNG được đổi status hay score.
//
// Mỗi món đồ được mô tả bằng `tags` suy ra từ item.shape (SHAPE_META), có thể override bằng item.culture.tags.

(function (root) {
  // ---------- Hoàn cảnh ----------
  const OCCASIONS = {
    temple:  'Đi chùa / nơi tôn nghiêm',
    street:  'Dạo phố / Cafe',
    gala:    'Dạ tiệc / Prom',
    culture: 'Sự kiện văn hóa'
  };
  // Phòng khi client cũ không gửi occasionId: đoán từ chữ trong <option>
  function inferOccasionId(text) {
    const t = String(text || '').toLowerCase();
    if (/chùa|lăng|thờ|tôn nghiêm|di tích/.test(t)) return 'temple';
    if (/dạ tiệc|prom/.test(t)) return 'gala';
    if (/văn hóa|triển lãm/.test(t)) return 'culture';
    return 'street';
  }

  // ---------- Thuộc tính văn hóa theo hình dáng (shape trong avatar.js) ----------
  // traditional · courtly (phẩm phục cung đình) · ceremonial (lễ phục) · formal · modern · casual · streetwear
  // modest (kín đáo) · exposed_legs (hở chân) · distressed (rách) · flashy (neon/nổi bật) · headwear
  const SHAPE_META = {
    aodai:         { tags: ['traditional', 'formal'] },
    aotac:         { tags: ['traditional', 'ceremonial', 'formal'] },
    ngu_than:      { tags: ['traditional', 'ceremonial', 'formal'] },
    nhat_binh:     { tags: ['traditional', 'courtly', 'ceremonial', 'formal'] },
    giao_linh:     { tags: ['traditional'] },
    tee:           { tags: ['modern', 'casual'] },
    blazer:        { tags: ['modern', 'formal'] },
    crop_jacket:   { tags: ['modern', 'streetwear', 'flashy'] },
    cloak:         { tags: ['traditional', 'formal'], covers: ['bottom'] },
    suong:         { tags: ['traditional', 'modest', 'formal'] },
    baggy:         { tags: ['modern', 'casual', 'streetwear', 'modest'] },
    jean:          { tags: ['modern', 'casual', 'distressed'] },   // jean trong tủ là "Jean Rách Gối"
    short:         { tags: ['modern', 'casual', 'exposed_legs'] },
    skirt_pleated: { tags: ['modern', 'modest', 'formal'] },
    guoc:          { tags: ['traditional', 'modest'] },
    sneaker:       { tags: ['modern', 'casual', 'streetwear'] },
    boots:         { tags: ['modern', 'casual'] },
    khan_dong:     { tags: ['traditional', 'courtly', 'headwear', 'formal'] },
    quai_thao:     { tags: ['traditional', 'headwear'] },
    beret:         { tags: ['modern', 'headwear'] },
    glasses:       { tags: ['modern', 'flashy'] },
    bracelet:      { tags: ['traditional'] },
    fan:           { tags: ['traditional'] },
    tote:          { tags: ['modern', 'casual'] },
    necklace:      { tags: [] }
  };

  function metaOf(item) {
    const base = SHAPE_META[item.shape] || { tags: item.type === 'traditional' ? ['traditional'] : [] };
    const o = item.culture || {};
    return { tags: o.tags || base.tags, covers: o.covers || item.covers || base.covers || [] };
  }

  // ---------- Luật ----------
  // Trả về { status, score, findings:[{id,severity,text,delta,fix?}], alert, occasionId }
  //   severity: block (cấm) · warn (cảnh báo) · info (lưu ý) · good (điểm cộng)
  //   fix: { slot, shapes:[...] } gợi ý thay món (client tự chọn món trong tủ) hoặc { slot, remove:true }
  function evaluateOutfit({ outfit = {}, occasionId = 'street' } = {}) {
    const worn = Object.values(outfit).filter(Boolean).map(item => {
      const m = metaOf(item);
      return { item, slot: item.category, tags: new Set(m.tags), covers: m.covers };
    });

    // Món che slot khác (áo choàng dài che quần) -> slot bị che không tính vào luật, giống cách avatar vẽ
    const hiddenSlots = new Set(worn.flatMap(w => w.covers));
    const visible = worn.filter(w => !hiddenSlots.has(w.slot));
    const withTag = (tag, slot) => visible.filter(w => w.tags.has(tag) && (!slot || w.slot === slot));
    const inSlots = (...slots) => visible.filter(w => slots.includes(w.slot));
    const names = list => list.map(w => `"${w.item.name}"`).join(', ');

    const findings = [];
    const add = (severity, id, text, delta = 0, fix) => findings.push({ id, severity, text, delta, ...(fix ? { fix } : {}) });

    const heritageTop = inSlots('top', 'outer').filter(w => w.tags.has('traditional'));
    const courtlyTop = withTag('courtly', 'top');
    const lowerRisk = visible.filter(w => w.slot === 'bottom' && (w.tags.has('exposed_legs') || w.tags.has('distressed')));
    const flashy = visible.filter(w => w.tags.has('flashy'));
    const modestBottomFix = { slot: 'bottom', shapes: ['suong', 'skirt_pleated'] };

    // --- Mọi hoàn cảnh: bộ đồ chưa đủ ---
    if (!inSlots('top', 'outer').length)
      add(occasionId === 'temple' ? 'block' : 'warn', 'missing_top', 'Chưa chọn áo – bộ đồ chưa hoàn chỉnh.', -30,
        { slot: 'top', shapes: ['aodai', 'giao_linh', 'tee'] });
    if (!visible.some(w => w.slot === 'bottom') && !hiddenSlots.has('bottom'))
      add(occasionId === 'temple' ? 'block' : 'warn', 'missing_bottom', 'Chưa chọn quần/váy – bộ đồ chưa hoàn chỉnh.', -30, modestBottomFix);

    // --- Mọi hoàn cảnh: Nhật Bình là phẩm phục cung đình ---
    if (courtlyTop.length && lowerRisk.length)
      add('warn', 'courtly_vs_casual', `${names(courtlyTop)} là phẩm phục cung đình, không nên phối với ${names(lowerRisk)}.`, -25, modestBottomFix);
    if (courtlyTop.length && flashy.length)
      add('warn', 'courtly_vs_flashy', `Phụ kiện/áo nổi bật (${names(flashy)}) làm mất vẻ trang nghiêm của ${names(courtlyTop)}.`, -10,
        { slot: flashy[0].slot, remove: true });

    // --- Theo hoàn cảnh ---
    if (occasionId === 'temple') {
      if (heritageTop.length && lowerRisk.length)
        add('block', 'temple_heritage_exposed',
          `Chốn tôn nghiêm: không mặc cổ phục (${names(heritageTop)}) cùng ${names(lowerRisk)} (quần/váy ngắn hoặc rách). Cần giữ thuần phong mỹ tục.`, -45, modestBottomFix);
      else if (lowerRisk.length)
        add('warn', 'temple_exposed', `Nơi thờ tự nên mặc kín đáo: tránh ${names(lowerRisk)} (ngắn/rách).`, -30, modestBottomFix);
      if (flashy.length && !courtlyTop.length)
        add('info', 'temple_flashy', `${names(flashy)} khá nổi bật – nên bỏ khi vào nơi trang nghiêm.`, -5, { slot: flashy[0].slot, remove: true });
      const modernHat = inSlots('hat').filter(w => !w.tags.has('traditional'));
      if (modernHat.length)
        add('info', 'temple_hat', 'Nên bỏ mũ khi vào chính điện / khu thờ tự.', 0, { slot: 'hat', remove: true });
      if (!lowerRisk.length && !flashy.length && heritageTop.length)
        add('good', 'temple_ok', 'Trang phục kín đáo, hợp không gian tôn nghiêm.', 10);
    }

    if (occasionId === 'street') {
      const modernMix = inSlots('bottom', 'shoes', 'outer').filter(w => w.tags.has('modern'));
      if (heritageTop.length && modernMix.length)
        add('good', 'street_remix', 'Remix cổ phục × đồ hiện đại – đúng tinh thần dạo phố.', 10);
    }

    if (occasionId === 'gala') {
      const formal = visible.filter(w => w.tags.has('formal'));
      if (lowerRisk.length)
        add('warn', 'gala_casual_bottom', `Dạ tiệc không hợp với ${names(lowerRisk)} (ngắn/rách).`, -20, modestBottomFix);
      const topW = inSlots('top');
      if (topW.length && topW.every(w => w.tags.has('casual')) && !inSlots('outer').some(w => w.tags.has('formal')))
        add('warn', 'gala_casual_top', 'Áo quá thường cho dạ tiệc – thử áo dài/ngũ thân hoặc khoác blazer.', -20,
          { slot: 'top', shapes: ['aodai', 'ngu_than'] });
      if (formal.length >= 2) add('good', 'gala_formal', 'Set đồ có nhiều món trang trọng, hợp dạ tiệc.', 10);
    }

    if (occasionId === 'culture') {
      if (!visible.some(w => w.tags.has('traditional')))
        add('info', 'culture_no_heritage', 'Sự kiện văn hóa nên có ít nhất 1 món Việt phục để hợp chủ đề.', -10,
          { slot: 'top', shapes: ['aodai', 'giao_linh', 'ngu_than'] });
      if (heritageTop.length && lowerRisk.length && !findings.some(f => f.id === 'courtly_vs_casual'))
        add('warn', 'culture_heritage_exposed', `Cổ phục (${names(heritageTop)}) không nên phối với ${names(lowerRisk)} (ngắn/rách) ở sự kiện văn hóa.`, -15, modestBottomFix);
      if (visible.filter(w => w.tags.has('traditional')).length >= 2)
        add('good', 'culture_heritage', 'Nhiều món Việt phục – nổi bật tinh thần sự kiện.', 10);
    }

    // --- Tính điểm & trạng thái ---
    let score = 80 + findings.reduce((s, f) => s + f.delta, 0);
    const hasBlock = findings.some(f => f.severity === 'block');
    const hasWarn = findings.some(f => f.severity === 'warn');
    score = Math.max(0, Math.min(100, score));
    if (hasBlock) score = Math.min(score, 45);
    const status = hasBlock ? 'canh_bao' : (score >= 85 && !hasWarn) ? 'tuyet_voi' : score >= 60 ? 'hop_le' : 'canh_bao';

    const alerts = findings.filter(f => f.severity === 'block' || f.severity === 'warn').map(f => f.text);
    return { occasionId, status, score, findings, alert: alerts.length ? alerts.join(' ') : null };
  }

  // ---------- Nhờ AI giải thích (không quyết định gì) ----------
  function explainUserText({ outfit = {}, occasionLabel = '', stats = {}, result }) {
    const lines = Object.entries(outfit).filter(([, it]) => it)
      .map(([slot, it]) => `- ${slot}: ${it.name} (${it.type || 'không rõ loại'}, màu ${it.color || it.defaultColor || 'mặc định'}, họa tiết ${it.pattern || 'không rõ'})`);
    const found = result.findings.map(f => `- [${f.severity}] ${f.text}`);
    return `Hoàn cảnh: ${occasionLabel || OCCASIONS[result.occasionId] || result.occasionId}\n` +
      `Các món đang mặc:\n${lines.join('\n') || '(chưa mặc món nào)'}\n\n` +
      `KẾT QUẢ KIỂM TRA TỰ ĐỘNG (đã chốt, không được thay đổi):\n- Trạng thái: ${result.status} · Điểm: ${result.score}/100\n${found.join('\n') || '- Không phát hiện vấn đề.'}\n\n` +
      `Vóc dáng: giới tính ${stats.gender || 'không xác định'}, cao ${stats.height || '?'}cm, nặng ${stats.weight || '?'}kg, dáng người "${stats.bodyShape || '?'}".`;
  }

  // explain: async ({systemText}) => object JSON  (do môi trường cung cấp: trình duyệt hoặc server)
  async function cultureCheck({ outfit, occasionId, occasionLabel, stats = {}, explain }) {
    const id = occasionId || inferOccasionId(occasionLabel);
    const result = evaluateOutfit({ outfit, occasionId: id });
    let ai = null, aiError = null;
    if (explain) {
      try { ai = await explain(explainUserText({ outfit, occasionLabel, stats, result })); }
      catch (e) { aiError = (e && e.message) || String(e); }
    }
    return {
      ...result,
      review: (ai && ai.cultural_review) || '',
      advice: (ai && ai.stylist_advice) || '',
      suggestions: ai && Array.isArray(ai.suggestions) ? ai.suggestions : [],
      aiError
    };
  }

  const api = { OCCASIONS, SHAPE_META, inferOccasionId, evaluateOutfit, explainUserText, cultureCheck };
  root.VietVibeCulture = api;
  if (typeof module !== 'undefined') module.exports = api;
})(typeof window !== 'undefined' ? window : globalThis);
