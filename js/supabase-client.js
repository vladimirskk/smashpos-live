/* ===========================================================================
   VLADIMIR SMASH — client Supabase partajat cu POS-ul
   Aceleași credențiale ca în SmashPOS (cheia „anon" e publică prin design;
   securitatea reală se face prin reguli RLS în Supabase).
   =========================================================================== */
window.VLADIMIR = window.VLADIMIR || {};

window.VLADIMIR.SB = {
  url: 'https://nabugijoikxqqztwpzyj.supabase.co',
  key: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5hYnVnaWpvaWt4cXF6dHdwenlqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzk4NzU3ODIsImV4cCI6MjA5NTQ1MTc4Mn0.85BSs-LnmMlP-FHCkneXr73JEMjF4xieHbf9IkMdt7k',
  restaurantId: 'vladimirsmash'
};

window.VLADIMIR.sb = (window.supabase && window.supabase.createClient)
  ? window.supabase.createClient(window.VLADIMIR.SB.url, window.VLADIMIR.SB.key)
  : null;

if(!window.VLADIMIR.sb){
  console.warn('[VS] Supabase indisponibil — site-ul folosește meniul local (offline).');
}
