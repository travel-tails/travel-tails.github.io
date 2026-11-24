/* Deo "Ski trip" (Putovanja): 5 korica iz Figme (fajl mWhEdGw8E7661GjmSLfXPu, sekcija ski trip).
   Ilustracije su iste kao kod ranijih ski korica, pa se koriste postojeće slike (korice/ i masters/ u punoj rezoluciji);
   tekst je kao u novim dizajnima. Ranije ski korice (Skijanje u "Drugo") se više ne prikazuju. */
(function () {
  const TT = window.TT;
  if (!TT) return;
  const OLD = new Set(['n248495', 'n248540', 'n313840', 'n313117', 'n313114', 'n313835']);
  for (let i = TT.COVERS.length - 1; i >= 0; i--) if (OLD.has(TT.COVERS[i].id)) TT.COVERS.splice(i, 1);

  const fig = (n) => ({ art: `korice/1173-${n}.webp`, master: `masters/1173-${n}.webp` });
  const T_L = (c) => ({ r: 't', s: 'SKI TRIP', x: 107, y: 56, w: 2258, h: 728, wt: 900, z: 620, ls: -37.2, lh: 0, c, a: 'L', up: 1 });
  const T_C = (c, y) => ({ r: 't', s: 'SKI TRIP', x: 71, y, w: 2338, h: 500, wt: 900, z: 630, ls: -31.5, lh: 500, c, a: 'C', up: 0 });
  const base = { title: 'SKI TRIP', sub: '', year: '', bg: '#ffffff', name: 'Ski trip', country: '', cont: 'evropa', ski: true, top: 1,
    aka: 'ski trip skijanje skijanje ski zima winter planina planine snowboard sneg' };
  const LIST = [
    // žičara, DOLOMITES
    { id: 'ski1', ink: '#aee0e5', accent: '#dd361c', sub: 'DOLOMITES', figma: 'P',
      fig: Object.assign(fig('248495'), { bb: [107, 1045, 2372, 3310], T: [T_L('#aee0e5'), { r: 's', s: 'DOLOMITES', x: 1252, y: 680, w: 1058, h: 235, wt: 900, z: 200, ls: -12, lh: 0, c: '#dd361c', a: 'L', up: 1 }] }) },
    // štitnici za uši, 2026
    { id: 'ski2', ink: '#9ac5e5', accent: '#9ac5e5', year: '2026', figma: 'Frame 18707',
      fig: Object.assign(fig('248540'), { bb: [0, 303, 2480, 3508], T: [Object.assign(T_L('#9ac5e5'), { x: 111, y: 140 }), { r: 'y', s: '2026', x: 1803, y: 727, w: 398, h: 282, wt: 800, z: 240, ls: -14.4, lh: 0, c: '#9ac5e5', a: 'L', up: 0 }] }) },
    // naočare, 2026
    { id: 'ski3', ink: '#7eaeff', accent: '#6b6c71', year: '2026', figma: 'NY 2',
      fig: Object.assign(fig('313840'), { bb: [16, 1185, 2439, 2932], T: [T_C('#7eaeff', 161), { r: 'y', s: '2026', x: 1694, y: 628, w: 398, h: 282, wt: 800, z: 240, ls: -14.4, lh: 0, c: '#6b6c71', a: 'L', up: 0 }] }) },
    // ski lift
    { id: 'ski4', ink: '#25adde', accent: '#25adde', figma: 'prednja',
      fig: Object.assign(fig('313117'), { bb: [0, 1160, 2480, 3508], T: [T_C('#25adde', 192)] }) },
    // pahulje
    { id: 'ski5', ink: '#9e9e9e', accent: '#9e9e9e', figma: 'Prednja korica',
      fig: Object.assign(fig('312860'), { bb: [279, 999, 2076, 3043], T: [T_C('#9e9e9e', 192)] }) },
  ].map((c) => Object.assign({}, base, c));
  // na početak, da u "Ski trip" idu ovim redom kao u Figmi
  TT.COVERS.unshift(...LIST);
})();
