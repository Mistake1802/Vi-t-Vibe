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

  if (!items.length) {
    grid.innerHTML = '<div class="empty-state">Chưa có món nào ở bộ lọc này.</div>';
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
      <div class="item-type">${item.isAiGenerated ? '<span class="ai-badge">✨ AI</span>' : item.type === 'traditional' ? 'Truyền thống' : 'Hiện đại'}</div>
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

renderInventory();
renderAvatar();
