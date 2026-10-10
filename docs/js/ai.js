// ===== AI Creator + Kiểm định văn hóa (UI dùng chung cho cả 2 chế độ) =====
// Mọi lời gọi AI đi qua `Provider` (providers/static.js hoặc providers/server.js).
Provider.init();

// Set đồ gửi đi kiểm định = đúng những gì NGƯỜI DÙNG ĐANG THẤY: `covers` là slot bị che thực tế
// (ảnh Áo Ngũ Thân vẽ liền quần -> quần không bị luật soi; ở kiểu "Chỉ vector" thì khác).
const getCurrentOutfitPayload = () => {
  const style = AppState.avatarStyle;
  const result = {};
  for (const slot of Object.keys(AppState.outfit)) {
    const item = AppState.outfit[slot] ? findItemById(AppState.outfit[slot]) : null;
    if (item) result[slot] = { ...item, covers: effectiveCovers(item, style) };
  }
  return result;
};

// Chạy 1 tác vụ AI với trạng thái nút/loading/toast thống nhất
async function runAi(btnId, busyText, idleText, task) {
  const btn = document.getElementById(btnId);
  btn.disabled = true; btn.textContent = busyText; setLoading(true);
  try { await task(); }
  catch (error) { showToast(error.message); }
  finally { btn.disabled = false; btn.textContent = idleText; setLoading(false); }
}

const readPrompt = () => {
  const prompt = document.getElementById('ai-prompt-input').value.trim();
  if (!prompt) showToast('Vui lòng nhập mô tả món đồ.');
  return prompt;
};

// ---- Tối ưu prompt ----
document.getElementById('btn-ai-optimize').addEventListener('click', () => {
  const prompt = readPrompt();
  if (!prompt) return;
  runAi('btn-ai-optimize', 'Gemini đang phân tích...', 'Tối ưu Prompt', async () => {
    const r = await Provider.optimizePrompt(prompt);
    document.getElementById('ai-output').classList.remove('hidden');
    document.getElementById('ai-opt-text').textContent = r.text;
    document.getElementById('ai-opt-color').textContent = `Màu gợi ý: ${r.colorHex || '—'}`;
    document.getElementById('ai-opt-note').textContent = `Ghi chú: ${r.notes}`;
    showToast('Gemini đã tối ưu prompt.');
  });
});

// ---- Tạo món đồ AI ----
document.getElementById('btn-ai-create').addEventListener('click', () => {
  const prompt = readPrompt();
  if (!prompt) return;
  runAi('btn-ai-create', 'Gemini đang sáng tạo...', 'Tạo & thêm vào tủ', async () => {
    const item = await Provider.createItem(prompt);
    // Hình vẽ (shape) chọn ở client để cả 2 chế độ dùng chung 1 bộ luật (items.js)
    item.shape = item.shape || detectShape(prompt, item.category);
    const items = JSON.parse(localStorage.getItem('vietvibe_ai_items') || '[]');
    items.push(item);
    localStorage.setItem('vietvibe_ai_items', JSON.stringify(items));

    const box = document.getElementById('ai-created');
    box.classList.remove('hidden');
    box.textContent = `✨ Đã tạo "${item.name}" → nhóm ${item.category}. Món này có trong Tủ đồ (lọc ✨ AI).`;
    AppState.outfit[item.category] = item.id;
    renderInventory(); renderAvatar();
    showToast('Đã tạo và mặc món AI.');
  });
});

// ---- Kiểm định văn hóa ----
// Luật (culture.js) quyết định trạng thái + điểm + cảnh báo; AI chỉ giải thích thêm. Xem providers/*.culturalCheck.
const SEVERITY_ICON = { block: '⛔', warn: '⚠️', info: 'ℹ️', good: '✅' };

// fix = { slot, shapes:[...] } (thay món) hoặc { slot, remove:true } -> món cụ thể trong tủ để áp dụng
function resolveFix(fix) {
  if (fix.remove) {
    const cur = AppState.outfit[fix.slot] && findItemById(AppState.outfit[fix.slot]);
    return cur ? { item: null, slot: fix.slot, label: `Bỏ ${cur.name}` } : null;
  }
  const all = getAllItems();
  for (const shape of fix.shapes || []) {
    const item = all.find(i => i.category === fix.slot && i.shape === shape);
    if (item) return { item, slot: fix.slot, label: `Dùng ${item.name}` };
  }
  return null;
}

function applyFix(resolved) {
  AppState.outfit[resolved.slot] = resolved.item ? resolved.item.id : null;
  renderInventory(); renderAvatar();
  runCheck();      // chạy lại để thấy kết quả sau khi sửa
}

