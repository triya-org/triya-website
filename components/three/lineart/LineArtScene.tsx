"use client";

import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { useEffect, useMemo, useRef } from "react";
import * as THREE from "three";
import type { Industry } from "@/components/three/lineart/models";
import { buildCityModel } from "@/components/three/lineart/cityBuildings";

/**
 * THE SWEEP — a line-art district that ASSEMBLES from scattered fragments and
 * CRANES around as you scroll the section, then holds while Triya "catches" a
 * detection on it. Everything is driven by ONE scroll-progress value (0..1)
 * read from a ref the parent feeds (no per-frame React state, no ScrollTrigger).
 *
 *   progress 0.00–0.12  → exploded, near-invisible (text cascades in)
 *   progress 0.12–0.62  → fragments converge (asm 0→1), opacity rises, crane runs
 *   progress 0.62–1.00  → assembled, settles, holds (the "catch" fires in DOM)
 *
 * A model-space ANCHOR is projected to screen pixels every frame and reported to
 * the parent (`onAnchor`) so a DOM detection box + leader line stay glued to the
 * building as it rotates. Reduced motion → assembled + still, frameloop demand.
 */

const easeOutCubic = (x: number) => 1 - Math.pow(1 - x, 3);
const remap = (v: number, a: number, b: number) =>
  Math.max(0, Math.min(1, (v - a) / (b - a)));

export interface AnchorReport {
  x: number;
  y: number;
  on: boolean;
}

export function LineArtScene({
  industry,
  reduced,
  color,
  progressRef,
  enteredRef,
  anchorLocal,
  craneFrom,
  craneTo,
  xBias,
  lift = 0,
  fitScale = 1,
  onAnchor,
}: {
  industry: Industry;
  reduced: boolean;
  color: string;
  /** scroll progress 0..1 of the section's sticky runway (mutated by parent) */
  progressRef: React.MutableRefObject<number>;
  /** flips true once the section is in view — drives the time-based assemble */
  enteredRef: React.MutableRefObject<boolean>;
  /** detection anchor in district/model space */
  anchorLocal: [number, number, number];
  /** crane rotation.y range (radians) mapped across the assemble band */
  craneFrom: number;
  craneTo: number;
  /** world-x offset so the district bleeds toward one edge */
  xBias: number;
  /** world-y lift so the district breaks the upper third (kills top dead-band) */
  lift?: number;
  /** extra zoom-out multiplier on the auto-fit (1 = fit; <1 = more margin) */
  fitScale?: number;
  /** called each frame with the anchor's screen position (px, in canvas space) */
  onAnchor: (a: AnchorReport) => void;
}) {
  return (
    <Canvas
      dpr={[1, 1.6]}
      camera={{ position: [0, 1.1, 7.6], fov: 36 }}
      // mounted only when near-viewport (parent gates), so render continuously;
      // gating on an "active" observer left the canvas blank at rest after a
      // fast scroll-settle. Reduced motion still uses "demand".
      frameloop={reduced ? "demand" : "always"}
      gl={{ antialias: true, alpha: true, powerPreference: "high-performance" }}
    >
      <Model
        industry={industry}
        reduced={reduced}
        color={color}
        progressRef={progressRef}
        enteredRef={enteredRef}
        anchorLocal={anchorLocal}
        craneFrom={craneFrom}
        craneTo={craneTo}
        xBias={xBias}
        lift={lift}
        fitScale={fitScale}
        onAnchor={onAnchor}
      />
    </Canvas>
  );
}

