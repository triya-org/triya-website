import * as THREE from "three";
import { mergeGeometries } from "three/examples/jsm/utils/BufferGeometryUtils.js";
import { mulberry32, popCellKey } from "@/components/three/lib/popGrow";
import type { Industry, Part } from "./models";

/**
 * DETAILED line-art derived from the Living City's own building language.
 *
 * The city's geometry is generated inline inside CityScene's useMemo and isn't
 * exported, so (without touching that file) this module PORTS its building
 * generators — the same 4-face window grids, floor bands, mullions, crowns and
 * rooftop AC/antennas (CityScene.tsx addWindows / addCurtainWall / addRoof) —
 * and renders every piece as EdgesGeometry (a window plane → a crisp rectangle
 * outline = the window grid in line-art; a box → its wireframe). Per industry we
 * compose a detailed district from these buildings over a shared street grid, so
 * each reads as a slice of the SAME city. Each building merges to one
 * LineSegments (one draw call) to afford the density.
 *
 * Reuses the importable helpers (popGrow) — never the protected city files.
 */

const FLOOR_H = 1.6;
const R = (rand: () => number, s = 1) => (rand() * 2 - 1) * s;
const explode = (rand: () => number): [number, number, number] => [
  R(rand, 7),
  rand() * 5 + 3,
  R(rand, 7),
];

/* ---- ported city building generators (geometry only; no paint/colour) ---- */

/** window grid on all four facades (port of CityScene addWindows) */
function addWindows(
  rand: () => number,
  out: THREE.BufferGeometry[],
  x: number,
  z: number,
  w: number,
  h: number,
  d: number,
) {
  if (h < 4.5) return;
  const rows = Math.floor((h - 2.2) / 1.5);
  const colsX = Math.max(2, Math.floor(w / 1.15));
  const colsZ = Math.max(2, Math.floor(d / 1.15));
  for (let r = 0; r < rows; r++) {
    const wy = 1.6 + r * 1.5;
    for (let c = 0; c < colsX; c++) {
      if (rand() < 0.34) continue;
      const wx = x - ((colsX - 1) * 1.0) / 2 + c * 1.0;
      for (const sz of [1, -1]) {
        const g = new THREE.PlaneGeometry(0.55, 0.85);
        if (sz < 0) g.rotateY(Math.PI);
        g.translate(wx, wy, z + sz * (d / 2 + 0.02));
        out.push(g);
      }
    }
    for (let c = 0; c < colsZ; c++) {
      if (rand() < 0.34) continue;
      const wz = z - ((colsZ - 1) * 1.0) / 2 + c * 1.0;
      for (const sx of [1, -1]) {
        const g = new THREE.PlaneGeometry(0.55, 0.85);
        g.rotateY(sx > 0 ? Math.PI / 2 : -Math.PI / 2);
        g.translate(x + sx * (w / 2 + 0.02), wy, wz);
        out.push(g);
      }
    }
  }
}

/** floor bands + vertical mullions + parapet crown (port of addCurtainWall) */
function addTowerDetail(
  out: THREE.BufferGeometry[],
  x: number,
  z: number,
  w: number,
  h: number,
  d: number,
) {
  const floors = Math.max(2, Math.floor((h - 0.4) / FLOOR_H));
  for (let r = 2; r < floors; r += 2) {
    const yb = 0.4 + r * FLOOR_H;
    if (yb > h - 0.2) break;
    const band = new THREE.BoxGeometry(w + 0.05, 0.1, d + 0.05);
    band.translate(x, yb, z);
    out.push(band);
  }
  const cols = THREE.MathUtils.clamp(Math.round(w / 0.9), 2, 4);
  const mh = h - 0.4;
  const my = 0.2 + mh / 2;
  for (let c = 0; c < cols; c++) {
    const mx = x - ((cols - 1) * 0.9) / 2 + c * 0.9;
    const m = new THREE.BoxGeometry(0.05, mh, 0.05);
    m.translate(mx, my, z + d / 2 + 0.03);
    out.push(m);
    const mz = z - ((cols - 1) * 0.9) / 2 + c * 0.9;
    const m2 = new THREE.BoxGeometry(0.05, mh, 0.05);
    m2.translate(x + w / 2 + 0.03, my, mz);
    out.push(m2);
  }
  const cr = popCellKey(x + 21.3, z - 4.7);
  if (cr > 0.45) {
    const ch = 0.16 + cr * 0.5;
    const inset = cr > 0.72 ? 0.7 : 0.3;
    const crown = new THREE.BoxGeometry(w - inset, ch, d - inset);
    crown.translate(x, h + ch / 2 - 0.08, z);
    out.push(crown);
  }
}

