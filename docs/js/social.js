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
    like.addEventListener('click', async () => {
      try { like.querySelector('span').textContent = await Provider.likeLookbook(post.id); }
      catch (error) { showToast(error.message); }
    });

    meta.append(author, like);
    const title = document.createElement('h3');
    title.textContent = post.title;

    const tryButton = document.createElement('button');
    tryButton.className = 'btn outline';
    tryButton.type = 'button';
    tryButton.textContent = 'Mặc thử lên Avatar';
    tryButton.addEventListener('click', () => {
      AppState.outfit = normalizeOutfit(post.outfit);
      renderInventory(); renderAvatar(); switchTab('tab-studio');
      showToast('Đã áp dụng set đồ từ Lookbook.');
    });

    card.append(visual, meta, title, tryButton);
    feed.appendChild(card);
  });
};

const loadLookbooks = async () => {
  try {
    renderLookbookFeed(await Provider.listLookbooks());
  } catch (error) {
    document.getElementById('lookbook-feed').innerHTML = `<div class="panel">${escapeHtml(error.message)}</div>`;
  }
};

document.getElementById('btn-refresh-feed').addEventListener('click', loadLookbooks);

document.getElementById('btn-post-lookbook').addEventListener('click', async () => {
  const title = document.getElementById('lookbook-title').value.trim();
  if (!title) return showToast('Vui lòng nhập tên Lookbook.');
  if (!Object.values(AppState.outfit).some(Boolean)) return showToast('Bạn chưa mặc món đồ nào.');

  const btn = document.getElementById('btn-post-lookbook');
  btn.disabled = true;
  try {
    await Provider.postLookbook({ title, outfit: { ...AppState.outfit }, author: 'GenZ_Stylist' });
    document.getElementById('lookbook-title').value = '';
    showToast('Đăng Lookbook thành công.');
    switchTab('tab-social');
  } catch (error) {
    showToast(error.message);
  } finally { btn.disabled = false; }
});
