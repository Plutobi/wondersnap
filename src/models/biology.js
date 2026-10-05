// Biology: a DNA double helix that UNZIPS when you open your hand, and an animal cell with its organelles.
import { line, polyline, tube, paramSurface, torus, TAU } from '../lib/sampling.js';
import { add, sub, mul, norm, cross, linspace } from '../lib/vec.js';
import { makeRng } from '../lib/rng.js';
import { pathTube, blob, capsule, sphere, dots, vessel } from '../lib/shapes.js';
import { G } from './engines.js';

// ============================================================ DNA (B-form: 10 base pairs per turn)
function dna() {
  const turns = 2, H = 480, R = 70, n = turns * 10, rng = makeRng(21);
  const s1 = (t) => { const a = TAU * turns * t; return [R * Math.cos(a), -H / 2 + H * t, R * Math.sin(a)]; };
  const s2 = (t) => { const a = TAU * turns * t + Math.PI * 0.8; return [R * Math.cos(a), -H / 2 + H * t, R * Math.sin(a)]; };   // minor/major groove offset
  const dense = linspace(0, 1, 160);
  const back1 = [pathTube(dense.map(s1), 6, 1.1)], back2 = [pathTube(dense.map(s2), 6, 1.1)];
  const PAIR = { A: 'T', T: 'A', G: 'C', C: 'G' };
  const bases = { 1: { A: [], T: [], G: [], C: [] }, 2: { A: [], T: [], G: [], C: [] } }, hbonds = [];
  for (let i = 0; i < n; i++) {
    const t = (i + 0.5) / n, p1 = s1(t), p2 = s2(t), mid = mul(add(p1, p2), 0.5);
    const b = 'ATGC'[Math.floor(rng.random() * 4)];
    back1.push(sphere(p1, 9, 1.2)); back2.push(sphere(p2, 9, 1.2));          // phosphate groups
    const gap = mul(norm(sub(p2, p1)), 4);
    bases[1][b].push(tube(p1, sub(mid, gap), 5, 5, 1.3));
    bases[2][PAIR[b]].push(tube(p2, add(mid, gap), 5, 5, 1.3));
    const k = b === 'G' || b === 'C' ? 3 : 2;                                // G-C: 3 hydrogen bonds, A-T: 2
    const side = norm(cross(sub(p2, p1), [0, 1, 0]));
    for (let h = 0; h < k; h++) hbonds.push(line(add(sub(mid, gap), mul(side, (h - (k - 1) / 2) * 5)), add(add(mid, gap), mul(side, (h - (k - 1) / 2) * 5)), 0.6, 4));
  }
  const COL = { A: [1.0, 0.35, 0.35], T: [0.4, 1.0, 0.45], G: [0.35, 0.6, 1.0], C: [1.0, 0.85, 0.3] };
  const NAME = { A: 'Adenine (A)', T: 'Thymine (T)', G: 'Guanine (G)', C: 'Cytosine (C)' };
  const INFO = { A: 'always pairs with thymine (2 bonds)', T: 'always pairs with adenine', G: 'pairs with cytosine (3 bonds)', C: 'always pairs with guanine' };
  const out = [
    G('Backbone (sugar-phosphate)', [0.8, 0.85, 1.0], [-190, 0, 0], 0, back1, { info: 'the two rails of the twisted ladder' }),
    G('Backbone (L)', [0.8, 0.85, 1.0], [190, 0, 0], 0, back2, { showLabel: false }),
    G('Hydrogen bonds', [1.0, 1.0, 1.0], [0, 0, 60], 0.15, hbonds, { info: 'weak links: DNA unzips here to copy itself' }),
  ];
  for (const b of 'ATGC') {
    if (bases[1][b].length) out.push(G(NAME[b], COL[b], [-150, 0, 0], 0.05, bases[1][b], { info: INFO[b] }));
    if (bases[2][b].length) out.push(G(NAME[b] + (bases[1][b].length ? ' (L)' : ''), COL[b], [150, 0, 0], 0.05, bases[2][b], { showLabel: !bases[1][b].length, info: INFO[b] }));
  }
  return out;
}