/** rooftop AC units + antennas (port of CityScene addRoof) */
function addRoof(
  rand: () => number,
  out: THREE.BufferGeometry[],
  x: number,
  z: number,
  w: number,
  h: number,
  d: number,
) {
  if (rand() < 0.6) {
    const aw = 0.7 + rand() * 0.6;
    const ah = 0.4 + rand() * 0.35;
    const ac = new THREE.BoxGeometry(aw, ah, aw * 0.8);
    ac.translate(x + (rand() - 0.5) * (w * 0.45), h + ah / 2, z + (rand() - 0.5) * (d * 0.45));
    out.push(ac);
  }
  if (h > 8 && rand() < 0.5) {
    const len = 1.4 + rand() * 1.4;
    const ant = new THREE.CylinderGeometry(0.04, 0.06, len, 5);
    ant.translate(x + (rand() - 0.5) * w * 0.3, h + len / 2, z + (rand() - 0.5) * d * 0.3);
    out.push(ant);
  }
}

/* ---- line helpers ---- */

function edgesMerge(pieces: THREE.BufferGeometry[], thr = 18): THREE.BufferGeometry {
  const edges = pieces.map((p) => {
    const e = new THREE.EdgesGeometry(p, thr);
    p.dispose();
    return e;
  });
  const merged = mergeGeometries(edges, false);
  edges.forEach((e) => e.dispose());
  return merged ?? new THREE.BufferGeometry();
}

function lineGeo(pts: number[]) {
  const g = new THREE.BufferGeometry();
  g.setAttribute("position", new THREE.Float32BufferAttribute(pts, 3));
  return g;
}

function gridGeo(size: number, div: number, y = 0): THREE.BufferGeometry {
  const pts: number[] = [];
  const half = size / 2;
  const step = size / div;
  for (let i = 0; i <= div; i++) {
    const p = -half + i * step;
    pts.push(-half, y, p, half, y, p, p, y, -half, p, y, half);
  }
  return lineGeo(pts);
}

function circleXY(R: number, cx: number, cy: number, cz: number, n = 40): number[] {
  const pts: number[] = [];
  for (let i = 0; i < n; i++) {
    const a0 = (i / n) * Math.PI * 2;
    const a1 = ((i + 1) / n) * Math.PI * 2;
    pts.push(
      cx + Math.cos(a0) * R, cy + Math.sin(a0) * R, cz,
      cx + Math.cos(a1) * R, cy + Math.sin(a1) * R, cz,
    );
  }
  return pts;
}

/* a detailed city building → one merged line geometry, as a Part */
function buildingPart(
  rand: () => number,
  x: number,
  z: number,
  w: number,
  h: number,
  d: number,
  tower: boolean,
): Part {
  const pieces: THREE.BufferGeometry[] = [];
  const body = new THREE.BoxGeometry(w, h, d);
  body.translate(x, h / 2, z);
  pieces.push(body);
  addWindows(rand, pieces, x, z, w, h, d);
  if (tower) addTowerDetail(pieces, x, z, w, h, d);
  addRoof(rand, pieces, x, z, w, h, d);
  return { geo: edgesMerge(pieces), pos: [0, 0, 0], ex: explode(rand) };
}

function linePart(rand: () => number, geo: THREE.BufferGeometry): Part {
  return { geo, pos: [0, 0, 0], ex: explode(rand) };
}

