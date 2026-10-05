// Explodable vehicles. Same group format as engines.js. Units: cm, front of the car at +x, y up.
import {
  line, polyline, quad, box, boxEdges, revolve, ring, transform, orient, tube, pipe, disc, paramSurface, torus, helix, ellipsoid,
  TAU,
} from '../lib/sampling.js';
import { rotZ, deg, linspace, norm } from '../lib/vec.js';
import { vessel, blob, sphere } from '../lib/shapes.js';
import { G, COL } from './engines.js';

const X = [1, 0, 0], Y = [0, 1, 0], Z = [0, 0, 1];

// ============================================================ Sports coupé, 440 x 185 x 130 cm, wheelbase 260 cm
function sportsCar() {
  const bottom = 16, belt = 82, wheelY = 34, archR = 40, xF = 128, xR = -132;
  const hoodY = (x) => (x <= 212 ? belt - ((x - 95) / 117) * 16 : 66 - (x - 212) * 0.9);
  const trunkY = (x) => (x >= -205 ? 90 : 90 - (-205 - x) * 0.4);
  const shoulder = (x) => (x > 95 ? hoodY(x) : x < -150 ? trunkY(x) : belt);
  const halfW = (x, y) => {
    const e = Math.max(0, (Math.abs(x) - 165) / 55);
    return 90 * (1 - 0.2 * e * e) * (1 - 0.05 * ((y - 55) / 35) ** 2);
  };
  const archKeep = (x, y) => Math.hypot(x - xF, y - wheelY) > archR && Math.hypot(x - xR, y - wheelY) > archR;

  /** Lower body side panel between x0..x1 on side sgn (+1 = +z), wheel arches cut out, bright seams. */
  const sidePanel = (x0, x1, sgn) => {
    const fn = (x, t) => { const yt = shoulder(x), y = bottom + t * (yt - bottom); return [x, y, sgn * halfW(x, y)]; };
    const P = [paramSurface(fn, x0, x1, 0, 1, { density: 0.55, keep: archKeep, gu: 30, gv: 10 })];
    P.push(polyline(linspace(x0, x1, 24).map((x) => fn(x, 1)), 0, 3), polyline(linspace(x0, x1, 24).map((x) => fn(x, 0)), 0, 2));
    for (const x of [x0, x1]) P.push(polyline(linspace(0, 1, 8).map((t) => fn(x, t)), 0, 2.5));
    for (const wx of [xF, xR]) {
      if (wx + archR < x0 || wx - archR > x1) continue;
      const arc = linspace(0, Math.PI, 30).map((a) => [wx + archR * Math.cos(a), wheelY + archR * Math.sin(a)]).filter(([x]) => x >= x0 && x <= x1);
      if (arc.length > 1) P.push(polyline(arc.map(([x, y]) => [x, y, sgn * halfW(x, y)]), 0, 4));
    }
    return P;
  };
  /** Glass quad on the greenhouse side (z shrinks toward the roof = tumblehome). */
  const gz = (y) => 86 - ((y - belt) / 46) * 22;
  const sideGlass = (pts, sgn) => {
    const q = pts.map(([x, y]) => [x, y, sgn * gz(y)]);
    return [quad(q[0], q[1], q[2], q[3], 0.18), polyline(q, 0, 3, true)];
  };

  const body = {};
  for (const [sgn, tag] of [[-1, 'L'], [1, 'R']]) {
    body['fender' + tag] = sidePanel(95, 219, sgn);
    body['quarter' + tag] = [sidePanel(-219, -60, sgn), sideGlass([[-60, belt], [-150, belt], [-150, 90], [-68, 127]], sgn)];
    body['door' + tag] = [sidePanel(-60, 95, sgn), sideGlass([[95, belt], [-60, belt], [-60, 128], [20, 126]], sgn),
      line([10, 70, sgn * 91], [30, 70, sgn * 91], 0, 6), box([88, 92, sgn * 96], [10, 8, 12], 1.2, 3)];     // handle + mirror
  }
  const hood = [
    paramSurface((x, s) => [x, hoodY(x) + 3 * (1 - s * s), s * halfW(x, hoodY(x)) * 0.97], 95, 212, -1, 1, { density: 0.6, gu: 24, gv: 12 }),
    polyline(linspace(95, 212, 20).map((x) => [x, hoodY(x) + 0.5, 0.97 * halfW(x, hoodY(x))]), 0, 3),
    polyline(linspace(95, 212, 20).map((x) => [x, hoodY(x) + 0.5, -0.97 * halfW(x, hoodY(x))]), 0, 3),
    line([200, 69, -30], [120, 82, -30], 0, 3), line([200, 69, 30], [120, 82, 30], 0, 3),                     // power bulge
  ];
  const roof = [paramSurface((x, s) => [x, 128 + 2 * (1 - s * s) + 1.5 * Math.cos(((x + 25) / 50) * Math.PI / 2), s * 64], -68, 20, -1, 1, { density: 0.6, gu: 16, gv: 10 })];
  roof.push(polyline([[-68, 129, -64], [20, 127, -64]], 0, 4), polyline([[-68, 129, 64], [20, 127, 64]], 0, 4));
  const windshield = [quad([95, belt, -86], [95, belt, 86], [20, 126, 64], [20, 126, -64], 0.2), polyline([[95, belt, -86], [95, belt, 86], [20, 126, 64], [20, 126, -64]], 0, 4, true)];
  const rearWindow = [quad([-68, 128, -64], [-68, 128, 64], [-150, 90, 86], [-150, 90, -86], 0.2), polyline([[-68, 128, -64], [-68, 128, 64], [-150, 90, 86], [-150, 90, -86]], 0, 4, true)];
  const trunk = [paramSurface((x, s) => [x, trunkY(x) + 2 * (1 - s * s), s * halfW(x, 88) * 0.97], -212, -150, -1, 1, { density: 0.6, gu: 12, gv: 12 }),
    line([-212, 92, -40], [-212, 94, 40], 0, 5)];                                                                // spoiler lip
  const fascia = (xf, sgnX, y0, y1) => paramSurface((s, t) => {
    const y = y0 + t * (y1 - y0);
    return [xf - sgnX * (8 * s * s + 3 * (t - 0.5) ** 2), y, s * halfW(xf, y) * 0.93];
  }, -1, 1, 0, 1, { density: 0.55, gu: 16, gv: 8 });
  const frontBumper = [fascia(219, 1, 20, 62), polyline([[221, 28, -42], [221, 28, 42], [221, 46, 42], [221, 46, -42]], 0, 4, true)];
  for (const y of [32, 37, 42]) frontBumper.push(line([221.2, y, -40], [221.2, y, 40], 0, 3));
  const rearBumper = [fascia(-219, -1, 20, 86)];
  const headlights = [], taillights = [];
  for (const s of [-1, 1]) {
    headlights.push(polyline(linspace(0, 2 * Math.PI, 30).map((a) => [214 - 3 * Math.sin(a), 60 + 5 * Math.sin(a), s * (62 + 16 * Math.cos(a))]), 0, 7));
    headlights.push(paramSurface((a, r) => [214, 60 + 5 * r * Math.sin(a), s * (62 + 16 * r * Math.cos(a))], 0, 2 * Math.PI, 0, 1, { density: 1.2, gu: 16, gv: 4 }));
    taillights.push(line([-220, 78, s * 30], [-219, 78, s * 82], 0, 8), line([-220, 72, s * 30], [-219, 72, s * 82], 0, 5));
  }
  taillights.push(line([-220.5, 80, -30], [-220.5, 80, 30], 0, 5));

  // ---- chassis, drivetrain, interior
  const frame = [];
  for (const s of [-1, 1]) frame.push(box([0, 22, s * 50], [400, 7, 7], 0.8, 3));
  for (const x of [-180, -90, 0, 90, 180]) frame.push(box([x, 22, 0], [6, 6, 100], 0.8, 3));
  frame.push(quad([-200, 18, -75], [200, 18, -75], [200, 18, 75], [-200, 18, 75], 0.08));
  const engine = [box([150, 45, 0], [56, 34, 48], 0.45, 3), box([150, 68, 0], [56, 12, 44], 0.5, 3), box([150, 79, 0], [58, 8, 38], 0.6, 3)];
  engine.push(tube([118, 80, -30], [182, 80, -30], 7, 7, 1));
  for (const x of [130, 143, 157, 170]) engine.push(pipe([[x, 80, -30], [x, 72, -24]], 3, 1.5), tube([x, 84, 0], [x, 88, 0], 3, 3, 3));
  engine.push(torus([122, 50, 20], 7, 2, X, 2), box([188, 62, 60], [18, 16, 14], 0.8, 3));                        // alternator + battery
  const radiator = [quad([204, 26, -60], [204, 26, 60], [204, 64, 60], [204, 64, -60], 0.5), boxEdges([204, 45, 0], [3, 38, 120], 0, 4)];
  for (let y = 30; y <= 60; y += 5) radiator.push(line([205, y, -58], [205, y, 58], 0, 1.5));
  radiator.push(disc([197, 45, 0], 3, 17, X, 1.3));
  const gearbox = [orient(revolve([0, 13, 63], [22, 18, 11], { density: 0.8 }), [-1, 0, 0], [123, 40, 0]), tube([60, 40, 0], [60, 58, 0], 2, 2, 3), ellipsoid([60, 60, 0], [3, 3, 3], 3)];
  const driveline = [tube([60, 34, 0], [-122, 34, 0], 3.2, 3.2, 2), orient(ring([0, 0, 0], 5, { density: 5 }), X, [-40, 34, 0]),
    ellipsoid([-132, 34, 0], [11, 11, 13], 1.2), tube([-132, 34, -64], [-132, 34, 64], 2.5, 2.5, 2)];
  const exhaust = [pipe([[140, 40, 26], [112, 17, 26], [-100, 17, 26], [-118, 20, 26]], 3.5, 1.2), tube([-118, 20, 26], [-190, 20, 26], 10, 10, 0.7),
    torus([-190, 20, 26], 10, 1, X, 3), tube([-190, 20, 22], [-223, 22, 30], 4, 4, 1.5), tube([-190, 20, 30], [-223, 22, -30], 4, 4, 1.5)];
  const fuel = [box([-95, 27, 0], [50, 16, 70], 0.5, 3), tube([-95, 35, 30], [-175, 70, 88], 2, 2, 2)];
  const seat = (xc, zc, w) => [box([xc, 32, zc], [46, 10, w], 0.55, 3), transform(box([0, 24, 0], [9, 48, w], 0.55, 3), rotZ(deg(12)), [xc - 25, 32, zc]),
    box([xc - 32, 80, zc], [8, 12, w * 0.5], 0.6, 3)];
  const seats = [seat(-5, -36, 42), seat(-5, 36, 42), seat(-88, -34, 38), seat(-88, 34, 38)];
  const dash = [paramSurface((z, t) => [72 + 8 * Math.cos(t * Math.PI), 50 + 22 * t, z], -80, 80, 0, 1, { density: 0.5, gu: 20, gv: 6 }),
    torus([46, 70, -36], 17, 1.8, norm([-0.8, 0.55, 0]), 3), tube([46, 70, -36], [75, 56, -36], 2, 2, 2)];
  for (const a of [0, 2.1, 4.2]) dash.push(line([46, 70, -36], [46 + 13 * Math.cos(a) * -0.55, 70 + 13 * Math.cos(a) * -0.8, -36 + 13 * Math.sin(a)], 0, 4));
  dash.push(tube([30, 22, 0], [22, 46, 0], 1.2, 1.2, 3), ellipsoid([22, 48, 0], [3, 3, 3], 3));                   // gear lever

  const wheel = (wx, sgn) => orient([
    revolve([-12, -12, -9, 9, 12, 12], [21, 29, 34, 34, 29, 21], { density: 0.45 }),
    ring([0, -6, 0], 34.3, { density: 3 }), ring([0, 6, 0], 34.3, { density: 3 }), ring([0, 12, 0], 29, { density: 3 }),
    revolve([-10, 10], [21, 21], { density: 0.6 }), ring([0, 11, 0], 21, { density: 5 }), disc([0, 11, 0], 0, 5, Y, 2),
    ...[0, 1, 2, 3, 4].map((k) => {
      const a = (k / 5) * 2 * Math.PI;
      return quad([4 * Math.cos(a - 0.2), 11, 4 * Math.sin(a - 0.2)], [21 * Math.cos(a - 0.12), 10, 21 * Math.sin(a - 0.12)],
        [21 * Math.cos(a + 0.12), 10, 21 * Math.sin(a + 0.12)], [4 * Math.cos(a + 0.2), 11, 4 * Math.sin(a + 0.2)], 1.6);
    }),
  ], [0, 0, sgn], [wx, wheelY, sgn * 80]);
  const brakes = (sgn) => [xF, xR].map((wx) => [disc([wx, wheelY, sgn * 70], 5, 17, Z, 1.4), torus([wx, wheelY, sgn * 70], 17, 0.6, Z, 3), box([wx - 12, wheelY + 10, sgn * 70], [9, 12, 6], 1.3, 3)]);
  const suspension = (sgn) => [xF, xR].map((wx) => [helix([wx, wheelY + 4, sgn * 58], 5, 40, 6, Y, 3), tube([wx, wheelY, sgn * 58], [wx, wheelY + 50, sgn * 56], 1.6, 1.6, 2),
    line([wx, wheelY - 4, sgn * 70], [wx + 22, 24, sgn * 48], 0, 4), line([wx, wheelY - 4, sgn * 70], [wx - 22, 24, sgn * 48], 0, 4)]);

  const RED = [1.0, 0.18, 0.2], GLASS = [0.55, 0.85, 1.0], PANEL = [1.0, 0.3, 0.25];
  return [
    G('Chassis frame', COL.steel, [0, -30, 0], 0.5, frame),
    G('Hood', RED, [120, 115, 0], 0.0, hood),
    G('Roof', RED, [0, 175, 0], 0.0, roof),
    G('Windshield', GLASS, [65, 120, 0], 0.03, windshield),
    G('Rear window', GLASS, [-65, 120, 0], 0.03, rearWindow, { showLabel: false }),
    G('Trunk lid', RED, [-120, 105, 0], 0.0, trunk),
    G('Doors', RED, [0, 10, 165], 0.02, body.doorR),
    G('Door (L)', RED, [0, 10, -165], 0.02, body.doorL, { showLabel: false }),
    G('Front fenders', PANEL, [45, 0, 125], 0.06, body.fenderR),
    G('Front fender (L)', PANEL, [45, 0, -125], 0.06, body.fenderL, { showLabel: false }),
    G('Rear quarter panels', PANEL, [-45, 0, 125], 0.06, body.quarterR),
    G('Rear quarter (L)', PANEL, [-45, 0, -125], 0.06, body.quarterL, { showLabel: false }),
    G('Front bumper & grille', COL.silver, [160, -5, 0], 0.05, frontBumper),
    G('Headlights', COL.white, [175, 5, 0], 0.05, headlights, { showLabel: false }),
    G('Rear bumper', COL.silver, [-160, -5, 0], 0.05, rearBumper, { showLabel: false }),
    G('Tail lights', [1.0, 0.1, 0.15], [-175, 5, 0], 0.05, taillights, { showLabel: false }),
    G('Engine', COL.orange, [0, 135, 0], 0.3, engine),
    G('Radiator & fan', COL.cyan, [190, 60, 0], 0.3, radiator),
    G('Gearbox', COL.gold, [0, -75, 0], 0.35, gearbox),
    G('Driveshaft & differential', COL.amber, [0, -95, 0], 0.38, driveline),
    G('Exhaust system', COL.pink, [0, -125, 55], 0.34, exhaust),
    G('Fuel tank', COL.green, [0, -150, -40], 0.36, fuel),
    G('Seats', COL.purple, [0, 110, 0], 0.3, seats),
    G('Dashboard & steering', COL.teal, [35, 85, 0], 0.32, dash),
    G('Wheels & tyres', COL.white, [0, 0, 185], 0.15, [wheel(xF, 1), wheel(xR, 1)]),
    G('Wheels (L)', COL.white, [0, 0, -185], 0.15, [wheel(xF, -1), wheel(xR, -1)], { showLabel: false }),
    G('Brake discs & calipers', COL.red, [0, 0, 110], 0.2, brakes(1)),
    G('Brakes (L)', COL.red, [0, 0, -110], 0.2, brakes(-1), { showLabel: false }),
    G('Suspension (coil-overs)', COL.lime, [0, 25, 70], 0.25, suspension(1)),
    G('Suspension (L)', COL.lime, [0, 25, -70], 0.25, suspension(-1), { showLabel: false }),
  ];
}

