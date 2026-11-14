/* Katalog korica: šta je objavljeno, "Najpopularnije", podešavanja i novi dizajni – sve se uređuje u admin.html.
   Sajt čita objavljenu verziju (localStorage "tt-catalog-pub" ili fajl covers-config.js), admin radi na nacrtu.
   Status korice: live (na sajtu) | draft (skica, nije na sajtu) | del (obrisana; vidi se samo u adminu pod "Obrisano"). */
(function () {
  const TT = window.TT;
  const VER = (window.TT_DATA || {}).ver || '';
  const BASE = TT.COVERS.slice();
  const KEYS = { pub: 'tt-catalog-pub', draft: 'tt-catalog-draft' };
  // podešavanja napravljena za neki stariji skup korica se ne primenjuju
  const valid = (cfg) => (cfg && cfg.ver === VER ? cfg : null);
  const read = (k) => { try { return valid(JSON.parse(localStorage.getItem(k) || 'null')); } catch (e) { return null; } };
  const FIELDS = ['name', 'country', 'cont', 'other', 'cat', 'adj', 'st', 'txt'];
  BASE.forEach((c) => {
    c.st = c.top ? 'live' : 'draft';
    c._def = {};
    FIELDS.forEach((f) => (c._def[f] = c[f] === undefined ? undefined : JSON.parse(JSON.stringify(c[f]))));
  });
  const DEF_FEAT = BASE.filter((c) => c.feat != null).sort((a, b) => a.feat - b.feat).map((c) => c.id);

  function newCover(n) {
    return Object.assign({ isNew: true, top: 1, cat: [], sub: '', year: '', aka: '' }, n, {
      fig: Object.assign({ T: [] }, n.fig),
      aka: `${n.title || ''} ${n.name || ''} ${n.country || ''}`.toLowerCase(),
    });
  }
  const copy = (v) => (v === undefined ? undefined : JSON.parse(JSON.stringify(v)));
  // primeni konfiguraciju na korice; vraća sve korice (sa statusom)
  function apply(cfg) {
    cfg = cfg || {};
    const ov = cfg.covers || {};
    BASE.forEach((c) => {
      FIELDS.forEach((f) => { if (c._def[f] === undefined) delete c[f]; else c[f] = copy(c._def[f]); });
      const o = ov[c.id];
      if (o) FIELDS.forEach((f) => { if (o[f] !== undefined) c[f] = copy(o[f]); });
    });
    const added = (cfg.added || []).map((n) => {
      const c = newCover(n);
      const o = ov[c.id];
      if (o) FIELDS.forEach((f) => { if (o[f] !== undefined) c[f] = copy(o[f]); });
      return c;
    });
    // nove korice idu odmah iza svoje grupe; "gone" = trajno uklonjene iz admina (ispražnjena korpa)
    const gone = new Set(cfg.gone || []);
    const all = BASE.filter((c) => !gone.has(c.id));
    added.forEach((n) => {
      let at = -1;
      all.forEach((c, i) => { if (c.name === n.name && !!c.other === !!n.other) at = i; });
      if (at < 0) all.push(n); else all.splice(at + 1, 0, n);
    });
    // podrazumevani tekst (naslov/podnaslov/godina) koji je admin promenio
    all.forEach((c) => {
      const t = c.txt || {};
      if (!c._orig) c._orig = { title: c.title, sub: c.sub, year: c.year };
      c.title = t.t != null ? t.t : c._orig.title;
      c.sub = t.s != null ? t.s : c._orig.sub;
      c.year = t.y != null ? t.y : c._orig.year;
    });
    const feat = (cfg.feat || DEF_FEAT).filter((id) => all.some((c) => c.id === id && c.st === 'live'));
    all.forEach((c) => { c.featIdx = feat.indexOf(c.id); });
    return { all, feat };
  }

  const isAdmin = /admin\.html$/.test(location.pathname);
  const cfg = isAdmin ? read(KEYS.draft) || read(KEYS.pub) || valid(window.TT_CATALOG) : read(KEYS.pub) || valid(window.TT_CATALOG);
  const res = apply(cfg);
  TT.ALL = res.all;
  TT.FEAT = res.feat;
  if (!isAdmin) {
    // sajt vidi samo objavljene korice
    TT.COVERS.length = 0;
    res.all.filter((c) => c.st === 'live').forEach((c) => { c.top = 1; TT.COVERS.push(c); });
  }

  /* Pun kvalitet novih dizajna čuva se u IndexedDB (u pravoj verziji: na serveru). */
  const idb = () => new Promise((ok, bad) => {
    const r = indexedDB.open('tt-admin', 1);
    r.onupgradeneeded = () => r.result.createObjectStore('masters');
    r.onsuccess = () => ok(r.result);
    r.onerror = () => bad(r.error);
  });
  const idbPut = async (k, v) => { const db = await idb(); return new Promise((ok, bad) => { const tx = db.transaction('masters', 'readwrite'); tx.objectStore('masters').put(v, k); tx.oncomplete = ok; tx.onerror = () => bad(tx.error); }); };
  const idbGet = async (k) => { const db = await idb(); return new Promise((ok, bad) => { const q = db.transaction('masters').objectStore('masters').get(k); q.onsuccess = () => ok(q.result); q.onerror = () => bad(q.error); }); };
  window.TTMaster = async (c) => {
    if (c.isNew) { const b = await idbGet(c.id).catch(() => null); if (b) return URL.createObjectURL(b); }
    return c.fig.master || c.fig.art;
  };
  TT.catalog = { apply, KEYS, read, valid, VER, BASE, DEF_FEAT, FIELDS, idbPut, idbGet };
})();
