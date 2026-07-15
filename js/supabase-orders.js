/* ===========================================================================
   VLADIMIR SMASH — trimite comanda online către POS (Supabase)
   Inserează comanda în tabela `online_orders`. POS-ul o primește în timp real.
   =========================================================================== */
(function(){
  "use strict";
  const D = window.VLADIMIR;
  const sb = D.sb;

  /* order = { customer_name, customer_phone, address, fulfillment,
               payment, items:[{id,name,price,qty,note}],
               subtotal, delivery_fee, total } */
  D.sendOrder = async function(order){
    if(!sb || !D.SB) return { ok:false, error:'offline' };
    const code = String(Math.floor(1000 + Math.random()*9000)); // cod scurt pt. client
    const row = {
      restaurant_id: D.SB.restaurantId,
      code,
      status: 'new',
      source: 'site',
      customer_name:  order.customer_name  || '',
      customer_phone: order.customer_phone || '',
      address:        order.address        || '',
      fulfillment:    order.fulfillment    || 'delivery',
      payment:        order.payment        || 'cash',
      items:          order.items          || [],
      subtotal:       Number(order.subtotal)     || 0,
      delivery_fee:   Number(order.delivery_fee) || 0,
      total:          Number(order.total)        || 0
    };
    try {
      const { error } = await sb.from('online_orders').insert(row);
      if(error){ console.warn('[VS comandă] eroare Supabase:', error.message); return { ok:false, error:error.message }; }
      return { ok:true, code };
    } catch(e){
      console.warn('[VS comandă] excepție:', e.message);
      return { ok:false, error:e.message };
    }
  };
})();
