"use client";

import { Canvas, useFrame } from "@react-three/fiber";
import { useMemo, useRef } from "react";
import * as THREE from "three";
import type { Industry } from "@/components/three/lineart/models";
import { buildCityModel } from "@/components/three/lineart/cityBuildings";

/**
 * A minimalist line-art (silhouette) model — Scale-inspired, in Triya's palette.
 * The model ASSEMBLES from an exploded state when its section scrolls into view,
 * then SLOWLY ROTATES with a gentle pointer parallax. Contour lines only.
 *
 * Perf: the parent mounts this only when the section is near the viewport; DPR is
 * capped; frameloop pauses under reduced motion (renders one assembled frame).
 */
export function LineArtScene({
  industry,
  inView,
  reduced,
  color,
}: {
  industry: Industry;
  inView: boolean;
  reduced: boolean;
  color: string;
}) {
  return (
    <Canvas
      dpr={[1, 1.6]}
      camera={{ position: [0, 1.1, 7.6], fov: 36 }}
      frameloop={reduced ? "demand" : "always"}
      gl={{ antialias: true, alpha: true, powerPreference: "high-performance" }}
    >
      <Model industry={industry} inView={inView} reduced={reduced} color={color} />
    </Canvas>
  );
}

function Model({
  industry,
  inView,
  reduced,
  color,
}: {
  industry: Industry;
  inView: boolean;
  reduced: boolean;
  color: string;
}) {
  const parts = useMemo(() => buildCityModel(industry), [industry]);
  // auto-fit: scale + centre the detailed district so it always frames cleanly
  const fit = useMemo(() => {
    const box = new THREE.Box3();
    const v = new THREE.Vector3();
    for (const p of parts) {
      p.geo.computeBoundingBox();
      if (p.geo.boundingBox) box.union(p.geo.boundingBox);
    }
    const size = box.getSize(new THREE.Vector3());
    const center = box.getCenter(v.clone());
    const maxDim = Math.max(size.x, size.y, size.z) || 1;
    const scale = 5.6 / maxDim;
    return { scale, center: center.clone() };
  }, [parts]);
  const group = useRef<THREE.Group>(null);
  const segs = useRef<(THREE.LineSegments | null)[]>([]);
  const asm = useRef(reduced ? 1 : 0);
  const ptr = useRef({ x: 0, y: 0 });

  useFrame((state, delta) => {
    const dt = Math.min(0.05, delta);
    const target = inView || reduced ? 1 : 0;
    asm.current += (target - asm.current) * dt * 2.6;
    const aRaw = Math.min(1, Math.max(0, asm.current));
    const a = 1 - Math.pow(1 - aRaw, 3); // easeOutCubic

    for (let i = 0; i < parts.length; i++) {
      const m = segs.current[i];
      const p = parts[i];
      if (!m) continue;
      m.position.set(
        p.pos[0] + p.ex[0] * (1 - a),
        p.pos[1] + p.ex[1] * (1 - a),
        p.pos[2] + p.ex[2] * (1 - a),
      );
      (m.material as THREE.LineBasicMaterial).opacity = 0.04 + 0.92 * a;
    }

    if (group.current) {
      if (!reduced) group.current.rotation.y += dt * 0.14;
      ptr.current.x += (state.pointer.x - ptr.current.x) * 0.04;
      ptr.current.y += (state.pointer.y - ptr.current.y) * 0.04;
      group.current.rotation.x = -0.16 + ptr.current.y * 0.13;
    }
  });

  return (
    <group ref={group} rotation={[-0.2, 0.5, 0]}>
      {/* inner group fits the district to frame (scale + centre) */}
      <group
        scale={fit.scale}
        position={[-fit.center.x * fit.scale, -fit.center.y * fit.scale, -fit.center.z * fit.scale]}
      >
        {parts.map((p, i) => (
          <lineSegments
            key={i}
            geometry={p.geo}
            position={reduced ? p.pos : [p.pos[0] + p.ex[0], p.pos[1] + p.ex[1], p.pos[2] + p.ex[2]]}
            ref={(el) => {
              segs.current[i] = el;
            }}
          >
            <lineBasicMaterial color={color} transparent opacity={reduced ? 0.95 : 0.04} />
          </lineSegments>
        ))}
      </group>
    </group>
  );
}