// ============================================================ ANIMAL CELL (~0.1 µm units)
function cell() {
  const rng = makeRng(8);
  const mem = (front) => [blob([0, 0, 0], [200, 170, 185], { density: 0.4, keep: (x, y, z) => (front ? z >= 0 : z < 0), bump: (u, v) => 1 + 0.03 * Math.sin(5 * u + 2 * Math.sin(3 * v)) })];
  const nuc = [-20, 10, 0];
  const nucleus = [sphere(nuc, 70, 0.7), sphere(nuc, 74, 0.3)];
  const pores = [];
  for (let i = 0; i < 40; i++) { const d = norm([rng.normal(), rng.normal(), rng.normal()]); pores.push(add(nuc, mul(d, 74))); }
  nucleus.push(dots(pores, 2.5, 1.4));
  for (let s = 0; s < 18; s++) {                                             // chromatin
    let p = add(nuc, [rng.normal() * 25, rng.normal() * 25, rng.normal() * 25]); const pts = [p];
    for (let k = 0; k < 12; k++) { p = add(p, [rng.normal() * 9, rng.normal() * 9, rng.normal() * 9]); if (Math.hypot(...sub(p, nuc)) < 60) pts.push(p); }
    if (pts.length > 1) nucleus.push(polyline(pts, 0, 2.5));
  }
  const nucleolus = [sphere(add(nuc, [10, 15, 10]), 22, 1.4)];
  const mito = [];
  for (let i = 0; i < 7; i++) {
    const a = (i / 7) * TAU + 0.3, c = [140 * Math.cos(a) + 10, 95 * Math.sin(a) - 10, (rng.random() - 0.5) * 120];
    const d = norm([Math.cos(a + 1.3), Math.sin(a + 1.3), rng.random() - 0.5]), p0 = add(c, mul(d, -26)), p1 = add(c, mul(d, 26));
    mito.push(capsule(p0, p1, 15, 0.9));
    const side = norm(cross(d, [0, 0, 1])), zig = linspace(0, 1, 11).map((t, k) => add(add(p0, mul(d, 52 * t)), mul(side, k % 2 ? 11 : -11)));
    mito.push(polyline(zig, 0, 4));                                           // cristae
  }
  const shell = (r, u0, u1, v0, v1) => paramSurface((u, v) => { const rr = r + 3 * Math.sin(12 * u); return add(nuc, [rr * Math.cos(v) * Math.cos(u), rr * Math.sin(v), rr * Math.cos(v) * Math.sin(u)]); }, u0, u1, v0, v1, { density: 0.7, gu: 20, gv: 8 });
  const rough = [shell(90, 0.3, 2.2, -0.6, 0.6), shell(102, 0.3, 2.2, -0.6, 0.6), shell(114, 0.3, 2.2, -0.6, 0.6)];
  const ribo = [];
  for (let i = 0; i < 220; i++) { const r = [92, 104, 116][i % 3] + 2, u = 0.3 + rng.random() * 1.9, v = -0.6 + rng.random() * 1.2; ribo.push(add(nuc, [r * Math.cos(v) * Math.cos(u), r * Math.sin(v), r * Math.cos(v) * Math.sin(u)])); }
  rough.push(dots(ribo, 1.8, 1.5));
  const smooth = [];
  for (let k = 0; k < 6; k++) {
    const pts = []; let p = add(nuc, [-95 + rng.normal() * 10, rng.normal() * 40, rng.normal() * 40]);
    for (let i = 0; i < 6; i++) { pts.push(p); p = add(p, [-10 + rng.normal() * 10, rng.normal() * 18, rng.normal() * 18]); }
    smooth.push(vessel(pts, 4, 4, 1.2, 5));
  }
  const golgiC = [100, -70, 40], golgi = [];
  for (let k = 0; k < 5; k++) golgi.push(paramSurface((r, a) => { const rr = 40 - k * 3; return add(golgiC, [rr * r * Math.cos(a), k * 8 - 16 + 0.012 * (rr * r) ** 2, rr * 0.55 * r * Math.sin(a)]); }, 0.15, 1, 0, TAU, { density: 1.1, gu: 6, gv: 24 }));
  golgi.push(dots(linspace(0, 1, 14).map((t) => add(golgiC, [45 * Math.cos(t * TAU), 30 + 8 * Math.sin(t * 9), 25 * Math.sin(t * TAU)])), 3.5, 1.2));
  const lyso = [];
  for (let i = 0; i < 6; i++) { const a = rng.random() * TAU; lyso.push(sphere([120 * Math.cos(a), 110 * Math.sin(a) * 0.6 + 40, (rng.random() - 0.5) * 140], 11, 1.3)); }
  const cen = [60, 95, -30];
  const centrioles = [paramSurface((u, h) => add(cen, [8 * Math.cos(u), -15 + 30 * h, 8 * Math.sin(u)]), 0, TAU, 0, 1, { density: 1.5, gu: 18, gv: 4 }),
    paramSurface((u, h) => add(cen, [5 + 30 * h, 8 * Math.cos(u), 8 * Math.sin(u)]), 0, TAU, 0, 1, { density: 1.5, gu: 18, gv: 4 })];
  const skel = [];
  for (let i = 0; i < 34; i++) { const d = norm([rng.normal(), rng.normal(), rng.normal()]); skel.push(line(cen, [d[0] * 185, d[1] * 155, d[2] * 170], 0, 0.7)); }
  const free = [];
  for (let i = 0; i < 180; i++) { const d = norm([rng.normal(), rng.normal(), rng.normal()]), r = 90 + rng.random() * 90; free.push([d[0] * r, d[1] * r * 0.85, d[2] * r * 0.9]); }
  return [
    G('Cell membrane', [0.5, 0.85, 1.0], [0, 0, 270], 0, mem(true), { info: 'gatekeeper: controls what gets in and out' }),
    G('Cell membrane (back)', [0.5, 0.85, 1.0], [0, 0, -270], 0, mem(false), { showLabel: false }),
    G('Nucleus', [0.75, 0.5, 1.0], [-90, 60, 0], 0.1, nucleus, { info: 'holds the DNA: the control centre' }),
    G('Nucleolus', [1.0, 0.4, 0.8], [-60, 170, 60], 0.3, nucleolus, { info: 'builds the ribosomes' }),
    G('Mitochondria', [1.0, 0.55, 0.25], [160, -20, 70], 0.15, mito, { info: 'power plants: turn food into ATP energy' }),
    G('Rough ER', [0.4, 0.9, 1.0], [-40, -150, 0], 0.15, rough, { info: 'ribosome-studded folds that make proteins' }),
    G('Smooth ER', [0.4, 1.0, 0.7], [-190, -60, 0], 0.2, smooth, { info: 'makes fats, clears toxins' }),
    G('Golgi apparatus', [1.0, 0.85, 0.35], [190, -120, 40], 0.2, golgi, { info: 'packs and ships proteins' }),
    G('Lysosomes', [1.0, 0.35, 0.35], [60, 170, 0], 0.25, lyso, { info: 'recycling bins full of enzymes' }),
    G('Centrioles', [0.9, 1.0, 0.5], [110, 170, -60], 0.3, centrioles, { info: 'organise the split when a cell divides' }),
    G('Cytoskeleton', [0.8, 0.8, 1.0], [0, 0, -80], 0.25, skel, { info: 'scaffolding and transport rails' }),
    G('Free ribosomes', [0.95, 0.95, 0.95], [0, -40, 140], 0.3, [dots(free, 2, 1.2)], { info: 'read RNA and build proteins' }),
  ];
}

