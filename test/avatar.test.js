const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('fs');
const path = require('path');
const vm = require('vm');

const { buildAvatarSvg, resolveLayers, usesImage, effectiveCovers, computeBody, ART_REF } = require('../docs/js/avatar.js');
const DOCS = path.join(__dirname, '../docs');
const CATALOGUE = vm.runInNewContext(
  fs.readFileSync(path.join(DOCS, 'js/items.js'), 'utf8') + '\nCATALOGUE',
  { localStorage: { getItem: () => null } }
);
const byId = id => CATALOGUE.find(i => i.id === id);
const withImage = CATALOGUE.filter(i => i.image);

// Đọc kích thước ảnh WebP từ header (VP8X / VP8L / VP8) – không cần thư viện
function webpSize(buf) {
  assert.equal(buf.toString('ascii', 0, 4), 'RIFF');
  assert.equal(buf.toString('ascii', 8, 12), 'WEBP');
  const kind = buf.toString('ascii', 12, 16);
  if (kind === 'VP8X') return [1 + buf.readUIntLE(24, 3), 1 + buf.readUIntLE(27, 3)];
  if (kind === 'VP8L') return [1 + (((buf[22] & 0x3f) << 8) | buf[21]), 1 + (((buf[24] & 0x0f) << 10) | (buf[23] << 2) | ((buf[22] & 0xc0) >> 6))];
  if (kind === 'VP8 ') return [buf.readUInt16LE(26) & 0x3fff, buf.readUInt16LE(28) & 0x3fff];
  assert.fail(`WebP không nhận dạng được: ${kind}`);
}

test('mọi ảnh trong tủ tồn tại, là WebP, đúng khung 400x1200 (để kéo giãn khớp thân vector)', () => {
  assert.ok(withImage.length >= 4, 'cần có món có ảnh');
  for (const file of withImage.map(i => i.image)) {
    const full = path.join(DOCS, file);
    assert.ok(fs.existsSync(full), `thiếu file ${file}`);
    assert.deepEqual(webpSize(fs.readFileSync(full)), [400, 1200], `${file} sai khung (dùng tools/clean_layers.py)`);
  }
  assert.ok(fs.existsSync(path.join(__dirname, '../art/reference/body.webp')), 'thiếu ảnh body tham chiếu');
});

test('hybrid: thân LUÔN là vector; món có ảnh dùng <image>, món chưa có ảnh dùng vector; mặc lẫn được', () => {
  const items = [byId('top_aotac_1'), byId('bot_baggy_1'), byId('shoe_guoc_1'), byId('hat_khandong_1')];
  const svg = buildAvatarSvg({ items, style: 'hybrid' });
  assert.match(svg, /data-style="hybrid"/);
  const layer = id => svg.split('<g data-slot=').find(g => g.includes(`data-id="${id}"`)) || '';
  assert.ok(layer('top_aotac_1').includes('<image') && layer('top_aotac_1').includes('data-art'));
  assert.ok(layer('bot_baggy_1').includes('<image') && layer('bot_baggy_1').includes('data-art'));
  assert.ok(!layer('shoe_guoc_1').includes('<image') && layer('shoe_guoc_1').includes('<path'), 'giày chưa có ảnh phải là vector');
  assert.ok(!layer('hat_khandong_1').includes('<image'));
  assert.ok(svg.includes('<ellipse'), 'thân vector (đầu/tai) phải còn');
});

test("kiểu 'vector': bỏ qua mọi ảnh", () => {
  const svg = buildAvatarSvg({ items: [byId('top_aotac_1'), byId('bot_baggy_1')], style: 'vector' });
  assert.match(svg, /data-style="vector"/);
  assert.ok(!svg.includes('<image'));
});

test('thứ tự lớp giữ nguyên khi trộn ảnh + vector (giày < quần < áo)', () => {
  const items = [byId('top_aotac_1'), byId('bot_baggy_1'), byId('shoe_theu_1')];
  const order = [...buildAvatarSvg({ items }).matchAll(/data-slot="(\w+)"/g)].map(m => m[1]);
  assert.deepEqual(order, ['shoes', 'bottom', 'top']);
});

test('imageCovers: ảnh Ngũ Thân vẽ liền quần -> che bottom khi DÙNG ẢNH, không che ở kiểu vector', () => {
  const ngu = byId('top_nguthan_1');
  assert.deepEqual([...ngu.imageCovers], ['bottom']);
  assert.deepEqual([...effectiveCovers(ngu, 'hybrid')], ['bottom']);
  assert.deepEqual([...effectiveCovers(ngu, 'vector')], []);
  const items = [ngu, byId('bot_vayxanh_1')];
  assert.ok(!buildAvatarSvg({ items, style: 'hybrid' }).includes('data-id="bot_vayxanh_1"'));
  assert.ok(buildAvatarSvg({ items, style: 'vector' }).includes('data-id="bot_vayxanh_1"'));
});

test('usesImage / resolveLayers theo kiểu', () => {
  const guoc = byId('shoe_guoc_1'), tac = byId('top_aotac_1');
  assert.equal(usesImage(guoc, 'hybrid'), false);
  assert.equal(usesImage(tac, 'hybrid'), true);
  assert.equal(usesImage(tac, 'vector'), false);
  assert.equal(resolveLayers([guoc, tac], 'hybrid').length, 2);
});

test('ảnh đồ ôm theo thân vector: kéo cân nặng / đổi dáng thì dải ảnh thay đổi bề ngang', () => {
  const widths = stats => [...buildAvatarSvg({ items: [byId('top_aotac_1')], stats }).matchAll(/<svg x="(-?[\d.]+)" y="[\d.]+" width="([\d.]+)"/g)].map(m => +m[2]);
  const slim = widths({ weight: 45, bodyShape: 'donghocat' }), heavy = widths({ weight: 95, bodyShape: 'donghocat' });
  assert.equal(slim.length, heavy.length);
  assert.ok(slim.length > 100, 'phải có nhiều dải để mép mượt');
  const avg = a => a.reduce((s, x) => s + x, 0) / a.length;
  assert.ok(avg(heavy) > avg(slim) * 1.03, 'người nặng hơn thì đồ phải rộng hơn');
});

test('các dải ảnh phủ kín từ trên xuống dưới, không hở, không chồng lệch', () => {
  const rows = [...buildAvatarSvg({ items: [byId('bot_vayxanh_1')] }).matchAll(/<svg x="-?[\d.]+" y="([\d.]+)" width="[\d.]+" height="([\d.]+)"/g)].map(m => [+m[1], +m[2]]);
  for (let i = 1; i < rows.length; i++) {
    const prevEnd = rows[i - 1][0] + rows[i - 1][1];
    assert.ok(prevEnd >= rows[i][0] - 0.01, `hở giữa dải ${i - 1} và ${i}`);          // dải sau bắt đầu trước khi dải trước kết thúc (có chồng mép)
    assert.ok(rows[i][0] > rows[i - 1][0], 'dải phải đi xuống');
  }
  assert.ok(rows[0][0] >= 0 && rows.at(-1)[0] + rows.at(-1)[1] <= 601);
});

test('mốc của ảnh tham chiếu tăng dần (đúng thứ tự cơ thể)', () => {
  const ys = Object.values(ART_REF.y);
  assert.deepEqual(ys, [...ys].sort((a, b) => a - b));
  assert.deepEqual(Object.keys(ART_REF.y), Object.keys(ART_REF.hw));
});

test('món có ảnh đều có shape (luật văn hoá + hình vector dự phòng khi chọn "Chỉ vector")', () => {
  for (const it of withImage) assert.ok(it.shape, it.id);
});
