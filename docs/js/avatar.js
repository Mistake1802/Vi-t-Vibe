// ===== VIỆT VIBE — Avatar v2 =====
// 1) Cơ thể sinh từ "anchor" (vai/ngực/eo/hông...) theo chiều cao, cân nặng, dáng, giới tính.
// 2) Mỗi món đồ có `shape` riêng (áo dài ≠ áo tấc ≠ blazer...) và được vẽ TỪ CHÍNH anchor của cơ thể
//    -> đồ tự ôm theo dáng người, không cần vẽ lại cho từng dáng.
// 3) Layer có luật: slot -> z mặc định, item có thể override `z` (vd. áo thun sơ vin = z thấp hơn quần)
//    hoặc `covers: ['bottom']` (áo choàng dài che luôn quần).
// Hàm lõi buildAvatarSvg() là hàm thuần (không đụng DOM) nên test được bằng Node.

(function (root) {
  const clamp = (v, a, b) => Math.min(b, Math.max(a, v));
  const f = n => +Number(n).toFixed(1);

  // Đầu phóng 1.15x quanh cổ để tỉ lệ đầu/thân dễ thương hơn; mũ & kính dùng cùng transform.
  const HEAD_T = 'translate(100 98) scale(1.15) translate(-100 -98)';
  const HEAD_SHAPES = new Set(['glasses']);

  // ---------- Layer ----------
  const DEFAULT_Z = { shoes: 10, bottom: 20, top: 30, outer: 40, accessory: 50, hat: 60 };
  const DEFAULT_SHAPE = { top: 'tee', outer: 'blazer', bottom: 'suong', shoes: 'sneaker', hat: 'beret', accessory: 'necklace' };

  // ---------- Màu ----------
  const shade = (hex, amt) => {
    const m = /^#?([0-9a-f]{6})$/i.exec(hex || '');
    if (!m) return hex || '#888888';
    const n = parseInt(m[1], 16);
    const ch = v => clamp(Math.round(amt > 0 ? v + (255 - v) * amt / 100 : v * (100 + amt) / 100), 0, 255);
    return '#' + [n >> 16, (n >> 8) & 255, n & 255].map(v => ch(v).toString(16).padStart(2, '0')).join('');
  };

  // ---------- Hình học ----------
  const pts = a => a.map(([x, y]) => `${f(x)} ${f(y)}`).join(' L');
  const poly = a => `M${pts(a)}Z`;
  const mirrorPts = left => left.map(([x, y]) => [200 - x, y]);
  // left: điểm nửa trái từ trên xuống -> polygon đối xứng
  const sym = left => poly(left.concat(mirrorPts(left).reverse()));
  const smooth = a => {
    const n = a.length, mid = (p, q) => [(p[0] + q[0]) / 2, (p[1] + q[1]) / 2];
    const s = mid(a[n - 1], a[0]);
    let d = `M${f(s[0])} ${f(s[1])}`;
    for (let i = 0; i < n; i++) {
      const p = a[i], m = mid(a[i], a[(i + 1) % n]);
      d += ` Q${f(p[0])} ${f(p[1])} ${f(m[0])} ${f(m[1])}`;
    }
    return d + 'Z';
  };
  // cắt polyline theo tỉ lệ độ dài t (0..1) – dùng cho tay áo dài/ngắn
  const along = (a, t) => {
    const segs = [];
    let total = 0;
    for (let i = 0; i < a.length - 1; i++) {
      const l = Math.hypot(a[i + 1][0] - a[i][0], a[i + 1][1] - a[i][1]);
      segs.push(l); total += l;
    }
    let left = total * t;
    const out = [a[0]];
    for (let i = 0; i < segs.length; i++) {
      if (left >= segs[i]) { out.push(a[i + 1]); left -= segs[i]; }
      else {
        const k = left / segs[i];
        out.push([a[i][0] + (a[i + 1][0] - a[i][0]) * k, a[i][1] + (a[i + 1][1] - a[i][1]) * k]);
        break;
      }
    }
    return out;
  };

  // ---------- Cơ thể ----------
  const BODY_SHAPES = {
    donghocat: { sh: 0, ch: 0, wa: 0, hi: 0 },
    chu_nhat:  { sh: 0, ch: 1, wa: 5, hi: -2 },
    tam_giac:  { sh: -3, ch: -2, wa: -1, hi: 6 },
    qua_tao:   { sh: 1, ch: 4, wa: 8, hi: -1 }
  };
  const GENDER_ADJ = {
    nam:     { sh: 5, ch: 2, wa: 1, hi: -4 },
    nu:      { sh: -3, ch: -1, wa: -4, hi: 3 },
    neutral: { sh: 0, ch: 0, wa: 0, hi: 0 }
  };

  function computeBody(stats = {}) {
    const h = clamp(Number(stats.height) || 170, 140, 200);
    const w = clamp(Number(stats.weight) || 60, 35, 150);
    const bmi = w / Math.pow(h / 100, 2);
    const k = clamp((bmi - 21) / 9, -0.4, 1);             // 0 = trung bình, >0 đầy đặn hơn
    const s = BODY_SHAPES[stats.bodyShape] || BODY_SHAPES.donghocat;
    const g = GENDER_ADJ[{ nam: 'nam', 'nữ': 'nu' }[stats.gender] || 'neutral'];
    const grow = (base, adj, mul) => Math.max(8, base + adj + k * mul);
    const B = {
      sx: grow(36, s.sh + g.sh, 4),    // nửa rộng vai
      cx: grow(32, s.ch + g.ch, 6),    // ngực
      wx: grow(25, s.wa + g.wa, 9),    // eo
      hx: grow(31, s.hi + g.hi, 7),    // hông
      aw: 14 + k * 3                   // độ dày tay
    };
    B.lc = B.hx * 0.52;                // tâm chân (lệch khỏi trục giữa) ở hông
    B.lk = B.lc - 0.5;                 // ở gối
    B.ak = B.lc - 1.5;                 // ở cổ chân
    B.tw = B.hx * 0.86;                // bề ngang đùi
    B.cw = B.tw * 0.62;                // bề ngang bắp chân
    B.arm = s => [[100 + s * (B.sx - 5), 128], [100 + s * (B.sx + 7), 214], [100 + s * (B.sx + 12), 298]];
    return B;
  }

  function bodySvg(B, skin) {
    const sd = shade(skin, -14);
    const leg = s => {
      const hip = [100 + s * B.lc, 284], knee = [100 + s * B.lk, 418], ank = [100 + s * B.ak, 548];
      const st = (a, b, w) => `<path d="M${f(a[0])} ${f(a[1])} L${f(b[0])} ${f(b[1])}" stroke="${skin}" stroke-width="${f(w)}" stroke-linecap="round" fill="none"/>`;
      return st(hip, knee, B.tw) + st(knee, ank, B.cw) +
        `<ellipse cx="${f(100 + s * (B.ak + 4))}" cy="565" rx="11" ry="6.5" fill="${skin}"/>`;
    };
    const arm = s => {
      const a = B.arm(s);
      return `<path d="M${pts(a)}" stroke="${skin}" stroke-width="${f(B.aw)}" stroke-linecap="round" stroke-linejoin="round" fill="none"/>` +
        `<circle cx="${f(a[2][0])}" cy="306" r="7.5" fill="${skin}"/>`;
    };
    const torso = [[88, 117], [100 - B.sx + 3, 121], [100 - B.sx, 128], [100 - B.cx, 166], [100 - B.wx, 218],
                   [100 - B.hx, 262], [100 - B.hx + 2, 288]];
    return leg(-1) + leg(1) +
      `<path d="${smooth(torso.concat(mirrorPts(torso).reverse()))}" fill="${skin}"/>` +
      `<rect x="90" y="93" width="20" height="30" rx="8" fill="${sd}"/>` +
      arm(-1) + arm(1) +
      `<g transform="${HEAD_T}">` +
      `<ellipse cx="75.5" cy="74" rx="4" ry="6" fill="${skin}"/><ellipse cx="124.5" cy="74" rx="4" ry="6" fill="${skin}"/>` +
      `<ellipse cx="100" cy="72" rx="25" ry="28" fill="${skin}"/>` +
      `<circle cx="91" cy="76" r="2.1" fill="#1f2937"/><circle cx="109" cy="76" r="2.1" fill="#1f2937"/>` +
      `<path d="M94 87 Q100 91.5 106 87" stroke="#9f1239" stroke-width="1.8" fill="none" stroke-linecap="round"/>` +
      `</g>`;
  }
  const hairSvg = () =>
    `<g transform="${HEAD_T}"><path d="M74.5 70 Q72 43 100 43 Q128 43 125.5 70 Q118 57 100 57 Q82 57 74.5 70Z" fill="#1f2937"/></g>`;

  // ---------- Bộ phận quần áo dùng chung ----------
  const sleeve = (B, s, t, width, c, dk) => {
    const d = 'M' + pts(along(B.arm(s), t));
    return `<path d="${d}" fill="none" stroke="${dk}" stroke-width="${f(width + 2)}" stroke-linecap="round" stroke-linejoin="round"/>` +
           `<path d="${d}" fill="none" stroke="${c}" stroke-width="${f(width)}" stroke-linecap="round" stroke-linejoin="round"/>`;
  };
  const sleeves = (B, t, pad, c, dk) => sleeve(B, -1, t, B.aw + pad, c, dk) + sleeve(B, 1, t, B.aw + pad, c, dk);
  const wideSleeves = (B, w, c, dk) => [-1, 1].map(s =>
    `<path d="${poly([[100 + s * (B.sx - 2), 122], [100 + s * (B.sx + 5 + w * 0.2), 160], [100 + s * (B.sx + 4 + w * 0.55), 214], [100 + s * (B.sx + w), 300], [100 + s * (B.sx - 7), 308], [100 + s * (B.cx - 8), 172]])}" fill="${c}" stroke="${dk}" stroke-width="1.4" stroke-linejoin="round"/>`
  ).join('');
  const bodice = (B, pad, hemY, flare, c, dk) => {
    const L = [[88, 116], [100 - B.sx - pad + 3, 121], [100 - B.cx - pad, 166], [100 - B.wx - pad, 218],
               [100 - B.hx - pad, 278], [100 - B.hx - pad - flare, hemY]];
    return `<path d="${sym(L)}" fill="${c}" stroke="${dk}" stroke-width="1.4" stroke-linejoin="round"/>`;
  };
  const line = (d, stroke, w) => `<path d="${d}" fill="none" stroke="${stroke}" stroke-width="${w}" stroke-linecap="round" stroke-linejoin="round"/>`;
  const standCollar = (c, dk) => `<rect x="88" y="99" width="24" height="18" rx="4" fill="${c}" stroke="${dk}" stroke-width="1.2"/>`;
  const crossCollar = (B, lt, dk) =>
    line(`M111 113 L100 160 L${f(100 - B.wx * 0.9)} 226`, dk, 3) +
    line(`M89 113 L100 160 L${f(100 + B.wx * 0.9)} 226`, lt, 3.4);
  const hemTrim = (B, y, spread, lt) => line(`M${f(100 - B.hx - spread)} ${y} L${f(100 + B.hx + spread)} ${y}`, lt, 3);
  const lotus = (x, y, s, col) => {
    let p = '';
    for (let a = -60; a <= 60; a += 30) p += `<ellipse cx="0" cy="-5" rx="2.6" ry="5.5" transform="rotate(${a})" fill="${col}"/>`;
    return `<g transform="translate(${f(x)} ${f(y)}) scale(${s})">${p}</g>`;
  };

  // ---------- Quần ----------
  const pantsPath = (B, o) => {
    const ky = o.kneeY || 418;
    const L = [[100 - B.wx - 2.5, 220], [100 - o.hip, 280], [100 - o.knee, ky], [100 - o.hem, o.hemY],
               [100 - o.inHem, o.hemY], [100 - o.inKnee, ky], [98, 296]];
    return poly(L.concat(mirrorPts(L).reverse()));
  };
  const pantsBase = (B, o, c, dk, lt, fly = true) =>
    `<path d="${pantsPath(B, o)}" fill="${c}" stroke="${dk}" stroke-width="1.4" stroke-linejoin="round"/>` +
    `<rect x="${f(100 - B.wx - 3)}" y="219" width="${f(2 * B.wx + 6)}" height="8" rx="2" fill="${dk}"/>` +
    (fly ? line('M100 227 L100 296', dk, 1.2) : '');

  // ---------- Thư viện món đồ ----------
  const G = {
    top: {
      tee: ({ B, c, dk, skin }) => sleeves(B, 0.4, 3, c, dk) + bodice(B, 2.5, 290, 0, c, dk) +
        `<path d="M87 116 Q100 137 113 116Z" fill="${skin}" stroke="${dk}" stroke-width="1.2"/>`,

      aodai: ({ B, c, dk, lt }) => {
        const hem = 508;
        const L = [[88, 116], [100 - B.sx + 1, 121], [100 - B.cx - 2, 166], [100 - B.wx - 1.5, 218],
                   [100 - B.hx - 2, 282], [100 - B.hx - 9, hem], [94, hem], [100, 300]];
        const px = 100 - (B.hx + 9) / 2;
        return sleeves(B, 0.92, 1.5, c, dk) +
          `<path d="${sym(L)}" fill="${c}" stroke="${dk}" stroke-width="1.4" stroke-linejoin="round"/>` +
          line(`M100 118 L${f(100 + B.cx - 1)} 168 L${f(100 + B.wx)} 222 L${f(100 + B.hx)} 286`, dk, 1.2) +
          standCollar(c, dk) +
          [[-1, 1], [1, 1]].map(([s]) => lotus(100 + s * (B.hx / 2 + 4), 380, 1.1, lt) + lotus(100 + s * (B.hx / 2 + 6), 450, 1.25, lt)).join('') +
          line(`M${f(100 - B.hx - 8)} ${hem - 6} L94 ${hem - 6}`, lt, 2.4) + line(`M${f(100 + B.hx + 8)} ${hem - 6} L106 ${hem - 6}`, lt, 2.4);
      },

      aotac: ({ B, c, dk, lt }) => {
        const hem = 470;
        return wideSleeves(B, 34, c, dk) + bodice(B, 3, hem, 10, c, dk) + crossCollar(B, lt, dk) +
          [-1, 1].map(s => line(`M${f(100 + s * (B.sx + 33))} 301 L${f(100 + s * (B.sx - 6))} 308`, lt, 3)).join('') +
          hemTrim(B, hem - 7, 11, lt);
      },

      ngu_than: ({ B, c, dk, lt }) => {
        const hem = 455;
        const flap = poly([[100, 118], [100 + B.cx, 172], [100 + B.wx + 1, 226], [100 + B.wx - 9, 226], [100 + 2, 170]]);
        return sleeves(B, 0.92, 3, c, dk) + bodice(B, 3, hem, 8, c, dk) +
          `<path d="${flap}" fill="${shade(c, 18)}" stroke="${dk}" stroke-width="1.1"/>` +
          line(`M100 118 L${f(100 + B.cx)} 172 L${f(100 + B.wx + 1)} 226`, dk, 1.4) +
          standCollar(c, dk) +
          [[104, 150], [108, 170], [111, 192]].map(([x, y]) => `<circle cx="${x}" cy="${y}" r="1.8" fill="${lt}"/>`).join('') +
          hemTrim(B, hem - 6, 9, lt);
      },

      nhat_binh: ({ B, c, dk, lt }) => {
        const hem = 470, gold = '#f6c453';
        const stripes = ['#22c55e', '#ef4444', '#facc15', '#f8fafc', '#111827'];
        const pw = 2 * B.sx - 8, px = 100 - pw / 2;
        return wideSleeves(B, 26, c, dk) + bodice(B, 3, hem, 10, c, dk) +
          `<rect x="${f(px)}" y="113" width="${f(pw)}" height="24" rx="3" fill="${gold}" stroke="${dk}" stroke-width="1.2"/>` +
          stripes.map((col, i) => `<rect x="${f(px + 4 + i * ((pw - 8) / 5))}" y="127" width="${f((pw - 8) / 5 - 1)}" height="7" fill="${col}"/>`).join('') +
          `<rect x="96" y="137" width="8" height="84" fill="${gold}" stroke="${dk}" stroke-width=".8"/>` +
          [-1, 1].map(s => line(`M${f(100 + s * (B.sx + 25))} 301 L${f(100 + s * (B.sx - 6))} 308`, gold, 3)).join('') +
          hemTrim(B, hem - 7, 11, gold);
      },

      giao_linh: ({ B, c, dk, lt }) => sleeves(B, 0.92, 3, c, dk) + bodice(B, 3, 335, 2, c, dk) +
        crossCollar(B, lt, dk) +
        `<rect x="${f(100 - B.wx - 4)}" y="212" width="${f(2 * B.wx + 8)}" height="9" rx="2" fill="${dk}"/>`
    },

    outer: {
      blazer: ({ B, c, dk, lt }) => {
        const pad = 5, hem = 302;
        const left = [[86, 116], [100 - B.sx - pad + 3, 121], [100 - B.cx - pad, 166], [100 - B.wx - pad, 218],
                      [100 - B.hx - pad, 282], [100 - B.hx - pad + 1, hem], [91, hem], [95, 230], [96, 216], [76, 152]];
        const lapel = [[86, 116], [76, 152], [96, 214], [99, 150]];
        return sleeves(B, 0.93, 6, c, dk) +
          [left, mirrorPts(left)].map(p => `<path d="${poly(p)}" fill="${c}" stroke="${dk}" stroke-width="1.4" stroke-linejoin="round"/>`).join('') +
          [lapel, mirrorPts(lapel)].map(p => `<path d="${poly(p)}" fill="${shade(c, 16)}" stroke="${dk}" stroke-width="1"/>`).join('') +
          `<circle cx="95" cy="244" r="1.9" fill="${lt}"/><circle cx="95" cy="262" r="1.9" fill="${lt}"/>`;
      },

      crop_jacket: ({ B, c, dk, lt }) => {
        const pad = 6, hem = 240;
        const left = [[88, 116], [100 - B.sx - pad + 3, 121], [100 - B.cx - pad - 1, 166], [100 - B.wx - pad - 1, 218],
                      [100 - B.wx - pad - 1, hem], [90, hem], [89, 116]];
        return sleeves(B, 0.93, 6, c, dk) +
          [left, mirrorPts(left)].map(p => `<path d="${poly(p)}" fill="${c}" stroke="${dk}" stroke-width="1.4" stroke-linejoin="round"/>`).join('') +
          line(`M89 118 L90 ${hem - 1}`, lt, 2.6) + line(`M111 118 L110 ${hem - 1}`, lt, 2.6) +
          line(`M${f(100 - B.wx - pad - 1)} ${hem - 4} L90 ${hem - 4}`, lt, 2) + line(`M${f(100 + B.wx + pad + 1)} ${hem - 4} L110 ${hem - 4}`, lt, 2);
      },

      cloak: ({ B, c, dk, lt }) => {
        const hem = 528;
        const L = [[86, 116], [100 - B.sx - 8 + 3, 121], [100 - B.cx - 9, 166], [100 - B.wx - 10, 218],
                   [100 - B.hx - 12, 282], [100 - B.hx - 24, hem], [98, hem]];
        return wideSleeves(B, 24, c, dk) +
          `<path d="${sym(L)}" fill="${c}" stroke="${dk}" stroke-width="1.4" stroke-linejoin="round"/>` +
          line(`M100 119 L100 ${hem}`, lt, 3) + hemTrim(B, hem - 6, 21, lt) +
          standCollar(c, dk) +
          [-1, 1].map(s => lotus(100 + s * (B.hx + 2), 400, 1.4, shade(c, 28))).join('');
      }
    },

    bottom: {
      suong: ({ B, c, dk, lt }) => pantsBase(B, { hip: B.hx + 3, knee: B.lc + 14, hem: B.lc + 16, inKnee: 2.5, inHem: 2.5, hemY: 546 }, c, dk, lt),

      baggy: ({ B, c, dk, lt }) => pantsBase(B, { hip: B.hx + 5, knee: B.lc + 18, hem: B.lc + 12, inKnee: 2.5, inHem: Math.max(2.5, B.lc - 12), hemY: 536 }, c, dk, lt) +
        [-1, 1].map(s => line(`M${f(100 + s * (B.hx + 4))} 292 L${f(100 + s * (B.lc + 14))} 300`, dk, 1.2)).join(''),

      jean: ({ B, c, dk, lt, skin }) => pantsBase(B, {
        hip: B.hx + 2.5, knee: B.lk + B.tw * 0.45 + 2, hem: B.ak + B.cw * 0.5 + 2,
        inKnee: Math.max(2.5, B.lk - B.tw * 0.45), inHem: Math.max(2.5, B.ak - B.cw * 0.5 - 2), hemY: 546
      }, c, dk, lt) +
        [-1, 1].map(s => {
          const x = 100 + s * B.lk;
          return `<rect x="${f(x - 6.5)}" y="411" width="13" height="7" rx="1.5" fill="${skin}"/>` +
                 line(`M${f(x - 6)} 413.5 L${f(x + 6)} 413.5`, '#e5e7eb', 1) + line(`M${f(x - 5)} 416 L${f(x + 5)} 416`, '#e5e7eb', 1);
        }).join('') +
        [-1, 1].map(s => line(`M${f(100 + s * 5)} 232 L${f(100 + s * 14)} 240`, lt, 1)).join(''),

      short: ({ B, c, dk, lt }) => pantsBase(B, {
        hip: B.hx + 3, knee: B.lk + B.tw / 2 + 3, hem: B.lk + B.tw / 2 + 3,
        inKnee: 2.5, inHem: 2.5, kneeY: 372, hemY: 372
      }, c, dk, lt),

      skirt_pleated: ({ B, c, dk, lt }) => {
        const hem = 470;
        const L = [[100 - B.wx - 2.5, 220], [100 - B.hx - 3, 280], [100 - B.hx - 20, hem]];
        let pleats = '';
        for (let i = -4; i <= 4; i++) pleats += line(`M${f(100 + i * (B.wx / 4.2))} 228 L${f(100 + i * ((B.hx + 18) / 4.2))} ${hem - 2}`, dk, 1);
        return `<path d="${sym(L)}" fill="${c}" stroke="${dk}" stroke-width="1.4" stroke-linejoin="round"/>` + pleats +
          `<rect x="${f(100 - B.wx - 3)}" y="219" width="${f(2 * B.wx + 6)}" height="8" rx="2" fill="${dk}"/>`;
      }
    },

    shoes: {
      sneaker: ({ B, c, dk, lt }) => [-1, 1].map(s => {
        const x0 = 100 + s * B.ak, X = d => f(x0 + s * d);
        const upper = [[-9, 536], [9, 536], [11, 552], [19, 560], [22, 570], [-11, 570], [-10, 552]].map(([dx, y]) => [x0 + s * dx, y]);
        const sole = [[-12, 567], [23, 567], [25, 577], [-12, 577]].map(([dx, y]) => [x0 + s * dx, y]);
        return `<path d="${poly(upper)}" fill="${c}" stroke="${dk}" stroke-width="1.4" stroke-linejoin="round"/>` +
          `<path d="${poly(sole)}" fill="${shade(c, c === '#ffffff' ? -12 : 25)}" stroke="${dk}" stroke-width="1.2" stroke-linejoin="round"/>` +
          line(`M${X(-5)} 541 L${X(5)} 544`, dk, 1.2) + line(`M${X(-5)} 546 L${X(6)} 549`, dk, 1.2) + line(`M${X(-6)} 551 L${X(8)} 554`, dk, 1.2);
      }).join(''),

      boots: ({ B, c, dk, lt }) => [-1, 1].map(s => {
        const x0 = 100 + s * B.ak;
        const upper = [[-10, 516], [10, 516], [11, 550], [18, 558], [21, 568], [-11, 568], [-11, 550]].map(([dx, y]) => [x0 + s * dx, y]);
        const sole = [[-12, 566], [22, 566], [24, 577], [-12, 577]].map(([dx, y]) => [x0 + s * dx, y]);
        return `<path d="${poly(upper)}" fill="${c}" stroke="${dk}" stroke-width="1.4" stroke-linejoin="round"/>` +
          `<path d="${poly(sole)}" fill="${shade(c, 30)}" stroke="${dk}" stroke-width="1.2"/>` +
          line(`M${f(x0 + s * -6)} 522 L${f(x0 + s * -6)} 556`, shade(c, 35), 1.4);
      }).join(''),

      guoc: ({ B, c, dk, lt }) => [-1, 1].map(s => {
        const x0 = 100 + s * B.ak, X = d => f(x0 + s * d);
        const plate = [[-10, 566], [20, 566], [20, 570], [-10, 570]].map(([dx, y]) => [x0 + s * dx, y]);
        return `<path d="${poly(plate)}" fill="${c}" stroke="${dk}" stroke-width="1.2"/>` +
          `<rect x="${f(Math.min(x0 + s * -10, x0 + s * -4))}" y="570" width="6" height="7" fill="${dk}"/>` +
          `<rect x="${f(Math.min(x0 + s * 14, x0 + s * 20))}" y="570" width="6" height="7" fill="${dk}"/>` +
          line(`M${X(-8)} 561 Q${X(3)} 548 ${X(15)} 561`, '#be123c', 4);
      }).join('')
    },

    hat: {
      khan_dong: ({ c, dk, lt }) =>
        `<path d="M70 56 Q69 21 100 19 Q131 21 130 56 Q100 63 70 56Z" fill="${c}" stroke="${dk}" stroke-width="1.4"/>` +
        line('M75 47 Q100 36 125 47', shade(c, 25), 2) + line('M73 38 Q100 27 127 38', shade(c, 25), 2) + line('M80 29 Q100 22 120 29', shade(c, 25), 2) +
        `<path d="M70 55 Q100 63 130 55 L130 50 Q100 58 70 50Z" fill="${dk}"/>`,

      quai_thao: ({ c, dk, lt }) =>
        line('M72 58 Q64 92 90 102', '#7f1d1d', 2.6) + line('M128 58 Q136 92 110 102', '#7f1d1d', 2.6) +
        `<ellipse cx="100" cy="52" rx="62" ry="15" fill="${c}" stroke="${dk}" stroke-width="1.4"/>` +
        `<path d="M74 51 Q100 20 126 51Z" fill="${shade(c, -8)}" stroke="${dk}" stroke-width="1.4"/>` +
        `<ellipse cx="100" cy="53" rx="60" ry="12" fill="none" stroke="${dk}" stroke-width=".8" opacity=".5"/>` +
        `<circle cx="90" cy="103" r="3.2" fill="#7f1d1d"/><circle cx="110" cy="103" r="3.2" fill="#7f1d1d"/>`,

      beret: ({ c, dk }) =>
        `<ellipse cx="103" cy="44" rx="34" ry="12" transform="rotate(-8 103 44)" fill="${c}" stroke="${dk}" stroke-width="1.4"/>` +
        `<circle cx="110" cy="33.5" r="3" fill="${dk}"/>`
    },

    accessory: {
      necklace: ({ c, dk }) => `<path d="M82 118 Q100 146 118 118" fill="none" stroke="${c}" stroke-width="3"/><circle cx="100" cy="140" r="5" fill="${c}" stroke="${dk}"/>`,

      glasses: ({ c, dk }) =>
        `<rect x="78" y="68" width="19" height="12" rx="4.5" fill="${c}" fill-opacity=".8" stroke="${dk}" stroke-width="1.6"/>` +
        `<rect x="103" y="68" width="19" height="12" rx="4.5" fill="${c}" fill-opacity=".8" stroke="${dk}" stroke-width="1.6"/>` +
        line('M97 73 L103 73', dk, 1.6) + line('M78 72 L72 70', dk, 1.6) + line('M122 72 L128 70', dk, 1.6),

      bracelet: ({ B, c, dk }) => {
        const w = B.arm(-1)[2];
        return `<ellipse cx="${f(w[0])}" cy="292" rx="${f(B.aw / 2 + 2.5)}" ry="4.2" fill="none" stroke="${dk}" stroke-width="5"/>` +
               `<ellipse cx="${f(w[0])}" cy="292" rx="${f(B.aw / 2 + 2.5)}" ry="4.2" fill="none" stroke="${c}" stroke-width="3.2"/>`;
      },

      fan: ({ B, c, dk }) => {
        const [x, y] = B.arm(1)[2];
        let ribs = '';
        for (let i = -3; i <= 3; i++) ribs += line(`M${f(x)} ${y + 2} L${f(x + i * 9)} ${y - 62 + Math.abs(i) * 5}`, dk, 0.9);
        return `<path d="M${f(x)} ${y + 2} L${f(x - 29)} ${y - 56} Q${f(x)} ${y - 76} ${f(x + 29)} ${y - 56}Z" fill="${c}" stroke="${dk}" stroke-width="1.3"/>` + ribs +
               `<circle cx="${f(x)}" cy="${y + 3}" r="7.5" fill="none"/>`;
      },

      tote: ({ B, c, dk, lt }) => {
        const bx = 100 - (B.sx + 14), top = 304;
        return line(`M${f(100 - B.sx + 6)} 122 Q${f(100 - B.sx - 16)} 205 ${f(bx - 8)} ${top}`, dk, 3) +
          line(`M${f(100 - B.sx + 6)} 122 Q${f(100 - B.sx - 12)} 205 ${f(bx + 8)} ${top}`, dk, 3) +
          `<rect x="${f(bx - 17)}" y="${top}" width="34" height="38" rx="4" fill="${c}" stroke="${dk}" stroke-width="1.4"/>` +
          `<path d="M${f(bx)} ${top + 9} L${f(bx + 6)} ${top + 19} L${f(bx)} ${top + 29} L${f(bx - 6)} ${top + 19}Z" fill="#be123c"/>` +
          `<circle cx="${f(bx)}" cy="${top + 19}" r="2" fill="#fcd34d"/>`;
      }
    }
  };

  // ---------- Kiểu avatar ----------
  //  'hybrid' (mặc định): thân VECTOR (chỉnh được cân nặng/dáng/giới tính/da). Món nào có `image` thì dùng ảnh
  //                       minh họa, món nào chưa có ảnh thì dùng hình vector. Mặc lẫn được với nhau.
  //  'vector'           : mọi món đều là hình vector (bỏ qua `image`).
  //
  // Ảnh layer được vẽ theo cơ thể trong art/reference/body.webp (khung 400x1200 = 200x600 đơn vị), tỉ lệ khác thân
  // vector. Nên ảnh được KÉO GIÃN THEO TỪNG DẢI NGANG để các mốc (cổ, vai, ngực, eo, hông, đầu gối, cổ chân) của ảnh
  // trùng với mốc của thân vector. Bề ngang mỗi dải co/giãn theo tỉ lệ (bề ngang thân vector / bề ngang trong ảnh)
  // nên kéo thanh cân nặng / chọn dáng người thì đồ dạng ảnh cũng "ôm" theo (xấp xỉ).
  const ART_REF = {
    // mốc của body tham chiếu (đo bằng tools/measure_body.py); hw = nửa bề ngang gồm cả tay (phần trên) / chân (phần dưới)
    y:  { neck: 118, shoulder: 142, chest: 175, waist: 225, hip: 300, crotch: 312, knee: 435, ankle: 515, foot: 565 },
    hw: { neck: 14,  shoulder: 50,  chest: 56,  waist: 64,  hip: 80,  crotch: 84,  knee: 38.5, ankle: 26, foot: 30 },
    shoeSep: 38.5, shoeCy: 547,        // khoảng cách tâm 2 chiếc giày & độ cao tâm giày trong ảnh
    head: { cy: 75, hw: 31 }           // tâm & nửa bề ngang đầu (cho mũ)
  };
  const ART_ORDER = ['neck', 'shoulder', 'chest', 'waist', 'hip', 'crotch', 'knee', 'ankle', 'foot'];
  const VEC_Y = { neck: 104, shoulder: 124, chest: 166, waist: 218, hip: 278, crotch: 292, knee: 418, ankle: 548, foot: 572 };
  const ART_STEP = 3;                  // độ cao mỗi dải (đơn vị nguồn): càng nhỏ mép càng mượt (bước nhảy < 0.5px) nhưng nhiều phần tử hơn
  const ART_EASE = 1.06;               // đồ rộng hơn thân vector một chút để da tay vector không thò ra ngoài tay áo bó

  // Nửa bề ngang (gồm tay) của thân vector tại độ cao y – tay vector là polyline B.arm()
  const armOuter = (B, y) => {
    const a = B.arm(1).map(([x, yy]) => [x - 100, yy]);
    const k = y <= a[0][1] ? a[0][0] : y >= a[2][1] ? a[2][0]
      : y < a[1][1] ? a[0][0] + (a[1][0] - a[0][0]) * (y - a[0][1]) / (a[1][1] - a[0][1])
      : a[1][0] + (a[2][0] - a[1][0]) * (y - a[1][1]) / (a[2][1] - a[1][1]);
    return k + B.aw / 2;
  };
  const vecHalfWidths = B => ({
    neck: 10, shoulder: armOuter(B, VEC_Y.shoulder), chest: armOuter(B, VEC_Y.chest), waist: armOuter(B, VEC_Y.waist),
    hip: armOuter(B, VEC_Y.hip), crotch: armOuter(B, VEC_Y.crotch),
    knee: B.lk + B.tw / 2, ankle: B.ak + B.cw / 2, foot: B.ak + B.cw / 2 + 3
  });

  // Nội suy tuyến tính theo các mốc (xs tăng dần)
  const piecewise = (x, xs, ys) => {
    if (x <= xs[0]) return ys[0] + (x - xs[0]);
    for (let i = 0; i < xs.length - 1; i++) {
      if (x <= xs[i + 1]) return ys[i] + (ys[i + 1] - ys[i]) * (x - xs[i]) / (xs[i + 1] - xs[i]);
    }
    return ys[ys.length - 1] + (x - xs[xs.length - 1]);
  };

  // Ảnh toàn thân (áo/quần/khoác/phụ kiện): cắt thành các dải ngang, mỗi dải kéo về đúng độ cao + bề ngang của thân vector
  function warpedBodyImage(src, B) {
    const hv = vecHalfWidths(B);
    const P = [0, ...ART_ORDER.map(n => ART_REF.y[n]), 600];
    const V = [0, ...ART_ORDER.map(n => VEC_Y[n]), 600];
    const ratios = ART_ORDER.map(n => (hv[n] / ART_REF.hw[n]) * (n === 'neck' || n === 'foot' ? 1 : ART_EASE));
    const R = [ratios[0], ...ratios, ratios[ratios.length - 1]];
    const OV = 0.7;                                   // chồng mép các dải để không lộ khe sáng
    let out = '';
    for (let a = 0; a < 600; a += ART_STEP) {
      const b = Math.min(600, a + ART_STEP);
      const v0 = piecewise(a, P, V), v1 = piecewise(b, P, V);
      const r = piecewise((a + b) / 2, P, R);
      const h = Math.max(0.01, v1 - v0);
      const srcH = (b - a) * (1 + OV / h);
      out += `<svg x="${f(100 * (1 - r))}" y="${f(v0)}" width="${f(200 * r)}" height="${f(h + OV)}" viewBox="0 ${a} 200 ${f(srcH)}" preserveAspectRatio="none">` +
             `<image href="${src}" x="0" y="0" width="200" height="600"/></svg>`;
    }
    return out;
  }

  // Giày: hai chiếc cách nhau ~ bằng hai bàn chân vector -> chỉ cần phóng/thu đều rồi dời tâm
  function footImage(src, B) {
    const s = (2 * (B.ak + 4)) / ART_REF.shoeSep;
    return `<g transform="translate(100 563) scale(${f(s)}) translate(-100 ${-ART_REF.shoeCy})"><image href="${src}" x="0" y="0" width="200" height="600"/></g>`;
  }
  // Mũ: đưa tâm đầu trong ảnh về tâm đầu vector (đã phóng 1.15x)
  function headImage(src) {
    const s = (25 * 1.15) / ART_REF.head.hw;
    const cy = 98 + (72 - 98) * 1.15;
    return `<g transform="translate(100 ${f(cy)}) scale(${f(s)}) translate(-100 ${-ART_REF.head.cy})"><image href="${src}" x="0" y="0" width="200" height="600"/></g>`;
  }
  const imageFor = (item, B) =>
    item.category === 'shoes' ? footImage(item.image, B) : item.category === 'hat' ? headImage(item.image) : warpedBodyImage(item.image, B);

  // Món này có đang dùng ảnh không (kiểu hybrid + có `image`)?
  const usesImage = (item, style) => style !== 'vector' && !!item.image;
  // Các slot bị món này che. Ảnh có thể đã vẽ sẵn cả phần khác (vd. ảnh Áo Ngũ Thân vẽ liền quần) -> dùng imageCovers.
  const effectiveCovers = (item, style) => (usesImage(item, style) && item.imageCovers) || item.covers || [];

  // ---------- Luật layer ----------
  // items: [{category, shape, color|defaultColor, z?, covers?, image?, imageCovers?}]
  function resolveLayers(items, style = 'hybrid') {
    const hidden = new Set();
    items.forEach(it => effectiveCovers(it, style).forEach(s => hidden.add(s)));
    return items
      .filter(it => !hidden.has(it.category))
      .map(it => ({ item: it, z: it.z != null ? it.z : (DEFAULT_Z[it.category] || 35) }))
      .sort((a, b) => a.z - b.z);
  }

  function buildAvatarSvg({ items = [], stats = {}, skin = '#fbcfe8', style = 'hybrid' } = {}) {
    const B = computeBody(stats);
    const parts = [{ z: 0, svg: bodySvg(B, skin) }, { z: 5, svg: hairSvg() }];
    resolveLayers(items, style).forEach(({ item, z }) => {
      if (usesImage(item, style)) {
        parts.push({ z, svg: `<g data-slot="${item.category}" data-id="${item.id || ''}" data-art="1">${imageFor(item, B)}</g>` });
        return;
      }
      const lib = G[item.category];
      if (!lib) return;
      const fn = lib[item.shape] || lib[DEFAULT_SHAPE[item.category]];
      const c = item.color || item.defaultColor || '#ec4899';
      const ctx = { B, c, dk: shade(c, -32), lt: shade(c, 28), skin, item };
      const glow = item.isAiGenerated ? ' filter="url(#aiGlow)"' : '';
      const head = item.category === 'hat' || HEAD_SHAPES.has(item.shape || DEFAULT_SHAPE[item.category]);
      const inner = head ? `<g transform="${HEAD_T}">${fn(ctx)}</g>` : fn(ctx);
      parts.push({ z, svg: `<g data-slot="${item.category}" data-id="${item.id || ''}"${glow}>${inner}</g>` });
    });
    parts.sort((a, b) => a.z - b.z);
    return `<svg viewBox="0 0 200 600" width="100%" height="100%" xmlns="http://www.w3.org/2000/svg" data-style="${style === 'vector' ? 'vector' : 'hybrid'}">` +
      `<defs><filter id="aiGlow" x="-20%" y="-20%" width="140%" height="140%"><feDropShadow dx="0" dy="0" stdDeviation="2.5" flood-color="#f6c453"/></filter></defs>` +
      parts.map(p => p.svg).join('') + `</svg>`;
  }

  // ---------- Gắn vào trình duyệt ----------
  function renderAvatar() {
    const canvas = document.getElementById('avatar-canvas');
    if (!canvas) return;
    const items = Object.values(AppState.outfit).map(id => id && findItemById(id)).filter(Boolean);
    const stats = AppState.avatarStats;
    const scale = clamp(Number(stats.height || 170) / 170, 0.82, 1.08);
    canvas.innerHTML = `<div class="avatar-stage" style="transform:scale(${scale})">` +
      buildAvatarSvg({ items, stats, skin: AppState.skinColor, style: AppState.avatarStyle }) + `</div>`;
    const counter = document.getElementById('equipped-count');
    if (counter) counter.textContent = `${items.length} món`;
  }

  root.buildAvatarSvg = buildAvatarSvg;
  root.computeBody = computeBody;
  root.resolveLayers = resolveLayers;
  root.usesImage = usesImage;
  root.effectiveCovers = effectiveCovers;
  root.renderAvatar = renderAvatar;
  if (typeof module !== 'undefined') module.exports = { buildAvatarSvg, computeBody, resolveLayers, usesImage, effectiveCovers, ART_REF };
})(typeof window !== 'undefined' ? window : globalThis);
