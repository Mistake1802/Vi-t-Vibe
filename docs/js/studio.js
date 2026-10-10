let currentSlotFilter = 'top';
let currentTypeFilter = 'all';

const renderInventory = () => {
  const grid = document.getElementById('inventory-grid');
  if (!grid) return;
  grid.innerHTML = '';

  const items = getAllItems().filter(item =>
    item.category === currentSlotFilter &&
    (currentTypeFilter === 'all' || (currentTypeFilter === 'ai' ? item.isAiGenerated : item.type === currentTypeFilter))
  );

  // Slot đang xem bị món nào đang mặc che mất? (vd. ảnh Áo Ngũ Thân đã vẽ liền quần)
  const style = AppState.avatarStyle;
  const cover = Object.values(AppState.outfit).map(id => id && findItemById(id)).filter(Boolean)
    .find(w => effectiveCovers(w, style).includes(currentSlotFilter));
  if (cover) {
    const note = document.createElement('div');
    note.className = 'notice';
    note.innerHTML = `Lớp này đang bị <b>${escapeHtml(cover.name)}</b> che (ảnh đã gồm sẵn). Bỏ món đó để mặc lại.`;
    grid.appendChild(note);
  }

  if (!items.length) {
    grid.insertAdjacentHTML('beforeend', '<div class="empty-state">Chưa có món nào ở bộ lọc này.</div>');
    return;
  }

  items.forEach(item => {
    const equipped = AppState.outfit[item.category] === item.id;
    const card = document.createElement('button');
    card.type = 'button';
    card.className = `item-card ${equipped ? 'equipped' : ''}`;
    card.innerHTML = `
      <div class="item-icon">${item.icon || '✨'}</div>
      <div class="item-name">${escapeHtml(item.name)}</div>
      <div class="item-type">${item.isAiGenerated ? '<span class="ai-badge">✨ AI</span>' : item.type === 'traditional' ? 'Truyền thống' : 'Hiện đại'}${usesImage(item, style) ? ' <span class="art-tag">🖼 ảnh</span>' : ''}</div>
    `;
    card.addEventListener('click', () => toggleEquip(item));
    grid.appendChild(card);
  });
};

const escapeHtml = value => String(value ?? '').replace(/[&<>"']/g, char => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[char]));

const toggleEquip = item => {
  AppState.outfit[item.category] = AppState.outfit[item.category] === item.id ? null : item.id;
  renderInventory();
  renderAvatar();
};

document.querySelectorAll('.flt-btn').forEach(btn => btn.addEventListener('click', () => {
  document.querySelectorAll('.flt-btn').forEach(b => b.classList.remove('active'));
  btn.classList.add('active');
  currentSlotFilter = btn.dataset.slot;
  renderInventory();
}));
document.querySelectorAll('.type-btn').forEach(btn => btn.addEventListener('click', () => {
  document.querySelectorAll('.type-btn').forEach(b => b.classList.remove('active'));
  btn.classList.add('active');
  currentTypeFilter = btn.dataset.type;
  renderInventory();
}));

// ---- Kiểu avatar: 'hybrid' (món có ảnh dùng ảnh, còn lại vector) ↔ 'vector' (tất cả vector) ----
// Thân nhân vật luôn là vector nên cân nặng / dáng / giới tính / màu da luôn có tác dụng ở cả hai kiểu.
const STYLE_HINT = {
  hybrid: 'Món có ảnh minh họa (🖼) dùng ảnh, món chưa có ảnh dùng hình vector. Mặc lẫn được.',
  vector: 'Tất cả món là hình vector đơn giản.'
};
const setAvatarStyle = style => {
  AppState.avatarStyle = style === 'vector' ? 'vector' : 'hybrid';
  try { localStorage.setItem('vietvibe_avatar_style', AppState.avatarStyle); } catch {}
  document.querySelectorAll('.style-btn').forEach(b => b.classList.toggle('active', b.dataset.style === AppState.avatarStyle));
  document.getElementById('style-hint').textContent = STYLE_HINT[AppState.avatarStyle];
  renderInventory();
  renderAvatar();
};
document.querySelectorAll('.style-btn').forEach(btn => btn.addEventListener('click', () => setAvatarStyle(btn.dataset.style)));
setAvatarStyle(AppState.avatarStyle);
