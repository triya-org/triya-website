import * as THREE from "three";
import { mergeGeometries } from "three/examples/jsm/utils/BufferGeometryUtils.js";

/* ============================================================
   Shared procedural-scene toolkit (extracted from CityScene):
   deterministic rand, vertex painting, safe merging, and the
   "pop-up-book" grow system (aPop keys + uPop shader scaling),
   now with: angular rim keying (for the Journey's turntable
   crossfades) and a customDepthMaterial patch so SHADOWS
   telescope with the geometry instead of popping at full height.
   ============================================================ */

/** deterministic PRNG — identical scene on every mount */
export function mulberry32(seed: number) {
  return () => {
    seed |= 0;
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** 0→1 ramp inside [a,b] */
export function window01(p: number, a: number, b: number) {
  return THREE.MathUtils.clamp((p - a) / (b - a), 0, 1);
}

/** flat-fill a geometry's vertex colors */
export function paint(geo: THREE.BufferGeometry, color: THREE.Color) {
  const n = geo.attributes.position.count;
  const arr = new Float32Array(n * 3);
  for (let i = 0; i < n; i++) {
    arr[i * 3] = color.r;
    arr[i * 3 + 1] = color.g;
    arr[i * 3 + 2] = color.b;
  }
  geo.setAttribute("color", new THREE.BufferAttribute(arr, 3));
  return geo;
}

/**
 * Safe merge: mergeGeometries returns NULL on mixed indexed/non-indexed
 * inputs (icosahedra vs boxes). Normalize to non-indexed first.
 */
export function mergeSafe(geos: THREE.BufferGeometry[]): THREE.BufferGeometry | null {
  if (!geos.length) return null;
  const normalized = geos.map((g) => {
    if (!g.index) return g;
    const ni = g.toNonIndexed();
    g.dispose();
    return ni;
  });
  const merged = mergeGeometries(normalized, false);
  normalized.forEach((g) => g.dispose());
  return merged;
}

/* ================= pop-up-book grow system ================= */

export const POP_GAP = 0.85; // must match pgap in the injected shader chunk

export function popCellKey(x: number, z: number) {
  const qx = Math.round(x / 3);
  const qz = Math.round(z / 3);
  return (Math.abs(Math.sin(qx * 12.9898 + qz * 78.233)) * 43758.5453) % 1;
}

/** JS mirror of the shader grow ease — instanced hardware rides the exact
    curve of the merged geometry it stands on */
export function popEase(pop: number, key: number) {
  const pk = THREE.MathUtils.clamp(pop * (1 + POP_GAP) - key * POP_GAP, 0, 1);
  return 1 - Math.pow(1 - pk, 3);
}

export function setPopKey(g: THREE.BufferGeometry, key: number) {
  const n = g.attributes.position.count;
  g.setAttribute("aPop", new THREE.BufferAttribute(new Float32Array(n).fill(key), 1));
}

/** quantized-anchor keys (a building and what stands on it rise together) */
export function bakePopKeys(geos: THREE.BufferGeometry[]) {
  const c = new THREE.Vector3();
  geos.forEach((g) => {
    if (g.attributes.aPop) return; // explicitly keyed at creation
    g.computeBoundingBox();
    g.boundingBox!.getCenter(c);
    setPopKey(g, popCellKey(c.x, c.z));
  });
}

/**
 * ANGULAR rim keys for the Journey turntable: aPop = the vertex anchor's
 * sweep fraction across a quarter-turn from `seamAngle`, so the existing
 * pgap stagger turns a crossfade into one clean seam sweeping the rim —
 * leading wedge fully grown, trailing wedge fully sunk, never 50%-everything.
 */
/**
 * Key a group of geometries as ONE slide island (a sawtooth bay = wall +
 * roof + glazing; a truss = legs + beams + string lights): shared aPop from
 * the island's combined centroid rim angle, shared aDrop from its combined
 * top — so no prop can ever orphan from its structure mid-turn.
 */
export function keyIsland(geos: THREE.BufferGeometry[], seamAngle: number) {
  const TAU = Math.PI * 2;
  const box = new THREE.Box3();
  geos.forEach((g) => {
    g.computeBoundingBox();
    box.union(g.boundingBox!);
  });
  const c = new THREE.Vector3();
  box.getCenter(c);
  const a = Math.atan2(c.z, c.x);
  const key = ((((a - seamAngle) % TAU) + TAU) % TAU) / TAU;
  const drop = Math.max(0.6, box.max.y + 0.4);
  geos.forEach((g) => {
    setPopKey(g, key);
    const n = g.attributes.position.count;
    g.setAttribute("aDrop", new THREE.BufferAttribute(new Float32Array(n).fill(drop), 1));
  });
}

export function bakeAngularPop(geos: THREE.BufferGeometry[], seamAngle: number) {
  const c = new THREE.Vector3();
  const TAU = Math.PI * 2;
  geos.forEach((g) => {
    if (g.attributes.aPop) return; // island-keyed at creation
    g.computeBoundingBox();
    g.boundingBox!.getCenter(c);
    const a = Math.atan2(c.z, c.x);
    const key = ((((a - seamAngle) % TAU) + TAU) % TAU) / TAU;
    setPopKey(g, THREE.MathUtils.clamp(key, 0, 1));
  });
}

export type PopShaderStore = {
  current: { uniforms: { uPop: { value: number }; uInv?: { value: number } } }[];
};

const POP_VERTEX_DECL = "#include <common>\nattribute float aPop;\nuniform float uPop;";
const POP_VERTEX_CHUNK = `#include <begin_vertex>
        {
          float pgap = 0.85;
          float pk = clamp((uPop * (1.0 + pgap) - aPop * pgap), 0.0, 1.0);
          float pe = 1.0 - pow(1.0 - pk, 3.0);
          transformed.y *= pe;
        }`;

function injectPop(shader: { uniforms: Record<string, unknown>; vertexShader: string }, store: PopShaderStore) {
  shader.uniforms.uPop = { value: 1 };
  shader.vertexShader = shader.vertexShader
    .replace("#include <common>", POP_VERTEX_DECL)
    .replace("#include <begin_vertex>", POP_VERTEX_CHUNK);
  store.current.push(shader as never);
}

/** patch a render material so aPop/uPop scales vertices from the ground up */
export function addPopGrow(mat: THREE.Material, store: PopShaderStore) {
  mat.onBeforeCompile = (shader) => injectPop(shader, store);
}

/**
 * Depth material with the SAME displacement, so shadow maps telescope with
 * the visible geometry (without this, shadows render at full height while
 * the building is still a stub). Assign to mesh.customDepthMaterial and push
 * its shader into the same store so one uPop write drives both.
 */
export function makePopDepthMaterial(store: PopShaderStore) {
  const depth = new THREE.MeshDepthMaterial({
    depthPacking: THREE.RGBADepthPacking,
  });
  depth.onBeforeCompile = (shader) => injectPop(shader, store);
  return depth;
}


/* ================= rigid slide pop (Journey turntable) =================
   The city's y-SQUASH pop reads as growth for ground-anchored boxes, but
   elevated/slanted props (sawtooth roofs, trusses) "melt" under it. The
   Journey uses RIGID SLIDE instead: each prop translates down through the
   plinth as a unit (aDrop = its own top height), staying undeformed —
   literally telescoping into the paper. */

/** bake per-geo drop heights (rigid slide distance) */
export function bakeDropHeights(geos: THREE.BufferGeometry[]) {
  geos.forEach((g) => {
    if (g.attributes.aDrop) return; // island-keyed at creation
    g.computeBoundingBox();
    const drop = Math.max(0.6, g.boundingBox!.max.y + 0.4);
    const n = g.attributes.position.count;
    g.setAttribute(
      "aDrop",
      new THREE.BufferAttribute(new Float32Array(n).fill(drop), 1),
    );
  });
}

const SLIDE_VERTEX_DECL =
  "#include <common>\nattribute float aPop;\nattribute float aDrop;\nuniform float uPop;\nuniform float uInv;";
const SLIDE_VERTEX_CHUNK = `#include <begin_vertex>
        {
          float pgap = 0.85;
          float kk = mix(aPop, 1.0 - aPop, uInv);
          float pk = clamp((uPop * (1.0 + pgap) - kk * pgap), 0.0, 1.0);
          float pe = 1.0 - pow(1.0 - pk, 3.0);
          transformed.y -= (1.0 - pe) * aDrop;
        }`;

function injectSlide(
  shader: { uniforms: Record<string, unknown>; vertexShader: string },
  store: PopShaderStore,
) {
  shader.uniforms.uPop = { value: 1 };
  shader.uniforms.uInv = { value: 0 };
  shader.vertexShader = shader.vertexShader
    .replace("#include <common>", SLIDE_VERTEX_DECL)
    .replace("#include <begin_vertex>", SLIDE_VERTEX_CHUNK);
  store.current.push(shader as never);
}

export function addPopSlide(mat: THREE.Material, store: PopShaderStore) {
  mat.onBeforeCompile = (shader) => injectSlide(shader, store);
}

export function makeSlideDepthMaterial(store: PopShaderStore) {
  const depth = new THREE.MeshDepthMaterial({ depthPacking: THREE.RGBADepthPacking });
  depth.onBeforeCompile = (shader) => injectSlide(shader, store);
  return depth;
}
