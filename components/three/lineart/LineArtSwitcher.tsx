"use client";

import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { useEffect, useMemo, useRef } from "react";
import * as THREE from "three";
import type { Industry } from "@/components/three/lineart/models";
import { buildCityModel } from "@/components/three/lineart/cityBuildings";

/**
 * THE WATCH FLOOR (industries) — ONE pinned line-art scene that sweeps through
 * the four districts in place. Scroll selects the active industry; on each change
 * a scan-wipe swaps the model: ahead of the bright sweep the OLD district erases,
 * behind it the NEW one draws on (per-part, keyed to a `wipeRef` the parent
 * advances in sync with a DOM scan line). A held district drifts slowly so it's
 * never frozen. A model-space anchor is projected to screen px for the DOM
 * detection reticle. Reduced motion → instant, static, no sweep.
 */

/** the fixed, readable 3/4 view every district holds (ambient sway is small) */
const HERO_YAW = 0.5;
const HERO_TILT = -0.16;

export interface AnchorReport {
  x: number;
  y: number;
  on: boolean;
}

export interface DistrictConfig {
  id: Industry;
  color: string;
  fitScale: number;
  anchor: [number, number, number];
}

export function LineArtSwitcher({
  configs,
  toIndex,
  fromIndex,
  wiping,
  wipeRef,
  reduced,
  onAnchor,
}: {
  configs: DistrictConfig[];
  toIndex: number;
  fromIndex: number; // -1 → no outgoing model
  wiping: boolean;
  wipeRef: React.MutableRefObject<number>; // 0..1 sweep position
  reduced: boolean;
  onAnchor: (a: AnchorReport) => void;
}) {
  const to = configs[toIndex];
  const showOut = wiping && fromIndex >= 0 && fromIndex !== toIndex;
  const from = showOut ? configs[fromIndex] : null;

  return (
    <Canvas
      dpr={[1, 1.6]}
      camera={{ position: [0, 1.1, 7.6], fov: 36 }}
      frameloop={reduced ? "demand" : "always"}
      gl={{ antialias: true, alpha: true, powerPreference: "high-performance" }}
    >
      {from && (
        <District
          key={`out-${from.id}`}
          cfg={from}
          mode="out"
          wipeRef={wipeRef}
          reduced={reduced}
        />
      )}
      <District
        key={`in-${to.id}`}
        cfg={to}
        mode={wiping ? "in" : "idle"}
        wipeRef={wipeRef}
        reduced={reduced}
        onAnchor={onAnchor}
      />
    </Canvas>
  );
}

function District({
  cfg,
  mode,
  wipeRef,
  reduced,
  onAnchor,
}: {
  cfg: DistrictConfig;
  mode: "in" | "out" | "idle";
  wipeRef: React.MutableRefObject<number>;
  reduced: boolean;
  onAnchor?: (a: AnchorReport) => void;
}) {
  const { camera, size, invalidate, viewport } = useThree();
  const parts = useMemo(() => buildCityModel(cfg.id), [cfg.id]);
  useEffect(() => () => parts.forEach((p) => p.geo.dispose()), [parts]);

  // bbox (size + centre) and a normalised centre-x per part (for the L→R wipe)
  const { bbox, nx } = useMemo(() => {
    const box = new THREE.Box3();
    const v = new THREE.Vector3();
    const cxs: number[] = [];
    for (const p of parts) {
      p.geo.computeBoundingBox();
      const b = p.geo.boundingBox;
      if (b) {
        box.union(b);
        cxs.push((b.min.x + b.max.x) / 2);
      } else cxs.push(0);
    }
    const minX = Math.min(...cxs);
    const maxX = Math.max(...cxs);
    const span = maxX - minX || 1;
    return {
      bbox: { size: box.getSize(new THREE.Vector3()), center: box.getCenter(v.clone()) },
      nx: cxs.map((x) => (x - minX) / span),
    };
  }, [parts]);

  // fit the WHOLE district (buildings + ground) on both axes
  const fit = useMemo(() => {
    const fitW = (viewport.width * 0.84) / (bbox.size.x || 1);
    const fitH = (viewport.height * 0.84) / (bbox.size.y || 1);
    return { scale: Math.min(fitW, fitH) * cfg.fitScale, center: bbox.center };
  }, [bbox, viewport.width, viewport.height, cfg.fitScale]);

  const group = useRef<THREE.Group>(null);
  const segs = useRef<(THREE.LineSegments | null)[]>([]);
  const anchorObj = useRef<THREE.Object3D>(null);
  const tmp = useRef(new THREE.Vector3());
  const report = useRef<AnchorReport>({ x: 0, y: 0, on: false });

  // reduced motion (frameloop demand): kick a few renders so it lays out
  useEffect(() => {
    if (!reduced) return;
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

  useFrame((state) => {
    const w = reduced ? 1 : wipeRef.current; // sweep position 0..1

    for (let i = 0; i < parts.length; i++) {
      const m = segs.current[i];
      if (!m) continue;
      let vis: number;
      if (reduced) vis = mode === "out" ? 0 : 0.85;
      else if (mode === "idle") vis = 0.85;
      else if (mode === "in") vis = nx[i] <= w ? 0.85 : 0; // draws on behind sweep
      else vis = nx[i] > w ? 0.85 : 0; // erases ahead of sweep
      const mat = m.material as THREE.LineBasicMaterial;
      // quick ease toward target → a soft reveal edge instead of a hard pop
      mat.opacity += (vis - mat.opacity) * (reduced ? 1 : 0.45);
    }

    // ambient SWAY (not unbounded drift) — gently oscillate around a fixed,
    // readable 3/4 hero angle so the district is always recognisable and never
    // rotates side-on/unreadable.
    if (group.current) {
      const t = state.clock.elapsedTime;
      group.current.rotation.y = reduced ? HERO_YAW : HERO_YAW + Math.sin(t * 0.2) * 0.1;
      group.current.rotation.x = reduced ? HERO_TILT : HERO_TILT + Math.sin(t * 0.16) * 0.015;
    }

    if (onAnchor && anchorObj.current) {
      const v = tmp.current;
      anchorObj.current.getWorldPosition(v);
      v.project(camera);
      const r = report.current;
      r.x = (v.x * 0.5 + 0.5) * size.width;
      r.y = (-v.y * 0.5 + 0.5) * size.height;
      r.on = v.z < 1;
      onAnchor(r);
    }
  });

  return (
    <group ref={group} rotation={[HERO_TILT, HERO_YAW, 0]}>
      <group
        scale={fit.scale}
        position={[
          -fit.center.x * fit.scale,
          -fit.center.y * fit.scale,
          -fit.center.z * fit.scale,
        ]}
      >
        {parts.map((part, i) => (
          <lineSegments
            key={i}
            geometry={part.geo}
            position={part.pos}
            ref={(el) => {
              segs.current[i] = el;
            }}
          >
            <lineBasicMaterial color={cfg.color} transparent opacity={reduced ? 0.85 : 0} />
          </lineSegments>
        ))}
        {onAnchor && <object3D ref={anchorObj} position={cfg.anchor} />}
      </group>
    </group>
  );
}