/** Generic wheel: tyre of radius R and width W, rim of radius `rim`, 5 spokes; axle along z on side sgn, centred at c. */
function tyreWheel(c, sgn, R, W, rim, density = 0.45) {
  const h = W / 2;
  return orient([
    revolve([-h, -h, -h + 4, h - 4, h, h], [rim, R - 5, R, R, R - 5, rim], { density }),
    ring([0, -h + 4, 0], R + 0.3, { density: 3 }), ring([0, h - 4, 0], R + 0.3, { density: 3 }),
    ring([0, h - 1, 0], rim, { density: 5 }), disc([0, h - 1, 0], 0, rim * 0.25, Y, 2),
    ...[0, 1, 2, 3, 4].map((k) => { const a = (k / 5) * TAU; return line([rim * 0.25 * Math.cos(a), h - 1, rim * 0.25 * Math.sin(a)], [rim * Math.cos(a), h - 2, rim * Math.sin(a)], 1.2, 3); }),
  ], [0, 0, sgn], c);
}
/** Piecewise-linear profile through [x, y] points given in descending x. */
const profile = (P) => (x) => {
  for (let i = 0; i < P.length - 1; i++) { const [x0, y0] = P[i], [x1, y1] = P[i + 1]; if (x <= x0 && x >= x1) return y0 + ((y1 - y0) * (x - x0)) / (x1 - x0); }
  return x > P[0][0] ? P[0][1] : P[P.length - 1][1];
};

