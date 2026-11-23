/* Korice sa fotografijom kupca (kategorija "Drugo"): raspored iz Figme, kupac obavezno ubacuje svoju fotografiju
   i može da promeni svaki tekst; font, veličina i boja ostaju kao u dizajnu (predug tekst se samo smanji da stane).
   Na sajtu se nikad ne prikazuju prave fotografije iz dizajna: dok kupac ne ubaci svoju, stoji prazno mesto.
   Koordinate su A4 na 300 dpi (2480 x 3508), isto kao okviri u Figmi. */
(function () {
  const TT = window.TT, PW = 2480, PH = 3508;
  if (!TT) return;
  const FONT = { serif: "Tinos, 'Times New Roman', Times, serif", play: "'Playfair Display', Georgia, serif", coop: "Fraunces, 'Cooper Black', Georgia, serif" };
  const l = document.createElement('link');
  l.rel = 'stylesheet';
  l.href = 'https://fonts.googleapis.com/css2?family=Tinos&family=Playfair+Display&family=Fraunces:opsz,wght,SOFT,WONK@144,900,100,0&display=swap';
  document.head.appendChild(l);

  /* t: tekstovi { k, label, s: podrazumevano, f: font, z: veličina, ls: razmak slova (px), x, y: osnovna linija, a: start|middle|end, c: boja, w: najveća širina }
     p: mesta za fotografije [x, y, w, h]; d: linije [x1, y1, x2, y2, debljina, boja] */
  const LIST = [
    {
      id: 'ph18', name: '18. rođendan', title: '18 BIRTHDAY', cat: ['rodj'], bg: '#ff7ea3', ink: '#ffffff', accent: '#ffffff',
      aka: 'rodjendan birthday 18 punoletstvo memories slika fotografija',
      p: [[167, 1331, 2145, 1418]],
      t: [
        { k: 'a', label: 'Gornji red', s: '18 BIRTH', f: 'serif', z: 580, ls: -34.8, x: 1240, y: 624, a: 'middle', c: '#ffffff', w: 2340 },
        { k: 'b', label: 'Drugi red', s: 'DAY', f: 'serif', z: 580, ls: -34.8, x: 1766, y: 1124, a: 'middle', c: '#ffffff', w: 1260 },
        { k: 'c', label: 'Donji tekst', s: 'MEMORIES', f: 'serif', z: 480, ls: -28.8, x: 1240, y: 3314, a: 'middle', c: '#ffffff', w: 2340 },
      ],
    },
    {
      id: 'phone', name: 'Prvi rođendan', title: 'one', cat: ['rodj', 'deca'], bg: '#fffddd', ink: '#111111', accent: '#111111',
      aka: 'prvi rodjendan first birthday one beba deca book of memories slika fotografija',
      p: [[366, 384, 1747, 2202]],
      t: [
        { k: 'a', label: 'Tekst na slici', s: 'one', f: 'coop', z: 800, ls: 56, x: 1240, y: 2511, a: 'middle', c: '#ffffff', w: 1700 },
        { k: 'b', label: 'Tekst ispod', s: 'A Book of Memories', f: 'play', z: 193, ls: 0, x: 1240, y: 3067, a: 'middle', c: '#000000', w: 2160 },
        { k: 'c', label: 'Datum', s: '22.09.2025.', f: 'play', z: 150, ls: 0, x: 1240, y: 3190, a: 'middle', c: '#000000', w: 2160 },
      ],
    },
    {
      id: 'phfam9', name: 'Porodične uspomene', title: '2026 family memories', cat: ['porod', 'usp'], bg: '#ffffff', ink: '#111111', accent: '#111111',
      aka: 'porodica family memories uspomene godina 2026 kolaz slike fotografije',
      p: [0, 1, 2].flatMap((r) => [0, 1, 2].map((k) => [199 + k * 716, [1020, 1736, 2437][r], 649, r ? 634 : 649])),
      t: [
        { k: 'a', label: 'Gornji tekst', s: '2026', f: 'play', z: 600, ls: -30, x: 1240, y: 623, a: 'middle', c: '#000000', w: 2160 },
        { k: 'b', label: 'Tekst ispod', s: 'family memories', f: 'play', z: 250, ls: -12.5, x: 1240, y: 845, a: 'middle', c: '#000000', w: 2160 },
      ],
    },
    {
      id: 'pharhiva', name: 'Arhiva ljubavi', title: 'Arhiva ljubavi', cat: ['ljub'], bg: '#ffffff', ink: '#111111', accent: '#111111',
      aka: 'arhiva ljubavi ljubav love par 365 dana slika fotografija',
      p: [[222, 859, 2031, 1254]],
      t: [
        { k: 'a', label: 'Naslov', s: 'Arhiva ljubavi', f: 'serif', z: 205, ls: -2, x: 224, y: 714, a: 'start', c: '#000000', w: 2030 },
        { k: 'b', label: 'Levo dole', s: '365 dana', f: 'serif', z: 160, ls: -1.5, x: 1268, y: 2885, a: 'end', c: '#000000', w: 1080 },
        { k: 'c', label: 'Desno dole', s: '1 deo', f: 'serif', z: 160, ls: -1.5, x: 1424, y: 2885, a: 'start', c: '#000000', w: 1080 },
      ],
      d: [[1341, 2630, 1341, 3025, 7, '#000000']],
    },
  ];

  const esc = (s) => String(s).replace(/[&<>"]/g, (m) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[m]));
  const r1 = (n) => Math.round(n * 10) / 10;
  const mctx = document.createElement('canvas').getContext('2d');
  const fontOf = (t, z) => `${t.f === 'coop' ? 900 : 400} ${z}px ${FONT[t.f]}`;
  function measure(t, s, z) {
    mctx.font = fontOf(t, z);
    mctx.letterSpacing = `${(t.ls * z) / t.z}px`;
    return mctx.measureText(s).width;
  }
  // tekst kupca (prazno polje = bez teksta); predugačak se smanji da stane u širinu dizajna
  function layout(c, txt) {
    return c.t.map((t) => {
      const v = txt && txt[t.k] != null ? txt[t.k] : t.s;
      const s = String(v).replace(/\s+/g, ' ').trim();
      if (!s) return null;
      let z = t.z;
      const w = measure(t, s, z);
      if (w > t.w) z = (z * t.w) / w;
      return { t, s, z, x: t.x, y: t.y };
    }).filter(Boolean);
  }
  // prazno mesto za fotografiju (bez ikakve prave slike)
  function holder(x, y, w, h) {
    const m = Math.min(w, h), ic = m * 0.22, cx = x + w / 2, cy = y + h / 2 - m * 0.06;
    const fs = Math.max(34, Math.min(110, m * 0.085));
    return `<rect x="${x}" y="${y}" width="${w}" height="${h}" fill="#e9e6e1"/>`
      + `<g transform="translate(${r1(cx - ic / 2)} ${r1(cy - ic / 2)}) scale(${r1(ic / 24)})" fill="none" stroke="#a9a49b" stroke-width="1.6" stroke-linejoin="round" stroke-linecap="round"><rect x="2" y="4" width="20" height="16" rx="2.5"/><circle cx="8.5" cy="9.5" r="1.8"/><path d="m3 18 5.5-5.5 4 4 3-3L21 18"/></g>`
      + (m < 900 ? '' : `<text x="${r1(cx)}" y="${r1(cy + ic / 2 + fs * 1.5)}" text-anchor="middle" font-family="Raleway, Arial, sans-serif" font-weight="700" font-size="${r1(fs)}" fill="#8f897f">Tvoja fotografija</text>`);
  }
  /* o.pt = { txt: { k: tekst }, ph: [{ thumb }] } – izmene kupca; bez toga se vide podrazumevani tekst i prazna mesta */
  function svg(c, o = {}) {
    const pt = o.pt || {}, ph = pt.ph || [];
    let out = `<rect width="${PW}" height="${PH}" fill="${c.bg}"/>`;
    c.p.forEach(([x, y, w, h], i) => {
      const p = ph[i];
      out += p && p.thumb ? `<image href="${p.thumb}" x="${x}" y="${y}" width="${w}" height="${h}" preserveAspectRatio="xMidYMid slice"/>` : holder(x, y, w, h);
    });
    (c.d || []).forEach(([x1, y1, x2, y2, sw, col]) => { out += `<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke="${col}" stroke-width="${sw}"/>`; });
    layout(c, pt.txt).forEach((p) => {
      out += `<text x="${r1(p.x)}" y="${r1(p.y)}" text-anchor="${p.t.a}" font-family="${esc(FONT[p.t.f])}" font-weight="${p.t.f === 'coop' ? 900 : 400}" font-size="${r1(p.z)}" letter-spacing="${r1((p.t.ls * p.z) / p.t.z)}" fill="${p.t.c}" style="white-space:pre">${esc(p.s)}</text>`;
    });
    return `<svg class="cover-svg" viewBox="0 0 ${PW} ${PH}" preserveAspectRatio="xMidYMid slice" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="${esc(c.name)}">${out}</svg>`;
  }
  /* Fajl za štampu: A4 300 dpi, fotografije kupca u punoj rezoluciji (isečene na sredini kao u pregledu). */
  async function print(c, pt, decode) {
    const ops = layout(c, pt.txt);
    await Promise.all([...new Set(ops.map((p) => fontOf(p.t, 100)))].map((f) => document.fonts.load(f)));
    const cv = document.createElement('canvas');
    cv.width = PW; cv.height = PH;
    const g = cv.getContext('2d');
    g.fillStyle = c.bg;
    g.fillRect(0, 0, PW, PH);
    g.imageSmoothingEnabled = true;
    g.imageSmoothingQuality = 'high';
    for (let i = 0; i < c.p.length; i++) {
      const [x, y, w, h] = c.p[i], p = (pt.ph || [])[i];
      if (!p) continue;
      const bmp = await decode(p);
      const r = Math.max(w / bmp.width, h / bmp.height), sw = w / r, sh = h / r;
      g.drawImage(bmp.src, (bmp.width - sw) / 2, (bmp.height - sh) / 2, sw, sh, x, y, w, h);
      if (bmp.close) bmp.close();
    }
    (c.d || []).forEach(([x1, y1, x2, y2, sw, col]) => { g.strokeStyle = col; g.lineWidth = sw; g.beginPath(); g.moveTo(x1, y1); g.lineTo(x2, y2); g.stroke(); });
    ops.forEach((p) => {
      g.font = fontOf(p.t, p.z);
      g.letterSpacing = `${(p.t.ls * p.z) / p.t.z}px`;
      g.textAlign = p.t.a === 'middle' ? 'center' : p.t.a === 'end' ? 'right' : 'left';
      g.textBaseline = 'alphabetic';
      g.fillStyle = p.t.c;
      g.fillText(p.s, p.x, p.y);
    });
    g.letterSpacing = '0px';
    return cv;
  }

  LIST.forEach((c) => {
    Object.assign(c, { photo: true, other: true, top: 1, sub: '', year: '', font: 'soft' });
  });
  // novi dizajni sa fotografijom idu na početak "Drugo"
  TT.COVERS.unshift(...LIST);
  const prev = TT.coverSVG;
  TT.coverSVG = (c, o) => (c && c.photo ? svg(c, o) : prev(c, o));
  window.TTP = { svg, print, layout, LIST };
})();
