/* ===========================================================================
   VLADIMIR SMASH — logică site
   =========================================================================== */
(function(){
  "use strict";
  const D = window.VLADIMIR;
  const $  = (s, r=document) => r.querySelector(s);
  const $$ = (s, r=document) => [...r.querySelectorAll(s)];

  /* Modul admin — vizibil doar când URL conține ?admin=1 (doar pentru owner) */
  const isAdmin = new URLSearchParams(location.search).get('admin') === '1';
  if(isAdmin) document.body.classList.add('admin-mode');
  const RON = n => n.toLocaleString('ro-RO', {minimumFractionDigits:2, maximumFractionDigits:2}) + ' lei';
  const RONshort = n => Math.round(n) + ' lei';

  /* ====================== INTRO ====================== */
  (function intro(){
    const intro = $('#intro');
    const nameEl = $('#introName');
    const word = 'VLADIMIR'.split('');
    const word2 = 'SMASH'.split('');
    let html = '';
    word.forEach((c,i)=> html += `<span style="animation-delay:${.35 + i*.05}s">${c}</span>`);
    html += `<span style="width:.35em"></span>`;
    word2.forEach((c,i)=> html += `<span class="sm" style="animation-delay:${.75 + i*.06}s">${c}</span>`);
    nameEl.innerHTML = html;

    const seen = sessionStorage.getItem('vs_intro');
    function close(){
      intro.classList.add('done');
      document.body.classList.add('hero-revealed');
      setTimeout(()=> intro.remove(), 950);
    }
    if(seen){ intro.remove(); document.body.classList.add('hero-revealed'); return; }
    sessionStorage.setItem('vs_intro','1');
    $('#introSkip').addEventListener('click', close);
    setTimeout(close, 2600);
  })();

  /* ====================== HERO: parallax la scroll ====================== */
  (function heroParallax(){
    const hero = $('#hero');
    const logo = $('#heroLogo');
    const content = $('#heroContent');
    if(!hero) return;
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if(reduce) return;
    // Parallax fluid: dacă browserul suportă animații conduse de scroll (CSS),
    // lăsăm CSS-ul să le facă pe compozitor — perfect fluid, inclusiv pe mobil.
    const cssDriven = !!(window.CSS && CSS.supports && CSS.supports('animation-timeline','scroll()'));
    const coarse = window.matchMedia('(pointer: coarse)').matches;
    // Pe touch fără suport CSS, dezactivăm parallax-ul JS — scroll-ul nativ
    // rămâne fin, fără salturi din cauza întârzierii firului principal.
    if(cssDriven || coarse) return;
    let ticking = false;
    let lastY = -1;
    function update(){
      const y = window.scrollY;
      ticking = false;
      if(y === lastY) return;                      // sari peste cadre redundante
      lastY = y;
      const h = hero.offsetHeight || window.innerHeight;
      const p = Math.min(y / h, 1.2);              // progres 0..1+
      // logo-ul rămâne fix sus pe poză (doar plutește) — fără parallax la scroll
      // textul „we love smash burger" alunecă mai repede în jos
      if(content){
        content.style.transform = `translate3d(0, ${y * 0.32}px, 0)`;
        content.style.opacity = String(Math.max(0, 1 - p*0.9));
      }
    }
    window.addEventListener('scroll', ()=>{
      if(!ticking){ requestAnimationFrame(update); ticking = true; }
    }, {passive:true});
    update();
  })();

  /* ====================== HERO: editor text + media ====================== */
  (function hero(){
    const overlays = $('#heroOverlays');
    const poster = $('#heroPoster');
    const slot = $('#hero-media');
    // ascunde posterul când se pune o poză/video
    if(slot){
      const sync = ()=> poster.classList.toggle('hidden', slot.hasAttribute('data-filled'));
      new MutationObserver(sync).observe(slot, {attributes:true, attributeFilter:['data-filled']});
      sync();
    }
  })();

  /* ====================== MARQUEE ====================== */
  (function marquee(){
    const items = [
      'Cei mai buni smash burgeri din Baia Mare',
      'Chiflă Martin\'s adusă din State',
      'Carne de vită 100%, niciodată congelată',
      'Cartofi proaspăt tăiați zilnic',
      'Livrare rapidă la domiciliu',
      'Smash după smash'
    ];
    const track = $('#marquee');
    const set = items.map(t=>`<span>${t}</span>`).join('');
    track.innerHTML = set + set; // duplicat pentru loop continuu
  })();

  /* ====================== STARE COȘ ====================== */
  const CART_KEY = 'vs_cart';
  let cart = JSON.parse(localStorage.getItem(CART_KEY) || '[]');
  let fulfill = 'delivery';
  let payMethod = 'cash';
  const saveCart = ()=> localStorage.setItem(CART_KEY, JSON.stringify(cart));
  const cartCount = ()=> cart.reduce((s,i)=>s+i.qty,0);
  const cartSubtotal = ()=> cart.reduce((s,i)=>s+i.price*i.qty,0);
  function deliveryFee(){
    if(fulfill==='pickup') return 0;
    const sub = cartSubtotal();
    if(sub===0) return 0;
    return D.business.delivery[0].fee; // implicit Zona 1
  }
  const prodById = id => D.products.find(p=>p.id===id);

  function addToCart(id, qty, note){
    qty = qty || 1;
    const key = id + '|' + (note||'');
    const existing = cart.find(i=>i.key===key);
    if(existing) existing.qty += qty;
    else {
      const p = prodById(id);
      cart.push({ key, id, name:p.name, price:p.price, qty, note: note||'' });
    }
    saveCart(); renderCart(); bumpBadge();
  }
  function setQty(key, q){
    const it = cart.find(i=>i.key===key);
    if(!it) return;
    it.qty = q;
    if(it.qty<=0) cart = cart.filter(i=>i.key!==key);
    saveCart(); renderCart();
  }

  /* ====================== CATEGORII + PRODUSE ====================== */
  let activeCat = D.categories[0].id;
  let activeIndex = 0;
  const catScroll = $('#catScroll');
  const rail = $('#productRail');
  const railDots = $('#railDots');

  // construiește pills categorii (reutilizabil — se reapelează la reload din POS)
  function buildCatPills(){
    catScroll.innerHTML = '';
    D.categories.forEach((c,i)=>{
      const b = document.createElement('button');
      b.className = 'cat-pill';
      b.setAttribute('role','tab');
      b.setAttribute('aria-selected', i===0 ? 'true':'false');
      b.dataset.cat = c.id;
      b.innerHTML = `<span class="glider"></span>${c.name}`;
      b.addEventListener('click', ()=> selectCat(c.id, true));
      catScroll.appendChild(b);
    });
  }
  buildCatPills();

  // reîncarcă meniul când vine din Supabase (POS = sursa de adevăr)
  function reloadMenu(){
    if(!Array.isArray(D.categories) || !D.categories.length) return;
    if(!D.categories.find(c=>c.id===activeCat)) activeCat = D.categories[0].id;
    buildCatPills();
    selectCat(activeCat, false);
  }

  function catProducts(cat){ return D.products.filter(p=>p.cat===cat); }

  function selectCat(cat, scrollIntoView){
    activeCat = cat;
    activeIndex = 0;
    const c = D.categories.find(x=>x.id===cat);
    const ct = $('#catTitle'); if(ct) ct.textContent = c.name;
    const cs = $('#catSub'); if(cs) cs.textContent = c.sub;
    $$('.cat-pill', catScroll).forEach(p=> p.setAttribute('aria-selected', p.dataset.cat===cat ? 'true':'false'));
    if(scrollIntoView){
      const active = $('.cat-pill[aria-selected="true"]', catScroll);
      if(active) catScroll.scrollTo({left: active.offsetLeft - catScroll.clientWidth/2 + active.clientWidth/2, behavior:'smooth'});
    }
    renderProducts();
  }

  function tagClass(t){ return /picant/i.test(t) ? 'pc-tag hot' : 'pc-tag'; }

  /* zoom per produs (persistă în localStorage) — pentru poze unde burgerul e mic */
  const ZOOM_KEY = 'vs_prod_zoom';
  const OFFSET_KEY = 'vs_prod_offset';
  let zoomMap = JSON.parse(localStorage.getItem(ZOOM_KEY) || '{}');
  let offsetMap = JSON.parse(localStorage.getItem(OFFSET_KEY) || '{}');
  const getZoom = id => zoomMap[id] || 1.18;
  const getOffset = id => offsetMap[id] ?? 0;
  function applyTransform(id){
    const slot = rail.querySelector(`#prod-${CSS.escape(id)}`);
    if(slot) slot.style.transform = `scale(${getZoom(id)}) translateY(${getOffset(id)}%)`;
  }
  // Salvează zoom/offset în Supabase pos_products
  let _saveTimer = null;
  function saveToSupabase(id, zoom, offsetY){
    clearTimeout(_saveTimer);
    _saveTimer = setTimeout(async ()=>{
      try{
        const D = window.VLADIMIR;
        if(!D || !D.sb) return;
        const sb = D.sb;
        const RID = D.SB ? D.SB.restaurantId : 'vladimirsmash';
        const {data} = await sb.from('pos_store')
          .select('value').eq('restaurant_id', RID).eq('store_key','pos_products').single();
        if(!data) return;
        const prods = JSON.parse(typeof data.value==='string' ? data.value : JSON.stringify(data.value));
        const updated = prods.map(p => p.id===id ? {...p, imgZoom:zoom, imgOffsetY:offsetY} : p);
        await sb.from('pos_store').update({value: JSON.stringify(updated), updated_at: new Date().toISOString()})
          .eq('restaurant_id', RID).eq('store_key','pos_products');
      }catch(e){ console.warn('save transform:', e.message); }
    }, 800);
  }
  function setZoom(id, z){
    z = Math.max(.6, Math.min(2.6, Math.round(z*100)/100));
    zoomMap[id] = z;
    localStorage.setItem(ZOOM_KEY, JSON.stringify(zoomMap));
    applyTransform(id);
    saveToSupabase(id, z, getOffset(id));
  }
  function setOffset(id, y){
    y = Math.max(-40, Math.min(40, Math.round(y)));
    offsetMap[id] = y;
    localStorage.setItem(OFFSET_KEY, JSON.stringify(offsetMap));
    applyTransform(id);
    saveToSupabase(id, getZoom(id), y);
  }

  function renderProducts(){
    const list = catProducts(activeCat);
    const cc = $('#catCounter'); if(cc) cc.textContent = `${list.length} produse`;
    rail.innerHTML = '';
    list.forEach((p, idx)=>{
      const card = document.createElement('article');
      card.className = 'product-card' + (p.soldOut ? ' sold-out' : '');
      card.dataset.idx = idx;
      const tags = (p.tags||[]).map(t=>`<span class="${tagClass(t)}">${t}</span>`).join('');
      const zoom = p.imgZoom || getZoom(p.id);
      const offsetY = p.imgOffsetY ?? getOffset(p.id);
      card.innerHTML = `
        <div class="pc-media">
          ${p.img
            ? `<img src="${p.img}" class="pc-prod-img" alt="${p.name}" loading="${idx===0?'eager':'lazy'}" decoding="async" style="transform:scale(${zoom}) translateY(${offsetY}%)">`
            : `<image-slot id="prod-${p.id}" shape="rect" fit="contain" placeholder="Trage poza burgerului" style="transform:scale(${zoom}) translateY(${offsetY}%)"></image-slot>`
          }
          <div class="pc-price-float"><span class="num">${p.price}</span><span class="cur">lei</span></div>
          ${p.soldOut ? '<div class="pc-sold">Stoc epuizat</div>' : ''}
          <div class="pc-zoom" data-zoom="${p.id}">
            <button data-zstep="-1" aria-label="Micșorează">–</button>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="7"/><path d="M21 21l-4.3-4.3"/></svg>
            <button data-zstep="1" aria-label="Mărește">+</button>
            <span style="width:1px;height:18px;background:rgba(0,0,0,.12);margin:0 2px"></span>
            <button data-ystep="-5" aria-label="Sus" style="font-size:14px">↑</button>
            <button data-ystep="5" aria-label="Jos" style="font-size:14px">↓</button>
          </div>
        </div>
        <div class="pc-info">
          <div class="pc-tags">${tags}</div>
          <h3 class="pc-name">${p.name}</h3>
          <p class="pc-desc">${p.desc||''}</p>
          ${p.allergens?`<p class="pc-allergens"><span class="al-icon">⚠️</span> <strong>Alergeni:</strong> ${p.allergens}</p>`:''}
          <div class="pc-note">
            <svg class="pen" viewBox="0 0 24 24" fill="none" stroke="#888" stroke-width="2"><path d="M12 20h9"/><path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4z"/></svg>
            <input type="text" placeholder="Notă (ex: fără ceapă, extra sos...)" data-note="${p.id}">
          </div>
          <div class="pc-actions">
            <div class="qty" data-qty="${p.id}">
              <button data-step="-1" aria-label="Mai puțin">–</button>
              <span>1</span>
              <button data-step="1" aria-label="Mai mult">+</button>
            </div>
            <button class="btn btn-add" data-add="${p.id}"${p.soldOut?' disabled':''}>${p.soldOut ? 'Indisponibil' : 'Adaugă în coș · ' + RONshort(p.price)}</button>
          </div>
        </div>`;
      rail.appendChild(card);
    });

    // dots
    railDots.innerHTML = list.map((_,i)=>`<button data-dot="${i}" class="${i===0?'on':''}" aria-label="Produs ${i+1}"></button>`).join('');
    activeIndex = 0;
    requestAnimationFrame(()=>{ rail.scrollLeft = 0; markActiveCard(); });
    updateArrows();
  }

  // interacțiuni delegate pe rail
  rail.addEventListener('click', e=>{
    const addBtn = e.target.closest('[data-add]');
    if(addBtn){
      const id = addBtn.dataset.add;
      const qtyEl = rail.querySelector(`[data-qty="${id}"] span`);
      const noteEl = rail.querySelector(`[data-note="${id}"]`);
      const qty = parseInt(qtyEl.textContent,10)||1;
      addToCart(id, qty, noteEl.value.trim());
      flyToCart(addBtn);
      openUpsell(id);
      qtyEl.textContent = '1'; noteEl.value='';
      return;
    }
    const step = e.target.closest('[data-step]');
    if(step){
      const span = step.parentElement.querySelector('span');
      let v = parseInt(span.textContent,10)||1;
      v = Math.max(1, v + parseInt(step.dataset.step,10));
      span.textContent = v;
      return;
    }
    const q = e.target.closest('[data-q]');
    if(q){
      const input = q.closest('.pc-note').querySelector('input');
      const val = q.dataset.q;
      const parts = input.value.split(',').map(s=>s.trim()).filter(Boolean);
      if(parts.includes(val)){ input.value = parts.filter(p=>p!==val).join(', '); q.style.color=''; q.style.borderColor=''; }
      else { parts.push(val); input.value = parts.join(', '); q.style.color='var(--blue)'; q.style.borderColor='var(--blue-300)'; }
      return;
    }
    const dot = e.target.closest('[data-dot]');
    if(dot){ goToProduct(parseInt(dot.dataset.dot,10)); }
    const y = e.target.closest('[data-ystep]');
    if(y){ const wrap2=y.closest('[data-zoom]'); setOffset(wrap2.dataset.zoom, getOffset(wrap2.dataset.zoom)+parseInt(y.dataset.ystep,10)); e.stopPropagation(); }
    const z = e.target.closest('[data-zstep]');
    if(z){
      const wrap = z.closest('[data-zoom]');
      const id = wrap.dataset.zoom;
      setZoom(id, getZoom(id) + parseInt(z.dataset.zstep,10)*0.12);
      e.stopPropagation();
    }
  });

  // swipe / scroll → actualizează dots + animație card activ
  let scrollT;
  let progRail = false;
  rail.addEventListener('scroll', ()=>{
    clearTimeout(scrollT);
    if(!progRail) dismissCoach();
    scrollT = setTimeout(()=>{
      const idx = nearestIndex();
      if(idx!==activeIndex){ activeIndex = idx; syncDots(); updateArrows(); }
      markActiveCard();
    }, 60);
  }, {passive:true});

  // coach „Swipe" — apare când produsele intră pe ecran, dispare la prima interacțiune
  let coachDone = false;
  function dismissCoach(){
    if(coachDone) return;
    coachDone = true;
    const c = $('#swipeCoach');
    if(c){ c.classList.remove('show'); c.classList.add('gone'); }
  }
  ['pointerdown','touchstart','wheel'].forEach(ev=>
    rail.addEventListener(ev, dismissCoach, {passive:true}));
  $('#prevProd') && $('#prevProd').addEventListener('click', dismissCoach);
  $('#nextProd') && $('#nextProd').addEventListener('click', dismissCoach);

  // Când raftul de produse intră pe ecran: arată coach-ul + dă un nudge real
  let prodHinted = false;
  const prodIO = new IntersectionObserver((entries)=>{
    entries.forEach(en=>{
      if(en.isIntersecting && !prodHinted){
        prodHinted = true;
        const c = $('#swipeCoach');
        if(c && !coachDone) c.classList.add('show');
        const max = rail.scrollWidth - rail.clientWidth;
        if(max > 8){
          const peek = Math.min(60, max);
          const prevSnap = rail.style.scrollSnapType;
          progRail = true;
          rail.style.scrollSnapType = 'none';
          setTimeout(()=> rail.scrollTo({left:peek, behavior:'smooth'}), 600);
          setTimeout(()=> rail.scrollTo({left:0,    behavior:'smooth'}), 1250);
          setTimeout(()=> rail.scrollTo({left:peek, behavior:'smooth'}), 1850);
          setTimeout(()=> rail.scrollTo({left:0,    behavior:'smooth'}), 2500);
          setTimeout(()=> { rail.style.scrollSnapType = prevSnap || ''; progRail = false; }, 2900);
        }
        // dacă userul nu interacționează deloc, ascunde după un timp generos
        setTimeout(dismissCoach, 11000);
      }
    });
  }, {threshold:.45});
  const prodEl = document.querySelector('.products');
  if(prodEl) prodIO.observe(prodEl);

  // Hint categorii: ascunde chevron-ul când userul a derulat bara
  let catHintDone = false;
  let progCat = false;
  function dismissCatHint(){
    if(catHintDone) return;
    catHintDone = true;
    const h = $('#catHint'); if(h) h.classList.add('gone');
  }
  catScroll.addEventListener('scroll', ()=>{
    if(progCat) return;
    if(catScroll.scrollLeft > 6) dismissCatHint();
  }, {passive:true});
  // dacă bara nu e deloc derulabilă (ecran lat), ascunde hint-ul
  requestAnimationFrame(()=>{
    if(catScroll.scrollWidth - catScroll.clientWidth < 8) dismissCatHint();
  });

  // La intrarea meniului în ecran: nudge o-singură-dată pe bara de categorii
  let menuHinted = false;
  const menuIO = new IntersectionObserver((entries)=>{
    entries.forEach(en=>{
      if(en.isIntersecting && !menuHinted){
        menuHinted = true;
        const max = catScroll.scrollWidth - catScroll.clientWidth;
        if(max > 8){
          // nudge real prin scroll: arată categoriile ascunse, apoi revine
          const peek = Math.min(64, max);
          progCat = true;
          setTimeout(()=> catScroll.scrollTo({left:peek, behavior:'smooth'}), 250);
          setTimeout(()=> catScroll.scrollTo({left:0,    behavior:'smooth'}), 900);
          setTimeout(()=> catScroll.scrollTo({left:peek, behavior:'smooth'}), 1450);
          setTimeout(()=> { catScroll.scrollTo({left:0, behavior:'smooth'}); }, 2050);
          setTimeout(()=> { progCat = false; }, 2500);
        } else { dismissCatHint(); }
      }
    });
  }, {threshold:.35});
  const menuSec = document.getElementById('meniu');
  if(menuSec) menuIO.observe(menuSec);

  // Bara de comandă fixă: ascunsă cât timp suntem pe hero (lasă loc cue-ului
  // „Derulează pentru meniu"), apare la coborâre.
  (function orderBarToggle(){
    const bar = document.querySelector('.order-bar');
    const heroEl = document.getElementById('hero') || document.querySelector('.hero');
    if(!bar || !heroEl) return;
    const io = new IntersectionObserver((ents)=>{
      ents.forEach(e=> bar.classList.toggle('hidden', e.isIntersecting && e.intersectionRatio > 0.45));
    }, {threshold:[0,.45,.9]});
    io.observe(heroEl);
  })();

  function markActiveCard(){
    $$('.product-card', rail).forEach((c,i)=> c.classList.toggle('enter', i===activeIndex));
  }
  function syncDots(){
    $$('[data-dot]', railDots).forEach((d,i)=> d.classList.toggle('on', i===activeIndex));
  }
  function goToProduct(i){
    const cards = $$('.product-card', rail);
    const max = cards.length-1;
    activeIndex = Math.max(0, Math.min(max, i));
    const card = cards[activeIndex];
    if(card){
      const left = card.offsetLeft - (rail.clientWidth - card.offsetWidth)/2;
      rail.scrollTo({left: Math.max(0,left), behavior:'smooth'});
    }
    syncDots(); updateArrows();
  }
  // index activ = cardul cu centrul cel mai aproape de centrul ecranului
  // (robust la layout-ul „peek", unde lățimea cardului ≠ lățimea ecranului)
  function nearestIndex(){
    const cards = $$('.product-card', rail);
    const center = rail.scrollLeft + rail.clientWidth/2;
    let best=0, bestD=Infinity;
    cards.forEach((c,i)=>{ const cc=c.offsetLeft+c.offsetWidth/2; const d=Math.abs(cc-center); if(d<bestD){bestD=d;best=i;} });
    return best;
  }
  function updateArrows(){
    const max = catProducts(activeCat).length-1;
    $('#prevProd').disabled = activeIndex<=0;
    $('#nextProd').disabled = activeIndex>=max;
  }
  $('#prevProd').addEventListener('click', ()=> goToProduct(activeIndex-1));
  $('#nextProd').addEventListener('click', ()=> goToProduct(activeIndex+1));
  // tastatură
  document.addEventListener('keydown', e=>{
    if(document.body.classList.contains('editing')) return;
    if(e.target.matches('input,textarea,[contenteditable="true"]')) return;
    if(e.key==='ArrowLeft') goToProduct(activeIndex-1);
    if(e.key==='ArrowRight') goToProduct(activeIndex+1);
  });

  /* ====================== FLY TO CART ====================== */
  function flyToCart(fromEl){
    const target = $('#navCart');
    const a = fromEl.getBoundingClientRect();
    const b = target.getBoundingClientRect();
    const fly = document.createElement('div');
    fly.className = 'fly';
    fly.innerHTML = '<img src="assets/logo-white.svg" alt="">';
    fly.style.left = (a.left + a.width/2 - 25) + 'px';
    fly.style.top  = (a.top + a.height/2 - 25) + 'px';
    document.body.appendChild(fly);
    const dx = (b.left + b.width/2) - (a.left + a.width/2);
    const dy = (b.top + b.height/2) - (a.top + a.height/2);
    fly.animate([
      { transform:'translate(0,0) scale(1)', opacity:1 },
      { transform:`translate(${dx*.5}px,${dy*.5 - 80}px) scale(.8)`, opacity:1, offset:.6 },
      { transform:`translate(${dx}px,${dy}px) scale(.2)`, opacity:.2 }
    ], { duration:750, easing:'cubic-bezier(.5,0,.6,1)' }).onfinish = ()=> fly.remove();
  }
  function bumpBadge(){
    const c = $('#cartCount');
    c.classList.remove('pulse'); void c.offsetWidth; c.classList.add('pulse');
  }

  /* ====================== RENDER COȘ ====================== */
  const cartDrawer = $('#cartDrawer');
  const cartScrim = $('#cartScrim');
  function openCart(){ cartDrawer.classList.add('open'); cartScrim.classList.add('open'); }
  function closeCart(){ cartDrawer.classList.remove('open'); cartScrim.classList.remove('open'); }
  $('#navCart').addEventListener('click', openCart);
  $('#closeCart').addEventListener('click', closeCart);
  cartScrim.addEventListener('click', closeCart);

  function renderCart(){
    const n = cartCount();
    $('#cartCount').textContent = n;
    const items = $('#cartItems');
    const foot = $('#cartFoot');

    if(cart.length===0){
      items.innerHTML = `<div class="cart-empty"><img src="assets/logo-gray.svg" alt=""><div><b>Coșul e gol</b><br><span style="font-size:.9rem">Alege un burger din meniu 🍔</span></div></div>`;
      foot.style.display='none';
      return;
    }
    foot.style.display='flex';
    items.innerHTML = cart.map(it=>`
      <div class="cart-line">
        <div class="thumb"><img class="ph-fallback" style="display:none"><img src="assets/logo-blue.svg" class="ph" alt=""></div>
        <div>
          <div class="cl-name">${it.name}</div>
          ${it.note ? `<div class="cl-note">📝 ${it.note}</div>`:''}
          <div class="cl-qty">
            <button data-dec="${it.key}" aria-label="Mai puțin">–</button>
            <b>${it.qty}</b>
            <button data-inc="${it.key}" aria-label="Mai mult">+</button>
          </div>
        </div>
        <div class="cl-right">
          <div class="cl-price">${RON(it.price*it.qty)}</div>
          <button class="cl-rm" data-rm="${it.key}">Șterge</button>
        </div>
      </div>`).join('');

    const sub = cartSubtotal();
    $('#cartSubtotal').textContent = RON(sub);
    $('#cartDelivery').textContent = fulfill==='pickup' ? 'Gratuit (ridicare)' : RON(deliveryFee());
    $('#cartDelivery').parentElement.querySelector('span').textContent = fulfill==='pickup' ? 'Livrare' : 'Livrare (Zona 1)';
    $('#cartTotal').textContent = RON(sub + deliveryFee());
  }
  $('#cartItems').addEventListener('click', e=>{
    const inc = e.target.closest('[data-inc]'); const dec = e.target.closest('[data-dec]'); const rm = e.target.closest('[data-rm]');
    if(inc){ const it=cart.find(i=>i.key===inc.dataset.inc); setQty(it.key, it.qty+1); }
    if(dec){ const it=cart.find(i=>i.key===dec.dataset.dec); setQty(it.key, it.qty-1); }
    if(rm){ setQty(rm.dataset.rm, 0); }
  });

  /* ====================== UPSELL ====================== */
  const upsellSheet = $('#upsellSheet');
  const upsellScrim = $('#upsellScrim');
  let upsellCat = null;
  function openUpsell(justAddedId){
    const p = prodById(justAddedId);
    $('#addedName').textContent = `„${p.name}" adăugat`;
    // tab-uri: categoriile recomandate, excluzând cea curentă dacă vrem variație
    const tabs = $('#upsellTabs');
    const order = D.upsellOrder.filter(c=> c!==p.cat);
    const cats = order.length ? order : D.upsellOrder;
    tabs.innerHTML = cats.map((c,i)=>{
      const cat = D.categories.find(x=>x.id===c);
      return `<button data-utab="${c}" class="${i===0?'on':''}">${cat.name}</button>`;
    }).join('');
    upsellCat = cats[0];
    renderUpsell();
    $('#upsellCount').textContent = cartCount();
    upsellSheet.classList.add('open'); upsellScrim.classList.add('open');
  }
  function renderUpsell(){
    const row = $('#upsellRow');
    const list = catProducts(upsellCat);
    row.innerHTML = list.map(p=>`
      <div class="upsell-card">
        <div class="um"><img src="assets/logo-blue.svg" class="ph" alt=""></div>
        <b>${p.name}</b>
        <div class="up-foot">
          <span class="up-price">${RONshort(p.price)}</span>
          <button class="up-add" data-uadd="${p.id}" aria-label="Adaugă">+</button>
        </div>
      </div>`).join('');
  }
  $('#upsellTabs').addEventListener('click', e=>{
    const t = e.target.closest('[data-utab]'); if(!t) return;
    upsellCat = t.dataset.utab;
    $$('#upsellTabs button').forEach(b=>b.classList.toggle('on', b===t));
    renderUpsell();
  });
  $('#upsellRow').addEventListener('click', e=>{
    const add = e.target.closest('[data-uadd]'); if(!add) return;
    addToCart(add.dataset.uadd, 1, '');
    $('#upsellCount').textContent = cartCount();
    add.textContent='✓'; add.style.background='var(--blue-700)';
    setTimeout(()=>{ add.textContent='+'; add.style.background=''; }, 700);
  });
  function closeUpsell(){ upsellSheet.classList.remove('open'); upsellScrim.classList.remove('open'); }
  $('#upsellSkip').addEventListener('click', closeUpsell);
  upsellScrim.addEventListener('click', closeUpsell);
  $('#upsellGoCart').addEventListener('click', ()=>{ closeUpsell(); openCart(); });

  /* ====================== CHECKOUT ====================== */
  const checkoutSheet = $('#checkoutSheet');
  const checkoutScrim = $('#checkoutScrim');
  function openCheckout(){
    if(cart.length===0) return;
    closeCart();
    renderCheckout();
    checkoutSheet.classList.add('open'); checkoutScrim.classList.add('open');
  }
  function closeCheckout(){ checkoutSheet.classList.remove('open'); checkoutScrim.classList.remove('open'); }
  $('#goCheckout').addEventListener('click', openCheckout);
  $('#checkoutBack').addEventListener('click', ()=>{ closeCheckout(); openCart(); });
  checkoutScrim.addEventListener('click', closeCheckout);

  function renderCheckout(){
    const sub = cartSubtotal();
    $('#checkSub').textContent = RON(sub);
    $('#checkDel').textContent = fulfill==='pickup' ? 'Gratuit' : RON(deliveryFee());
    $('#checkDelRow').style.display = fulfill==='pickup' ? 'none':'flex';
    $('#checkTot').textContent = RON(sub + deliveryFee());
    $('#addrBlock').style.display = fulfill==='pickup' ? 'none':'block';
  }
  // mod servire
  $('#fulfillSeg').addEventListener('click', e=>{
    const b = e.target.closest('[data-f]'); if(!b) return;
    fulfill = b.dataset.f;
    $$('#fulfillSeg button').forEach(x=>x.classList.toggle('on', x===b));
    renderCheckout(); renderCart();
  });
  // plată
  $('#payGrid').addEventListener('click', e=>{
    const b = e.target.closest('[data-pay]'); if(!b) return;
    payMethod = b.dataset.pay;
    $$('#payGrid button').forEach(x=>x.classList.toggle('on', x===b));
  });
  // plasează comanda → procesează plata → trimite în POS prin Supabase
  $('#placeOrder').addEventListener('click', async ()=>{
    const btn = $('#placeOrder');
    const name  = ($('#coName')  && $('#coName').value  || '').trim();
    const phone = ($('#coPhone') && $('#coPhone').value || '').trim();
    const addr  = ($('#coAddr')  && $('#coAddr').value  || '').trim();
    if(fulfill==='delivery'){
      if(!name || !phone || !addr){ toast('Completează nume, telefon și adresă pentru livrare.'); return; }
    } else {
      if(!phone){ toast('Lasă-ne un număr de telefon ca să te anunțăm când e gata.'); return; }
    }
    const sub = cartSubtotal();
    const fee = deliveryFee();
    const total = sub + fee;
    const origTxt = btn.textContent;
    btn.disabled = true;

    // ── Stripe payment (card / gpay / apple) ──────────────────
    if(payMethod !== 'cash' && window.VS_processPayment){
      btn.textContent = 'Se procesează plata…';
      const payResult = await window.VS_processPayment(total, payMethod);
      if(!payResult.ok){
        btn.disabled = false; btn.textContent = origTxt;
        toast('Plată eșuată: ' + (payResult.error || 'Încearcă din nou.'));
        return;
      }
    }
    // ──────────────────────────────────────────────────────────

    btn.textContent = 'Se trimite…';
    const payload = {
      customer_name: name, customer_phone: phone, address: addr,
      fulfillment: fulfill, payment: payMethod,
      items: cart.map(i=>({ id:i.id, name:i.name, price:i.price, qty:i.qty, note:i.note||'' })),
      subtotal: sub, delivery_fee: fee, total: total
    };
    btn.disabled = true; btn.textContent = 'Se trimite…';
    let res = { ok:false };
    try { res = D.sendOrder ? await D.sendOrder(payload) : { ok:false }; }
    catch(e){ res = { ok:false, error:e.message }; }
    btn.disabled = false; btn.textContent = origTxt;
    closeCheckout();
    if(res.ok){
      cart = []; saveCart(); renderCart();
      toast(`Comandă trimisă! Cod #${res.code}. Te sunăm pentru confirmare.`);
    } else {
      toast('Nu am putut trimite comanda. Sună-ne la 0746 027 011 și o preluăm pe loc.');
    }
  });

  /* ====================== TOAST ====================== */
  let toastT;
  function toast(msg){
    const t = $('#toast');
    $('#toastMsg').textContent = msg;
    t.style.display = '';
    t.classList.add('show');
    clearTimeout(toastT);
    toastT = setTimeout(()=>{ t.classList.remove('show'); t.style.display='none'; }, 4200);
  }

  /* ====================== REVIEWS ====================== */
  (function reviews(){
    const data = [
      { n:'Andrei P.', t:'Acum 2 zile', s:5, q:'Cel mai bun smash burger din Baia Mare, fără discuție. Carnea e perfect făcută și chifla e altceva.' },
      { n:'Maria C.', t:'Săptămâna trecută', s:5, q:'Am comandat Wow Bacon și cartofi cu cheddar. Totul cald, rapid și exact ca în poze. Recomand!' },
      { n:'Ștefan R.', t:'Acum 3 săptămâni', s:5, q:'Truffle Smash-ul e o nebunie. Gust premium la preț corect. Revin sigur.' },
      { n:'Ioana M.', t:'Luna trecută', s:5, q:'Livrare rapidă, ambalaj ok, burgerii suculenți. Băieții știu ce fac.' },
      { n:'Vlad T.', t:'Acum 2 luni', s:5, q:'Spicy Smash pentru cei care vor pe bune picant. Super!' },
      { n:'Diana L.', t:'Acum 2 luni', s:5, q:'Boom Royal Cheese — specialitatea casei chiar merită. Porție generoasă.' }
    ];
    const stars = s => '★★★★★'.slice(0,s) + '☆☆☆☆☆'.slice(0,5-s);
    $('#reviewGrid').innerHTML = data.map(r=>`
      <div class="glass review reveal">
        <div class="stars">${stars(r.s)}</div>
        <p>“${r.q}”</p>
        <div class="who">
          <span class="av">${r.n[0]}</span>
          <div><b>${r.n}</b><small>${r.t}</small></div>
        </div>
      </div>`).join('');
  })();

  /* ====================== PROGRAM + AN ====================== */
  (function footer(){
    $('#hoursList').innerHTML = D.business.hours.map(h=>`<li class="hrs"><span>${h.d}</span><span>${h.h}</span></li>`).join('');
    $('#year').textContent = new Date().getFullYear();
  })();

  /* ====================== SCROLL REVEAL ====================== */
  (function revealer(){
    const io = new IntersectionObserver((entries)=>{
      entries.forEach(en=>{ if(en.isIntersecting){ en.target.classList.add('in'); io.unobserve(en.target); } });
    }, {threshold:.15});
    const obs = ()=> $$('.reveal:not(.in)').forEach(el=> io.observe(el));
    obs();
    // re-observă elementele adăugate dinamic (reviews)
    setTimeout(obs, 100);
  })();

  /* ====================== INIT ====================== */
  selectCat(activeCat, false);
  renderCart();

  // smooth scroll doar pentru linkurile de ancoră (click), nu global —
  // scroll-behavior:smooth pe <html> făcea scroll-ul cu degetul săcadat pe Android.
  $$('a[href^="#"]:not([href="#"])').forEach(a=>{
    a.addEventListener('click', e=>{
      const t = document.querySelector(a.getAttribute('href'));
      if(t){ e.preventDefault(); t.scrollIntoView({behavior:'smooth', block:'start'}); }
    });
  });

  // expune pentru harta de livrare (map.js)
  window.VLADIMIR.api = { toast, reloadMenu };
})();
