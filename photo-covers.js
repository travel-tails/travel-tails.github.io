/* Korice sa fotografijom kupca (kategorija "Drugo"): raspored iz Figme, kupac obavezno ubacuje svoju fotografiju
   i može da promeni svaki tekst; font, veličina i boja ostaju kao u dizajnu (predug tekst se samo smanji da stane).
   Na sajtu se nikad ne prikazuju prave fotografije iz dizajna: dok kupac ne ubaci svoju, stoji prazno mesto.
   Koordinate su A4 na 300 dpi (2480 x 3508), isto kao okviri u Figmi. */
(function () {
  const TT = window.TT, PW = 2480, PH = 3508;
  if (!TT) return;
  const FONT = {
    serif: "Tinos, 'Times New Roman', Times, serif", play: "'Playfair Display', Georgia, serif", coop: "Fraunces, 'Cooper Black', Georgia, serif",
    rubik: "'Rubik One', 'Arial Black', sans-serif", rozha: "'Rozha One', Georgia, serif", sans: "Raleway, 'Helvetica Neue', Arial, sans-serif",
  };
  const l = document.createElement('link');
  l.rel = 'stylesheet';
  l.href = 'https://fonts.googleapis.com/css2?family=Tinos:wght@400;700&family=Playfair+Display&family=Fraunces:opsz,wght,SOFT,WONK@144,900,100,0&family=Rubik+One&family=Rozha+One&family=Raleway:wght@300&display=swap';
  document.head.appendChild(l);

  /* gray: fotografija crno-bela kao u dizajnu; dark: tamnije prazno mesto (beli tekst preko fotografije)
     t: tekstovi { k, label, s: podrazumevano, f: font, wt: debljina, z: veličina, ls: razmak slova (px), x, y: osnovna linija, a: start|middle|end, c: boja, w: najveća širina }
     p: mesta za fotografije [x, y, w, h]; d: linije [x1, y1, x2, y2, debljina, boja] */
  const LIST = [
    {
      id: 'phbday', name: 'Birthday book', title: 'BIRTHDAY book', cat: ['rodj'], bg: '#3a3633', ink: '#ffffff', accent: '#ffffff', dark: true,
      aka: 'rodjendan birthday book 18 punoletstvo edition slika fotografija',
      p: [[0, 0, 2480, 3508]],
      t: [
        { k: 'a', label: 'Naslov', s: 'BIRTHDAY', f: 'serif', z: 455, ls: 0, x: 1232, y: 490, a: 'middle', c: '#ffffff', w: 2300 },
        { k: 'b', label: 'Ispod naslova', s: 'book', f: 'sans', wt: 300, z: 174, ls: 0, x: 2238, y: 697, a: 'end', c: '#ffffff', w: 1400 },
        { k: 'c', label: 'Broj', s: '18', f: 'serif', z: 480, ls: 0, x: 2318, y: 2374, a: 'end', c: '#ffffff', w: 1200 },
        { k: 'd', label: 'Ispod broja, 1. red', s: 'BIRTHDAY', f: 'serif', z: 140, ls: 0, x: 2339, y: 2531, a: 'end', c: '#ffffff', w: 1500 },
        { k: 'e', label: 'Ispod broja, 2. red', s: 'EDITION', f: 'serif', z: 140, ls: 0, x: 2339, y: 2662, a: 'end', c: '#ffffff', w: 1500 },
        { k: 'f', label: 'Donji tekst', s: 'EIGHTEEN NEVER LOOKED SO GOOD.', f: 'serif', wt: 700, z: 114, ls: 0, x: 1258, y: 3274, a: 'middle', c: '#ffffff', w: 2200 },
      ],
    },
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
      id: 'phone', name: 'Prvi rođendan', title: 'one', cat: ['rodj', 'deca'], bg: '#fffddd', ink: '#111111', accent: '#111111', dark: true,
      aka: 'prvi rodjendan first birthday one beba deca book of memories slika fotografija',
      p: [[366, 384, 1747, 2202]],
      t: [
        { k: 'a', label: 'Tekst na slici', s: 'one', f: 'coop', z: 800, ls: 56, x: 1240, y: 2511, a: 'middle', c: '#ffffff', w: 1700 },
        { k: 'b', label: 'Tekst ispod', s: 'A Book of Memories', f: 'play', z: 193, ls: 0, x: 1240, y: 3067, a: 'middle', c: '#000000', w: 2160 },
        { k: 'c', label: 'Datum', s: '22.09.2025.', f: 'play', z: 150, ls: 0, x: 1240, y: 3190, a: 'middle', c: '#000000', w: 2160 },
      ],
    },
    {
      id: 'phmeyou', name: 'Me & You', title: 'ME & YOU', cat: ['ljub'], bg: '#ffc4e2', ink: '#b40a0c', accent: '#b40a0c', gray: true,
      aka: 'me and you ljubav love par mi slika fotografija',
      p: [[276, 1086, 1933, 1313]],
      t: [
        { k: 'a', label: 'Naslov', s: 'ME & YOU', f: 'rubik', z: 400, ls: -20, x: 1240, y: 854, a: 'middle', c: '#b40a0c', w: 2200 },
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
      id: 'phfambook', name: 'Family book', title: 'FAMILY BOOK', cat: ['porod'], bg: '#ffffff', ink: '#98aec3', accent: '#98aec3',
      aka: 'porodica family book uspomene slika fotografija',
      p: [[209, 641, 2061, 1520]],
      t: [
        { k: 'a', label: 'Naslov', s: 'FAMILY BOOK', f: 'play', z: 330, ls: -16.5, x: 1240, y: 2549, a: 'middle', c: '#98aec3', w: 2200 },
      ],
    },
    {
      id: 'phwedding', name: 'Wedding', title: 'WEDDING', cat: ['venc'], bg: '#1e1e1e', ink: '#ffffff', accent: '#ffffff', gray: true, dark: true, hy: 0.72,
      aka: 'vencanje wedding svadba vencanje album slika fotografija',
      p: [[0, 0, 2480, 3508]],
      t: [
        { k: 'a', label: 'Naslov', s: 'WEDDING', f: 'rozha', z: 550, ls: -27.5, x: 1240, y: 1912, a: 'middle', c: '#ffffff', w: 2240 },
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
  const wtOf = (t) => t.wt || (t.f === 'coop' ? 900 : 400);
  const fontOf = (t, z) => `${wtOf(t)} ${z}px ${FONT[t.f]}`;
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
  function holder(x, y, w, h, dark, hy) {
    const [bgc, ico, lab] = dark ? ['#8a857e', '#c4beb5', '#d6d0c7'] : ['#e9e6e1', '#a9a49b', '#8f897f'];
    const m = Math.min(w, h), ic = Math.min(m * 0.22, 420), cx = x + w / 2, cy = hy ? y + h * hy : y + h / 2 - m * 0.06;
    const fs = Math.max(34, Math.min(110, m * 0.085));
    return `<rect x="${x}" y="${y}" width="${w}" height="${h}" fill="${bgc}"/>`
      + `<g transform="translate(${r1(cx - ic / 2)} ${r1(cy - ic / 2)}) scale(${r1(ic / 24)})" fill="none" stroke="${ico}" stroke-width="1.6" stroke-linejoin="round" stroke-linecap="round"><rect x="2" y="4" width="20" height="16" rx="2.5"/><circle cx="8.5" cy="9.5" r="1.8"/><path d="m3 18 5.5-5.5 4 4 3-3L21 18"/></g>`
      + (m < 900 ? '' : `<text x="${r1(cx)}" y="${r1(cy + ic / 2 + fs * 1.5)}" text-anchor="middle" font-family="Raleway, Arial, sans-serif" font-weight="700" font-size="${r1(fs)}" fill="${lab}">Tvoja fotografija</text>`);
  }
  /* Položaj fotografije u okviru: z = uvećanje (1 = taman popuni okvir), cx/cy = 0..1 koji deo viška se vidi (0.5 = sredina).
     Koliko može da se pomera zavisi od slike i okvira: višak postoji samo po jednoj osi dok se slika ne uveća. */
  const ZMAX = 4;
  function fit(w, h, iw, ih, p) {
    const z = Math.min(ZMAX, Math.max(1, (p && p.z) || 1));
    const k = Math.max(w / iw, h / ih) * z, dw = iw * k, dh = ih * k;
    const cx = p && p.cx != null ? p.cx : 0.5, cy = p && p.cy != null ? p.cy : 0.5;
    return { dx: -(dw - w) * cx, dy: -(dh - h) * cy, dw, dh, ox: dw - w, oy: dh - h };
  }
  /* o.pt = { txt: { k: tekst }, ph: [{ thumb }] } – izmene kupca; bez toga se vide podrazumevani tekst i prazna mesta */
  function svg(c, o = {}) {
    const pt = o.pt || {}, ph = pt.ph || [];
    let out = (c.gray ? '<defs><filter id="ttgray" color-interpolation-filters="sRGB"><feColorMatrix type="saturate" values="0"/></filter></defs>' : '') + `<rect width="${PW}" height="${PH}" fill="${c.bg}"/>`;
    c.p.forEach(([x, y, w, h], i) => {
      const p = ph[i];
      if (!(p && p.thumb && p.w)) { out += holder(x, y, w, h, c.dark, c.hy); return; }
      const f = fit(w, h, p.w, p.h, p);
      out += `<svg x="${x}" y="${y}" width="${w}" height="${h}" overflow="hidden"><image href="${p.thumb}" x="${r1(f.dx)}" y="${r1(f.dy)}" width="${r1(f.dw)}" height="${r1(f.dh)}" preserveAspectRatio="none"${c.gray ? ' filter="url(#ttgray)"' : ''}/></svg>`;
    });
    (c.d || []).forEach(([x1, y1, x2, y2, sw, col]) => { out += `<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke="${col}" stroke-width="${sw}"/>`; });
    layout(c, pt.txt).forEach((p) => {
      out += `<text x="${r1(p.x)}" y="${r1(p.y)}" text-anchor="${p.t.a}" font-family="${esc(FONT[p.t.f])}" font-weight="${wtOf(p.t)}" font-size="${r1(p.z)}" letter-spacing="${r1((p.t.ls * p.z) / p.t.z)}" fill="${p.t.c}" style="white-space:pre">${esc(p.s)}</text>`;
    });
    return `<svg class="cover-svg" viewBox="0 0 ${PW} ${PH}" preserveAspectRatio="xMidYMid slice" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="${esc(c.name)}">${out}</svg>`;
  }
  /* Fajl za štampu: A4 300 dpi, fotografije kupca u punoj rezoluciji (isečene i pomerene tačno kao u pregledu). */
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
      const f = fit(w, h, bmp.width, bmp.height, p);
      g.save();
      g.beginPath(); g.rect(x, y, w, h); g.clip();
      g.drawImage(bmp.src, x + f.dx, y + f.dy, f.dw, f.dh);
      g.restore();
      if (bmp.close) bmp.close();
      if (c.gray) {
        const im = g.getImageData(x, y, w, h), d = im.data;
        for (let k = 0; k < d.length; k += 4) { const v = 0.2126 * d[k] + 0.7152 * d[k + 1] + 0.0722 * d[k + 2]; d[k] = d[k + 1] = d[k + 2] = v; }
        g.putImageData(im, x, y);
      }
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
  window.TTP = { svg, print, layout, fit, ZMAX, LIST };
})();