function Model({
  industry,
  reduced,
  color,
  progressRef,
  enteredRef,
  anchorLocal,
  craneFrom,
  craneTo,
  xBias,
  lift,
  fitScale,
  onAnchor,
}: {
  industry: Industry;
  reduced: boolean;
  color: string;
  progressRef: React.MutableRefObject<number>;
  enteredRef: React.MutableRefObject<boolean>;
  anchorLocal: [number, number, number];
  craneFrom: number;
  craneTo: number;
  xBias: number;
  lift: number;
  fitScale: number;
  onAnchor: (a: AnchorReport) => void;
}) {
  const { camera, size, invalidate, viewport } = useThree();
  const parts = useMemo(() => buildCityModel(industry), [industry]);

  // dispose the externally-built geometries when the canvas unmounts (r3f does
  // not auto-dispose geometry passed as a prop) — prevents GPU buffer leaks
  useEffect(() => () => parts.forEach((p) => p.geo.dispose()), [parts]);

  const bbox = useMemo(() => {
    const box = new THREE.Box3();
    const v = new THREE.Vector3();
    for (const p of parts) {
      p.geo.computeBoundingBox();
      if (p.geo.boundingBox) box.union(p.geo.boundingBox);
    }
    return {
      size: box.getSize(new THREE.Vector3()),
      center: box.getCenter(v.clone()),
    };
  }, [parts]);

  // auto-fit: scale so the WHOLE model — buildings AND the ground grid — fits
  // the viewport on BOTH axes (whichever is binding), so a tall district like
  // Smart Cities zooms out enough to show its base/ground, and a wide-flat one
  // still fills nicely. Centred, so the floor reads in full.
  const fit = useMemo(() => {
    const fitW = (viewport.width * 0.84) / (bbox.size.x || 1);
    const fitH = (viewport.height * 0.84) / (bbox.size.y || 1);
    return { scale: Math.min(fitW, fitH) * fitScale, center: bbox.center };
  }, [bbox, viewport.width, viewport.height, fitScale]);

  const outer = useRef<THREE.Group>(null);
  const segs = useRef<(THREE.LineSegments | null)[]>([]);
  const anchorObj = useRef<THREE.Object3D>(null);
  const tmp = useRef(new THREE.Vector3());
  const report = useRef<AnchorReport>({ x: 0, y: 0, on: false });
  const asm = useRef(reduced ? 1 : 0); // assemble progress (time-based)

  // reduced motion uses frameloop "demand": kick a few renders so the static
  // layout lays out and the anchor projects (incl. after size settles)
  useEffect(() => {
    if (!reduced) return; // "always" loop handles the animated case
    let n = 0;
    let raf = 0;
    const tick = () => {
      invalidate();
      if (++n < 8) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    const onResize = () => invalidate();
    window.addEventListener("resize", onResize);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", onResize);
    };
  }, [reduced, invalidate]);

  useFrame((_, delta) => {
    const p = reduced ? 1 : progressRef.current;
    const dt = Math.min(0.05, delta);

    // ASSEMBLE — time-based, eased toward 1 once the section is in view (not
    // tied to scroll position), so the district is reliably visible on arrival
    // and assembles smoothly instead of popping or staying blank until scroll.
    const target = reduced || enteredRef.current ? 1 : 0;
    asm.current += (target - asm.current) * dt * 2.6;
    const aRaw = reduced ? 1 : easeOutCubic(Math.min(1, Math.max(0, asm.current)));
    for (let i = 0; i < parts.length; i++) {
      const m = segs.current[i];
      const part = parts[i];
      if (!m) continue;
      m.position.set(
        part.pos[0] + part.ex[0] * (1 - aRaw),
        part.pos[1] + part.ex[1] * (1 - aRaw),
        part.pos[2] + part.ex[2] * (1 - aRaw),
      );
      (m.material as THREE.LineBasicMaterial).opacity = 0.05 + 0.85 * aRaw;
    }

    // crane: rotate with scroll across the runway, + a tiny idle breath
    if (outer.current) {
      const craneT = reduced ? 1 : easeOutCubic(remap(p, 0.05, 0.85));
      const breath = reduced ? 0 : Math.sin(p * Math.PI * 6) * 0.012;
      outer.current.rotation.y = craneFrom + (craneTo - craneFrom) * craneT + breath;
      outer.current.rotation.x = -0.16;
    }

    // project the anchor to screen px and report (reuse the report object)
    if (anchorObj.current) {
      const w = tmp.current;
      anchorObj.current.getWorldPosition(w);
      w.project(camera);
      const r = report.current;
      r.x = (w.x * 0.5 + 0.5) * size.width;
      r.y = (-w.y * 0.5 + 0.5) * size.height;
      r.on = w.z < 1;
      onAnchor(r);
    }
  });

  return (
    <group ref={outer} rotation={[-0.16, craneFrom, 0]} position={[xBias, 0, 0]}>
      {/* inner group fits the district to frame (scale + centre + lift) */}
      <group
        scale={fit.scale}
        position={[
          -fit.center.x * fit.scale,
          -fit.center.y * fit.scale + lift,
          -fit.center.z * fit.scale,
        ]}
      >
        {parts.map((part, i) => (
          <lineSegments
            key={i}
            geometry={part.geo}
            position={
              reduced
                ? part.pos
                : [
                    part.pos[0] + part.ex[0],
                    part.pos[1] + part.ex[1],
                    part.pos[2] + part.ex[2],
                  ]
            }
            ref={(el) => {
              segs.current[i] = el;
            }}
          >
            <lineBasicMaterial color={color} transparent opacity={reduced ? 0.9 : 0.05} />
          </lineSegments>
        ))}
        {/* the detection anchor lives in district space (inherits fit + crane) */}
        <object3D ref={anchorObj} position={anchorLocal} />
      </group>
    </group>
  );
}
