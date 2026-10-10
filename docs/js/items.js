// Ảnh minh họa (tuỳ chọn): image = ảnh layer 400x1200 vẽ theo art/reference/body.webp; avatar tự kéo ảnh cho khớp thân vector.
//   imageCovers = slot mà *ảnh này* đã vẽ sẵn (vd. ảnh Áo Ngũ Thân liền cả quần -> imageCovers:['bottom']).
//   Món không có `image` dùng hình vector theo `shape`. Hai loại mặc lẫn được.
// Mỗi món có:  category (slot) · shape (hình vẽ riêng trong avatar.js) · z (tuỳ chọn, override thứ tự lớp)
//              · covers (tuỳ chọn, slot bị che khi mặc món này)
const CATALOGUE = [
  // Tops (áo chính)
  { id:'top_aotac_1', name:'Áo Tấc Đỏ', category:'top', shape:'aotac', type:'traditional', defaultColor:'#be123c', icon:'👘', image:'img/items/top_aotac_1.webp', pattern:'Hoa văn mây cách điệu', description:'Áo tấc lấy cảm hứng từ trang phục lễ phục truyền thống.' },
  { id:'top_nguthan_1', name:'Áo Ngũ Thân Xanh', category:'top', shape:'ngu_than', type:'traditional', defaultColor:'#1e3a8a', icon:'👔', image:'img/items/top_nguthan_1.webp', imageCovers:['bottom'], pattern:'Ngũ thân, cổ đứng', description:'Áo ngũ thân phối sắc xanh đậm hiện đại.' },
  { id:'top_nhatbinh_1', image:'img/items/top_nhatbinh_1.webp', name:'Nhật Bình Hoàng Gia', category:'top', shape:'nhat_binh', type:'traditional', defaultColor:'#ef4444', icon:'🥻', pattern:'Cổ chữ nhật, dải ngũ hành', description:'Thiết kế gợi cảm hứng từ áo Nhật Bình triều Nguyễn.' },
  { id:'top_aodai_1', image:'img/items/top_aodai_1.webp', name:'Áo Dài Hoa Sen', category:'top', shape:'aodai', type:'traditional', defaultColor:'#f472b6', icon:'🌸', pattern:'Hoa sen', description:'Áo dài cách điệu với họa tiết hoa sen.' },
  { id:'top_giaolinh_1', image:'img/items/top_giaolinh_1.webp', name:'Áo Giao Lĩnh', category:'top', shape:'giao_linh', type:'traditional', defaultColor:'#7c3aed', icon:'🪻', pattern:'Giao lĩnh', description:'Cổ giao lĩnh với sắc tím đương đại.' },
  { id:'top_tee_1', image:'img/items/top_tee_1.webp', name:'Áo Thun Trắng', category:'top', shape:'tee', z:15, type:'modern', defaultColor:'#f8fafc', icon:'👕', pattern:'Cotton trơn', description:'Áo thun sơ vin trong quần – lớp nền để phối áo khoác ngoài.' },
  // Outer (áo khoác ngoài – mặc chồng lên áo chính)
  { id:'top_blazer_1', image:'img/items/top_blazer_1.webp', name:'Blazer Da Đen', category:'outer', shape:'blazer', type:'modern', defaultColor:'#111827', icon:'🧥', pattern:'Da trơn', description:'Blazer hiện đại để remix cùng cổ phục.' },
  { id:'top_cyber_1', image:'img/items/top_cyber_1.webp', name:'Crop Jacket Neon', category:'outer', shape:'crop_jacket', type:'modern', defaultColor:'#06b6d4', icon:'🧥', pattern:'Đường line neon', description:'Áo khoác cyber lấy cảm hứng từ techwear.' },
  { id:'outer_cloak_1', name:'Áo Choàng Gấm', category:'outer', shape:'cloak', covers:['bottom'], type:'traditional', defaultColor:'#7f1d1d', icon:'🧣', pattern:'Gấm hoa sen', description:'Áo choàng dài che kín quần/váy bên trong.' },
  // Bottoms
  { id:'bot_suonglua_1', image:'img/items/bot_suonglua_1.webp', name:'Quần Suông Lụa', category:'bottom', shape:'suong', type:'traditional', defaultColor:'#f8fafc', icon:'👖', pattern:'Lụa trơn', description:'Quần suông thanh lịch, phù hợp các set cổ phục.' },
  { id:'bot_baggy_1', image:'img/items/bot_baggy_1.webp', name:'Quần Baggy Khaki', category:'bottom', shape:'baggy', type:'modern', defaultColor:'#b45309', icon:'👖', pattern:'Khaki', description:'Quần baggy tạo cảm giác streetwear.' },
  { id:'bot_vayxep_1', image:'img/items/bot_vayxep_1.webp', name:'Chân Váy Xếp Ly', category:'bottom', shape:'skirt_pleated', type:'modern', defaultColor:'#374151', icon:'👗', pattern:'Xếp ly', description:'Chân váy dài giúp remix mềm mại.' },
  { id:'bot_jeanrach_1', image:'img/items/bot_jeanrach_1.webp', name:'Jean Rách Gối', category:'bottom', shape:'jean', type:'modern', defaultColor:'#3b82f6', icon:'👖', pattern:'Denim rách', description:'Jean streetwear với chi tiết rách gối.' },
  { id:'bot_vayxanh_1', name:'Chân Váy Xanh Xếp Ly', category:'bottom', shape:'skirt_pleated', type:'modern', defaultColor:'#166534', icon:'👗', image:'img/items/bot_vayxanh_1.webp', pattern:'Xếp ly', description:'Chân váy xanh lục xếp ly, hợp với áo tấc.' },
  { id:'bot_short_1', image:'img/items/bot_short_1.webp', name:'Quần Short Đen', category:'bottom', shape:'short', type:'modern', defaultColor:'#18181b', icon:'🩳', pattern:'Trơn', description:'Short casual, phù hợp dạo phố nhưng cần cân nhắc bối cảnh văn hóa.' },
  // Shoes
  { id:'shoe_guoc_1', name:'Guốc Mộc', category:'shoes', shape:'guoc', type:'traditional', defaultColor:'#78350f', icon:'👡', pattern:'Gỗ tự nhiên', description:'Guốc mộc mang tinh thần truyền thống.' },
  { id:'shoe_theu_1', name:'Hài Thêu', category:'shoes', shape:'guoc', type:'traditional', defaultColor:'#c2410c', icon:'🥿', pattern:'Thêu chỉ màu', description:'Hài vải thêu họa tiết, hợp cổ phục.' },
  { id:'shoe_sneaker_1', name:'Chunky Sneaker', category:'shoes', shape:'sneaker', type:'modern', defaultColor:'#ffffff', icon:'👟', pattern:'Chunky', description:'Sneaker đế dày cho phong cách Gen Z.' },
  { id:'shoe_boots_1', name:'Boots Cổ Thấp', category:'shoes', shape:'boots', type:'modern', defaultColor:'#000000', icon:'👢', pattern:'Da trơn', description:'Boots đen tối giản.' },
  // Hats
  { id:'hat_khandong_1', name:'Khăn Đóng Đen', category:'hat', shape:'khan_dong', type:'traditional', defaultColor:'#111827', icon:'🎩', pattern:'Khăn đóng', description:'Khăn đóng gợi nhắc phục sức truyền thống.' },
  { id:'hat_quaithao_1', name:'Nón Quai Thao', category:'hat', shape:'quai_thao', type:'traditional', defaultColor:'#fde68a', icon:'👒', pattern:'Quai thao', description:'Nón quai thao với dáng vành rộng.' },
  { id:'hat_beret_1', name:'Mũ Beret', category:'hat', shape:'beret', type:'modern', defaultColor:'#9f1239', icon:'🧢', pattern:'Len', description:'Beret hiện đại.' },
  // Accessories
  { id:'acc_cyber_1', name:'Kính Cyber', category:'accessory', shape:'glasses', type:'modern', defaultColor:'#06b6d4', icon:'🕶️', pattern:'Chrome neon', description:'Kính futuristic cho set remix.' },
  { id:'acc_vongngoc_1', image:'img/items/acc_vongngoc_1.webp', name:'Vòng Ngọc Bích', category:'accessory', shape:'bracelet', type:'traditional', defaultColor:'#10b981', icon:'📿', pattern:'Ngọc bích', description:'Phụ kiện lấy cảm hứng từ chất liệu ngọc.' },
  { id:'acc_quatgiay_1', image:'img/items/acc_quatgiay_1.webp', name:'Quạt Giấy', category:'accessory', shape:'fan', type:'traditional', defaultColor:'#fcd34d', icon:'🪭', pattern:'Giấy thủ công', description:'Quạt giấy tạo điểm nhấn truyền thống.' },
  { id:'acc_tuixach_1', name:'Túi Tote Thêu', category:'accessory', shape:'tote', type:'modern', defaultColor:'#f5f5f4', icon:'👜', pattern:'Thêu họa tiết Việt', description:'Tote hiện đại với họa tiết lấy cảm hứng Việt Nam.' }
];