// ============================================================ MALARIA-INFECTED RED BLOOD CELL (1 unit = 0.05 µm)
function malariaRbc() {
  const rng = makeRng(17), R = 78;                                          // 7.8 µm wide biconcave disc
  // Evans-Fung biconcave profile: thin dimple in the middle (~0.8 µm), thick rim (~2.4 µm)
  const h = (r) => 39 * Math.sqrt(Math.max(0, 1 - r * r)) * (0.207 + 2.003 * r * r - 1.123 * r ** 4);
  const face = (s) => paramSurface((r, a) => [R * r * Math.cos(a), s * h(r), R * r * Math.sin(a)], 0, 1, 0, TAU, { density: 0.5, gu: 24, gv: 48 });
  // PfEMP1 knobs: sticky bumps the parasite pushes onto the surface, mostly on the upper face
  const knobs = [];
  for (let i = 0; i < 90; i++) { const r = Math.sqrt(rng.random()) * 0.97, a = rng.random() * TAU, s = rng.random() < 0.7 ? 1 : -1; knobs.push([R * r * Math.cos(a), s * (h(r) + 2), R * r * Math.sin(a)]); }
  // ring stage: thin cytoplasm ring + 1-2 chromatin dots ("headphone" look)
  const ringC = [-30, 0, 18];
  const ring = [torus(ringC, 11, 2.2, [0, 1, 0], 1.4)];
  const chromatin = [sphere(add(ringC, [11, 0, 0]), 3.5, 2), sphere(add(ringC, [-11, 0, 0]), 3, 2)];
  // trophozoite: larger amoeboid parasite digesting haemoglobin, packed with dark haemozoin crystals
  const trophC = [28, 0, -12];
  const troph = [blob(trophC, [22, 9, 17], { density: 1.1, bump: (u, v) => 1 + 0.12 * Math.sin(3 * u) * Math.cos(2 * v) })];
  const hz = [];
  for (let i = 0; i < 40; i++) hz.push(add(trophC, [rng.normal() * 7, rng.normal() * 3, rng.normal() * 6]));
  const haemozoin = [dots(hz, 1.2, 2)];
  // Maurer's clefts: flat membrane slits in the host cytoplasm that ferry parasite proteins to the knobs
  const clefts = [];
  for (let i = 0; i < 12; i++) {
    const a = rng.random() * TAU, r = 45 + rng.random() * 22, c = [r * Math.cos(a), (rng.random() - 0.5) * 10, r * Math.sin(a)], d = [-Math.sin(a), 0, Math.cos(a)];
    clefts.push(polyline([add(c, mul(d, -7)), add(c, [0, 2, 0]), add(c, mul(d, 7))], 0.8, 3));
  }
  return [
    G('Red cell membrane', [1.0, 0.3, 0.3], [0, 70, 0], 0, [face(1)], { info: 'biconcave disc, 7.8 µm: bends to squeeze through capillaries' }),
    G('Red cell membrane (lower)', [1.0, 0.3, 0.3], [0, -70, 0], 0, [face(-1)], { showLabel: false }),
    G('PfEMP1 knobs', [1.0, 0.85, 0.3], [0, 110, 0], 0.1, [dots(knobs, 1.8, 1.6)], { info: 'sticky proteins that glue infected cells to vessel walls' }),
    G('Ring stage parasite', [0.45, 0.7, 1.0], [-60, 0, 40], 0.15, ring, { info: 'young Plasmodium: the ring seen on a blood smear' }),
    G('Chromatin dots', [0.85, 0.45, 1.0], [-80, 30, 55], 0.2, chromatin, { info: 'parasite DNA: the purple dots in Giemsa stain' }),
    G('Trophozoite', [0.35, 0.95, 0.75], [60, 0, -40], 0.15, troph, { info: 'feeding stage: digests the cell\'s haemoglobin' }),
    G('Haemozoin crystals', [0.95, 0.95, 0.95], [85, 30, -60], 0.25, haemozoin, { info: 'malaria pigment: detoxified waste from haemoglobin' }),
    G("Maurer's clefts", [1.0, 0.6, 0.85], [0, -30, 90], 0.2, clefts, { info: 'shuttles parasite proteins to the cell surface' }),
  ];
}

