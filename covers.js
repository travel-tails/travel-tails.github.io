/* Travel Tails – korice: originalne vektorske ilustracije + generator SVG korica.
   Svaka ilustracija se crta u koordinatnom sistemu A4 korice: 420 x 594. */
(function () {
  'use strict';

  const rng = (seed) => () => (seed = (seed * 16807) % 2147483647) / 2147483647;
  const rad = (d) => (d * Math.PI) / 180;
  const f = (n) => Math.round(n * 10) / 10;

  const arch = (x, y, w, h, fill) => {
    const r = w / 2;
    return `<path d="M${f(x - r)} ${f(y)}V${f(y - h + r)}A${f(r)} ${f(r)} 0 0 1 ${f(x + r)} ${f(y - h + r)}V${f(y)}Z" fill="${fill}"/>`;
  };

  const hibiscus = (cx, cy, r, c, dark, rot = 0) => {
    let s = `<g transform="translate(${cx} ${cy}) rotate(${rot})">`;
    for (let i = 0; i < 5; i++) {
      s += `<g transform="rotate(${i * 72})">
        <path d="M0 0C${f(-r * 0.62)} ${f(-r * 0.2)} ${f(-r * 0.72)} ${f(-r * 0.98)} ${f(-r * 0.14)} ${f(-r * 1.04)}C${f(-r * 0.02)} ${f(-r * 0.94)} ${f(r * 0.08)} ${f(-r * 1.08)} ${f(r * 0.26)} ${f(-r * 1)}C${f(r * 0.74)} ${f(-r * 0.82)} ${f(r * 0.52)} ${f(-r * 0.18)} 0 0Z" fill="${c}"/>
        <path d="M0 ${f(-r * 0.1)}C${f(-r * 0.04)} ${f(-r * 0.4)} ${f(-r * 0.02)} ${f(-r * 0.66)} ${f(r * 0.02)} ${f(-r * 0.86)}M0 ${f(-r * 0.14)}C${f(-r * 0.2)} ${f(-r * 0.4)} ${f(-r * 0.3)} ${f(-r * 0.6)} ${f(-r * 0.3)} ${f(-r * 0.78)}M0 ${f(-r * 0.14)}C${f(r * 0.2)} ${f(-r * 0.4)} ${f(r * 0.32)} ${f(-r * 0.58)} ${f(r * 0.34)} ${f(-r * 0.74)}" stroke="${dark}" stroke-width="${f(r * 0.022 + 0.7)}" fill="none" opacity=".55" stroke-linecap="round"/>
      </g>`;
    }
    s += `<circle r="${f(r * 0.16)}" fill="${dark}"/>
      <path d="M0 0C${f(r * 0.22)} ${f(r * 0.1)} ${f(r * 0.5)} ${f(r * 0.28)} ${f(r * 0.76)} ${f(r * 0.44)}" stroke="#f3c64a" stroke-width="${f(r * 0.06)}" stroke-linecap="round" fill="none"/>`;
    for (let i = 0; i < 7; i++) {
      const a = (i / 7) * 6.28;
      s += `<circle cx="${f(r * 0.76 + Math.cos(a) * r * 0.08)}" cy="${f(r * 0.44 + Math.sin(a) * r * 0.08)}" r="${f(r * 0.04)}" fill="#f7d560"/>`;
    }
    return s + '</g>';
  };

  const leaf = (x, y, len, w, rot, c, vein = 'rgba(255,255,255,.35)') =>
    `<g transform="translate(${x} ${y}) rotate(${rot})"><path d="M0 0C${f(w)} ${f(-len * 0.3)} ${f(w)} ${f(-len * 0.75)} 0 ${f(-len)}C${f(-w)} ${f(-len * 0.75)} ${f(-w)} ${f(-len * 0.3)} 0 0Z" fill="${c}"/><path d="M0 -4V${f(-len * 0.94)}" stroke="${vein}" stroke-width="1.4"/></g>`;

  const blossomCluster = (seed, pts, palette, n, spread, sz) => {
    const r = rng(seed);
    let s = '';
    pts.forEach(([x, y]) => {
      for (let i = 0; i < n; i++) {
        const a = r() * 6.28, d = r() * spread;
        s += `<circle cx="${f(x + Math.cos(a) * d)}" cy="${f(y + Math.sin(a) * d)}" r="${f(sz * (0.55 + r() * 0.75))}" fill="${palette[Math.floor(r() * palette.length)]}"/>`;
      }
    });
    return s;
  };

  const branch = (x, y, rot, c1, c2) => {
    let o = `<g transform="translate(${x} ${y}) rotate(${rot})"><path d="M0 0C6 -50 2 -110 -14 -170" stroke="#7c9179" stroke-width="3" fill="none"/>`;
    for (let i = 0; i < 8; i++) {
      const t = i / 8, py = -t * 170 - 12, px = -t * t * 14 + 3;
      o += `<ellipse cx="${f(px - 18)}" cy="${f(py)}" rx="17" ry="9.4" fill="${c1}" transform="rotate(-30 ${f(px - 18)} ${f(py)})"/><ellipse cx="${f(px + 18)}" cy="${f(py)}" rx="17" ry="9.4" fill="${c2}" transform="rotate(30 ${f(px + 18)} ${f(py)})"/>`;
    }
    return o + '</g>';
  };

  const palm = (x, y, topX, topY, scale, tone = ['#3c7d3a', '#5b9c43', '#84b84f']) => {
    const r = rng(Math.round(x * 13 + topY));
    let s = `<path d="M${x - 15 * scale} ${y}C${x - 6 * scale} ${f((y + topY) / 2)} ${topX - 30 * scale} ${f(topY + 90 * scale)} ${topX - 5 * scale} ${topY}L${topX + 6 * scale} ${topY}C${topX - 12 * scale} ${f(topY + 92 * scale)} ${x + 18 * scale} ${f((y + topY) / 2)} ${x + 17 * scale} ${y}Z" fill="#a0713f"/>`;
    const seg = 22;
    for (let i = 1; i < seg; i++) {
      const t = i / seg, u = 1 - t;
      const px = u * u * x + 2 * u * t * (x - 12 * scale) + t * t * topX;
      const py = y + (topY - y) * t;
      const w = (16 - t * 11) * scale;
      s += `<path d="M${f(px - w)} ${f(py)}Q${f(px)} ${f(py + 4 * scale)} ${f(px + w)} ${f(py)}" stroke="#6f4a26" stroke-width="${f(1.5 * scale)}" fill="none" opacity=".75"/>`;
    }
    [-172, -148, -122, -92, -62, -32, -8, 14, 198].forEach((a, idx) => {
      const L = (130 + r() * 34) * scale;
      const ex = topX + Math.cos(rad(a)) * L;
      const ey = topY + Math.sin(rad(a)) * L + 42 * scale;
      const cxp = topX + Math.cos(rad(a)) * L * 0.55;
      const cyp = topY + Math.sin(rad(a)) * L * 0.55 - 24 * scale;
      const c = tone[idx % tone.length];
      for (let k = 2; k <= 26; k++) {
        const t = k / 27, u = 1 - t;
        const px = u * u * topX + 2 * u * t * cxp + t * t * ex;
        const py = u * u * topY + 2 * u * t * cyp + t * t * ey;
        const l = (40 - t * 22) * scale;
        s += `<path d="M${f(px)} ${f(py)}l${f(-7 * scale)} ${f(l)}M${f(px)} ${f(py)}l${f(9 * scale)} ${f(l * 0.92)}" stroke="${c}" stroke-width="${f(3.4 * scale)}" stroke-linecap="round"/>`;
      }
      s += `<path d="M${topX} ${topY}Q${f(cxp)} ${f(cyp)} ${f(ex)} ${f(ey)}" stroke="#35632d" stroke-width="${f(2.6 * scale)}" fill="none" stroke-linecap="round"/>`;
    });
    s += `<circle cx="${topX - 10 * scale}" cy="${topY + 10 * scale}" r="${9 * scale}" fill="#6d4a29"/><circle cx="${topX + 9 * scale}" cy="${topY + 12 * scale}" r="${9 * scale}" fill="#7f5831"/>`;
    return s;
  };

  const ART = {
    colosseum() {
      const cx = 210, R = 165;
      const topY = (a, base) => base + 40 * (1 - Math.cos(a));
      let pts = [];
      for (let d = -80; d <= 80; d += 8) pts.push(`${f(cx + R * Math.sin(rad(d)))} ${f(topY(rad(d), 324))}`);
      let s = `<ellipse cx="210" cy="532" rx="186" ry="12" fill="#000" opacity=".16"/>`;
      s += `<path d="M${f(cx + R * Math.sin(rad(-80)))} 528L${pts.join('L')}L${f(cx + R * Math.sin(rad(80)))} 528Z" fill="#c9974a"/>`;
      let upper = [];
      for (let d = -4; d <= 80; d += 8) upper.push(`${f(cx + R * Math.sin(rad(d)))} ${f(topY(rad(d), 290))}`);
      s += `<path d="M${upper.join('L')}L${f(cx + R * Math.sin(rad(80)))} ${f(topY(rad(80), 332))}L${f(cx + R * Math.sin(rad(-4)))} ${f(topY(rad(-4), 332))}Z" fill="#b7843d"/>`;
      for (let d = 8; d <= 72; d += 12) {
        const a = rad(d);
        const w = 11 * Math.cos(a) + 2;
        s += `<rect x="${f(cx + R * Math.sin(a) - w / 2)}" y="${f(topY(a, 303))}" width="${f(w)}" height="13" fill="#6e4720"/>`;
      }
      [[372, 44, 3.2], [426, 46, 3.2], [478, 44, 3.2]].forEach(([y, h], t) => {
        for (let i = -6; i <= 6; i++) {
          const a = rad(i * 12.6);
          const w = 22 * Math.cos(a) + 3;
          const x = cx + R * 0.985 * Math.sin(a);
          const yy = topY(a, y + h - 8 + (t === 2 ? 4 : 0)) - (t === 2 ? 16 * (1 - Math.cos(a)) : 0);
          s += arch(x, yy, w, h - 6, '#5d3a1b');
          s += arch(x + w * 0.1, yy, w * 0.66, h - 14, '#8b5c2b');
        }
      });
      [[366], [420], [472], [522]].forEach(([y], t) => {
        let l = [];
        for (let d = -80; d <= 80; d += 8) {
          const a = rad(d);
          l.push(`${f(cx + R * Math.sin(a))} ${f(topY(a, y) - (t === 3 ? 40 * (1 - Math.cos(a)) : t === 2 ? 24 * (1 - Math.cos(a)) : 0))}`);
        }
        s += `<path d="M${l.join('L')}" stroke="#ecc680" stroke-width="4" fill="none" stroke-linejoin="round"/>`;
      });
      return s;
    },

    sagrada() {
      const spire = (x, base, h, w, c, c2) => {
        let s = `<path d="M${x - w / 2} ${base}C${x - w / 2} ${f(base - h * 0.6)} ${f(x - w * 0.14)} ${f(base - h * 0.88)} ${x} ${base - h}C${f(x + w * 0.14)} ${f(base - h * 0.88)} ${x + w / 2} ${f(base - h * 0.6)} ${x + w / 2} ${base}Z" fill="${c}"/>`;
        s += `<path d="M${x} ${base}V${base - h}C${f(x + w * 0.14)} ${f(base - h * 0.88)} ${x + w / 2} ${f(base - h * 0.6)} ${x + w / 2} ${base}Z" fill="${c2}"/>`;
        const rows = Math.floor(h / 26);
        for (let i = 1; i < rows; i++) {
          const y = base - i * 26;
          const t = (base - y) / h;
          const half = (w / 2) * (1 - Math.pow(t, 2.4)) * 0.72;
          s += `<path d="M${f(x - half)} ${y}H${f(x + half)}" stroke="#7b5414" stroke-width="3.2" stroke-dasharray="4.5 3.5"/>`;
        }
        s += `<circle cx="${x}" cy="${base - h - 7}" r="${f(w * 0.2)}" fill="#f3d27b"/><path d="M${x} ${base - h - 26}v12M${x - 5} ${base - h - 20}h10" stroke="#f3d27b" stroke-width="2.8"/>`;
        return s;
      };
      let s = `<path d="M62 540V430L100 395L210 372L320 395L358 430V540Z" fill="#b9882b"/>`;
      s += spire(110, 470, 200, 46, '#cf9f39', '#b98a29') + spire(310, 470, 200, 46, '#cf9f39', '#b98a29');
      s += spire(158, 470, 262, 50, '#dcae45', '#c4932f') + spire(262, 470, 262, 50, '#dcae45', '#c4932f');
      s += spire(210, 480, 330, 54, '#e9bd55', '#cf9f39');
      s += `<path d="M58 540V452Q100 430 130 462Q160 420 210 418Q260 420 290 462Q320 430 362 452V540Z" fill="#a97a24"/>`;
      s += arch(210, 540, 74, 104, '#5b3e12') + arch(210, 540, 52, 84, '#7c571a');
      s += arch(120, 540, 42, 66, '#5b3e12') + arch(300, 540, 42, 66, '#5b3e12');
      s += `<circle cx="210" cy="424" r="19" fill="#5b3e12"/><circle cx="210" cy="424" r="10" fill="#e9bd55"/>`;
      return s;
    },

    eiffel() {
      const top = 182, plat1 = 452, base = 556;
      const hw = (y) => 5 + 104 * Math.pow((y - top) / (base - top), 2.5);
      const c = '#d4a83e', d = '#8e6b1c';
      let L = [], R = [];
      for (let y = top; y <= plat1; y += 6) { L.push(`${f(210 - hw(y))} ${y}`); R.unshift(`${f(210 + hw(y))} ${y}`); }
      let s = `<path d="M${L.join('L')}L${R.join('L')}Z" fill="${c}"/>`;
      for (const side of [-1, 1]) {
        let o = [], i = [];
        for (let y = plat1; y <= base; y += 4) {
          o.push(`${f(210 + side * hw(y))} ${y}`);
          const inner = 62 * Math.sqrt((y - plat1) / (base - plat1)) ;
          i.unshift(`${f(210 + side * inner)} ${y}`);
        }
        s += `<path d="M${o.join('L')}L${i.join('L')}Z" fill="${c}"/>`;
        for (let y = plat1 + 6; y < base - 8; y += 15) {
          const a0 = 62 * Math.sqrt((y - plat1) / (base - plat1)), b0 = hw(y);
          const y1 = y + 15, a1 = 62 * Math.sqrt(Math.min(1, (y1 - plat1) / (base - plat1))), b1 = hw(Math.min(y1, base));
          s += `<path d="M${f(210 + side * a0)} ${y}L${f(210 + side * b1)} ${y1}M${f(210 + side * b0)} ${y}L${f(210 + side * a1)} ${y1}" stroke="${d}" stroke-width="2"/>`;
        }
      }
      for (let y = top + 14; y < plat1 - 8; y += 16) {
        const h0 = hw(y), h1 = hw(y + 16);
        s += `<path d="M${f(210 - h0)} ${y}L${f(210 + h1)} ${y + 16}M${f(210 + h0)} ${y}L${f(210 - h1)} ${y + 16}M${f(210 - h0)} ${y}H${f(210 + h0)}" stroke="${d}" stroke-width="1.8"/>`;
      }
      const pl = (y, h) => `<rect x="${f(210 - hw(y) - 9)}" y="${y - h}" width="${f(2 * hw(y) + 18)}" height="${h}" fill="#b98f2e"/><path d="M${f(210 - hw(y) - 9)} ${y - h}H${f(210 + hw(y) + 9)}" stroke="#f2d78a" stroke-width="2.4"/>`;
      s += pl(330, 8) + pl(plat1, 13);
      s += `<rect x="202" y="172" width="16" height="12" fill="#b98f2e"/><path d="M210 128V172" stroke="${c}" stroke-width="4"/><path d="M210 112V132" stroke="${c}" stroke-width="2"/>`;
      return s;
    },

    museum() {
      const c = '#d8b06a', d = '#7f5a2b', m = '#b98a48';
      let s = `<rect x="44" y="516" width="332" height="24" fill="${m}"/><rect x="62" y="400" width="296" height="118" fill="${c}"/>`;
      s += `<path d="M58 400H362L350 386H70Z" fill="${d}"/>`;
      for (let i = 0; i < 14; i++) {
        const x = 76 + i * 20.6;
        if (i > 4 && i < 9) continue;
        s += arch(x, 448, 11, 34, '#5e4120') + `<rect x="${x - 6}" y="470" width="12" height="28" fill="#5e4120"/>`;
      }
      s += `<rect x="150" y="330" width="120" height="188" fill="#e3bf7c"/><path d="M138 332L210 278L282 332Z" fill="${c}"/><path d="M152 328L210 286L268 328Z" fill="${m}"/>`;
      for (let i = 0; i < 6; i++) {
        const x = 161 + i * 19.6;
        s += `<rect x="${x - 3.6}" y="340" width="7.2" height="146" fill="#f3dca9"/>`;
      }
      s += `<rect x="146" y="484" width="128" height="10" fill="${m}"/>` + arch(210, 518, 34, 56, '#5e4120');
      s += `<rect x="176" y="250" width="68" height="40" fill="${c}"/><path d="M170 252C172 196 248 196 250 252Z" fill="#5f7a53"/><path d="M186 252C188 212 232 212 234 252" stroke="#3e5a38" stroke-width="2.6" fill="none"/><path d="M210 200V180" stroke="#d8b06a" stroke-width="5"/><circle cx="210" cy="176" r="6.5" fill="#efcf85"/>`;
      s += `<rect x="60" y="358" width="40" height="44" fill="#e3bf7c"/><path d="M54 360L80 330L106 360Z" fill="${d}"/><rect x="320" y="358" width="40" height="44" fill="#e3bf7c"/><path d="M314 360L340 330L366 360Z" fill="${d}"/>`;
      return s;
    },

    bridge() {
      const r = '#b3281e', d = '#7c1a14';
      let s = '';
      const tower = (x, top, base, w) => {
        let t = `<rect x="${x - w}" y="${top}" width="${w * 0.72}" height="${base - top}" fill="${r}"/><rect x="${x + w * 0.28}" y="${top}" width="${w * 0.72}" height="${base - top}" fill="${r}"/>`;
        for (let y = top + 8, k = 0; y < base - 30; y += (base - top) / 5.4, k++) {
          t += `<rect x="${x - w}" y="${f(y)}" width="${w * 2}" height="${w * 0.44}" fill="${d}"/>`;
        }
        return t;
      };
      s += `<path d="M-10 268Q75 450 155 256Q250 470 345 244Q395 360 430 400" stroke="${r}" stroke-width="5" fill="none"/>`;
      s += `<path d="M155 256Q250 470 345 244" stroke="${d}" stroke-width="2" fill="none" transform="translate(0 7)"/>`;
      for (let x = 170; x < 342; x += 12) {
        const t = (x - 155) / 190, y = (1 - t) * (1 - t) * 256 + 2 * (1 - t) * t * 470 + t * t * 244;
        s += `<path d="M${x} ${f(y)}V426" stroke="${r}" stroke-width="1.7"/>`;
      }
      for (let x = 8; x < 150; x += 12) {
        const t = (x + 10) / 165, y = (1 - t) * (1 - t) * 268 + 2 * (1 - t) * t * 450 + t * t * 256;
        s += `<path d="M${x} ${f(y)}V426" stroke="${r}" stroke-width="1.7"/>`;
      }
      s += tower(155, 232, 510, 13) + tower(345, 216, 510, 15);
      s += `<rect x="-10" y="424" width="440" height="15" fill="${d}"/><path d="M-10 424H430" stroke="#de5a44" stroke-width="3"/>`;
      s += `<path d="M0 500H420V594H0Z" fill="#3e7fa3"/><path d="M0 524Q52 512 105 524T210 524T315 524T420 524M0 556Q52 544 105 556T210 556T315 556T420 556" stroke="#a7d3e6" stroke-width="3.4" fill="none"/>`;
      return s;
    },

    hibiscusBig() {
      return leaf(138, 470, 126, 42, -128, '#2c7a5b') + leaf(286, 468, 120, 40, 128, '#2c7a5b') + leaf(214, 508, 104, 34, 174, '#3a8f6b') + hibiscus(210, 372, 148, '#d6287f', '#8e0f50', 18);
    },

    house() {
      const r = rng(44);
      let s = `<rect x="150" y="280" width="290" height="330" fill="#fbfbf7"/><rect x="150" y="280" width="30" height="330" fill="#e6e7e2"/>`;
      s += `<rect x="226" y="350" width="120" height="164" fill="#2c7a78"/>`;
      for (let y = 358; y < 508; y += 10) s += `<path d="M232 ${y}H340" stroke="#a9d9d5" stroke-width="4.2"/>`;
      s += `<path d="M286 350V514" stroke="#1a5c5b" stroke-width="5"/><rect x="218" y="342" width="136" height="12" fill="#dfe2dc"/><rect x="214" y="514" width="144" height="13" fill="#dfe2dc"/>`;
      s += `<path d="M100 610C118 500 122 430 112 372C104 318 152 278 214 268C290 256 372 236 430 268" stroke="#6b4a2c" stroke-width="10" fill="none" stroke-linecap="round"/><path d="M122 460C150 440 178 442 196 420M168 280C186 318 220 320 232 350" stroke="#6b4a2c" stroke-width="5" fill="none" stroke-linecap="round"/>`;
      const pts = [];
      for (let i = 0; i < 46; i++) {
        const t = i / 45;
        pts.push([108 + Math.sin(t * 3) * 44 + r() * 30, 590 - t * 340 + r() * 22]);
      }
      for (let i = 0; i < 34; i++) { const t = i / 33; pts.push([120 + t * 320 + r() * 12, 270 - Math.sin(t * 3.14) * 22 + r() * 26]); }
      s += blossomCluster(3, pts, ['#2f7a4a', '#47935a', '#2f7a4a'], 3, 22, 7);
      s += blossomCluster(9, pts, ['#d43a78', '#ec5b95', '#b82363', '#f58ab3'], 4, 24, 5.6);
      return s;
    },

    sunBranch() {
      const r = rng(8);
      let s = `<circle cx="210" cy="372" r="146" fill="#d3202b"/>`;
      const branches = ['M-6 512C70 480 130 462 188 400C226 360 278 330 356 292', 'M124 452C118 400 92 372 66 350', 'M214 376C236 410 280 424 330 420', 'M270 336C266 290 288 258 322 236', 'M170 416C176 460 210 490 236 512'];
      s += `<path d="${branches[0]}" stroke="#2b1a14" stroke-width="10" fill="none" stroke-linecap="round"/>`;
      branches.slice(1).forEach((b) => (s += `<path d="${b}" stroke="#2b1a14" stroke-width="5.4" fill="none" stroke-linecap="round"/>`));
      const spots = [[66, 350], [88, 372], [118, 420], [160, 430], [190, 402], [236, 512], [216, 492], [176, 462], [226, 362], [250, 398], [292, 418], [330, 420], [262, 340], [282, 280], [322, 236], [300, 306], [356, 292], [330, 300], [36, 490], [78, 470], [120, 456]];
      spots.forEach(([x, y]) => {
        const sz = 10 + r() * 6, a = r() * 72;
        s += `<g transform="translate(${x} ${y}) rotate(${f(a)})">`;
        for (let i = 0; i < 5; i++) s += `<ellipse cx="0" cy="${f(-sz)}" rx="${f(sz * 0.62)}" ry="${f(sz * 0.86)}" fill="#f8c7d6" transform="rotate(${i * 72})"/>`;
        s += `<circle r="${f(sz * 0.32)}" fill="#e2527c"/></g>`;
      });
      return s;
    },

    coconut() {
      let s = hibiscus(148, 256, 58, '#d42a6f', '#8d1048', -24);
      s += `<ellipse cx="208" cy="512" rx="118" ry="14" fill="#000" opacity=".14"/>`;
      s += `<path d="M84 338C70 442 138 512 206 514C288 516 338 438 334 344C300 290 124 286 84 338Z" fill="#7fb239"/>`;
      s += `<path d="M84 338C76 400 94 456 136 490C110 430 108 380 118 320C102 324 90 330 84 338Z" fill="#a5cb4e"/><path d="M334 344C338 420 306 484 240 508C282 452 296 390 288 322C316 328 330 336 334 344Z" fill="#5b8f2b"/>`;
      s += `<ellipse cx="209" cy="336" rx="125" ry="42" fill="#5d8a2a"/><ellipse cx="209" cy="338" rx="108" ry="33" fill="#f7f2dc"/><ellipse cx="209" cy="346" rx="86" ry="22" fill="#e7dcb4"/>`;
      s += `<path d="M216 342L272 232L334 196" stroke="#c9663a" stroke-width="11" fill="none" stroke-linecap="round" stroke-linejoin="round"/><path d="M216 342L272 232L334 196" stroke="#efa77a" stroke-width="3.4" stroke-dasharray="11 9" fill="none" stroke-linecap="round" stroke-linejoin="round"/>`;
      return s;
    },

    dolphins() {
      const dol = (t) => `<g transform="${t}">
        <path d="M22 6L-36 30L8 42L30 84L46 18Z" fill="#2e3f50"/>
        <path d="M120 -148C128 -186 156 -204 180 -206C168 -186 170 -170 182 -156Z" fill="#2e3f50"/>
        <path d="M0 0C20 -92 120 -172 240 -152C262 -148 284 -152 314 -162C302 -138 284 -126 256 -120C170 -116 90 -66 44 14Z" fill="#41566b"/>
        <path d="M256 -120C170 -116 90 -66 44 14C70 -56 154 -126 276 -134C270 -128 264 -124 256 -120Z" fill="#e4eaef"/>
        <path d="M178 -126C172 -90 150 -66 122 -56C128 -84 138 -106 150 -124Z" fill="#2e3f50"/>
        <circle cx="258" cy="-142" r="4.4" fill="#10181f"/>
      </g>`;
      return dol('translate(76 452) scale(.86)') + dol('translate(344 304) rotate(180) scale(.86)') + hibiscus(210, 378, 25, '#e36b98', '#a33064', 40);
    },

    wave() {
      const r = rng(21);
      let s = `<path d="M0 594V494C40 420 80 330 168 268C248 214 362 214 404 306C360 262 302 268 268 304C236 340 248 404 300 438C340 462 390 470 420 470V594Z" fill="#157a8c"/>`;
      s += `<path d="M34 594C60 450 132 310 232 272C300 248 362 262 388 288" stroke="#47b1bf" stroke-width="15" fill="none"/>`;
      s += `<path d="M74 594C100 470 160 346 238 310" stroke="#8fd5da" stroke-width="11" fill="none"/>`;
      s += `<path d="M118 594C138 490 190 404 234 372" stroke="#0e5a70" stroke-width="16" fill="none"/>`;
      s += `<path d="M172 594C186 526 214 474 262 452" stroke="#47b1bf" stroke-width="11" fill="none"/>`;
      s += `<path d="M232 594C248 556 280 526 324 512" stroke="#8fd5da" stroke-width="9" fill="none"/>`;
      s += `<path d="M300 594C316 574 346 562 420 552" stroke="#0e5a70" stroke-width="12" fill="none"/>`;
      const crest = [];
      for (let i = 0; i < 60; i++) {
        const t = i / 59;
        const u = 1 - t;
        const x = u * u * u * 124 + 3 * u * u * t * 190 + 3 * u * t * t * 340 + t * t * t * 412;
        const y = u * u * u * 318 + 3 * u * u * t * 196 + 3 * u * t * t * 196 + t * t * t * 310;
        crest.push([x, y]);
      }
      s += blossomCluster(5, crest, ['#ffffff', '#ffffff', '#dff4f5'], 5, 21, 5.2);
      for (let i = 0; i < 90; i++) {
        const x = 40 + r() * 360, y = 170 + r() * 110;
        if (y < 300 - (x > 170 ? 0 : 30)) s += `<circle cx="${f(x)}" cy="${f(y + 16)}" r="${f(1.2 + r() * 2.2)}" fill="#7ccbd6" opacity=".7"/>`;
      }
      s += blossomCluster(12, [[272, 306], [254, 344], [262, 390], [296, 432], [350, 456], [410, 468]], ['#ffffff', '#e7f6f7'], 12, 15, 4.4);
      return s;
    },

    palmSolo() {
      return `<ellipse cx="262" cy="556" rx="120" ry="11" fill="#000" opacity=".12"/>` + palm(258, 556, 170, 290, 1.08);
    },

    strelitzia() {
      let s = leaf(158, 594, 340, 58, -22, '#2f8a68') + leaf(292, 594, 310, 54, 24, '#247656') + `<path d="M214 594C210 500 206 440 196 386" stroke="#2c7a56" stroke-width="16" fill="none" stroke-linecap="round"/>`;
      const petals = [[182, 312, 0, '#f78c1f'], [212, 300, 22, '#ee6a13'], [242, 312, 44, '#fba92a'], [150, 324, -26, '#fba92a'], [266, 326, 62, '#f78c1f']];
      petals.forEach(([x, y, a, c]) => (s += `<g transform="translate(${x + 18} ${y + 74}) rotate(${a})"><path d="M0 0C-36 -56 -34 -130 2 -198C34 -130 36 -58 0 0Z" fill="${c}"/><path d="M1 -6C-3 -70 -2 -130 2 -184" stroke="#b64a0d" stroke-width="2" fill="none" opacity=".6"/></g>`));
      s += `<g transform="translate(236 376) rotate(70)"><path d="M0 0C-22 -44 -18 -102 6 -142C24 -100 26 -44 0 0Z" fill="#2147a8"/></g><g transform="translate(232 372) rotate(38)"><path d="M0 0C-16 -38 -14 -90 4 -122C20 -88 20 -40 0 0Z" fill="#2c5bc9"/></g>`;
      s += `<path d="M86 404C150 356 258 356 346 334C290 402 186 426 108 414C98 412 90 410 86 404Z" fill="#2f8a68"/><path d="M94 406C170 394 276 382 342 336C288 400 186 424 108 414C102 413 98 410 94 406Z" fill="#c33f6f"/><path d="M196 386V410" stroke="#fff" stroke-opacity=".2"/>`;
      return s;
    },

    santorini() {
      let s = `<path d="M0 462H420V594H0Z" fill="#2f77b3"/><path d="M0 492Q52 482 105 492T210 492T315 492T420 492M0 526Q52 516 105 526T210 526T315 526T420 526" stroke="#a8d2eb" stroke-width="3" fill="none"/>`;
      const b = (x, y, w, h, c = '#fdfdfb') => `<rect x="${x}" y="${y}" width="${w}" height="${h}" fill="${c}"/><rect x="${x}" y="${y}" width="${Math.max(6, w * 0.16)}" height="${h}" fill="#e3e6ea"/>`;
      s += b(26, 352, 96, 120) + b(106, 396, 92, 86) + b(186, 340, 110, 150) + b(286, 382, 104, 104);
      s += `<path d="M190 340C192 262 292 262 294 340Z" fill="#2a5fae"/><path d="M212 340C216 280 262 280 266 340" stroke="#183f7e" stroke-width="2.6" fill="none"/><path d="M242 280V246M232 258H252" stroke="#fdfdfb" stroke-width="5.4" stroke-linecap="round"/>`;
      s += `<path d="M30 352C32 300 118 300 120 352Z" fill="#2a5fae"/><path d="M75 310V288M67 297H83" stroke="#fdfdfb" stroke-width="4.4" stroke-linecap="round"/>`;
      s += arch(240, 456, 40, 76, '#2a5fae') + arch(62, 448, 28, 54, '#2a5fae') + arch(150, 462, 24, 42, '#c9d8e8') + arch(338, 462, 32, 56, '#2a5fae');
      s += `<rect x="300" y="360" width="76" height="22" fill="#e3e6ea"/>`;
      s += blossomCluster(31, [[108, 402], [128, 390], [150, 396], [288, 380], [300, 372], [20, 470], [34, 458]], ['#d43a78', '#ec5b95', '#b82363', '#3d8a55'], 13, 18, 5);
      s += `<path d="M328 468l14 -5v7l10 -3v14h-34z" fill="#fff" opacity="0"/>`;
      return s;
    },

    dhow() {
      let s = `<circle cx="306" cy="256" r="58" fill="#f08a3a"/><path d="M0 482H420V594H0Z" fill="#1d8fa2"/><path d="M0 512Q52 500 105 512T210 512T315 512T420 512M0 546Q52 534 105 546T210 546T315 546T420 546" stroke="#a1e0e0" stroke-width="3.2" fill="none"/>`;
      s += `<path d="M184 462L168 196" stroke="#6d4620" stroke-width="7"/><path d="M84 438C70 330 96 242 182 168C222 262 262 372 326 436C254 456 158 456 84 438Z" fill="#fff8e9"/><path d="M84 438C76 384 80 334 98 288C160 324 240 372 326 436C254 456 158 456 84 438Z" fill="#f1dcae"/>`;
      s += `<path d="M58 462H364L330 506H98Z" fill="#7b4b23"/><path d="M58 462H364L356 474H66Z" fill="#c0792e"/>`;
      return s;
    },

    skyline() {
      const r = rng(77);
      const cols = ['#2a5b9c', '#1f4780', '#3a74b8', '#264f8e'];
      let s = '';
      const bldg = (x, w, y, c) => {
        let b = `<rect x="${x}" y="${y}" width="${w}" height="${594 - y}" fill="${c}"/>`;
        for (let yy = y + 12; yy < 590; yy += 13) for (let xx = x + 6; xx < x + w - 6; xx += 10) if (r() > 0.32) b += `<rect x="${xx}" y="${yy}" width="5" height="7" fill="#f4d98a" opacity=".85"/>`;
        return b;
      };
      [[10, 56, 412], [62, 50, 362], [116, 44, 438], [290, 50, 380], [344, 68, 340]].forEach(([x, w, y], i) => (s += bldg(x, w, y, cols[i % 4])));
      s += `<path d="M210 170V230" stroke="#1a3b6c" stroke-width="5"/><rect x="192" y="226" width="36" height="52" fill="#1a3b6c"/><rect x="176" y="272" width="68" height="62" fill="#22497f"/><rect x="156" y="330" width="108" height="264" fill="#1f4780"/>`;
      for (let yy = 340; yy < 590; yy += 12) for (let xx = 164; xx < 258; xx += 12) if (r() > 0.25) s += `<rect x="${xx}" y="${yy}" width="6" height="7" fill="#f4d98a" opacity=".9"/>`;
      return s;
    },

    snow() {
      const flake = (x, y, r, o) => {
        let s = `<g transform="translate(${x} ${y})" stroke="#fff" stroke-width="${f(r * 0.075)}" stroke-linecap="round" opacity="${o}" fill="none">`;
        for (let i = 0; i < 6; i++) s += `<g transform="rotate(${i * 60})"><path d="M0 0V${-r}M0 ${f(-r * 0.46)}l${f(-r * 0.26)} ${f(-r * 0.24)}M0 ${f(-r * 0.46)}l${f(r * 0.26)} ${f(-r * 0.24)}M0 ${f(-r * 0.74)}l${f(-r * 0.18)} ${f(-r * 0.18)}M0 ${f(-r * 0.74)}l${f(r * 0.18)} ${f(-r * 0.18)}"/></g>`;
        return s + '</g>';
      };
      return flake(210, 380, 142, 0.96) + flake(70, 262, 44, 0.75) + flake(358, 258, 40, 0.7) + flake(78, 526, 54, 0.75) + flake(350, 528, 46, 0.72);
    },

    compass() {
      let s = `<circle cx="210" cy="380" r="146" fill="none" stroke="currentColor" stroke-width="5"/><circle cx="210" cy="380" r="122" fill="none" stroke="currentColor" stroke-width="1.8"/>`;
      for (let i = 0; i < 36; i++) s += `<path d="M210 ${i % 9 ? 248 : 240}V258" stroke="currentColor" stroke-width="${i % 9 ? 1.8 : 3.6}" transform="rotate(${i * 10} 210 380)"/>`;
      s += `<path d="M210 262L236 380L210 498L184 380Z" fill="currentColor"/><path d="M92 380L210 354L328 380L210 406Z" fill="currentColor" opacity=".45"/><circle cx="210" cy="380" r="10" fill="#fff"/>`;
      return s;
    },

    stork() {
      return `<g>
        <path d="M122 400C176 372 242 372 296 340C342 312 366 276 362 240L348 214" stroke="#fbf6ea" stroke-width="20" fill="none" stroke-linecap="round"/>
        <path d="M112 416C148 366 236 352 300 354C304 392 268 438 206 448C168 454 132 442 112 416Z" fill="#fbf6ea"/>
        <path d="M148 372C104 320 88 262 104 196C160 222 218 286 248 360C214 364 180 366 148 372Z" fill="#e9c778"/>
        <path d="M172 366C176 300 220 234 278 196C308 256 306 318 280 356C244 356 206 358 172 366Z" fill="#fbf6ea"/>
        <path d="M112 416C84 410 58 420 34 448C76 450 114 446 146 432Z" fill="#6f7f62"/>
        <path d="M146 368C118 334 106 300 108 262M170 366C154 330 148 296 150 258M196 362C198 322 214 280 240 244M224 358C232 322 248 286 272 252" stroke="#9c7f3e" stroke-width="2" fill="none" opacity=".55"/>
        <path d="M160 442L120 510M192 448L168 516" stroke="#e36f3b" stroke-width="6" stroke-linecap="round"/>
        <circle cx="348" cy="206" r="23" fill="#fbf6ea"/><circle cx="356" cy="200" r="3.6" fill="#1a1a1a"/>
        <path d="M366 196L430 212L364 218Z" fill="#e36f3b"/>
        <path d="M398 208C396 268 372 310 334 330C298 330 276 304 276 272C310 276 356 252 390 206Z" fill="#fff7e6"/>
        <path d="M284 280C302 300 332 306 354 290" stroke="#e5d3a8" stroke-width="2.6" fill="none"/>
        <circle cx="324" cy="274" r="24" fill="#f4c9a4"/><path d="M314 274q5 4 10 0M330 274q5 4 10 0" stroke="#8a5a3a" stroke-width="1.8" fill="none" stroke-linecap="round"/>
      </g>`;
    },

    rings() {
      const sprig = (x, y, rot) => {
        let s = `<g transform="translate(${x} ${y}) rotate(${rot})"><path d="M0 0C6 -50 2 -110 -14 -170" stroke="#7c9179" stroke-width="3" fill="none"/>`;
        for (let i = 0; i < 8; i++) {
          const t = i / 8, py = -t * 170 - 12, px = -t * t * 14 + 3;
          s += `<ellipse cx="${f(px - 18)}" cy="${f(py)}" rx="17" ry="9.4" fill="#9fb49a" transform="rotate(-30 ${f(px - 18)} ${f(py)})"/><ellipse cx="${f(px + 18)}" cy="${f(py)}" rx="17" ry="9.4" fill="#86a083" transform="rotate(30 ${f(px + 18)} ${f(py)})"/>`;
        }
        return s + '</g>';
      };
      return sprig(120, 516, -34) + sprig(300, 516, 34) + `<circle cx="176" cy="382" r="66" fill="none" stroke="#c9a14f" stroke-width="13"/><circle cx="176" cy="382" r="66" fill="none" stroke="#f0d594" stroke-width="3.4"/><circle cx="244" cy="382" r="66" fill="none" stroke="#b58b3a" stroke-width="13"/><circle cx="244" cy="382" r="66" fill="none" stroke="#ecd08a" stroke-width="3.4"/><path d="M244 316l12 -16h-24z" fill="#dff3fb"/>`;
    },

    cake() {
      const candles = [156, 183, 210, 237, 264].map((x, i) => `<rect x="${x - 5}" y="270" width="10" height="56" rx="3" fill="${['#65c8f6', '#f7bccd', '#aee3cf', '#fbe27c', '#d4c1f4'][i]}"/><path d="M${x} 236C${x + 13} 252 ${x + 9} 268 ${x} 268C${x - 9} 268 ${x - 13} 252 ${x} 236Z" fill="#f59a3c"/><path d="M${x} 250C${x + 5} 257 ${x + 4} 266 ${x} 266C${x - 4} 266 ${x - 5} 257 ${x} 250Z" fill="#ffe487"/>`).join('');
      const drips = (x, w, y) => {
        const n = 6, st = w / n;
        let d = `M${x} ${y}h${w}v20`;
        for (let i = 0; i < n; i++) d += `q${-st / 4} ${i % 2 ? 26 : 16} ${-st / 2} 0q${-st / 4} ${i % 2 ? -14 : -8} ${-st / 2} 0`;
        return `<path d="${d}Z" fill="#fff8f1"/>`;
      };
      return `<ellipse cx="210" cy="538" rx="184" ry="14" fill="#153a55" opacity=".14"/><rect x="58" y="520" width="304" height="14" rx="7" fill="#fff"/>` +
        `<rect x="92" y="420" width="236" height="102" rx="14" fill="#ee7ca0"/>` + drips(92, 236, 424) +
        `<rect x="130" y="324" width="160" height="100" rx="12" fill="#ffd166"/>` + drips(130, 160, 328) + candles;
    },

    balloons() {
      const b = (x, y, rx, c, dark, rot) => `<g transform="rotate(${rot} ${x} ${y})"><ellipse cx="${x}" cy="${y}" rx="${rx}" ry="${rx * 1.2}" fill="${c}"/><path d="M${x - rx * 0.5} ${y - rx * 0.6}Q${x - rx * 0.2} ${y - rx * 0.95} ${x + rx * 0.2} ${y - rx * 0.86}" stroke="#fff" stroke-width="6" stroke-linecap="round" fill="none" opacity=".6"/><path d="M${x - 9} ${y + rx * 1.26}L${x + 9} ${y + rx * 1.26}L${x} ${y + rx * 1.15}Z" fill="${dark}"/></g>`;
      return `<path d="M108 372Q130 470 196 560M312 366Q290 470 214 560M210 410V566" stroke="#a5b6c4" stroke-width="2.600" fill="none"/>` +
        b(108, 296, 62, '#f7bccd', '#ee7ca0', -12) + b(312, 290, 62, '#aee3cf', '#58c5a0', 12) + b(210, 310, 84, '#65c8f6', '#2494d2', 0) +
        `<text x="210" y="356" text-anchor="middle" font-family="Raleway, Arial, sans-serif" font-weight="900" font-size="130" fill="#fff">1</text>`;
    },

    baptism() {
      return branch(106, 548, -32, '#a4bb9f', '#88a485') + branch(314, 548, 32, '#a4bb9f', '#88a485') +
        `<rect x="192" y="238" width="36" height="252" rx="7" fill="#d9b25f"/><rect x="134" y="306" width="152" height="36" rx="7" fill="#d9b25f"/><rect x="200" y="238" width="10" height="252" rx="4" fill="#f0d695"/><rect x="134" y="314" width="152" height="9" rx="4" fill="#f0d695"/>` +
        `<g transform="translate(250 196)"><path d="M-44 28C-20 -6 26 -8 54 8L84 -4L70 18C58 44 12 60 -22 48Z" fill="#fff"/><path d="M-6 16C2 -26 34 -50 66 -56C70 -22 50 18 16 30Z" fill="#eef4fa"/><circle cx="62" cy="4" r="3.200" fill="#153a55"/></g>`;
    },

    loveHeart() {
      const heart = (x, y, k, c) => `<path transform="translate(${x} ${y}) scale(${k})" d="M0 110C-150 10 -140 -130 -60 -138C-25 -142 -5 -115 0 -100C5 -115 25 -142 60 -138C140 -130 150 10 0 110Z" fill="${c}"/>`;
      return heart(210, 400, 1.12, '#c8325f') + heart(82, 262, 0.26, '#f08bab') + heart(348, 292, 0.34, '#f08bab') + heart(74, 518, 0.2, '#e65f8a') + heart(350, 536, 0.24, '#e65f8a') +
        `<path d="M130 320Q144 286 180 278" stroke="#fff" stroke-width="9" stroke-linecap="round" fill="none" opacity=".55"/>`;
    },

    planeHeart() {
      return `<path d="M210 538C40 424 60 262 150 256C186 252 206 282 210 300C214 282 234 252 270 256C360 262 372 400 300 468" stroke="#d6336c" stroke-width="5.500" stroke-dasharray="3 15" stroke-linecap="round" fill="none"/>` +
        `<g transform="translate(316 450) rotate(-46) scale(1.5)" fill="#1f2a6b"><path d="M-30 -5H10L28 -5C36 -5 38 5 28 5H-30Z"/><path d="M-4 -4L-22 -36H-12L18 -4ZM-4 4L-22 36H-12L18 4ZM-30 -4L-42 -20H-34L-20 -4Z"/></g>` +
        `<circle cx="150" cy="356" r="26" fill="#f4c9a4"/><path d="M124 450C124 400 176 400 176 450Z" fill="#1f2a6b"/><circle cx="262" cy="356" r="26" fill="#f4c9a4"/><path d="M236 450C236 400 288 400 288 450Z" fill="#d6336c"/><path d="M192 374L212 374" stroke="#d6336c" stroke-width="0"/>`;
    },

    calendar() {
      let days = '';
      for (let r = 0; r < 5; r++) for (let c = 0; c < 7; c++) {
        if (r === 2 && c === 4) continue;
        days += `<rect x="${106 + c * 32}" y="${352 + r * 34}" width="14" height="14" rx="3" fill="#c7d6e0"/>`;
      }
      return `<rect x="78" y="260" width="264" height="290" rx="18" fill="#153a55" opacity=".12" transform="translate(6 10)"/><rect x="78" y="260" width="264" height="290" rx="18" fill="#fff"/><path d="M78 278a18 18 0 0 1 18-18h228a18 18 0 0 1 18 18v42H78Z" fill="#65c8f6"/>` +
        `<path d="M136 246v32M284 246v32" stroke="#153a55" stroke-width="9" stroke-linecap="round"/><text x="210" y="304" text-anchor="middle" font-family="Raleway, Arial, sans-serif" font-weight="800" font-size="26" fill="#fff">JUN</text>` + days +
        `<path transform="translate(241 432) scale(.22)" d="M0 110C-150 10 -140 -130 -60 -138C-25 -142 -5 -115 0 -100C5 -115 25 -142 60 -138C140 -130 150 10 0 110Z" fill="#e0407a"/>`;
    },

    sunsea() {
      let s = `<circle cx="210" cy="372" r="104" fill="#ffb347"/><circle cx="210" cy="372" r="80" fill="#ffd166"/><path d="M0 410H420V594H0Z" fill="#2a8fd0"/>`;
      for (let i = 0; i < 6; i++) { const y = 428 + i * 24, w = 170 - i * 24; s += `<rect x="${210 - w / 2}" y="${y}" width="${w}" height="7" rx="3.500" fill="#ffd166" opacity="${0.85 - i * 0.12}"/>`; }
      return s + `<path d="M0 476Q35 462 70 476T140 476T210 476T280 476T350 476T420 476M0 540Q35 526 70 540T140 540T210 540T280 540T350 540T420 540" stroke="#a9dcf5" stroke-width="3.500" fill="none"/>`;
    },

    mountains() {
      return `<circle cx="292" cy="296" r="44" fill="#ffcf99"/><path d="M-10 594V452L86 330L146 400L232 282L338 430L430 352V594Z" fill="#3c6e71"/><path d="M86 330L110 360L98 357L86 372L74 357L64 360ZM232 282L260 322L246 318L232 336L218 316L204 322Z" fill="#fff"/><path d="M-10 594V520L110 424L196 492L300 404L430 496V594Z" fill="#284b63"/><path d="M-10 594V560L130 512L250 552L430 520V594Z" fill="#1d3a4d"/>`;
    },

    plane() {
      return `<path d="M60 540C40 460 120 420 170 450C230 486 160 560 110 520C60 480 140 380 250 360C320 348 350 330 372 300" stroke="currentColor" stroke-width="5" stroke-dasharray="2 14" stroke-linecap="round" fill="none"/><g transform="translate(336 296) rotate(-38) scale(2.200)" fill="#1f2a6b"><path d="M-30 -5H10L28 -5C36 -5 38 5 28 5H-30Z"/><path d="M-4 -4L-22 -36H-12L18 -4ZM-4 4L-22 36H-12L18 4ZM-30 -4L-42 -20H-34L-20 -4Z"/></g><circle cx="60" cy="548" r="9" fill="currentColor"/>`;
    },

    suitcase() {
      return `<rect x="166" y="262" width="88" height="44" rx="16" fill="none" stroke="#1f2a6b" stroke-width="14"/><rect x="100" y="296" width="220" height="250" rx="26" fill="#e4572e"/><path d="M150 296V546M270 296V546" stroke="#c2441f" stroke-width="12"/><circle cx="206" cy="362" r="30" fill="#fff" opacity=".92"/><path d="M192 362h28M206 348v28" stroke="#65c8f6" stroke-width="6"/><rect x="216" y="420" width="70" height="44" rx="8" fill="#ffd166" transform="rotate(-10 251 442)"/><circle cx="132" cy="470" r="20" fill="#65c8f6"/><circle cx="140" cy="558" r="12" fill="#1f2a6b"/><circle cx="280" cy="558" r="12" fill="#1f2a6b"/>`;
    },

    balloon() {
      return `<g fill="#fff" opacity=".85"><ellipse cx="96" cy="300" rx="44" ry="18"/><ellipse cx="120" cy="288" rx="28" ry="20"/><ellipse cx="330" cy="520" rx="50" ry="18"/><ellipse cx="350" cy="506" rx="30" ry="20"/></g><path d="M210 210C120 210 96 300 120 360C138 404 180 430 196 462H224C240 430 282 404 300 360C324 300 300 210 210 210Z" fill="#e4572e"/><path d="M210 210C176 220 160 300 172 360C180 404 196 440 202 462H218C224 440 240 404 248 360C260 300 244 220 210 210Z" fill="#ffd166"/><path d="M210 210C200 240 196 330 204 462H216C224 330 220 240 210 210Z" fill="#e4572e"/><path d="M198 462L192 500M222 462L228 500" stroke="#6d4a29" stroke-width="3"/><rect x="186" y="498" width="48" height="36" rx="5" fill="#a0713f"/>`;
    },

    pin() {
      let s = '';
      for (let i = 0; i < 9; i++) s += `<path d="M${-60 + i * 60} 594L${80 + i * 60} 200" stroke="currentColor" stroke-width="1.500" opacity=".18"/>`;
      for (let i = 0; i < 7; i++) s += `<path d="M0 ${230 + i * 55}L420 ${200 + i * 55}" stroke="currentColor" stroke-width="1.500" opacity=".18"/>`;
      return s + `<path d="M0 470C90 420 150 520 240 470S380 420 420 440" stroke="#65c8f6" stroke-width="18" fill="none" opacity=".7"/><ellipse cx="210" cy="528" rx="34" ry="8" fill="#153a55" opacity=".18"/><path d="M210 520C210 520 140 430 140 372C140 330 172 300 210 300C248 300 280 330 280 372C280 430 210 520 210 520Z" fill="#d6336c"/><circle cx="210" cy="372" r="26" fill="#fff"/>`;
    },

    minimal() {
      return `<rect x="40" y="214" width="340" height="340" fill="none" stroke="currentColor" stroke-width="3"/><circle cx="210" cy="384" r="90" fill="currentColor" opacity=".16"/><path d="M90 470H330" stroke="currentColor" stroke-width="3"/><path d="M120 470C150 430 180 420 210 440S270 430 300 470" fill="currentColor" opacity=".35"/>`;
    },

    camera() {
      return `<rect x="132" y="296" width="70" height="34" rx="8" fill="#fbe27c"/><rect x="96" y="320" width="228" height="160" rx="22" fill="#fbe27c"/><circle cx="210" cy="400" r="58" fill="#153a55"/><circle cx="210" cy="400" r="42" fill="#3e86c6"/><circle cx="210" cy="400" r="20" fill="#153a55"/><circle cx="196" cy="386" r="8" fill="#fff" opacity=".7"/><rect x="276" y="340" width="28" height="16" rx="4" fill="#fff"/><g fill="#fff" opacity=".9"><rect x="70" y="510" width="80" height="60" rx="4" transform="rotate(-8 110 540)"/><rect x="270" y="505" width="80" height="60" rx="4" transform="rotate(7 310 535)"/></g>`;
    },

    bows() {
      const bow = (x, y, sc, rot) => `<g transform="translate(${x} ${y}) rotate(${rot}) scale(${sc})" fill="#121212"><path d="M0 0C-16 -22 -46 -30 -58 -22C-66 -10 -62 18 -52 26C-36 26 -14 12 0 0Z"/><path d="M0 0C16 -22 46 -30 58 -22C66 -10 62 18 52 26C36 26 14 12 0 0Z"/><path d="M-5 5L-26 56L-11 50L-2 62L5 10ZM5 5L26 56L11 50L2 62L-5 10Z"/><circle r="9.5"/></g>`;
      return bow(84, 212, 0.86, -10) + bow(344, 228, 0.56, 12) + bow(58, 462, 0.54, -12) + bow(366, 470, 0.66, 10) + `<text x="210" y="420" text-anchor="middle" font-family="Raleway, Arial, sans-serif" font-weight="900" font-size="210" fill="#121212">18</text>`;
    },
  };

  /* Katalog – boje i motivi prate kolekciju sa @travel.tails.rs */
  const OLD = [
    { id: 'rome', name: 'Rim', title: 'Rome', sub: 'Italy', cat: ['pop', 'grad'], bg: '#14763a', ink: '#ececea', accent: '#e9bd3d', art: 'colosseum', aka: 'rome rim italija italy' },
    { id: 'barcelona', name: 'Barselona', title: 'Barcelona', sub: 'Spain', cat: ['pop', 'grad'], bg: '#e2aed3', ink: '#f2f0ee', accent: '#a7721a', art: 'sagrada', aka: 'barcelona barselona spain spanija' },
    { id: 'paris', name: 'Pariz', title: 'Paris', sub: 'France', cat: ['pop', 'grad'], bg: '#ccb2ec', ink: '#ffffff', accent: '#efe45a', art: 'eiffel', aka: 'paris pariz france francuska' },
    { id: 'greece', name: 'Grčka', title: 'Greece', sub: '', cat: ['pop', 'drzava'], bg: '#3e86c6', ink: '#ffffff', accent: '#d8ecf9', art: 'house', aka: 'greece grcka' },
    { id: 'santorini', name: 'Santorini', title: 'Santorini', sub: 'Greece', cat: ['pop', 'ostrvo'], bg: '#d7e3e8', ink: '#232f6b', accent: '#7c8f2a', art: 'santorini', aka: 'santorini santorin grcka greece' },
    { id: 'montenegro', name: 'Crna Gora', title: 'Montenegro', sub: '', cat: ['pop', 'drzava'], bg: '#c3cfdf', ink: '#1c2c4c', accent: '#1c2c4c', art: 'dolphins', aka: 'montenegro crna gora' },
    { id: 'hercegnovi', name: 'Herceg Novi', title: 'Herceg Novi', sub: '', cat: ['pop', 'grad'], bg: '#bfdcef', ink: '#c1246d', accent: '#c1246d', art: 'hibiscusBig', aka: 'herceg novi crna gora montenegro' },
    { id: 'japan', name: 'Japan', title: 'Japan', sub: '', cat: ['pop', 'drzava'], bg: '#f4b3c4', ink: '#ffffff', accent: '#bb1f3a', art: 'sunBranch', aka: 'japan tokyo tokio' },
    { id: 'srilanka', name: 'Šri Lanka', title: 'Sri Lanka', sub: '', cat: ['drzava', 'ostrvo'], bg: '#f0efe9', ink: '#7c9b12', accent: '#c24a7a', art: 'coconut', aka: 'sri lanka sri lanka' },
    { id: 'cyprus', name: 'Kipar', title: 'Cyprus', sub: '', cat: ['ostrvo', 'drzava'], bg: '#e3e8e8', ink: '#0d7d8c', accent: '#0d7d8c', art: 'wave', aka: 'cyprus kipar' },
    { id: 'madeira', name: 'Madeira', title: 'Madeira', sub: '', cat: ['ostrvo'], bg: '#a9d8c6', ink: '#1a2e7c', accent: '#1a2e7c', art: 'strelitzia', aka: 'madeira madera portugal' },
    { id: 'dominican', name: 'Dominikana', title: 'Dominican', sub: 'Republic', cat: ['drzava', 'ostrvo'], bg: '#b6dcd6', ink: '#1a93a8', accent: '#1a93a8', art: 'palmSolo', aka: 'dominican republic dominikana' },
    { id: 'zanzibar', name: 'Zanzibar', title: 'Zanzibar', sub: '', cat: ['ostrvo'], bg: '#ece14c', ink: '#1f2a6b', accent: '#b6387a', art: 'dhow', aka: 'zanzibar tanzania tanzanija' },
    { id: 'prague', name: 'Prag', title: 'Prague', sub: 'Czechia', cat: ['grad'], bg: '#a7d5f2', ink: '#f7fafc', accent: '#27406f', art: 'museum', aka: 'prague prag ceska czechia' },
    { id: 'sanfrancisco', name: 'San Francisko', title: 'San Francisco', sub: 'USA', cat: ['grad'], bg: '#e9d662', ink: '#7c1a14', accent: '#7c1a14', art: 'bridge', aka: 'san francisco francisko sad usa amerika' },
    { id: 'newyork', name: 'Njujork', title: 'New York', sub: 'USA', cat: ['grad'], bg: '#8cc8ec', ink: '#ffffff', accent: '#17386a', art: 'skyline', aka: 'new york njujork sad usa amerika' },
    { id: 'vienna', name: 'Beč', title: 'Vienna', sub: 'Austria', cat: ['grad'], bg: '#a9cfe6', ink: '#ffffff', accent: '#3c5f7e', art: 'snow', aka: 'vienna bec wien austria austrija' },

    { id: 'firstbday', other: true, name: 'Prvi rođendan', title: 'One', sub: 'A Book of Memories', cat: ['rodj', 'deca'], bg: '#f4eedd', ink: '#2a4b6e', accent: '#2a4b6e', art: 'balloons', font: 'soft', aka: 'prvi rodjendan first birthday one beba deca' },
    { id: 'birthday', other: true, name: 'Rođendan', title: 'Mina', sub: 'Srećan rođendan', cat: ['rodj'], bg: '#c9e7fa', ink: '#c1246d', accent: '#c1246d', art: 'cake', font: 'soft', aka: 'rodjendan birthday slavlje torta' },
    { id: 'birthday18', other: true, name: '18. rođendan', title: 'Lena', sub: 'rođendan', subBottom: true, cat: ['rodj'], bg: '#fdfcfb', ink: '#a84f7b', accent: '#a84f7b', art: 'bows', font: 'soft', aka: 'rodjendan birthday 18 punoletstvo' },
    { id: 'baptism', other: true, name: 'Krštenje', title: 'Mihajlo', sub: 'Krštenje', cat: ['krst', 'deca'], bg: '#dbe9f5', ink: '#2a4b6e', accent: '#a48745', art: 'baptism', font: 'soft', aka: 'krstenje krštenje hristening crkva kum' },
    { id: 'baby', other: true, name: 'Beba', title: 'Lazar', sub: '', cat: ['deca'], bg: '#a5c6e4', ink: '#2a4b6e', accent: '#2a4b6e', art: 'stork', font: 'soft', aka: 'beba baby rodjenje deca roda' },
    { id: 'wedding', other: true, name: 'Venčanje', title: 'Ana & Marko', sub: 'Just married', cat: ['venc'], bg: '#f6f2ea', ink: '#3c4a5a', accent: '#a48745', art: 'rings', font: 'soft', aka: 'vencanje wedding svadba album' },
    { id: 'honeymoon', other: true, name: 'Medeni mesec', title: 'Honeymoon', sub: 'Medeni mesec', cat: ['venc', 'ljub'], bg: '#b6dcd6', ink: '#1a93a8', accent: '#1a7a8c', art: 'palmSolo', font: 'soft', aka: 'medeni mesec honeymoon vencanje' },
    { id: 'anniversary', other: true, name: 'Naš dan', title: 'Naš dan', sub: 'Godišnjica', cat: ['venc', 'ljub'], bg: '#fbe6ee', ink: '#c1246d', accent: '#c1246d', art: 'calendar', font: 'soft', aka: 'nas dan godisnjica anniversary datum' },
    { id: 'love', other: true, name: 'Ljubav', title: 'Ljubav', sub: '', cat: ['ljub'], bg: '#f7bccd', ink: '#fff', accent: '#a51d4d', art: 'loveHeart', font: 'soft', aka: 'ljubav love poklon par' },
    { id: 'couple', other: true, name: 'Za njega i nju', title: 'Za nas dvoje', sub: 'Travelbook', cat: ['ljub'], bg: '#d4c1f4', ink: '#1f2a6b', accent: '#d6336c', art: 'planeHeart', font: 'soft', aka: 'za njega i nju par travelbook poklon ljubav' },
  ];

  const CUSTOM = { id: 'custom', name: 'Osnovni dizajn', title: 'Tvoja priča', sub: '', cat: [], bg: '#65c8f6', ink: '#153a55', accent: '#153a55', art: 'compass', aka: '' };

  /* Šabloni: dobijaju naziv bilo koje destinacije. Privremeni crteži, zamenjuju se pravim dizajnima. */
  const TEMPLATES = [
    { id: 't-sun', name: 'Sunce i more', bg: '#fde7c3', ink: '#e4572e', accent: '#2a8fd0', art: 'sunsea' },
    { id: 't-mount', name: 'Planine', bg: '#d9ecef', ink: '#284b63', accent: '#3c6e71', art: 'mountains' },
    { id: 't-plane', name: 'Let', bg: '#e8e1f7', ink: '#1f2a6b', accent: '#d6336c', art: 'plane' },
    { id: 't-case', name: 'Kofer', bg: '#fbe27c', ink: '#1f2a6b', accent: '#c1246d', art: 'suitcase' },
    { id: 't-balloon', name: 'Balon', bg: '#bfe3f7', ink: '#ffffff', accent: '#1f2a6b', art: 'balloon' },
    { id: 't-palm', name: 'Palma', bg: '#f7d6c4', ink: '#1a7a8c', accent: '#1a7a8c', art: 'palmSolo' },
    { id: 't-pin', name: 'Mapa', bg: '#eef1e6', ink: '#1f2a6b', accent: '#d6336c', art: 'pin' },
    { id: 't-wave', name: 'Talas', bg: '#e3eef0', ink: '#0d7d8c', accent: '#0d7d8c', art: 'wave' },
    { id: 't-flower', name: 'Cvet', bg: '#ffe3ec', ink: '#c1246d', accent: '#c1246d', art: 'hibiscusBig' },
    { id: 't-camera', name: 'Uspomene', bg: '#1f2a6b', ink: '#ffffff', accent: '#fbe27c', art: 'camera' },
    { id: 't-minimal', name: 'Minimal', bg: '#f6f2ea', ink: '#153a55', accent: '#a48745', art: 'minimal' },
  ].map((t) => Object.assign({ template: true, cat: [], sub: '', title: '', aka: '' }, t));

  /* Naslov uvek popunjava širinu korice, koliko god da je dugačak. Korice koriste isključivo Raleway. */
  const ctx = document.createElement('canvas').getContext('2d');
  const FAMILY = "Raleway, 'Helvetica Neue', Arial, sans-serif";
  const LOOKS = { upper: { weight: 900, upper: true, max: 134 }, soft: { weight: 800, upper: false, max: 104 } };
  const fitSize = (text, cfg, width) => {
    ctx.font = `${cfg.weight} 100px ${FAMILY}`;
    const w = ctx.measureText(text).width || 1;
    return Math.min(cfg.max, (100 * width) / w);
  };
  const esc = (s) => String(s).replace(/[&<>"]/g, (m) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[m]));

  function coverSVG(c, o = {}) {
    const cfg = LOOKS[c.font || 'upper'];
    const bg = o.bg || c.bg, ink = o.ink || c.ink, accent = o.accent || c.accent;
    const raw = (o.title !== undefined && o.title !== '' ? o.title : c.title) || ' ';
    const title = cfg.upper ? raw.toUpperCase() : raw;
    const sub = o.sub !== undefined ? o.sub : c.sub;
    const year = o.year !== undefined ? o.year : '';
    const size = f(fitSize(title, cfg, 368));
    const base = f(32 + size * 0.72);
    ctx.font = `${cfg.weight} ${size}px ${FAMILY}`;
    const right = f(Math.min(396, 210 + ctx.measureText(title).width / 2));
    let txt = `<text x="210" y="${base}" text-anchor="middle" font-family="${esc(FAMILY)}" font-weight="${cfg.weight}" font-size="${size}" fill="${ink}" letter-spacing="${cfg.upper ? -1 : -0.5}">${esc(title)}</text>`;
    let y = base + 28;
    if (c.subBottom && sub) {
      txt += `<text x="210" y="552" text-anchor="middle" font-family="${esc(FAMILY)}" font-weight="800" font-size="46" fill="${accent}">${esc(sub)}</text>`;
    } else if (sub) {
      txt += `<text x="${right}" y="${y}" text-anchor="end" font-family="${esc(FAMILY)}" font-weight="800" font-size="23" fill="${accent}">${esc(cfg.upper ? sub.toUpperCase() : sub)}</text>`;
      y += 26;
    }
    if (year && !c.subBottom) {
      txt += `<text x="${right}" y="${y}" text-anchor="end" font-family="${esc(FAMILY)}" font-weight="800" font-size="21" fill="${accent}">${esc(year)}</text>`;
    }
    return `<svg class="cover-svg" viewBox="0 0 420 594" preserveAspectRatio="xMidYMid slice" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="${esc(title)}" style="color:${accent};font-variant-numeric:lining-nums"><rect width="420" height="594" fill="${bg}"/>${ART[c.art]()}${txt}</svg>`;
  }

  /* Zadnja korica: iste boje kao prednja, fotografije iz knjige i natpis. */
  function backSVG(c, o) {
    const cfg = LOOKS[c.font || 'upper'];
    const raw = o.title || ' ';
    const title = cfg.upper ? raw.toUpperCase() : raw;
    const text = !o.slots.length;
    const size = f(Math.min(text ? cfg.max : 58, fitSize(title, cfg, 348)));
    const base = f(text ? 310 : 532);
    let out = `<rect width="420" height="594" fill="${o.bg}"/>`;
    o.slots.forEach((s) => {
      out += s.href
        ? `<image href="${s.href}" x="${s.x}" y="${s.y}" width="${s.w}" height="${s.h}" preserveAspectRatio="xMidYMid slice"/>`
        : `<rect x="${s.x}" y="${s.y}" width="${s.w}" height="${s.h}" rx="3" fill="#fff" opacity=".4"/>`;
    });
    out += `<text x="210" y="${base}" text-anchor="middle" font-family="${esc(FAMILY)}" font-weight="${cfg.weight}" font-size="${size}" fill="${o.ink}" letter-spacing="-.5">${esc(title)}</text>`;
    if (o.sub) out += `<text x="210" y="${f(base + 27)}" text-anchor="middle" font-family="${esc(FAMILY)}" font-weight="800" font-size="20" fill="${o.accent}">${esc(cfg.upper ? o.sub.toUpperCase() : o.sub)}</text>`;
    return `<svg class="cover-svg" viewBox="0 0 420 594" preserveAspectRatio="xMidYMid slice" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="Zadnja korica">${out}</svg>`;
  }

  /* Rikna: natpis duž ivice knjige, u bojama korica. */
  function spineSVG(c, o) {
    const cfg = LOOKS[c.font || 'upper'];
    const raw = o.text || ' ';
    const text = cfg.upper ? raw.toUpperCase() : raw;
    const year = o.year ? esc(o.year) : '';
    const room = year ? 440 : 520;
    ctx.font = `800 100px ${FAMILY}`;
    const size = f(Math.min(24, (100 * room) / (ctx.measureText(text).width || 1)));
    const y = f(size * 0.35);
    return `<svg class="cover-svg" viewBox="0 0 46 594" preserveAspectRatio="none" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="Bočna strana"><rect width="46" height="594" fill="${o.bg}"/><g transform="translate(23 594) rotate(-90)"><text x="${year ? 332 : 297}" y="${y}" text-anchor="middle" font-family="${esc(FAMILY)}" font-weight="800" font-size="${size}" fill="${o.ink}">${esc(text)}</text>${year ? `<text x="28" y="${f(13 * 0.35)}" text-anchor="start" font-family="${esc(FAMILY)}" font-weight="800" font-size="13" fill="${o.ink}" opacity=".85" style="font-variant-numeric:lining-nums">${year}</text>` : ''}</g></svg>`;
  }

  /* Korice iz Figme (covers-data.js) + raniji crtani dizajni koji ostaju u ponudi */
  const OLD_CONT = { japan: 'azija', srilanka: 'azija', zanzibar: 'afrika', dominican: 'amerika', sanfrancisco: 'amerika', newyork: 'amerika', montenegro: 'evropa', hercegnovi: 'evropa' };
  const OLD_COUNTRY = { barcelona: 'Španija', paris: 'Francuska', santorini: 'Grčka', hercegnovi: 'Crna Gora', zanzibar: 'Tanzanija', prague: 'Češka', sanfrancisco: 'SAD', newyork: 'SAD', vienna: 'Austrija', madeira: 'Portugal' };
  OLD.forEach((c) => { c.old = true; c.top = 1; if (!c.other) { c.cont = OLD_CONT[c.id] || 'evropa'; c.country = OLD_COUNTRY[c.id] || ''; } });
  const FONTS = (window.TT_DATA || {}).fonts || {};
  if (Object.keys(FONTS).length) {
    const l = document.createElement('link');
    l.rel = 'stylesheet';
    l.href = 'https://fonts.googleapis.com/css2?' + Object.entries(FONTS).map(([f, w]) => 'family=' + f.replace(/ /g, '+') + (w.length > 1 || w[0] !== 400 ? ':wght@' + w.join(';') : '')).join('&') + '&display=swap';
    document.head.appendChild(l);
  }
  const FIG = ((window.TT_DATA || {}).covers || []).map((c) => Object.assign(c, { aka: c.aka || `${c.title} ${c.country || ''} ${c.sub || ''}`.toLowerCase() }));
  // na sajtu su samo korice iz Figme (stari crteži se više ne prikazuju)
  const COVERS = [...FIG];

  const svgCover = coverSVG;
  const anyCover = (c, o) => (c.fig ? window.TTF.figmaSVG(c, o) : svgCover(c, o));
  window.TT = { COVERS, CUSTOM, TEMPLATES: [], coverSVG: anyCover, backSVG, spineSVG };
})();