const getAllItems = () => {
  let aiItems = [];
  try { aiItems = JSON.parse(localStorage.getItem('vietvibe_ai_items') || '[]'); } catch {}
  return [...CATALOGUE, ...aiItems];
};

const findItemById = id => getAllItems().find(item => item.id === id);

// Đảm bảo outfit[slot] luôn khớp item.category (bài lookbook cũ lưu blazer ở slot 'top').
const EMPTY_OUTFIT = () => ({ top:null, outer:null, bottom:null, shoes:null, hat:null, accessory:null });
const normalizeOutfit = raw => {
  const out = EMPTY_OUTFIT();
  Object.values(raw || {}).forEach(id => {
    const item = id && findItemById(id);
    if (item && item.category in out) out[item.category] = item.id;
  });
  return out;
};

// Nhận diện slot trang phục từ mô tả tiếng Việt
function detectSlot(text) {
  const t = (text || '').toLowerCase();
  if (/quần|jean|váy/.test(t)) return 'bottom';
  if (/giày|dép|guốc|sneaker|boots/.test(t)) return 'shoes';
  if (/khăn|mũ|nón|beret/.test(t)) return 'hat';
  if (/kính|vòng|quạt|túi|phụ kiện/.test(t)) return 'accessory';
  if (/khoác|choàng|blazer|jacket|vest/.test(t)) return 'outer';
  return 'top';
}

