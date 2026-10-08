const state={
  gender:"female",height:165,weight:52,event:"tet",outfit:"aodai",
  color:"#9d2937",colorName:"Đỏ son",style:"elegant",accessory:"none",rotation:0
};
const outfits={
  aodai:{name:"Áo dài",note:"Thanh lịch · hiện đại"},
  tuthan:{name:"Áo tứ thân",note:"Duyên dáng · Bắc Bộ"},
  nguthan:{name:"Áo ngũ thân",note:"Cổ điển · trang trọng"},
  aba:{name:"Áo bà ba",note:"Mộc mạc · Nam Bộ"}
};
const events={
  tet:{name:"Tết",icon:"🧧",desc:"Ngày đầu năm · sum họp · chúc Tết",weather:"Nắng nhẹ · 27°C"},
  school:{name:"Đi học",icon:"🎓",desc:"Gọn gàng · năng động · lịch sự",weather:"Nắng nhẹ · 26°C"},
  wedding:{name:"Đám cưới",icon:"💍",desc:"Trang trọng · tinh tế · vừa phải",weather:"Mát · 24°C"},
  festival:{name:"Lễ hội",icon:"🏮",desc:"Văn hóa cộng đồng · nổi bật",weather:"Nắng · 29°C"},
  photo:{name:"Chụp ảnh",icon:"📸",desc:"Lên hình đẹp · có điểm nhấn",weather:"Nắng đẹp · 28°C"},
  hangout:{name:"Đi chơi",icon:"🌙",desc:"Thoải mái · hiện đại · cá tính",weather:"Chiều mát · 25°C"}
};
const styles={
 elegant:"Tinh tế",genz:"Gen Z",minimal:"Tối giản",bold:"Cá tính"
};
const colors=[
  ["#9d2937","Đỏ son"],["#1f5148","Xanh ngọc"],["#c8a158","Vàng lụa"],
  ["#262827","Đen mực"],["#e9dccb","Kem ngà"]
];

function $(s){return document.querySelector(s)}
function $$(s){return document.querySelectorAll(s)}
function score(){
  let s=90;
  if(state.event==="tet")s+=2;
  if(state.style==="elegant")s+=2;
  if(state.style==="minimal")s+=1;
  if(state.style==="bold")s-=1;
  if(state.accessory==="none")s+=1;
  if(state.event==="wedding"&&state.style==="bold")s-=5;
  if(state.outfit!=="aodai")s-=1;
  if(state.gender==="male"&&state.outfit==="aodai")s+=0;
  return Math.max(80,Math.min(98,s));
}
function bodyType(){
  const w=Number(state.weight);
  if(w<52)return "Thanh mảnh";
  if(w<65)return "Cân đối";
  if(w<78)return "Đầy đặn";
  return "Cơ thể lớn";
}
function showToast(msg){
  const t=$("#toast");t.textContent=msg;t.classList.add("show");
  clearTimeout(showToast.timer);showToast.timer=setTimeout(()=>t.classList.remove("show"),2200);
}
function saved(){return JSON.parse(localStorage.getItem("vietRemixLooksV2")||"[]")}
function saveLook(){
  const list=saved();
  list.unshift({...state,id:Date.now(),score:score()});
  localStorage.setItem("vietRemixLooksV2",JSON.stringify(list.slice(0,12)));
  renderLookbook();updateHeader();showToast("Đã lưu look vào Lookbook ✦");
}
function updateHeader(){$("#headerCount").textContent=saved().length}
function go(route){
  $$(".page").forEach(p=>p.classList.remove("active"));
  const p=$("#page-"+route);if(p)p.classList.add("active");
  $$(".nav-link").forEach(n=>n.classList.toggle("active",n.dataset.route===route));
  if(route==="lookbook")renderLookbook();
  window.scrollTo({top:0,behavior:"smooth"});
}
$$("[data-route]").forEach(el=>el.addEventListener("click",()=>go(el.dataset.route)));