// ============================================================ Electric sedan, 472 x 190 x 146 cm, wheelbase 290 cm
function electricSedan() {
  const bottom = 18, belt = 96, wy = 35, xF = 145, xR = -145, archR = 40;
  const top = profile([[236, 58], [215, 72], [110, 92], [20, 142], [-70, 146], [-200, 104], [-236, 96]]);
  const hw = (x) => { const e = Math.max(0, (Math.abs(x) - 170) / 65); return 95 * (1 - 0.25 * e * e); };
  const w = (x, y) => hw(x) * (y > belt ? 1 - (0.3 * (y - belt)) / 50 : 1);
  const archKeep = (x, y) => Math.hypot(x - xF, y - wy) > archR && Math.hypot(x - xR, y - wy) > archR;
  const side = (x0, x1, sgn) => {
    const fn = (x, t) => { const y = bottom + t * (Math.min(top(x), belt) - bottom); return [x, y, sgn * w(x, y)]; };
    return [paramSurface(fn, x0, x1, 0, 1, { density: 0.5, keep: archKeep, gu: 30, gv: 10 }), polyline(linspace(x0, x1, 24).map((x) => fn(x, 1)), 0, 3),
      ...[x0, x1].map((x) => polyline(linspace(0, 1, 8).map((t) => fn(x, t)), 0, 2.5))];
  };
  const sideGlass = (sgn) => {
    const fn = (x, t) => { const y = belt + t * Math.max(0, top(x) - 3 - belt); return [x, y, sgn * w(x, y)]; };
    return [paramSurface(fn, -185, 100, 0, 1, { density: 0.18, gu: 24, gv: 6 }), polyline(linspace(-185, 100, 24).map((x) => fn(x, 1)), 0, 3)];
  };
  const shell = (x0, x1, density) => paramSurface((x, s) => { const y = top(x) + 3 * (1 - s * s); return [x, y, s * w(x, y) * 0.97]; }, x0, x1, -1, 1, { density, gu: 24, gv: 12 });
  const fascia = (xf, sx) => paramSurface((s, t) => { const y = bottom + t * (top(xf) - bottom); return [xf - sx * 6 * s * s, y, s * hw(xf) * 0.93]; }, -1, 1, 0, 1, { density: 0.5, gu: 16, gv: 8 });
  const body = {};
  for (const [sgn, tag] of [[1, 'R'], [-1, 'L']]) {
    body['doors' + tag] = [side(-70, 105, sgn), sideGlass(sgn), line([40, 88, sgn * 96], [20, 88, sgn * 96], 0, 6), line([-40, 88, sgn * 96], [-60, 88, sgn * 96], 0, 6)];
    body['panels' + tag] = [side(105, 236, sgn), side(-236, -70, sgn)];
  }
  const bonnet = [shell(110, 236, 0.6), fascia(236, 1), line([234, 70, -70], [234, 70, 70], 0, 8)];            // light bar
  const glassRoof = [shell(-195, 110, 0.35)];
  for (const x of [20, -70]) glassRoof.push(polyline(linspace(-1, 1, 16).map((s) => [x, top(x) + 3 * (1 - s * s) + 0.5, s * w(x, top(x)) * 0.97]), 0, 3));
  const tail = [shell(-236, -195, 0.6), fascia(-236, -1), line([-237, 92, -75], [-237, 92, 75], 0, 8)];
  // the EV story: a flat battery "skateboard" in the floor and compact motors at the axles
  const battery = [box([0, 24, 0], [300, 12, 150], 0.3, 3)];
  for (const x of linspace(-140, 140, 9)) battery.push(line([x, 30.5, -72], [x, 30.5, 72], 0, 3));
  battery.push(line([-148, 30.5, 0], [148, 30.5, 0], 0, 3));
  const driveUnit = (wx, r, l) => [tube([wx, wy, -l], [wx, wy, l], r, r, 0.8), torus([wx, wy, l], r, 1, Z, 3), torus([wx, wy, -l], r, 1, Z, 3),
    box([wx + Math.sign(wx) * -(r + 10), wy, 0], [18, r * 1.7, l * 1.4], 0.6, 3), tube([wx, wy, l], [wx, wy, 70], 2.5, 2.5, 2), tube([wx, wy, -l], [wx, wy, -70], 2.5, 2.5, 2)];
  const inverter = [box([xR - 4, wy + 26, 0], [34, 10, 40], 0.8, 3), box([xF + 4, wy + 22, 0], [26, 8, 30], 0.8, 3)];
  for (const s of [-1, 1]) inverter.push(pipe([[xR - 4, wy + 26, s * 12], [xR + 20, 30, s * 40], [-130, 30, s * 50]], 1.6, 3));
  const cz = -hw(-200);
  const charge = [torus([-200, 86, cz], 5, 1.2, Z, 3), disc([-200, 86, cz], 0, 4, Z, 2), pipe([[-200, 86, cz + 2], [-190, 60, cz + 20], [-150, 30, -60]], 1.4, 3)];
  const thermal = [quad([222, 26, -60], [222, 26, 60], [222, 60, 60], [222, 60, -60], 0.5), boxEdges([222, 43, 0], [3, 34, 120], 0, 4)];
  for (const s of [-1, 1]) thermal.push(pipe([[220, 40, s * 55], [150, 22, s * 70], [100, 24, s * 76]], 1.5, 3));
  const frunk = [boxEdges([188, 55, 0], [52, 28, 110], 0, 3), quad([162, 41, -55], [214, 41, -55], [214, 41, 55], [162, 41, 55], 0.3)];
  const seat = (xc, zc) => [box([xc, 40, zc], [46, 10, 44], 0.55, 3), transform(box([0, 24, 0], [9, 50, 44], 0.55, 3), rotZ(deg(14)), [xc - 25, 40, zc])];
  const seats = [seat(0, -36), seat(0, 36), seat(-88, -36), seat(-88, 36)];
  const cabin = [quad([72, 70, -14], [72, 70, 14], [66, 96, 14], [66, 96, -14], 0.9), boxEdges([69, 83, 0], [4, 26, 28], 0, 4),     // centre touchscreen
    torus([48, 78, -36], 17, 1.8, norm([-0.8, 0.55, 0]), 3), tube([48, 78, -36], [80, 62, -36], 2, 2, 2),
    paramSurface((z, t) => [80 + 6 * Math.cos(t * Math.PI), 60 + 18 * t, z], -82, 82, 0, 1, { density: 0.4, gu: 20, gv: 6 })];
  const wheels = (sgn) => [xF, xR].map((wx) => tyreWheel([wx, wy, sgn * 80], sgn, 35, 24, 24));
  const brakes = (sgn) => [xF, xR].map((wx) => [disc([wx, wy, sgn * 70], 5, 17, Z, 1.4), box([wx - 12, wy + 10, sgn * 70], [9, 12, 6], 1.3, 3)]);
  const suspension = (sgn) => [xF, xR].map((wx) => [helix([wx, wy + 4, sgn * 58], 5, 40, 6, Y, 3), tube([wx, wy, sgn * 58], [wx, wy + 50, sgn * 56], 1.6, 1.6, 2),
    line([wx, wy - 4, sgn * 70], [wx + 22, 26, sgn * 48], 0, 4), line([wx, wy - 4, sgn * 70], [wx - 22, 26, sgn * 48], 0, 4)]);

  const BLUE = [0.3, 0.6, 1.0], PANEL = [0.4, 0.7, 1.0], GLASS = [0.55, 0.85, 1.0];
  return [
    G('Battery pack', COL.green, [0, -110, 0], 0.35, battery, { info: '~4,400 Li-ion cells in the floor: low centre of gravity' }),
    G('Bonnet & light bar', BLUE, [120, 90, 0], 0, bonnet, { info: 'no engine underneath: just the frunk' }),
    G('Panoramic glass roof', GLASS, [0, 150, 0], 0.03, glassRoof, { info: 'one sheet from windscreen to tailgate' }),
    G('Tailgate', BLUE, [-120, 80, 0], 0, tail, { showLabel: false }),
    G('Doors', BLUE, [0, 10, 160], 0.02, body.doorsR, { info: 'flush handles pop out to cut drag' }),
    G('Doors (L)', BLUE, [0, 10, -160], 0.02, body.doorsL, { showLabel: false }),
    G('Body panels', PANEL, [0, 0, 120], 0.06, body.panelsR, { info: 'smooth, sealed shape: drag coefficient ~0.23' }),
    G('Body panels (L)', PANEL, [0, 0, -120], 0.06, body.panelsL, { showLabel: false }),
    G('Rear drive unit', COL.orange, [-40, -60, 0], 0.3, driveUnit(xR, 15, 24), { info: 'electric motor + single-speed gearbox, ~20,000 rpm' }),
    G('Front drive unit', COL.amber, [40, -60, 0], 0.3, driveUnit(xF, 12, 20), { info: 'second motor makes it all-wheel drive' }),
    G('Inverter & HV cables', COL.pink, [0, 60, 0], 0.32, inverter, { info: 'turns battery DC into 3-phase AC for the motors' }),
    G('Charge port', COL.cyan, [-40, 30, -70], 0.3, charge, { info: 'DC fast charging: 10-80% in ~25 min' }),
    G('Thermal system', COL.teal, [70, 30, 0], 0.3, thermal, { info: 'heat pump + coolant loops keep the battery at ~25 °C' }),
    G('Frunk', COL.silver, [90, 70, 0], 0.25, frunk, { info: 'front trunk: storage where the engine used to be' }),
    G('Seats', COL.purple, [0, 110, 0], 0.3, seats),
    G('Cabin & touchscreen', COL.gold, [35, 90, 0], 0.32, cabin, { info: 'one screen runs nearly every control' }),
    G('Wheels & tyres', COL.white, [0, 0, 180], 0.15, wheels(1)),
    G('Wheels (L)', COL.white, [0, 0, -180], 0.15, wheels(-1), { showLabel: false }),
    G('Brakes & regen', COL.red, [0, 0, 110], 0.2, brakes(1), { info: 'motors brake by recharging the battery; discs for hard stops' }),
    G('Brakes (L)', COL.red, [0, 0, -110], 0.2, brakes(-1), { showLabel: false }),
    G('Suspension', COL.lime, [0, 25, 70], 0.25, suspension(1)),
    G('Suspension (L)', COL.lime, [0, 25, -70], 0.25, suspension(-1), { showLabel: false }),
  ];
}