/* a SLEEK glass tower (curtain-wall bands + mullions + crown, NO busy window
 * grid) — reads clean and modern even when towers stand close (smart city). */
function towerPart(
  rand: () => number,
  x: number,
  z: number,
  w: number,
  h: number,
  d: number,
): Part {
  const pieces: THREE.BufferGeometry[] = [];
  const body = new THREE.BoxGeometry(w, h, d);
  body.translate(x, h / 2, z);
  pieces.push(body);
  addTowerDetail(pieces, x, z, w, h, d);
  addRoof(rand, pieces, x, z, w, h, d);
  return { geo: edgesMerge(pieces), pos: [0, 0, 0], ex: explode(rand) };
}

/* two boulevards crossing the plaza, drawn as double-line roads on the ground */
function avenueLines(size: number, ax: number, az: number): THREE.BufferGeometry {
  const half = size / 2;
  const g = 1.4; // road half-width
  const y = 0.02;
  const pts: number[] = [];
  for (const z of [az - g, az + g]) pts.push(-half, y, z, half, y, z);
  for (const x of [ax - g, ax + g]) pts.push(x, y, -half, x, y, half);
  return lineGeo(pts);
}

/* ---- per-industry structures ---- */

/** sawtooth factory roof over a hall */
function sawtoothPart(rand: () => number, x: number, z: number, w: number, h: number, d: number): Part {
  const pieces: THREE.BufferGeometry[] = [];
  const teeth = Math.max(3, Math.round(w / 1.5));
  const tw = w / teeth;
  for (let i = 0; i < teeth; i++) {
    const s = new THREE.Shape();
    s.moveTo(0, 0);
    s.lineTo(tw, 0);
    s.lineTo(0, 0.6);
    s.closePath();
    const g = new THREE.ExtrudeGeometry(s, { depth: d, bevelEnabled: false });
    g.translate(x - w / 2 + i * tw, h, z - d / 2);
    pieces.push(g);
  }
  return { geo: edgesMerge(pieces), pos: [0, 0, 0], ex: explode(rand) };
}

/** chimney / silo stack */
function stackPart(rand: () => number, x: number, z: number, h: number): Part {
  const pieces: THREE.BufferGeometry[] = [];
  const c = new THREE.CylinderGeometry(0.32, 0.42, h, 12);
  c.translate(x, h / 2, z);
  pieces.push(c);
  for (let i = 1; i <= 2; i++) {
    const band = new THREE.CylinderGeometry(0.4, 0.4, 0.16, 12);
    band.translate(x, h - i * 0.9, z);
    pieces.push(band);
  }
  return { geo: edgesMerge(pieces), pos: [0, 0, 0], ex: explode(rand) };
}

/* a clean low-rise SHOP: body + glazed shopfront (wide mullioned bays) + a
 * cantilevered awning + a fascia sign band + ONE tidy band of upper windows on
 * the street face only. Reads unmistakably as a storefront and stays legible
 * when shops stand shoulder-to-shoulder (no busy 4-face window grid). */