function renderFindings(findings) {
  const box = document.getElementById('check-findings');
  box.innerHTML = '';
  findings.forEach(f => {
    const row = document.createElement('div');
    row.className = `finding ${f.severity}`;
    const icon = document.createElement('span'); icon.textContent = SEVERITY_ICON[f.severity] || '•';
    const text = document.createElement('span'); text.className = 'f-text'; text.textContent = f.text;
    row.append(icon, text);
    const resolved = f.fix && resolveFix(f.fix);
    if (resolved) {
      const btn = document.createElement('button');
      btn.type = 'button'; btn.className = 'btn outline f-fix'; btn.textContent = resolved.label;
      btn.addEventListener('click', () => applyFix(resolved));
      row.appendChild(btn);
    }
    box.appendChild(row);
  });
}

// Phần "luật": trạng thái, điểm, cảnh báo, danh sách phát hiện
function renderCheckResult(r) {
  document.getElementById('check-result').classList.remove('hidden');
  document.getElementById('check-score').textContent = r.score;
  document.getElementById('check-status').textContent =
    r.status === 'tuyet_voi' ? 'TUYỆT VỜI' : r.status === 'canh_bao' ? 'CẦN LƯU Ý' : 'HỢP LỆ';
  const alertBox = document.getElementById('check-alert');
  const issues = (r.findings || []).filter(f => f.severity === 'block' || f.severity === 'warn').length;
  if (r.alert) {
    // đã có danh sách chi tiết bên dưới -> chỉ tóm tắt, không lặp lại nguyên văn
    alertBox.textContent = issues ? `CẢNH BÁO: có ${issues} điểm cần xem lại – chi tiết và cách sửa ở bên dưới.` : `CẢNH BÁO: ${r.alert}`;
    alertBox.classList.remove('hidden');
  } else alertBox.classList.add('hidden');
  renderFindings(r.findings || []);
}

// Phần "AI giải thích": di sản, lời khuyên theo vóc dáng, gợi ý
function renderExplanation(r) {
  const review = document.getElementById('check-review');
  const advice = document.getElementById('check-advice');
  const list = document.getElementById('check-suggestions');
  list.innerHTML = '';
  if (r.aiError) {
    // AI không giải thích được (không có key / hết quota / mạng) – kết quả luật vẫn đầy đủ
    review.innerHTML = `<span class="ai-note">Kết quả trên do bộ luật kiểm tra tự động. Phần giải thích của AI chưa có: ${escapeHtml(r.aiError)}</span>`;
    advice.innerHTML = '';
    return;
  }
  review.innerHTML = r.review ? `<b>Di sản:</b> ${escapeHtml(r.review)}` : '';
  advice.innerHTML = r.advice ? `<b>Stylist:</b> ${escapeHtml(r.advice)}` : '';
  (r.suggestions || []).forEach(t => { const li = document.createElement('li'); li.textContent = t; list.appendChild(li); });
}

// Luật hiện NGAY (chạy cục bộ, không chờ mạng); AI giải thích điền sau. `checkSeq` bỏ qua phản hồi AI đã cũ
// (vd. người dùng bấm "Dùng Quần Suông" khi AI của lần trước chưa xong).
let checkSeq = 0;
async function runCheck() {
  const seq = ++checkSeq;
  const select = document.getElementById('cultural-occasion');
  const input = {
    outfit: getCurrentOutfitPayload(),
    occasionId: select.selectedOptions[0].dataset.occasion,
    occasionLabel: select.value,
    stats: AppState.avatarStats
  };
  const btn = document.getElementById('btn-run-check');

  renderCheckResult(VietVibeCulture.evaluateOutfit({ outfit: input.outfit, occasionId: input.occasionId }));
  document.getElementById('check-review').innerHTML = '<span class="ai-note">AI đang viết phần giải thích…</span>';
  document.getElementById('check-advice').innerHTML = '';
  document.getElementById('check-suggestions').innerHTML = '';
  btn.disabled = true; btn.textContent = 'AI đang giải thích...';

  try {
    const r = await Provider.culturalCheck(input);
    if (seq !== checkSeq) return;
    renderCheckResult(r);          // kết quả chính thức từ provider (cùng bộ luật nên khớp bản hiển thị ngay)
    renderExplanation(r);
  } catch (error) {
    if (seq === checkSeq) renderExplanation({ aiError: error.message });
  } finally {
    if (seq === checkSeq) { btn.disabled = false; btn.textContent = 'Phân tích set đồ đang mặc'; }
  }
}
document.getElementById('btn-run-check').addEventListener('click', runCheck);
