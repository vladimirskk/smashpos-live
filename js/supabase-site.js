/* ===========================================================================
   VLADIMIR SMASH — imagini site salvate în Supabase Storage
   Hero + About photo persistă în cloud → pe orice device, după orice refresh.
   =========================================================================== */
(function(){
  "use strict";
  const D   = window.VLADIMIR;
  const sb  = D.sb;
  const RID = D.SB ? D.SB.restaurantId : 'vladimirsmash';
  const BUCKET    = 'product-images';
  const HERO_KEY  = 'site_hero_image';
  const ABOUT_KEY = 'site_about_image';

  /* ── Aplică imaginea în hero ── */
  function applyHeroImage(url){
    if(!url) return;
    const media  = document.querySelector('.hero-media');
    const poster = document.querySelector('#heroPoster');
    const hint   = document.querySelector('#heroPlayHint');
    if(!media) return;
    media.style.backgroundImage    = 'url(' + JSON.stringify(url) + ')';
    media.style.backgroundSize     = 'cover';
    media.style.backgroundPosition = 'center';
    media.style.backgroundRepeat   = 'no-repeat';
    if(poster) poster.style.opacity = '0';
    if(hint)   hint.style.display  = 'none';
    localStorage.setItem('vs_hero_img', url);
  }

  /* ── Aplică imaginea în about ── */
  function applyAboutImage(url){
    if(!url) return;
    const slot = document.querySelector('#about-photo');
    if(!slot) return;
    let overlay = document.querySelector('.vs-about-img');
    if(!overlay){
      overlay = document.createElement('img');
      overlay.className = 'vs-about-img';
      overlay.alt = 'Restaurant Vladimir Smash';
      overlay.style.cssText =
        'position:absolute;inset:0;width:100%;height:100%;' +
        'object-fit:cover;border-radius:30px;pointer-events:none;z-index:2;display:block;';
      slot.style.opacity = '0';
      const wrap = slot.parentElement;
      wrap.style.position = 'relative';
      wrap.insertBefore(overlay, slot);
    }
    overlay.src = url;
    localStorage.setItem('vs_about_img', url);
  }

  /* ── Încarcă la pornire (cache → Supabase) ── */
  // Curăță URL-uri invalide (ex. rămase din teste)
  function validUrl(u){ return u && u.startsWith('https://') && !u.includes('example.com'); }
  var cachedHero  = localStorage.getItem('vs_hero_img');
  var cachedAbout = localStorage.getItem('vs_about_img');
  if(cachedHero  && !validUrl(cachedHero))  { localStorage.removeItem('vs_hero_img');  cachedHero  = null; }
  if(cachedAbout && !validUrl(cachedAbout)) { localStorage.removeItem('vs_about_img'); cachedAbout = null; }
  if(cachedHero)  applyHeroImage(cachedHero);
  if(cachedAbout) applyAboutImage(cachedAbout);

  // Citește pozele din Supabase Storage (fișiere text — fără pos_store, fără RLS)
  var SB_PUB = D.SB.url + '/storage/v1/object/public/' + BUCKET;
  var nc = '?nc=' + Date.now();
  fetch(SB_PUB + '/site/hero-url.txt' + nc)
    .then(function(r){ return r.ok ? r.text() : null; })
    .then(function(u){ if(u && u.startsWith('http')) applyHeroImage(u.trim()); })
    .catch(function(){});
  fetch(SB_PUB + '/site/about-url.txt' + nc)
    .then(function(r){ return r.ok ? r.text() : null; })
    .then(function(u){ if(u && u.startsWith('http')) applyAboutImage(u.trim()); })
    .catch(function(){});

  /* ── Upload generic în Supabase ── */
  async function uploadImage(file, storagePath, storeKey, applyFn, btnEl){
    if(!file || !file.type.startsWith('image/')) return;
    if(!sb){ alert('Supabase indisponibil.'); return; }
    if(btnEl) btnEl.setAttribute('data-loading','1');
    try{
      const ext  = (file.name.split('.').pop() || 'jpg').toLowerCase().replace(/[^a-z0-9]/g,'');
      const path = storagePath + '.' + ext;
      const { error } = await sb.storage.from(BUCKET).upload(path, file,
        { upsert: true, contentType: file.type });
      if(error){
        console.error('[VS] Upload error:', error);
        alert('Eroare upload: ' + error.message);
        return;
      }
      const { data } = sb.storage.from(BUCKET).getPublicUrl(path);
      const url = data.publicUrl;
      applyFn(url);
      await sb.from('pos_store').upsert(
        { restaurant_id: RID, store_key: storeKey, value: url, updated_at: new Date().toISOString() },
        { onConflict: 'restaurant_id,store_key' }
      ).catch(function(){});
      console.log('[VS] Poză salvată:', url);
    } catch(e){
      console.error('[VS] Upload exception:', e);
      alert('Eroare: ' + e.message);
    } finally {
      if(btnEl) btnEl.removeAttribute('data-loading');
    }
  }

  /* ── Setup zonă drag & drop hero ── */
  function setupHeroDrop(){
    const zone = document.querySelector('#heroDrop');
    if(!zone) return;
    var depth = 0;
    zone.addEventListener('dragenter', function(e){
      e.preventDefault(); depth++;
      document.querySelector('.hero-media').classList.add('drop-over');
    });
    zone.addEventListener('dragover', function(e){
      e.preventDefault();
      if(e.dataTransfer) e.dataTransfer.dropEffect = 'copy';
    });
    zone.addEventListener('dragleave', function(){
      if(--depth <= 0){ depth = 0; document.querySelector('.hero-media').classList.remove('drop-over'); }
    });
    zone.addEventListener('drop', function(e){
      e.preventDefault(); depth = 0;
      document.querySelector('.hero-media').classList.remove('drop-over');
      const f = e.dataTransfer && e.dataTransfer.files && e.dataTransfer.files[0];
      if(f) uploadImage(f, 'site/hero', HERO_KEY, applyHeroImage, null);
    });
  }

  /* ── Funcție globală pentru butonul hero din HTML ── */
  window.VS_heroFile = function(input){
    const f = input.files && input.files[0];
    if(!f) return;
    const txt = document.getElementById('heroUploadTxt');
    if(txt) txt.textContent = 'Se încarcă…';
    uploadImage(f, 'site/hero', HERO_KEY, applyHeroImage, null).then(function(){
      if(txt) txt.textContent = 'Schimbă poza';
    }).catch(function(){
      if(txt) txt.textContent = 'Schimbă poza';
    });
    input.value = '';
  };

  /* ── Helper: creează input file off-screen ── */
  function makeFileInput(accept, onChange){
    const inp = document.createElement('input');
    inp.type = 'file';
    inp.accept = accept;
    inp.style.cssText = 'position:fixed;top:-200px;left:-200px;opacity:0;width:1px;height:1px;';
    inp.addEventListener('change', function(){
      const f = inp.files && inp.files[0];
      if(f) onChange(f);
      inp.value = '';
    });
    document.body.appendChild(inp);
    return inp;
  }

  /* ── Helper: creează buton upload ── */
  function makeUploadBtn(cls, txt, onFile){
    const inp = makeFileInput('image/*', onFile);
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = cls;
    btn.innerHTML =
      '<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2">' +
      '<path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/>' +
      '<circle cx="12" cy="13" r="4"/></svg>' +
      '<span class="hub-txt">' + txt + '</span>' +
      '<span class="hub-load" style="display:none">Se încarcă…</span>';
    btn.addEventListener('click', function(){ inp.click(); });
    btn._setLoading = function(on){
      btn.querySelector('.hub-txt').style.display  = on ? 'none' : '';
      btn.querySelector('.hub-load').style.display = on ? ''     : 'none';
      btn.disabled = on;
    };
    return btn;
  }

  /* ── Buton schimbare poză Despre ── */
  function injectAboutUpload(){
    const wrap = document.querySelector('.about-media');
    if(!wrap || wrap.querySelector('.about-upload-btn')) return;
    const btn = makeUploadBtn('about-upload-btn', 'Schimbă poza', function(f){
      btn._setLoading(true);
      uploadImage(f, 'site/about', ABOUT_KEY, applyAboutImage, btn)
        .finally(function(){ btn._setLoading(false); });
    });
    btn.title = 'Schimbă poza din secțiunea Despre';
    wrap.appendChild(btn);
  }

  /* ── Încarcă texte din Supabase și le aplică pe site ── */
  var TEXT_KEYS = [
    'site_hero_badge','site_hero_title','site_hero_sub',
    'site_about_eyebrow','site_about_h2',
    'site_about_p1','site_about_p2','site_about_p3','site_about_sign',
    'site_feat1_title','site_feat1_desc',
    'site_feat2_title','site_feat2_desc',
    'site_feat3_title','site_feat3_desc',
    'site_stat1_num','site_stat1_lbl',
    'site_stat2_num','site_stat2_lbl',
    'site_stat3_num','site_stat3_lbl',
    'site_rev_eyebrow','site_rev_h2',
    'site_footer_desc',
    'site_contact_address','site_contact_phone','site_contact_hours',
    'site_btn_call','site_btn_checkout','site_btn_order',
    'site_checkout_title','site_checkout_sub'
  ];

  function applyTexts(){
    if(!sb) return;
    sb.from('pos_store').select('store_key,value')
      .eq('restaurant_id', RID)
      .in('store_key', TEXT_KEYS)
      .then(function(res){
        if(!res.data) return;
        res.data.forEach(function(row){
          var el = document.querySelector('[data-site-key="' + row.store_key + '"]');
          if(!el || !row.value) return;
          var val = row.value;
          // Supabase JSONB poate returna string cu ghilimele extra — le scoatem
          if(typeof val === 'string' && val.startsWith('"') && val.endsWith('"')){
            try{ val = JSON.parse(val); }catch(e){}
          }
          val = String(val);
          if(!val) return;
          el.innerHTML = val.replace(/\n/g, '<br>');
        });
      }).catch(function(){});
  }

  /* ── Aplică culorile brandului din Supabase ── */
  function applyColors(){
    if(!sb) return;
    sb.from('pos_store').select('store_key,value')
      .eq('restaurant_id', RID)
      .in('store_key', ['site_color_primary','site_color_bg','site_color_btn'])
      .then(function(res){
        if(!res.data) return;
        res.data.forEach(function(row){
          var v = row.value;
          if(typeof v==='string'&&v.startsWith('"')&&v.endsWith('"')){try{v=JSON.parse(v)}catch{}}
          v = String(v||'');
          if(!v) return;
          if(row.store_key==='site_color_primary') document.documentElement.style.setProperty('--blue', v);
          if(row.store_key==='site_color_bg')      document.documentElement.style.setProperty('--bg',   v);
        });
      }).catch(function(){});
  }

  if(document.readyState === 'loading'){
    document.addEventListener('DOMContentLoaded', function(){
      setupHeroDrop();
      applyTexts();
      applyColors();
    });
  } else {
    setupHeroDrop();
    applyTexts();
    applyColors();
  }
})();
