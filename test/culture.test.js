// Chạy: npm test   (Node 18+, không cần cài thêm gì)
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('fs');
const path = require('path');
const vm = require('vm');

const { evaluateOutfit, cultureCheck, inferOccasionId, SHAPE_META } = require('../docs/js/culture.js');
const { buildAvatarSvg } = require('../docs/js/avatar.js');

// Nạp CATALOGUE thật từ items.js (file của trình duyệt) để test dùng đúng dữ liệu đang chạy
const CATALOGUE = vm.runInNewContext(
  fs.readFileSync(path.join(__dirname, '../docs/js/items.js'), 'utf8') + '\nCATALOGUE',
  { localStorage: { getItem: () => null } }
);
const byId = id => CATALOGUE.find(i => i.id === id);
// outfit({ top:'top_aodai_1', bottom:'bot_short_1' }) -> { top:<item>, bottom:<item> }
const outfit = ids => Object.fromEntries(Object.entries(ids).map(([slot, id]) => [slot, byId(id)]));
const ids = r => r.findings.map(f => f.id);

test('chùa + cổ phục + short => BLOCK, cảnh báo, điểm <= 45', () => {
  const r = evaluateOutfit({ occasionId: 'temple', outfit: outfit({ top: 'top_aodai_1', bottom: 'bot_short_1', shoes: 'shoe_guoc_1' }) });
  assert.ok(ids(r).includes('temple_heritage_exposed'));
  assert.equal(r.status, 'canh_bao');
  assert.ok(r.score <= 45);
  assert.ok(r.alert.includes('Quần Short Đen'));
});

test('chùa + cổ phục + jean rách => BLOCK', () => {
  const r = evaluateOutfit({ occasionId: 'temple', outfit: outfit({ top: 'top_aotac_1', bottom: 'bot_jeanrach_1' }) });
  assert.ok(ids(r).includes('temple_heritage_exposed'));
  assert.equal(r.status, 'canh_bao');
});

test('chùa + áo dài + quần suông + guốc => tuyệt vời, không cảnh báo', () => {
  const r = evaluateOutfit({ occasionId: 'temple', outfit: outfit({ top: 'top_aodai_1', bottom: 'bot_suonglua_1', shoes: 'shoe_guoc_1' }) });
  assert.equal(r.status, 'tuyet_voi');
  assert.equal(r.alert, null);
  assert.ok(ids(r).includes('temple_ok'));
});

test('chùa + áo thun + short (không cổ phục) => cảnh báo nhưng không phải luật cổ phục', () => {
  const r = evaluateOutfit({ occasionId: 'temple', outfit: outfit({ top: 'top_tee_1', bottom: 'bot_short_1' }) });
  assert.ok(ids(r).includes('temple_exposed'));
  assert.ok(!ids(r).includes('temple_heritage_exposed'));
  assert.equal(r.status, 'canh_bao');   // 80 - 30 = 50 < 60
});

test('áo choàng dài che quần: short bên trong không bị tính (khớp cách avatar vẽ)', () => {
  const r = evaluateOutfit({ occasionId: 'temple', outfit: outfit({ top: 'top_aodai_1', outer: 'outer_cloak_1', bottom: 'bot_short_1' }) });
  assert.ok(!ids(r).includes('temple_heritage_exposed'));
  assert.ok(!ids(r).includes('missing_bottom'));
  assert.notEqual(r.status, 'canh_bao');
});

test('Nhật Bình + short (dạo phố) => cảnh báo phẩm phục cung đình', () => {
  const r = evaluateOutfit({ occasionId: 'street', outfit: outfit({ top: 'top_nhatbinh_1', bottom: 'bot_short_1' }) });
  assert.ok(ids(r).includes('courtly_vs_casual'));
});

test('Nhật Bình + crop jacket neon => cảnh báo phụ kiện/áo nổi bật, fix là bỏ món', () => {
  const r = evaluateOutfit({ occasionId: 'street', outfit: outfit({ top: 'top_nhatbinh_1', outer: 'top_cyber_1', bottom: 'bot_suonglua_1' }) });
  const f = r.findings.find(x => x.id === 'courtly_vs_flashy');
  assert.ok(f);
  assert.deepEqual(f.fix, { slot: 'outer', remove: true });
});

test('dạo phố: áo tấc + baggy + sneaker => remix, tuyệt vời', () => {
  const r = evaluateOutfit({ occasionId: 'street', outfit: outfit({ top: 'top_aotac_1', bottom: 'bot_baggy_1', shoes: 'shoe_sneaker_1' }) });
  assert.ok(ids(r).includes('street_remix'));
  assert.equal(r.status, 'tuyet_voi');
});

