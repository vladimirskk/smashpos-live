/* ===========================================================================
   VLADIMIR SMASH — Hartă zone de livrare (Leaflet + desenare poligoane)
   =========================================================================== */
(function(){
  "use strict";
  if(typeof L === 'undefined'){ console.warn('Leaflet indisponibil'); return; }
  const $ = s => document.querySelector(s);
  const KEY = 'vs_zones';
  const COLORS = ['#0017c0','#1f8a5b','#d98b2b','#9b2fae','#c0341f','#0e8aa8'];
  const center = [47.6573, 23.5681]; // Baia Mare
  const restaurant = [47.6533, 23.5817]; // Vasile Alecsandri 15 (aprox.)

  const map = L.map('delivery-map', { scrollWheelZoom:false, zoomControl:true }).setView(center, 13);
  L.tileLayer('https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png', {
    attribution:'© OpenStreetMap, © CARTO', maxZoom:19, subdomains:'abcd'
  }).addTo(map);
  map.on('focus', ()=> map.scrollWheelZoom.enable());
  map.on('blur',  ()=> map.scrollWheelZoom.disable());

  // marker restaurant
  const vIcon = L.divIcon({ className:'', html:
    `<div style="transform:translate(-50%,-100%);display:flex;flex-direction:column;align-items:center">
       <div style="background:#0017c0;color:#fff;font:800 11px/1 'Archivo',sans-serif;text-transform:uppercase;letter-spacing:.05em;padding:6px 10px;border-radius:100px;box-shadow:0 8px 20px -6px rgba(0,23,192,.6);white-space:nowrap">Vladimir Smash</div>
       <div style="width:0;height:0;border:6px solid transparent;border-top-color:#0017c0;margin-top:-1px"></div>
     </div>`, iconSize:[0,0] });
  L.marker(restaurant, { icon:vIcon }).addTo(map);

  let zones = JSON.parse(localStorage.getItem(KEY) || 'null') || defaultZones();
  let layers = [];
  let drawing = false;
  let draftPts = [];
  let draftLine = null;
  let draftMarkers = [];

  function defaultZones(){
    // două zone demonstrative în jurul restaurantului (le poți rescrie tu)
    const c = restaurant;
    return [
      { id:'z1', name:'Zona 1', fee:10, color:COLORS[0], latlngs:ring(c, .028, .040) },
      { id:'z2', name:'Zona 2', fee:25, color:COLORS[1], latlngs:ring(c, .055, .075) }
    ];
  }
  function ring(c, rx, ry){
    const pts=[]; const N=10;
    for(let i=0;i<N;i++){ const a=(i/N)*Math.PI*2; pts.push([c[0]+Math.sin(a)*ry*(.8+Math.random()*.4), c[1]+Math.cos(a)*rx*(.8+Math.random()*.4)]); }
    return pts;
  }
  const save = ()=> localStorage.setItem(KEY, JSON.stringify(zones));

  function render(){
    layers.forEach(l=> map.removeLayer(l)); layers = [];
    zones.forEach(z=>{
      const poly = L.polygon(z.latlngs, { color:z.color, weight:2, fillColor:z.color, fillOpacity:.14 }).addTo(map);
      // eticheta pe punctul cel mai de nord → zonele concentrice nu se suprapun
      const north = z.latlngs.reduce((a,b)=> b[0]>a[0]?b:a, z.latlngs[0]);
      const tip = L.tooltip({ permanent:true, direction:'top', className:'zone-tip', offset:[0,-2] })
        .setContent(`${z.name} · ${z.fee} lei`).setLatLng(north);
      map.addLayer(tip);
      layers.push(poly); layers.push(tip);
    });
    renderList();
    save();
  }

  function renderList(){
    const list = $('#zoneList');
    if(!zones.length){ list.innerHTML = `<p class="map-note" style="margin:0">Nicio zonă încă. Apasă „Desenează o zonă".</p>`; return; }
    list.innerHTML = zones.map(z=>`
      <div class="zone-item">
        <span class="sw" style="background:${z.color}"></span>
        <span class="zn"><b>${z.name}</b><small>${z.latlngs.length} puncte</small></span>
        <input type="number" min="0" step="1" value="${z.fee}" data-fee="${z.id}"> <span style="font-size:.8rem;color:var(--ink-3)">lei</span>
        <button class="rm" data-rmz="${z.id}" aria-label="Șterge zona">×</button>
      </div>`).join('');
  }

  $('#zoneList').addEventListener('input', e=>{
    const f = e.target.closest('[data-fee]'); if(!f) return;
    const z = zones.find(x=>x.id===f.dataset.fee); if(z){ z.fee = parseInt(f.value,10)||0; render(); }
  });
  $('#zoneList').addEventListener('click', e=>{
    const rm = e.target.closest('[data-rmz]'); if(!rm) return;
    zones = zones.filter(z=>z.id!==rm.dataset.rmz); render();
  });

  // --- desenare ---
  const drawBtn = $('#drawZone');
  drawBtn.addEventListener('click', ()=> drawing ? finishDraw() : startDraw());
  $('#clearZones').addEventListener('click', ()=>{
    if(confirm('Ștergi toate zonele de livrare?')){ zones=[]; render(); }
  });

  function startDraw(){
    drawing = true; draftPts = []; draftMarkers = [];
    drawBtn.textContent = '✓ Termină zona';
    drawBtn.classList.add('primary');
    map.getContainer().style.cursor = 'crosshair';
    draftLine = L.polyline([], { color:'#0017c0', weight:2, dashArray:'6 6' }).addTo(map);
  }
  function finishDraw(){
    drawing = false;
    map.getContainer().style.cursor = '';
    drawBtn.textContent = '＋ Desenează o zonă';
    if(draftLine){ map.removeLayer(draftLine); draftLine=null; }
    draftMarkers.forEach(m=> map.removeLayer(m)); draftMarkers=[];
    if(draftPts.length>=3){
      const n = zones.length+1;
      zones.push({ id:'z'+Date.now(), name:'Zona '+n, fee: n===1?10:(n*10+5), color:COLORS[(zones.length)%COLORS.length], latlngs: draftPts.slice() });
    }
    draftPts = [];
    render();
  }
  map.on('click', e=>{
    if(!drawing) return;
    draftPts.push([e.latlng.lat, e.latlng.lng]);
    draftLine.setLatLngs(draftPts.concat([draftPts[0]]));
    const m = L.circleMarker(e.latlng, { radius:5, color:'#0017c0', fillColor:'#fff', fillOpacity:1, weight:2 }).addTo(map);
    draftMarkers.push(m);
  });
  map.on('dblclick', e=>{ if(drawing){ L.DomEvent.stop(e); finishDraw(); } });

  render();
})();
