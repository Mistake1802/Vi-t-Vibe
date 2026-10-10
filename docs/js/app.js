// Chế độ chạy: 'static' (Pages) hoặc 'server' (server.js ghi đè js/config.js). Phần tử có data-only="..." chỉ giữ lại ở đúng chế độ.
const MODE = window.VIETVIBE_MODE === 'server' ? 'server' : 'static';
document.documentElement.dataset.mode = MODE;
document.querySelectorAll('[data-only]').forEach(el => { if (el.dataset.only !== MODE) el.remove(); });

const AppState = {
  outfit: { top:null, outer:null, bottom:null, shoes:null, hat:null, accessory:null },
  avatarStats: { gender:'không xác định', height:170, weight:60, bodyShape:'donghocat' },
  skinColor:'#fbcfe8',
  // 'hybrid' = thân vector + đồ dùng ảnh nếu có · 'vector' = tất cả vector. Nhớ lựa chọn (giá trị cũ 'param' = 'vector').
  avatarStyle: (() => { try { return ['vector', 'param'].includes(localStorage.getItem('vietvibe_avatar_style')) ? 'vector' : 'hybrid'; } catch { return 'hybrid'; } })(),
  activeTab:'tab-studio'
};

const showToast = message => {
  const toast = document.getElementById('toast');
  toast.textContent = message;
  toast.classList.remove('hidden');
  clearTimeout(window.__toastTimer);
  window.__toastTimer = setTimeout(() => toast.classList.add('hidden'), 3200);
};

const setLoading = visible => document.getElementById('loading-overlay').classList.toggle('hidden', !visible);

const switchTab = id => {
  document.querySelectorAll('.tab-btn').forEach(btn => btn.classList.toggle('active', btn.dataset.tab === id));
  document.querySelectorAll('.tab-content').forEach(section => section.classList.toggle('hidden', section.id !== id));
  AppState.activeTab = id;
  if (id === 'tab-social') loadLookbooks();
};

document.querySelectorAll('.tab-btn').forEach(btn => btn.addEventListener('click', () => switchTab(btn.dataset.tab)));

document.getElementById('skin-color').addEventListener('input', e => {
  AppState.skinColor = e.target.value;
  renderAvatar();
});
document.getElementById('avatar-height').addEventListener('input', e => {
  AppState.avatarStats.height = Number(e.target.value) || 170;
  renderAvatar();
});
document.getElementById('avatar-weight').addEventListener('input', e => {
  AppState.avatarStats.weight = Number(e.target.value) || 60;
  renderAvatar();
});
document.getElementById('avatar-gender').addEventListener('change', e => {
  AppState.avatarStats.gender = e.target.value;
  renderAvatar();
});
document.getElementById('body-shape').addEventListener('change', e => {
  AppState.avatarStats.bodyShape = e.target.value;
  renderAvatar();
});

document.getElementById('btn-open-check').addEventListener('click', () => switchTab('tab-check'));
