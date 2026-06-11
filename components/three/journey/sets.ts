import * as THREE from "three";
import { RoundedBoxGeometry } from "three/examples/jsm/geometries/RoundedBoxGeometry.js";
import {
  mulberry32,
  paint,
  mergeSafe,
  bakeAngularPop,
  bakeDropHeights,
} from "@/components/three/lib/popGrow";

/* ============================================================
   The Turntable — four industry "stage sets", all procedural,
   each ≤4 merged draws (structures / windowsDark / windowsLit /
   props), dressed in the house pastel chorus and keyed with
   ANGULAR aPop so turns crossfade as one seam sweeping the rim.
   ============================================================ */

export interface IndustrySet {
  structures: THREE.BufferGeometry | null;
  windowsDark: THREE.BufferGeometry | null;
  windowsLit: THREE.BufferGeometry | null;
  props: THREE.BufferGeometry | null;
}

const SEAM = -Math.PI * 0.75; // sweep origin (back-left of the camera view)

const SAND = "#EDE4D3";
const OCHRE = "#E9D8C0";
const SAGE = "#CFD3BC";
const BLUEGREY = "#C3CCC9";
const APRICOT = "#E5C1A5";
const SHELL = "#E8CFC8";
const BLUSH = "#DFAE92";
const ROSE = "#D9BCAD";
const LILAC = "#E2D6E0";
const TRUNK = "#A8A293";
const INKISH = "#56524A";
const WIN_DARK = "#BFB4A0";
const WIN_LIT = "#FFE2B8";
const CREAM300 = "#D9D4C4";

const c = new THREE.Color();

function finish(
  groups: Record<keyof IndustrySet, THREE.BufferGeometry[]>,
): IndustrySet {
  (Object.keys(groups) as (keyof IndustrySet)[]).forEach((k) => {
    bakeAngularPop(groups[k], SEAM);
    bakeDropHeights(groups[k]); // rigid slide — props never deform
  });
  return {
    structures: mergeSafe(groups.structures),
    windowsDark: mergeSafe(groups.windowsDark),
    windowsLit: mergeSafe(groups.windowsLit),
    props: mergeSafe(groups.props),
  };
}

const box = (
  arr: THREE.BufferGeometry[],
  w: number,
  h: number,
  d: number,
  x: number,
  y: number,
  z: number,
  hex: string,
  ry = 0,
  round = 0,
) => {
  const g =
    round > 0
      ? new RoundedBoxGeometry(w, h, d, 2, round)
      : new THREE.BoxGeometry(w, h, d);
  if (ry) g.rotateY(ry);
  g.translate(x, y, z);
  paint(g, c.set(hex));
  arr.push(g);
  return g;
};

/* ---------------- MANUFACTURING — sawtooth hall, cutaway ---------------- */
export function buildManufacturing(): IndustrySet {
  const rand = mulberry32(11);
  const G: Record<keyof IndustrySet, THREE.BufferGeometry[]> = {
    structures: [],
    windowsDark: [],
    windowsLit: [],
    props: [],
  };
  // floor slab
  box(G.structures, 17, 0.25, 11, 0, 0.12, 0, SAGE);
  // back wall + side walls (front open = dollhouse cutaway toward camera -x)
  box(G.structures, 0.4, 5.2, 11, 8.2, 2.6, 0, SAND);
  box(G.structures, 17, 5.2, 0.4, 0, 2.6, -5.4, SAND);
  box(G.structures, 17, 2.2, 0.4, 0, 1.1, 5.4, SAND); // low front parapet
  // sawtooth roof: 4 angled panels + verticals along x
  for (let i = 0; i < 4; i++) {
    const x0 = -6.4 + i * 4.2;
    const slope = new THREE.BoxGeometry(4.4, 0.22, 11);
    slope.rotateZ(0.42);
    slope.translate(x0 + 0.4, 6.1, 0);
    paint(slope, c.set(OCHRE));
    G.structures.push(slope);
    // clerestory glazing on each tooth (lit)
    const glaze = new THREE.PlaneGeometry(3.4, 1.1);
    glaze.rotateY(Math.PI / 2);
    glaze.rotateZ(0);
    glaze.translate(x0 - 1.4, 6.0, 0);
    paint(glaze, c.set(WIN_LIT));
    G.windowsLit.push(glaze);
  }
  // conveyor bed + legs
  box(G.props, 12, 0.3, 1.2, -0.5, 1.05, 1.6, INKISH);
  for (let i = 0; i < 5; i++)
    box(G.props, 0.18, 0.9, 0.18, -5.8 + i * 2.7, 0.45, 1.6, TRUNK);
  // gantry portals
  for (const gx of [-3.5, 2.5]) {
    box(G.props, 0.25, 3.2, 0.25, gx, 1.6, -2.8, BLUEGREY);
    box(G.props, 0.25, 3.2, 0.25, gx, 1.6, 2.8, BLUEGREY);
    box(G.props, 0.25, 0.3, 6.0, gx, 3.25, 0, BLUEGREY);
  }
  // safety walkway stripe (cream — NOT clay; clay budget)
  box(G.props, 14, 0.02, 0.5, 0, 0.27, 3.4, CREAM300);
  // pallet stacks
  for (let i = 0; i < 5; i++)
    box(
      G.props,
      0.9,
      0.5 + rand() * 0.6,
      0.9,
      -6 + rand() * 4,
      0.5,
      -3.6 + rand() * 1.4,
      [SAND, OCHRE, ROSE][i % 3],
      0,
      0.05,
    );
  // back-wall windows (dark)
  for (let i = 0; i < 6; i++) {
    const g = new THREE.PlaneGeometry(0.8, 1.1);
    g.rotateY(-Math.PI / 2);
    g.translate(7.95, 2.6, -4 + i * 1.6);
    paint(g, c.set(WIN_DARK));
    G.windowsDark.push(g);
  }
  return finish(G);
}

