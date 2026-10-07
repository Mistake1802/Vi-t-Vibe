// ===== VIỆT VIBE — Lookbook cộng đồng (bản tĩnh) =====
// Không có backend nên bài đăng + like lưu trong localStorage của trình duyệt.
// Lần đầu mở web sẽ nạp 3 bài mẫu.

const LB_KEY = 'vietvibe_lookbooks';

const SEED_LOOKBOOKS = [
  {
    id: 'lb_1',
    author: 'GenZ_Stylist',
    title: 'Cháy phố với Áo Tấc & Baggy',
    likes: 12,
    outfit: { top: 'top_aotac_1', bottom: 'bot_baggy_1', shoes: 'shoe_sneaker_1', hat: null, accessory: 'acc_cyber_1' },
    timestamp: Date.now() - 2 * 86400000
  },
  {
    id: 'lb_2',
    author: 'Heritage_Lover',
    title: 'Dạ tiệc Nhật Bình',
    likes: 45,
    outfit: { top: 'top_nhatbinh_1', bottom: 'bot_suonglua_1', shoes: 'shoe_guoc_1', hat: 'hat_khandong_1', accessory: 'acc_vongngoc_1' },
    timestamp: Date.now() - 86400000
  },
  {
    id: 'lb_3',
    author: 'VietVibe_Studio',
    title: 'Ngũ Thân Cyber đi cà phê',
    likes: 28,
    outfit: { top: 'top_nguthan_1', bottom: 'bot_jeanrach_1', shoes: 'shoe_boots_1', hat: 'hat_beret_1', accessory: 'acc_cyber_1' },
    timestamp: Date.now() - 6 * 3600000
  }
];

function getLookbooks() {
  try {
    const raw = localStorage.getItem(LB_KEY);
    if (raw) {
      const data = JSON.parse(raw);
      if (Array.isArray(data)) return data;
    }
  } catch {}
  const seed = JSON.parse(JSON.stringify(SEED_LOOKBOOKS));
  localStorage.setItem(LB_KEY, JSON.stringify(seed));
  return seed;
}

function saveLookbooks(lookbooks) {
  try { localStorage.setItem(LB_KEY, JSON.stringify(lookbooks)); } catch {}
}

const renderLookbookFeed = lookbooks => {
  const feed = document.getElementById('lookbook-feed');
  feed.innerHTML = '';

  if (!lookbooks.length) {
    feed.innerHTML = '<div class="panel">Chưa có Lookbook nào. Hãy là người đầu tiên đăng set đồ.</div>';
    return;
  }

  lookbooks.forEach(post => {
    const icons = Object.values(post.outfit || {})
      .map(value => typeof value === 'string' ? findItemById(value)?.icon : value?.icon)
      .filter(Boolean).join(' ');

    const card = document.createElement('article');
    card.className = 'post-card';

    const visual = document.createElement('div');
    visual.className = 'post-visual';
    visual.textContent = icons || '✦';

    const meta = document.createElement('div');
    meta.className = 'post-meta';

    const author = document.createElement('span');
    author.className = 'post-author';
    author.textContent = `@${post.author || 'Ẩn danh'}`;

    const like = document.createElement('button');
    like.className = 'like-btn';
    like.type = 'button';
    like.innerHTML = `♥ <span>${Number(post.likes) || 0}</span>`;
    like.addEventListener('click', () => {
      const all = getLookbooks();
      const target = all.find(p => p.id === post.id);
      if (!target) return;
      target.likes = (Number(target.likes) || 0) + 1;
      saveLookbooks(all);
      like.querySelector('span').textContent = target.likes;
    });

    meta.append(author, like);
    const title = document.createElement('h3');
    title.textContent = post.title;

    const tryButton = document.createElement('button');
    tryButton.className = 'btn outline';
    tryButton.type = 'button';
    tryButton.textContent = 'Mặc thử lên Avatar';
    tryButton.addEventListener('click', () => {
      AppState.outfit = { top: null, bottom: null, shoes: null, hat: null, accessory: null, ...(post.outfit || {}) };
      renderInventory(); renderAvatar(); switchTab('tab-studio');
      showToast('Đã áp dụng set đồ từ Lookbook.');
    });

    card.append(visual, meta, title, tryButton);
    feed.appendChild(card);
  });
};

const loadLookbooks = () => {
  renderLookbookFeed(getLookbooks());
};

document.getElementById('btn-refresh-feed').addEventListener('click', loadLookbooks);

document.getElementById('btn-post-lookbook').addEventListener('click', () => {
  const title = document.getElementById('lookbook-title').value.trim();
  if (!title) return showToast('Vui lòng nhập tên Lookbook.');
  if (!Object.values(AppState.outfit).some(Boolean)) return showToast('Bạn chưa mặc món đồ nào.');

  const btn = document.getElementById('btn-post-lookbook');
  btn.disabled = true;
  try {
    const all = getLookbooks();
    all.unshift({
      id: 'lb_' + Date.now(),
      author: 'GenZ_Stylist',
      title,
      likes: 0,
      outfit: { ...AppState.outfit },
      timestamp: Date.now()
    });
    saveLookbooks(all);
    document.getElementById('lookbook-title').value = '';
    showToast('Đăng Lookbook thành công.');
    switchTab('tab-social');
  } finally { btn.disabled = false; }
});