test('dạ tiệc: áo thun + jean rách bị trừ; áo dài + suông + blazer thì ổn', () => {
  const bad = evaluateOutfit({ occasionId: 'gala', outfit: outfit({ top: 'top_tee_1', bottom: 'bot_jeanrach_1' }) });
  assert.ok(ids(bad).includes('gala_casual_bottom') && ids(bad).includes('gala_casual_top'));
  const good = evaluateOutfit({ occasionId: 'gala', outfit: outfit({ top: 'top_aodai_1', outer: 'top_blazer_1', bottom: 'bot_suonglua_1' }) });
  assert.equal(good.status, 'tuyet_voi');
});

test('sự kiện văn hóa: thiếu Việt phục => lưu ý; nhiều Việt phục => điểm cộng', () => {
  const none = evaluateOutfit({ occasionId: 'culture', outfit: outfit({ top: 'top_tee_1', bottom: 'bot_baggy_1' }) });
  assert.ok(ids(none).includes('culture_no_heritage'));
  const many = evaluateOutfit({ occasionId: 'culture', outfit: outfit({ top: 'top_aodai_1', bottom: 'bot_suonglua_1', shoes: 'shoe_guoc_1' }) });
  assert.ok(ids(many).includes('culture_heritage'));
});

test('thiếu áo / thiếu quần: cảnh báo (chùa thì BLOCK) và có gợi ý sửa', () => {
  const street = evaluateOutfit({ occasionId: 'street', outfit: {} });
  assert.deepEqual(ids(street).sort(), ['missing_bottom', 'missing_top']);
  assert.ok(street.findings.every(f => f.fix));
  const temple = evaluateOutfit({ occasionId: 'temple', outfit: {} });
  assert.equal(temple.status, 'canh_bao');
});

test('điểm luôn trong 0..100, status hợp lệ', () => {
  for (const occ of ['temple', 'street', 'gala', 'culture']) {
    const r = evaluateOutfit({ occasionId: occ, outfit: outfit({ top: 'top_nhatbinh_1', outer: 'top_cyber_1', bottom: 'bot_short_1', hat: 'hat_beret_1', accessory: 'acc_cyber_1' }) });
    assert.ok(r.score >= 0 && r.score <= 100);
    assert.ok(['tuyet_voi', 'hop_le', 'canh_bao'].includes(r.status));
  }
});

test('cultureCheck: AI lỗi => vẫn có kết quả của luật + aiError', async () => {
  const r = await cultureCheck({
    outfit: outfit({ top: 'top_aodai_1', bottom: 'bot_short_1' }), occasionId: 'temple',
    explain: async () => { throw new Error('quota'); }
  });
  assert.equal(r.status, 'canh_bao');
  assert.equal(r.aiError, 'quota');
  assert.equal(r.review, '');
});

test('cultureCheck: AI KHÔNG thể đổi status/score; chỉ điền phần giải thích', async () => {
  let seenPrompt = '';
  const r = await cultureCheck({
    outfit: outfit({ top: 'top_aodai_1', bottom: 'bot_short_1' }), occasionId: 'temple',
    explain: async text => { seenPrompt = text; return { status: 'tuyet_voi', score: 100, cultural_review: 'rv', stylist_advice: 'adv', suggestions: ['a', 'b'] }; }
  });
  assert.equal(r.status, 'canh_bao');
  assert.ok(r.score <= 45);
  assert.equal(r.review, 'rv');
  assert.deepEqual(r.suggestions, ['a', 'b']);
  assert.match(seenPrompt, /KẾT QUẢ KIỂM TRA TỰ ĐỘNG/);   // AI được đưa kết quả luật để giải thích
  assert.equal(r.aiError, null);
});

test('cultureCheck: không có explain (offline) vẫn chạy', async () => {
  const r = await cultureCheck({ outfit: outfit({ top: 'top_aodai_1', bottom: 'bot_suonglua_1' }), occasionId: 'street' });
  assert.ok(r.score > 0);
});

test('inferOccasionId đoán đúng từ chữ trong <option>', () => {
  assert.equal(inferOccasionId('Đi lễ chùa, lăng tẩm, di tích hoặc nơi thờ tự'), 'temple');
  assert.equal(inferOccasionId('Dạ tiệc, sự kiện Prom'), 'gala');
  assert.equal(inferOccasionId('Sự kiện văn hóa, triển lãm'), 'culture');
  assert.equal(inferOccasionId('Dạo phố, đi cafe'), 'street');
});

test('mọi món trong tủ có shape: có luật văn hóa VÀ có hình vẽ trong avatar', () => {
  for (const item of CATALOGUE) {
    assert.ok(item.shape, `${item.id} thiếu shape`);
    assert.ok(SHAPE_META[item.shape], `${item.id}: shape "${item.shape}" chưa có trong SHAPE_META (culture.js)`);
    const svg = buildAvatarSvg({ items: [item], stats: {}, skin: '#f5c9b0' });
    assert.ok(svg.includes(`data-id="${item.id}"`), `${item.id}: avatar không vẽ được`);
  }
});
