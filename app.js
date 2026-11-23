/* Travel Tails – konfigurator knjige (lokalni prototip).
   Tok: Informacije → Korice → Fotografije i uređivanje → Slanje */
(function () {
  'use strict';
  const APP_VER = '20261123b';
  // Meta Pixel: događaji po koracima (svaki se šalje najviše jednom po poseti)
  const trackedEv = new Set();
  const track = (ev, params) => { try { if (window.fbq && !trackedEv.has(ev)) { trackedEv.add(ev); fbq('track', ev, params || {}); } } catch (e) { /* ignore */ } };

  const { COVERS, CUSTOM, TEMPLATES, coverSVG, backSVG, spineSVG } = window.TT;
  const MIN = 40, MAX = 140, STEP = 4, FH = 297 / 210, FRAME = 0.05;
  const YEAR = String(new Date().getFullYear());
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const esc = (s) => String(s == null ? '' : s).replace(/[&<>"']/g, (m) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[m]));
  const norm = (s) => (s || '').toLowerCase().replace(/đ/g, 'dj').normalize('NFD').replace(/[̀-ͯ]/g, '').trim();
  const clamp = (v, a, b) => Math.min(b, Math.max(a, v));
  const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
  let uidN = 0;
  const uid = () => 'p' + ++uidN;
  const coverById = (id) => (id === 'custom' ? CUSTOM : COVERS.find((c) => c.id === id) || TEMPLATES.find((c) => c.id === id));
  const stranica = (n) => {
    const x = n % 10, y = n % 100;
    return x === 1 && y !== 11 ? 'stranica' : x >= 2 && x <= 4 && (y < 12 || y > 14) ? 'stranice' : 'stranica';
  };

  /* Cenovnik: gornja granica broja fotografija → cena u dinarima */
  const TIERS = [[40, 3800], [60, 4400], [80, 5000], [100, 5600], [120, 6300], [140, 7000]];
  const tierOf = (n) => TIERS.find((t) => n <= t[0]) || TIERS[TIERS.length - 1];
  const priceFor = (n) => tierOf(n)[1];
  const money = (n) => String(n).replace(/\B(?=(\d{3})+$)/g, '.') + ' RSD';
  const goodCount = (n) => n >= MIN && n <= MAX && n % STEP === 0;
  const countOf = (b) => b.photos.filter((p) => p.status !== 'error').length;
  // ista pravila kao na traveltails.rs: najmanje 40 i broj deljiv sa 4
  const countProblem = (n) => {
    if (n < MIN) return `Nedostaje još ${MIN - n} ${stranica(MIN - n)}.`;
    if (n % STEP) return `Broj mora biti deljiv sa 4. Dodaj još ${STEP - (n % STEP)} ili ukloni ${n % STEP}.`;
    return '';
  };

  const newBook = () => ({ id: uid(), dest: '', coverId: null, title: '', sub: '', year: YEAR, bg: null, ink: null, accent: null, swatch: 0, inkSet: false, note: '', photos: [], autoCover: true, plan: 60, back: { layout: 'text', title: null, sub: null, picks: [], extra: [] }, spine: null });
  const state = { step: 1, reached: 1, name: '', ig: '', books: [newBook()], wanted: 1, active: 0, kind: 'travel', chip: 'pop', ship: 'post', city: '', addr: '', phone: '', note: '', sent: false };
  const book = () => state.books[state.active];
  const MAX_BOOKS = 10;
  const totalBooks = () => Math.max(state.wanted || 1, state.books.length);
  const pagesBad = (b) => !goodCount(b.photos.filter((p) => p.status === 'ready').length);
  const cover = (b) => (b.coverId ? coverById(b.coverId) : null);
  const coverOf = (b) => coverSVG(cover(b) || CUSTOM, { title: b.title || (b.coverId ? undefined : b.dest), sub: b.sub, year: b.year, bg: b.bg, ink: b.ink, accent: b.accent, pt: b.pt });
  /* Korice sa fotografijom kupca: tekstovi (b.pt.txt) i fotografije za svako mesto (b.pt.ph) */
  const ptVal = (c, b, t) => (b.pt && b.pt.txt[t.k] != null ? b.pt.txt[t.k] : t.s);
  const ptTitle = (c, b) => c.t.map((t) => ptVal(c, b, t).trim()).filter(Boolean).join(' ');
  const ptMissing = (b) => { const c = cover(b); return c && c.photo ? c.p.filter((_, i) => !(b.pt && b.pt.ph[i])).length : 0; };

  /* Rikna */
  const spineText = (b) => (b.spine !== null ? b.spine : [b.title || b.dest, b.sub].filter(Boolean).join(' '));
  function spineOf(b) {
    const c = cover(b) || CUSTOM;
    return spineSVG(c, { bg: b.bg || c.bg, ink: b.ink || c.ink, text: spineText(b), year: '' });
  }

  /* Zadnja korica */
  const BACK_SLOTS = {
    four: [[50, 46, 154, 198], [216, 46, 154, 198], [50, 256, 154, 198], [216, 256, 154, 198]],
    one: [[50, 46, 320, 408]],
    text: [],
    none: [],
  };
  const readyOf = (b) => b.photos.filter((p) => p.status === 'ready' && p.kind !== 'collage');
  function backPhoto(b, i) {
    const extra = (b.back.extra || []).filter((p) => p.status === 'ready');
    const ready = readyOf(b);
    const id = b.back.picks[i];
    const hit = id && (ready.find((p) => p.id === id) || extra.find((p) => p.id === id));
    if (hit) return hit;
    // čim su sve slike učitane, prazna mesta se jednom popune nasumično i tako ostanu
    if (!ready.length || b.photos.some((p) => p.status === 'loading')) return null;
    const used = new Set(b.back.picks.filter(Boolean));
    const free = ready.filter((p) => !used.has(p.id));
    const pool = free.length ? free : ready;
    const p = pool[Math.floor(Math.random() * pool.length)];
    b.back.picks[i] = p.id;
    return p;
  }
  const backTitle = (b) => (b.back.title !== null ? b.back.title : b.title || b.dest);
  const backSub = (b) => (b.back.sub !== null ? b.back.sub : b.sub);
  function backOf(b) {
    const c = cover(b) || CUSTOM;
    const slots = BACK_SLOTS[b.back.layout].map(([x, y, w, h], i) => {
      const p = backPhoto(b, i);
      return { x, y, w, h, href: p ? p.thumb : '' };
    });
    const blank = b.back.layout === 'none';
    return backSVG(c, { bg: b.bg || c.bg, ink: b.ink || c.ink, accent: b.accent || c.accent, title: blank ? '' : backTitle(b), sub: blank ? '' : backSub(b), slots });
  }

  /* ---------- zapamti tekstualna polja ---------- */
  const store = {
    load() {
      try {
        const d = JSON.parse(localStorage.getItem('tt-form') || '{}');
        ['name', 'ig', 'city', 'addr', 'phone'].forEach((k) => { if (d[k]) state[k] = d[k]; });
      } catch (e) { /* privatni prozor */ }
    },
    save() {
      try {
        localStorage.setItem('tt-form', JSON.stringify({ name: state.name, ig: state.ig, city: state.city, addr: state.addr, phone: state.phone }));
      } catch (e) { /* privatni prozor */ }
    },
  };

  /* ---------- stepper i navigacija ---------- */
  const STEPS = ['Informacije', 'Korice', 'Fotografije', 'Slanje'];
  function renderStepper() {
    $('#stepper').innerHTML = STEPS.map((t, i) => {
      const n = i + 1;
      const cls = state.step === n ? 'on' : n < state.step || n <= state.reached ? 'done' : '';
      return `<li class="${cls}"><button type="button" data-go="${n}" ${state.step === n ? 'aria-current="step"' : ''}><i>${n < state.step ? '✓' : n}</i><span>${t}</span></button></li>`;
    }).join('');
  }
  function renderBookTabs() {
    const el = $('#bookTabs');
    // više knjiga u jednoj porudžbini: kartice knjiga + "Nova knjiga" (na koraku 3 čim ima fotografija)
    const show = (state.step === 2 || state.step === 3) && (state.books.length > 1 || (state.step === 3 && countOf(book()) > 0));
    el.hidden = !show;
    const n = state.books.length, many = n > 1, total = totalBooks();
    $('#coverTitle').textContent = total > 1 ? `Korice za knjigu ${state.active + 1} od ${total}` : 'Izaberi korice';
    const label = state.step === 2 ? 'Korice' : state.step === 3 ? 'Fotografije' : 'Knjige';
    const doneOf = (b) => state.step === 1 ? !!b.dest.trim() : state.step === 2 ? !!b.coverId && !b.autoPicked : !pagesBad(b);
    if (show) el.innerHTML = (many ? `<span class="bt-label">${label}</span>` : '')
      + state.books.map((b, i) => `<button type="button" data-book="${i}" class="${i === state.active ? 'on' : ''}${doneOf(b) && i !== state.active ? ' ok' : ''}"><i>${doneOf(b) && i !== state.active ? '✓' : i + 1}</i><span>${esc(b.title || b.dest || 'Knjiga ' + (i + 1))}</span></button>`).join('')
      + (n < MAX_BOOKS ? `<button type="button" class="add" data-newbook>+ Nova knjiga</button>` : '');
  }

  function validate(n, silent) {
    const b = book();
    if (n === 1) {
      const destOK = b.dest.trim().length > 0;
      if (!silent) {
        setErr('Dest', destOK ? '' : 'Napiši gde je bilo putovanje ili o čemu je knjiga.', $('#fDest'));
        if (!destOK) $('#fDest').focus();
      }
      return destOK;
    }
    if (n === 2) {
      if (!b.coverId) {
        if (silent) return false;
        selectCover('custom', true);
        toast('Nastavljaš sa osnovnim dizajnom, a dizajn dogovaramo na Instagramu.');
      }
      const miss = ptMissing(b);
      if (miss) {
        if (!silent) {
          const n = cover(b).p.length;
          toast(n === 1 ? 'Ubaci svoju fotografiju na korice (klikni „+ Dodaj sliku“).' : `Ubaci svoje fotografije na korice: nedostaje još ${miss} od ${n}.`);
          showFace('front');
          if (matchMedia('(max-width:820px)').matches) document.body.classList.add('sheet-open');
        }
        return false;
      }
      if (b.pt && b.pt.ph.some((p) => p && !p.url)) { if (!silent) toast('Još učitavamo fotografiju za korice, sačekaj trenutak.'); return false; }
      return true;
    }
    if (n === 3) {
      const loading = b.photos.some((p) => p.status === 'loading');
      const ok = b.photos.filter((p) => p.status === 'ready').length;
      if (!silent) {
        if (loading) toast('Još učitavamo fotografije, sačekaj trenutak.');
        else if (!goodCount(ok)) toast(countProblem(ok));
      }
      return !loading && goodCount(ok);
    }
    return true;
  }

  function goTo(n, force) {
    if (!force && n > state.step) {
      for (let s = state.step; s < n; s++) if (!validate(s)) { if (s !== state.step) goTo(s, true); return; }
    }
    state.step = n;
    if (n === 2) track('ViewContent', { content_name: 'Korice' });
    if (n === 3) track('AddToCart', { content_name: 'Izabrane korice' });
    if (n === 4) track('InitiateCheckout');
    if (n <= 4) state.reached = Math.max(state.reached, n);
    $('#app').dataset.step = n;
    $$('.step').forEach((s) => s.classList.toggle('on', s.id === 'step-' + n));
    document.body.classList.remove('sheet-open');
    renderStepper();
    renderBookTabs();
    if (n === 1) renderStep1();
    if (n === 2) enterCovers();
    if (n === 3) renderPhotos();
    if (n === 4) renderSend();
    renderFoot();
    window.scrollTo(0, 0);
    $$('.panel.left, .board').forEach((p) => (p.scrollTop = 0));
  }

  function renderFoot() {
    const next = $('#btnNext'), hint = $('#footHint'), b = book();
    renderBookTabs();
    if (state.step === 1) { next.textContent = 'Dalje: korice →'; hint.textContent = `${b.plan} ${stranica(b.plan)}, ${money(priceFor(b.plan))}`; }
    if (state.step === 2) { next.textContent = 'Dalje: fotografije →'; hint.textContent = b.coverId ? `Izabrano: ${cover(b).name}` : ''; }
    if (state.step === 3) {
      next.textContent = moreBooks() ? `Dalje: knjiga ${state.books.length + 1} →` : 'Dalje: slanje →';
      const n = countOf(b);
      hint.textContent = !n ? '' : goodCount(n) ? `${n} ${stranica(n)}, ${money(priceFor(n))}` : countProblem(n);
    }
    if (state.step === 4) {
      next.textContent = 'Pošalji fotografije';
      const t = state.books.reduce((a, x) => a + x.photos.length, 0);
      hint.textContent = `${state.books.length} ${state.books.length === 1 ? 'knjiga' : state.books.length < 5 ? 'knjige' : 'knjiga'}, ${t} ${stranica(t)}, ukupno ${money(orderTotal())}`;
    }
  }

  const orderTotal = () => state.books.reduce((a, x) => a + (goodCount(countOf(x)) ? priceFor(countOf(x)) : 0), 0);

  function setErr(key, msg, input) {
    $('#e' + key).textContent = msg;
    input.classList.toggle('invalid', !!msg);
  }

  /* ---------- toast sa „Vrati" ---------- */
  let toastT;
  function toast(msg, undo) {
    const t = $('#toast');
    t.innerHTML = `<span>${esc(msg)}</span>${undo ? '<button type="button">Vrati</button>' : ''}`;
    t.hidden = false;
    if (undo) $('button', t).onclick = () => { undo(); t.hidden = true; };
    clearTimeout(toastT);
    toastT = setTimeout(() => (t.hidden = true), undo ? 6000 : 3400);
  }

  /* ---------- 1. Informacije ---------- */
  const PLANS = [40, 60, 80, 100];
  function renderStep1() {
    $('#fDest').value = book().dest;
    renderPlans();
    renderQty();
  }
  // koliko knjiga se pravi odjednom; svaka ima svoju destinaciju, korice i fotografije, a šalju se zajedno
  function renderQty() {
    const n = totalBooks();
    $('#booksN').textContent = n;
    $('#booksMinus').disabled = n <= Math.max(1, state.books.length);
    $('#booksPlus').disabled = n >= MAX_BOOKS;
  }
  function setBookCount(n) {
    n = Math.max(state.books.length, Math.min(MAX_BOOKS, n));
    state.wanted = n;
    renderQty(); renderBookTabs(); renderFoot();
  }
  // posle fotografija jedne knjige: ako je izabrano više knjiga, iskače poruka pa idemo na korice sledeće
  const moreBooks = () => state.books.length < totalBooks();
  function askNextBook() {
    const n = state.books.length + 1, total = totalBooks();
    $('#nbBadge').textContent = n;
    $('#nbTitle').textContent = `Knjiga ${n - 1} je spremna`;
    $('#nbLead').textContent = `Idemo na knjigu ${n} od ${total}. Prvo biraš korice.`;
    $('#nbGo').textContent = `Nastavi na knjigu ${n}`;
    $('#nextBook').hidden = false;
    $('#nbGo').focus();
  }
  function startNextBook() {
    $('#nextBook').hidden = true;
    state.books.push(newBook());
    state.active = state.books.length - 1;
    book().autoCover = false;
    goTo(2, true);
  }
  const ICON_PATHS = {
    pin: '<path d="M12 22s7-6.400 7-12a7 7 0 1 0-14 0c0 5.600 7 12 7 12Z"/><circle cx="12" cy="10" r="2.500"/>',
    globe: '<circle cx="12" cy="12" r="9"/><path d="M3 12h18M12 3a14 14 0 0 1 0 18M12 3a14 14 0 0 0 0 18"/>',
    cake: '<path d="M4 21h16M5 21v-7h14v7M5 16.500c2.300 1.600 4.700 1.600 7 0s4.700-1.600 7 0M12 14v-3M8 14v-3M16 14v-3"/><path d="M12 8c.900-.700 1-1.700 0-3-1 1.300-.900 2.300 0 3Z"/>',
    heart: '<path d="M12 20s-7-4.400-7-10a4 4 0 0 1 7-2.600A4 4 0 0 1 19 10c0 5.600-7 10-7 10Z"/>',
    rings: '<circle cx="9" cy="14" r="5"/><circle cx="15" cy="14" r="5"/><path d="M10 6l2-2.500L14 6"/>',
    cross: '<path d="M12 3v18M7 8h10"/>',
    baby: '<path d="M4 10h13a5 5 0 0 1-5 5H9a5 5 0 0 1-5-5ZM4 10a8 8 0 0 1 8-7v7"/><circle cx="8" cy="19" r="2"/><circle cx="16" cy="19" r="2"/>',
    calendar: '<rect x="3" y="5" width="18" height="16" rx="2"/><path d="M3 10h18M8 3v4M16 3v4"/>',
    plane: '<path d="M3 13l18-8-6 16-3-7z"/><path d="M12 14l9-9"/>',
  };
  const icon = (k) => `<svg viewBox="0 0 24 24" aria-hidden="true">${ICON_PATHS[k] || ICON_PATHS.pin}</svg>`;
  const CAT_ICON = { rodj: 'cake', krst: 'cross', deca: 'baby', venc: 'rings', ljub: 'heart', drug: 'heart', porod: 'heart', usp: 'plane' };
  const THEME_ICON = { firstbday: 'cake', birthday: 'cake', birthday18: 'cake', baptism: 'cross', baby: 'baby', wedding: 'rings', honeymoon: 'heart', anniversary: 'calendar', love: 'heart', couple: 'plane' };
  const PLACES_RAW = 'Bar|Crna Gora;Budva|Crna Gora;Kotor|Crna Gora;Tivat|Crna Gora;Herceg Novi|Crna Gora;Ulcinj|Crna Gora;Petrovac|Crna Gora;Sveti Stefan|Crna Gora;Žabljak|Crna Gora;Beograd|Srbija;Novi Sad|Srbija;Niš|Srbija;Zlatibor|Srbija;Kopaonik|Srbija;Dubrovnik|Hrvatska;Split|Hrvatska;Zadar|Hrvatska;Hvar|Hrvatska;Rovinj|Hrvatska;Pula|Hrvatska;Trogir|Hrvatska;Zagreb|Hrvatska;Makarska|Hrvatska;Sarajevo|Bosna i Hercegovina;Mostar|Bosna i Hercegovina;Neum|Bosna i Hercegovina;Ljubljana|Slovenija;Bled|Slovenija;Skoplje|Severna Makedonija;Ohrid|Severna Makedonija;Tirana|Albanija;Saranda|Albanija;Ksamil|Albanija;Sofija|Bugarska;Varna|Bugarska;Sunčev Breg|Bugarska;Bukurešt|Rumunija;Budimpešta|Mađarska;Beč|Austrija;Salcburg|Austrija;Prag|Češka;Krakov|Poljska;Varšava|Poljska;Berlin|Nemačka;Minhen|Nemačka;Hamburg|Nemačka;Amsterdam|Holandija;Brisel|Belgija;Brige|Belgija;Pariz|Francuska;Nica|Francuska;Kan|Francuska;Lion|Francuska;Monako|Monako;London|Velika Britanija;Edinburg|Škotska;Dablin|Irska;Madrid|Španija;Barselona|Španija;Sevilja|Španija;Valensija|Španija;Malaga|Španija;Majorka|Španija;Ibica|Španija;Tenerife|Španija;Gran Kanarija|Španija;Lisabon|Portugal;Porto|Portugal;Madeira|Portugal;Azori|Portugal;Rim|Italija;Milano|Italija;Venecija|Italija;Firenca|Italija;Napulj|Italija;Bari|Italija;Amalfi|Italija;Kapri|Italija;Sardinija|Italija;Sicilija|Italija;Toskana|Italija;Elba|Italija;Verona|Italija;Cirih|Švajcarska;Ženeva|Švajcarska;Interlaken|Švajcarska;Oslo|Norveška;Stokholm|Švedska;Kopenhagen|Danska;Helsinki|Finska;Rejkjavik|Island;Atina|Grčka;Santorini|Grčka;Mikonos|Grčka;Krit|Grčka;Rodos|Grčka;Krf|Grčka;Zakintos|Grčka;Lefkada|Grčka;Kefalonija|Grčka;Tasos|Grčka;Skijatos|Grčka;Parga|Grčka;Halkidiki|Grčka;Sitonija|Grčka;Kasandra|Grčka;Solun|Grčka;Istanbul|Turska;Antalija|Turska;Alanja|Turska;Bodrum|Turska;Kapadokija|Turska;Marmaris|Turska;Kipar|Država;Malta|Država;Grčka|Država;Italija|Država;Španija|Država;Francuska|Država;Nemačka|Država;Austrija|Država;Švajcarska|Država;Portugal|Država;Hrvatska|Država;Crna Gora|Država;Turska|Država;Albanija|Država;Bugarska|Država;Srbija|Država;Egipat|Država;Maroko|Država;Tunis|Država;Japan|Država;Kina|Država;Tajland|Država;Vijetnam|Država;Indonezija|Država;Indija|Država;Šri Lanka|Država;Maldivi|Država;Mauricijus|Država;Sejšeli|Država;Kenija|Država;Bahami|Država;Kuba|Država;Dominikana|Država;Meksiko|Država;Peru|Država;Brazil|Država;Argentina|Država;Kanada|Država;Australija|Država;Novi Zeland|Država;Hurgada|Egipat;Šarm el Šeik|Egipat;Kairo|Egipat;Marakeš|Maroko;Kejp Taun|Južna Afrika;Zanzibar|Tanzanija;Dubai|UAE;Abu Dabi|UAE;Doha|Katar;Tokio|Japan;Kjoto|Japan;Seul|Južna Koreja;Singapur|Singapur;Hong Kong|Kina;Bangkok|Tajland;Puket|Tajland;Bali|Indonezija;Njujork|SAD;Los Anđeles|SAD;Las Vegas|SAD;Majami|SAD;San Francisko|SAD;Havaji|SAD;Kankun|Meksiko;Havana|Kuba;Rio de Žaneiro|Brazil;Buenos Ajres|Argentina;Sidnej|Australija;Melburn|Australija';
  const PLACES = (() => {
    const m = new Map();
    PLACES_RAW.split(';').forEach((x) => { const [name, sub] = x.split('|'); m.set(norm(name), { name, sub, aka: '', icon: sub === 'Država' ? 'globe' : 'pin' }); });
    COVERS.forEach((c) => {
      const k = norm(c.name), hit = m.get(k), aka = norm(c.aka + ' ' + c.title);
      if (hit) { if (!hit.aka.includes(aka)) hit.aka += ' ' + aka; }
      else m.set(k, { name: c.name, sub: c.other ? 'Tema' : c.country || 'Država', aka, icon: c.other ? THEME_ICON[c.id] || CAT_ICON[c.cat[0]] || 'heart' : c.country ? 'pin' : 'globe' });
    });
    // korica koja je prikazana i na drugom mestu: i to mesto je u predlozima
    COVERS.forEach((c) => (c.also || []).forEach((a) => {
      const k = norm(a.name);
      if (k && !m.has(k)) m.set(k, { name: a.name, sub: a.other ? 'Tema' : a.country || 'Država', aka: '', icon: a.other ? CAT_ICON[(a.cat || [])[0]] || 'heart' : a.country ? 'pin' : 'globe' });
    }));
    const norm1 = (s) => norm(s);
    const arr = [...m.values()];
    arr.forEach((p) => { p.w = 0; });
    const byKey = new Map(arr.map((p) => [norm1(p.name) + '|' + norm1(p.sub), p]));
    const have = new Set(byKey.keys());
    // sve države sveta i delovi sveta (da "Nigerija" daje i državu, a ne samo njene gradove)
    const WW = window.TT_WORLD;
    if (WW) {
      WW.c.forEach((cn, i) => {
        const k = norm1(cn) + '|' + norm1('Država'), e = byKey.get(k);
        if (e) { const al = norm1(WW.e ? WW.e[i] : ''); if (al && !(' ' + e.aka + ' ').includes(' ' + al + ' ')) e.aka = (e.aka ? e.aka + ' ' : '') + al; return; }
        const ne = { name: cn, sub: 'Država', aka: norm1(WW.e ? WW.e[i] : ''), icon: 'globe', w: 0 };
        byKey.set(k, ne); have.add(k); arr.push(ne);
      });
    }
    [['Evropa', 'europe'], ['Azija', 'asia'], ['Afrika', 'africa'], ['Amerika', 'america'], ['Australija', 'australia oceania okeanija']].forEach(([n, al]) => {
      const k = norm1(n) + '|' + norm1('Država'), k2 = norm1(n) + '|' + norm1('Deo sveta');
      if (byKey.has(k)) { byKey.get(k).sub = 'Deo sveta'; return; } // npr. "Afrika" iz korica je deo sveta, ne država
      if (have.has(k2)) return;
      const ne = { name: n, sub: 'Deo sveta', aka: al, icon: 'globe', w: 0 };
      byKey.set(k2, ne); have.add(k2); arr.push(ne);
    });
    const haveName = new Set(arr.filter((p) => p.sub === 'Država' || p.sub === 'Deo sveta').map((p) => norm1(p.name)));
    // mesta koja je admin dodao
    ((TT.ADDED || {}).places || []).forEach((a) => {
      const k = norm1(a.name) + '|' + norm1(a.country || 'Država');
      if (!a.name || have.has(k)) return;
      have.add(k);
      arr.push({ name: a.name, sub: a.country || 'Država', aka: norm1(a.aka || ''), icon: a.country ? 'pin' : 'globe', w: 0 });
    });
    // celi svet (GeoNames): gradovi i turistička mesta
    const W = window.TT_WORLD;
    if (W) {
      W.p.forEach((s, i) => {
        const [name, ci, eng, typ] = s.split('|'), sub = W.c[+ci], k = norm1(name) + '|' + norm1(sub);
        if (have.has(k) || haveName.has(norm1(name))) {
          const ex = byKey.get(k);
          if (ex && typ && !ex.t) ex.t = typ;
          if (ex && eng && !(' ' + ex.aka + ' ').includes(' ' + norm1(eng) + ' ')) { ex.aka = (ex.aka ? ex.aka + ' ' : '') + norm1(eng); }
          if (ex && eng) ex._al = norm1(eng);
          return;
        }
        have.add(k);
        const e = { name, sub, aka: eng ? norm1(eng) : '', icon: 'pin', w: i + 1, _al: eng ? norm1(eng) : '', t: typ || '' };
        byKey.set(k, e);
        arr.push(e);
      });
    }
    arr.forEach((p) => { p._n = norm1(p.name); p._s = norm1(p.sub); p._a = p.aka ? p.aka.split(' ') : []; p._w = p._n.split(' '); });
    return arr;
  })();
  const PLACE_BY = new Map();
  PLACES.forEach((p) => { if (!PLACE_BY.has(p._n)) PLACE_BY.set(p._n, p); });
  // admin: za neke države se za svako mesto u njoj nude korice cele države (menja se samo tekst)
  function countryFill(q) {
    const n = norm(q), p = PLACE_BY.get(n);
    if (!p || p.sub === 'Država' || p.sub === 'Tema' || p.sub === 'Deo sveta' || !(TT.FILL || {})[p.sub]) return null;
    const list = COVERS.filter((c) => !c.other && !c.country && norm(c.name) === norm(p.sub) && c.fig && c.fig.T.length);
    return list.length ? { name: p.name, list } : null;
  }
  function matchPlaces(q) {
    const n = norm(q);
    if (!n) return [];
    const rank = (p) => {
      const v = p._n;
      if (v === n || p._al === n) return 0;
      if (v.startsWith(n) || (p._al && p._al.startsWith(n))) return 1;
      if (p._w.some((w) => w.startsWith(n)) || v.includes(' ' + n)) return 2;
      if (p.aka && (p.aka.startsWith(n) || p.aka.includes(' ' + n))) return 3;
      return p.sub !== 'Država' && p._s.startsWith(n) ? 4 : 9;
    };
    // prvo naša mesta (po abecedi), pa ostali svet po veličini grada
    const hits = [];
    for (const p of PLACES) { const r = rank(p) + (p.sub === 'Tema' ? 0.5 : 0); if (r < 9) hits.push([p, r]); }
    return hits.sort((x, y) => x[1] - y[1] || (x[0].w ? 1 : 0) - (y[0].w ? 1 : 0) || (x[0].w && y[0].w ? x[0].w - y[0].w : x[0].name.localeCompare(y[0].name, 'sr'))).slice(0, 8).map((x) => x[0]);
  }
  // padajuća lista: ista za destinaciju (korak 1) i pretragu korica (korak 2)
  function makeCombo(input, list, onPick) {
    let items = [], active = -1;
    const close = () => {
      items = []; active = -1;
      list.hidden = true;
      input.setAttribute('aria-expanded', 'false');
      input.removeAttribute('aria-activedescendant');
    };
    const paint = () => {
      list.innerHTML = items.map((p, i) => `<li role="option" id="${list.id}-${i}" data-i="${i}" aria-selected="${i === active}" class="${i === active ? 'on' : ''}">${icon(p.icon)}<b>${esc(p.name)}</b><span>${esc(p.sub === 'Država' ? 'država' : p.sub === 'Tema' ? 'tema' : p.sub)}</span></li>`).join('');
      if (active >= 0) { input.setAttribute('aria-activedescendant', `${list.id}-${active}`); $(`#${list.id}-${active}`).scrollIntoView({ block: 'nearest' }); }
      else input.removeAttribute('aria-activedescendant');
    };
    const open = () => {
      const v = input.value;
      items = matchPlaces(v);
      active = -1;
      if (!items.length || (items.length === 1 && norm(items[0].name) === norm(v))) { close(); return; }
      list.hidden = false;
      input.setAttribute('aria-expanded', 'true');
      paint();
      list.scrollIntoView({ block: 'nearest' });
    };
    const pick = (p) => { close(); onPick(p); };
    input.addEventListener('focus', open);
    input.addEventListener('blur', close);
    input.addEventListener('keydown', (e) => {
      if (list.hidden) return;
      if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
        e.preventDefault();
        const n = items.length, d = e.key === 'ArrowDown' ? 1 : -1;
        active = active < 0 && d < 0 ? n - 1 : (active + d + n) % n;
        paint();
      } else if (e.key === 'Enter') {
        e.preventDefault();
        if (active >= 0) pick(items[active]); else close();
      } else if (e.key === 'Escape') close();
    });
    // pointerdown da polje ne izgubi fokus pre izbora
    list.addEventListener('pointerdown', (e) => {
      const li = e.target.closest('[data-i]');
      e.preventDefault();
      if (li) pick(items[+li.dataset.i]);
    });
    return { open, close };
  }
  const destCombo = makeCombo($('#fDest'), $('#destList'), (p) => {
    $('#fDest').value = p.name;
    setDest(p.name);
    setErr('Dest', '', $('#fDest'));
  });
  const searchCombo = makeCombo($('#coverSearch'), $('#coverSearchList'), (p) => {
    $('#coverSearch').value = p.name;
    book().dest = p.name;
    book().query = p.name;
    state.kind = p.sub === 'Tema' ? 'other' : 'travel';
    state.chip = allChip();
    renderKinds(); renderChips(); renderGrid();
  });

  function renderPlans() {
    const n = book().plan;
    $('#plans').innerHTML = PLANS.map((k) => `<button type="button" role="radio" class="plan ${n === k ? 'on' : ''}" aria-checked="${n === k}" data-plan="${k}"><b>${k}</b><span>stranica</span><strong>${money(priceFor(k))}</strong></button>`).join('');
    const r = $('#planRange');
    r.value = n;
    r.style.setProperty('--pct', ((n - MIN) / (MAX - MIN)) * 100 + '%');
    $('#planOut').textContent = `Tvoja knjiga: ${n} ${stranica(n)}`;
    $('#planPrice').textContent = money(priceFor(n));
  }
  function setPlan(n) { book().plan = n; renderPlans(); renderFoot(); }
  $('#plans').addEventListener('click', (e) => { const b = e.target.closest('[data-plan]'); if (b) setPlan(+b.dataset.plan); });
  $('#planRange').addEventListener('input', (e) => setPlan(+e.target.value));
  $('#fName').addEventListener('input', (e) => { state.name = e.target.value; store.save(); if (e.target.classList.contains('invalid')) setErr('Name', '', e.target); });
  $('#fIg').addEventListener('input', (e) => {
    e.target.value = e.target.value.replace(/^@+/, '').replace(/^https?:\/\/(www\.)?instagram\.com\//i, '').replace(/\/.*$/, '').replace(/\s/g, '');
    state.ig = e.target.value; store.save();
    if (e.target.classList.contains('invalid')) setErr('Ig', '', e.target);
  });
  $('#fDest').addEventListener('input', (e) => { setDest(e.target.value); destCombo.open(); if (e.target.classList.contains('invalid')) setErr('Dest', '', e.target); });
  function setDest(v) {
    const b = book();
    b.dest = v; b.autoCover = true;
  }
  $('#infoForm').addEventListener('submit', (e) => { e.preventDefault(); goTo(2); });

  /* ---------- 2. Korice ---------- */
  const CONTINENTS = [['evropa', 'Evropa'], ['azija', 'Azija'], ['afrika', 'Afrika'], ['amerika', 'Amerika'], ['australija', 'Australija']];
  const contOf = (c) => (!c.cont || c.cont === 'balkan' ? 'evropa' : c.cont);
  const CHIPS = {
    travel: [['pop', 'Najpopularnije'], ...CONTINENTS],
    other: [['sve', 'Sve'], ['rodj', 'Rođendani'], ['krst', 'Krštenja'], ['deca', 'Bebe i deca'], ['venc', 'Venčanja'], ['ljub', 'Ljubav'], ['drug', 'Drugarice'], ['porod', 'Porodica'], ['usp', 'Uspomene']],
  };
    ((TT.ADDED || {}).themes || []).forEach((t) => { if (!CHIPS.other.some((x) => x[0] === t.k)) CHIPS.other.push([t.k, t.t]); });
  const allChip = () => (state.kind === 'other' ? 'sve' : 'pop');
  const startChip = allChip;
  const inChip = (c, k) => !!c.other === (state.kind === 'other') && (k === 'sve' || (k === 'pop' ? c.featIdx >= 0 : c.other ? c.cat.includes(k) : contOf(c) === k));
  const NAVY = '#153a55';
  const SWATCHES = [null, ['#65c8f6', NAVY, NAVY], ['#f6e27a', '#1f2a6b', '#c1246d'], ['#f4b3c4', '#ffffff', '#bb1f3a'], ['#a9d8c6', '#1a2e7c', '#1a2e7c'], ['#14763a', '#ececea', '#e9bd3d'], ['#1f2a6b', '#ffffff', '#f6e27a'], ['#f6f2ea', NAVY, '#a48745']];

  function enterCovers() {
    const b = book();
    const q = b.autoCover ? b.dest : b.query || '';
    $('#coverSearch').value = q;
    b.query = q;
    if (b.autoCover && b.dest) {
      const n = norm(b.dest), hit = COVERS.find((c) => norm(c.name) === n || norm(c.title) === n);
      if (!b.coverId || b.autoPicked) {
        if (hit) { selectCover(hit.id, true); b.autoPicked = true; }
        else if (b.autoPicked) { b.coverId = null; b.autoPicked = false; }
      }
    }
    const shown = cover(b) || (q && matchCovers(q)[0]);
    state.kind = shown && shown.other ? 'other' : 'travel';
    state.chip = q ? allChip() : startChip();
    b.autoCover = false;
    closePicker();
    renderKinds();
    renderChips();
    renderGrid();
    renderTuner();
  }
  function renderKinds() {
    $$('#coverKind button').forEach((x) => {
      const on = x.dataset.kind === state.kind;
      x.classList.toggle('on', on);
      x.setAttribute('aria-selected', on);
    });
  }
  const CAT_WORDS = { rodj: 'rođendan rođendani rodjendan birthday', krst: 'krštenje krstenje krštenja', deca: 'beba bebe deca dete baby', venc: 'venčanje vencanje svadba wedding medeni mesec', ljub: 'ljubav love par', drug: 'drugarice matura devojačko devojacko', porod: 'porodica family', usp: 'uspomene memories putovanja leto summer svet world skijanje ski' };
  function matchCovers(q) {
    const n = norm(q);
    const words = n.split(/\s+/).filter(Boolean);
    return COVERS.filter((c) => {
      const hay = norm(c.aka + ' ' + c.name + ' ' + c.title + ' ' + (c.country || '') + ' ' + (c.other ? (c.cat || []).map((k) => CAT_WORDS[k] || '').join(' ') : ''));
      return words.every((w) => hay.includes(w));
    });
  }
  function renderChips() {
    $('#coverChips').innerHTML = CHIPS[state.kind].map(([k, t]) => `<button type="button" role="tab" data-chip="${k}" class="${state.chip === k ? 'on' : ''}">${t}</button>`).join('');
  }
  const placeSub = (name) => {
    const p = PLACE_BY.get(norm(name || ''));
    return p && p.sub !== 'Država' && p.sub !== 'Tema' && p.sub !== 'Deo sveta' ? p.sub : '';
  };
  const dizajna = (n) => (n % 10 === 1 && n % 100 !== 11 ? 'dizajn' : 'dizajna');
  // ravnomerno: po jedan dizajn iz svakog mesta, pa sledeći krug
  function spread(list) {
    const m = new Map();
    list.forEach((c) => { if (!m.has(c.name)) m.set(c.name, []); m.get(c.name).push(c); });
    const groups = [...m.values()], out = [];
    for (let i = 0; groups.some((g) => g[i]); i++) groups.forEach((g) => g[i] && out.push(g[i]));
    return out;
  }
  // dopuna: samo neutralni dizajni (bez znamenitosti), nasumičan izbor koji se može dopunjavati ("Učitaj još")
  const FB_IDS = {
    w: ['n313117', 'n313840', 'n1103', 'n313120', 'n309192', 'n313029', 'n312860', 'n308990'],
    n: ['n313132', 'n313124', 'n248621', 'n286614', 'n287755', 'n219797', 'n219874', 'n286611'],
  };
  // vrsta mesta: w = zimsko, s = more/letovanje, n = malo mesto i priroda (kućica, šuma, brdo)
  function placeKind(q) {
    const n = norm(q), p = PLACE_BY.get(n);
    if (p && p.t) return p.t;
    if (/(^| )(ski|skij\w*|planina|mount\w*|alp\w*|sneg|zima|winter)( |$)/.test(n)) return 'w';
    if (/(^| )(plaza|more|sea|beach|island|ostrvo|ostrva|bay|zaliv|obala|rivijera|riviera|leto|summer)( |$)/.test(n)) return 's';
    return 'n';
  }
  const CONT_LABEL = { evropa: 'Evropa', azija: 'Azija', afrika: 'Afrika', amerika: 'Amerika', australija: 'Australija' };
  const hash = (s) => { let h = 0; for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) | 0; return h >>> 0; };
  // Šta nudimo kad za upisano mesto nema svojih korica: (1) zimsko/more ako je takvo mesto, (2) korice njegove države,
  // (3) korice tog dela sveta, (4) korice drugih država iz tog dela sveta; uvek sa upisanim nazivom.
  function fallbackPool(q) {
    const n = norm(q), p = PLACE_BY.get(n), kind = placeKind(q), W = window.TT_WORLD;
    const ok = (c) => c.fig && c.fig.T.some((t) => t.r === 't') && !c.other;
    const live = COVERS.filter(ok), byId = new Map(COVERS.map((c) => [c.id, c]));
    const country = p ? (p.sub === 'Država' ? p.name : p.sub !== 'Tema' && p.sub !== 'Deo sveta' ? p.sub : '') : '';
    const ci = W && country ? W.c.indexOf(country) : -1;
    let cont = ci >= 0 ? W.k[ci] : '';
    if (!cont && p && p.sub === 'Deo sveta') cont = Object.keys(CONT_LABEL).find((k) => norm(CONT_LABEL[k]) === n) || '';
    if (!cont && country) { const any = live.find((c) => c.country === country || (!c.country && c.name === country)); if (any) cont = any.cont || ''; }
    const out = [], seen = new Set();
    const push = (list) => list.forEach((c) => { if (c && !seen.has(c.id)) { seen.add(c.id); out.push(c); } });
    const pick = (ids) => ids.map((id) => byId.get(id)).filter(ok);
    const countryLevel = (cn) => live.filter((c) => !c.country && norm(c.name) === norm(cn));
    const seeded = (list) => list.slice().sort((a, b) => hash(n + a.id) - hash(n + b.id));
    if (kind === 'w') push(pick(FB_IDS.w));
    if (country) push(countryLevel(country));
    if (kind === 's') push(live.filter((c) => c.neutral));
    if (cont) {
      // evropske destinacije ne dobijaju opšte korice "Evropa" kao predlog
      if (cont !== 'evropa') push(countryLevel(CONT_LABEL[cont]));
      // po jedan dizajn iz svake druge države tog dela sveta (redosled zavisi od upisanog mesta, da ne bude isto za svako mesto)
      const m = new Map();
      live.filter((c) => c.cont === cont && !c.country && c.name !== CONT_LABEL[cont]).forEach((c) => { if (!m.has(c.name)) m.set(c.name, []); m.get(c.name).push(c); });
      // krug po krug: prvo po jedan dizajn svake države, pa drugi, treći...
      const gl = seeded([...m.values()].map((g) => seeded(g)));
      for (let r = 0; gl.some((g) => g[r]); r++) push(gl.map((g) => g[r]).filter(Boolean));
    }
    if (kind === 'n' && !country && !cont) push(pick(FB_IDS.n));
    if (!out.length) push(pick(FB_IDS.n));
    if (!out.length) push(live.filter((c) => c.neutral));
    return out;
  }
  function fillFor(q, main, more) {
    const have = new Set(main.map((c) => c.id));
    const neutral = fallbackPool(q).filter((c) => !have.has(c.id));
    if (!state.fillPick || state.fillPick.q !== q) state.fillPick = { q, ids: neutral.map((c) => c.id) };
    const byId = new Map(neutral.map((c) => [c.id, c]));
    const want = (main.length >= 8 ? 6 : 12) + 12 * (more || 0);
    return state.fillPick.ids.map((id) => byId.get(id)).filter(Boolean).slice(0, want);
  }
  function card(c, as) {
    const b = book();
    const on = b.coverId === c.id && (b.coverAs || '') === (as || '');
    // korice bez podnaslova u dizajnu ne dobijaju podnaslov same (država se ne upisuje)
    const o = as ? { title: as, sub: c.fig && !c.fig.T.some((t) => t.r === 's') ? '' : placeSub(as) } : {};
    const img = c.fig ? TTF.figmaCard(c, o) : coverSVG(c, Object.assign({ year: c.other ? '' : YEAR }, o));
    return `<button type="button" class="cv ${on ? 'sel' : ''}" data-cover="${c.id}"${as ? ` data-as="${esc(as)}"` : ''} aria-pressed="${on}" aria-label="${esc(as || c.title || c.name)}"><span class="cv-img">${img}</span></button>`;
  }
  function groupsOf(list) {
    const m = new Map();
    list.forEach((c) => { const k = c.other ? c.cat[0] : c.name; if (!m.has(k)) m.set(k, []); m.get(k).push(c); });
    return m;
  }
  function renderGrid() {
    const q = $('#coverSearch').value.trim();
    const b = book();
    let html = '';
    if (q) {
      const n = norm(q);
      const list = matchCovers(q);
      // tačno mesto, ili država: "Španija" / "Spain" daje i Madrid, Barselonu…; prvo korice baš tog naziva
      const alsoN = (c) => (c.also || []).some((a) => norm(a.name) === n);
      const whole = (c) => (' ' + norm(c.aka || '') + ' ').includes(' ' + n + ' ') || norm(c.country || '') === n || (c.also || []).some((a) => norm(a.country || '') === n);
      const same = (c) => norm(c.name) === n || norm(c.title) === n || alsoN(c);
      const exact = list.filter((c) => same(c) || whole(c))
        .sort((a, b) => (same(a) ? 0 : 1) - (same(b) ? 0 : 1));
      const main = exact.length && !list.some((c) => c.other) ? exact : list;
      const top = main.filter((c) => c.top), rest = main.filter((c) => !c.top);
      html += top.map((c) => card(c)).join('');
      const cf = countryFill(q);
      if (cf) html += cf.list.filter((c) => !main.includes(c)).map((c) => card(c, cf.name)).join('');
      if (state.more === q) html += rest.map((c) => card(c)).join('');
      else if (rest.length) html += `<button type="button" class="cv-more" data-more>Učitaj još</button>`;
      if (!main.length && !cf) {
        const fill = fillFor(q, main, state.fillMore && state.fillMore.q === q ? state.fillMore.n : 0);
        const nice = (PLACE_BY.get(norm(q)) || {}).name || q;
        html += fill.map((c) => card(c, nice)).join('');
        const total = fallbackPool(q).length;
        if (fill.length < total - main.filter((c) => c.neutral).length) html += `<button type="button" class="cv-more" data-fillmore>Učitaj još</button>`;
      }
    } else {
      let list = COVERS.filter((c) => inChip(c, state.chip));
      if (state.chip === 'pop') list.sort((a, b) => a.featIdx - b.featIdx);
      html = list.map((c) => card(c)).join('');
    }
    const customTitle = q || (b.coverId === 'custom' && b.title) || 'Tvoja priča';
    html += `<button type="button" class="cv is-custom ${b.coverId === 'custom' ? 'sel' : ''}" data-cover="custom" aria-pressed="${b.coverId === 'custom'}">
        <span class="cv-img">${coverSVG(CUSTOM, { title: customTitle })}</span>
        <span class="cv-name">Nastavi svoju knjigu</span>
        <span class="cv-tag">Dizajn dogovaramo zajedno na Instagramu</span>
      </button>`;
    $('#coverGrid').innerHTML = html;
    $('#coverEmpty').hidden = true;
  }
  function selectCover(id, silent, as) {
    const b = book(), c = coverById(id);
    const prev = b.coverId, prevAs = b.coverAs || '';
    b.coverId = id;
    b.coverAs = as || '';
    b.autoPicked = false;
    if (prev !== id || prevAs !== b.coverAs) {
      const q = $('#coverSearch').value.trim();
      b.title = id === 'custom' ? (q || b.dest || '') : as || c.title;
      // korice bez podnaslova u dizajnu ne dobijaju podnaslov same; kupac ga može dodati
      b.sub = c.fig && !c.fig.T.some((t) => t.r === 's') ? '' : as ? placeSub(as) : c.sub;
      b.year = c.fig ? c.year : c.other ? '' : YEAR;
      b.bg = b.ink = b.accent = null;
      b.swatch = 0;
      b.inkSet = false;
      b.spine = null;
      b.pt = c.photo ? { txt: {}, ph: [] } : null;
      if (c.photo) b.title = ptTitle(c, b);
    }
    if (!b.dest) b.dest = id === 'custom' ? b.title : as || c.name;
    if (silent) return;
    closePicker();
    $$('.cv').forEach((x) => {
      const on = x.dataset.cover === id && (x.dataset.as || '') === b.coverAs;
      x.classList.toggle('sel', on);
      x.setAttribute('aria-pressed', on);
    });
    if (prev !== id || prevAs !== b.coverAs) showFace('front');
    renderTuner();
    renderFoot();
    renderBookTabs();
    if (matchMedia('(max-width:820px)').matches) document.body.classList.add('sheet-open');
  }
  function renderMock() {
    const b = book();
    $('#coverMock').innerHTML = b.coverId ? `<div class="book3d" id="book3d" style="--ry:${mockRy}deg"><div class="face f-front">${coverOf(b)}</div><div class="face f-back">${backOf(b)}</div><div class="face f-spine">${spineOf(b)}</div><div class="face f-edge"></div><div class="face f-top"></div><div class="face f-bottom"></div></div><span class="b3d">3D</span>` : '';
  }
  function renderTuner() {
    const b = book(), has = !!b.coverId;
    $('#tuner').hidden = !has;
    $('#customizer').classList.toggle('is-custom', b.coverId === 'custom');
    $('#stageHint').hidden = has;
    renderMock();
    if (!has) return;
    $('#cTitle').value = b.title;
    $('#cSub').value = b.sub;
    $('#cYear').value = b.year;
    $('#cSpine').value = spineText(b);
    $('#tBackTitle').value = backTitle(b);
    $('#tBackSub').value = backSub(b);
    $$('#tLayout button').forEach((x) => x.classList.toggle('on', x.dataset.l === b.back.layout));
    $('#tBackText').hidden = b.back.layout === 'none';
    $('#cCustom').value = b.note;
    $('#cCustomField').hidden = b.coverId !== 'custom';
    const cv = cover(b), roles = cv.fig ? new Set(cv.fig.T.filter((t) => !((cv.adj || {})[t.r] || {}).hide).map((t) => t.r)) : null;
    $('#cTitle').closest('.field').hidden = !!roles && !roles.has('t');
    // i korice bez podnaslova u dizajnu dozvoljavaju da kupac doda podnaslov (ispod naslova)
    $('#cSub').closest('.field').hidden = !!roles && !roles.has('s') && !(roles.has('t') && !((cv.adj || {}).s || {}).hide);
    $('#cYearField').hidden = roles ? !roles.has('y') : !!cv.subBottom;
    $('#cYearField').style.display = '';
    $('#swatches').closest('.field').hidden = !!(cv.fig && (cv.fig.lock || cv.fig.fx)) || !!cv.photo;
    $('#ptBox').hidden = !cv.photo;
    $('#tunerMain .grid3').hidden = !!cv.photo;
    if (cv.photo) renderPt();
    if (!$('#faceTabs .on')) {
      const shown = ($$('#tunerMain .pane').find((x) => !x.hidden) || {}).dataset;
      const f = shown ? shown.pane : 'front';
      $$('#faceTabs button').forEach((x) => { x.classList.toggle('on', x.dataset.face === f); x.setAttribute('aria-selected', x.dataset.face === f); });
    }
    renderSwatches();
  }
  function renderPt() {
    const b = book(), c = cover(b);
    if (!c || !c.photo) return;
    const n = c.p.length, miss = ptMissing(b);
    $('#ptNeed').textContent = miss ? (n === 1 ? 'obavezno' : `još ${miss} od ${n}`) : '✓';
    $('#ptNeed').classList.toggle('ok', !miss);
    $('#ptPhotos').innerHTML = c.p.map((_, i) => {
      const p = b.pt.ph[i];
      const cls = p ? (p.thumb ? 'has' : 'busy') : 'need';
      return `<button type="button" data-pt="${i}" class="${cls}"${p && p.thumb ? ` style="background-image:url('${p.thumb}')"` : ''} aria-label="${p ? 'Promeni' : 'Dodaj'} fotografiju${n > 1 ? ' ' + (i + 1) : ''}">${p ? (p.thumb ? '' : 'Učitavam…') : `+ Dodaj${n > 1 ? '<br>' + (i + 1) : '<br>sliku'}`}</button>`;
    }).join('');
    const box = $('#ptTexts');
    if (box.dataset.for !== c.id + '|' + b.id) {
      box.dataset.for = c.id + '|' + b.id;
      box.innerHTML = c.t.map((t) => `<div class="field"><label for="pt_${t.k}">${esc(t.label)}</label><input id="pt_${t.k}" data-ptk="${t.k}" maxlength="40" autocomplete="off"></div>`).join('');
    }
    c.t.forEach((t) => { const el = $('#pt_' + t.k); if (el && document.activeElement !== el) el.value = ptVal(c, b, t); });
  }
  let ptSlot = 0;
  $('#ptPhotos').addEventListener('click', (e) => {
    const t = e.target.closest('[data-pt]');
    if (!t) return;
    ptSlot = +t.dataset.pt;
    $('#ptFile').value = '';
    $('#ptFile').click();
  });
  $('#ptFile').addEventListener('change', async (e) => {
    const file = e.target.files && e.target.files[0], b = book(), c = cover(b), i = ptSlot;
    if (!file || !c || !c.photo) return;
    if (!isImage(file)) { toast('Izaberi fotografiju (JPG, PNG ili HEIC).'); return; }
    const p = { file, name: file.name || 'slika.jpg' };
    b.pt.ph[i] = p;
    renderPt();
    try {
      const blob = isHeic(file) ? await heicToJpeg(file) : file;
      const bmp = await decodeImage(blob);
      p.w = bmp.width; p.h = bmp.height;
      const sc = Math.min(1, 900 / Math.max(p.w, p.h));
      const cv = makeCanvas(Math.round(p.w * sc), Math.round(p.h * sc));
      cv.getContext('2d').drawImage(bmp.src, 0, 0, cv.width, cv.height);
      if (bmp.close) bmp.close();
      p.url = URL.createObjectURL(blob);
      p.thumb = URL.createObjectURL(await canvasBlob(cv, 0.85));
      if (Math.min(p.w, p.h) < 900) toast('Ova fotografija je male rezolucije, na štampi može biti mutna. Ako imaš veću, ubaci nju.');
    } catch (err) {
      if (b.pt && b.pt.ph[i] === p) b.pt.ph[i] = null;
      toast('Ovu fotografiju ne možemo da otvorimo. Probaj drugu.');
    }
    if (book() === b) { renderPt(); renderMock(); }
  });
  $('#ptTexts').addEventListener('input', (e) => {
    const k = e.target.dataset.ptk, b = book(), c = cover(b);
    if (!k || !c || !c.photo) return;
    b.pt.txt[k] = e.target.value;
    b.title = ptTitle(c, b);
    if (b.spine === null) $('#cSpine').value = spineText(b);
    renderMock();
    renderBookTabs();
  });
  function renderSwatches() {
    const b = book();
    $('#swatches').innerHTML = SWATCHES.map((s, i) => `<button type="button" data-sw="${i}" class="${i === 0 ? 'orig' : ''} ${b.swatch === i ? 'on' : ''}" ${s ? `style="background:${s[0]}"` : ''} aria-label="${i === 0 ? 'Originalna boja' : 'Boja ' + i}"></button>`).join('') +
      (b.swatch === -1 ? `<button type="button" data-sw="-1" class="on" style="background:${b.bg}" aria-label="Tvoja boja"></button>` : '');
  }
  $('#coverKind').addEventListener('click', (e) => {
    const b = e.target.closest('[data-kind]');
    if (!b) return;
    state.kind = b.dataset.kind;
    state.chip = startChip();
    $('#coverSearch').value = '';
    book().query = '';
    renderKinds(); renderChips(); renderGrid();
  });
  $('#coverChips').addEventListener('click', (e) => {
    const b = e.target.closest('[data-chip]');
    if (!b) return;
    state.chip = b.dataset.chip;
    $('#coverSearch').value = '';
    book().query = '';
    renderChips(); renderGrid();
  });
  $('#coverSearch').addEventListener('input', () => {
    const q = $('#coverSearch').value.trim();
    book().query = q;
    if (q && state.chip !== allChip()) { state.chip = allChip(); renderChips(); }
    renderGrid();
    searchCombo.open();
  });
  $('#coverGrid').addEventListener('click', (e) => {
    if (e.target.closest('[data-fillmore]')) { const q = $('#coverSearch').value.trim(); state.fillMore = { q, n: (state.fillMore && state.fillMore.q === q ? state.fillMore.n : 0) + 1 }; renderGrid(); return; }
    if (e.target.closest('[data-more]')) { state.more = $('#coverSearch').value.trim(); renderGrid(); return; }
    const c = e.target.closest('[data-cover]');
    if (!c) return;
    const hit = coverById(c.dataset.cover);
    if (c.dataset.as) { selectCover(c.dataset.cover, false, c.dataset.as); return; }
    // klik na destinaciju iz pregleda: prikaži je zajedno sa još primera dizajna
    if (!$('#coverSearch').value.trim() && hit && !hit.other && hit.id !== 'custom') {
      $('#coverSearch').value = hit.name;
      book().query = hit.name;
      state.chip = allChip();
      renderChips();
      renderGrid();
      const scroller = $('#coverGrid').closest('.panel');
      if (scroller) scroller.scrollTo({ top: 0, behavior: 'smooth' });
    }
    selectCover(c.dataset.cover);
  });
  [['#cTitle', 'title'], ['#cSub', 'sub'], ['#cYear', 'year'], ['#cSpine', 'spine'], ['#cCustom', 'note']].forEach(([sel, key]) => {
    $(sel).addEventListener('input', (e) => {
      const b = book();
      b[key] = e.target.value;
      if (key !== 'note') renderMock();
      if (key === 'title') renderBookTabs();
      if ((key === 'title' || key === 'sub') && b.spine === null) $('#cSpine').value = spineText(b);
    });
  });
  // Jedan klik bira boju, dupli klik (ili dupli dodir na telefonu) otvara celu paletu.
  let lastSw = { i: null, t: 0 };
  $('#swatches').addEventListener('click', (e) => {
    const t = e.target.closest('[data-sw]');
    if (!t) return;
    const b = book(), i = +t.dataset.sw, now = Date.now();
    const twice = lastSw.i === i && now - lastSw.t < 420;
    const phone = matchMedia('(max-width:820px)').matches;
    lastSw = { i, t: now };
    if (twice && !phone) { lastSw = { i: null, t: 0 }; openPicker('bg'); return; }
    if (i !== -1) {
      const s = SWATCHES[i];
      b.swatch = i; b.inkSet = false;
      b.bg = s ? s[0] : null; b.ink = s ? s[1] : null; b.accent = s ? s[2] : null;
      renderSwatches();
      renderMock();
    }
    if (phone) openPicker('bg');
  });

  /* ---------- 3D knjiga: prednja, rikna, zadnja ---------- */
  const FACE_RY = { front: 18, spine: 90, back: 162 };
  let mockRy = 22;
  function setRy(v, anim) {
    mockRy = v;
    const el = $('#book3d');
    if (!el) return;
    el.classList.toggle('dragging', !anim);
    el.style.setProperty('--ry', v + 'deg');
    const n = ((v % 360) + 360) % 360;
    el.style.setProperty('--sc', Math.abs(n - 90) < 25 ? 1.22 : 1);
    $('#coverMock').classList.toggle('side', Math.abs(n - 90) < 25 || Math.abs(n - 270) < 25);
  }
  function showFace(f) {
    $$('#faceTabs button').forEach((x) => { x.classList.toggle('on', x.dataset.face === f); x.setAttribute('aria-selected', x.dataset.face === f); });
    $$('#tunerMain .pane').forEach((x) => (x.hidden = x.dataset.pane !== f));
    const t = FACE_RY[f];
    setRy(t + 360 * Math.round((mockRy - t) / 360), true);
  }
  $('#faceTabs').addEventListener('click', (e) => { const t = e.target.closest('[data-face]'); if (t) showFace(t.dataset.face); });
  (function () {
    const m = $('#coverMock');
    let drag = null;
    m.addEventListener('pointerdown', (e) => {
      if (!$('#book3d')) return;
      drag = { x: e.clientX, ry: mockRy };
      m.setPointerCapture(e.pointerId);
    });
    m.addEventListener('pointermove', (e) => { if (drag) setRy(drag.ry + (e.clientX - drag.x) * 0.6, false); });
    const end = () => { if (!drag) return; drag = null; const el = $('#book3d'); if (el) el.classList.remove('dragging'); };
    m.addEventListener('pointerup', end);
    m.addEventListener('pointercancel', end);
  })();
  $('#tLayout').addEventListener('click', (e) => {
    const t = e.target.closest('[data-l]');
    if (!t) return;
    const b = book();
    b.back.layout = t.dataset.l;
    b.back.picks = [];
    $$('#tLayout button').forEach((x) => x.classList.toggle('on', x === t));
    $('#tBackText').hidden = b.back.layout === 'none';
    renderMock();
  });
  $('#tBackTitle').addEventListener('input', (e) => { book().back.title = e.target.value; renderMock(); });
  $('#tBackSub').addEventListener('input', (e) => { book().back.sub = e.target.value; renderMock(); });

  /* ---------- paleta boja ---------- */
  const hsv2rgb = (h, s, v) => {
    const fn = (n) => { const k = (n + h / 60) % 6; return v - v * s * Math.max(0, Math.min(k, 4 - k, 1)); };
    return [fn(5), fn(3), fn(1)].map((x) => Math.round(x * 255));
  };
  const toHex = (rgb) => '#' + rgb.map((x) => x.toString(16).padStart(2, '0')).join('');
  const hexRgb = (hex) => {
    let h = hex.replace('#', '');
    if (h.length === 3) h = h.replace(/./g, '$&$&');
    const n = parseInt(h, 16);
    return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
  };
  const rgb2hsv = (rgb) => {
    const [r, g, b] = rgb.map((x) => x / 255);
    const M = Math.max(r, g, b), m = Math.min(r, g, b), d = M - m;
    let h = 0;
    if (d) { h = M === r ? ((g - b) / d) % 6 : M === g ? (b - r) / d + 2 : (r - g) / d + 4; h *= 60; if (h < 0) h += 360; }
    return { h, s: M ? d / M : 0, v: M };
  };
  const readable = (hex) => { const [r, g, b] = hexRgb(hex); return (r * 299 + g * 587 + b * 114) / 1000 > 150 ? NAVY : '#ffffff'; };

  let pk = null;
  function openPicker(target) {
    const b = book(), c = cover(b);
    const cur = target === 'bg' ? b.bg || c.bg : b.ink || c.ink;
    pk = Object.assign({ target }, rgb2hsv(hexRgb(cur)));
    $('#tunerMain').hidden = true;
    $('#picker').hidden = false;
    $('#customizer').classList.add('picking');
    paintPicker();
  }
  function closePicker() {
    pk = null;
    $('#picker').hidden = true;
    $('#tunerMain').hidden = false;
    $('#customizer').classList.remove('picking');
  }
  function paintPicker() {
    const hex = toHex(hsv2rgb(pk.h, pk.s, pk.v));
    $('#pkSV').style.background = `linear-gradient(0deg, #000, transparent), linear-gradient(90deg, #fff, transparent), hsl(${pk.h} 100% 50%)`;
    $('#pkDot').style.left = pk.s * 100 + '%';
    $('#pkDot').style.top = (1 - pk.v) * 100 + '%';
    $('#pkDot').style.background = hex;
    $('#pkHueDot').style.left = (pk.h / 360) * 100 + '%';
    $('#pkHueDot').style.background = `hsl(${pk.h} 100% 50%)`;
    $('#pkPrev').style.background = hex;
    if (document.activeElement !== $('#pkHex')) $('#pkHex').value = hex;
    $$('#pkTarget button').forEach((x) => x.classList.toggle('on', x.dataset.t === pk.target));
  }
  function applyPicker() {
    const b = book(), hex = toHex(hsv2rgb(pk.h, pk.s, pk.v));
    if (pk.target === 'bg') {
      b.bg = hex; b.swatch = -1;
      if (!b.inkSet) b.ink = b.accent = readable(hex);
    } else {
      b.ink = b.accent = hex; b.inkSet = true;
      if (!b.bg) b.bg = cover(b).bg;
      if (b.swatch !== -1) b.swatch = -1;
    }
    paintPicker();
    renderMock();
  }
  function dragArea(el, fn) {
    let on = false;
    const at = (e) => { const r = el.getBoundingClientRect(); fn(clamp((e.clientX - r.left) / r.width, 0, 1), clamp((e.clientY - r.top) / r.height, 0, 1)); applyPicker(); };
    el.addEventListener('pointerdown', (e) => { on = true; el.setPointerCapture(e.pointerId); at(e); });
    el.addEventListener('pointermove', (e) => { if (on) at(e); });
    el.addEventListener('pointerup', () => (on = false));
    el.addEventListener('pointercancel', () => (on = false));
  }
  dragArea($('#pkSV'), (x, y) => { pk.s = x; pk.v = 1 - y; });
  dragArea($('#pkHue'), (x) => { pk.h = x * 359.9; });
  $('#pkTarget').addEventListener('click', (e) => { const b = e.target.closest('[data-t]'); if (b) openPicker(b.dataset.t); });
  function setHex(hex) { Object.assign(pk, rgb2hsv(hexRgb(hex))); applyPicker(); }
  $('#pkHex').addEventListener('input', (e) => {
    const v = e.target.value.trim();
    if (/^#?[0-9a-f]{6}$/i.test(v)) setHex(v.startsWith('#') ? v : '#' + v);
  });
  $('#pkHex').addEventListener('blur', () => { if (pk) $('#pkHex').value = toHex(hsv2rgb(pk.h, pk.s, pk.v)); });
  $('#pkDone').onclick = () => { closePicker(); renderSwatches(); };
  if (window.EyeDropper) {
    $('#pkEye').hidden = false;
    $('#pkEye').onclick = () => new window.EyeDropper().open().then((r) => setHex(r.sRGBHex)).catch(() => {});
  }
  // „Dogovori se sa nama": otvara Instagram, a knjiga nastavlja sa korom po dogovoru.
  $('#igHelp').addEventListener('click', () => {
    selectCover('custom');
    const b = book();
    if (!b.note) b.note = 'Dogovor na Instagramu';
    renderTuner();
    document.body.classList.remove('sheet-open');
  });
  $('#sheetClose').onclick = () => document.body.classList.remove('sheet-open');
  $('#sheetDone').onclick = () => { document.body.classList.remove('sheet-open'); $('#btnNext').click(); };

  /* ---------- geometrija kadra (A4 strana) ----------
     Isti model crta sličicu, editor i listanje knjige. */
  const defaultCrop = () => ({ cx: 0.5, cy: 0.5, rot: 0, frame: false });
  function geom(p) {
    const c = p.crop, sw = c.rot % 180 !== 0, m = c.frame ? FRAME : 0;
    const bw = 1 - 2 * m, bh = FH - 2 * m;
    const W = sw ? p.h : p.w, H = sw ? p.w : p.h;
    const s = Math.max(bw / W, bh / H);
    return { s, iw: W * s, ih: H * s, bw, bh };
  }
  function clampCrop(p) {
    const g = geom(p), c = p.crop;
    const mx = g.iw > g.bw ? (g.iw - g.bw) / 2 / g.iw : 0;
    const my = g.ih > g.bh ? (g.ih - g.bh) / 2 / g.ih : 0;
    c.cx = clamp(c.cx, 0.5 - mx, 0.5 + mx);
    c.cy = clamp(c.cy, 0.5 - my, 0.5 + my);
  }
  function place(img, p) {
    const g = geom(p), c = p.crop;
    const dx = (0.5 - c.cx) * g.iw, dy = (0.5 - c.cy) * g.ih;
    img.style.width = p.w * g.s * 100 + '%';
    img.style.left = 50 + dx * 100 + '%';
    img.style.top = 50 + (dy / FH) * 100 + '%';
    img.style.transform = `translate(-50%,-50%) rotate(${c.rot}deg)`;
    // beli okvir je sloj preko fotografije, isti u sličici, editoru i listanju
    const host = img.parentElement;
    if (!host) return;
    let wf = host.querySelector('.wf');
    if (c.frame && !wf) { wf = document.createElement('i'); wf.className = 'wf'; img.after(wf); }
    if (!c.frame && wf) wf.remove();
    if (c.frame) {
      const v = (FRAME / FH) * 100, h = FRAME * 100;
      wf.style.backgroundSize = `100% ${v}%, 100% ${v}%, ${h}% 100%, ${h}% 100%`;
    }
  }

  /* ---------- 3. Fotografije ---------- */
  /* Dekodiranje fotografije sa tačnom orijentacijom (EXIF). <img> je svuda isti (Safari, Chrome, telefon),
     a createImageBitmap u nekim pretraživačima ignoriše okretanje pa fotografije sa telefona ispadnu položene. */
  async function decodeImage(blob) {
    const url = URL.createObjectURL(blob), im = new Image();
    im.decoding = 'async';
    im.src = url;
    try { await im.decode(); }
    catch (e) { await new Promise((ok, no) => { im.onload = ok; im.onerror = () => no(new Error('decode')); }); }
    if (!im.naturalWidth) throw new Error('decode');
    return { width: im.naturalWidth, height: im.naturalHeight, src: im, close() { URL.revokeObjectURL(url); } };
  }
  const isHeic = (f) => /image\/hei[cf]/i.test(f.type) || /\.hei[cf]$/i.test(f.name);
  const isImage = (f) => /^image\//.test(f.type) || /\.(jpe?g|png|webp|gif|bmp|hei[cf])$/i.test(f.name);
  let heicLoad;
  function heicToJpeg(file) {
    heicLoad = heicLoad || new Promise((res, rej) => {
      const s = document.createElement('script');
      s.src = 'https://cdn.jsdelivr.net/npm/heic-to@1.5.2/dist/iife/heic-to.js';
      s.onload = res; s.onerror = rej;
      document.head.appendChild(s);
    });
    return heicLoad.then(() => window.HeicTo({ blob: file, type: 'image/jpeg', quality: 0.92 }));
  }

  // OffscreenCanvas ne usporava kad je tab u pozadini, pa učitavanje teče i dok korisnik radi nešto drugo.
  function makeCanvas(w, h) {
    if (window.OffscreenCanvas) return new OffscreenCanvas(w, h);
    const c = document.createElement('canvas');
    c.width = w; c.height = h;
    return c;
  }
  const canvasBlob = (c, q) => (c.convertToBlob ? c.convertToBlob({ type: 'image/jpeg', quality: q }) : new Promise((r) => c.toBlob(r, 'image/jpeg', q)));

  const queue = [];
  let running = 0;
  function pump() {
    while (running < 3 && queue.length) {
      const job = queue.shift();
      running++;
      loadPhoto(job).finally(() => { running--; pump(); });
    }
  }
  async function loadPhoto(p) {
    try {
      const blob = isHeic(p.file) ? await heicToJpeg(p.file) : p.file;
      const bmp = await decodeImage(blob);
      p.w = bmp.width; p.h = bmp.height;
      const sc = Math.min(1, 560 / Math.max(p.w, p.h));
      const cv = makeCanvas(Math.round(p.w * sc), Math.round(p.h * sc));
      cv.getContext('2d').drawImage(bmp.src, 0, 0, cv.width, cv.height);
      if (bmp.close) bmp.close();
      const t = await canvasBlob(cv, 0.82);
      p.thumb = URL.createObjectURL(t);
      p.url = URL.createObjectURL(blob);
      p.status = 'ready';
    } catch (e) {
      p.status = 'error';
    }
    updateSlot(p);
    updateMeter();
    if (col && !$('#colEd').hidden) colRender();
    if (p.onReady) p.onReady();
    if (p.status === 'ready') kickBg();
  }

  function addFiles(list) {
    const b = book();
    const files = [...list];
    const valid = files.filter(isImage);
    const notImg = files.length - valid.length;
    const known = new Set(b.photos.map((p) => p.name + '|' + p.size));
    let dup = 0, over = 0, added = 0;
    valid.forEach((f) => {
      const k = f.name + '|' + f.size;
      if (known.has(k)) { dup++; return; }
      if (b.photos.length >= MAX) { over++; return; }
      known.add(k);
      const p = { id: uid(), file: f, name: f.name, size: f.size, lm: f.lastModified, status: 'loading', crop: defaultCrop(), w: 0, h: 0 };
      b.photos.push(p);
      queue.push(p);
      added++;
    });
    renderPhotos();
    pump();
    const msg = [];
    if (dup) msg.push(`Preskočeno ${dup} duplikata`);
    if (over) msg.push(`Maksimum je ${MAX}, ${over} nije dodato`);
    if (notImg) msg.push(`${notImg} nisu fotografije`);
    if (msg.length) toast(msg.join('. ') + '.');
    else if (added && b.photos.length < MIN) toast(`Dodato ${added}. Još ${MIN - b.photos.length} do minimuma.`);
  }

  function pageInner(p) {
    if (p.status === 'error') return '<div class="fail">Ne možemo da otvorimo ovu fotografiju</div>';
    if (p.status === 'loading') return '<div class="shimmer"></div>';
    return `<img src="${p.thumb}" alt="" draggable="false">`;
  }
  function slotHTML(p, i) {
    return `<div class="slot ph" data-id="${p.id}" tabindex="0" role="button" aria-label="Fotografija ${i + 1}, otvori uređivanje">
      <div class="page">${pageInner(p)}</div>
      ${p.kind === 'collage' ? '<span class="col-tag">Kolaž</span>' : ''}
      <span class="num">${i + 1}</span>
      <button class="x" type="button" aria-label="Ukloni fotografiju ${i + 1}">×</button>
    </div>`;
  }
  const blank = '<div class="slot blank"><div class="page">prazna stranica</div></div>';

  let sortable, lastDrag = 0;
  // Veoma brz potez može da ostavi plutajuću kopiju fotografije; čistimo je čim se pusti miš.
  const sweepGhost = () => setTimeout(() => {
    if (!$('.sortable-chosen')) $$('.sortable-fallback').forEach((e) => e.remove());
  }, 120);
  window.addEventListener('pointerup', sweepGhost);
  window.addEventListener('mouseup', sweepGhost);

  function renderPhotos() {
    const b = book(), n = b.photos.length;
    $('#sideCover').innerHTML = coverOf(b);
    $('#boardTitle').textContent = totalBooks() > 1 ? `Fotografije za knjigu ${state.active + 1} od ${totalBooks()}: ${b.title || b.dest || ''}` : `Fotografije: ${b.title || b.dest || 'tvoja knjiga'}`;
    $('#drop').hidden = n > 0;
    $('#spreads').hidden = n === 0;
    $('#btnAdd').hidden = n === 0;
    const more = $('#addMore');
    more.hidden = n === 0 || n >= MAX;
    more.textContent = n < MIN ? `+ Dodaj još ${MIN - n} ${stranica(MIN - n)} do minimuma` : n % STEP ? `+ Dodaj još ${STEP - (n % STEP)}` : '+ Dodaj još stranica, po 4';
    if (n) {
      $('#spreads').innerHTML = blank + b.photos.map(slotHTML).join('') + (n % 2 === 0 ? blank : '');
      b.photos.forEach((p) => {
        if (p.status !== 'ready') return;
        const img = $(`[data-id="${p.id}"] img`);
        if (img) place(img, p);
      });
      if (!sortable && window.Sortable) {
        sortable = Sortable.create($('#spreads'), {
          draggable: '.ph', animation: 160, ghostClass: 'sortable-ghost', dragClass: 'sortable-drag',
          delay: 170, delayOnTouchOnly: true, touchStartThreshold: 5, forceFallback: true, fallbackOnBody: true, fallbackTolerance: 4,
          onEnd(evt) {
            lastDrag = Date.now();
            sweepGhost();
            if (evt.oldIndex === evt.newIndex) return;
            const order = $$('#spreads .ph').map((e) => e.dataset.id);
            const bk = book();
            bk.photos.sort((a, c) => order.indexOf(a.id) - order.indexOf(c.id));
            renderPhotos();
          },
        });
      }
    } else {
      $('#spreads').innerHTML = '';
    }
    updateMeter();
  }
  function updateSlot(p) {
    if (state.step !== 3) return;
    const el = $(`[data-id="${p.id}"]`);
    if (!el) return;
    const i = book().photos.indexOf(p);
    if (i < 0) return;
    el.outerHTML = slotHTML(p, i);
    const img = $(`[data-id="${p.id}"] img`);
    if (img) place(img, p);
  }
  function updateMeter() {
    if (state.step !== 3) return;
    const b = book(), n = countOf(b);
    const up = Math.min(MAX, Math.ceil(n / STEP) * STEP);
    const target = n <= b.plan ? b.plan : up;
    const good = goodCount(n);
    $('#mCount').textContent = n;
    $('#mLabel').textContent = good && n >= target ? stranica(n) : `od ${target}`;
    const bar = $('#mBar');
    bar.style.width = Math.min(100, (n / target) * 100) + '%';
    bar.classList.toggle('full', good);
    const loading = b.photos.filter((p) => p.status === 'loading').length;
    const fail = b.photos.filter((p) => p.status === 'error').length;
    const rows = [];
    if (loading) rows.push(['', `Učitavanje: još ${loading}`]);
    if (n < MIN) rows.push(['', `Još ${MIN - n} do minimuma od ${MIN}`]);
    else if (n % STEP) rows.push(['warn', `Broj mora biti deljiv sa 4. Dodaj još ${STEP - (n % STEP)} ili ukloni ${n % STEP}.`]);
    else if (!loading) {
      rows.push(['ok', 'Knjiga je spremna']);
    }
    if (fail) rows.push(['warn', `${fail} nije moguće otvoriti, ukloni ih`]);
    $('#status').innerHTML = rows.map(([c, t]) => `<li class="${c}">${esc(t)}</li>`).join('');
    const shownN = n < MIN ? 0 : up;
    $('#mPrice').textContent = shownN ? money(priceFor(shownN)) : `od ${money(TIERS[0][1])}`;
    $('#sideBack').innerHTML = backOf(b);
    const ready = b.photos.some((p) => p.status === 'ready');
    $('#btnPreview').disabled = !ready;
    $('#btnSort').disabled = n < 2;
    renderFoot();
  }
  function removePhoto(id) {
    const b = book(), i = b.photos.findIndex((p) => p.id === id);
    if (i < 0) return;
    const [p] = b.photos.splice(i, 1);
    renderPhotos();
    toast('Fotografija je uklonjena.', () => { b.photos.splice(i, 0, p); if (book() === b && state.step === 3) renderPhotos(); });
  }

  const pick = () => $('#file').click();
  $('#btnPick').addEventListener('click', (e) => { e.stopPropagation(); pick(); });
  $('#btnAdd').onclick = $('#addMore').onclick = pick;
  $('#drop').addEventListener('click', pick);
  $('#drop').addEventListener('keydown', (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); pick(); } });
  $('#file').addEventListener('change', (e) => { addFiles(e.target.files); e.target.value = ''; });
  $('#btnSort').onclick = () => {
    const b = book(), prev = b.photos.slice();
    b.photos.sort((x, y) => x.lm - y.lm);
    renderPhotos();
    toast('Poređano od najstarije ka najnovijoj.', () => { b.photos = prev; renderPhotos(); });
  };
  $('#spreads').addEventListener('click', (e) => {
    const x = e.target.closest('.x');
    const slot = e.target.closest('.ph');
    if (!slot) return;
    if (x) { removePhoto(slot.dataset.id); return; }
    if (Date.now() - lastDrag > 250) { const cp = book().photos.find((x) => x.id === slot.dataset.id); if (cp && cp.kind === 'collage') openCollage(cp); else openEditor(slot.dataset.id); }
  });
  $('#spreads').addEventListener('keydown', (e) => {
    const slot = e.target.closest('.ph');
    if (slot && e.target === slot && (e.key === 'Enter' || e.key === ' ')) { e.preventDefault(); const cp = book().photos.find((x) => x.id === slot.dataset.id); if (cp && cp.kind === 'collage') openCollage(cp); else openEditor(slot.dataset.id); }
  });

  // prevlačenje fajlova bilo gde na ekranu sa fotografijama
  let dragDepth = 0;
  const hasFiles = (e) => e.dataTransfer && [...e.dataTransfer.types].includes('Files');
  window.addEventListener('dragenter', (e) => { if (state.step === 3 && hasFiles(e)) { dragDepth++; $('#veil').hidden = false; } });
  window.addEventListener('dragleave', (e) => { if (state.step === 3 && hasFiles(e) && --dragDepth <= 0) { dragDepth = 0; $('#veil').hidden = true; } });
  window.addEventListener('dragover', (e) => { if (hasFiles(e)) e.preventDefault(); });
  window.addEventListener('drop', (e) => {
    if (!hasFiles(e)) return;
    e.preventDefault();
    dragDepth = 0; $('#veil').hidden = true;
    if (state.step === 3) addFiles(e.dataTransfer.files);
  });

  /* ---------- Uređivanje ---------- */
  let edP = null;
  const readyPhotos = () => book().photos.filter((p) => p.status === 'ready' && p.kind !== 'collage');
  function openEditor(id) {
    const p = book().photos.find((x) => x.id === id);
    if (!p || p.status !== 'ready') return;
    edP = p;
    $('#editor').hidden = false;
    document.documentElement.style.overflow = 'hidden';
    sizeFrame();
    renderEditor();
  }
  function closeEditor() {
    $('#editor').hidden = true;
    document.documentElement.style.overflow = '';
    const id = edP && edP.id;
    edP = null;
    renderPhotos();
    const s = id && $(`[data-id="${id}"]`);
    if (s) s.focus({ preventScroll: false });
  }
  function sizeFrame() {
    const st = $('#edStage').getBoundingClientRect();
    const narrow = matchMedia('(max-width:820px)').matches;
    const maxW = st.width - (narrow ? 96 : 140), maxH = st.height - (narrow ? 34 : 38);
    let h = maxH, w = h / FH;
    if (w > maxW) { w = maxW; h = w * FH; }
    const fr = $('#edFrame');
    fr.style.width = Math.round(w) + 'px';
    fr.style.height = Math.round(h) + 'px';
  }
  function renderEditor() {
    const p = edP, list = readyPhotos(), i = list.indexOf(p);
    const img = $('#edImg');
    if (img.dataset.src !== p.url) { img.src = p.url; img.dataset.src = p.url; }
    clampCrop(p);
    place(img, p);
    $('#edPos').textContent = `Stranica ${book().photos.indexOf(p) + 1} od ${book().photos.length}`;
    $('#edFrameT').checked = p.crop.frame;
    $('#edPrev').setAttribute('aria-disabled', i <= 0);
    $('#edNext').setAttribute('aria-disabled', i >= list.length - 1);
  }
  function step(d) {
    const list = readyPhotos(), i = list.indexOf(edP) + d;
    if (i < 0 || i >= list.length) return;
    edP = list[i];
    renderEditor();
  }
  $('#edPrev').onclick = () => step(-1);
  $('#edNext').onclick = () => step(1);
  $('#edClose').onclick = $('#edDone').onclick = closeEditor;
  $('#edFrameT').addEventListener('change', (e) => { edP.crop.frame = e.target.checked; clampCrop(edP); place($('#edImg'), edP); });
  $('#edRot').onclick = () => { const c = edP.crop; c.rot = (c.rot + 90) % 360; c.cx = c.cy = 0.5; renderEditor(); };
  $('#edReset').onclick = () => { edP.crop = defaultCrop(); renderEditor(); };
  $('#edRemove').onclick = () => {
    const list = readyPhotos(), i = list.indexOf(edP);
    const id = edP.id, nextP = list[i + 1] || list[i - 1];
    if (!nextP) { closeEditor(); removePhoto(id); return; }
    edP = nextP;
    removePhoto(id);
    renderEditor();
  };
  // pomeranje kadra prstom ili mišem
  (function () {
    const fr = $('#edFrame');
    let drag = null;
    fr.addEventListener('pointerdown', (e) => {
      drag = { x: e.clientX, y: e.clientY, cx: edP.crop.cx, cy: edP.crop.cy };
      fr.setPointerCapture(e.pointerId);
      fr.classList.add('dragging');
    });
    fr.addEventListener('pointermove', (e) => {
      if (!drag) return;
      const g = geom(edP), w = fr.clientWidth;
      edP.crop.cx = drag.cx - (e.clientX - drag.x) / (w * g.iw);
      edP.crop.cy = drag.cy - (e.clientY - drag.y) / (w * g.ih);
      clampCrop(edP);
      place($('#edImg'), edP);
    });
    const end = () => { drag = null; fr.classList.remove('dragging'); };
    fr.addEventListener('pointerup', end);
    fr.addEventListener('pointercancel', end);
  })();


  /* ---------- Kolaž: više fotografija na jednoj A4 strani; u knjigu ulazi kao JEDNA slika ----------
     Kolaž se iscrta u A4 (2480×3508) i dalje se ponaša kao obična fotografija (listanje, slanje, štampa). */
  const COL = {
    '1': [[0, 0, 1, 1]],
    '2v': [[0, 0, 1, 0.5], [0, 0.5, 1, 0.5]],
    '2h': [[0, 0, 0.5, 1], [0.5, 0, 0.5, 1]],
    '2a': [[0, 0, 1, 0.62], [0, 0.62, 1, 0.38]],
    '3a': [[0, 0, 1, 0.5], [0, 0.5, 0.5, 0.5], [0.5, 0.5, 0.5, 0.5]],
    '3b': [[0, 0, 0.55, 1], [0.55, 0, 0.45, 0.5], [0.55, 0.5, 0.45, 0.5]],
    '3c': [[0, 0, 1, 1 / 3], [0, 1 / 3, 1, 1 / 3], [0, 2 / 3, 1, 1 / 3]],
    '3d': [[0, 0, 0.5, 0.5], [0.5, 0, 0.5, 0.5], [0, 0.5, 1, 0.5]],
    '4g': [[0, 0, 0.5, 0.5], [0.5, 0, 0.5, 0.5], [0, 0.5, 0.5, 0.5], [0.5, 0.5, 0.5, 0.5]],
    '4a': [[0, 0, 1, 0.55], [0, 0.55, 1 / 3, 0.45], [1 / 3, 0.55, 1 / 3, 0.45], [2 / 3, 0.55, 1 / 3, 0.45]],
    '4b': [[0, 0, 0.6, 1], [0.6, 0, 0.4, 1 / 3], [0.6, 1 / 3, 0.4, 1 / 3], [0.6, 2 / 3, 0.4, 1 / 3]],
    '5a': [[0, 0, 0.5, 0.5], [0.5, 0, 0.5, 0.5], [0, 0.5, 1 / 3, 0.5], [1 / 3, 0.5, 1 / 3, 0.5], [2 / 3, 0.5, 1 / 3, 0.5]],
    '6g': [[0, 0, 0.5, 1 / 3], [0.5, 0, 0.5, 1 / 3], [0, 1 / 3, 0.5, 1 / 3], [0.5, 1 / 3, 0.5, 1 / 3], [0, 2 / 3, 0.5, 1 / 3], [0.5, 2 / 3, 0.5, 1 / 3]],
  };
  let col = null;
  // mesta u jedinicama širine strane (visina je FH); beli razmak i okvir su opcija
  function colRects(layout, gapOn) {
    const m = gapOn ? 0.04 : 0, g = gapOn ? 0.016 : 0;
    const ax = m - g / 2, ay = m - g / 2, aw = 1 - 2 * m + g, ah = FH - 2 * m + g;
    return COL[layout].map(([fx, fy, fw, fh]) => [ax + fx * aw + g / 2, ay + fy * ah + g / 2, fw * aw - g, fh * ah - g]);
  }
  function colGeom(cell, cw, ch) {
    const ph = cell.ph, sw = cell.rot % 180 !== 0;
    const W = sw ? ph.h : ph.w, H = sw ? ph.w : ph.h;
    const s = Math.max(cw / W, ch / H) * cell.zoom, iw = W * s, ih = H * s;
    const mx = iw > cw ? (iw - cw) / 2 / iw : 0, my = ih > ch ? (ih - ch) / 2 / ih : 0;
    cell.cx = clamp(cell.cx, 0.5 - mx, 0.5 + mx);
    cell.cy = clamp(cell.cy, 0.5 - my, 0.5 + my);
    return { s, iw, ih };
  }
  const newCell = (ph) => ({ ph: ph || null, cx: 0.5, cy: 0.5, zoom: 1, rot: 0 });
  function openCollage(item, seed) {
    const b = book();
    col = { item: item || null, seed: seed || null, layout: item ? item.layout : '2v', gap: item ? item.gap : false, cells: [], sel: 0, extra: [], parts: item ? item.parts.slice() : [] };
    if (item) col.cells = item.cells.map((c) => Object.assign({}, c));
    else col.cells = COL[col.layout].map((_, i) => newCell(i === 0 ? seed : null));
    col.sel = Math.max(0, col.cells.findIndex((c) => !c.ph));
    $('#colGap').checked = col.gap;
    $('#colTitle').textContent = item ? 'Uredi kolaž' : 'Novi kolaž';
    $('#colDone').textContent = 'Gotovo';
    $('#colDone').disabled = false;
    $('#colEd').hidden = false;
    document.documentElement.style.overflow = 'hidden';
    colRender();
    sizeCol();
  }
  function closeCollage() {
    $('#colEd').hidden = true;
    document.documentElement.style.overflow = '';
    col = null;
  }
  function sizeCol() {
    const st = $('#colStage').getBoundingClientRect();
    if (!st.height || !st.width) return;
    const narrow = matchMedia('(max-width:820px)').matches;
    let h = st.height - (narrow ? 20 : 36), w = h / FH;
    if (w > st.width - (narrow ? 16 : 32)) { w = st.width - (narrow ? 16 : 32); h = w * FH; }
    const el = $('#colPage');
    el.style.width = Math.round(w) + 'px';
    el.style.height = Math.round(h) + 'px';
  }
  new ResizeObserver(() => { if (!$('#colEd').hidden) sizeCol(); }).observe($('#colStage'));
  function colPlace(i) {
    const r = colRects(col.layout, col.gap)[i], cell = col.cells[i], el = $(`#colPage [data-i="${i}"] img`);
    if (!el || !cell.ph) return;
    const g = colGeom(cell, r[2], r[3]);
    if (el.dataset.src !== cell.ph.url) { el.src = cell.ph.url; el.dataset.src = cell.ph.url; }
    el.style.width = ((cell.ph.w * g.s) / r[2]) * 100 + '%';
    el.style.left = ((r[2] / 2 + (0.5 - cell.cx) * g.iw) / r[2]) * 100 + '%';
    el.style.top = ((r[3] / 2 + (0.5 - cell.cy) * g.ih) / r[3]) * 100 + '%';
    el.style.transform = `translate(-50%,-50%) rotate(${cell.rot}deg)`;
  }
  function colPool() {
    const b = book();
    return [...b.photos.filter((p) => p.kind !== 'collage' && p.status === 'ready'), ...col.parts, ...col.extra].filter((p, i, a) => p.status === 'ready' && a.indexOf(p) === i);
  }
  function colRender() {
    const rects = colRects(col.layout, col.gap);
    $('#colPage').innerHTML = rects.map((r, i) => `<div class="col-cell ${i === col.sel ? 'on' : ''}" data-i="${i}" style="left:${r[0] * 100}%;top:${(r[1] / FH) * 100}%;width:${r[2] * 100}%;height:${(r[3] / FH) * 100}%">${col.cells[i].ph ? '<img alt="" draggable="false">' : '<span class="col-plus">+</span>'}</div>`).join('');
    rects.forEach((_, i) => colPlace(i));
    $('#colLayouts').innerHTML = Object.keys(COL).map((k) => `<button type="button" data-l="${k}" class="${k === col.layout ? 'on' : ''}" aria-label="${COL[k].length === 1 ? 'Samo jedna fotografija (bez kolaža)' : 'Raspored ' + COL[k].length + ' fotografije'}" title="${COL[k].length === 1 ? 'Samo jedna fotografija (bez kolaža)' : ''}"><svg viewBox="0 0 1 ${FH}" preserveAspectRatio="xMidYMid meet">${colRects(k, true).map((r) => `<rect x="${r[0]}" y="${r[1]}" width="${r[2]}" height="${r[3]}" rx="0.02"/>`).join('')}</svg></button>`).join('');
    const cell = col.cells[col.sel];
    $('#colTools').hidden = !(cell && cell.ph);
    if (cell && cell.ph) $('#colZoom').value = Math.round(cell.zoom * 100);
    const used = new Set(col.cells.map((c) => c.ph && c.ph.id));
    $('#colPick').innerHTML = '<button type="button" class="be-add" aria-label="Dodaj slike iz telefona">+</button>' + colPool().map((p) => `<button type="button" data-p="${p.id}" class="${used.has(p.id) ? 'on' : ''}" aria-label="Izaberi fotografiju" style="background-image:url('${p.thumb}')"></button>`).join('');
    const n = col.cells.filter((c) => c.ph).length;
    // koliko će knjiga imati stranica kad se kolaž sačuva (kolaž je jedna strana, fotografije iz knjige u njemu više nisu posebne strane)
    const bk = book(), usedBook = col.cells.filter((c) => c.ph && bk.photos.includes(c.ph)).length;
    const after = bk.photos.length - usedBook + (col.item ? 0 : 1), fix = after % STEP;
    const nt = $('#colNote');
    nt.className = 'help ' + (fix || after < MIN ? 'warn' : 'ok');
    nt.textContent = `${n} od ${col.cells.length} mesta popunjeno. Posle kolaža knjiga ima ${after} ${stranica(after)}. ` + (fix ? `Broj stranica mora biti deljiv sa 4: dodaj još ${STEP - fix} ili ukloni ${fix}.` : after < MIN ? `Do minimuma fali još ${MIN - after}.` : 'Broj stranica se poklapa.');
  }
  function colAssign(ph) {
    col.cells.forEach((c) => { if (c.ph === ph) c.ph = null; });
    Object.assign(col.cells[col.sel], newCell(ph));
    const k = col.cells.findIndex((c, j) => !c.ph && j !== col.sel);
    col.sel = k >= 0 ? k : col.sel;
    colRender();
  }
  $('#edCollage').onclick = () => { const p = edP; closeEditor(); openCollage(null, p); };
  $('#colClose').onclick = closeCollage;
  $('#colLayouts').addEventListener('click', (e) => {
    const t = e.target.closest('[data-l]');
    if (!t || !col) return;
    const keep = col.cells.filter((c) => c.ph), n = COL[t.dataset.l].length;
    col.layout = t.dataset.l;
    col.cells = COL[col.layout].map((_, i) => keep[i] || newCell());
    keep.slice(n).forEach((c) => { if (!book().photos.includes(c.ph) && !col.extra.includes(c.ph) && !col.parts.includes(c.ph)) col.extra.push(c.ph); });
    col.sel = Math.max(0, col.cells.findIndex((c) => !c.ph));
    colRender();
  });
  $('#colGap').addEventListener('change', (e) => { col.gap = e.target.checked; colRender(); });
  $('#colPick').addEventListener('click', (e) => {
    if (e.target.closest('.be-add')) { $('#colFile').click(); return; }
    const t = e.target.closest('[data-p]');
    if (!t || !col) return;
    const ph = colPool().find((p) => p.id === t.dataset.p);
    if (ph) colAssign(ph);
  });
  $('#colFile').addEventListener('change', (e) => {
    const c0 = col;
    [...e.target.files].filter(isImage).forEach((f, k) => {
      const p = { id: uid(), file: f, name: f.name, size: f.size, lm: f.lastModified, status: 'loading', crop: defaultCrop(), w: 0, h: 0 };
      p.onReady = () => {
        if (!col || col !== c0 || p.status !== 'ready') return;
        if (k === 0 && !col.cells[col.sel].ph) colAssign(p); else colRender();
      };
      col.extra.push(p);
      queue.push(p);
    });
    pump();
    e.target.value = '';
  });
  $('#colZoom').addEventListener('input', (e) => {
    const cell = col.cells[col.sel];
    if (!cell || !cell.ph) return;
    cell.zoom = e.target.value / 100;
    colPlace(col.sel);
  });
  $('#colRot').onclick = () => { const c = col.cells[col.sel]; if (!c || !c.ph) return; c.rot = (c.rot + 90) % 360; c.cx = c.cy = 0.5; colPlace(col.sel); };
  $('#colClear').onclick = () => { const c = col.cells[col.sel]; if (!c || !c.ph) return; if (!book().photos.includes(c.ph) && !col.parts.includes(c.ph) && !col.extra.includes(c.ph)) col.extra.push(c.ph); Object.assign(c, newCell()); colRender(); };
  // klik bira mesto, prevlačenje pomera fotografiju u mestu
  (function () {
    const page = $('#colPage');
    let drag = null;
    page.addEventListener('pointerdown', (e) => {
      const el = e.target.closest('.col-cell');
      if (!el || !col) return;
      const i = +el.dataset.i;
      const was = col.sel;
      col.sel = i;
      const cell = col.cells[i];
      if (was !== i) { page.querySelectorAll('.col-cell').forEach((x) => x.classList.toggle('on', +x.dataset.i === i)); $('#colTools').hidden = !cell.ph; if (cell.ph) $('#colZoom').value = Math.round(cell.zoom * 100); }
      if (!cell.ph) return;
      const r = colRects(col.layout, col.gap)[i], g = colGeom(cell, r[2], r[3]);
      drag = { x: e.clientX, y: e.clientY, cx: cell.cx, cy: cell.cy, i, g, k: 1 / page.clientWidth };
      page.setPointerCapture(e.pointerId);
    });
    page.addEventListener('pointermove', (e) => {
      if (!drag) return;
      const cell = col.cells[drag.i];
      cell.cx = drag.cx - (e.clientX - drag.x) * drag.k / drag.g.iw;
      cell.cy = drag.cy - (e.clientY - drag.y) * drag.k / drag.g.ih;
      colPlace(drag.i);
    });
    const end = () => { drag = null; };
    page.addEventListener('pointerup', end);
    page.addEventListener('pointercancel', end);
  })();
  async function colRenderBlob() {
    const rects = colRects(col.layout, col.gap), cv = makeCanvas(A4W, A4H), x = cv.getContext('2d');
    x.fillStyle = '#fff';
    x.fillRect(0, 0, A4W, A4H);
    x.imageSmoothingEnabled = true;
    x.imageSmoothingQuality = 'high';
    for (let i = 0; i < rects.length; i++) {
      const cell = col.cells[i], r = rects[i], g = colGeom(cell, r[2], r[3]), px = A4W;
      const bmp = await decodeImage(await (await fetch(cell.ph.url)).blob());
      x.save();
      x.beginPath();
      x.rect(r[0] * px, r[1] * px, r[2] * px, r[3] * px);
      x.clip();
      x.translate((r[0] + r[2] / 2 + (0.5 - cell.cx) * g.iw) * px, (r[1] + r[3] / 2 + (0.5 - cell.cy) * g.ih) * px);
      x.rotate((cell.rot * Math.PI) / 180);
      const dw = cell.ph.w * g.s * px, dh = cell.ph.h * g.s * px;
      x.drawImage(bmp.src, -dw / 2, -dh / 2, dw, dh);
      x.restore();
      if (bmp.close) bmp.close();
    }
    const full = await canvasBlob(cv, 0.93);
    const th = makeCanvas(560, Math.round((560 * A4H) / A4W));
    th.getContext('2d').drawImage(cv, 0, 0, th.width, th.height);
    return { full, thumb: await canvasBlob(th, 0.82) };
  }
  $('#colDone').onclick = async () => {
    if (!col) return;
    if (col.cells.some((c) => !c.ph)) { toast('Popuni sva mesta (dodirni mesto, pa izaberi fotografiju) ili izaberi raspored sa manje fotografija.'); return; }
    if (col.layout === '1') {
      const b = book(), chosen = col.cells[0].ph, item = col.item, before = b.photos.slice();
      let rest = b.photos.filter((x) => x !== item);
      const at = item ? Math.max(0, b.photos.indexOf(item)) : -1;
      if (item) {
        const idx = item.origIdx || {};
        const back = (item.parts || []).filter((p) => !rest.includes(p)).sort((x, y) => (idx[x.id] ?? 1e9) - (idx[y.id] ?? 1e9));
        back.forEach((p) => rest.splice(Math.min(idx[p.id] ?? rest.length, rest.length), 0, p));
      }
      if (!rest.includes(chosen)) {
        const seedAt = col.seed ? rest.indexOf(col.seed) : -1;
        rest.splice(seedAt >= 0 ? seedAt + 1 : at >= 0 ? Math.min(at, rest.length) : rest.length, 0, chosen);
      }
      chosen.crop = defaultCrop();
      chosen.crop.rot = col.cells[0].rot || 0;
      b.photos = rest;
      closeCollage();
      renderPhotos();
      toast(item ? 'Kolaž je uklonjen, strane su kao ranije.' : 'Ostala je jedna fotografija.', () => { b.photos = before; if (book() === b && state.step === 3) renderPhotos(); });
      return;
    }
    const btn = $('#colDone');
    btn.disabled = true; btn.textContent = 'Pravim…';
    try {
      const b = book(), { full, thumb } = await colRenderBlob();
      const wasEdit = !!col.item, item = col.item || { kind: 'collage', status: 'ready', crop: defaultCrop(), w: A4W, h: A4H, name: 'kolaz.jpg' };
      const before = b.photos.slice(), oldIdx = wasEdit ? b.photos.indexOf(item) : -1, seedIdx = col.seed ? before.indexOf(col.seed) : -1;
      const used = col.cells.map((c) => c.ph);
      // fotografije iz knjige koje su ušle u kolaž više nisu posebne strane; ostale iz starog kolaža se vraćaju u knjigu
      const fromBook = used.filter((p) => b.photos.includes(p));
      const parts = [...new Set([...used.filter((p) => fromBook.includes(p) || col.parts.includes(p))])];
      const giveBack = col.parts.filter((p) => !used.includes(p));
      b.photos = b.photos.filter((p) => !fromBook.includes(p));
      const without = before.filter((x) => x !== item);
      item.origIdx = Object.assign({}, item.origIdx || {});
      fromBook.forEach((p) => { item.origIdx[p.id] = without.indexOf(p); });
      item.id = uid(); // nova slika = nova šifra (stara se nikad ne šalje)
      item.layout = col.layout; item.gap = col.gap; item.cells = col.cells.map((c) => Object.assign({}, c)); item.parts = parts;
      item.file = new File([full], 'kolaz.jpg', { type: 'image/jpeg' });
      item.size = full.size; item.lm = Date.now();
      if (item.url) URL.revokeObjectURL(item.url);
      if (item.thumb) URL.revokeObjectURL(item.thumb);
      item.url = URL.createObjectURL(full);
      item.thumb = URL.createObjectURL(thumb);
      if (wasEdit && oldIdx >= 0) { const at = b.photos.findIndex((p) => before.indexOf(p) > oldIdx); if (!b.photos.includes(item)) b.photos.splice(at < 0 ? b.photos.length : at, 0, item); }
      else b.photos.splice(seedIdx >= 0 ? b.photos.filter((p) => before.indexOf(p) < seedIdx).length : b.photos.length, 0, item);
      giveBack.forEach((p) => { if (!b.photos.includes(p)) b.photos.push(p); });
      closeCollage();
      renderPhotos();
      toast(wasEdit ? 'Kolaž je sačuvan.' : 'Kolaž je dodat u knjigu kao jedna strana.', wasEdit ? undefined : () => { b.photos = before; if (book() === b && state.step === 3) renderPhotos(); });
    } catch (err) {
      toast('Kolaž nije uspeo da se napravi. Pokušaj ponovo.');
    }
    btn.disabled = false; btn.textContent = 'Gotovo';
  };

  /* ---------- Zadnja korica: uređivanje ---------- */
  let beSlot = 0;
  function openBack() {
    beSlot = 0;
    const b = book();
    $('#beTitle').value = backTitle(b);
    $('#beSub').value = backSub(b);
    $('#backEd').hidden = false;
    document.documentElement.style.overflow = 'hidden';
    renderBack();
    sizeBack();
  }
  function closeBack() {
    $('#backEd').hidden = true;
    document.documentElement.style.overflow = '';
    if (state.step === 3) renderPhotos();
    if (state.step === 4) renderSend();
  }
  // korica uvek staje u prostor koji ostane iznad/levo od panela, i kad se panel promeni
  new ResizeObserver(() => { if (!$('#backEd').hidden) sizeBack(); }).observe($('#beStage'));
  function sizeBack() {
    const st = $('#beStage').getBoundingClientRect();
    if (!st.height || !st.width) return;
    let h = st.height - 36, w = h / FH;
    if (w > st.width - 32) { w = st.width - 32; h = w * FH; }
    const el = $('#beBook');
    el.style.width = Math.round(w) + 'px';
    el.style.height = Math.round(h) + 'px';
  }
  function renderBack() {
    const b = book(), slots = BACK_SLOTS[b.back.layout];
    const pool = [...(b.back.extra || []).filter((p) => p.status === 'ready'), ...readyOf(b)];
    $('#beBook').innerHTML = backOf(b) + slots.map(([x, y, w, h], i) => `<button type="button" class="be-slot ${i === beSlot ? 'on' : ''}" data-s="${i}" aria-label="Mesto ${i + 1}" style="left:${(x / 420) * 100}%;top:${(y / 594) * 100}%;width:${(w / 420) * 100}%;height:${(h / 594) * 100}%"></button>`).join('');
    $$('#beLayout button').forEach((x) => x.classList.toggle('on', x.dataset.l === b.back.layout));
    $('#beText').hidden = b.back.layout === 'none';
    $('#bePickWrap').hidden = !slots.length;
    $('#beHelp').textContent = 'Klikni na mesto na korici, pa izaberi fotografiju.';
    const current = slots.map((_, i) => backPhoto(b, i)).filter(Boolean).map((p) => p.id);
    $('#bePick').innerHTML = '<button type="button" class="be-add" aria-label="Dodaj drugu sliku">+</button>' + pool.map((p) => `<button type="button" data-p="${p.id}" class="${current.includes(p.id) ? 'on' : ''}" aria-label="Izaberi fotografiju" style="background-image:url('${p.thumb}')"></button>`).join('');
  }
  $('#btnBackCover').onclick = openBack;
  $('#beClose').onclick = $('#beDone').onclick = closeBack;
  $('#beLayout').addEventListener('click', (e) => {
    const t = e.target.closest('[data-l]');
    if (!t) return;
    book().back.layout = t.dataset.l;
    book().back.picks = [];
    beSlot = 0;
    renderBack();
  });
  $('#beBook').addEventListener('click', (e) => {
    const t = e.target.closest('[data-s]');
    if (t) { beSlot = +t.dataset.s; renderBack(); }
  });
  $('#bePick').addEventListener('click', (e) => {
    if (e.target.closest('.be-add')) { $('#beFile').click(); return; }
    const t = e.target.closest('[data-p]');
    if (!t) return;
    const b = book(), n = BACK_SLOTS[b.back.layout].length;
    for (let i = 0; i < n; i++) { const p = backPhoto(b, i); b.back.picks[i] = p ? p.id : null; }
    b.back.picks[beSlot] = t.dataset.p;
    beSlot = (beSlot + 1) % n;
    renderBack();
  });
  $('#beFile').addEventListener('change', (e) => {
    const b = book(), slot = beSlot;
    [...e.target.files].filter(isImage).forEach((f, k) => {
      const p = { id: uid(), file: f, name: f.name, size: f.size, lm: f.lastModified, status: 'loading', crop: defaultCrop(), w: 0, h: 0 };
      p.onReady = () => {
        if (p.status === 'ready' && k === 0) b.back.picks[slot] = p.id;
        if (!$('#backEd').hidden) renderBack();
      };
      (b.back.extra = b.back.extra || []).push(p);
      queue.push(p);
    });
    pump();
    e.target.value = '';
  });
  $('#beTitle').addEventListener('input', (e) => { book().back.title = e.target.value; renderBack(); });
  $('#beSub').addEventListener('input', (e) => { book().back.sub = e.target.value; renderBack(); });

  /* ---------- Listanje knjige ---------- */
  let spreadsData = [], sp = 0, flipping = false;
  function buildSpreads() {
    const b = book(), ph = b.photos.filter((p) => p.status === 'ready');
    const out = [[null, { t: 'cover' }]];
    const pages = [{ t: 'blank' }, ...ph.map((p, i) => ({ t: 'photo', p, n: i + 1 }))];
    if (ph.length % 2 === 0) pages.push({ t: 'blank' });
    for (let i = 0; i < pages.length; i += 2) out.push([pages[i], pages[i + 1]]);
    out.push([{ t: 'back' }, null]);
    return out;
  }
  function pageNode(item, side) {
    const d = document.createElement('div');
    d.className = `fp ${side}-page`;
    if (!item) { d.style.visibility = 'hidden'; return d; }
    const b = book();
    if (item.t === 'cover') { d.innerHTML = coverOf(b); d.className = 'fp'; d.style.borderRadius = '3px 6px 6px 3px'; }
    if (item.t === 'back') { d.innerHTML = backOf(b); d.className = 'fp'; d.style.borderRadius = '6px 3px 3px 6px'; }
    if (item.t === 'photo') {
      const img = new Image();
      img.alt = ''; img.src = item.p.url;
      d.appendChild(img);
      place(img, item.p);
      const n = document.createElement('span');
      n.className = 'fp-num'; n.textContent = item.n;
      d.appendChild(n);
    }
    return d;
  }
  function sizeBook() {
    const narrow = matchMedia('(max-width:820px)').matches;
    const vh = innerHeight - (narrow ? 210 : 130);
    const vw = innerWidth - (narrow ? 16 : 180);
    let ph = vh, pw = ph / FH;
    if (pw * 2 > vw) { pw = vw / 2; ph = pw * FH; }
    const fb = $('#fb');
    fb.style.width = Math.floor(pw * 2) + 'px';
    fb.style.height = Math.floor(ph) + 'px';
  }
  function drawSpread() {
    const [l, r] = spreadsData[sp];
    $('#fbL').replaceChildren(pageNode(l, 'left'));
    $('#fbR').replaceChildren(pageNode(r, 'right'));
    positionBook();
    updateFlipUi();
  }
  function positionBook() {
    const [l, r] = spreadsData[sp];
    $('#fb').style.transform = !l ? 'translateX(-25%)' : !r ? 'translateX(25%)' : 'none';
  }
  function updateFlipUi() {
    const [l, r] = spreadsData[sp];
    let t = '';
    if (r && r.t === 'cover') t = 'Prednja korica';
    else if (l && l.t === 'back') t = 'Zadnja korica';
    else {
      const a = l && l.n, c = r && r.n;
      t = a && c ? `Stranice ${a} i ${c}` : `Stranica ${a || c}`;
    }
    $('#flipPos').textContent = t;
    $('#flipPrev').setAttribute('aria-disabled', sp <= 0);
    $('#flipNext').setAttribute('aria-disabled', sp >= spreadsData.length - 1);
  }
  function turn(d) {
    const to = sp + d;
    if (flipping || to < 0 || to >= spreadsData.length) return;
    if (matchMedia('(prefers-reduced-motion: reduce)').matches) { sp = to; drawSpread(); return; }
    flipping = true;
    const [cl, cr] = spreadsData[sp], [nl, nr] = spreadsData[to];
    const leaf = document.createElement('div');
    leaf.className = 'leaf';
    const fr = document.createElement('div'), bk = document.createElement('div');
    bk.className = 'bk';
    fr.appendChild(pageNode(d > 0 ? cr : nr, 'right'));
    bk.appendChild(pageNode(d > 0 ? nl : cl, 'left'));
    leaf.append(fr, bk);
    const fb = $('#fb');
    if (d > 0) {
      $('#fbR').replaceChildren(pageNode(nr, 'right'));
      leaf.style.transform = 'rotateY(0deg)';
    } else {
      $('#fbL').replaceChildren(pageNode(nl, 'left'));
      leaf.style.transform = 'rotateY(-180deg)';
    }
    fb.appendChild(leaf);
    sp = to;
    positionBook();
    updateFlipUi();
    leaf.getBoundingClientRect();
    leaf.style.transform = d > 0 ? 'rotateY(-180deg)' : 'rotateY(0deg)';
    let done = false;
    const finish = () => {
      if (done) return;
      done = true;
      if (d > 0) $('#fbL').replaceChildren(pageNode(nl, 'left'));
      else $('#fbR').replaceChildren(pageNode(nr, 'right'));
      leaf.remove();
      flipping = false;
    };
    leaf.addEventListener('transitionend', finish, { once: true });
    setTimeout(finish, 800);
  }
  let flipFrom = null;
  // kad ima više knjiga, u pregledu se bira koja se lista
  function renderFlipBooks() {
    const el = $('#flipBooks'), many = state.books.length > 1;
    el.hidden = !many;
    if (many) el.innerHTML = state.books.map((b, i) => `<button type="button" data-fb="${i}" class="${i === state.active ? 'on' : ''}"${b.photos.some((p) => p.status === 'ready') ? '' : ' disabled'}><i>${i + 1}</i><span>${esc(b.title || b.dest || 'Knjiga ' + (i + 1))}</span></button>`).join('');
  }
  $('#flipBooks').addEventListener('click', (e) => {
    const x = e.target.closest('[data-fb]');
    if (!x || x.disabled) return;
    state.active = +x.dataset.fb;
    openFlip();
  });
  function openFlip() {
    if (flipFrom === null) flipFrom = state.active;
    renderFlipBooks();
    spreadsData = buildSpreads();
    sp = 0;
    $('#flip').hidden = false;
    document.documentElement.style.overflow = 'hidden';
    sizeBook();
    drawSpread();
  }
  function closeFlip() {
    $('#flip').hidden = true; document.documentElement.style.overflow = '';
    if (flipFrom !== null) { state.active = flipFrom; flipFrom = null; }
  }
  $('#btnPreview').onclick = openFlip;
  $('#flipClose').onclick = closeFlip;
  $('#flipPrev').onclick = () => turn(-1);
  $('#flipNext').onclick = () => turn(1);
  $('#fb').addEventListener('click', (e) => { const x = e.clientX - $('#fb').getBoundingClientRect().left; turn(x < $('#fb').offsetWidth / 2 ? -1 : 1); });

  window.addEventListener('keydown', (e) => {
    if (!$('#backEd').hidden) {
      if (e.key === 'Escape') closeBack();
    } else if (!$('#editor').hidden) {
      if (e.key === 'Escape') closeEditor();
      if (e.key === 'ArrowLeft' && e.target.type !== 'range') step(-1);
      if (e.key === 'ArrowRight' && e.target.type !== 'range') step(1);
    } else if (!$('#flip').hidden) {
      if (e.key === 'Escape') closeFlip();
      if (e.key === 'ArrowLeft') turn(-1);
      if (e.key === 'ArrowRight') turn(1);
    }
  });
  window.addEventListener('resize', () => {
    if (!$('#editor').hidden) { sizeFrame(); place($('#edImg'), edP); }
    if (!$('#flip').hidden) sizeBook();
    if (!$('#backEd').hidden) sizeBack();
  });

  /* ---------- 4. Slanje ---------- */
  function bookProblem(b) {
    if (!b.coverId) return 'Izaberi korice.';
    return countProblem(b.photos.filter((p) => p.status === 'ready').length);
  }
  function renderSend() {
    state.wanted = state.books.length;
    warmPrint();
    $('#fName').value = state.name;
    $('#fIg').value = state.ig;
    $('#fCity').value = state.city;
    $('#fAddr').value = state.addr;
    $('#fPhone').value = state.phone;
    $$('input[name=ship]').forEach((r) => (r.checked = r.value === state.ship));
    $('#addrFields').hidden = state.ship === 'pickup';
    $('#orders').innerHTML = state.books.map((b, i) => {
      const bad = bookProblem(b), c = cover(b), n = countOf(b);
      const ready = b.photos.filter((p) => p.status === 'ready');
      const strip = ready.slice(0, 6).map((p) => `<span class="ot"><img data-b="${i}" data-p="${p.id}" src="${p.thumb}" alt=""></span>`).join('');
      const rest = ready.length - 6;
      return `<article class="order" style="--c:${(b.bg || (c || CUSTOM).bg)}">
        <div class="order-cover">${coverOf(b)}</div>
        <div class="order-body">
          <div class="order-top">
            <div><b>${esc(b.title || b.dest || 'Knjiga ' + (i + 1))}</b>
              <span class="${bad ? 'bad' : ''}">${bad || `A4, tvrde korice, ${n} ${stranica(n)}${c && c.id === 'custom' ? ', dizajn po dogovoru' : ''}`}</span></div>
            ${bad ? '' : `<strong class="order-price">${money(priceFor(n))}</strong>`}
          </div>
          ${ready.length ? `<div class="order-strip">${strip}${rest > 0 ? `<span class="ot more">+${rest}</span>` : ''}</div>` : ''}
          ${ready.length ? `<button class="order-flip" type="button" data-flip="${i}">Prelistaj knjigu</button>` : ''}
          ${state.books.length > 1 ? `<button class="order-x" type="button" data-del="${i}" aria-label="Ukloni knjigu">×</button>` : ''}
        </div></article>`;
    }).join('');
    $$('#orders .ot img').forEach((img) => {
      const p = state.books[+img.dataset.b].photos.find((x) => x.id === img.dataset.p);
      if (p) place(img, p);
    });
    renderReview();
  }
  function renderReview() {
    const b = state.books.find((x) => x.photos.some((p) => p.status === 'ready')) || state.books[0];
    const ready = b.photos.filter((p) => p.status === 'ready');
    const pages = ready.length > 2 ? [ready[1], ready[2]] : [];
    const covers = state.books.slice(0, 3);
    const mid = (covers.length - 1) / 2;
    $('#review').innerHTML = `<div class="rv-spread">${pages.length ? pages.map((p, i) => `<div class="rv-page ${i ? 'r' : 'l'}"><img data-p="${p.id}" src="${p.url}" alt=""></div>`).join('') : '<div class="rv-page l"></div><div class="rv-page r"></div>'}</div>
      <div class="rv-covers">${covers.map((x, i) => `<div class="rv-cover" style="transform:rotate(${6 + (i - mid) * 7}deg) translateX(${(i - mid) * 22}%);z-index:${i + 1}">${coverOf(x)}</div>`).join('')}</div>`;
    pages.forEach((p) => place($(`#review img[data-p="${p.id}"]`), p));
    $('#btnReview').hidden = !ready.length;
    $('#btnReview').onclick = () => { state.active = state.books.indexOf(b); openFlip(); };
  }
  function renderShelf(sel) {
    const list = state.books.slice(0, 5), mid = (list.length - 1) / 2;
    $(sel).innerHTML = list.map((b, i) => {
      const off = i - mid, rot = list.length === 1 ? -5 : off * 9 - 2;
      return `<div class="sh" style="transform:translate(calc(-50% + ${off * 18}%),calc(-50% + ${Math.abs(off) * 3}%)) rotate(${rot}deg);z-index:${i + 1}">${coverOf(b)}</div>`;
    }).join('');
  }
  $('#orders').addEventListener('click', (e) => {
    const ed = e.target.closest('[data-edit]'), del = e.target.closest('[data-del]'), fl = e.target.closest('[data-flip]');
    if (fl) { state.active = +fl.dataset.flip; openFlip(); return; }
    const bc = e.target.closest('[data-backc]');
    if (bc) { state.active = +bc.dataset.backc; openBack(); return; }
    if (ed) { state.active = +ed.dataset.i; goTo(+ed.dataset.edit, true); }
    if (del) {
      const i = +del.dataset.del, [b] = state.books.splice(i, 1);
      state.active = Math.min(state.active, state.books.length - 1);
      renderSend(); renderFoot();
      toast(`Knjiga je uklonjena.`, () => { state.books.splice(i, 0, b); renderSend(); renderFoot(); });
    }
  });
  function addNewBook() {
    if (state.books.length >= MAX_BOOKS) { toast(`Najviše ${MAX_BOOKS} knjiga u jednoj porudžbini.`); return; }
    state.books.push(newBook());
    state.active = state.books.length - 1;
    const b = book();
    b.autoCover = false;
    goTo(2, true);
    toast(`Knjiga ${state.books.length}: izaberi korice.`);
  }
  $('#addBook').onclick = addNewBook;
  [['#fCity', 'city', 'City'], ['#fAddr', 'addr', 'Addr'], ['#fPhone', 'phone', 'Phone']].forEach(([s, k, err]) => {
    $(s).addEventListener('input', (e) => { state[k] = e.target.value; store.save(); if (err && e.target.classList.contains('invalid')) setErr(err, '', e.target); });
  });
  $$('input[name=ship]').forEach((r) => r.addEventListener('change', () => { state.ship = r.value; renderSend(); }));

  function validateSend() {
    const post = state.ship === 'post';
    const cityOK = !post || state.city.trim().length > 1;
    const addrOK = !post || state.addr.trim().length > 3;
    const phoneOK = state.phone.replace(/\D/g, '').length >= 8;
    const nameOK = state.name.trim().length > 1, igOK = state.ig.trim().length > 0;
    setErr('Name', nameOK ? '' : 'Unesi ime i prezime.', $('#fName'));
    setErr('Ig', igOK ? '' : 'Unesi Instagram profil, tu ti šaljemo predlog korica.', $('#fIg'));
    setErr('City', cityOK ? '' : 'Unesi grad.', $('#fCity'));
    setErr('Addr', addrOK ? '' : 'Unesi ulicu i broj.', $('#fAddr'));
    setErr('Phone', phoneOK ? '' : 'Unesi broj telefona, da te kurir može pozvati.', $('#fPhone'));
    const first = !nameOK ? '#fName' : !igOK ? '#fIg' : !cityOK ? '#fCity' : !addrOK ? '#fAddr' : !phoneOK ? '#fPhone' : null;
    if (first) $(first).focus();
    const badBook = state.books.findIndex(bookProblem);
    if (badBook >= 0) toast(`Knjiga ${badBook + 1}: ${bookProblem(state.books[badBook])}`);
    return !first && badBook < 0;
  }

  /* ---------- Slanje: isti Apps Script i Google Drive kao na traveltails.rs ----------
     Fotografije idu DIREKTNO u Google Drive kao originalni fajlovi (bez ikakve kompresije),
     redom 001, 002…; Apps Script samo otvara porudžbinu, daje adrese za slanje i šalje mejl. */
  const API_URL = 'https://script.google.com/macros/s/AKfycbyeKz0KUI9LSTGANx2ULacVZhpixAWl0i8WJuadPaeKuDgdgS5oWZAO85ql-Zza7g_QMA/exec';
  async function callServer(fn, args, timeoutMs = 30000) {
    const ctl = new AbortController();
    const timer = setTimeout(() => ctl.abort(), timeoutMs);
    try {
      // text/plain da ostane "simple request" (Apps Script ne podržava CORS preflight)
      const res = await fetch(API_URL, { method: 'POST', headers: { 'Content-Type': 'text/plain;charset=utf-8' }, body: JSON.stringify({ action: fn, params: args }), signal: ctl.signal });
      const text = await res.text();
      let json;
      try { json = JSON.parse(text); } catch (e) { throw new Error('Server je privremeno preopterećen. Pokušaj ponovo.'); }
      if (!json || !json.ok) throw new Error((json && json.error) || 'Nepoznata greška servera.');
      return json.result;
    } catch (err) {
      if (err.name === 'AbortError') throw new Error('Server predugo ne odgovara. Pokušaj ponovo.');
      throw err;
    } finally { clearTimeout(timer); }
  }
  async function callRetry(fn, args, timeoutMs, retries = 2, delay = 1500) {
    try { return await callServer(fn, args, timeoutMs); } catch (err) {
      if (retries <= 0) throw err;
      await sleep(delay);
      return callRetry(fn, args, timeoutMs, retries - 1, delay * 1.4);
    }
  }
  function putFile(url, blob, mime, onBytes) {
    return new Promise((ok, bad) => {
      const xhr = new XMLHttpRequest();
      xhr.open('PUT', url, true);
      xhr.setRequestHeader('Content-Type', mime || 'application/octet-stream');
      let stall;
      const arm = () => { clearTimeout(stall); stall = setTimeout(() => { xhr.abort(); bad(new Error('Veza je zastala pri slanju.')); }, 60000); };
      arm();
      xhr.upload.onprogress = (e) => { arm(); onBytes(e.loaded); };
      xhr.onload = () => { clearTimeout(stall); if (xhr.status >= 200 && xhr.status < 300) { onBytes(blob.size); ok(); } else bad(new Error('Slanje nije uspelo (kod ' + xhr.status + ').')); };
      xhr.onerror = () => { clearTimeout(stall); bad(new Error('Mrežna greška pri slanju.')); };
      xhr.send(blob);
    });
  }
  async function putRetry(url, blob, mime, onBytes, retries = 2, delay = 1500) {
    try { return await putFile(url, blob, mime, onBytes); } catch (err) {
      if (retries <= 0) throw err;
      await sleep(delay);
      return putRetry(url, blob, mime, onBytes, retries - 1, delay * 1.4);
    }
  }
  // items: [{ blob, filename, mimeType }] -> u Drive folder, po 5 istovremeno
  async function uploadList(folderId, items, onBytes) {
    const urls = await callRetry('getUploadUrls', [folderId, items.map(({ filename, mimeType }) => ({ filename, mimeType })), location.origin], 60000);
    let next = 0;
    const worker = async () => {
      while (next < items.length) {
        const i = next++;
        await putRetry(urls[i], items[i].blob, items[i].mimeType, (n) => onBytes(i, n));
      }
    };
    await Promise.all(Array.from({ length: Math.min(5, items.length) }, worker));
  }
  const printCache = new Map();
  const printKey = (b, i) => JSON.stringify([i, b.coverId, b.coverAs, b.title, b.sub, b.year, b.bg, b.ink, b.accent, b.spine, b.back, countOf(b), b.pt ? [b.pt.txt, b.pt.ph.map((p) => p && p.url)] : null]);
  function printFiles(b, i) {
    const key = printKey(b, i);
    if (!printCache.has(key)) {
      const name = `Knjiga ${i + 1} - ${(b.title || b.dest || 'knjiga').trim()}`;
      printCache.set(key, (async () => [
        { blob: await png300(await frontPrint(b)), filename: `${name} - PREDNJA KORICA (A4 300dpi).png`, mimeType: 'image/png' },
        { blob: await png300(await backPrint(b)), filename: `${name} - ZADNJA KORICA (A4 300dpi).png`, mimeType: 'image/png' },
        { blob: await png300(await spinePrint(b)), filename: `${name} - RIKNA 30x297mm (300dpi).png`, mimeType: 'image/png' },
        ...ptOriginals(b).map((x) => Object.assign(x, { filename: `${name} - ${x.filename}` })),
      ])().catch((err) => { printCache.delete(key); throw err; }));
    }
    return printCache.get(key);
  }
  let warmT;
  function warmPrint() {
    clearTimeout(warmT);
    // malo sačekamo da kupac završi izmenu, pa pravimo fajlove u pozadini
    warmT = setTimeout(() => state.books.forEach((b, i) => { if (b.photos.some((p) => p.status === 'ready')) printFiles(b, i).catch(() => {}); }), 700);
  }
  function photoItems(b) {
    const list = b.photos.filter((p) => p.status === 'ready');
    const pad = Math.max(3, String(list.length).length);
    return list.map((p, i) => {
      const m = (p.file.name || '').match(/\.([a-z0-9]+)$/i);
      const ext = m ? '.' + m[1].toLowerCase() : p.file.type === 'image/png' ? '.png' : '.jpg';
      return { blob: p.file, filename: String(i + 1).padStart(pad, '0') + ext, mimeType: p.file.type || 'image/jpeg', p };
    });
  }
  function photoNotes(b) {
    return photoItems(b).map(({ filename, p }) => {
      const c = p.crop || {}, notes = [];
      if (p.kind === 'collage') notes.push(`KOLAŽ od ${p.cells.length} fotografija (već spojen u jednu A4 sliku)`);
      if (c.rot) notes.push(`rotirana ${c.rot}°`);
      if (c.frame) notes.push('beli okvir');
      if (Math.abs((c.cx ?? 0.5) - 0.5) > 0.01 || Math.abs((c.cy ?? 0.5) - 0.5) > 0.01) notes.push(`isečak pomeren (centar ${Math.round((c.cx ?? 0.5) * 100)}% / ${Math.round((c.cy ?? 0.5) * 100)}%)`);
      return notes.length ? `    ${filename}: ${notes.join(', ')}` : '';
    }).filter(Boolean);
  }
  /* ---------- Slanje slika u pozadini ----------
     Slike kreću u Drive čim ih kupac ubaci (originali, privremeno ime "_u_<šifra>").
     Na "Pošalji" ide samo ono što još nije stiglo + korice, a Apps Script tada dodeli 001, 002…
     po KONAČNOM redosledu sa sajta, obriše izbačene slike i pošalje mejl. */
  const bg = { orderId: null, orderP: null, queue: [], active: 0, LANES: 3, kickT: 0 };
  const tmpName = (p) => '_u_' + p.id + '.jpg';
  function ensureOrder() {
    if (!bg.orderP) bg.orderP = callRetry('startOrder', [], 30000).then((r) => (bg.orderId = r.orderFolderId)).catch((err) => { bg.orderP = null; throw err; });
    return bg.orderP;
  }
  function ensureAlbum(b) {
    if (!b.up) b.up = { folderP: null, folderId: null, recs: {} };
    if (!b.up.folderP) {
      b.up.folderP = ensureOrder()
        .then((oid) => callRetry('addAlbum', [oid, (b.title || b.dest || 'Knjiga').trim()], 30000))
        .then((r) => (b.up.folderId = r.folderId))
        .catch((err) => { b.up.folderP = null; throw err; });
    }
    return b.up.folderP;
  }
  // nađi slike koje još nisu krenule, uzmi im adrese za slanje (u grupama) i stavi ih u red
  async function feedBook(b) {
    if (!b.up) b.up = { folderP: null, folderId: null, recs: {} };
    const fresh = b.photos.filter((p) => p.status === 'ready' && !b.up.recs[p.id]);
    if (!fresh.length) return;
    fresh.forEach((p) => (b.up.recs[p.id] = { p, name: tmpName(p), state: 'wait', loaded: 0, size: 2000000 }));
    try {
      const folderId = await ensureAlbum(b);
      const recs = fresh.map((p) => b.up.recs[p.id]);
      const urls = await callRetry('getUploadUrls', [folderId, recs.map((r) => ({ filename: r.name, mimeType: 'image/jpeg' })), location.origin], 60000);
      recs.forEach((r, i) => { r.url = urls[i]; r.state = 'queued'; bg.queue.push({ b, r }); });
      pumpBg();
    } catch (err) {
      fresh.forEach((p) => delete b.up.recs[p.id]); // pokušaće ponovo kasnije
    }
  }
  function pumpBg() {
    while (bg.active < bg.LANES && bg.queue.length) {
      const { b, r } = bg.queue.shift();
      if (!b.photos.includes(r.p) || r.state !== 'queued') continue; // kupac je izbacio sliku pre slanja
      bg.active++;
      r.state = 'up';
      renderA4(r.p)
        .then((blob) => { r.size = blob.size; return putRetry(r.url, blob, 'image/jpeg', (n) => { r.loaded = n; if (bg.onProgress) bg.onProgress(); }); })
        .then(() => { r.state = 'done'; r.loaded = r.size; })
        .catch(() => { delete b.up.recs[r.p.id]; }) // nova adresa i novi pokušaj
        .finally(() => { bg.active--; if (bg.onProgress) bg.onProgress(); pumpBg(); });
    }
  }
  function kickBg() {
    clearTimeout(bg.kickT);
    bg.kickT = setTimeout(() => { if (state.sending && !state.sent) state.books.forEach((b) => feedBook(b)); }, 400);
  }
  const bookBytes = (b) => {
    const ready = b.photos.filter((p) => p.status === 'ready');
    const total = ready.length || 1;
    const done = ready.reduce((s, p) => { const r = b.up && b.up.recs[p.id]; return s + (r ? (r.state === 'done' ? 1 : Math.min(0.95, (r.loaded || 0) / (r.size || 1))) : 0); }, 0);
    return { total, done, all: ready.every((p) => b.up && b.up.recs[p.id] && b.up.recs[p.id].state === 'done') };
  };

  /* ---------- A4 stranice spremne za štampu ----------
     Svaka fotografija se iscrta na A4 (2480×3508, 300 dpi) tačno kako je kupac podesio
     (popunjavanje, pomeranje, rotacija, beli okvir) i šalje se kao A4-001.jpg ... u folder knjige. */
  const A4W = 2480, A4H = 3508;
  async function renderA4(p) {
    const blob = await (await fetch(p.url)).blob();
    const bmp = await decodeImage(blob);
    const c = p.crop, g = geom(p), cv = makeCanvas(A4W, A4H), x = cv.getContext('2d');
    x.fillStyle = '#fff';
    x.fillRect(0, 0, A4W, A4H);
    x.imageSmoothingEnabled = true;
    x.imageSmoothingQuality = 'high';
    x.save();
    x.translate(A4W / 2 + (0.5 - c.cx) * g.iw * A4W, A4H / 2 + (0.5 - c.cy) * g.ih * A4W);
    x.rotate((c.rot * Math.PI) / 180);
    const dw = bmp.width * g.s * A4W, dh = bmp.height * g.s * A4W;
    x.drawImage(bmp.src, -dw / 2, -dh / 2, dw, dh);
    x.restore();
    if (c.frame) {
      const f = Math.round(FRAME * A4W);
      x.fillStyle = '#fff';
      x.fillRect(0, 0, A4W, f); x.fillRect(0, A4H - f, A4W, f);
      x.fillRect(0, 0, f, A4H); x.fillRect(A4W - f, 0, f, A4H);
    }
    if (bmp.close) bmp.close();
    return canvasBlob(cv, 0.93);
  }
  async function send() {
    if (!validateSend()) return;
    // stara verzija sajta u telefonu/kešu šalje originale umesto A4 stranica: ne dozvoli slanje
    try {
      const v = (await (await fetch('version.txt?t=' + Date.now(), { cache: 'no-store' })).text()).trim();
      if (v && v !== APP_VER) {
        $('#sending').hidden = false; $('#sendErr').hidden = false;
        $('#sendErrText').textContent = 'Sajt je u međuvremenu osvežen. Zatvori ovu stranicu, otvori traveltails.rs ponovo (ili osveži stranicu) i ubaci fotografije ispočetka, da bi stigle ispravno.';
        return;
      }
    } catch (e) { /* bez interneta: nastavi, slanje će samo javiti grešku */ }
    state.sending = true;
    const ig = '@' + state.ig.trim().replace(/^@/, '');
    const books = state.books;
    const rows = books.map((b, i) => `<div class="s-row"><div><span>${esc(b.title || b.dest || 'Knjiga ' + (i + 1))}</span><span id="sp${i}">0%</span></div><div class="bar"><i id="sb${i}"></i></div></div>`).join('')
      + `<div class="s-row"><div><span>Korice za štampu i detalji</span><span id="spC">čeka</span></div><div class="bar"><i id="sbC"></i></div></div>`;
    $('#sendRows').innerHTML = rows;
    $('#sendErr').hidden = true;
    $('#sending').hidden = false;
    const show = () => books.forEach((b, i) => {
      const { total, done } = bookBytes(b);
      const pct = Math.min(100, Math.round((done / total) * 100));
      $('#sb' + i).style.width = pct + '%';
      $('#sp' + i).textContent = pct + '%';
    });
    bg.onProgress = show;
    bg.LANES = 4; // iscrtavanje A4 stranice je teško, pa najviše 4 odjednom
    try {
      const coversReady = Promise.all(books.map((b, i) => printFiles(b, i)));
      const oid = await ensureOrder();
      await Promise.all(books.map((b) => ensureAlbum(b)));
      show();
      // korice i detalji idu paralelno sa slikama koje još nisu stigle
      const extras = (async () => {
        $('#spC').textContent = 'pripremam…';
        const files = (await coversReady).flat();
        let details = orderText();
        details += '\nFAJLOVI FOTOGRAFIJA: 001.jpg... su A4 stranice (2480x3508, 300 dpi) spremne za stampu, tacno kako je kupac podesio (popunjavanje, pomeranje, rotacija, beli okvir).\n';
        books.forEach((b, i) => { const notes = photoNotes(b); if (notes.length) details += `\nIZMENE FOTOGRAFIJA – KNJIGA ${i + 1}:\n${notes.join('\n')}\n`; });
        files.unshift({ blob: new Blob([details], { type: 'text/plain;charset=utf-8' }), filename: 'Detalji porudzbine.txt', mimeType: 'text/plain' });
        const urls = await callRetry('getUploadUrls', [oid, files.map(({ filename, mimeType }) => ({ filename, mimeType })), location.origin], 60000);
        const total = files.reduce((s, f) => s + f.blob.size, 0) || 1, loaded = new Array(files.length).fill(0);
        await Promise.all(files.map((f, k) => putRetry(urls[k], f.blob, f.mimeType, (n) => {
          loaded[k] = n;
          const pct = Math.min(100, Math.round((loaded.reduce((s, v) => s + v, 0) / total) * 100));
          $('#sbC').style.width = pct + '%';
          $('#spC').textContent = pct + '%';
        })));
      })();
      // sačekaj da sve slike stignu (one koje su pale šalju se ponovo)
      const photos = (async () => {
        for (let round = 0; ; round++) {
          await Promise.all(books.map((b) => feedBook(b)));
          if (books.every((b) => bookBytes(b).all)) return;
          if (round > 2400) throw new Error('Slanje fotografija predugo traje. Proveri internet i pokušaj ponovo.');
          await sleep(500);
        }
      })();
      await Promise.all([photos, extras]);
      show();
      const pickup = state.ship === 'pickup';
      const albums = books.map((b) => ({ folderId: b.up.folderId, destination: (b.title || b.dest || 'Knjiga').trim(), files: photoItems(b).map((it) => b.up.recs[it.p.id].name) }));
      try {
        await callRetry('finalizeOrder', [oid, state.name.trim(), ig, albums,
          pickup ? 'Lično preuzimanje (Novi Sad)' : state.city.trim(), pickup ? 'Lično preuzimanje' : state.addr.trim(), state.phone.trim()], 90000, 1);
      } catch (err) {
        // ako neka slika fali u Drive-u, pošalji je ponovo pri sledećem pokušaju
        const m = String(err.message).match(/MISSING:(.+)/);
        if (m) {
          const miss = new Set(m[1].split(','));
          books.forEach((b) => Object.values(b.up.recs).forEach((r) => { if (miss.has(r.name)) delete b.up.recs[r.p.id]; }));
          throw new Error('Neke fotografije nisu stigle do kraja. Klikni „Pošalji ponovo“, poslaćemo samo njih.');
        }
        throw err;
      }
    } catch (err) {
      state.sending = false;
      bg.onProgress = null;
      $('#sendErr').hidden = false;
      $('#sendErrText').textContent = 'Slanje nije završeno: ' + err.message;
      return;
    }
    bg.onProgress = null;
    await sleep(250);
    $('#sending').hidden = true;
    state.sending = false;
    state.sent = true;
    track('Purchase', { value: state.books.reduce((s, x) => s + priceFor(x.plan), 0), currency: 'RSD' });
    const first = state.name.trim().split(/\s+/)[0];
    $('#doneTitle').textContent = `Hvala, ${first}!`;
    $('#doneShip').textContent = state.ship === 'pickup' ? 'Lično preuzimanje, Novi Sad' : 'Brza pošta, sutradan';
    renderShelf('#doneShelf');
    goTo(5, true);
  }
  $('#sendRetry').onclick = () => { $('#sending').hidden = true; send(); };
  $('#sendClose').onclick = () => { $('#sending').hidden = true; };

  /* ---------- Fajlovi za štampu: A4 na 300 dpi ---------- */
  const PX_MM = 300 / 25.4;
  // PRIVREMENO: debljina rikne dok ne stignu tačne mere od štamparije
  const spineMM = () => 30; // rikna u fajlu je uvek 30 x 297 mm; vlasnik je sam namesti na pravu debljinu
  const toBlob = (cv, type = 'image/png', q) => new Promise((ok) => cv.toBlob(ok, type, q));
  // PNG dobija oznaku 300 dpi (pHYs), da ga Illustrator i štamparija otvore u pravoj veličini
  const CRC = (() => { const t = []; for (let n = 0; n < 256; n++) { let c = n; for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1; t[n] = c >>> 0; } return t; })();
  const crc32 = (b) => { let c = 0xffffffff; for (let i = 0; i < b.length; i++) c = CRC[(c ^ b[i]) & 255] ^ (c >>> 8); return (c ^ 0xffffffff) >>> 0; };
  async function png300(cv) {
    const src = new Uint8Array(await (await toBlob(cv)).arrayBuffer());
    const ppm = Math.round(300 / 0.0254);
    const chunk = new Uint8Array(21), dv = new DataView(chunk.buffer);
    dv.setUint32(0, 9); chunk.set([112, 72, 89, 115], 4); dv.setUint32(8, ppm); dv.setUint32(12, ppm); chunk[16] = 1;
    dv.setUint32(17, crc32(chunk.subarray(4, 17)));
    const at = 8 + 25; // posle IHDR
    const out = new Uint8Array(src.length + 21);
    out.set(src.subarray(0, at)); out.set(chunk, at); out.set(src.subarray(at), at + 21);
    return new Blob([out], { type: 'image/png' });
  }
  let fontCss = null;
  async function embedFonts() {
    if (fontCss) return fontCss;
    let css = await (await fetch('https://fonts.googleapis.com/css2?family=Raleway:wght@700;800;900&display=swap')).text();
    const urls = [...new Set(css.match(/https:[^)]+/g) || [])];
    for (const u of urls) {
      const buf = new Uint8Array(await (await fetch(u)).arrayBuffer());
      let bin = '';
      for (let i = 0; i < buf.length; i += 0x8000) bin += String.fromCharCode.apply(null, buf.subarray(i, i + 0x8000));
      css = css.split(u).join('data:font/woff2;base64,' + btoa(bin));
    }
    return (fontCss = css);
  }
  // SVG (stari dizajni, zadnja korica) -> canvas, sa ugrađenim fontom
  async function svgCanvas(svg, W, H) {
    const css = await embedFonts();
    const s = svg.replace(/<svg([^>]*)>/, `<svg$1 width="${W}" height="${H}"><defs><style>${css}</style></defs>`);
    const url = URL.createObjectURL(new Blob([s], { type: 'image/svg+xml' }));
    const img = await TTF.loadImg(url);
    await new Promise((r) => setTimeout(r, 60));
    const cv = document.createElement('canvas');
    cv.width = W; cv.height = H;
    cv.getContext('2d').drawImage(img, 0, 0, W, H);
    URL.revokeObjectURL(url);
    return cv;
  }
  async function photoData(p, w, h) {
    const bmp = await decodeImage(isHeic(p.file) ? await heicToJpeg(p.file) : p.file);
    const cv = document.createElement('canvas');
    cv.width = Math.round(w); cv.height = Math.round(h);
    const r = Math.max(cv.width / bmp.width, cv.height / bmp.height), sw = cv.width / r, sh = cv.height / r;
    cv.getContext('2d').drawImage(bmp.src, (bmp.width - sw) / 2, (bmp.height - sh) / 2, sw, sh, 0, 0, cv.width, cv.height);
    return cv.toDataURL('image/jpeg', 0.95);
  }
  // originalne fotografije kupca sa prednje korice (za svaki slučaj, uz gotov fajl korice)
  function ptOriginals(b) {
    const c = cover(b);
    if (!c || !c.photo || !b.pt) return [];
    return b.pt.ph.map((p, i) => {
      if (!p) return null;
      const m = (p.file.name || '').match(/\.([a-z0-9]+)$/i);
      return { blob: p.file, filename: `KORICA fotografija ${i + 1}${m ? '.' + m[1].toLowerCase() : '.jpg'}`, mimeType: p.file.type || 'image/jpeg' };
    }).filter(Boolean);
  }
  async function frontPrint(b) {
    const c = cover(b) || CUSTOM;
    if (c.photo) return TTP.print(c, b.pt || { txt: {}, ph: [] }, async (p) => decodeImage(await (await fetch(p.url)).blob()));
    const o = { title: b.title || (b.coverId ? undefined : b.dest), sub: b.sub, year: b.year, bg: b.bg, ink: b.ink, accent: b.accent };
    return c.fig ? TTF.printCanvas(c, o) : svgCanvas(coverSVG(c, o), TTF.PW, TTF.PH);
  }
  async function backPrint(b) {
    const c = cover(b) || CUSTOM, k = TTF.PW / 420;
    const slots = await Promise.all(BACK_SLOTS[b.back.layout].map(async ([x, y, w, h], i) => {
      const p = backPhoto(b, i);
      return { x, y, w, h, href: p ? await photoData(p, w * k, h * k) : '' };
    }));
    const blank = b.back.layout === 'none';
    const svg = backSVG(c, { bg: b.bg || c.bg, ink: b.ink || c.ink, accent: b.accent || c.accent, title: blank ? '' : backTitle(b), sub: blank ? '' : backSub(b), slots });
    return svgCanvas(svg, TTF.PW, TTF.PH);
  }
  async function spinePrint(b) {
    const c = cover(b) || CUSTOM, n = countOf(b);
    const W = Math.round(spineMM(n) * PX_MM), H = TTF.PH, k = H / 594;
    await document.fonts.load('800 100px Raleway');
    const cv = document.createElement('canvas');
    cv.width = W; cv.height = H;
    const g = cv.getContext('2d');
    g.fillStyle = b.bg || c.bg;
    g.fillRect(0, 0, W, H);
    const raw = spineText(b), text = c.font === 'soft' ? raw : raw.toLocaleUpperCase('sr');
    const year = '';
    g.save();
    g.translate(W / 2, H);
    g.rotate(-Math.PI / 2);
    g.fillStyle = b.ink || c.ink;
    g.textBaseline = 'middle';
    let size = Math.min(W * 0.5, 24 * k);
    g.font = `800 ${size}px Raleway`;
    const room = (year ? 440 : 520) * k, w = g.measureText(text).width;
    if (w > room) { size *= room / w; g.font = `800 ${size}px Raleway`; }
    g.textAlign = 'center';
    g.fillText(text, (year ? 332 : 297) * k, 0);
    if (year) {
      g.font = `800 ${Math.min(W * 0.32, 13 * k)}px Raleway`;
      g.textAlign = 'left';
      g.globalAlpha = 0.85;
      g.fillText(year, 28 * k, 0);
    }
    g.restore();
    return cv;
  }
  const slug = (s) => String(s || 'knjiga').normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/đ/gi, 'dj').replace(/[^a-z0-9]+/gi, '-').replace(/^-|-$/g, '').toLowerCase() || 'knjiga';
  function orderText() {
    const lines = [
      'TRAVEL TAILS – PORUDŽBINA',
      `Datum: ${new Date().toLocaleString('sr-RS')}`,
      `Ime: ${state.name}`, `Instagram: @${state.ig.replace(/^@/, '')}`, `Telefon: ${state.phone}`,
      state.ship === 'pickup' ? 'Preuzimanje: lično, Novi Sad' : `Dostava: brza pošta, ${state.city}, ${state.addr}`,
      '',
    ];
    state.books.forEach((b, i) => {
      const c = cover(b) || CUSTOM, n = countOf(b);
      lines.push(`KNJIGA ${i + 1}: ${b.title || b.dest}`,
        `  Format: A4, tvrde korice, ${n} ${stranica(n)}, ${money(priceFor(n))}`,
        `  Dizajn: ${c.id === 'custom' ? 'osnovni dizajn, dogovor na Instagramu' : c.name}${c.fig ? ` (Figma okvir ${c.id.replace('f', '1112:')})` : ''}`,
        `  Naslov: ${b.title || ''}`, `  Podnaslov: ${b.sub || ''}`, `  Godina: ${b.year || ''}`, `  Rikna: ${spineText(b)}`,
        `  Boje: korice ${b.bg || c.bg}, naslov ${b.ink || c.ink || 'original'}, podnaslov ${b.accent || c.accent || 'original'}`,
        `  Zadnja korica: ${{ none: 'prazna', text: 'samo tekst', one: '1 fotografija', four: '4 fotografije' }[b.back.layout]}`,
        `  Rikna u fajlu: 30 x 297 mm (300 dpi)`);
      if (c.photo && b.pt) {
        lines.push(`  Korice sa fotografijom kupca: ${c.t.map((t) => `${t.label}: "${ptVal(c, b, t)}"`).join(', ')}`,
          `  Fotografije na koricama: ${b.pt.ph.filter(Boolean).length} (uključene u fajl prednje korice, originali kao "KORICA fotografija N")`);
      }
      if (b.note) lines.push(`  Napomena: ${b.note}`);
      lines.push('');
    });
    return lines.join('\n');
  }
  async function buildPrintZip() {
    const zip = new JSZip();
    zip.file('porudzbina.txt', orderText());
    for (let i = 0; i < state.books.length; i++) {
      const b = state.books[i];
      const dir = zip.folder(`knjiga-${i + 1}-${slug(b.title || b.dest)}`);
      dir.file('prednja-korica-A4-300dpi.png', await png300(await frontPrint(b)), { compression: 'STORE' });
      dir.file('zadnja-korica-A4-300dpi.png', await png300(await backPrint(b)), { compression: 'STORE' });
      dir.file(`rikna-30x297mm-300dpi.png`, await png300(await spinePrint(b)), { compression: 'STORE' });
      ptOriginals(b).forEach((x) => dir.file(x.filename, x.blob, { compression: 'STORE' }));
      const ph = dir.folder('fotografije');
      b.photos.filter((p) => p.status === 'ready').forEach((p, k) => {
        const ext = (p.name.match(/\.[a-z0-9]+$/i) || ['.jpg'])[0].toLowerCase();
        ph.file(`${String(k + 1).padStart(3, '0')}${ext}`, p.file, { compression: 'STORE', date: new Date(p.lm || Date.now()) });
      });
    }
    return zip.generateAsync({ type: 'blob' });
  }
  $('#btnPrint').onclick = async () => {
    const btn = $('#btnPrint');
    btn.disabled = true;
    const label = btn.textContent;
    btn.textContent = 'Pravim fajlove…';
    try {
      const blob = await buildPrintZip();
      const a = document.createElement('a');
      a.href = URL.createObjectURL(blob);
      a.download = `travel-tails-${slug(state.name)}-${new Date().toISOString().slice(0, 10)}.zip`;
      a.click();
      setTimeout(() => URL.revokeObjectURL(a.href), 60000);
    } catch (err) {
      console.error(err);
      toast('Fajlovi nisu napravljeni. Pokušaj ponovo.');
    }
    btn.textContent = label;
    btn.disabled = false;
  };

  /* ---------- globalno ---------- */
  $('#btnNext').onclick = () => {
    if (state.step === 4) { send(); return; }
    if (!validate(state.step)) return;
    if (state.step === 3 && moreBooks()) { askNextBook(); return; }
    goTo(state.step + 1);
  };
  $('#nbGo').onclick = startNextBook;
  $('#nbSkip').onclick = () => { $('#nextBook').hidden = true; state.wanted = state.books.length; goTo(4); };
  $('#booksMinus').onclick = () => setBookCount(totalBooks() - 1);
  $('#booksPlus').onclick = () => setBookCount(totalBooks() + 1);
  $('#btnBack').onclick = () => {
    const st = state.step, a = state.active;
    if (st === 2 && a > 0) { state.active = a - 1; goTo(3, true); return; }
    if (st === 4) { state.active = state.books.length - 1; goTo(3, true); return; }
    goTo(st - 1, true);
  };
  $('#stepper').addEventListener('click', (e) => {
    const b = e.target.closest('[data-go]');
    if (!b) return;
    const n = +b.dataset.go;
    if (n === state.step || n > state.reached) return;
    goTo(n);
  });
  $('#bookTabs').addEventListener('click', (e) => {
    if (e.target.closest('[data-newbook]')) { addNewBook(); return; }
    const b = e.target.closest('[data-book]');
    if (!b) return;
    state.active = +b.dataset.book;
    goTo(state.step, true);
  });
  $('#logo').addEventListener('click', (e) => { e.preventDefault(); goTo(1, true); });
  $('#btnRestart').onclick = () => {
    state.books = [newBook()]; state.wanted = 1; state.active = 0; state.reached = 1; state.sent = false;
    bg.orderId = null; bg.orderP = null; bg.queue = []; bg.LANES = 6;
    goTo(1, true);
  };
  window.addEventListener('beforeunload', (e) => {
    if (state.sent) return;
    if (state.sending || state.books.some((b) => b.photos.length)) { e.preventDefault(); e.returnValue = ''; }
  });

  // naslovi se mere tek kad fontovi stignu
  function fontsReady() {
    if (state.step === 2) { renderGrid(); renderMock(); }
    if (state.step === 3) $('#sideCover').innerHTML = coverOf(book());
    if (state.step === 4) renderSend();
  }
  if (document.fonts && document.fonts.load) {
    Promise.all(['900 100px Raleway', '800 100px Raleway', "800 40px 'Bricolage Grotesque'"].map((f) => document.fonts.load(f, 'AŠĐ'))).then(fontsReady, fontsReady);
  }

  store.load();
  goTo(1, true);
})();
