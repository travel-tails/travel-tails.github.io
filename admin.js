/* Admin korica: samo vlasnik bira šta je objavljeno, šta je najpopularnije, podešava naslov/ilustraciju i dodaje nove dizajne.
   Prototip čuva sve u ovom pretraživaču; "Objavi na sajt" odmah menja sajt na ovom računaru, a fajl covers-config.js je za server. */
(function () {
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const esc = (s) => String(s == null ? '' : s).replace(/[&<>"]/g, (m) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[m]));
  const norm = (s) => String(s || '').toLocaleLowerCase('sr').normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/đ/g, 'dj').trim();
  const clone = (o) => JSON.parse(JSON.stringify(o));
  const YEAR = String(new Date().getFullYear());
  const { catalog } = TT;
  const { KEYS } = catalog;
  const CONTS = [['evropa', 'Evropa'], ['azija', 'Azija'], ['afrika', 'Afrika'], ['amerika', 'Amerika'], ['australija', 'Australija']];
  const CATS = [['rodj', 'Rođendani'], ['krst', 'Krštenja'], ['deca', 'Bebe i deca'], ['venc', 'Venčanja'], ['ljub', 'Ljubav'], ['drug', 'Drugarice'], ['porod', 'Porodica'], ['usp', 'Uspomene']];

  let toastT;
  function toast(msg, withUndo) {
    const t = $('#toast');
    t.innerHTML = esc(msg) + (withUndo ? ' <button type="button" data-undo>Poništi</button>' : '');
    t.hidden = false;
    clearTimeout(toastT);
    toastT = setTimeout(() => (t.hidden = true), withUndo ? 6000 : 3200);
  }
  $('#toast').addEventListener('click', (e) => { if (e.target.closest('[data-undo]')) { undo(); $('#toast').hidden = true; } });
  const contOf = (c) => (!c.cont || c.cont === 'balkan' ? 'evropa' : c.cont);
  const countryOf = (c) => c.country || c.name;

  /* ---------- prijava: mejl + lozinka (u kodu je samo otisak, ne sama lozinka) ---------- */
  const LOGIN_HASH = '27df549351547adeb44f925de0b424ab1b8929ee9d30163b97d92ba18318be3f';
  const sha = async (s) => [...new Uint8Array(await crypto.subtle.digest('SHA-256', new TextEncoder().encode(s)))].map((b) => b.toString(16).padStart(2, '0')).join('');
  function gate() {
    if (sessionStorage.getItem('tt-admin-ok') === LOGIN_HASH) { $('#gate').hidden = true; return start(); }
    $('#gateMail').focus();
    $('#gateForm').onsubmit = async (e) => {
      e.preventDefault();
      const mail = $('#gateMail').value.trim().toLowerCase();
      const h = await sha('tt:' + mail + ':' + $('#gatePass').value);
      if (h !== LOGIN_HASH) { $('#gateErr').textContent = 'Pogrešan mejl ili lozinka.'; return; }
      sessionStorage.setItem('tt-admin-ok', LOGIN_HASH);
      $('#gate').hidden = true;
      start();
    };
  }

  /* ---------- stanje ---------- */
  const empty = () => ({ ver: catalog.VER, covers: {}, feat: catalog.DEF_FEAT.slice(), added: [] });
  // podešavanja za stari skup korica se brišu (novi skup ima drugu verziju)
  Object.values(KEYS).forEach((k) => { try { if (localStorage.getItem(k) && !catalog.read(k)) localStorage.removeItem(k); } catch (e) { /* ignore */ } });
  let pub = catalog.read(KEYS.pub) || clone(catalog.valid(window.TT_CATALOG) || empty());
  let draft = catalog.read(KEYS.draft) || clone(pub);
  draft.ver = pub.ver = catalog.VER;
  if (!draft.feat) draft.feat = catalog.DEF_FEAT.slice();
  if (!draft.added) draft.added = [];
  if (!draft.covers) draft.covers = {};
  let ALL = TT.ALL;
  const ui = { view: 'all', st: 'any', group: '', q: '', cur: null, picked: new Set(), list: [] };
  /* Poništi / Ponovi (Cmd+Z / Cmd+Shift+Z) */
  const hist = [], fut = [];
  let lastSnap = { tag: '', t: 0 };
  function snap(tag) {
    const now = Date.now();
    if (tag && tag === lastSnap.tag && now - lastSnap.t < 900) { lastSnap.t = now; return; }
    lastSnap = { tag: tag || '', t: now };
    hist.push(JSON.stringify(draft));
    if (hist.length > 100) hist.shift();
    fut.length = 0;
    renderUndo();
  }
  function restore(json) { draft = JSON.parse(json); reapply(); save(); renderAll(); }
  function undo() { if (!hist.length) return; fut.push(JSON.stringify(draft)); restore(hist.pop()); lastSnap = { tag: '', t: 0 }; renderUndo(); toast('Poništeno'); }
  function redo() { if (!fut.length) return; hist.push(JSON.stringify(draft)); restore(fut.pop()); renderUndo(); toast('Vraćeno'); }
  function renderUndo() { $('#undoBtn').disabled = !hist.length; $('#redoBtn').disabled = !fut.length; }

  function reapply() {
    const r = catalog.apply(draft);
    ALL = r.all;
  }
  let saveT;
  function save() {
    clearTimeout(saveT);
    saveT = setTimeout(() => {
      try { localStorage.setItem(KEYS.draft, JSON.stringify(draft)); } catch (e) { toast('Nema više mesta u pretraživaču. Preuzmi rezervnu kopiju.'); }
      renderStats();
    }, 150);
  }
  const byId = (id) => ALL.find((c) => c.id === id);
  function setOv(id, patch, tag) {
    snap(tag || id + Object.keys(patch).join());
    const o = Object.assign(draft.covers[id] || {}, patch);
    Object.keys(o).forEach((k) => o[k] === undefined && delete o[k]);
    draft.covers[id] = o;
    reapply();
    save();
  }
  const isFeat = (id) => draft.feat.includes(id);
  function setFeat(id, on) {
    snap();
    const i = draft.feat.indexOf(id);
    if (on && i < 0) draft.feat.push(id);
    if (!on && i >= 0) draft.feat.splice(i, 1);
    reapply();
    save();
  }
  // grupe: c:kontinent, k:država (sa svim mestima u njoj), p:mesto, t:tema
  const inGroup = (c, g) => {
    if (!g) return true;
    const v = g.slice(2);
    if (g[0] === 't') return !!c.other && (c.cat || [])[0] === v;
    if (c.other) return false;
    return g[0] === 'c' ? contOf(c) === v : g[0] === 'k' ? countryOf(c) === v : c.name === v;
  };
  const visible = (c) => (ui.st === 'del' ? c.st === 'del' : c.st !== 'del');
  function changes() {
    let n = 0;
    const ids = new Set([...Object.keys(draft.covers), ...Object.keys(pub.covers || {})]);
    ids.forEach((id) => { if (JSON.stringify(draft.covers[id] || {}) !== JSON.stringify((pub.covers || {})[id] || {})) n++; });
    if (JSON.stringify(draft.feat) !== JSON.stringify(pub.feat || catalog.DEF_FEAT)) n++;
    if (JSON.stringify(draft.added) !== JSON.stringify(pub.added || [])) n += Math.max(1, Math.abs(draft.added.length - (pub.added || []).length));
    return n;
  }
  function renderStats() {
    const live = ALL.filter((c) => c.st === 'live').length, drafts = ALL.filter((c) => c.st === 'draft').length, del = ALL.length - live - drafts;
    const n = changes();
    $('#stats').innerHTML = `<span><b>${live}</b> objavljeno</span><span><b>${drafts}</b> u skici</span><span><b>${TT.catalog.apply(draft).feat.length}</b> najpopularnije</span>${n ? `<span class="dirty">${n} neobjavljenih izmena</span>` : '<span>sve je objavljeno</span>'}`;
    $('#delCount').textContent = del ? del : '';
    $('#publishBtn').disabled = !n;
  }

  /* ---------- leva strana: grupe ---------- */
  function renderGroups() {
    const vis = ALL.filter(visible);
    const cnt = (list) => ({ all: list.length, live: list.filter((c) => c.st === 'live').length });
    const btn = (k, label, list, cls = '') => `<button type="button" data-g="${esc(k)}" class="${cls} ${ui.group === k ? 'on' : ''}"><span>${esc(label)}</span><small>${ui.st === 'del' ? list.length : cnt(list).live + '/' + list.length}</small></button>`;
    let html = btn('', 'Sve grupe', vis);
    const open = ui.group ? (ui.group[0] === 'k' ? ui.group.slice(2) : ui.group[0] === 'p' ? (vis.find((c) => !c.other && c.name === ui.group.slice(2)) || {}).country || ui.group.slice(2) : '') : '';
    CONTS.forEach(([k, t]) => {
      const inC = vis.filter((c) => !c.other && contOf(c) === k);
      if (!inC.length) return;
      html += `<h4><button type="button" data-g="c:${k}" class="${ui.group === 'c:' + k ? 'on' : ''}">${t}<small>${inC.length}</small></button></h4>`;
      const countries = new Map();
      inC.forEach((c) => { const n = countryOf(c); if (!countries.has(n)) countries.set(n, []); countries.get(n).push(c); });
      [...countries].sort((a, b) => b[1].length - a[1].length || a[0].localeCompare(b[0], 'sr')).forEach(([name, list]) => {
        const places = new Map();
        list.forEach((c) => { if (c.name !== name) { if (!places.has(c.name)) places.set(c.name, []); places.get(c.name).push(c); } });
        html += btn('k:' + name, name + (places.size ? ' ›' : ''), list, 'country');
        if (places.size && open === name) html += [...places].sort((a, b) => b[1].length - a[1].length).map(([p, l]) => btn('p:' + p, p, l, 'place')).join('');
      });
    });
    const themes = CATS.filter(([k]) => vis.some((c) => c.other && (c.cat || [])[0] === k));
    if (themes.length) html += '<h4><span>Teme</span></h4>' + themes.map(([k, t]) => btn('t:' + k, t, vis.filter((c) => c.other && (c.cat || [])[0] === k))).join('');
    $('#groups').innerHTML = html;
  }
  $('#groups').addEventListener('click', (e) => {
    const b = e.target.closest('[data-g]');
    if (!b) return;
    ui.group = b.dataset.g;
    ui.view = 'all';
    $$('#viewSeg button').forEach((x) => x.classList.toggle('on', x.dataset.view === 'all'));
    renderGroups();
    renderGrid();
  });

  /* ---------- mreža ---------- */
  const thumb = (c) => (c.fig ? TTF.figmaCard(c) : TT.coverSVG(c, { year: c.other ? '' : YEAR }));
  const label = (c) => c.name + (!c.other && c.country ? ', ' + c.country : '');
  const ICO = {
    star: '<svg viewBox="0 0 24 24"><path d="m12 3 2.700 5.600 6.100.900-4.400 4.300 1 6.100L12 17l-5.400 2.900 1-6.100L3.200 9.500l6.100-.900z"/></svg>',
    eye: '<svg viewBox="0 0 24 24"><path d="M2 12s3.600-7 10-7 10 7 10 7-3.600 7-10 7S2 12 2 12Z"/><circle cx="12" cy="12" r="3"/></svg>',
    eyeOff: '<svg viewBox="0 0 24 24"><path d="M3 3l18 18M10.600 5.100A10 10 0 0 1 12 5c6.400 0 10 7 10 7a17 17 0 0 1-3.200 4M6.600 6.600A17 17 0 0 0 2 12s3.600 7 10 7a9.700 9.700 0 0 0 5.400-1.600"/></svg>',
    trash: '<svg viewBox="0 0 24 24"><path d="M4 7h16M10 11v6M14 11v6M6 7l1 13h10l1-13M9 7V4h6v3"/></svg>',
    back: '<svg viewBox="0 0 24 24"><path d="M9 14 4 9l5-5"/><path d="M4 9h10a6 6 0 0 1 0 12h-3"/></svg>',
  };
  function cardHTML(c) {
    const del = c.st === 'del';
    const qa = del
      ? `<button type="button" data-qa="restore" title="Vrati iz obrisanih">${ICO.back}</button>`
      : `<button type="button" data-qa="feat" class="${c.featIdx >= 0 ? 'on' : ''}" title="${c.featIdx >= 0 ? 'Izbaci iz najpopularnijih' : 'Dodaj u najpopularnije'}">${ICO.star}</button><button type="button" data-qa="st" title="${c.st === 'draft' ? 'Objavi na sajt' : 'Skloni sa sajta (skica)'}">${c.st === 'draft' ? ICO.eyeOff : ICO.eye}</button><button type="button" data-qa="del" class="danger" title="Obriši koricu">${ICO.trash}</button>`;
    return `<div class="card ${c.st === 'draft' ? 'draft' : ''} ${del ? 'deleted' : ''} ${ui.cur === c.id ? 'on' : ''} ${ui.picked.has(c.id) ? 'picked' : ''}" data-id="${c.id}">
      <span class="pick" data-pick title="Izaberi"></span>
      <span class="thumb">${thumb(c)}</span>
      <div class="qa">${qa}</div>
      ${c.isNew ? '<span class="badge">Novo</span>' : ''}
      <div class="card-foot"><i class="dot"></i><b title="${esc(label(c))}">${esc(label(c))}</b>${c.featIdx >= 0 ? '<span class="star" title="Najpopularnije">★</span>' : ''}</div>
    </div>`;
  }
  function setStatus(ids, st) {
    snap();
    ids.forEach((id) => { draft.covers[id] = Object.assign(draft.covers[id] || {}, { st }); if (st === 'del') draft.feat = draft.feat.filter((x) => x !== id); });
    reapply(); save();
  }
  function currentList() {
    if (ui.view === 'pop') return draft.feat.map(byId).filter((c) => c && c.st === 'live');
    const words = norm(ui.q).split(/\s+/).filter(Boolean);
    return ALL.filter((c) => visible(c) && inGroup(c, ui.group)
      && (ui.st === 'any' || ui.st === 'del' || c.st === ui.st)
      && (!words.length || words.every((w) => norm(`${c.name} ${c.title} ${c.country || ''} ${c.sub || ''} ${c.aka || ''} ${c.figma || ''}`).includes(w))));
  }
  const groupTitle = () => {
    const g = ui.group, v = g.slice(2);
    if (!g) return ui.st === 'del' ? 'Obrisane korice' : 'Sve korice';
    if (g[0] === 't') return (CATS.find(([k]) => k === v) || ['', v])[1];
    if (g[0] === 'c') return (CONTS.find(([k]) => k === v) || ['', v])[1];
    return v;
  };
  let sortable = null;
  function renderGrid() {
    ui.list = currentList();
    $('#mainTitle').textContent = ui.view === 'pop' ? 'Najpopularnije' : groupTitle();
    $('#mainHint').textContent = ui.view === 'pop' ? `${ui.list.length} korica · prevuci da promeniš redosled na sajtu` : ui.st === 'del' ? `${ui.list.length} obrisanih · ne vide se na sajtu; vrati ih strelicom ili „Isprazni korpu“` : `${ui.list.length} korica · klik = uređivanje · kvadratić ili ⌘-klik = izbor više · ⌘Z = poništi`;
    $('#emptyTrash').hidden = !(ui.st === 'del' && ui.list.length);
    $('#grid').innerHTML = ui.list.length ? ui.list.map(cardHTML).join('') : '<p class="empty">Nema korica za ovaj izbor.</p>';
    if (sortable) { sortable.destroy(); sortable = null; }
    if (ui.view === 'pop' && window.Sortable) {
      sortable = Sortable.create($('#grid'), {
        animation: 160,
        onEnd: () => { snap(); draft.feat = $$('#grid .card').map((x) => x.dataset.id); reapply(); save(); renderGrid(); },
      });
    }
  }
  function refreshCard(id) {
    const el = $(`#grid .card[data-id="${id}"]`), c = byId(id);
    if (el && c) el.outerHTML = cardHTML(c);
  }
  $('#grid').addEventListener('click', (e) => {
    const card = e.target.closest('.card');
    if (!card) return;
    const id = card.dataset.id;
    const qa = e.target.closest('[data-qa]');
    if (qa) {
      const c = byId(id), act = qa.dataset.qa;
      if (act === 'feat') { setFeat(id, !(c.featIdx >= 0)); toast(c.featIdx >= 0 ? 'Dodato u najpopularnije' : 'Izbačeno iz najpopularnijih'); }
      if (act === 'st') { setStatus([id], c.st === 'draft' ? 'live' : 'draft'); toast(byId(id).st === 'live' ? 'Objavljeno (posle „Objavi na sajt“)' : 'Sklonjeno u skicu'); }
      if (act === 'del') { setStatus([id], 'del'); if (ui.cur === id) closeEdit(); toast('Korica je obrisana', true); }
      if (act === 'restore') { setStatus([id], 'draft'); toast('Vraćeno kao skica'); }
      renderGroups(); renderGrid(); renderStats();
      if (ui.cur === id) fillEdit();
      return;
    }
    if (e.target.closest('[data-pick]') || e.metaKey || e.ctrlKey) {
      ui.picked.has(id) ? ui.picked.delete(id) : ui.picked.add(id);
      refreshCard(id);
      renderBulk();
      return;
    }
    openEdit(id);
  });
  $('#q').addEventListener('input', (e) => { ui.q = e.target.value; ui.view = 'all'; if (ui.q) { ui.group = ''; renderGroups(); } $$('#viewSeg button').forEach((x) => x.classList.toggle('on', x.dataset.view === 'all')); renderGrid(); });
  $('#viewSeg').addEventListener('click', (e) => {
    const b = e.target.closest('[data-view]');
    if (!b) return;
    ui.view = b.dataset.view;
    $$('#viewSeg button').forEach((x) => x.classList.toggle('on', x === b));
    renderGrid();
  });
  $('#stSeg').addEventListener('click', (e) => {
    const b = e.target.closest('[data-st]');
    if (!b) return;
    ui.st = b.dataset.st;
    ui.view = 'all';
    $$('#viewSeg button').forEach((x) => x.classList.toggle('on', x.dataset.view === 'all'));
    $$('#stSeg button').forEach((x) => x.classList.toggle('on', x === b));
    if (ui.group && !ALL.some((c) => visible(c) && inGroup(c, ui.group))) ui.group = '';
    renderGroups();
    renderGrid();
  });
  $('#emptyTrash').onclick = () => {
    const ids = ALL.filter((c) => c.st === 'del').map((c) => c.id);
    $('#confirmText').textContent = `Trajno ukloniti ${ids.length} obrisanih korica iz admina? Posle ovoga mogu da se vrate samo ponovnim uvozom iz Figme.`;
    $('#confirmOk').textContent = 'Isprazni korpu';
    $('#confirmModal').hidden = false;
    $('#confirmOk').onclick = () => {
      snap();
      draft.gone = [...new Set([...(draft.gone || []), ...ids])];
      draft.added = draft.added.filter((n) => !ids.includes(n.id));
      reapply(); save(); renderAll();
      $('#confirmModal').hidden = true;
      toast(`Uklonjeno: ${ids.length}`, true);
    };
  };
  $('#confirmCancel').onclick = () => ($('#confirmModal').hidden = true);

  /* ---------- izbor više korica ---------- */
  function renderBulk() {
    $('#bulk').hidden = !ui.picked.size;
    $('#bulkN').textContent = `${ui.picked.size} izabrano`;
    document.body.classList.toggle('picking', ui.picked.size > 0);
  }
  $('#bulk').addEventListener('click', (e) => {
    const a = e.target.closest('[data-bulk]');
    if (!a) return;
    const ids = [...ui.picked];
    const act = a.dataset.bulk;
    if (act === 'none') { ui.picked.clear(); renderBulk(); renderGrid(); return; }
    snap();
    ids.forEach((id) => {
      if (act === 'live' || act === 'draft' || act === 'del') { draft.covers[id] = Object.assign(draft.covers[id] || {}, { st: act }); if (act === 'del') draft.feat = draft.feat.filter((x) => x !== id); }
      if (act === 'restore') draft.covers[id] = Object.assign(draft.covers[id] || {}, { st: 'draft' });
      if (act === 'feat' && !draft.feat.includes(id)) draft.feat.push(id);
      if (act === 'unfeat') draft.feat = draft.feat.filter((x) => x !== id);
    });
    if (act === 'del' || act === 'restore') ui.picked.clear();
    reapply();
    save();
    renderGroups();
    renderGrid();
    if (ui.cur) fillEdit();
    renderBulk();
    toast(act === 'del' ? `Obrisano: ${ids.length}` : `Promenjeno: ${ids.length}`, act === 'del');
  });

  /* ---------- uređivanje ---------- */
  const SL = [
    ['t', 's', 'Veličina', 50, 130, '%'], ['t', 'x', 'Levo / desno', -1240, 1240, ''], ['t', 'y', 'Gore / dole', -800, 3000, ''], ['mg', null, 'Razmak od ivica', 0, 500, ''],
    ['s', 's', 'Veličina', 50, 160, '%'], ['s', 'x', 'Levo / desno', -2000, 2000, ''], ['s', 'y', 'Gore / dole', -1000, 3000, ''],
    ['y', 's', 'Veličina', 50, 160, '%'], ['y', 'x', 'Levo / desno', -2000, 2000, ''], ['y', 'y', 'Gore / dole', -1000, 3000, ''],
    ['a', 's', 'Veličina', 50, 150, '%'], ['a', 'x', 'Levo / desno', -1800, 1800, ''], ['a', 'y', 'Gore / dole', -2500, 2500, ''],
  ];
  const HEAD = { t: 'Naslov', s: 'Podnaslov', y: 'Godina', a: 'Ilustracija' };
  function adjVal(c, k, p) {
    const a = c.adj || {};
    if (k === 'mg') return a.mg || 0;
    const v = (a[k] || {})[p];
    return p === 's' ? Math.round((v || 1) * 100) : v || 0;
  }
  const ROLE = { t: 'Naslov', s: 'Podnaslov', y: 'Godina' };
  const origText = (c, k) => (c._orig || {})[{ t: 'title', s: 'sub', y: 'year' }[k]] || '';
  function renderTexts(c) {
    const roles = new Set(c.fig.T.map((t) => t.r));
    const txt = c.txt || {}, adj = c.adj || {};
    $('#txtRows').innerHTML = ['t', 's', 'y'].filter((k) => roles.has(k)).map((k) => {
      const hid = !!(adj[k] || {}).hide;
      const v = txt[k] != null ? txt[k] : origText(c, k);
      return `<div class="txt-row ${hid ? 'off' : ''}" data-k="${k}"><label for="tx${k}">${ROLE[k]}</label><input id="tx${k}" value="${esc(v)}" autocomplete="off"${hid ? ' disabled' : ''}><button type="button" class="eye" data-hide="${k}" aria-pressed="${!hid}" title="${hid ? 'Prikaži na korici' : 'Sakrij sa korice'}">${hid ? ICO.eyeOff : ICO.eye}</button></div>`;
    }).join('') || '<p class="note">Ova korica nema tekst koji se menja (tekst je deo slike).</p>';
  }
  $('#txtRows').addEventListener('input', (e) => {
    const inp = e.target.closest('input');
    if (!inp || !ui.cur) return;
    const c = byId(ui.cur), k = inp.closest('[data-k]').dataset.k;
    const txt = clone(c.txt || {});
    if (inp.value === origText(c, k)) delete txt[k]; else txt[k] = inp.value;
    setOv(ui.cur, { txt: Object.keys(txt).length ? txt : undefined }, ui.cur + 'txt' + k);
    renderPreview();
    clearTimeout(liveT);
    liveT = setTimeout(() => refreshCard(ui.cur), 150);
  });
  $('#txtRows').addEventListener('click', (e) => {
    const b = e.target.closest('[data-hide]');
    if (!b || !ui.cur) return;
    const c = byId(ui.cur), k = b.dataset.hide;
    const hid = !((c.adj || {})[k] || {}).hide;
    setOv(ui.cur, { adj: setAdjPart(c, k, { hide: hid ? 1 : undefined }) });
    renderTexts(byId(ui.cur));
    renderPreview();
    refreshCard(ui.cur);
    toast(`${ROLE[k]}: ${hid ? 'sakriveno' : 'prikazano'}`);
  });
  function renderSliders(c) {
    const roles = new Set(c.fig.T.map((t) => t.r));
    let html = '', last = '';
    SL.forEach(([k, p, lab, min, max, unit]) => {
      const grp = k === 'mg' ? 't' : k;
      if ((grp === 's' && !roles.has('s')) || (grp === 'y' && !roles.has('y')) || (grp === 't' && !roles.has('t'))) return;
      if (grp !== last) { html += `<h5>${HEAD[grp]}</h5>`; last = grp; }
      const v = adjVal(c, k, p), def = p === 's' ? 100 : 0;
      html += `<label class="sl ${v !== def ? 'changed' : ''}"><span>${lab}</span><input type="range" min="${min}" max="${max}" step="${p === 's' ? 1 : 5}" value="${v}" data-k="${k}" data-p="${p || ''}"><output>${v}${unit}</output></label>`;
    });
    $('#sliders').innerHTML = html;
  }
  function renderPreview() {
    const c = byId(ui.cur);
    if (!c) return;
    const t = $('#tryTitle').value.trim();
    const svg = c.fig ? TTF.figmaSVG(c, t ? { title: t } : {}) : TT.coverSVG(c, Object.assign({ year: c.other ? '' : YEAR }, t ? { title: t } : {}));
    $('#preview').innerHTML = svg + '<i class="guide" title="Sigurna zona: tekst unutar linije neće otići na ivicu ili riknu"></i><i class="vline"></i>';
  }
  function fillEdit() {
    const c = byId(ui.cur);
    if (!c) return;
    $('#eName').textContent = c.name + (!c.other && c.country ? ', ' + c.country : '');
    $('#eSub').textContent = [c.isNew ? 'novi dizajn' : c.figma ? 'Figma ' + c.figma : '', `${ui.list.findIndex((x) => x.id === c.id) + 1} / ${ui.list.length}`].filter(Boolean).join(' · ');
    $$('#eSt button').forEach((x) => x.classList.toggle('on', x.dataset.st === c.st));
    $('#eSt').hidden = c.st === 'del';
    $('#delNote').hidden = c.st !== 'del';
    $('#delBtn').hidden = c.st === 'del';
    $('#eFeat').checked = isFeat(c.id);
    const other = !!c.other;
    $$('#eKind button').forEach((x) => x.classList.toggle('on', x.dataset.kind === (other ? 'other' : 'travel')));
    $('#travelFields').hidden = other;
    $('#otherFields').hidden = !other;
    $('#ePlace').value = other ? '' : c.name;
    $('#eCountry').value = c.country || '';
    $('#eCont').value = c.cont || 'evropa';
    $('#eThemeName').value = other ? c.name : '';
    $('#eCat').value = (c.cat || [])[0] || 'rodj';
    const fig = !!(c.fig && c.fig.T && c.fig.T.length);
    const roles = new Set(c.fig ? c.fig.T.map((t) => t.r) : []);
    $('#adjBox').hidden = !fig;
    $('#txtBox').hidden = !fig;
    $('#oldNote').hidden = fig;
    $('#centerAct').hidden = !c.fig;
    $('#dragHint').hidden = !c.fig;
    $$('#centerAct [data-center]').forEach((b) => (b.hidden = b.dataset.center !== 'a' && !roles.has(b.dataset.center)));
    if (fig) {
      renderSliders(c); renderTexts(c);
      const T = c.fig.T.filter((t) => t.r === 't');
      const lowTitle = T.length && TTF.stdT(Object.assign({}, c, { adj: {} })) === c.fig.T;
      $('#eStd').checked = !(c.adj && c.adj.free) && !lowTitle;
      $('#eStd').disabled = !T.length || lowTitle;
      $('#stdNote').textContent = lowTitle ? 'Na ovoj korici je naslov namerno niže, pa ostaje kao u Figmi. Pomeri ga mišem ako treba.' : 'Naslov tačno na sredini, uvek isto od gornje ivice i bar 1 cm od bočnih ivica. Isključi samo ako dizajn traži položaj iz Figme.';
    }
    renderPreview();
  }
  function openEdit(id) {
    const prev = ui.cur;
    ui.cur = id;
    $('#edit').hidden = false;
    if (prev) refreshCard(prev);
    refreshCard(id);
    fillEdit();
  }
  function closeEdit() { const p = ui.cur; ui.cur = null; $('#edit').hidden = true; if (p) refreshCard(p); }
  $('#closeBtn').onclick = closeEdit;
  $('#delBtn').onclick = () => {
    if (!ui.cur) return;
    const id = ui.cur, i = ui.list.findIndex((c) => c.id === id);
    setStatus([id], 'del');
    renderGroups(); renderGrid(); renderStats();
    const n = ui.list[i] || ui.list[i - 1];
    if (n) openEdit(n.id); else closeEdit();
    toast('Korica je obrisana', true);
  };
  $('#restoreBtn').onclick = () => { if (!ui.cur) return; setStatus([ui.cur], 'draft'); renderGroups(); renderGrid(); fillEdit(); toast('Vraćeno kao skica'); };
  $('#undoBtn').onclick = undo;
  $('#redoBtn').onclick = redo;
  function step(d) {
    const i = ui.list.findIndex((c) => c.id === ui.cur);
    const n = ui.list[i + d];
    if (n) { openEdit(n.id); const el = $(`#grid .card[data-id="${n.id}"]`); if (el) el.scrollIntoView({ block: 'nearest' }); }
  }
  $('#prevBtn').onclick = () => step(-1);
  $('#nextBtn').onclick = () => step(1);
  document.addEventListener('keydown', (e) => {
    const typing = /input|select|textarea/i.test(document.activeElement.tagName);
    if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'z' && !typing) { e.preventDefault(); if (e.shiftKey) redo(); else undo(); return; }
    if (e.key === '/' && !typing) { e.preventDefault(); $('#q').focus(); return; }
    if (!ui.cur || typing) return;
    if (e.key === 'Delete' || e.key === 'Backspace') { e.preventDefault(); $('#delBtn').click(); return; }
    if (e.key === 'ArrowRight') step(1);
    if (e.key === 'ArrowLeft') step(-1);
    if (e.key === 'Escape') $('#closeBtn').click();
  });
  $('#tryTitle').addEventListener('input', renderPreview);
  $('#eSt').addEventListener('click', (e) => {
    const b = e.target.closest('[data-st]');
    if (!b || !ui.cur) return;
    setOv(ui.cur, { st: b.dataset.st });
    if (b.dataset.st !== 'live') draft.feat = draft.feat.filter((x) => x !== ui.cur);
    reapply(); save();
    fillEdit(); refreshCard(ui.cur); renderGroups();
  });
  $('#eFeat').addEventListener('change', (e) => { setFeat(ui.cur, e.target.checked); refreshCard(ui.cur); if (ui.view === 'pop') renderGrid(); });
  $('#eKind').addEventListener('click', (e) => {
    const b = e.target.closest('[data-kind]');
    if (!b || !ui.cur) return;
    const c = byId(ui.cur);
    if (b.dataset.kind === 'other' && !c.other) setOv(ui.cur, { other: true, cat: [$('#eCat').value || 'rodj'], name: c.name });
    if (b.dataset.kind === 'travel' && c.other) setOv(ui.cur, { other: false, cat: [], cont: c.cont || 'evropa' });
    fillEdit(); refreshCard(ui.cur); renderGroups();
  });
  const onField = (sel, fn) => $(sel).addEventListener('change', () => { if (!ui.cur) return; fn($(sel).value.trim()); fillEdit(); refreshCard(ui.cur); renderGroups(); });
  onField('#ePlace', (v) => {
    if (!v) return;
    const same = ALL.find((c) => !c.other && norm(c.name) === norm(v));
    setOv(ui.cur, { name: v, country: same ? same.country : $('#eCountry').value.trim(), cont: same ? same.cont : $('#eCont').value });
  });
  onField('#eCountry', (v) => setOv(ui.cur, { country: v }));
  onField('#eCont', (v) => setOv(ui.cur, { cont: v }));
  onField('#eThemeName', (v) => v && setOv(ui.cur, { name: v }));
  onField('#eCat', (v) => setOv(ui.cur, { cat: [v] }));
  let liveT;
  $('#sliders').addEventListener('input', (e) => {
    const r = e.target.closest('input[type=range]');
    if (!r || !ui.cur) return;
    const c = byId(ui.cur);
    const adj = clone(c.adj || {});
    const k = r.dataset.k, p = r.dataset.p, v = +r.value;
    if (k === 'mg') { if (v) adj.mg = v; else delete adj.mg; }
    else {
      adj[k] = Object.assign({}, adj[k] || {}, { [p]: p === 's' ? v / 100 : v });
      if ((adj[k].s || 1) === 1 && !adj[k].x && !adj[k].y && !adj[k].hide) delete adj[k];
    }
    setOv(ui.cur, { adj: Object.keys(adj).length ? adj : undefined }, ui.cur + 'sl' + k + p);
    r.nextElementSibling.textContent = v + (p === 's' ? '%' : '');
    r.parentElement.classList.toggle('changed', v !== (p === 's' ? 100 : 0));
    renderPreview();
    clearTimeout(liveT);
    liveT = setTimeout(() => refreshCard(ui.cur), 120);
  });
  $('#eStd').addEventListener('change', (e) => {
    if (!ui.cur) return;
    const c = byId(ui.cur), adj = clone(c.adj || {});
    if (e.target.checked) delete adj.free; else adj.free = 1;
    setOv(ui.cur, { adj: Object.keys(adj).length ? adj : undefined });
    renderPreview(); refreshCard(ui.cur);
  });
  $('#resetAdj').onclick = () => { if (!ui.cur) return; setOv(ui.cur, { adj: undefined, txt: undefined }); fillEdit(); refreshCard(ui.cur); toast('Vraćeno kao u Figmi', true); };
  $('#copyAdj').onclick = () => {
    const c = byId(ui.cur);
    const ids = [...ui.picked].filter((id) => id !== ui.cur && byId(id) && byId(id).fig);
    if (!ids.length) { toast('Prvo izaberi korice kvadratićem u uglu.'); return; }
    snap();
    ids.forEach((id) => { const o = Object.assign(draft.covers[id] || {}, { adj: c.adj ? clone(c.adj) : undefined }); if (!o.adj) delete o.adj; draft.covers[id] = o; });
    reapply(); save(); renderGrid();
    toast(`Podešavanja primenjena na ${ids.length} korica`);
  };

  /* ---------- novi dizajn: iz Figme (link) ili gotova slika ---------- */
  const TOKEN_KEY = 'tt-figma-token';
  const NOT_WEB = new Set(['Rockwell Extra Bold', 'Rage Italic', 'Times New Roman', 'Sansation', 'Sansation Light', 'Monotype Corsiva', 'Cooper Black', 'Segoe Print', 'CaghenDemo', 'Recursive']);
  const hex = (c) => '#' + [c.r, c.g, c.b].map((v) => Math.round(v * 255).toString(16).padStart(2, '0')).join('');
  let newTab = 'build', pngFile = null;
  function status(msg, bad) { const s = $('#newStatus'); s.textContent = msg; s.classList.toggle('bad', !!bad); }
  $('#addBtn').onclick = () => {
    $('#newForm').reset();
    pngFile = null;
    $('#newImg').hidden = true;
    $('#newDropText').hidden = false;
    $('#figToken').value = localStorage.getItem(TOKEN_KEY) || '';
    status('');
    $$('#nKind button').forEach((x) => x.classList.toggle('on', x.dataset.kind === 'travel'));
    $('#nTravel').hidden = false; $('#nOther').hidden = true;
    $('#newOk').disabled = false;
    $('#newModal').hidden = false;
    bReset();
    $$('#newTabs button').forEach((x) => x.classList.toggle('on', x.dataset.tab === 'build'));
    newTab = 'build';
    $('#tabBuild').hidden = false; $('#tabFigma').hidden = true; $('#tabPng').hidden = true;
    $('#newOk').textContent = 'Dodaj kao skicu';
    $('#bTitle').focus();
  };
  $('#newCancel').onclick = () => ($('#newModal').hidden = true);
  $('#newTabs').addEventListener('click', (e) => {
    const b = e.target.closest('[data-tab]');
    if (!b) return;
    newTab = b.dataset.tab;
    $$('#newTabs button').forEach((x) => x.classList.toggle('on', x === b));
    $('#tabBuild').hidden = newTab !== 'build';
    $('#tabFigma').hidden = newTab !== 'figma';
    $('#tabPng').hidden = newTab !== 'png';
    $('#newOk').textContent = newTab === 'figma' ? 'Uvezi kao skicu' : 'Dodaj kao skicu';
    if (newTab === 'build') bPreview();
  });
  $('#nKind').addEventListener('click', (e) => {
    const b = e.target.closest('[data-kind]');
    if (!b) return;
    $$('#nKind button').forEach((x) => x.classList.toggle('on', x === b));
    $('#nTravel').hidden = b.dataset.kind !== 'travel';
    $('#nOther').hidden = b.dataset.kind === 'travel';
  });
  $('#newFile').addEventListener('change', (e) => {
    pngFile = e.target.files[0] || null;
    if (!pngFile) return;
    $('#newImg').src = URL.createObjectURL(pngFile);
    $('#newImg').hidden = false;
    $('#newDropText').hidden = true;
  });

  // mesto: ručno upisano, ili kao kod postojećih korica sa istim naslovom
  function placementFor(title) {
    const other = !$('#nOther').hidden;
    if (other) return { other: true, cat: [$('#nCat').value], name: $('#nThemeName').value.trim() || title };
    const place = $('#nPlace').value.trim();
    if (place) {
      const same = ALL.find((c) => !c.other && norm(c.name) === norm(place));
      return { name: place, country: $('#nCountry').value.trim() || (same && same.country) || '', cont: $('#nCont').value || (same && same.cont) || 'evropa' };
    }
    const like = ALL.find((c) => norm(c.title) === norm(title)) || ALL.find((c) => norm(c.name) === norm(title));
    if (like) return like.other ? { other: true, cat: like.cat.slice(), name: like.name } : { name: like.name, country: like.country || '', cont: like.cont || 'evropa' };
    const nice = title ? title.charAt(0) + title.slice(1).toLocaleLowerCase('sr') : 'Novi dizajn';
    return { name: nice, country: '', cont: $('#nCont').value || 'evropa' };
  }
  // A4 platno -> master (pun kvalitet, IndexedDB) + slika za sajt
  async function storeArt(id, cv) {
    const master = await new Promise((ok) => cv.toBlob(ok, 'image/png'));
    await catalog.idbPut(id, master);
    const sm = document.createElement('canvas');
    sm.width = 720; sm.height = Math.round((720 * cv.height) / cv.width);
    sm.getContext('2d').drawImage(cv, 0, 0, sm.width, sm.height);
    return sm.toDataURL('image/webp', 0.85);
  }
  function alphaBox(cv) {
    const s = 0.1, w = Math.round(cv.width * s), h = Math.round(cv.height * s);
    const t = document.createElement('canvas');
    t.width = w; t.height = h;
    const g = t.getContext('2d');
    g.drawImage(cv, 0, 0, w, h);
    const d = g.getImageData(0, 0, w, h).data;
    let x0 = w, y0 = h, x1 = 0, y1 = 0;
    for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) if (d[(y * w + x) * 4 + 3] > 20) { x0 = Math.min(x0, x); x1 = Math.max(x1, x); y0 = Math.min(y0, y); y1 = Math.max(y1, y); }
    return x1 < x0 ? null : [x0 / s, y0 / s, (x1 + 1) / s, (y1 + 1) / s].map(Math.round);
  }
  function addCover(n) {
    snap();
    draft.added.push(n);
    draft.covers[n.id] = { st: 'draft' };
  }

  async function importFigma(link, token) {
    const m = link.match(/figma\.com\/(?:design|file|proto)\/([A-Za-z0-9]+)[^?]*\?(?:.*&)?node-id=([0-9]+[-:][0-9]+)/);
    if (!m) throw new Error('Link nema oznaku okvira (node-id). Kopiraj link sa „Copy link to selection“.');
    const key = m[1], nid = m[2].replace('-', ':');
    const api = async (path) => {
      const r = await fetch('https://api.figma.com/v1/' + path, { headers: { 'X-Figma-Token': token } });
      if (r.status === 403 || r.status === 401) throw new Error('Token nije ispravan ili nema pristup ovom fajlu.');
      if (r.status === 429) throw new Error('Figma traži pauzu (previše zahteva). Pokušaj za minut.');
      if (!r.ok) throw new Error('Figma je vratila grešku ' + r.status + '.');
      return r.json();
    };
    const js = await api(`files/${key}/nodes?ids=${encodeURIComponent(nid)}`);
    const frame = js.nodes && js.nodes[nid] && js.nodes[nid].document;
    if (!frame || !frame.absoluteBoundingBox) throw new Error('Okvir nije pronađen u fajlu.');
    const fb = frame.absoluteBoundingBox;
    if (Math.abs(fb.width / fb.height - 2480 / 3508) > 0.03) throw new Error(`„${frame.name}“ nije A4 okvir korice.`);
    const S = TTF.PW / fb.width, PW = TTF.PW, PH = TTF.PH;
    // tekstovi i uloge (naslov, podnaslov, godina) – isto pravilo kao pri prenosu svih korica
    const texts = [];
    (function walk(n) { if (n.visible === false) return; if (n.type === 'TEXT') texts.push(n); (n.children || []).forEach(walk); })(frame);
    const info = texts.map((t) => {
      const st = t.style || {}, bb = t.absoluteBoundingBox;
      if (!bb || (t.characterStyleOverrides || []).some((v) => v)) return null;
      const fam = st.fontFamily || 'Raleway';
      if (NOT_WEB.has(fam) || (fam !== 'Raleway' && !(window.TT_FONT_METRICS || {})[fam])) return null;
      const fl = (t.fills || []).filter((p) => p.visible !== false);
      if (fl.length !== 1 || fl[0].type !== 'SOLID') return null;
      if (t.rotation && Math.abs(t.rotation) > 0.001) return null;
      const z = st.fontSize * S;
      const o = {
        node: t, s: t.characters, x: Math.round((bb.x - fb.x) * S), y: Math.round((bb.y - fb.y) * S), w: Math.round(bb.width * S), h: Math.round(bb.height * S),
        wt: st.fontWeight || 400, z: Math.round(z * 10) / 10, ls: Math.round((st.letterSpacing || 0) * S * 100) / 100,
        lh: st.lineHeightUnit === 'PIXELS' ? Math.round(st.lineHeightPx * S * 10) / 10 : st.lineHeightUnit === 'FONT_SIZE_%' ? Math.round(((st.lineHeightPercentFontSize || 100) / 100) * z * 10) / 10 : 0,
        c: hex(fl[0].color), a: (st.textAlignHorizontal || 'LEFT')[0], up: st.textCase === 'UPPER' ? 1 : 0,
      };
      const op = (fl[0].opacity == null ? 1 : fl[0].opacity) * (t.opacity == null ? 1 : t.opacity);
      if (op < 0.99) o.o = Math.round(op * 100) / 100;
      if (fam !== 'Raleway') o.f = fam;
      if (st.italic) o.it = 1;
      return o;
    }).filter(Boolean);
    const top = info.filter((t) => t.y < PH * 0.45);
    const maxZ = Math.max(0, ...top.map((t) => t.z));
    const roles = [];
    if (maxZ >= 250) {
      const isNum = (t) => /^[\d\s.\/]+$/.test(t.s);
      const titles = top.filter((t) => t.z >= maxZ * 0.75 && !isNum(t)).sort((a, b) => a.y - b.y);
      titles.forEach((t) => roles.push(Object.assign({ r: 't' }, t)));
      const nums = top.filter((t) => isNum(t) && !titles.includes(t)).sort((a, b) => a.x - b.x);
      if (nums.length) {
        const grp = nums.filter((n) => Math.abs(n.y - nums[0].y) < nums[0].h);
        roles.push(Object.assign({ r: 'y' }, nums[0], { s: grp.map((n) => n.s.trim()).join(''), extra: grp.slice(1).map((n) => n.node) }));
      }
      top.filter((t) => !titles.includes(t) && !isNum(t) && t.z < maxZ * 0.75).forEach((t) => roles.push(Object.assign({ r: 's' }, t)));
    }
    const roleNodes = new Set();
    roles.forEach((r) => { roleNodes.add(r.node.id); (r.extra || []).forEach((n) => roleNodes.add(n.id)); });
    const hasRole = (n) => roleNodes.has(n.id) || (n.children || []).some(hasRole);
    // ilustracija: svi delovi okvira osim teksta koji kupac menja, svaki u punoj rezoluciji
    const units = [];
    if (!roleNodes.size) frame.children.forEach((n) => { if (n.visible !== false && n.absoluteBoundingBox) units.push(n); });
    else (function visit(n) {
      if (n.visible === false) return;
      if (!hasRole(n)) { if (n.absoluteBoundingBox) units.push(n); return; }
      (n.children || []).forEach(visit);
    })({ children: frame.children, visible: true, id: '_root' });
    const cv = document.createElement('canvas');
    cv.width = PW; cv.height = PH;
    const g = cv.getContext('2d');
    let bg = null, fixedBg = false;
    (frame.fills || []).forEach((p) => {
      if (p.visible === false) return;
      if (p.type !== 'SOLID') { fixedBg = true; return; }
      const a = p.opacity == null ? 1 : p.opacity, col = [p.color.r, p.color.g, p.color.b];
      bg = bg ? bg.map((v, i) => v * (1 - a) + col[i] * a) : col;
    });
    if (fixedBg) {
      const imgs = await api(`files/${key}/images`).catch(() => ({ meta: { images: {} } }));
      for (const p of frame.fills) {
        if (p.visible === false || p.type !== 'IMAGE' || !imgs.meta.images[p.imageRef]) continue;
        const bmp = await createImageBitmap(await (await fetch(imgs.meta.images[p.imageRef])).blob());
        const r = Math.max(PW / bmp.width, PH / bmp.height);
        g.drawImage(bmp, (PW - bmp.width * r) / 2, (PH - bmp.height * r) / 2, bmp.width * r, bmp.height * r);
      }
    }
    if (units.length) {
      const im = await api(`images/${key}?ids=${encodeURIComponent(units.map((u) => u.id).join(','))}&format=png&scale=${S}&use_absolute_bounds=true`);
      if (im.err) throw new Error('Figma nije napravila sliku: ' + im.err);
      for (const u of units) {
        const url = im.images && im.images[u.id];
        if (!url) continue;
        let blob;
        try { blob = await (await fetch(url)).blob(); } catch (e) { throw new Error('Slika iz Figme nije mogla da se preuzme (zaštita pretraživača). Javi mi pa ću to rešiti preko servera.'); }
        const bmp = await createImageBitmap(blob);
        const b = u.absoluteBoundingBox;
        g.drawImage(bmp, (b.x - fb.x) * S, (b.y - fb.y) * S, b.width * S, b.height * S);
      }
    }
    const T = roles.map((r) => { const o = Object.assign({}, r); delete o.node; delete o.extra; return o; });
    const titles = T.filter((t) => t.r === 't');
    const title = titles.map((t) => t.s.replace(/\s+/g, ' ').trim()).join(' ');
    const id = 'n' + Date.now().toString(36) + Math.random().toString(36).slice(2, 5);
    const art = await storeArt(id, cv);
    const subT = T.find((t) => t.r === 's'), yT = T.find((t) => t.r === 'y');
    const bgHex = bg ? '#' + bg.map((v) => Math.round(v * 255).toString(16).padStart(2, '0')).join('') : '#ffffff';
    const n = Object.assign({
      id, title, sub: subT ? subT.s : '', year: yT ? yT.s : '', bg: bgHex,
      ink: titles[0] ? titles[0].c : '#153a55', accent: (subT || yT || titles[0] || { c: '#153a55' }).c,
      fig: { art, T, bb: alphaBox(cv) }, src: `figma:${key}:${nid}`,
    }, placementFor(title || frame.name));
    if (fixedBg) n.fig.fx = 1;
    addCover(n);
    return n;
  }
  async function importPng(file) {
    const bmp = await createImageBitmap(file);
    const cv = document.createElement('canvas');
    cv.width = TTF.PW; cv.height = TTF.PH;
    const r = Math.min(cv.width / bmp.width, cv.height / bmp.height), w = bmp.width * r, h = bmp.height * r;
    const g = cv.getContext('2d');
    g.drawImage(bmp, (cv.width - w) / 2, (cv.height - h) / 2, w, h);
    const px = g.getImageData(4, Math.round(cv.height / 2), 1, 1).data;
    const bg = px[3] > 200 ? '#' + [px[0], px[1], px[2]].map((v) => v.toString(16).padStart(2, '0')).join('') : '#ffffff';
    const id = 'n' + Date.now().toString(36);
    const art = await storeArt(id, cv);
    const base = file.name.replace(/\.[a-z0-9]+$/i, '').replace(/[-_]+/g, ' ').trim();
    const n = Object.assign({ id, title: '', sub: '', year: '', bg, ink: '#153a55', accent: '#153a55', fixed: 1, fig: { art, T: [], fx: 1, bb: alphaBox(cv) } }, placementFor(base));
    if (bmp.width < 2000) toast('Slika je manja od 2480 px širine – u štampi može biti mutna.');
    addCover(n);
    return n;
  }

  /* ---------- novi dizajn: ilustracija + naslov (korica ostaje potpuno uređiva) ---------- */
  let bBmps = [], bTimer = null;
  const bFonts = () => ['Raleway'].concat(Object.keys((window.TT_DATA || {}).fonts || {}).filter((f) => f !== 'Raleway'));
  const bWeight = (f) => { const w = ((window.TT_DATA || {}).fonts || {})[f]; return f === 'Raleway' || !w ? 900 : Math.max(...w); };
  function bReset() {
    bBmps = [];
    $('#bFile').value = '';
    $('#bPrev').innerHTML = '';
    $('#bDropText').innerHTML = '<b>Izaberi ilustraciju (može i više njih odjednom)</b><small>Najbolje PNG sa providnom pozadinom. Svaka slika postaje jedna korica. Naslov i godina se dodaju ispod i kupac ih može menjati.</small>';
    $('#bSize').value = 100; $('#bPos').value = 0;
    const sel = $('#bFont');
    if (!sel.options.length) bFonts().forEach((f) => sel.add(new Option(f, f)));
  }
  function bCompose(bmp) {
    const PW = TTF.PW, PH = TTF.PH, k = $('#bSize').value / 100;
    const cv = document.createElement('canvas');
    cv.width = PW; cv.height = PH;
    const maxW = 1900 * k, maxH = 2100 * k;
    const r = Math.min(maxW / bmp.width, maxH / bmp.height), w = bmp.width * r, h = bmp.height * r;
    const g = cv.getContext('2d');
    g.imageSmoothingQuality = 'high';
    g.drawImage(bmp, (PW - w) / 2, 2300 + Number($('#bPos').value) - h / 2, w, h);
    return cv;
  }
  async function bTexts() {
    const PW = TTF.PW, fam = $('#bFont').value || 'Raleway', wt = bWeight(fam);
    const title = $('#bTitle').value.trim(), year = $('#bYear').value.trim();
    if (!title) return [];
    await document.fonts.load(`${wt} 100px '${fam}'`).catch(() => {});
    await document.fonts.load(`800 100px '${fam}'`).catch(() => {});
    const m = (window.TT_FONT_METRICS || {})[fam] || [0.94, 1.174];
    const g = document.createElement('canvas').getContext('2d');
    const meas = (font, ls, s) => { g.font = font; g.letterSpacing = ls + 'px'; return g.measureText(s).width; };
    const T = [], up = title.toLocaleUpperCase('sr');
    const w100 = meas(`${wt} 100px '${fam}'`, -4, up);
    const z = Math.round(Math.min(900, (2240 / w100) * 100) * 10) / 10, ls = -0.04 * z;
    const w = Math.round(meas(`${wt} ${z}px '${fam}'`, ls, up)), h = Math.round(m[1] * z), x = Math.round((PW - w) / 2), y = 100;
    const base = (o) => Object.assign({ lh: 0, a: 'L', up: 0 }, o, fam !== 'Raleway' ? { f: fam } : {});
    T.push(base({ r: 't', s: up, x, y, w, h, wt, z, ls, c: $('#bInk').value, up: 1 }));
    if (year) {
      const yz = Math.round(Math.min(320, z * 0.3) * 10) / 10, yls = -0.06 * yz;
      const yw = Math.round(meas(`800 ${yz}px '${fam}'`, yls, year));
      const tb = y + m[0] * z;
      T.push(base({ r: 'y', s: year, x: x + w - yw, y: Math.round(tb + 25 - m[0] * yz + yz * 0.71), w: yw, h: Math.round(m[1] * yz), wt: 800, z: yz, ls: yls, c: $('#bAcc').value }));
    }
    return T;
  }
  function bPreview() {
    clearTimeout(bTimer);
    bTimer = setTimeout(async () => {
      const box = $('#bPrev');
      if (!bBmps.length) { box.innerHTML = ''; return; }
      const T = await bTexts();
      box.innerHTML = '';
      for (const bmp of bBmps.slice(0, 4)) {
        const cv = bCompose(bmp), sm = document.createElement('canvas');
        sm.width = 360; sm.height = Math.round((360 * cv.height) / cv.width);
        sm.getContext('2d').drawImage(cv, 0, 0, sm.width, sm.height);
        const n = { id: 'prev', title: $('#bTitle').value, name: '', bg: $('#bBg').value, ink: $('#bInk').value, accent: $('#bAcc').value, fig: { art: sm.toDataURL('image/webp', 0.8), T, bb: [0, 0, TTF.PW, TTF.PH] } };
        const d = document.createElement('div');
        d.innerHTML = TTF.figmaSVG(n);
        box.appendChild(d.firstChild);
      }
      if (bBmps.length > 4) { const p = document.createElement('p'); p.className = 'note'; p.textContent = `+ još ${bBmps.length - 4} (isti naslov i boje)`; box.appendChild(p); }
    }, 120);
  }
  $('#bFile').addEventListener('change', async (e) => {
    const files = [...e.target.files];
    bBmps = [];
    for (const f of files) { try { bBmps.push(await createImageBitmap(f)); } catch (err) { toast('Slika „' + f.name + '“ ne može da se otvori.'); } }
    if (!bBmps.length) return;
    $('#bDropText').innerHTML = `<b>Izabrano: ${bBmps.length}</b><small>Klikni da izabereš druge.</small>`;
    // pozadina iz slike (ako je ugao neproziran)
    const t = document.createElement('canvas'); t.width = t.height = 1;
    const g = t.getContext('2d'); g.drawImage(bBmps[0], 2, 2, 1, 1, 0, 0, 1, 1);
    const px = g.getImageData(0, 0, 1, 1).data;
    if (px[3] > 240) $('#bBg').value = '#' + [px[0], px[1], px[2]].map((v) => v.toString(16).padStart(2, '0')).join('');
    if (bBmps[0].width < 1000) toast('Slika je mala (manja od 1000 px) – u štampi može biti mutna.');
    bPreview();
  });
  ['#bTitle', '#bYear', '#bBg', '#bInk', '#bAcc', '#bFont', '#bSize', '#bPos'].forEach((q) => { $(q).addEventListener('input', bPreview); $(q).addEventListener('change', bPreview); });
  async function buildCovers() {
    if (!bBmps.length) throw new Error('Izaberi bar jednu ilustraciju.');
    if (!$('#bTitle').value.trim()) throw new Error('Upiši naslov korice (npr. MILANO).');
    const T = await bTexts(), title = T[0].s, out = [];
    for (let i = 0; i < bBmps.length; i++) {
      status(`Pravim ${i + 1} od ${bBmps.length}…`);
      const cv = bCompose(bBmps[i]);
      const id = 'n' + Date.now().toString(36) + i + Math.random().toString(36).slice(2, 4);
      const art = await storeArt(id, cv);
      const n = Object.assign({
        id, title, sub: '', year: $('#bYear').value.trim(), bg: $('#bBg').value, ink: $('#bInk').value, accent: $('#bAcc').value,
        fig: { art, T: JSON.parse(JSON.stringify(T)), bb: alphaBox(cv) }, src: 'build',
      }, placementFor(title));
      addCover(n);
      out.push(n);
    }
    return out;
  }
  $('#newForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    const btn = $('#newOk');
    btn.disabled = true;
    const made = [];
    try {
      if (newTab === 'build') {
        made.push(...(await buildCovers()));
      } else if (newTab === 'figma') {
        const token = $('#figToken').value.trim();
        const links = $('#figLinks').value.split(/\s+/).filter((l) => /figma\.com/.test(l));
        if (!token) throw new Error('Upiši Figma token.');
        if (!links.length) throw new Error('Nalepi bar jedan link okvira iz Figme.');
        localStorage.setItem(TOKEN_KEY, token);
        for (let i = 0; i < links.length; i++) {
          status(`Uvozim ${i + 1} od ${links.length}…`);
          made.push(await importFigma(links[i], token));
        }
      } else {
        if (!pngFile) throw new Error('Izaberi sliku korice.');
        status('Pripremam sliku…');
        made.push(await importPng(pngFile));
      }
    } catch (err) {
      status((made.length ? `Uvezeno ${made.length}. ` : '') + err.message, true);
      btn.disabled = false;
      if (!made.length) return;
    }
    reapply(); save();
    $('#newModal').hidden = true;
    { const lastC = byId(made[made.length - 1].id); ui.group = lastC.other ? 't:' + (lastC.cat[0] || '') : 'p:' + lastC.name; ui.st = 'any'; }
    renderGroups(); renderGrid(); openEdit(made[made.length - 1].id);
    toast(made.length > 1 ? `Uvezeno ${made.length} dizajna kao skice.` : 'Dizajn je dodat kao skica. Proveri ga i objavi.');
  });

  /* ---------- pomeranje mišem i centriranje ---------- */
  const tryOpts = () => { const t = $('#tryTitle').value.trim(); return t ? { title: t } : {}; };
  function setAdjPart(c, key, patch) {
    const adj = clone(c.adj || {});
    adj[key] = Object.assign({}, adj[key] || {}, patch);
    ['x', 'y'].forEach((k) => { if (adj[key][k] != null) adj[key][k] = Math.round(adj[key][k]); });
    Object.keys(adj[key]).forEach((k) => adj[key][k] === undefined && delete adj[key][k]);
    if ((adj[key].s || 1) === 1 && !adj[key].x && !adj[key].y && !adj[key].hide) delete adj[key];
    return Object.keys(adj).length ? adj : undefined;
  }
  let drag = null;
  $('#preview').addEventListener('pointerdown', (e) => {
    const el = e.target.closest('[data-r]');
    const c = byId(ui.cur);
    if (!el || !c || !c.fig) return;
    const key = el.dataset.r;
    const a = (c.adj || {})[key] || {};
    const rect = $('#preview').getBoundingClientRect();
    snap();
    drag = { key, x0: e.clientX, y0: e.clientY, ax: a.x || 0, ay: a.y || 0, k: TTF.PW / rect.width, box: TTF.boxes(c, tryOpts())[key] };
    $('#preview').setPointerCapture(e.pointerId);
    $('#preview').classList.add('dragging');
    e.preventDefault();
  });
  $('#preview').addEventListener('pointermove', (e) => {
    if (!drag) return;
    const c = byId(ui.cur);
    let nx = drag.ax + (e.clientX - drag.x0) * drag.k;
    const ny = drag.ay + (e.clientY - drag.y0) * drag.k;
    const cx = (drag.box.x0 + drag.box.x1) / 2 + (nx - drag.ax);
    const snap = Math.abs(cx - TTF.PW / 2) < 14 * drag.k;
    if (snap) nx += TTF.PW / 2 - cx;
    c.adj = setAdjPart(c, drag.key, { x: nx, y: ny });
    renderPreview();
    $('#preview').classList.toggle('snap', snap);
  });
  const endDrag = () => {
    if (!drag) return;
    const c = byId(ui.cur);
    drag = null;
    $('#preview').classList.remove('dragging', 'snap');
    const o = Object.assign(draft.covers[ui.cur] || {}, { adj: c.adj });
    if (!o.adj) delete o.adj;
    draft.covers[ui.cur] = o;
    reapply(); save();
    renderSliders(byId(ui.cur));
    refreshCard(ui.cur);
  };
  $('#preview').addEventListener('pointerup', endDrag);
  $('#preview').addEventListener('pointercancel', endDrag);
  $('#centerAct').addEventListener('click', (e) => {
    const b = e.target.closest('[data-center]');
    const c = byId(ui.cur);
    if (!b || !c || !c.fig) return;
    const key = b.dataset.center;
    const box = TTF.boxes(c, tryOpts())[key];
    if (!box) return;
    const a = (c.adj || {})[key] || {};
    setOv(ui.cur, { adj: setAdjPart(c, key, { x: (a.x || 0) + TTF.PW / 2 - (box.x0 + box.x1) / 2 }) });
    fillEdit();
    refreshCard(ui.cur);
  });

  /* ---------- objava i fajlovi ---------- */
  $('#publishBtn').onclick = () => {
    const live = ALL.filter((c) => c.st === 'live').length;
    $('#pubText').textContent = `Na sajtu će biti ${live} korica, od toga ${TT.catalog.apply(draft).feat.length} u „Najpopularnije“. Izmena: ${changes()}.`;
    $('#pubModal').hidden = false;
  };
  $('#pubCancel').onclick = () => ($('#pubModal').hidden = true);
  $('#pubOk').onclick = () => {
    pub = clone(draft);
    try { localStorage.setItem(KEYS.pub, JSON.stringify(pub)); } catch (e) { toast('Objava nije uspela: nema mesta u pretraživaču.'); return; }
    $('#pubModal').hidden = true;
    renderStats();
    toast('Objavljeno. Osveži sajt da vidiš promene.');
  };
  const download = (name, text, type) => {
    const a = document.createElement('a');
    a.href = URL.createObjectURL(new Blob([text], { type }));
    a.download = name;
    a.click();
    setTimeout(() => URL.revokeObjectURL(a.href), 30000);
  };
  $('#menuBtn').onclick = () => { const l = $('#menuList'); l.hidden = !l.hidden; $('#menuBtn').setAttribute('aria-expanded', !l.hidden); };
  document.addEventListener('click', (e) => { if (!e.target.closest('.menu')) $('#menuList').hidden = true; });
  $('#menuList').addEventListener('click', (e) => {
    const b = e.target.closest('[data-act]');
    if (!b) return;
    $('#menuList').hidden = true;
    const act = b.dataset.act;
    if (act === 'config') (async () => {
      // nove korice nose i pun kvalitet (A4) u fajlu, da štampa kod kupca ne bude mutna
      const out = clone(pub);
      for (const n of out.added || []) {
        try {
          const blob = await catalog.idbGet(n.id);
          if (!blob) continue;
          const bmp = await createImageBitmap(blob), cv = document.createElement('canvas');
          cv.width = bmp.width; cv.height = bmp.height;
          cv.getContext('2d').drawImage(bmp, 0, 0);
          n.fig.master = cv.toDataURL('image/webp', 0.97);
        } catch (err) { /* ostaje slika za sajt */ }
      }
      download('covers-config.js', '/* Objavljena podešavanja korica iz admin panela. */\nwindow.TT_CATALOG = ' + JSON.stringify(out) + ';\n', 'text/javascript');
    })();
    if (act === 'export') download(`korice-rezerva-${new Date().toISOString().slice(0, 10)}.json`, JSON.stringify(draft), 'application/json');
    if (act === 'import') $('#importFile').click();
    if (act === 'discard') { snap(); draft = clone(pub); if (!draft.feat) draft.feat = catalog.DEF_FEAT.slice(); draft.added = draft.added || []; draft.covers = draft.covers || {}; reapply(); save(); renderAll(); toast('Vraćeno na objavljenu verziju.'); }
    if (act === 'logout') { sessionStorage.removeItem('tt-admin-ok'); location.reload(); }
  });
  $('#importFile').addEventListener('change', async (e) => {
    const f = e.target.files[0];
    if (!f) return;
    try {
      const d = JSON.parse(await f.text());
      if (!d || typeof d.covers !== 'object') throw new Error('format');
      snap();
      draft = Object.assign(empty(), d, { ver: catalog.VER });
      reapply(); save(); renderAll();
      toast('Rezervna kopija je učitana (još nije objavljena).');
    } catch (err) { toast('Ovaj fajl nije rezervna kopija korica.'); }
    e.target.value = '';
  });

  function renderAll() {
    renderStats();
    renderGroups();
    renderGrid();
    if (ui.cur && byId(ui.cur)) fillEdit(); else { ui.cur = null; $('#edit').hidden = true; }
    renderBulk();
  }
  function start() {
    const opts = (arr) => arr.map(([k, t]) => `<option value="${k}">${t}</option>`).join('');
    $('#eCont').innerHTML = $('#nCont').innerHTML = opts(CONTS);
    $('#eCat').innerHTML = $('#nCat').innerHTML = opts(CATS);
    $('#placeList').innerHTML = [...new Set(ALL.filter((c) => !c.other).map((c) => c.name))].sort((a, b) => a.localeCompare(b, 'sr')).map((n) => `<option value="${esc(n)}">`).join('');
    reapply();
    renderAll();
    renderUndo();
  }
  window.addEventListener('beforeunload', () => { try { localStorage.setItem(KEYS.draft, JSON.stringify(draft)); } catch (e) { /* ignore */ } });
  gate();
})();