function buildDiscover(){
  const og=$("#discoverOutfits"), eg=$("#discoverEvents");
  og.innerHTML=Object.entries(outfits).map(([id,o],i)=>`
    <article class="discover-card">
      <span class="discover-number">0${i+1} / VIỆT PHỤC</span>
      <div class="discover-visual"><div class="disc-figure" style="--red:${colors[i%colors.length][0]}"></div></div>
      <h3>${o.name}</h3><p>${cultureData[id][1]}</p>
      <div class="discover-meta"><span class="pill">${o.note.split(" · ")[1]||"Việt Nam"}</span><span class="pill">Đọc nhanh</span></div>
    </article>`).join("");
  eg.innerHTML=Object.entries(events).map(([id,e],i)=>`
    <article class="discover-card">
      <span class="discover-number">0${i+1} / BỐI CẢNH</span>
      <div class="event-visual ${id}">${e.icon}</div>
      <h3>${e.name}</h3><p>${e.desc}</p>
      <div class="discover-meta"><span class="pill">${e.weather}</span><span class="pill">Gợi ý outfit</span></div>
    </article>`).join("");
}
const cultureData={
 aodai:["Áo dài","Áo dài là biểu tượng quen thuộc của trang phục Việt Nam, xuất hiện trong nhiều bối cảnh đời sống, trường học và sự kiện. Khi remix, nên giữ tinh thần thanh lịch.","Tránh gắn một thiết kế hiện đại với nhãn “nguyên bản lịch sử” nếu không có tư liệu xác nhận."],
 tuthan:["Áo tứ thân","Áo tứ thân có liên hệ với văn hóa Bắc Bộ và hình ảnh người phụ nữ trong đời sống truyền thống. Nên ghi rõ bối cảnh vùng miền khi giới thiệu.","Không nên trộn quá nhiều chi tiết của áo dài vào áo tứ thân rồi gọi đó là nguyên bản."],
 nguthan:["Áo ngũ thân","Áo ngũ thân có cấu trúc và lịch sử riêng, mang tính trang trọng. Phiên bản Gen Z nên được giới thiệu là lấy cảm hứng khi có thay đổi thiết kế.","Cần phân biệt thiết kế phục dựng / nghiên cứu với thiết kế lấy cảm hứng hiện đại."],
 aba:["Áo bà ba","Áo bà ba gắn với hình ảnh Nam Bộ và đời sống vùng sông nước. Có thể phối hiện đại nhưng nên giữ thông tin vùng miền.","Không nên gọi áo bà ba là đại diện duy nhất cho toàn bộ Việt phục Việt Nam."]
};

function renderControls(){
  $("#eventButtons").innerHTML=Object.entries(events).map(([id,e])=>`<button data-event="${id}" class="${state.event===id?"active":""}">${e.icon} ${e.name}</button>`).join("");
  $("#outfitButtons").innerHTML=Object.entries(outfits).map(([id,o])=>`<button data-outfit="${id}" class="${state.outfit===id?"active":""}"><strong>${o.name}</strong><span>${o.note}</span></button>`).join("");
  $("#colorButtons").innerHTML=colors.map(c=>`<button class="color-dot ${state.color===c[0]?"active":""}" title="${c[1]}" aria-label="${c[1]}" data-color="${c[0]}" data-name="${c[1]}" style="background:${c[0]}"></button>`).join("");
  $("#styleButtons").innerHTML=Object.entries(styles).map(([id,n])=>`<button data-style="${id}" class="${state.style===id?"active":""}">${n}</button>`).join("");
  $$("#eventButtons button").forEach(b=>b.onclick=()=>{state.event=b.dataset.event;updateAll()});
  $$("#outfitButtons button").forEach(b=>b.onclick=()=>{state.outfit=b.dataset.outfit;updateAll()});
  $$("#colorButtons button").forEach(b=>b.onclick=()=>{state.color=b.dataset.color;state.colorName=b.dataset.name;updateAll()});
  $$("#styleButtons button").forEach(b=>b.onclick=()=>{state.style=b.dataset.style;updateAll()});
}
function updateModel(){
  const m=$("#model");
  m.classList.toggle("male",state.gender==="male");
  m.classList.toggle("female",state.gender==="female");
  const hScale=Number(state.height)/165;
  const wScale=1+(Number(state.weight)-52)/330;
  m.style.transform=`translateX(-50%) scale(${hScale}) scaleX(${wScale}) rotateY(${state.rotation}deg)`;
  document.documentElement.style.setProperty("--red",state.color);
  document.documentElement.style.setProperty("--lookColor",state.color);
  $("#modelAccessory").className="model-accessory "+state.accessory;
  $("#heightText").textContent=state.height+" cm";
  $("#weightText").textContent=state.weight+" kg";
  $("#bodyType").textContent=bodyType();
}
function updateSummary(){
  const sc=score(), ev=events[state.event];
  $("#summaryTitle").textContent=`${ev.name} · ${outfits[state.outfit].name} · ${state.colorName}`;
  $("#summaryText").textContent=`${styles[state.style]}, trẻ trung và phù hợp ${ev.name.toLowerCase()}.`;
  $("#score").textContent=sc;
  $("#weatherText").textContent=ev.weather;
  $("#fitText").textContent=`${state.height} cm · ${state.weight} kg · ${bodyType()}`;
}
function updateCulture(){
  const data=cultureData[state.outfit], ev=events[state.event], sc=score();
  $("#cultureHeading").textContent=`${data[0]} · ${ev.name}`;
  $("#cultureMain").textContent=`${data[1]} Bối cảnh hiện tại: ${ev.desc.toLowerCase()}.`;
  $("#originText").textContent=data[1];
  $("#warningText").textContent=data[2];
  $("#cultureScore").textContent=sc;
  $("#scoreSmall").textContent=sc+"/100";
  $("#scoreLine").style.width=sc+"%";
  $("#cultureMini").onclick=()=>go("culture");
}
function updateAll(){
  renderControls();updateModel();updateSummary();updateCulture();updateHeader();
}
$$(".gender").forEach(g=>g.onclick=()=>{$$(".gender").forEach(x=>x.classList.remove("active"));g.classList.add("active");state.gender=g.dataset.gender;updateAll()});
$("#height").oninput=e=>{state.height=e.target.value;updateAll()};
$("#weight").oninput=e=>{state.weight=e.target.value;updateAll()};
$("#accessory").onchange=e=>{state.accessory=e.target.value;updateAll()};
$("#turnModel").onclick=()=>{state.rotation=state.rotation===0?180:0;updateModel()};
$("#resetModel").onclick=()=>{state.height=165;state.weight=52;state.rotation=0;$("#height").value=165;$("#weight").value=52;updateAll()};
$("#saveLook").onclick=saveLook;
$("#shareLook").onclick=()=>{const text=`VIỆT PHỤC REMIX — ${$("#summaryTitle").textContent}`;if(navigator.clipboard)navigator.clipboard.writeText(text);showToast("Đã sao chép tên look để chia sẻ ✦")};
$("#compareLook").onclick=()=>{
  $("#compareModal").classList.add("show");
  const list=saved();
  const a=list[0]||{...state,score:score()}, b=list[1]||{...state,event:"wedding",color:"#1f5148",colorName:"Xanh ngọc",style:"minimal",accessory:"pearl",score:91};
  $("#compareGrid").innerHTML=[a,b].map((x,i)=>`<div class="compare-item"><span class="eyebrow">PHƯƠNG ÁN ${i+1}</span><h3>${events[x.event].name} · ${outfits[x.outfit].name}</h3><p>${x.gender==="male"?"Nam":"Nữ"} · ${x.height} cm · ${x.weight} kg</p><p>${x.colorName} · ${styles[x.style]} · ${x.score||score()}/100</p><p>${events[x.event].desc}</p></div>`).join("");
};
$("#closeModal").onclick=()=>$("#compareModal").classList.remove("show");
$("#compareModal").onclick=e=>{if(e.target.id==="compareModal")$("#compareModal").classList.remove("show")};

