/* ===========================================================================
   VLADIMIR SMASH — datele meniului (preluate de pe vladimirsmash.ro)
   Prețurile sunt în RON. Modifică liber aici — site-ul se actualizează singur.
   =========================================================================== */
window.VLADIMIR = window.VLADIMIR || {};

window.VLADIMIR.business = {
  name: "VLADIMIR SMASH",
  tagline: "Smash burger autentic american, livrat în Baia Mare",
  phone: "+40 746 027 011",
  phoneHref: "tel:+40746027011",
  address: "Vasile Alecsandri 15, Baia Mare 430333, Maramureș",
  city: "Baia Mare",
  hours: [
    { d: "Marți – Vineri", h: "11:00 – 22:00" },
    { d: "Sâmbătă", h: "14:00 – 22:00" },
    { d: "Duminică – Luni", h: "Închis" }
  ],
  delivery: [
    { zone: "Zona 1", min: 30, fee: 10 },
    { zone: "Zona 2", min: 30, fee: 25 }
  ],
  currency: "RON"
};

/* Categoriile apar în această ordine în bara de categorii */
window.VLADIMIR.categories = [
  { id: "maxi",    name: "Maxi Smash",   sub: "Același gust american, dar mai mare",  emojiless: "MAXI" },
  { id: "smash",   name: "Smash Burger", sub: "Gust autentic american",               emojiless: "SMASH" },
  { id: "legends", name: "Our Legends",  sub: "Specialitatea casei",                  emojiless: "LEGENDS" },
  { id: "fries",   name: "Cartofi",      sub: "Proaspăt tăiați, în fiecare zi",        emojiless: "FRIES" },
  { id: "drinks",  name: "Băuturi",      sub: "Reci, ca să meargă perfect",            emojiless: "DRINKS" }
];

/* Produsele. `cat` leagă produsul de o categorie. `from` = "De la" (preț variabil). */
window.VLADIMIR.products = [
  /* ---------- MAXI SMASH ---------- */
  { id: "maxi-classic", cat: "maxi", name: "Maxi American Classic 5\"", price: 40, from: true, tags: ["Best seller"],
    desc: "Chifla Martin's 5\", 2× carne de vită, 2× American cheese, ceapă caramelizată, sos cheddar, ketchup, castraveți murați." },
  { id: "maxi-fresh", cat: "maxi", name: "Maxi Fresh Smash 5\"", price: 47, from: true, tags: [],
    desc: "Chifla Martin's 5\", 2× carne de vită, 2× American cheese, salată, roșii, smash sauce." },
  { id: "maxi-truffle", cat: "maxi", name: "Maxi Truffle Smash 5\"", price: 45, from: true, tags: [],
    desc: "Chifla Martin's 5\", 2× carne de vită, 2× American cheese, truffle mayo, ceapă crocantă." },
  { id: "maxi-bacon", cat: "maxi", name: "Maxi Wow Bacon Smash 5\"", price: 49, from: true, tags: ["Favorit"],
    desc: "Chifla Martin's 5\", 2× carne de vită, 2× American cheese, ceapă caramelizată, sos cheddar, castraveți murați, ketchup, bacon." },
  { id: "maxi-chicken", cat: "maxi", name: "Maxi Chicken", price: 40, from: true, tags: [],
    desc: "Chifla Martin's 5\", 3× pui crispy, sos maioneză, sosul casei, salată, castraveți murați." },
  { id: "maxi-spicy", cat: "maxi", name: "Maxi Spicy Smash", price: 45, from: true, tags: ["Picant"],
    desc: "Chifla Martin's 5\", 2× 80g carne de vită, 2× American cheese, ardei iute proaspăt, sos ușor picant, sos maioneză." },

  /* ---------- SMASH BURGER ---------- */
  { id: "classic", cat: "smash", name: "American Classic", price: 30, from: true, tags: ["Best seller"],
    desc: "Chifla Martin's, 2× carne de vită, 2× American cheese, ceapă caramelizată, sos cheddar, ketchup, castraveți murați." },
  { id: "fresh", cat: "smash", name: "Fresh Smash", price: 37, from: true, tags: [],
    desc: "Chifla Martin's, 2× carne de vită, 2× American cheese, salată, roșii, smash sauce." },
  { id: "truffle", cat: "smash", name: "Truffle Smash", price: 35, from: true, tags: [],
    desc: "Chifla Martin's, 2× carne de vită, 2× American cheese, truffle mayo, ceapă crocantă." },
  { id: "bacon", cat: "smash", name: "Wow Bacon Smash", price: 39, from: true, tags: ["Favorit"],
    desc: "Chifla Martin's, 2× carne de vită, 2× American cheese, ceapă caramelizată, sos cheddar, castraveți murați, ketchup, bacon." },
  { id: "chicken", cat: "smash", name: "Chicken", price: 30, from: true, tags: [],
    desc: "Chifla Martin's 4\", 2× pui crispy, sos maioneză, sosul casei, salată, castraveți murați." },
  { id: "spicy", cat: "smash", name: "Spicy Smash", price: 35, from: true, tags: ["Picant"],
    desc: "Chifla Martin's 4\", 2× 60g carne de vită, 2× American cheese, ardei iute proaspăt, sos ușor picant, sos maioneză." },

  /* ---------- OUR LEGENDS ---------- */
  { id: "boom-cheese", cat: "legends", name: "Boom Royal Cheese", price: 39, from: true, tags: ["Signature"],
    desc: "Lipie, carne de vită rumenită cu ceapă, castraveți murați, sos cheddar, roșii, American cheese." },
  { id: "boom-spicy", cat: "legends", name: "Boom Royal Spicy", price: 39, from: true, tags: ["Picant"],
    desc: "Lipie, carne de vită rumenită cu ceapă, castraveți murați, sos cheddar, roșii, American cheese, jalapeño." },

  /* ---------- FRIES ---------- */
  { id: "fries-cajun", cat: "fries", name: "Cartofi Cajun", price: 13, from: true, tags: [],
    desc: "Cartofi proaspăt tăiați și condimentați Cajun." },
  { id: "fries-garlic", cat: "fries", name: "Usturoi & Pătrunjel", price: 17, from: true, tags: [],
    desc: "Cartofi proaspăt tăiați și prăjiți, cu usturoi și pătrunjel." },
  { id: "fries-cheddar", cat: "fries", name: "Cheddar & Bacon", price: 19, from: true, tags: ["Best seller"],
    desc: "Cartofi proaspăt tăiați, cu cheddar și bacon crocant." },

  /* ---------- DRINKS ---------- */
  { id: "coca", cat: "drinks", name: "Coca-Cola", price: 10, from: false, tags: [],
    desc: "Doză 330ml, rece." },
  { id: "sprite", cat: "drinks", name: "Sprite", price: 10, from: false, tags: [],
    desc: "Doză 330ml, rece." },
  { id: "fanta", cat: "drinks", name: "Fanta", price: 10, from: false, tags: [],
    desc: "Doză 330ml, rece." }
];

/* Recomandări de upsell când adaugi în coș: sugerăm din alte categorii. */
window.VLADIMIR.upsellOrder = ["fries", "drinks", "legends"];