// ============================================================ ANOPHELES MOSQUITO, female (1 unit = 0.02 mm; head points +x)
function mosquito() {
  const rng = makeRng(33), sides = [1, -1];
  const head = [sphere([40, 0, 0], 11, 1.2)];
  const eyes = sides.map((s) => blob([42, 3, s * 8], [8, 10, 6], { density: 1.6 }));
  // Anopheles tell-tale: the palps are as long as the proboscis (Culex / Aedes females have short palps)
  const proboscis = [tube([50, -3, 0], [128, -30, 0], 2.2, 1.1, 2)];
  const palps = sides.map((s) => tube([49, 0, s * 3], [124, -24, s * 6], 1.6, 1.0, 2));
  const antennae = [];
  for (const s of sides) {
    const a0 = [46, 7, s * 5], a1 = [84, 34, s * 20];
    antennae.push(line(a0, a1, 0.9, 3));
    for (let k = 1; k <= 12; k++) {                                          // whorls of fine hairs at each flagellomere
      const c = add(a0, mul(sub(a1, a0), k / 13));
      for (let h = 0; h < 5; h++) { const a = (h / 5) * TAU + k; antennae.push(line(c, add(c, [0, 4 * Math.cos(a), 4 * Math.sin(a)]), 0, 3)); }
    }
  }
  const thorax = [blob([2, 6, 0], [30, 26, 21], { density: 0.8, bump: (u, v) => 1 + 0.12 * Math.max(0, Math.sin(v)) })];
  // abdomen: 8 tapering segments angled down and back
  const abdomen = [];
  for (let k = 0; k < 8; k++) {
    const t = k / 7, c = [-32 - 18 * k, -6 - 4 * k, 0], r = 17 - 8 * t;
    abdomen.push(blob(c, [9.5, r, r * 0.95], { density: 0.8 }));
  }
  // wings: flat membrane with veins; Anopheles wings carry dark scale spots along the leading edge
  const wing = (s) => {
    const root = [4, 26, s * 16], span = norm([-0.45, 0.08, s * 1]), chord = norm(cross(span, [0, 1, 0])), L = 150, W = 36;
    const at = (u, v) => add(add(root, mul(span, L * u)), mul(chord, W * v * Math.sqrt(Math.max(0, u * (1.08 - u)))));
    const out = [paramSurface((u, v) => at(u, v), 0, 1, -1, 1, { density: 0.45, gu: 30, gv: 8 })];
    for (const v of [-0.8, -0.45, 0, 0.45, 0.8]) out.push(polyline(linspace(0.02, 0.98, 20).map((u) => at(u, v)), 0.6, 2));
    out.push(dots([0.15, 0.3, 0.45, 0.6, 0.75, 0.9].map((u) => at(u, 0.85 * s * Math.sign(chord[0] || 1))), 3.5, 1.5));
    return out;
  };
  const halteres = sides.map((s) => [line([-18, 14, s * 12], [-26, 26, s * 22], 0.8, 3), sphere([-26, 26, s * 22], 3.5, 2)]).flat();
  // six legs: coxa at the thorax, knee up and out, then long tibia + tarsus down to the ground
  const legs = [];
  for (const [bx, dx] of [[20, 55], [2, 10], [-16, -50]]) for (const s of sides) {
    const base = [bx, -14, s * 8], knee = [bx + dx * 0.6, 22, s * 62], ankle = [bx + dx, -55, s * 95], foot = [bx + dx * 1.3, -110, s * 118];
    legs.push(tube(base, knee, 2.4, 1.8, 0.8), tube(knee, ankle, 1.8, 1.3, 0.8), tube(ankle, foot, 1.2, 0.7, 0.8));
  }
  // inside the mosquito: where Plasmodium develops (oocysts on the midgut) and waits (sporozoites in the salivary glands)
  const midgut = [blob([-75, -20, 0], [48, 10, 9], { density: 1.2 })];
  const oo = [];
  for (let i = 0; i < 25; i++) { const x = -110 + rng.random() * 70; oo.push([x, -20 + (rng.random() < 0.5 ? 1 : -1) * 10, (rng.random() - 0.5) * 16]); }
  const oocysts = [dots(oo, 2.5, 2)];
  const glands = [];
  for (const s of sides) for (const [dy, dz] of [[4, 4], [-3, 7], [-8, 2]]) glands.push(capsule([30, dy, s * dz], [8, dy - 4, s * (dz + 3)], 3.5, 1.6));
  const spz = [];
  for (let i = 0; i < 120; i++) spz.push([8 + rng.random() * 22, -6 + rng.random() * 10, (rng.random() < 0.5 ? 1 : -1) * (2 + rng.random() * 9)]);
  return [
    G('Proboscis', [1.0, 0.75, 0.4], [70, -20, 0], 0.05, proboscis, { info: 'needle-like mouthparts: pierce skin and inject saliva' }),
    G('Maxillary palps', [1.0, 0.9, 0.6], [60, 10, 0], 0.1, palps, { info: 'as long as the proboscis: the Anopheles ID mark' }),
    G('Antennae', [0.8, 0.85, 0.7], [40, 50, 0], 0.1, antennae, { info: 'smell CO2 and sweat to find a human host' }),
    G('Compound eyes', [0.85, 0.35, 0.3], [50, 20, 0], 0.05, eyes, { info: 'hundreds of lenses: sense movement in dim light' }),
    G('Head', [0.75, 0.6, 0.45], [40, 0, 0], 0, head, { info: 'carries the sensors and mouthparts' }),
    G('Thorax', [0.7, 0.55, 0.4], [0, 0, 0], 0, thorax, { info: 'packed with flight muscle: ~500 wingbeats a second' }),
    G('Wings', [0.85, 0.9, 1.0], [0, 60, 40], 0.1, wing(1), { info: 'spotted with dark scales in Anopheles' }),
    G('Wings (L)', [0.85, 0.9, 1.0], [0, 60, -40], 0.1, wing(-1), { showLabel: false }),
    G('Halteres', [1.0, 0.95, 0.5], [-20, 45, 0], 0.2, halteres, { info: 'tiny gyroscopes that keep flight stable' }),
    G('Legs', [0.65, 0.55, 0.45], [0, -60, 0], 0.1, legs, { info: 'six legs; rests with its body tilted at ~45°' }),
    G('Abdomen', [0.8, 0.5, 0.35], [-70, -10, 0], 0.05, abdomen, { info: 'swells up to 3× with a blood meal' }),
    G('Midgut', [1.0, 0.4, 0.4], [-60, -70, 0], 0.25, midgut, { info: 'blood meal is digested here; parasites mate here' }),
    G('Oocysts', [0.4, 1.0, 0.6], [-60, -85, 0], 0.3, oocysts, { info: 'Plasmodium cysts on the gut wall, each makes thousands of sporozoites' }),
    G('Salivary glands', [0.5, 0.75, 1.0], [30, -50, 0], 0.25, glands, { info: 'sporozoites gather here, ready to infect with the next bite' }),
    G('Sporozoites', [0.75, 0.55, 1.0], [30, -65, 0], 0.3, [dots(spz, 1.2, 2)], { info: 'infective stage: injected into skin, travel to the liver' }),
  ];
}

export const BIOLOGY = [
  { name: 'DNA Double Helix', groups: dna, color: [0.55, 0.75, 1.0], tilt: 0, viewYaw: 0.0, fact: '3 billion base pairs · 2 m per cell · A-T, G-C' },
  { name: 'Animal Cell', groups: cell, color: [0.5, 0.9, 1.0], tilt: 12, viewYaw: 0.5, fact: '~20 µm · the body has ~37 trillion of them' },
  { name: 'Anopheles Mosquito', groups: mosquito, color: [0.85, 0.65, 0.45], tilt: 18, viewYaw: 0.7, fact: 'female · the only vector of human malaria · ~5 mm' },
  { name: 'Malaria-Infected Red Cell', groups: malariaRbc, color: [1.0, 0.35, 0.35], tilt: 25, viewYaw: 0.3, fact: 'Plasmodium falciparum · 48 h cycle inside one red cell' },
];
