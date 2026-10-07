const AppState = {
  outfit: { top:null, bottom:null, shoes:null, hat:null, accessory:null },
  avatarStats: { gender:'không xác định', height:170, weight:60, bodyShape:'donghocat' },
  skinColor:'#fbcfe8',
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
document.getElementById('avatar-weight').addEventListener('input', e => AppState.avatarStats.weight = Number(e.target.value) || 60);
document.getElementById('body-shape').addEventListener('change', e => {
  AppState.avatarStats.bodyShape = e.target.value;
  renderAvatar();
});

document.getElementById('btn-open-check').addEventListener('click', () => switchTab('tab-check'));

window.apiJson = async (url, options = {}) => {
  const response = await fetch(url, {
    ...options,
    headers: { 'Content-Type':'application/json', ...(options.headers || {}) }
  });
  let data = {};
  try { data = await response.json(); } catch {}
  if (!response.ok) throw new Error(data.error || `Yêu cầu thất bại (${response.status}).`);
  return data;
};