/* ---------------- RETAIL — gondolas, facade, counters ---------------- */
export function buildRetail(): IndustrySet {
  const rand = mulberry32(22);
  const G: Record<keyof IndustrySet, THREE.BufferGeometry[]> = {
    structures: [],
    windowsDark: [],
    windowsLit: [],
    props: [],
  };
  box(G.structures, 16, 0.22, 11, 0, 0.11, 0, SHELL); // floor
  // glass-front facade: mullion grid (no glass material — perf)
  for (let i = 0; i <= 8; i++)
    box(G.structures, 0.16, 3.6, 0.16, -7 + i * 1.75, 1.8, 5.2, SAND);
  box(G.structures, 14.5, 0.3, 0.3, 0, 3.7, 5.2, SAND);
  // back + side walls
  box(G.structures, 16, 4.2, 0.35, 0, 2.1, -5.3, APRICOT);
  // east wall only — the camera-side (west) face stays OPEN (dollhouse
  // cutaway: the aisles, queue and tills must be visible from the hold)
  box(G.structures, 0.35, 4.2, 10.8, 7.9, 2.1, 0, SAND);
  // gondola rows (pastel shelving)
  const rowCols = [APRICOT, SAGE, ROSE, BLUSH];
  for (let r = 0; r < 4; r++) {
    box(G.props, 1.1, 1.5, 7.5, -4.5 + r * 3, 0.86, -0.4, rowCols[r], 0, 0.06);
    // goods: small varied cubes on top
    for (let k = 0; k < 6; k++)
      box(
        G.props,
        0.45,
        0.3 + rand() * 0.25,
        0.5,
        -4.5 + r * 3 + (rand() - 0.5) * 0.5,
        1.75,
        -3.4 + k * 1.2,
        [SAND, LILAC, SHELL, OCHRE][k % 4],
      );
  }
  // two checkout counters near the facade
  for (const cx of [-2.2, 2.2])
    box(G.props, 2.2, 0.95, 0.9, cx, 0.6, 3.6, SAND, 0, 0.07);
  // lit interior signage strips
  for (let i = 0; i < 4; i++) {
    const g = new THREE.PlaneGeometry(2.2, 0.5);
    g.translate(-4.5 + i * 3, 3.1, -5.1);
    paint(g, c.set(WIN_LIT));
    G.windowsLit.push(g);
  }
  return finish(G);
}

/* ---------------- SMART CITIES — one intersection of the Living City ---------------- */
export function buildSmartCities(): IndustrySet {
  const rand = mulberry32(33);
  const G: Record<keyof IndustrySet, THREE.BufferGeometry[]> = {
    structures: [],
    windowsDark: [],
    windowsLit: [],
    props: [],
  };
  // crossing roads (vertex-colored planes)
  for (const horizontal of [true, false]) {
    const road = new THREE.PlaneGeometry(horizontal ? 24 : 4.4, horizontal ? 4.4 : 24);
    road.rotateX(-Math.PI / 2);
    road.translate(0, 0.06, 0);
    paint(road, c.set("#E3DDCE"));
    G.structures.push(road);
  }
  // crosswalk bars
  for (const dist of [3.6, -3.6])
    for (let k = -2; k <= 2; k++)
      for (const horizontal of [true, false]) {
        const bar = new THREE.PlaneGeometry(horizontal ? 0.4 : 2.8, horizontal ? 2.8 : 0.4);
        bar.rotateX(-Math.PI / 2);
        bar.translate(horizontal ? dist : k * 0.7, 0.075, horizontal ? k * 0.7 : dist);
        paint(bar, c.set("#F1ECDF"));
        G.structures.push(bar);
      }
  // mini towers in the four corners (the city's own DNA)
  const corners = [
    [-7, -7],
    [7, -7],
    [-7, 7],
    [7, 7],
  ];
  corners.forEach(([qx, qz], ci) => {
    for (let b = 0; b < 2 + (ci % 2); b++) {
      const w = 2 + rand() * 1;
      const h = 2.5 + rand() * 4.5;
      const bx = qx + (rand() - 0.5) * 4;
      const bz = qz + (rand() - 0.5) * 4;
      const hex = [SAND, OCHRE, BLUEGREY, ROSE, APRICOT][Math.floor(rand() * 5)];
      box(G.structures, w, h, w, bx, h / 2 + 0.1, bz, hex, 0, 0.1);
      // a few windows
      for (let wi = 0; wi < 4; wi++) {
        const lit = rand() < 0.25;
        for (const sz of [1, -1]) {
          const g = new THREE.PlaneGeometry(0.4, 0.55);
          if (sz < 0) g.rotateY(Math.PI);
          g.translate(bx - w / 4 + (wi % 2) * (w / 2), 1 + Math.floor(wi / 2) * 1.2, bz + sz * (w / 2 + 0.02));
          paint(g, c.set(lit ? WIN_LIT : WIN_DARK));
          (lit ? G.windowsLit : G.windowsDark).push(g);
        }
      }
    }
  });
  // lamp poles + signal posts at the intersection
  for (const [px, pz] of [
    [2.6, 2.6],
    [-2.6, -2.6],
  ]) {
    box(G.props, 0.12, 2.6, 0.12, px, 1.3, pz, TRUNK);
    box(G.props, 0.34, 0.8, 0.18, px, 2.9, pz, INKISH, 0, 0.04); // signal head body
  }
  for (const [px, pz] of [
    [-2.6, 2.6],
    [2.6, -2.6],
  ])
    box(G.props, 0.1, 2.4, 0.1, px, 1.2, pz, TRUNK);
  return finish(G);
}

