const CATALOGUE = [
  // Tops
  { id:'top_aotac_1', name:'Áo Tấc Đỏ', category:'top', type:'traditional', defaultColor:'#be123c', icon:'👘', pattern:'Hoa văn mây cách điệu', description:'Áo tấc lấy cảm hứng từ trang phục lễ phục truyền thống.' },
  { id:'top_nguthan_1', name:'Áo Ngũ Thân Xanh', category:'top', type:'traditional', defaultColor:'#1e3a8a', icon:'👔', pattern:'Ngũ thân, cổ đứng', description:'Áo ngũ thân phối sắc xanh đậm hiện đại.' },
  { id:'top_nhatbinh_1', name:'Nhật Bình Hoàng Gia', category:'top', type:'traditional', defaultColor:'#ef4444', icon:'🥻', pattern:'Cổ chữ nhật, dải ngũ hành', description:'Thiết kế gợi cảm hứng từ áo Nhật Bình triều Nguyễn.' },
  { id:'top_aodai_1', name:'Áo Dài Hoa Sen', category:'top', type:'traditional', defaultColor:'#f472b6', icon:'🌸', pattern:'Hoa sen', description:'Áo dài cách điệu với họa tiết hoa sen.' },
  { id:'top_giaolinh_1', name:'Áo Giao Lĩnh', category:'top', type:'traditional', defaultColor:'#7c3aed', icon:'🪻', pattern:'Giao lĩnh', description:'Cổ giao lĩnh với sắc tím đương đại.' },
  { id:'top_blazer_1', name:'Blazer Da Đen', category:'top', type:'modern', defaultColor:'#111827', icon:'🧥', pattern:'Da trơn', description:'Blazer hiện đại để remix cùng cổ phục.' },
  { id:'top_cyber_1', name:'Crop Jacket Neon', category:'top', type:'modern', defaultColor:'#06b6d4', icon:'🧥', pattern:'Đường line neon', description:'Áo khoác cyber lấy cảm hứng từ techwear.' },
  // Bottoms
  { id:'bot_suonglua_1', name:'Quần Suông Lụa', category:'bottom', type:'traditional', defaultColor:'#f8fafc', icon:'👖', pattern:'Lụa trơn', description:'Quần suông thanh lịch, phù hợp các set cổ phục.' },
  { id:'bot_baggy_1', name:'Quần Baggy Khaki', category:'bottom', type:'modern', defaultColor:'#b45309', icon:'👖', pattern:'Khaki', description:'Quần baggy tạo cảm giác streetwear.' },
  { id:'bot_vayxep_1', name:'Chân Váy Xếp Ly', category:'bottom', type:'modern', defaultColor:'#374151', icon:'👗', pattern:'Xếp ly', description:'Chân váy dài giúp remix mềm mại.' },
  { id:'bot_jeanrach_1', name:'Jean Rách Gối', category:'bottom', type:'modern', defaultColor:'#3b82f6', icon:'👖', pattern:'Denim rách', description:'Jean streetwear với chi tiết rách gối.' },
  { id:'bot_short_1', name:'Quần Short Đen', category:'bottom', type:'modern', defaultColor:'#18181b', icon:'🩳', pattern:'Trơn', description:'Short casual, phù hợp dạo phố nhưng cần cân nhắc bối cảnh văn hóa.' },
  // Shoes
  { id:'shoe_guoc_1', name:'Guốc Mộc', category:'shoes', type:'traditional', defaultColor:'#78350f', icon:'👡', pattern:'Gỗ tự nhiên', description:'Guốc mộc mang tinh thần truyền thống.' },
  { id:'shoe_sneaker_1', name:'Chunky Sneaker', category:'shoes', type:'modern', defaultColor:'#ffffff', icon:'👟', pattern:'Chunky', description:'Sneaker đế dày cho phong cách Gen Z.' },
  { id:'shoe_boots_1', name:'Boots Cổ Thấp', category:'shoes', type:'modern', defaultColor:'#000000', icon:'👢', pattern:'Da trơn', description:'Boots đen tối giản.' },
  // Hats
  { id:'hat_khandong_1', name:'Khăn Đóng Đen', category:'hat', type:'traditional', defaultColor:'#111827', icon:'🎩', pattern:'Khăn đóng', description:'Khăn đóng gợi nhắc phục sức truyền thống.' },
  { id:'hat_quaithao_1', name:'Nón Quai Thao', category:'hat', type:'traditional', defaultColor:'#fde68a', icon:'👒', pattern:'Quai thao', description:'Nón quai thao với dáng vành rộng.' },
  { id:'hat_beret_1', name:'Mũ Beret', category:'hat', type:'modern', defaultColor:'#9f1239', icon:'🧢', pattern:'Len', description:'Beret hiện đại.' },
  // Accessories
  { id:'acc_cyber_1', name:'Kính Cyber', category:'accessory', type:'modern', defaultColor:'#06b6d4', icon:'🕶️', pattern:'Chrome neon', description:'Kính futuristic cho set remix.' },
  { id:'acc_vongngoc_1', name:'Vòng Ngọc Bích', category:'accessory', type:'traditional', defaultColor:'#10b981', icon:'📿', pattern:'Ngọc bích', description:'Phụ kiện lấy cảm hứng từ chất liệu ngọc.' },
  { id:'acc_quatgiay_1', name:'Quạt Giấy', category:'accessory', type:'traditional', defaultColor:'#fcd34d', icon:'🪭', pattern:'Giấy thủ công', description:'Quạt giấy tạo điểm nhấn truyền thống.' },
  { id:'acc_tuixach_1', name:'Túi Tote Thêu', category:'accessory', type:'modern', defaultColor:'#f5f5f4', icon:'👜', pattern:'Thêu họa tiết Việt', description:'Tote hiện đại với họa tiết lấy cảm hứng Việt Nam.' }
];

const getAllItems = () => {
  let aiItems = [];
  try { aiItems = JSON.parse(localStorage.getItem('vietvibe_ai_items') || '[]'); } catch {}
  return [...CATALOGUE, ...aiItems];
};

const findItemById = id => getAllItems().find(item => item.id === id);