function shopPart(
  rand: () => number,
  x: number,
  z: number,
  w: number,
  h: number,
  d: number,
): Part {
  const pieces: THREE.BufferGeometry[] = [];
  const body = new THREE.BoxGeometry(w, h, d);
  body.translate(x, h / 2, z);
  pieces.push(body);

  const fz = z + d / 2; // street-facing (+z) facade
  // shopfront glazing: a row of wide glass bays at ground level
  const gw = w * 0.88;
  const gh = Math.min(1.6, h - 1.0);
  const bays = Math.max(2, Math.round(gw / 1.0));
  const bw = gw / bays;
  for (let i = 0; i < bays; i++) {
    const bx = x - gw / 2 + bw * (i + 0.5);
    const g = new THREE.PlaneGeometry(bw * 0.86, gh);
    g.translate(bx, 0.12 + gh / 2, fz + 0.02);
    pieces.push(g);
  }
  // cantilevered awning over the shopfront
  const awn = new THREE.BoxGeometry(w * 0.98, 0.1, 0.55);
  awn.translate(x, gh + 0.42, fz + 0.28);
  pieces.push(awn);
  // fascia sign band above the awning
  const sign = new THREE.BoxGeometry(w * 0.72, 0.42, 0.12);
  sign.translate(x, gh + 0.78, fz + 0.04);
  pieces.push(sign);
  // ONE tidy, evenly-spaced upper window band (only if there's a clear floor)
  const uy = gh + 1.45;
  if (uy < h - 0.45) {
    const cols = Math.max(2, Math.round(w / 1.1));
    const span = w * 0.78;
    const stepU = span / Math.max(1, cols - 1);
    for (let c = 0; c < cols; c++) {
      const ux = x - span / 2 + stepU * c;
      const g = new THREE.PlaneGeometry(0.5, 0.7);
      g.translate(ux, uy, fz + 0.02);
      pieces.push(g);
    }
  }
  // parapet cap (a crisp roofline)
  const cap = new THREE.BoxGeometry(w + 0.12, 0.16, d + 0.12);
  cap.translate(x, h + 0.04, z);
  pieces.push(cap);
  addRoof(rand, pieces, x, z, w, h, d);
  return { geo: edgesMerge(pieces), pos: [0, 0, 0], ex: explode(rand) };
}

/* a freestanding retail PYLON sign — a tall slim pole carrying a sign box.
 * An unmistakable shopping-district landmark on the forecourt. */
function pylonPart(rand: () => number, x: number, z: number, h: number): Part {
  const pieces: THREE.BufferGeometry[] = [];
  const pole = new THREE.BoxGeometry(0.16, h, 0.16);
  pole.translate(x, h / 2, z);
  pieces.push(pole);
  const box = new THREE.BoxGeometry(1.7, 1.15, 0.28);
  box.translate(x, h - 0.6, z);
  pieces.push(box);
  // a divider line across the sign box reads as two brand panels
  const div = new THREE.BoxGeometry(1.7, 0.04, 0.3);
  div.translate(x, h - 0.6, z);
  pieces.push(div);
  return { geo: edgesMerge(pieces), pos: [0, 0, 0], ex: explode(rand) };
}

/** a ribbed stadium bowl with a tall roof canopy + floodlight masts (events signature) */
function stadiumParts(rand: () => number, cx: number, cz: number): Part[] {
  const SX = 1.3;
  const pointAt = (r: number, y: number, a: number): [number, number, number] => [
    cx + Math.cos(a) * r * SX,
    y,
    cz + Math.sin(a) * r,
  ];
  const oval = (r: number, y: number): number[] => {
    const pts: number[] = [];
    const n = 56;
    for (let i = 0; i < n; i++) {
      const a0 = (i / n) * Math.PI * 2;
      const a1 = ((i + 1) / n) * Math.PI * 2;
      pts.push(...pointAt(r, y, a0), ...pointAt(r, y, a1));
    }
    return pts;
  };
  const n = 56;
  // seating ribs: bottom tier → top tier, now climbing far higher
  const ribs: number[] = [];
  for (let i = 0; i < n; i += 3) {
    const a = (i / n) * Math.PI * 2;
    ribs.push(...pointAt(2.2, 0, a), ...pointAt(4.4, 3.4, a));
  }
  // roof canopy: vertical supports from the top tier up to an over-sailing lip
  const roof: number[] = [];
  for (let i = 0; i < n; i += 4) {
    const a = (i / n) * Math.PI * 2;
    roof.push(...pointAt(4.4, 3.4, a), ...pointAt(4.7, 5.0, a)); // mast up
    roof.push(...pointAt(4.7, 5.0, a), ...pointAt(3.6, 5.0, a)); // cantilever inward
  }
  // four floodlight masts for unmistakable vertical presence
  const masts: number[] = [];
  const mastH = 7.4;
  for (const a of [0.9, Math.PI - 0.9, Math.PI + 0.9, -0.9]) {
    const [bx, , bz] = pointAt(4.7, 5.0, a);
    masts.push(bx, 5.0, bz, bx, mastH, bz); // pole
    // light rig: a small horizontal bar with three lamps
    const rig = mastH + 0.1;
    masts.push(bx - 0.7, rig, bz, bx + 0.7, rig, bz);
    for (const dx of [-0.6, 0, 0.6]) {
      masts.push(bx + dx, rig, bz - 0.18, bx + dx, rig + 0.45, bz - 0.18, bx + dx, rig + 0.45, bz - 0.18, bx + dx, rig + 0.45, bz + 0.18, bx + dx, rig + 0.45, bz + 0.18, bx + dx, rig, bz + 0.18, bx + dx, rig, bz + 0.18, bx + dx, rig, bz - 0.18);
    }
  }
  return [
    linePart(rand, lineGeo(oval(1.5, -0.1))), // pitch edge
    linePart(rand, lineGeo(oval(2.2, 0))), // tier 1
    linePart(rand, lineGeo(oval(3.0, 1.1))), // tier 2
    linePart(rand, lineGeo(oval(3.7, 2.2))), // tier 3
    linePart(rand, lineGeo(oval(4.4, 3.4))), // tier 4 (top of bowl)
    linePart(rand, lineGeo(oval(3.6, 5.0))), // inner roof lip
    linePart(rand, lineGeo(oval(4.7, 5.0))), // outer roof lip
    linePart(rand, lineGeo(ribs)),
    linePart(rand, lineGeo(roof)),
    linePart(rand, lineGeo(masts)),
  ];
}