// Chọn hình vẽ (shape) gần nhất cho món AI dựa trên mô tả tiếng Việt; không khớp -> shape mặc định của slot
function detectShape(text, slot) {
  const t = (text || '').toLowerCase();
  const rules = {
    top:    [[/áo dài/, 'aodai'], [/tấc/, 'aotac'], [/ngũ thân|tứ thân/, 'ngu_than'], [/nhật bình/, 'nhat_binh'], [/giao lĩnh|bà ba/, 'giao_linh'], [/thun|phông|tee/, 'tee']],
    outer:  [[/choàng/, 'cloak'], [/crop|ngắn|bomber/, 'crop_jacket'], [/blazer|vest/, 'blazer']],
    bottom: [[/váy/, 'skirt_pleated'], [/short|ngắn/, 'short'], [/jean|bò/, 'jean'], [/baggy/, 'baggy'], [/suông|lụa/, 'suong']],
    shoes:  [[/guốc|dép/, 'guoc'], [/boot|bốt/, 'boots'], [/sneaker|giày thể thao/, 'sneaker']],
    hat:    [[/khăn đóng|khăn/, 'khan_dong'], [/quai thao|nón/, 'quai_thao'], [/beret|mũ/, 'beret']],
    accessory: [[/kính/, 'glasses'], [/vòng/, 'bracelet'], [/quạt/, 'fan'], [/túi|tote/, 'tote']]
  };
  const hit = (rules[slot] || []).find(([re]) => re.test(t));
  return hit ? hit[1] : undefined;
}
