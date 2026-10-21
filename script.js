const MENU=[
 {id:1,c:0,n:"Kopi Susu Pasir Putih",d:"Espresso, susu segar, gula aren",p:28000,e:"☕"},
 {id:2,c:0,n:"Americano Dingin",d:"Dua shot espresso, es batu",p:24000,e:"🧊"},
 {id:3,c:0,n:"Teh Melati Lemon",d:"Seduh dingin, irisan lemon",p:20000,e:"🍋"},
 {id:4,c:1,n:"Blue Lagoon",d:"Soda biru, jeruk nipis, mint",p:32000,e:"🌊"},
 {id:5,c:1,n:"Es Kelapa Muda",d:"Kelapa muda utuh, sirup gula",p:25000,e:"🥥"},
 {id:6,c:1,n:"Sunset Punch",d:"Nanas, markisa, soda",p:30000,e:"🍍"},
 {id:7,c:2,n:"Nasi Goreng Seafood",d:"Udang, cumi, telur mata sapi",p:48000,e:"🍤"},
 {id:8,c:2,n:"Ikan Bakar Rica",d:"Ikan kakap, nasi, lalapan",p:65000,e:"🐟"},
 {id:9,c:2,n:"Burger Pantai",d:"Daging sapi, keju, kentang goreng",p:52000,e:"🍔"},
 {id:10,c:3,n:"Kentang Goreng",d:"Bumbu bawang putih",p:22000,e:"🍟"},
 {id:11,c:3,n:"Pisang Goreng Madu",d:"Pisang kepok, madu, keju parut",p:24000,e:"🍌"},
 {id:12,c:3,n:"Calamari Crispy",d:"Cumi goreng tepung, saus tartar",p:38000,e:"🦑"}
];
const CATS=["Kopi & Teh","Minuman Segar","Makanan","Camilan"];
const rp=n=>"Rp "+n.toLocaleString("id-ID");
const $=id=>document.getElementById(id);
let cat=0,cart={};
const meja=new URLSearchParams(location.search).get("meja")||"5";
const mejaIn=$("fMeja"),namaIn=$("fNama");
mejaIn.value=meja;
$("meja").textContent="Meja "+meja;
mejaIn.addEventListener("input",()=>{$("meja").textContent="Meja "+(mejaIn.value.trim()||"–")});

function tabs(){
  $("tabs").innerHTML=CATS.map((c,i)=>`<button class="tab" role="tab" aria-selected="${i===cat}" data-cat="${i}">${c}</button>`).join("");
}
function list(){
  $("list").innerHTML=`<h2 class="cat-title">${CATS[cat]}</h2>`+MENU.filter(m=>m.c===cat).map(m=>{
    const q=cart[m.id]||0;
    const act=q?`<div class="step"><button data-minus="${m.id}" aria-label="Kurangi ${m.n}">−</button><span>${q}</span><button data-plus="${m.id}" aria-label="Tambah ${m.n}">+</button></div>`
      :`<button class="add" data-plus="${m.id}">Tambah</button>`;
    return `<div class="item"><div class="emo" aria-hidden="true">${m.e}</div><div class="nm"><span>${m.n}</span><span class="pr">${rp(m.p)}</span></div><div class="ds">${m.d}</div><div class="act">${act}</div></div>`;
  }).join("");
}
function summary(){
  const ids=Object.keys(cart).filter(k=>cart[k]>0);
  const qty=ids.reduce((s,k)=>s+cart[k],0);
  const tot=ids.reduce((s,k)=>s+cart[k]*MENU.find(m=>m.id==k).p,0);
  $("bar").classList.toggle("on",qty>0);
  $("barQty").textContent=qty+" item";
  $("barTotal").textContent=rp(tot)+" · Lihat pesanan";
  $("total").textContent=rp(tot);
  $("rows").innerHTML=ids.map(k=>{const m=MENU.find(x=>x.id==k);return `<div class="row"><span>${cart[k]}× ${m.n}</span><span>${rp(cart[k]*m.p)}</span></div>`}).join("");
  return qty;
}
function change(id,d){cart[id]=Math.max(0,(cart[id]||0)+d);if(!cart[id])delete cart[id];if(!summary())$("sheet").classList.remove("on");list()}
function toast(t){const e=$("toast");e.textContent=t;e.classList.add("on");setTimeout(()=>e.classList.remove("on"),3200)}

document.addEventListener("click",e=>{
  const t=e.target.closest("button");if(!t)return;
  if(t.dataset.cat){cat=+t.dataset.cat;tabs();list()}
  else if(t.dataset.plus)change(+t.dataset.plus,1);
  else if(t.dataset.minus)change(+t.dataset.minus,-1);
});
$("openCart").onclick=()=>$("sheet").classList.add("on");
$("close").onclick=()=>$("sheet").classList.remove("on");
$("sheet").onclick=e=>{if(e.target.id==="sheet")$("sheet").classList.remove("on")};
$("pay").onclick=async()=>{
  const nama=namaIn.value.trim(),no=mejaIn.value.trim();
  $("fErr").textContent="";
  if(!nama){$("fErr").textContent="Isi nama pemesan dulu.";namaIn.focus();return}
  if(!no){$("fErr").textContent="Isi nomor meja dulu.";mejaIn.focus();return}
  const wa=$("fWa").value.replace(/[\s-]/g,"");
  if(wa&&!/^(\+62|62|0)8\d{7,11}$/.test(wa)){$("fErr").textContent="Nomor WhatsApp belum benar. Contoh: 081234567890.";$("fWa").focus();return}
  const btn=$("pay");btn.disabled=true;btn.textContent="Memproses...";
  try{
    const items=Object.keys(cart).map(k=>({id:+k,qty:cart[k]}));
    const res=await fetch("/api/create-order",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({nama:nama,meja:no,wa:wa,catatan:$("fCatatan").value.trim(),items:items})});
    const data=await res.json();
    if(!res.ok) throw new Error(data.error||"Gagal membuat pesanan");
    await loadSnap();
    window.snap.pay(data.token,{
      onSuccess:()=>selesaiBayar(nama,no),
      onPending:()=>toast("Menunggu pembayaranmu selesai."),
      onError:()=>toast("Pembayaran gagal. Coba lagi."),
      onClose:()=>toast("Jendela pembayaran ditutup.")
    });
  }catch(e){$("fErr").textContent=e.message}
  btn.disabled=false;btn.textContent="Bayar sekarang";
};
let snapReady=null;
function loadSnap(){
  if(snapReady) return snapReady;
  snapReady=fetch("/api/config").then(r=>r.json()).then(c=>new Promise((ok,fail)=>{
    const s=document.createElement("script");
    s.src="https://app.sandbox.midtrans.com/snap/snap.js";
    s.setAttribute("data-client-key",c.clientKey);
    s.onload=ok;s.onerror=()=>fail(new Error("Gagal memuat Midtrans"));
    document.head.appendChild(s);
  }));
  snapReady.catch(()=>{snapReady=null});
  return snapReady;
}
function selesaiBayar(nama,no){
  cart={};summary();list();
  $("sheet").classList.remove("on");
  toast("Terima kasih, "+nama+"! Pesanan untuk Meja "+no+" sedang disiapkan.");
}
tabs();list();summary();
