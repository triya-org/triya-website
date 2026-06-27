import * as THREE from "three";

/**
 * Fresh, minimal procedural emblems for the line-art industry sections —
 * rendered as edges/outline only (Scale-silhouette style), NOT the city geometry.
 * Each model is a small set of "parts"; every part carries its final position
 * and an exploded offset so the scene can assemble on scroll-into-view.
 *
 * Keep parts few and shapes simple — the look is sparse contour line-art, not a
 * busy model.
 */

export type Industry = "manufacturing" | "retail" | "smart-cities" | "events";

export interface Part {
  /** line geometry ready for <lineSegments> (already edges, or native lines) */
  geo: THREE.BufferGeometry;
  pos: [number, number, number];
  /** exploded offset added to pos at assemble progress 0 */
  ex: [number, number, number];
}

const R = () => Math.random() * 2 - 1;
const explode = (s = 3): [number, number, number] => [R() * s, R() * s * 0.5 + 1.4, R() * s];

/** mesh geometry → contour edges (and dispose the source) */
function edges(geo: THREE.BufferGeometry, threshold = 18) {
  const e = new THREE.EdgesGeometry(geo, threshold);
  geo.dispose();
  return e;
}
const mPart = (geo: THREE.BufferGeometry, pos: [number, number, number]): Part => ({
  geo: edges(geo),
  pos,
  ex: explode(),
});
const lPart = (geo: THREE.BufferGeometry, pos: [number, number, number]): Part => ({
  geo,
  pos,
  ex: explode(),
});

/** a right-triangle prism (a sawtooth-roof tooth) */
function prism(w: number, h: number, d: number) {
  const s = new THREE.Shape();
  s.moveTo(0, 0);
  s.lineTo(w, 0);
  s.lineTo(0, h);
  s.closePath();
  const g = new THREE.ExtrudeGeometry(s, { depth: d, bevelEnabled: false });
  g.translate(-w / 2, -h / 2, -d / 2);
  return g;
}

/** native line segments from a flat [x,y,z, x,y,z, ...] point list */
function lineGeo(pts: number[]) {
  const g = new THREE.BufferGeometry();
  g.setAttribute("position", new THREE.Float32BufferAttribute(pts, 3));
  return g;
}

const SX = 1.34; // stadium oval stretch on x
/** a closed oval ring at height y */
function ovalLine(r: number, y: number, n = 52) {
  const pts: number[] = [];
  for (let i = 0; i < n; i++) {
    const a0 = (i / n) * Math.PI * 2;
    const a1 = ((i + 1) / n) * Math.PI * 2;
    pts.push(Math.cos(a0) * r * SX, y, Math.sin(a0) * r, Math.cos(a1) * r * SX, y, Math.sin(a1) * r);
  }
  return lineGeo(pts);
}
/** vertical-ish struts from a bottom oval to a top oval (the seating slope ribs) */
function strutsLine(rB: number, yB: number, rT: number, yT: number, n = 52, every = 3) {
  const pts: number[] = [];
  for (let i = 0; i < n; i += every) {
    const a = (i / n) * Math.PI * 2;
    pts.push(Math.cos(a) * rB * SX, yB, Math.sin(a) * rB, Math.cos(a) * rT * SX, yT, Math.sin(a) * rT);
  }
  return lineGeo(pts);
}

/** a flat street grid as native line segments */
function gridGeo(size: number, div: number) {
  const pts: number[] = [];
  const half = size / 2;
  const step = size / div;
  for (let i = 0; i <= div; i++) {
    const p = -half + i * step;
    pts.push(-half, 0, p, half, 0, p, p, 0, -half, p, 0, half);
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute("position", new THREE.Float32BufferAttribute(pts, 3));
  return g;
}

function manufacturing(): Part[] {
  return [
    mPart(new THREE.BoxGeometry(4, 1.7, 2.2), [0, -0.3, 0]), // main hall
    mPart(prism(1.15, 0.62, 2.2), [-1.28, 0.9, 0]), // sawtooth roof ×3
    mPart(prism(1.15, 0.62, 2.2), [0, 0.9, 0]),
    mPart(prism(1.15, 0.62, 2.2), [1.28, 0.9, 0]),
    mPart(new THREE.CylinderGeometry(0.16, 0.2, 1.7, 14), [1.55, 1.35, -0.65]), // stack
    mPart(new THREE.BoxGeometry(3.6, 0.12, 0.5), [-0.1, -1.25, 1.4]), // conveyor
    mPart(new THREE.BoxGeometry(0.5, 0.5, 0.5), [-1.4, -0.95, 1.4]), // crate
    mPart(new THREE.BoxGeometry(0.5, 0.5, 0.5), [1.2, -0.95, 1.4]), // crate
  ];
}

function retail(): Part[] {
  return [
    mPart(new THREE.BoxGeometry(3.6, 2.2, 2.4), [0, 0, 0]), // store
    mPart(new THREE.BoxGeometry(3.95, 0.22, 0.95), [0, 0.85, 1.35]), // awning
    mPart(new THREE.BoxGeometry(0.95, 1.45, 0.08), [-1.0, -0.38, 1.21]), // door
    mPart(new THREE.BoxGeometry(1.7, 0.95, 0.08), [0.75, 0.12, 1.21]), // window
    mPart(new THREE.BoxGeometry(2.4, 0.5, 0.25), [0, 1.4, 0]), // roof sign
    mPart(new THREE.BoxGeometry(1.5, 0.95, 0.55), [-0.95, -0.5, -0.55]), // shelf
    mPart(new THREE.BoxGeometry(1.5, 0.95, 0.55), [0.95, -0.5, -0.55]), // shelf
  ];
}

function smartCities(): Part[] {
  return [
    mPart(new THREE.BoxGeometry(0.95, 2.7, 0.95), [-1.45, 0.35, -0.45]),
    mPart(new THREE.BoxGeometry(1.05, 3.5, 1.05), [0.05, 0.75, 0]),
    mPart(new THREE.BoxGeometry(0.85, 2.1, 0.85), [1.4, 0.05, 0.35]),
    mPart(new THREE.BoxGeometry(0.7, 1.4, 0.7), [0.65, -0.3, -1.25]),
    lPart(gridGeo(7.5, 9), [0, -1.05, 0]), // street grid
  ];
}

function events(): Part[] {
  // a RIBBED stadium bowl: rising/widening oval tiers tied together by sloped
  // struts, so it reads as a bowl from any angle (not flat lines edge-on).
  return [
    lPart(ovalLine(1.25, -0.5), [0, 0, 0]), // lower tier
    lPart(ovalLine(1.85, -0.12), [0, 0, 0]), // mid tier
    lPart(ovalLine(2.5, 0.42), [0, 0, 0]), // upper tier
    lPart(strutsLine(1.25, -0.5, 2.5, 0.42), [0, 0, 0]), // seating ribs
    lPart(ovalLine(0.82, -0.55), [0, 0, 0]), // pitch
  ];
}

export function buildModel(industry: Industry): Part[] {
  switch (industry) {
    case "manufacturing":
      return manufacturing();
    case "retail":
      return retail();
    case "smart-cities":
      return smartCities();
    case "events":
      return events();
  }
}
