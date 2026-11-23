/* Korice iz Figme: ilustracija (bez teksta) + tekst istim fontom, veličinom, razmakom i bojom kao u Figmi.
   Koordinate su u pikselima A4 na 300 dpi (2480 x 3508), isto kao okviri u Figmi.
   Isti raspored (ops) crta i prikaz na sajtu (SVG) i fajl za štampu (canvas).
   c.adj (iz admina): { t|s|y|a: { s: razmera, x, y: pomeraj u px }, mg: najmanji razmak naslova od ivica } */
(function () {
  const PW = 2480, PH = 3508;
  const met = (fam) => (window.TT_FONT_METRICS || {})[fam || 'Raleway'] || [0.94, 1.174];
  const CAP = 0.71;
  const esc = (s) => String(s).replace(/[&<>"]/g, (m) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[m]));
  const mctx = document.createElement('canvas').getContext('2d');
  const r1 = (n) => Math.round(n * 10) / 10;
  const norm = (s) => String(s || '').toLocaleLowerCase('sr').replace(/\s+/g, ' ').trim();
  const isCaps = (s) => /\p{L}/u.test(s) && s === s.toLocaleUpperCase('sr');
  const famCss = (t) => (t.f ? `'${t.f}'` : 'Raleway');
  const fontCss = (t, z) => `${t.it ? 'italic ' : ''}${t.wt} ${z}px ${famCss(t)}`;
  const LINES = /[\n\u2028]/;
  function width(t, text, z) {
    mctx.font = fontCss(t, z);
    mctx.letterSpacing = `${(t.ls * z) / t.z}px`;
    return mctx.measureText(text).width;
  }
  const shown = (t, s) => (t.up ? s.toLocaleUpperCase('sr') : s);
  const lineH = (t) => t.lh || met(t.f)[1] * t.z;
  function baseline(t) {
    const [a, l] = met(t.f);
    return t.y + (lineH(t) - l * t.z) / 2 + a * t.z;
  }
  const adjOf = (c, k) => Object.assign({ s: 1, x: 0, y: 0 }, (c.adj || {})[k] || {});

  /* Standardni raspored: naslov uvek tačno na sredini, vrh slova uvek isto udaljen od gornje ivice,
     i uvek bar SIDE od bočnih ivica (širi naslov se malo smanji). Podnaslov i godina pored naslova idu zajedno s njim.
     Ne važi za korice gde je naslov namerno niže (vrh slova ispod LOW) i kada admin uključi "slobodan položaj" (adj.free). */
  const STD = { top: 210, side: 120, low: 450 };
  const ZMAX = 900;
  const stdCache = new WeakMap();
  function stdT(c) {
    const T = c.fig.T, free = !!(c.adj && c.adj.free);
    const hit = stdCache.get(c);
    if (hit && hit.T === T && hit.free === free) return hit.out;
    let out = T;
    const titles = T.filter((t) => t.r === 't');
    if (!free && titles.length) {
      const x0 = Math.min(...titles.map((t) => t.x)), x1 = Math.max(...titles.map((t) => t.x + t.w));
      const yTop = Math.min(...titles.map((t) => t.y)), yBot = Math.max(...titles.map((t) => t.y + t.h));
      const cap = Math.min(...titles.map((t) => baseline(t) - t.z * CAP));
      if (cap < STD.low) {
        const k = Math.min(1, (PW - 2 * STD.side) / (x1 - x0));
        const cx = (x0 + x1) / 2;
        // novi vrh okvira tako da vrh slova bude na STD.top
        const ny = (y) => STD.top + (y - cap) * k;
        const near = (t) => t.r === 't' || (t.y + t.h > yTop - 450 && t.y < yBot + 650);
        out = T.map((t) => {
          if (!near(t)) return t;
          const n = Object.assign({}, t);
          n.x = PW / 2 + (t.x - cx) * k;
          n.w = t.w * k; n.h = t.h * k; n.z = t.z * k; n.ls = t.ls * k;
          if (t.lh) n.lh = t.lh * k;
          // y se računa preko osnovne linije da bi vrh slova tačno pao na mesto
          n.y = ny(t.y);
          return n;
        });
      }
    }
    stdCache.set(c, { T, free, out });
    return out;
  }
  // podrazumevani tekst iz admina (c.txt) kada kupac nije ništa upisao
  function withText(c, o) {
    const d = c.txt || {}, r = Object.assign({}, o);
    if (r.title == null && d.t != null) r.title = d.t;
    if (r.sub == null && d.s != null) r.sub = d.s;
    if (r.year == null && d.y != null) r.year = d.y;
    return r;
  }
  const hidden = (c, k) => !!((c.adj || {})[k] || {}).hide;

  /* o: { title, sub, year, ink, accent } – izmene kupca; prazno = original iz Figme */
  function layout(c, o = {}) {
    o = withText(c, o);
    const ops = [];
    const add = (t, s, x, y, z, anchor, fill) => { if (!hidden(c, t.r)) ops.push({ t, s, x, y, z, anchor, fill }); };
    const T = stdT(c);
    const titles = T.filter((t) => t.r === 't');
    // podnaslov je uvek podebljan isto kao naslov kada je istim fontom (Raleway); ukrasni fontovi ostaju kao u dizajnu
    const sameFam = (a, b) => (a.f || 'Raleway') === (b.f || 'Raleway');
    const subs = T.filter((t) => t.r === 's').map((t) => (titles.length && sameFam(t, titles[0]) && t.wt < titles[0].wt ? Object.assign({}, t, { wt: titles[0].wt }) : t));
    const year = T.find((t) => t.r === 'y');
    const origTitle = titles.map((t) => t.s.replace(/\s+/g, ' ').trim()).join(' ');
    const A = adjOf(c, 't');
    // originalni tekst; k = razmera oko sredine okvira, dx/dy = pomeraj
    const original = (t, fill, dx, dy, k) => {
      const lh = lineH(t) * k;
      const lines = shown(t, t.s).split(LINES);
      if (k === 1) {
        const anchor = t.a === 'C' ? 'middle' : t.a === 'R' ? 'end' : 'start';
        const x = (t.a === 'C' ? t.x + t.w / 2 : t.a === 'R' ? t.x + t.w : t.x) + dx;
        lines.forEach((ln, i) => add(t, ln, x, baseline(t) + i * lh + dy, t.z, anchor, fill));
      } else {
        lines.forEach((ln, i) => add(t, ln, t.x + t.w / 2 + dx, t.y + (baseline(t) - t.y) * k + i * lh + dy, t.z * k, 'middle', fill));
      }
      return { right: t.x + t.w / 2 + dx + (t.w * k) / 2, base: t.y + (baseline(t) - t.y) * k + (lines.length - 1) * lh + dy };
    };
    let dRight = 0, dY = 0, tRight = 0, tBase = null;
    const custom = o.title != null && norm(o.title) !== norm(origTitle);
    if (titles.length) tRight = Math.max(...titles.map((t) => t.x + t.w));
    const last = titles[titles.length - 1];
    if (titles.length && !custom) {
      let right = 0, base = 0;
      titles.forEach((t) => { const r = original(t, o.ink || t.c, A.x, A.y, A.s); right = Math.max(right, r.right); base = r.base; });
      dRight = right - tRight;
      tBase = base;
      dY = base - (baseline(last) + (lineH(last) * (shown(last, last.s).split(LINES).length - 1)));
    } else if (titles.length) {
      const t0 = titles[0];
      let s = String(o.title).trim() || ' ';
      if (t0.up || isCaps(titles.map((t) => t.s).join(''))) s = s.toLocaleUpperCase('sr');
      // kupčev naslov (ili podrazumevan iz admina) uvek ima "normalnu" veličinu kao ostale korice: puni širinu strane do ZMAX, a predugačak se smanji da stane
      const side = c.adj && c.adj.free ? Math.min(400, Math.min(t0.x, PW - t0.x - t0.w)) : STD.side;
      const margin = Math.max((c.adj && c.adj.mg) || 0, 50, side);
      const maxW = PW - 2 * margin;
      const fit = (maxW / width(t0, s, 1000)) * 1000;
      let z = Math.min(ZMAX, fit) * A.s, w = width(t0, s, z);
      if (w > maxW) { z = (z * maxW) / w; w = maxW; }
      const centered = Math.abs(t0.x + t0.w / 2 - PW / 2) < 160 || t0.a === 'C';
      const x0 = centered ? PW / 2 - w / 2 : t0.a === 'R' ? t0.x + t0.w - w : t0.x;
      const x = Math.max(margin, Math.min(x0, PW - margin - w)) + A.x;
      const bNew = baseline(t0) - (t0.z - z) * CAP + A.y;
      add(t0, s, x, bNew, z, 'start', o.ink || t0.c);
      dRight = x + w - tRight;
      tBase = bNew;
      dY = bNew - baseline(last);
    }
    const follow = (t) => titles.length && t.y > titles[0].y && Math.abs(t.x + t.w - tRight) < 420;
    const place = (t, val, fill, key) => {
      const a = adjOf(c, key);
      const mx = (follow(t) ? dRight : 0) + a.x;
      const my = (titles.length && t.y > titles[0].y ? dY : 0) + a.y;
      const rightAnchored = t.x + t.w / 2 > PW / 2;
      const isNew = val != null && norm(val) !== norm(t.s);
      if (!isNew) {
        if (a.s === 1) { original(t, fill, mx, my, 1); return; }
        const z = t.z * a.s, b = t.y + (baseline(t) - t.y) * a.s + my;
        shown(t, t.s).split(LINES).forEach((ln, i) => add(t, ln, rightAnchored ? t.x + t.w + mx : t.x + mx, b + i * lineH(t) * a.s, z, rightAnchored ? 'end' : 'start', fill));
        return;
      }
      let s = String(val).trim();
      if (!s) return;
      if (t.up || isCaps(t.s)) s = s.toLocaleUpperCase('sr');
      const right = t.x + t.w + mx;
      let z = t.z * a.s, w = width(t, s, z);
      const room = rightAnchored ? right - 60 : PW - 60 - t.x - mx;
      if (w > room) { z = (z * room) / w; w = room; }
      const x = rightAnchored ? right - w : t.x + mx;
      add(t, s, x, t.y + (baseline(t) - t.y) * (z / t.z) + my, z, 'start', fill);
    };
    subs.forEach((t, i) => place(t, i === 0 ? o.sub : null, o.accent || t.c, 's'));
    if (year) place(year, o.year, o.accent || year.c, 'y');
    // korica nema podnaslov u dizajnu: kupac ga ipak može dodati (sa strane, u redu sa godinom, kao inače); dok ništa ne upiše, ne crta se ništa
    const addSub = String(o.sub == null ? '' : o.sub).trim();
    if (!subs.length && titles.length && addSub && tBase != null && !hidden(c, 's')) {
      const t0 = titles[0], a = adjOf(c, 's');
      const z0 = Math.max(130, Math.min(250, t0.z * 0.28)) * a.s;
      const caps = !!t0.up || isCaps(titles.map((t) => t.s).join(''));
      const pt = { r: 's', s: addSub, x: 0, y: 0, w: PW, h: z0, wt: t0.wt || 800, z: z0, ls: -0.03 * z0, lh: 0, c: o.accent || (year && year.c) || o.ink || t0.c, a: 'R', up: caps ? 1 : 0 };
      if (t0.f) pt.f = t0.f;
      const txt = caps ? addSub.toLocaleUpperCase('sr') : addSub;
      const yo = ops.find((p) => p.t.r === 'y');
      let right, base;
      if (yo) {
        const yw = width(yo.t, yo.s, yo.z);
        const yl = yo.anchor === 'end' ? yo.x - yw : yo.anchor === 'middle' ? yo.x - yw / 2 : yo.x;
        right = yl - z0 * 0.35; base = yo.y;
      } else { right = tRight + dRight; base = tBase + z0 * 1.3; }
      right = Math.min(right, PW - STD.side);
      let z = z0, w = width(pt, txt, z);
      const room = right - STD.side;
      if (w > room) z = (z * room) / w;
      add(pt, txt, right + a.x, base + a.y, z, 'end', pt.c);
    }
    return ops;
  }
  const svgText = (ops) => ops.map((p) => `<text data-r="${p.t.r}" x="${r1(p.x)}" y="${r1(p.y)}" text-anchor="${p.anchor}" font-family="${esc(famCss(p.t))}" font-weight="${p.t.wt}"${p.t.it ? ' font-style="italic"' : ''} font-size="${r1(p.z)}" letter-spacing="${r1((p.t.ls * p.z) / p.t.z)}" fill="${p.fill}"${p.t.o ? ` fill-opacity="${p.t.o}"` : ''} style="white-space:pre">${esc(p.s)}</text>`).join('');

  const bgOf = (c, o) => (c.fig.fx || c.fig.lock ? c.bg : o.bg || c.bg);
  const artRect = (c) => {
    const a = adjOf(c, 'a');
    const w = PW * a.s, h = PH * a.s;
    return { x: (PW - w) / 2 + a.x, y: (PH - h) / 2 + a.y, w, h, a };
  };
  function figmaSVG(c, o = {}) {
    const r = artRect(c);
    return `<svg class="cover-svg" viewBox="0 0 ${PW} ${PH}" preserveAspectRatio="xMidYMid slice" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="${esc(o.title || c.title || c.name)}"><rect width="${PW}" height="${PH}" fill="${bgOf(c, o)}"/><image data-r="a" href="${c.fig.art}" x="${r1(r.x)}" y="${r1(r.y)}" width="${r1(r.w)}" height="${r1(r.h)}"/>${svgText(layout(c, o))}</svg>`;
  }
  // za mrežu korica: slika se učitava tek kad dođe na ekran
  function figmaCard(c, o = {}) {
    const a = adjOf(c, 'a');
    const tf = a.s !== 1 || a.x || a.y ? ` style="transform:translate(${r1((a.x / PW) * 100)}%,${r1((a.y / PH) * 100)}%) scale(${a.s})"` : '';
    return `<span class="fg" style="background:${bgOf(c, o)}"><img src="${c.fig.art}" alt="" loading="lazy" decoding="async"${tf}><svg viewBox="0 0 ${PW} ${PH}" preserveAspectRatio="xMidYMid slice" aria-hidden="true">${svgText(layout(c, o))}</svg></span>`;
  }

  /* Fajl za štampu: A4 na 300 dpi, ilustracija u punoj rezoluciji + tekst kupca istim fontom. */
  const loadImg = (src) => new Promise((ok, bad) => { const i = new Image(); i.onload = () => ok(i); i.onerror = bad; i.src = src; });
  async function printCanvas(c, o = {}) {
    const ops = layout(c, o);
    await Promise.all([...new Set(ops.map((p) => fontCss(p.t, 100)))].map((f) => document.fonts.load(f)));
    const cv = document.createElement('canvas');
    cv.width = PW; cv.height = PH;
    const g = cv.getContext('2d');
    g.fillStyle = bgOf(c, o);
    g.fillRect(0, 0, PW, PH);
    const src = window.TTMaster ? await window.TTMaster(c) : c.fig.master || c.fig.art;
    const r = artRect(c);
    g.drawImage(await loadImg(src), r.x, r.y, r.w, r.h);
    ops.forEach((p) => {
      g.font = fontCss(p.t, p.z);
      g.letterSpacing = `${(p.t.ls * p.z) / p.t.z}px`;
      g.textAlign = p.anchor === 'middle' ? 'center' : p.anchor === 'end' ? 'right' : 'left';
      g.textBaseline = 'alphabetic';
      g.fillStyle = p.fill;
      g.globalAlpha = p.t.o || 1;
      g.fillText(p.s, p.x, p.y);
      g.globalAlpha = 1;
    });
    return cv;
  }
  // okvir svakog dela (naslov/podnaslov/godina/ilustracija) u koordinatama korice
  function boxes(c, o = {}) {
    const out = {};
    layout(c, o).forEach((p) => {
      const w = width(p.t, p.s, p.z);
      const x0 = p.anchor === 'middle' ? p.x - w / 2 : p.anchor === 'end' ? p.x - w : p.x;
      const b = out[p.t.r] || { x0: Infinity, x1: -Infinity, y0: Infinity, y1: -Infinity };
      b.x0 = Math.min(b.x0, x0); b.x1 = Math.max(b.x1, x0 + w);
      b.y0 = Math.min(b.y0, p.y - p.z * CAP); b.y1 = Math.max(b.y1, p.y);
      out[p.t.r] = b;
    });
    const r = artRect(c), bb = c.fig.bb || [0, 0, PW, PH], k = r.w / PW;
    out.a = { x0: r.x + bb[0] * k, x1: r.x + bb[2] * k, y0: r.y + bb[1] * k, y1: r.y + bb[3] * k };
    return out;
  }
  window.TTF = { figmaSVG, figmaCard, layout, printCanvas, loadImg, boxes, stdT, STD, PW, PH };
})();
