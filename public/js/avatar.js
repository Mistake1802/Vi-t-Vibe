const SVG_TEMPLATES = {
  body: color => `<svg viewBox="0 0 200 600" width="100%" height="100%">
    <circle cx="100" cy="72" r="28" fill="${color}"/>
    <rect x="88" y="95" width="24" height="35" rx="8" fill="${color}"/>
    <path d="M72 115 L128 115 L137 285 L63 285 Z" fill="${color}"/>
    <path d="M73 125 L38 280 L55 285 L90 160 Z" fill="${color}"/>
    <path d="M127 125 L162 280 L145 285 L110 160 Z" fill="${color}"/>
    <path d="M72 275 L98 275 L96 555 L76 555 Z" fill="${color}"/>
    <path d="M102 275 L128 275 L124 555 L104 555 Z" fill="${color}"/>
  </svg>`,
  top: color => `<svg viewBox="0 0 200 600" width="100%" height="100%"><path d="M61 111 Q100 126 139 111 L158 140 L177 318 L135 318 L126 160 L126 405 L74 405 L74 160 L65 318 L23 318 L42 140Z" fill="${color}" opacity=".96"/><path d="M91 116 L100 145 L109 116" fill="none" stroke="#ffffff66" stroke-width="4"/></svg>`,
  bottom: color => `<svg viewBox="0 0 200 600" width="100%" height="100%"><path d="M72 282 L128 282 L136 555 L104 555 L100 330 L96 555 L64 555Z" fill="${color}" opacity=".94"/></svg>`,
  shoes: color => `<svg viewBox="0 0 200 600" width="100%" height="100%"><path d="M72 528 L97 528 L97 566 L54 572 Q51 558 61 548Z" fill="${color}"/><path d="M103 528 L128 528 L146 560 Q142 573 104 572Z" fill="${color}"/></svg>`,
  hat: color => `<svg viewBox="0 0 200 600" width="100%" height="100%"><ellipse cx="100" cy="43" rx="39" ry="12" fill="${color}"/><rect x="69" y="35" width="62" height="14" rx="5" fill="${color}"/></svg>`,
  accessory: color => `<svg viewBox="0 0 200 600" width="100%" height="100%"><path d="M69 176 Q100 195 131 176" fill="none" stroke="${color}" stroke-width="7"/><circle cx="100" cy="193" r="7" fill="${color}"/></svg>`
};

const renderAvatar = () => {
  const canvas = document.getElementById('avatar-canvas');
  if (!canvas) return;
  canvas.innerHTML = '';
  const stage = document.createElement('div');
  stage.className = 'avatar-stage';

  const scale = Math.max(.78, Math.min(1.12, Number(AppState.avatarStats.height || 170) / 170));
  const widthFactor = { donghocat:1, chu_nhat:1.05, tam_giac:1.08, qua_tao:1.12 }[AppState.avatarStats.bodyShape] || 1;
  stage.style.transform = `scale(${scale * widthFactor / 1.04}, ${scale})`;

  const layers = [
    ['body',0,AppState.skinColor],
    ['bottom',10,null],['shoes',20,null],['top',30,null],['accessory',40,null],['hat',50,null]
  ];

  for (const [slot,z] of layers) {
    const layer = document.createElement('div');
    layer.className = 'svg-layer';
    layer.style.zIndex = z;
    if (slot === 'body') {
      layer.innerHTML = SVG_TEMPLATES.body(AppState.skinColor);
    } else {
      const id = AppState.outfit[slot];
      const item = id ? findItemById(id) : null;
      if (!item) continue;
      const color = item.color || item.defaultColor || '#ec4899';
      layer.innerHTML = SVG_TEMPLATES[slot](color);
      if (item.isAiGenerated) {
        layer.style.filter = 'drop-shadow(0 0 5px #f6c453)';
      }
    }
    stage.appendChild(layer);
  }
  canvas.appendChild(stage);
  const count = Object.values(AppState.outfit).filter(Boolean).length;
  const counter = document.getElementById('equipped-count');
  if (counter) counter.textContent = `${count} món`;
};