/** a Ferris wheel (events signature, like the city's) */
function ferrisPart(rand: () => number, cx: number, cy: number, cz: number, Rad: number): Part {
  const pts: number[] = [];
  pts.push(...circleXY(Rad, cx, cy, cz, 48));
  pts.push(...circleXY(Rad * 0.92, cx, cy, cz, 48));
  const spokes = 12;
  for (let i = 0; i < spokes; i++) {
    const a = (i / spokes) * Math.PI * 2;
    pts.push(cx, cy, cz, cx + Math.cos(a) * Rad, cy + Math.sin(a) * Rad, cz);
    // cabin (small square) at the rim
    const px = cx + Math.cos(a) * Rad;
    const py = cy + Math.sin(a) * Rad;
    const s = 0.28;
    pts.push(px - s, py - s, cz, px + s, py - s, cz, px + s, py - s, cz, px + s, py + s, cz, px + s, py + s, cz, px - s, py + s, cz, px - s, py + s, cz, px - s, py - s, cz);
  }
  // A-frame legs
  pts.push(cx, cy, cz, cx - Rad * 0.7, 0, cz + 0.4, cx, cy, cz, cx + Rad * 0.7, 0, cz + 0.4);
  pts.push(cx, cy, cz, cx - Rad * 0.7, 0, cz - 0.4, cx, cy, cz, cx + Rad * 0.7, 0, cz - 0.4);
  return { geo: lineGeo(pts), pos: [0, 0, 0], ex: explode(rand) };
}

/* ---- districts: detailed slices of the same city ---- */

function manufacturing(rand: () => number): Part[] {
  const parts: Part[] = [];
  const halls: [number, number, number, number, number][] = [
    [-4.5, 0.5, 6.5, 4.5, 5],
    [3.2, 1.5, 5.5, 4, 4.5],
    [-0.5, -4, 4.5, 3.5, 3.5],
  ];
  for (const [x, z, w, h, d] of halls) {
    parts.push(buildingPart(rand, x, z, w, h, d, false));
    parts.push(sawtoothPart(rand, x, z, w, h, d));
  }
  parts.push(stackPart(rand, -1.6, -1.5, 6.5));
  parts.push(stackPart(rand, 0.2, -1.5, 5));
  // container yard — stacked boxes
  for (let i = 0; i < 5; i++) {
    const b = new THREE.BoxGeometry(1.6, 0.9, 1.0);
    b.translate(5.5, 0.45 + (i % 2) * 0.95, -3 + i * 0.6);
    parts.push({ geo: edgesMerge([b]), pos: [0, 0, 0], ex: explode(rand) });
  }
  parts.push(linePart(rand, gridGeo(20, 9)));
  return parts;
}

