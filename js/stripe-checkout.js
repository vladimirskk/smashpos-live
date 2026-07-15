/* ============================================================
   Vladimir Smash — Stripe Payment Integration
   Supports: Card, Google Pay, Apple Pay, Cash
   ============================================================ */

const VS_STRIPE_PK = 'pk_test_51Tg2q352irpVdHK2PelcQvW6lx8HjvY3uQXbFzI6kB3gXTQ4L9uPouW0FoomEvdmcvDR5207isHfXLYhP0PpLA1g00cVZnEGv8';
const VS_PAY_URL   = 'https://nabugijoikxqqztwpzyj.supabase.co/functions/v1/create-payment';
const VS_SB_KEY    = window.VLADIMIR && window.VLADIMIR.SB ? window.VLADIMIR.SB.key : '';

let vsStripe   = null;
let vsElements = null;
let vsCard     = null;
let vsCardMounted = false;
let vsPRButton = null;

/* ── Init Stripe ───────────────────────────────────────────── */
function vsInitStripe(){
  if(typeof Stripe === 'undefined' || vsStripe) return;

  vsStripe = Stripe(VS_STRIPE_PK);
  vsElements = vsStripe.elements({
    appearance:{
      theme:'none',
      variables:{
        fontFamily:'system-ui,-apple-system,sans-serif',
        colorPrimary:'#0017C0',colorText:'#1a1a2e',
        colorDanger:'#c0341f',borderRadius:'10px',
      },
      rules:{
        '.Input':{border:'1.5px solid #e5e7eb',padding:'11px 13px',fontSize:'14px',
          boxShadow:'none',outline:'none',background:'#fff'},
        '.Input:focus':{border:'1.5px solid #0017C0'},
        '.Label':{fontSize:'11px',fontWeight:'700',textTransform:'uppercase',
          letterSpacing:'0.5px',color:'#6b7280',marginBottom:'5px'},
        '.Error':{fontSize:'12px',color:'#c0341f',marginTop:'4px'},
      }
    }
  });

  vsCard = vsElements.create('card',{hidePostalCode:true});

  // Listen for card selection
  var payGrid = document.getElementById('payGrid');
  if(payGrid){
    payGrid.addEventListener('click', function(e){
      var btn = e.target.closest('[data-pay]');
      if(!btn) return;
      var container = document.getElementById('vs-card-wrap');
      if(!container) return;
      if(btn.dataset.pay === 'card'){
        container.style.display = 'block';
        if(!vsCardMounted){ vsCard.mount('#vs-card-element'); vsCardMounted = true; }
      } else {
        container.style.display = 'none';
      }
    });
  }
}

/* ── Create Payment Intent via Supabase Edge Function ──────── */
async function vsCreateIntent(amountLei){
  var res = await fetch(VS_PAY_URL, {
    method:'POST',
    headers:{
      'Content-Type':'application/json',
      'apikey': VS_SB_KEY,
      'Authorization':'Bearer ' + VS_SB_KEY,
    },
    body: JSON.stringify({ amount: Math.round(amountLei * 100), currency:'ron' })
  });
  if(!res.ok){
    var err = await res.json().catch(function(){ return {}; });
    throw new Error(err.error || 'Eroare la inițializarea plății ('+res.status+')');
  }
  var data = await res.json();
  if(data.error) throw new Error(data.error);
  return data.client_secret;
}

/* ── Process payment — called from app.js ──────────────────── */
window.VS_processPayment = async function(totalLei, method){
  if(method === 'cash') return { ok:true };
  if(!vsStripe){ return { ok:false, error:'Stripe nu a fost inițializat.' }; }

  try {
    var clientSecret = await vsCreateIntent(totalLei);

    if(method === 'card'){
      var result = await vsStripe.confirmCardPayment(clientSecret, {
        payment_method:{ card: vsCard }
      });
      if(result.error) throw new Error(result.error.message);
      return { ok:true, paymentIntentId: result.paymentIntent.id, status:'paid' };
    }

    // Google Pay / Apple Pay
    if(method === 'gpay' || method === 'apple'){
      var pr = vsStripe.paymentRequest({
        country:'RO', currency:'ron',
        total:{ label:'Vladimir Smash', amount: Math.round(totalLei * 100) },
        requestPayerName:true, requestPayerPhone:true,
      });
      var can = await pr.canMakePayment();
      if(!can) throw new Error((method==='apple'?'Apple Pay':'Google Pay')+' nu este disponibil pe acest dispozitiv. Alege Card sau Cash.');
      return new Promise(function(resolve, reject){
        pr.on('paymentmethod', async function(ev){
          var r2 = await vsStripe.confirmCardPayment(clientSecret, {payment_method: ev.paymentMethod.id}, {handleActions:false});
          if(r2.error){ ev.complete('fail'); reject(new Error(r2.error.message)); return; }
          ev.complete('success');
          resolve({ ok:true, paymentIntentId: r2.paymentIntent.id, status:'paid' });
        });
        pr.on('cancel', function(){ reject(new Error('Plata a fost anulată.')); });
        pr.show();
      });
    }

    return { ok:true };
  } catch(e){
    return { ok:false, error: e.message };
  }
};

/* ── Start when DOM ready ──────────────────────────────────── */
if(document.readyState === 'loading'){
  document.addEventListener('DOMContentLoaded', vsInitStripe);
} else {
  vsInitStripe();
}