// ============================================================ Formula 1 car, 560 x 200 x 95 cm, wheelbase 360 cm
function formulaOne() {
  const xF = 175, xR = -185, wy = 36, tz = 78;
  const lerp = (a, b, t) => a + (b - a) * Math.min(1, Math.max(0, t));
  // monocoque: elliptical cross-sections from the nose tip back to the cockpit, cockpit opening cut out
  const tn = (x) => (250 - x) / 290;
  const tub = [paramSurface((x, a) => [x, lerp(26, 42, tn(x)) + lerp(6, 26, tn(x)) * Math.sin(a), lerp(8, 34, tn(x) * 1.4) * Math.cos(a)], -40, 250, 0, TAU,
    { density: 0.5, gu: 36, gv: 20, keep: (x, y, z) => !(x < 62 && x > -34 && y > 50 && Math.abs(z) < 22) })];
  tub.push(polyline(linspace(0, TAU, 30).map((a) => [14 + 48 * Math.cos(a), 56, 22 * Math.sin(a)]), 0, 4));                // cockpit rim
  const te = (x) => (-40 - x) / 170;
  const cover = [paramSurface((x, a) => [x, lerp(44, 34, te(x)) + lerp(42, 12, te(x) * 1.6) * Math.max(0, Math.sin(a)) + lerp(10, 6, te(x)) * Math.min(0, Math.sin(a)),
    lerp(30, 10, te(x)) * Math.cos(a)], -210, -40, 0, TAU, { density: 0.5, gu: 30, gv: 18 })];
  cover.push(torus([-38, 80, 0], 9, 1.5, X, 3));                                                                            // airbox intake
  cover.push(quad([-70, 84, 0], [-200, 50, 0], [-200, 80, 0], [-90, 92, 0], 0.4), polyline([[-90, 92, 0], [-200, 80, 0]], 0, 3));   // shark fin
  const sidepods = (sgn) => [blob([-30, 34, sgn * 50], [95, 20, 20], { density: 0.55, bump: (u, v) => 1 - 0.25 * Math.max(0, -Math.cos(u)) }),
    polyline(linspace(0, TAU, 20).map((a) => [62, 36 + 14 * Math.sin(a), sgn * (50 + 14 * Math.cos(a))]), 0, 4)];
  const floor = [quad([140, 6, -70], [-225, 6, -70], [-225, 6, 70], [140, 6, 70], 0.1)];
  for (const z of [-50, -25, 25, 50]) floor.push(pipe([[120, 6, z], [0, 3, z * 1.05], [-180, 10, z * 1.1], [-225, 20, z * 1.15]], 1, 3));   // venturi tunnels
  const fw = [];
  for (const [k, y] of [[0, 8], [1, 14], [2, 21]]) fw.push(quad([280 - k * 8, y, -98], [258 - k * 8, y + 3 + k, -98], [258 - k * 8, y + 3 + k, 98], [280 - k * 8, y, 98], 0.5));
  for (const s of [-1, 1]) fw.push(quad([285, 4, s * 99], [245, 4, s * 99], [245, 30, s * 99], [285, 26, s * 99], 0.6), line([250, 22, s * 8], [262, 12, s * 30], 1.2, 3));
  const rw = [quad([-240, 78, -48], [-262, 80, -48], [-262, 80, 48], [-240, 78, 48], 0.6), quad([-238, 38, -40], [-255, 40, -40], [-255, 40, 40], [-238, 38, 40], 0.6)];
  for (const s of [-1, 1]) rw.push(quad([-235, 20, s * 50], [-270, 20, s * 50], [-270, 96, s * 50], [-235, 96, s * 50], 0.4), polyline([[-235, 96, s * 50], [-270, 96, s * 50]], 0, 3));
  rw.push(tube([-230, 40, 0], [-252, 78, 0], 2, 2, 3));                                                                     // swan-neck pylon
  const drs = [quad([-262, 86, -47], [-280, 92, -47], [-280, 92, 47], [-262, 86, 47], 0.7), line([-266, 86, 0], [-262, 80, 0], 1, 4)];
  const halo = [vessel([[62, 46, 0], [52, 68, 0], [30, 73, 18], [0, 71, 26], [-26, 60, 26]], 2.6, 2.6, 2.5), vessel([[52, 68, 0], [30, 73, -18], [0, 71, -26], [-26, 60, -26]], 2.6, 2.6, 2.5)];
  const driver = [sphere([10, 64, 0], 13, 1.3), line([18, 64, -10], [18, 64, 10], 0, 4), torus([34, 52, 0], 11, 1.5, norm([-0.8, 0.5, 0]), 3)];   // helmet, visor, wheel
  const engine = [box([-105, 36, 0], [70, 26, 30], 0.6, 3)];
  for (const s of [-1, 1]) { engine.push(transform(box([0, 0, 0], [70, 14, 12], 0.6, 3), rotZ(0), [-105, 52, s * 14])); for (const x of [-130, -105, -80]) engine.push(pipe([[x, 50, s * 20], [x - 10, 44, s * 30], [-150, 40, s * 22]], 2, 2)); }
  const turbo = [torus([-150, 44, 0], 10, 4, X, 1.5), disc([-150, 44, 0], 0, 9, X, 1.5), tube([-140, 44, 0], [-160, 44, 0], 4, 4, 2), tube([-165, 44, 0], [-230, 52, 0], 5, 4, 1.5)];
  const store = [box([-58, 20, 0], [40, 10, 44], 0.7, 3)];
  for (const z of [-15, 0, 15]) store.push(line([-78, 25.5, z], [-38, 25.5, z], 0, 3));
  const fuel = [box([-24, 36, 0], [34, 30, 46], 0.5, 3)];
  const gearbox = [box([-200, 32, 0], [60, 22, 24], 0.6, 3), tube([-185, 32, -12], [-185, wy, -tz + 18], 2.2, 2.2, 2), tube([-185, 32, 12], [-185, wy, tz - 18], 2.2, 2.2, 2)];
  const susp = (sgn) => [xF, xR].map((wx) => {
    const inner = wx > 0 ? [wx, 0, sgn * 26] : [wx, 0, sgn * 32];
    return [line([inner[0] + 25, 44, inner[2]], [wx, 50, sgn * (tz - 16)], 1, 4), line([inner[0] - 25, 44, inner[2]], [wx, 50, sgn * (tz - 16)], 1, 4),
      line([inner[0] + 25, 26, inner[2]], [wx, 22, sgn * (tz - 16)], 1, 4), line([inner[0] - 25, 26, inner[2]], [wx, 22, sgn * (tz - 16)], 1, 4),
      line([wx, 24, sgn * (tz - 18)], [wx - 6, 54, sgn * (inner[2] * sgn - 4)], 1.2, 4)];                                   // push-rod
  });
  const wheels = (sgn) => [tyreWheel([xF, wy, sgn * tz], sgn, 36, 30, 23, 0.55), tyreWheel([xR, wy, sgn * tz], sgn, 36, 40, 23, 0.55)];
  const brakes = (sgn) => [xF, xR].map((wx) => [disc([wx, wy, sgn * (tz - 8)], 4, 14, Z, 1.5), box([wx + 10, wy + 8, sgn * (tz - 8)], [8, 10, 5], 1.3, 3)]);

  const LIVERY = [1.0, 0.5, 0.12], DARK = [0.25, 0.3, 0.4];
  return [
    G('Monocoque & nose', LIVERY, [60, 40, 0], 0.05, tub, { info: 'carbon-fibre survival cell: ~35 kg, takes 60+ g crashes' }),
    G('Halo', COL.silver, [20, 110, 0], 0.1, halo, { info: 'titanium hoop: can hold the weight of a double-decker bus' }),
    G('Driver', COL.white, [20, 150, 0], 0.15, driver, { info: 'lies almost flat, feet above the hips' }),
    G('Engine cover & airbox', LIVERY, [-40, 110, 0], 0.08, cover, { info: 'airbox gulps air over the driver\'s head into the engine' }),
    G('Sidepods', LIVERY, [0, 0, 110], 0.08, sidepods(1), { info: 'hide the radiators; shaped to steer air to the rear' }),
    G('Sidepods (L)', LIVERY, [0, 0, -110], 0.08, sidepods(-1), { showLabel: false }),
    G('Floor & venturi tunnels', DARK, [0, -80, 0], 0.2, floor, { info: 'ground effect: sucks the car to the track (~half the downforce)' }),
    G('Front wing', COL.cyan, [110, -10, 0], 0.05, fw, { info: 'three elements: grip for the front and airflow for the rest' }),
    G('Rear wing', COL.cyan, [-110, 60, 0], 0.05, rw, { info: 'upside-down aerofoil: pushes the rear down' }),
    G('DRS flap', COL.lime, [-150, 110, 0], 0.1, drs, { info: 'opens on straights to cut drag: ~+12 km/h' }),
    G('V6 turbo engine', COL.orange, [-40, 80, 0], 0.3, engine, { info: '1.6 L V6, 15,000 rpm limit' }),
    G('Turbo & MGU-H', COL.gold, [-110, 60, 0], 0.35, turbo, { info: 'turbo spins a generator: exhaust heat becomes electricity' }),
    G('Energy store', COL.green, [0, -60, 0], 0.35, store, { info: 'hybrid battery: MGU-K adds ~120 kW on demand' }),
    G('Fuel cell', COL.amber, [30, -40, 0], 0.35, fuel, { info: 'kevlar bladder behind the driver: max 110 kg of fuel' }),
    G('Gearbox', COL.purple, [-90, -40, 0], 0.35, gearbox, { info: '8 speeds, shifts in ~50 ms' }),
    G('Suspension', COL.pink, [0, 25, 60], 0.25, susp(1), { info: 'carbon wishbones and push-rods' }),
    G('Suspension (L)', COL.pink, [0, 25, -60], 0.25, susp(-1), { showLabel: false }),
    G('Wheels & tyres', COL.white, [0, 0, 170], 0.15, wheels(1), { info: '18-inch rims; slick tyres run at ~100 °C' }),
    G('Wheels (L)', COL.white, [0, 0, -170], 0.15, wheels(-1), { showLabel: false }),
    G('Carbon brakes', COL.red, [0, 0, 100], 0.2, brakes(1), { info: 'carbon discs glow at 1,000 °C; 5 g braking' }),
    G('Brakes (L)', COL.red, [0, 0, -100], 0.2, brakes(-1), { showLabel: false }),
  ];
}

export const VEHICLES = [
  { name: 'Sports Car', groups: sportsCar, color: [1.0, 0.25, 0.25], tilt: 16, viewYaw: 0.75, fact: '440 × 185 × 130 cm · 260 cm wheelbase · front engine, RWD' },
  { name: 'Electric Sedan', groups: electricSedan, color: [0.3, 0.6, 1.0], tilt: 16, viewYaw: 0.75, fact: '472 × 190 × 146 cm · dual motor AWD · ~500 km range' },
  { name: 'Formula 1 Car', groups: formulaOne, color: [1.0, 0.5, 0.12], tilt: 14, viewYaw: 0.7, fact: '560 × 200 × 95 cm · 800 kg · 1.6 L V6 turbo hybrid, ~1,000 hp' },
];