function renderLookbook(){
  const data=saved(), g=$("#lookbookGrid");
  if(!data.length){g.innerHTML=`<div class="look-empty">Bạn chưa có look nào.<br><br>Vào Remix Studio, phối một bộ đồ và bấm “Lưu vào Lookbook”.</div>`;return}
  g.innerHTML=data.map((x,i)=>`
    <article class="look-card">
      <div class="look-preview">
        <div class="mini-model ${x.gender==="male"?"male":""}" style="--red:${x.color}">
          <div class="head"></div><div class="hair"></div><div class="neck"></div><div class="torso"><div class="collar"></div></div>
          <div class="arm arm-l"></div><div class="arm arm-r"></div><div class="waist"></div><div class="bottom"></div>
          <div class="leg leg-l"></div><div class="leg leg-r"></div><div class="shoe shoe-l"></div><div class="shoe shoe-r"></div>
        </div>
      </div>
      <div class="look-info"><span class="eyebrow">LOOK #${String(i+1).padStart(2,"0")}</span><h3>${events[x.event].name} · ${outfits[x.outfit].name}</h3><p>${x.gender==="male"?"Nam":"Nữ"} · ${x.height} cm · ${x.weight} kg · ${x.colorName} · ${styles[x.style]} · ${x.score}/100</p></div>
      <div class="look-actions"><button data-use="${x.id}">Dùng lại</button><button data-delete="${x.id}">Xóa</button></div>
    </article>`).join("");
  $$("#lookbookGrid [data-use]").forEach(b=>b.onclick=()=>{const x=data.find(v=>v.id==b.dataset.use);if(!x)return;Object.assign(state,x);$("#height").value=state.height;$("#weight").value=state.weight;go("remix");updateAll();showToast("Đã nạp lại outfit ✦")});
  $$("#lookbookGrid [data-delete]").forEach(b=>b.onclick=()=>{localStorage.setItem("vietRemixLooksV2",JSON.stringify(data.filter(v=>v.id!=b.dataset.delete)));renderLookbook();updateHeader()});
}
$$(".cat-tab").forEach(tab=>tab.onclick=()=>{$$(".cat-tab").forEach(x=>x.classList.remove("active"));tab.classList.add("active");$("#discoverOutfits").classList.toggle("hidden",tab.dataset.cat!=="outfit");$("#discoverEvents").classList.toggle("hidden",tab.dataset.cat!=="event")});
buildDiscover();updateAll();renderLookbook();updateHeader();
