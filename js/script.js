/* ================= A. KONFIGURASI (EDIT DI SINI) ================= */
const CONFIG = {
  eventDate: "2027-03-14T05:00:00+07:00",
  dateLabel: "14 Maret 2027",
  donationTarget: 150000000,
  cats: [
    { id:"5k",  name:"5K",  label:"Fun Run",       price:150000, quota:400, sold:132, benefits:["Medali finisher","Jersey event","Nomor dada","Sertifikat digital","Snack dan air minum"] },
    { id:"10k", name:"10K", label:"Best Seller",   price:250000, quota:300, sold:141, benefits:["Semua benefit 5K","Timing chip","Medali eksklusif 10K","Tote bag","Foto digital"] },
    { id:"21k", name:"21K", label:"Half Marathon", price:400000, quota:200, sold:78,  benefits:["Semua benefit 10K","Jersey premium","Medali half marathon","Pace group","Area recovery dan pijat"] },
    { id:"42k", name:"42K", label:"Full Marathon", price:600000, quota:100, sold:36,  benefits:["Semua benefit 21K","Finisher jacket","Medali premium 42K","Nama di Wall of Heroes","Foto dan video finisher"] }
  ],
  schedule: [
    ["04.30","Registrasi ulang dan pemanasan"],
    ["05.00","Start 42K Full Marathon"],
    ["05.30","Start 21K Half Marathon"],
    ["06.00","Start 10K"],
    ["06.30","Start 5K Fun Run"],
    ["09.00","Festival garis finis dan penyerahan simbolis donasi"]
  ]
};

/* ================= B. FUNGSI BANTU ================= */
const rp = n => "Rp " + n.toLocaleString("id-ID");
const $ = id => document.getElementById(id);
const totalRaised = () => CONFIG.cats.reduce((s,c)=>s + c.sold*c.price, 0);
const totalSold = () => CONFIG.cats.reduce((s,c)=>s + c.sold, 0);

/* ================= C. RENDER KONTEN ================= */
$("heroDate").textContent = CONFIG.dateLabel;
$("marquee").innerHTML = Array(8).fill("🏃 100% tiket untuk korban bencana &nbsp;•&nbsp; 5K 10K 21K 42K &nbsp;•&nbsp; Depok berlari &nbsp;•&nbsp; ").join("");
$("timeline").innerHTML = CONFIG.schedule.map(s=>`<div><b>${s[0]}</b><br>${s[1]}</div>`).join("");

function renderCats(){
  $("cats").innerHTML = CONFIG.cats.map((c,i)=>{
    const left = c.quota - c.sold, pct = Math.round(c.sold/c.quota*100);
    return `<article class="cat reveal show">
      <span class="sticker">${c.label}</span>
      <div class="dist">${c.name}</div>
      <div class="price">${rp(c.price)}</div>
      <ul>${c.benefits.map(b=>`<li>${b}</li>`).join("")}</ul>
      <div class="quota">Sisa ${left} dari ${c.quota} slot<div class="bar"><i style="width:${pct}%"></i></div></div>
      <button class="btn ${i%2?'btn-green':'btn-purple'}" onclick="openOrder('${c.id}')" ${left<1?"disabled":""}>${left<1?"Slot habis":"Pilih "+c.name}</button>
    </article>`;
  }).join("");
}

function renderFund(){
  const r = totalRaised();
  $("raised").textContent = rp(r);
  $("fundBar").style.width = Math.min(100, r/CONFIG.donationTarget*100) + "%";
  $("fundNote").textContent = `Target ${rp(CONFIG.donationTarget)} · ${totalSold()} tiket terjual`;
  $("sPeserta").dataset.count = totalSold();
}

/* ================= D. COUNTDOWN ================= */
function tick(){
  let d = new Date(CONFIG.eventDate) - new Date();
  if(d<0) d = 0;
  const v = [Math.floor(d/864e5), Math.floor(d/36e5)%24, Math.floor(d/6e4)%60, Math.floor(d/1e3)%60];
  $("countdown").innerHTML = ["Hari","Jam","Menit","Detik"].map((l,i)=>`<div><b>${String(v[i]).padStart(2,"0")}</b><small>${l}</small></div>`).join("");
}
tick(); setInterval(tick,1000);

