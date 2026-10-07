const getCurrentOutfitPayload = () => {
  const result = {};
  for (const slot of Object.keys(AppState.outfit)) {
    const item = AppState.outfit[slot] ? findItemById(AppState.outfit[slot]) : null;
    if (item) result[slot] = item;
  }
  return result;
};

document.getElementById('btn-ai-optimize').addEventListener('click', async () => {
  const prompt = document.getElementById('ai-prompt-input').value.trim();
  if (!prompt) return showToast('Vui lòng nhập mô tả món đồ.');
  const btn = document.getElementById('btn-ai-optimize');
  btn.disabled = true; btn.textContent = 'Gemini đang phân tích...'; setLoading(true);

  try {
    const data = await apiJson('/api/ai/optimize-prompt', { method:'POST', body:JSON.stringify({prompt}) });
    document.getElementById('ai-output').classList.remove('hidden');
    document.getElementById('ai-opt-text').textContent = data.optimizedPrompt || data.optimized_english_prompt || '';
    document.getElementById('ai-opt-color').textContent = `Màu gợi ý: ${data.colorHex || data.suggested_color || '—'}`;
    document.getElementById('ai-opt-note').textContent = `Ghi chú: ${data.designNotes || data.design_rationale || ''}`;
    showToast('Gemini đã tối ưu prompt.');
  } catch (error) {
    showToast(error.message);
  } finally {
    btn.disabled = false; btn.textContent = 'Tối ưu Prompt'; setLoading(false);
  }
});

document.getElementById('btn-ai-create').addEventListener('click', async () => {
  const prompt = document.getElementById('ai-prompt-input').value.trim();
  if (!prompt) return showToast('Vui lòng nhập mô tả món đồ.');
  const btn = document.getElementById('btn-ai-create');
  btn.disabled = true; btn.textContent = 'Gemini đang sáng tạo...'; setLoading(true);

  try {
    const data = await apiJson('/api/ai/create-item', { method:'POST', body:JSON.stringify({prompt}) });
    const items = JSON.parse(localStorage.getItem('vietvibe_ai_items') || '[]');
    items.push(data.item);
    localStorage.setItem('vietvibe_ai_items', JSON.stringify(items));

    document.getElementById('ai-created').classList.remove('hidden');
    document.getElementById('ai-created').textContent = `✨ Đã tạo "${data.item.name}" → nhóm ${data.item.category}. Bạn có thể tìm thấy món này trong Studio.`;
    AppState.outfit[data.item.category] = data.item.id;
    renderInventory(); renderAvatar();
    showToast('Đã tạo và mặc món AI.');
  } catch (error) {
    showToast(error.message);
  } finally {
    btn.disabled = false; btn.textContent = 'Tạo & thêm vào tủ'; setLoading(false);
  }
});

document.getElementById('btn-run-check').addEventListener('click', async () => {
  const btn = document.getElementById('btn-run-check');
  btn.disabled = true; btn.textContent = 'Gemini đang kiểm định...'; setLoading(true);

  try {
    const data = await apiJson('/api/ai/cultural-check', {
      method:'POST',
      body:JSON.stringify({
        outfit:getCurrentOutfitPayload(),
        occasion:document.getElementById('cultural-occasion').value,
        avatarStats:AppState.avatarStats
      })
    });

    document.getElementById('check-result').classList.remove('hidden');
    document.getElementById('check-score').textContent = data.score;
    document.getElementById('check-status').textContent =
      data.status === 'tuyet_voi' ? 'TUYỆT VỜI' : data.status === 'canh_bao' ? 'CẦN LƯU Ý' : 'HỢP LỆ';

    const alertBox = document.getElementById('check-alert');
    if (data.culturalAlert) {
      alertBox.textContent = `CẢNH BÁO: ${data.culturalAlert}`;
      alertBox.classList.remove('hidden');
    } else alertBox.classList.add('hidden');

    document.getElementById('check-review').innerHTML = `<b>Di sản:</b> ${escapeHtml(data.culturalReview || '')}`;
    document.getElementById('check-advice').innerHTML = `<b>Stylist:</b> ${escapeHtml(data.stylistAdvice || '')}`;

    const list = document.getElementById('check-suggestions');
    list.innerHTML = '';
    (data.suggestions || []).forEach(item => {
      const li = document.createElement('li'); li.textContent = item; list.appendChild(li);
    });
  } catch (error) {
    showToast(error.message);
  } finally {
    btn.disabled = false; btn.textContent = 'Phân tích set đồ đang mặc'; setLoading(false);
  }
});
