import * as THREE from "three";

/* ============================================================
   Camera clearance sweep (spec §3.4 / §0.18) — dev-mode CI.

   Because the motion law smooths the PROGRESS SCALAR (never the
   3D position), the rendered camera is always exactly ON the
   spline — so certifying the spline certifies the path actually
   flown. We sweep:
     1. the spline at N uniform samples, and
     2. a pSmooth step-response simulation at worst-case scrub
        velocity (belt-and-braces: its samples are a subset of
        the spline by construction, but the simulation documents
        the law and catches any future off-spline regression).

   Altitude-aware radii: CANYON (y < 6.8) flies tight corridors
   and authored pockets → 1.2u; TRANSIT/GOD → 2.5u.

   Colliders are AABBs captured FROM THE GENERATORS at build time
   (buildings incl. antenna margin, street-lamp heads) — reseeds
   can't silently break the camera.
   ============================================================ */

export interface Collider {
  x: number;
  z: number;
  /** half-width (x) / half-depth (z) of the AABB footprint */
  hw: number;
  hd: number;
  /** top of the AABB (ground = 0) */
  h: number;
  label?: string;
}

export interface ClearanceViolation {
  u: number;
  point: { x: number; y: number; z: number };
  required: number;
  actual: number;
  collider: Collider;
}

const CANYON_CEILING = 6.8;
const RADIUS_CANYON = 1.2;
const RADIUS_HIGH = 2.5;

/** distance from a point to a ground-anchored AABB (0 inside) */
function aabbDistance(p: THREE.Vector3, c: Collider) {
  const dx = Math.max(0, Math.abs(p.x - c.x) - c.hw);
  const dz = Math.max(0, Math.abs(p.z - c.z) - c.hd);
  const dy = Math.max(0, p.y - c.h); // only above the top counts as vertical gap
  if (p.y <= c.h) return Math.hypot(dx, dz); // beside or THROUGH the volume
  return Math.hypot(dx, dz, dy);
}

export function sweepClearance(
  colliders: Collider[],
  /** evaluates the camera position for spline-u into `out` */
  pointAt: (u: number, out: THREE.Vector3) => void,
  /** scroll-progress → spline-u remap (the beat pacing) */
  remapU: (p: number) => number,
  samples = 1000,
): ClearanceViolation[] {
  const violations: ClearanceViolation[] = [];
  const pt = new THREE.Vector3();

  const check = (u: number) => {
    pointAt(u, pt);
    const required = pt.y < CANYON_CEILING ? RADIUS_CANYON : RADIUS_HIGH;
    for (const c of colliders) {
      const actual = aabbDistance(pt, c);
      if (actual < required - 1e-6) {
        violations.push({
          u,
          point: { x: pt.x, y: pt.y, z: pt.z },
          required,
          actual,
          collider: c,
        });
        break; // one violation per sample is enough to fail with the offending u
      }
    }
  };

  // 1. uniform spline sweep
  for (let i = 0; i <= samples; i++) check(i / samples);

  // 2. pSmooth step-response at worst-case Lenis scrub velocity:
  //    p slams 0→1 instantly; the lag constant chases it at 30fps frames.
  //    Every evaluated u must also clear (it lies on the spline, but this
  //    documents the law and guards future off-spline regressions).
  let pSmooth = 0;
  const dt = 1 / 30;
  const k = 1 - Math.exp(-6.5 * dt);
  for (let f = 0; f < 240 && pSmooth < 0.9995; f++) {
    pSmooth += (1 - pSmooth) * k;
    check(remapU(pSmooth));
  }

  return violations;
}

/** Dev-mode gate: console.error loudly (Playwright greps for the tag) and
    expose on window for the QA harness. Never throws — a broken camera
    must still render so the offending frame can be SEEN. */
export function assertClearance(
  colliders: Collider[],
  pointAt: (u: number, out: THREE.Vector3) => void,
  remapU: (p: number) => number,
) {
  if (process.env.NODE_ENV === "production") return;
  const violations = sweepClearance(colliders, pointAt, remapU);
  if (violations.length) {
    const worst = violations.reduce((a, b) =>
      a.required - a.actual > b.required - b.actual ? a : b,
    );
    console.error(
      `[city-clearance] ${violations.length} violation(s); worst at u=${worst.u.toFixed(4)} ` +
        `y=${worst.point.y.toFixed(2)} clearance=${worst.actual.toFixed(2)} ` +
        `(needs ${worst.required}) vs ${worst.collider.label ?? "building"} ` +
        `@(${worst.collider.x.toFixed(1)},${worst.collider.z.toFixed(1)} h=${worst.collider.h.toFixed(1)})`,
      violations.slice(0, 8),
    );
  }
  (window as unknown as Record<string, unknown>).__cityClearanceViolations =
    violations;
}