/* ================= E. ANIMASI SCROLL & ANGKA ================= */
window.addEventListener("scroll",()=>$("nav").classList.toggle("scrolled",scrollY>40));
function countUp(el){
  const end = +el.dataset.count, suf = el.dataset.suffix||"", t0 = performance.now();
  (function f(t){ const p = Math.min(1,(t-t0)/1500); el.textContent = Math.round(end*p) + suf; if(p<1) requestAnimationFrame(f); })(t0);
}
const io = new IntersectionObserver(es=>es.forEach(e=>{
  if(!e.isIntersecting) return;
  e.target.classList.add("show");
  e.target.querySelectorAll("[data-count]").forEach(countUp);
  io.unobserve(e.target);
}),{threshold:.25});
function observe(){ document.querySelectorAll(".reveal:not(.show)").forEach(el=>io.observe(el)); }

/* ================= F. PEMESANAN TIKET ================= */
function openOrder(id){
  const c = CONFIG.cats.find(x=>x.id===id);
  $("box").innerHTML = `
    <button class="close" onclick="closeModal()" aria-label="Tutup">×</button>
    <h3 id="mTitle">Daftar kategori ${c.name}</h3>
    <form id="form" onsubmit="submitOrder(event,'${id}')">
      <label>Nama lengkap<input name="nama" required></label>
      <label>Email<input name="email" type="email" required></label>
      <div class="row">
        <label>No. WhatsApp<input name="wa" inputmode="tel" required></label>
        <label>Ukuran jersey<select name="size"><option>S</option><option selected>M</option><option>L</option><option>XL</option><option>XXL</option></select></label>
      </div>
      <label>Jumlah tiket<select name="qty" id="qty" onchange="calc('${id}')">${[1,2,3,4,5].map(n=>`<option>${n}</option>`).join("")}</select></label>
      <div class="sum">
        <div><span>Harga tiket</span><span id="sHarga"></span></div>
        <div><span>Total bayar</span><b id="sTotal"></b></div>
        <div class="donasi"><span>Disalurkan sebagai donasi (100%)</span><span id="sDonasi"></span></div>
      </div>
      <button class="btn btn-green" style="width:100%">Bayar dan donasi</button>
    </form>`;
  $("modal").classList.add("open"); calc(id);
}
function calc(id){
  const c = CONFIG.cats.find(x=>x.id===id), q = +$("qty").value, t = c.price*q;
  $("sHarga").textContent = rp(c.price)+" × "+q; $("sTotal").textContent = rp(t); $("sDonasi").textContent = rp(t);
}
function submitOrder(e,id){
  e.preventDefault();
  const c = CONFIG.cats.find(x=>x.id===id), q = +$("qty").value, nama = e.target.nama.value.split(" ")[0];
  c.sold = Math.min(c.quota, c.sold+q);
  const code = "DRH-" + c.name + "-" + Math.random().toString(36).slice(2,7).toUpperCase();
  $("box").innerHTML = `<div class="ok">
    <div class="emoji">🎉</div><h3>Terima kasih, ${nama}!</h3>
    <p>Pendaftaran kategori ${c.name} berhasil. Seluruh ${rp(c.price*q)} akan disalurkan untuk korban bencana alam.</p>
    <div class="code">${code}</div>
    <p style="font-size:.9rem">Simpan kode ini untuk pengambilan race kit.</p>
    <button class="btn btn-purple" style="margin-top:16px" onclick="closeModal()">Selesai</button></div>`;
  renderCats(); renderFund();
}
function closeModal(){ $("modal").classList.remove("open"); }
$("modal").addEventListener("click",e=>{ if(e.target.id==="modal") closeModal(); });
document.addEventListener("keydown",e=>{ if(e.key==="Escape") closeModal(); });

/* ================= G. START ================= */
renderCats(); renderFund(); observe();