function retail(rand: () => number): Part[] {
  const parts: Part[] = [];
  // A SHOPPING DISTRICT, not an office block. A parade of low-rise shops stands
  // shoulder-to-shoulder along the street facing the camera (each with a glazed
  // shopfront, awning, fascia sign + a tidy upper window band); behind them a
  // clean department-store anchor and one landmark tower give depth; a
  // freestanding pylon sign marks the forecourt.
  const parade: [number, number, number][] = [
    // [w, h, d]
    [3.2, 3.6, 2.8],
    [2.6, 4.2, 2.8],
    [3.8, 4.8, 3.0], // a larger store anchoring the middle of the parade
    [2.4, 3.4, 2.8],
    [3.2, 3.9, 2.8],
  ];
  const gap = 0.34;
  const total =
    parade.reduce((s, [w]) => s + w, 0) + gap * (parade.length - 1);
  const zFront = 3.0;
  let cx = -total / 2;
  for (const [w, h, d] of parade) {
    parts.push(shopPart(rand, cx + w / 2, zFront, w, h, d));
    cx += w + gap;
  }
  // a wide, low DEPARTMENT STORE / big-box anchor behind the parade (its big
  // glazed frontage reads as a mall) + one moderate landmark for depth — kept
  // short so the district stays horizontal and unmistakably retail, not office.
  parts.push(shopPart(rand, -4.2, -3.4, 6.6, 4.6, 4.2));
  parts.push(towerPart(rand, 4.6, -3.6, 3.0, 6.2, 3.0));
  // a forecourt pylon sign — unmistakably retail
  parts.push(pylonPart(rand, 7.8, 4.4, 5.4));
  // street grid / forecourt
  parts.push(linePart(rand, gridGeo(20, 9)));
  return parts;
}

function smartCities(rand: () => number): Part[] {
  const parts: Part[] = [];
  // a modern downtown: sleek glass towers of varied height, well spaced along
  // two boulevards, on a generous plaza. Clean (no busy window grids).
  const spots: [number, number, number, number, number][] = [
    [-8, -4.5, 3.0, 11, 3.0],
    [-2.5, -6, 2.6, 8, 2.6],
    [2.5, -4.5, 3.3, 15, 3.3], // hero tower
    [8, -5.5, 2.4, 9, 2.4],
    [-7.5, 3.5, 2.8, 9.5, 2.8],
    [-1.5, 2.5, 3.0, 12.5, 3.0],
    [4.5, 4, 2.6, 7, 2.6],
    [9, 1.5, 2.2, 10.5, 2.2],
  ];
  for (const [x, z, w, h, d] of spots) parts.push(towerPart(rand, x, z, w, h, d));
  // a big street grid + two boulevards so it reads as a city plan
  parts.push(linePart(rand, gridGeo(30, 15)));
  parts.push(linePart(rand, avenueLines(30, 0.5, -1)));
  return parts;
}

function events(rand: () => number): Part[] {
  const parts: Part[] = [];
  // the stadium sits left; the bowl now reaches high, so the ferris wheel and
  // flanking buildings are pushed clear to the right/back to stay legible.
  parts.push(...stadiumParts(rand, -3.5, 0.5));
  parts.push(ferrisPart(rand, 7, 3.6, -3.5, 3.2));
  // a couple of detailed buildings flanking the grounds
  parts.push(buildingPart(rand, 7, 4.5, 2.6, 6, 2.6, true));
  parts.push(buildingPart(rand, 4.5, 6, 3, 5, 3, true));
  parts.push(linePart(rand, gridGeo(24, 11)));
  return parts;
}

export function buildCityModel(industry: Industry): Part[] {
  const rand = mulberry32(
    { manufacturing: 11, retail: 22, "smart-cities": 33, events: 44 }[industry],
  );
  switch (industry) {
    case "manufacturing":
      return manufacturing(rand);
    case "retail":
      return retail(rand);
    case "smart-cities":
      return smartCities(rand);
    case "events":
      return events(rand);
  }
}
