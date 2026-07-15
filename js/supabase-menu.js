/* ===========================================================================
   VLADIMIR SMASH — meniu LIVE din POS (Supabase)
   Citește produsele, categoriile și stocul scrise de SmashPOS în tabela
   `pos_store` (cheile pos_products / pos_cats / pos_stock) și le mapează în
   forma așteptată de site. Se actualizează în timp real (realtime).
   Dacă nu există date sau cloud-ul nu răspunde, site-ul păstrează meniul local.
   =========================================================================== */
(function(){
  "use strict";
  const D = window.VLADIMIR;
  const sb = D.sb;
  if(!sb || !D.SB) return; // fără Supabase → rămâne meniul din data.js
  const RID = D.SB.restaurantId;

  /* — conversii de unități, identice cu POS-ul — */
  function convertQty(qty, rU, sU){
    const G = {g:1, kg:1000}, ML = {ml:1, l:1000};
    if(['g','kg'].includes(rU) && ['g','kg'].includes(sU)) return qty * G[rU] / G[sU];
    if(['ml','l'].includes(rU) && ['ml','l'].includes(sU)) return qty * ML[rU] / ML[sU];
    return qty;
  }

  /* Un produs e „epuizat" dacă e marcat indisponibil în POS sau dacă un
     ingredient din rețetă nu mai are stoc suficient pentru o porție. */
  function isSoldOut(prod, stock){
    if(prod.available === false) return true;
    const recipe = prod.recipe || [];
    for(const r of recipe){
      const ing = stock && stock[r.ing];
      if(!ing) continue;                       // ingredient necunoscut → nu blocăm
      const need = convertQty(r.qty, r.unit, ing.unit);
      if((Number(ing.qty)||0) < need) return true;
    }
    return false;
  }

  async function fetchStore(){
    const { data, error } = await sb
      .from('pos_store')
      .select('store_key,value')
      .eq('restaurant_id', RID)
      .in('store_key', ['pos_products','pos_cats','pos_stock']);
    if(error){ console.warn('[VS meniu] Eroare Supabase:', error.message); return null; }
    const map = {};
    (data || []).forEach(r => { map[r.store_key] = r.value; });
    return map;
  }

  function applyStore(store){
    if(!store) return false;
    // Supabase JSONB poate returna string sau object — parseăm dacă e string
    const parseVal = v => { if(!v) return v; if(typeof v === 'string'){try{return JSON.parse(v)}catch{return v}} return v; };
    const posCats  = parseVal(store.pos_cats);
    const posProds = parseVal(store.pos_products);
    const stock    = parseVal(store.pos_stock) || {};
    if(!Array.isArray(posCats) || !Array.isArray(posProds)) return false;
    if(!posProds.length) return false;

    const prods = posProds.map(p => ({
      id:   String(p.id),
      cat:  String(p.cat),
      name: p.name || 'Produs',
      price: Number(p.price) || 0,
      from: false,
      tags: [],
      desc: p.desc || '',
      allergens: p.allergens || '',
      img:  p.img || null,
      imgZoom: p.imgZoom || 1.18,
      imgOffsetY: p.imgOffsetY || 0,
      soldOut: isSoldOut(p, stock)
    }));

    // doar categoriile care chiar au produse, în ordinea din POS
    const used = new Set(prods.map(p => p.cat));
    const cats = posCats
      .map(c => ({ id:String(c.id), name:c.name || '', sub:'', emojiless:(c.name||'').toUpperCase() }))
      .filter(c => used.has(c.id));
    if(!cats.length) return false;

    D.categories = cats;
    D.products   = prods;
    D.upsellOrder = cats.map(c => c.id);

    if(D.api && typeof D.api.reloadMenu === 'function') D.api.reloadMenu();
    console.log('[VS meniu] Meniu live încărcat din POS:', prods.length, 'produse,', cats.length, 'categorii.');
    return true;
  }

  let loading = false;
  async function load(){
    if(loading) return;
    loading = true;
    try { applyStore(await fetchStore()); }
    finally { loading = false; }
  }

  // încărcare inițială (app.js a rulat deja și a expus api.reloadMenu)
  load();

  // realtime: orice schimbare în pos_store pentru acest restaurant → reîncarcă meniul
  try {
    sb.channel('vs-menu-' + RID)
      .on('postgres_changes',
        { event:'*', schema:'public', table:'pos_store', filter:'restaurant_id=eq.' + RID },
        () => load())
      .subscribe();
  } catch(e){ /* realtime e opțional — fără el meniul tot se încarcă la refresh */ }
})();