/* ---------------- EVENTS — stage, gates, crowd ground ---------------- */
export function buildEvents(): IndustrySet {
  const rand = mulberry32(44);
  const G: Record<keyof IndustrySet, THREE.BufferGeometry[]> = {
    structures: [],
    windowsDark: [],
    windowsLit: [],
    props: [],
  };
  // event ground
  const ground = new THREE.CircleGeometry(12, 40);
  ground.rotateX(-Math.PI / 2);
  ground.translate(0, 0.05, 0);
  paint(ground, c.set("#EAE3D2"));
  G.structures.push(ground);
  // stage + truss at back (+x side, faces camera)
  box(G.structures, 7, 1.1, 4.2, 4.5, 0.6, -1.5, INKISH, 0, 0.06);
  for (const [tx, tz] of [
    [1.4, -3.4],
    [7.6, -3.4],
    [1.4, 0.4],
    [7.6, 0.4],
  ])
    box(G.structures, 0.22, 4.4, 0.22, tx, 2.2, tz, TRUNK);
  box(G.structures, 6.6, 0.25, 0.25, 4.5, 4.4, -3.4, TRUNK);
  box(G.structures, 6.6, 0.25, 0.25, 4.5, 4.4, 0.4, TRUNK);
  // 3 gate arches on the camera side (-x)
  for (let g = 0; g < 3; g++) {
    const gz = -3.4 + g * 3.4;
    box(G.props, 0.3, 2.6, 0.3, -8.5, 1.3, gz - 0.9, LILAC, 0, 0.05);
    box(G.props, 0.3, 2.6, 0.3, -8.5, 1.3, gz + 0.9, LILAC, 0, 0.05);
    box(G.props, 0.3, 0.35, 2.1, -8.5, 2.75, gz, BLUSH, 0, 0.05);
  }
  // VIP corridor: held negative space outlined by a cream-300 hairline
  for (const [w_, d_, x_, z_] of [
    [4.6, 0.06, -3.5, 5.6],
    [4.6, 0.06, -3.5, 7.2],
    [0.06, 1.66, -5.8, 6.4],
    [0.06, 1.66, -1.2, 6.4],
  ] as const)
    box(G.props, w_, 0.16, d_, x_, 0.14, z_, CREAM300);
  // barrier ribbons guiding to gates
  for (let r = 0; r < 4; r++)
    box(G.props, 5.5, 0.5, 0.08, -6.2, 0.45, -4.6 + r * 2.4, CREAM300);
  // tiered stand (3 steps) on +z side
  for (let st = 0; st < 3; st++)
    box(G.structures, 6 - st * 1.4, 0.5, 2.2, 2.5, 0.3 + st * 0.5, 4.6, [SAND, ROSE, LILAC][st], 0, 0.05);
  // string lights between truss and gates (emissive dots)
  for (let i = 0; i < 26; i++) {
    const t = i / 25;
    const sx = -8 + t * 12;
    const sy = 3.4 + Math.sin(Math.PI * t) * -0.7 + 0.7;
    const sz = -4.6 + (i % 2) * 0.15;
    const dot = new THREE.BoxGeometry(0.12, 0.12, 0.12);
    dot.translate(sx, sy, sz);
    paint(dot, c.set("#FFE9C4"));
    G.windowsLit.push(dot);
    if (rand() < 0.4) {
      const dot2 = new THREE.BoxGeometry(0.12, 0.12, 0.12);
      dot2.translate(sx, sy - 0.15, sz + 8.5);
      paint(dot2, c.set("#FFE9C4"));
      G.windowsLit.push(dot2);
    }
  }
  return finish(G);
}

export function buildAllSets() {
  return {
    manufacturing: buildManufacturing(),
    retail: buildRetail(),
    smartCities: buildSmartCities(),
    events: buildEvents(),
  };
}
