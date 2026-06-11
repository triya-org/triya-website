"use client";

import { useEffect, useMemo, useRef } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";
import { RoundedBoxGeometry } from "three/examples/jsm/geometries/RoundedBoxGeometry.js";
import { mergeGeometries } from "three/examples/jsm/utils/BufferGeometryUtils.js";
import { RoomEnvironment } from "three/examples/jsm/environments/RoomEnvironment.js";

/* ============================================================
   The Living City v3 — Triya's clay-miniature world, detailed.

   Fully procedural (no asset files): bevelled clay buildings with
   window grids (some lit — they glow as the city wakes), rooftop
   AC units & antennas, a complete street grid with sidewalks,
   lane dashes and crosswalks, three-part cars with wheels, street-
   lights that ignite, and a quad-rotor patrol drone with spinning
   blades and a camera gimbal.

   Scroll progress (0..1) drives the camera spline + beats:
     beat 1  0.00–0.25  high above: dormant city
     beat 2  0.25–0.50  dive: nodes, lamps & windows ignite, arcs draw
     beat 3  0.50–0.75  glide: a block highlights (the "query")
     beat 4  0.75–1.00  pull out: the network resolves

   Palette: locked design system. Cream paper, clay #D97757.
   ============================================================ */

interface CitySceneProps {
  progressRef: React.MutableRefObject<number>;
  /** Pre-pin entry progress 0→1 ("the world develops out of paper").
      Defaults to 1 (fully developed) when no entry trigger drives it. */
  entryRef?: React.MutableRefObject<number>;
  quality?: "high" | "low";
}

const PAPER = "#FAF9F5"; // brand cream-50 — seam-free with the page background
const CLAY = new THREE.Color("#D97757");
const CLAY_DEEP = new THREE.Color("#C2613F");
const CLAY_SOFT = new THREE.Color("#E8A381");
const DORMANT = new THREE.Color("#BDB6A2");
const INK = new THREE.Color("#3D3A33");

function mulberry32(seed: number) {
  return () => {
    seed |= 0;
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function window01(p: number, a: number, b: number) {
  return THREE.MathUtils.clamp((p - a) / (b - a), 0, 1);
}

function paint(geo: THREE.BufferGeometry, color: THREE.Color) {
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
 * Safe merge: mergeGeometries returns NULL if the inputs mix indexed and
 * non-indexed geometries (e.g. icosahedron canopies vs. box buildings).
 * Normalize everything to non-indexed first so the merge always succeeds.
 */
function mergeSafe(geos: THREE.BufferGeometry[]): THREE.BufferGeometry | null {
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

export function CityScene({ progressRef, entryRef, quality = "high" }: CitySceneProps) {
  const { scene, gl } = useThree();
  const high = quality === "high";

  /* local IBL for the hub's clearcoat (RoomEnvironment — no network fetch) */
  const envMap = useMemo(() => {
    const pmrem = new THREE.PMREMGenerator(gl);
    const tex = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
    pmrem.dispose();
    return tex;
  }, [gl]);
  useEffect(() => () => envMap.dispose(), [envMap]);

  /* chamfered chassis half for the device — rendered twice (lower + upper)
     with the glowing core seam visible in the gap between the halves */
  const chassisGeo = useMemo(() => new RoundedBoxGeometry(1.7, 0.8, 1.7, 3, 0.07), []);
  useEffect(() => () => chassisGeo.dispose(), [chassisGeo]);

  /* wheel: cylinder axis rotated to lie along the car's lateral (Z) axis —
     a default Y-axis cylinder renders as a lying-flat pancake */
  const wheelGeo = useMemo(() => {
    const g = new THREE.CylinderGeometry(0.16, 0.16, 0.12, 10);
    g.rotateX(Math.PI / 2);
    return g;
  }, []);
  useEffect(() => () => wheelGeo.dispose(), [wheelGeo]);

  /* CCTV bullet body: tapered cylinder along local +Z (front slightly wider,
     like a lens hood) and its dark glass face disc */
  const bulletGeo = useMemo(() => {
    const g = new THREE.CylinderGeometry(0.15, 0.115, 0.52, 12);
    g.rotateX(Math.PI / 2);
    return g;
  }, []);
  useEffect(() => () => bulletGeo.dispose(), [bulletGeo]);
  const camFaceGeo = useMemo(() => {
    const g = new THREE.CylinderGeometry(0.135, 0.135, 0.035, 12);
    g.rotateX(Math.PI / 2);
    return g;
  }, []);
  useEffect(() => () => camFaceGeo.dispose(), [camFaceGeo]);

  /* ================= procedural city build (once) ================= */
  const city = useMemo(() => {
    const rand = mulberry32(20260611);
    const BLOCK = 10;
    const SPAN = high ? 5 : 3;
    const range = SPAN * BLOCK - 4;

    const buildingGeos: THREE.BufferGeometry[] = [];
    const windowDarkGeos: THREE.BufferGeometry[] = [];
    const windowLitGeos: THREE.BufferGeometry[] = [];
    const treeGeos: THREE.BufferGeometry[] = [];
    const poleGeos: THREE.BufferGeometry[] = [];
    const lampPositions: THREE.Vector3[] = [];
    const nodeCandidates: { pos: THREE.Vector3; h: number; roofIdx: number }[] = [];
    // rooftop furniture (AC/antennas) is deferred until cameras are placed —
    // a camera and an AC unit must never share a roof (they interpenetrate)
    const roofs: { x: number; z: number; w: number; d: number; topY: number }[] = [];

    const col = new THREE.Color();
    const baseCream = new THREE.Color("#EFEAE0");
    const trunkCol = new THREE.Color("#A8A293");
    const mossCol = new THREE.Color("#8A937B"); // greyed moss, sits quieter
    const blossomCol = new THREE.Color("#E5AFA3"); // spring blossom canopies
    const winDark = new THREE.Color("#BFB4A0"); // warm, sits in the clay family
    const winLit = new THREE.Color("#FFE2B8"); // warm cream glow, not yellow

    /* curated warm-pastel facade palette (weighted — sand/cream dominate,
       color punctuates; clay stays the SIGNAL, these are the chorus) */
    const FACADES: [string, number][] = [
      ["#EDE4D3", 22], // warm sand (workhorse)
      ["#E9D8C0", 16], // pale ochre
      ["#E5C1A5", 13], // apricot
      ["#DFAE92", 11], // terracotta blush
      ["#D9BCAD", 10], // rose taupe
      ["#CFD3BC", 10], // dusty sage
      ["#E8CFC8", 8], // shell pink
      ["#C3CCC9", 6], // dusty blue-grey (rare, cool relief)
      ["#E2D6E0", 4], // faded lilac (rarest)
    ];
    const FACADE_TOTAL = FACADES.reduce((a, [, w]) => a + w, 0);
    const pickFacade = () => {
      let r = rand() * FACADE_TOTAL;
      for (const [hex, w] of FACADES) {
        r -= w;
        if (r <= 0) return hex;
      }
      return FACADES[0][0];
    };

    /** window grid on all four facades of a tower */
    const addWindows = (x: number, z: number, w: number, h: number, d: number) => {
      if (!high || h < 4.5) return;
      const rows = Math.floor((h - 2.2) / 1.5);
      const colsX = Math.max(2, Math.floor(w / 1.15));
      const colsZ = Math.max(2, Math.floor(d / 1.15));
      for (let r = 0; r < rows; r++) {
        const wy = 1.6 + r * 1.5;
        // ±Z facades
        for (let c = 0; c < colsX; c++) {
          if (rand() < 0.38) continue;
          const wx = x - ((colsX - 1) * 1.0) / 2 + c * 1.0;
          for (const sz of [1, -1]) {
            const g = new THREE.PlaneGeometry(0.55, 0.85);
            if (sz < 0) g.rotateY(Math.PI);
            g.translate(wx, wy, z + sz * (d / 2 + 0.02));
            const lit = rand() < 0.12;
            paint(g, lit ? winLit : winDark);
            (lit ? windowLitGeos : windowDarkGeos).push(g);
          }
        }
        // ±X facades
        for (let c = 0; c < colsZ; c++) {
          if (rand() < 0.38) continue;
          const wz = z - ((colsZ - 1) * 1.0) / 2 + c * 1.0;
          for (const sx of [1, -1]) {
            const g = new THREE.PlaneGeometry(0.55, 0.85);
            g.rotateY(sx > 0 ? Math.PI / 2 : -Math.PI / 2);
            g.translate(x + sx * (w / 2 + 0.02), wy, wz);
            const lit = rand() < 0.12;
            paint(g, lit ? winLit : winDark);
            (lit ? windowLitGeos : windowDarkGeos).push(g);
          }
        }
      }
    };

    /** rooftop furniture: AC units + antennas */
    const addRoof = (x: number, z: number, w: number, topY: number, d: number) => {
      if (!high) return;
      if (rand() < 0.55) {
        const aw = 0.7 + rand() * 0.6;
        const ah = 0.4 + rand() * 0.35;
        const ac = new RoundedBoxGeometry(aw, ah, aw * 0.8, 1, 0.05);
        ac.translate(
          x + (rand() - 0.5) * (w * 0.45),
          topY + ah / 2,
          z + (rand() - 0.5) * (d * 0.45),
        );
        paint(ac, new THREE.Color("#DDD6C6"));
        buildingGeos.push(ac);
      }
      if (topY > 12 && rand() < 0.45) {
        const ant = new THREE.CylinderGeometry(0.035, 0.05, 1.6 + rand() * 1.4, 5);
        const ay = topY + (1.6 + rand() * 1.4) / 2;
        ant.translate(x + (rand() - 0.5) * w * 0.3, ay, z + (rand() - 0.5) * d * 0.3);
        paint(ant, trunkCol);
        buildingGeos.push(ant);
      }
    };

    // one city block is a park (green relief in the clay)
    const PARK = { bx: 2, bz: -2 };
    const parkGeos: THREE.BufferGeometry[] = [];

    for (let bx = -SPAN; bx <= SPAN; bx++) {
      for (let bz = -SPAN; bz <= SPAN; bz++) {
        if (Math.abs(bx) < 1 && Math.abs(bz) < 1) continue; // plaza
        if (high && bx === PARK.bx && bz === PARK.bz) {
          // park: lawn + crossing paths + a small grove
          const px = bx * BLOCK;
          const pz = bz * BLOCK;
          const lawn = new THREE.PlaneGeometry(8.8, 8.8);
          lawn.rotateX(-Math.PI / 2);
          lawn.translate(px, 0.011, pz);
          paint(lawn, new THREE.Color("#A9B795"));
          parkGeos.push(lawn);
          for (const horizontal of [true, false]) {
            const path = new THREE.PlaneGeometry(horizontal ? 8.8 : 1.0, horizontal ? 1.0 : 8.8);
            path.rotateX(-Math.PI / 2);
            path.translate(px, 0.016, pz);
            paint(path, new THREE.Color("#EFEADF"));
            parkGeos.push(path);
          }
          // wildflowers dotted across the lawn
          const FLOWERS = ["#D97757", "#E5B864", "#E5AFA3", "#F5EFE2"];
          for (let f = 0; f < 26; f++) {
            const fx = px + (rand() - 0.5) * 7.6;
            const fz = pz + (rand() - 0.5) * 7.6;
            if (Math.abs(fx - px) < 0.8 || Math.abs(fz - pz) < 0.8) continue;
            const bloom = new THREE.SphereGeometry(0.09 + rand() * 0.05, 6, 5);
            bloom.translate(fx, 0.12, fz);
            paint(bloom, col.set(FLOWERS[Math.floor(rand() * FLOWERS.length)]));
            treeGeos.push(bloom);
          }
          for (let k = 0; k < 7; k++) {
            const tx = px + (rand() - 0.5) * 7;
            const tz = pz + (rand() - 0.5) * 7;
            if (Math.abs(tx - px) < 0.9 || Math.abs(tz - pz) < 0.9) continue; // keep paths clear
            const th = 0.8 + rand() * 0.6;
            const trunk = new THREE.CylinderGeometry(0.1, 0.14, th, 6);
            trunk.translate(tx, th / 2, tz);
            paint(trunk, trunkCol);
            treeGeos.push(trunk);
            const canopy = new THREE.IcosahedronGeometry(0.9 + rand() * 0.55, 1);
            canopy.scale(1, 0.85, 1);
            canopy.translate(tx, th + 0.75, tz);
            col.copy(rand() < 0.28 ? blossomCol : mossCol).offsetHSL(0, 0, (rand() - 0.5) * 0.06);
            paint(canopy, col);
            treeGeos.push(canopy);
          }
          continue;
        }
        for (let i = 0; i < 2; i++) {
          for (let j = 0; j < 2; j++) {
            const x = bx * BLOCK + (i - 0.5) * 4.4 + (rand() - 0.5) * 0.8;
            const z = bz * BLOCK + (j - 0.5) * 4.4 + (rand() - 0.5) * 0.8;

            // keep the avenue corridors CLEAR — the camera flies down them
            // and the boulevards must read from above
            if (Math.abs(x) < 4.8 || Math.abs(z) < 4.8) continue;
            // open square around the roundabout: the orbiting traffic needs
            // a clear annulus — no buildings hugging the plaza corners
            if (Math.hypot(x, z) < 11.5) continue;

            if (rand() < 0.22) {
              if (rand() < 0.6) {
                const th = 0.8 + rand() * 0.5;
                const trunk = new THREE.CylinderGeometry(0.1, 0.14, th, 6);
                trunk.translate(x, th / 2, z);
                paint(trunk, trunkCol);
                treeGeos.push(trunk);
                const canopy = new THREE.IcosahedronGeometry(0.85 + rand() * 0.5, 1);
                canopy.scale(1, 0.85, 1);
                canopy.translate(x, th + 0.7, z);
                col.copy(rand() < 0.28 ? blossomCol : mossCol).offsetHSL(0, 0, (rand() - 0.5) * 0.06);
                paint(canopy, col);
                treeGeos.push(canopy);
              }
              continue;
            }

            const centerBias =
              1 - Math.min(1, (Math.abs(bx) + Math.abs(bz)) / (SPAN * 2));
            const h = 2 + rand() * 4.5 + centerBias * rand() * 9.5;
            const w = 2.7 + rand() * 1.3;
            const d = 2.7 + rand() * 1.3;

            // pastel facade, blushing gently toward clay with height
            const t = THREE.MathUtils.clamp((h - 4) / 18, 0, 1);
            col.set(pickFacade()).lerp(CLAY_SOFT, t * 0.25);
            // per-building albedo jitter — never one flat value
            col.offsetHSL((rand() - 0.5) * 0.012, (rand() - 0.5) * 0.06, (rand() - 0.5) * 0.05);

            // ~12% of the low-rises are cylindrical (silhouette variety)
            if (h < 9 && rand() < 0.12) {
              const cyl = new THREE.CylinderGeometry(w * 0.55, w * 0.55, h, 14);
              cyl.translate(x, h / 2, z);
              paint(cyl, col);
              buildingGeos.push(cyl);
              continue;
            }

            // podium base on some towers (street presence)
            if (h > 9 && rand() < 0.5) {
              const ph = 1.4;
              const podium = new RoundedBoxGeometry(w * 1.25, ph, d * 1.25, 2, 0.1);
              podium.translate(x, ph / 2, z);
              paint(podium, col.clone().lerp(baseCream, 0.3));
              buildingGeos.push(podium);
              // street-level awning — a small canopy in an accent color
              if (rand() < 0.65) {
                const AWNINGS = ["#D97757", "#A8B89A", "#E5B864", "#C2613F", "#9FB4C7"];
                const aw = new THREE.BoxGeometry(w * 0.85, 0.07, 0.55);
                const side = rand() > 0.5 ? 1 : -1;
                if (rand() > 0.5) {
                  aw.translate(x, 1.65, z + side * (d * 1.25) * 0.5 + side * 0.2);
                } else {
                  aw.rotateY(Math.PI / 2);
                  aw.translate(x + side * (w * 1.25) * 0.5 + side * 0.2, 1.65, z);
                }
                paint(aw, new THREE.Color(AWNINGS[Math.floor(rand() * AWNINGS.length)]));
                buildingGeos.push(aw);
              }
            }

            const body = new RoundedBoxGeometry(w, h, d, 2, 0.14);
            body.translate(x, h / 2, z);
            paint(body, col);
            buildingGeos.push(body);
            addWindows(x, z, w, h, d);

            if (h > 9 && rand() < 0.6) {
              const ch = 2 + rand() * 3;
              const crown = new RoundedBoxGeometry(w * 0.62, ch, d * 0.62, 2, 0.12);
              crown.translate(x, h + ch / 2 - 0.05, z);
              col.lerp(CLAY_SOFT, 0.15);
              paint(crown, col);
              buildingGeos.push(crown);
              roofs.push({ x, z, w: w * 0.62, d: d * 0.62, topY: h + ch });
              nodeCandidates.push({
                pos: new THREE.Vector3(x, h + ch, z),
                h: h + ch,
                roofIdx: roofs.length - 1,
              });
            } else {
              roofs.push({ x, z, w, d, topY: h });
              if (h > 7)
                nodeCandidates.push({
                  pos: new THREE.Vector3(x, h, z),
                  h,
                  roofIdx: roofs.length - 1,
                });
            }
          }
        }
      }
    }

    /* streetlights along both central avenues */
    const lampSpacing = 7;
    for (let s = -range; s <= range; s += lampSpacing) {
      if (Math.abs(s) < 7) continue;
      for (const [lx, lz, side] of [
        [s, 2.9, 1],
        [s, -2.9, -1],
        [2.9, s, 1],
        [-2.9, s, -1],
      ] as const) {
        const pole = new THREE.CylinderGeometry(0.06, 0.08, 2.8, 6);
        pole.translate(lx, 1.4, lz);
        paint(pole, trunkCol);
        poleGeos.push(pole);
        // arm axis must POINT toward the road (along the offset direction),
        // spanning from the pole to the luminaire
        const onXAvenue = Math.abs(lz) === 2.9;
        const towardRoad = onXAvenue ? [0, -side * 0.35] : [-side * 0.35, 0];
        const arm = new THREE.CylinderGeometry(0.045, 0.045, 0.7, 5);
        if (onXAvenue) arm.rotateX(Math.PI / 2); // axis along Z
        else arm.rotateZ(Math.PI / 2); // axis along X
        arm.translate(lx + towardRoad[0] * 0.9, 2.78, lz + towardRoad[1] * 0.9);
        paint(arm, trunkCol);
        poleGeos.push(arm);
        // luminaire housing at the arm's end, head right beneath it
        const housing = new THREE.CylinderGeometry(0.16, 0.13, 0.14, 8);
        housing.translate(lx + towardRoad[0] * 1.8, 2.74, lz + towardRoad[1] * 1.8);
        paint(housing, new THREE.Color("#8C867A"));
        poleGeos.push(housing);
        lampPositions.push(
          new THREE.Vector3(lx + towardRoad[0] * 1.8, 2.64, lz + towardRoad[1] * 1.8),
        );
      }
    }

    /* plaza furniture: four planters hugging the plinth — part of the
       monument itself, so no camera angle can make them read as being on
       the carriageway */
    if (high) {
      for (let k = 0; k < 4; k++) {
        const a = (k / 4) * Math.PI * 2 + Math.PI / 4;
        const px = Math.cos(a) * 2.5;
        const pz = Math.sin(a) * 2.5;
        const tub = new RoundedBoxGeometry(0.6, 0.4, 0.6, 1, 0.06);
        tub.translate(px, 0.2, pz);
        paint(tub, new THREE.Color("#CFC8B6"));
        poleGeos.push(tub);
        const bush = new THREE.IcosahedronGeometry(0.28, 1);
        bush.scale(1, 0.7, 1);
        bush.translate(px, 0.48, pz);
        col.copy(mossCol).offsetHSL(0, 0, (rand() - 0.5) * 0.05);
        paint(bush, col);
        treeGeos.push(bush);
      }
    }

    /* CCTV camera units on the tallest rooftops — the ICONIC silhouette:
       white bullet body on an L-bracket mast, pitched down at the street.
       The "node" position is the LENS; arcs emanate from it. */
    nodeCandidates.sort((a, b) => b.h - a.h);
    const nodes: THREE.Vector3[] = [];
    const nodeYaws: number[] = [];
    const cameraRoofs = new Set<number>();
    nodeCandidates.slice(0, high ? 30 : 16).forEach((c) => {
      cameraRoofs.add(c.roofIdx);
      const pos = c.pos
        .clone()
        .add(new THREE.Vector3((rand() - 0.5) * 1.2, 0.46, (rand() - 0.5) * 1.2));
      nodes.push(pos);
      // each camera faces roughly toward the plaza core, with scatter
      const yaw = Math.atan2(-pos.x, -pos.z) + (rand() - 0.5) * 0.5;
      nodeYaws.push(yaw);
      // mast set BEHIND the body + L-bracket arm reaching forward to it
      const mx = pos.x - Math.sin(yaw) * 0.5;
      const mz = pos.z - Math.cos(yaw) * 0.5;
      const roofY = pos.y - 0.46;
      const mast = new THREE.CylinderGeometry(0.04, 0.055, 0.68, 6);
      mast.translate(mx, roofY + 0.34, mz);
      paint(mast, trunkCol);
      poleGeos.push(mast);
      const arm = new THREE.BoxGeometry(0.06, 0.06, 0.42);
      arm.rotateY(yaw);
      arm.translate(
        pos.x - Math.sin(yaw) * 0.32,
        pos.y + 0.16,
        pos.z - Math.cos(yaw) * 0.32,
      );
      paint(arm, trunkCol);
      poleGeos.push(arm);
    });

    // rooftop furniture only on roofs WITHOUT a camera (no interpenetration)
    roofs.forEach((r, i) => {
      if (!cameraRoofs.has(i)) addRoof(r.x, r.z, r.w, r.topY, r.d);
    });

    const buildings = mergeSafe(buildingGeos);
    const windowsDark = mergeSafe(windowDarkGeos);
    const windowsLit = mergeSafe(windowLitGeos);
    const greens = mergeSafe(treeGeos);
    const poles = mergeSafe(poleGeos);

    /* network arcs node → the hub's beacon dome (a visible anchor — arcs
       must not vanish into the chassis) */
    const hub = new THREE.Vector3(0, 2.32, 0);
    const arcs = nodes.map((n) => {
      const mid = n.clone().lerp(hub, 0.5);
      mid.y = Math.max(n.y, 6) + n.distanceTo(hub) * 0.16;
      const pts = new THREE.QuadraticBezierCurve3(n, mid, hub).getPoints(48);
      const geo = new THREE.BufferGeometry().setFromPoints(pts);
      geo.setDrawRange(0, 0);
      const mat = new THREE.LineBasicMaterial({
        color: "#C2613F",
        transparent: true,
        opacity: 0,
        fog: false, // constellation survives the exit whiteout
      });
      return { line: new THREE.Line(geo, mat), geo, mat, total: pts.length, delay: rand() * 0.35 };
    });

    /* ============== street network ============== */
    const roadGeos: THREE.BufferGeometry[] = [];
    const roadCol = new THREE.Color("#E3DDCE");
    const sideCol = new THREE.Color("#F1ECDF");
    const dashCol = new THREE.Color("#FBF8F1");
    const gridCol = new THREE.Color("#E8E2D2");

    // roundabout carriageway: clearly road-toned annulus + raised curbs so
    // the orbit lane (bows ride ~6.8–7.7) unmistakably reads as ROAD
    {
      const ringRoad = new THREE.RingGeometry(6.0, 8.6, 64);
      ringRoad.rotateX(-Math.PI / 2);
      ringRoad.translate(0, 0.013, 0);
      paint(ringRoad, new THREE.Color("#D9D1BC")); // darker than any paving
      roadGeos.push(ringRoad);
      // curbs ground the carriageway: inner ring is FULL (borders the island,
      // traffic never crosses it); outer ring is 4 arc segments with gaps at
      // the avenue mouths so entering/exiting cars never clip a curb
      const curbCol = new THREE.Color("#CFC8B6");
      const innerCurb = new THREE.CylinderGeometry(5.95, 5.95, 0.14, 64, 1, true);
      innerCurb.translate(0, 0.07, 0);
      paint(innerCurb, curbCol);
      roadGeos.push(innerCurb);
      const innerTop = new THREE.RingGeometry(5.8, 6.07, 64);
      innerTop.rotateX(-Math.PI / 2);
      innerTop.translate(0, 0.14, 0);
      paint(innerTop, curbCol);
      roadGeos.push(innerTop);
      for (let q = 0; q < 4; q++) {
        const a0 = (q * Math.PI) / 2 + (30 * Math.PI) / 180;
        const aLen = (30 * Math.PI) / 180;
        const arc = new THREE.CylinderGeometry(8.7, 8.7, 0.1, 24, 1, true, a0, aLen);
        arc.translate(0, 0.05, 0);
        paint(arc, curbCol);
        roadGeos.push(arc);
        const arcTop = new THREE.RingGeometry(8.58, 8.82, 24, 1, a0, aLen);
        arcTop.rotateX(-Math.PI / 2);
        arcTop.translate(0, 0.1, 0);
        paint(arcTop, curbCol);
        roadGeos.push(arcTop);
      }
    }

    // main avenues
    for (const horizontal of [true, false]) {
      const road = new THREE.PlaneGeometry(
        horizontal ? range * 2 + 14 : 5.2,
        horizontal ? 5.2 : range * 2 + 14,
      );
      road.rotateX(-Math.PI / 2);
      road.translate(0, 0.012, 0);
      paint(road, roadCol);
      roadGeos.push(road);
      // sidewalks flanking the avenue
      for (const s of [1, -1]) {
        const walk = new THREE.PlaneGeometry(
          horizontal ? range * 2 + 14 : 1.1,
          horizontal ? 1.1 : range * 2 + 14,
        );
        walk.rotateX(-Math.PI / 2);
        walk.translate(
          horizontal ? 0 : s * 3.2,
          0.016,
          horizontal ? s * 3.2 : 0,
        );
        paint(walk, sideCol);
        roadGeos.push(walk);
      }
    }

    // secondary street grid between blocks
    for (let k = -SPAN; k < SPAN; k++) {
      const c = (k + 0.5) * BLOCK;
      for (const horizontal of [true, false]) {
        const g = new THREE.PlaneGeometry(
          horizontal ? range * 2 + 10 : 2.0,
          horizontal ? 2.0 : range * 2 + 10,
        );
        g.rotateX(-Math.PI / 2);
        g.translate(horizontal ? 0 : c, 0.008, horizontal ? c : 0);
        paint(g, gridCol);
        roadGeos.push(g);
      }
    }

    // centre-line dashes on the avenues
    if (high) {
      for (let s = -range; s <= range; s += 3) {
        if (Math.abs(s) < 7.5) continue;
        for (const horizontal of [true, false]) {
          const dash = new THREE.PlaneGeometry(horizontal ? 1.3 : 0.16, horizontal ? 0.16 : 1.3);
          dash.rotateX(-Math.PI / 2);
          dash.translate(horizontal ? s : 0, 0.018, horizontal ? 0 : s);
          paint(dash, dashCol);
          roadGeos.push(dash);
        }
      }
    }

    // crosswalks at the plaza ring and the first block ring
    const walkCol = new THREE.Color("#D97757").lerp(new THREE.Color("#FFFFFF"), 0.45);
    for (const dist of [6.5, -6.5, 16.5, -16.5]) {
      for (let k = -2; k <= 2; k++) {
        for (const horizontal of [true, false]) {
          const bar = new THREE.PlaneGeometry(horizontal ? 0.55 : 4.0, horizontal ? 4.0 : 0.55);
          bar.rotateX(-Math.PI / 2);
          bar.translate(horizontal ? dist : k * 1.0, 0.02, horizontal ? k * 1.0 : dist);
          paint(bar, walkCol);
          roadGeos.push(bar);
        }
      }
    }

    const roads = mergeSafe([...roadGeos, ...parkGeos]);

    /* car fleet state. Roundabout traversal done PROPERLY: each route is
       lane-straight → short tangent merge → a TRUE CIRCULAR ARC riding the
       carriageway (radius inside the 6.0–8.6 ring road) → merge out → lane.
       Cars never touch plaza pavement. All traffic circulates CCW like a
       real roundabout; x-avenue uses the inner orbit lane (6.7) and
       z-avenue the outer (7.9), so the two never share a corridor. */
    const J = 11.5; // lane hand-off — cars stay on the avenue until here
    const D2R = Math.PI / 180;
    const Y = 0.46;
    /** circular arc (CCW, a0→a1 degrees) as bezier segments on a CurvePath */
    const addArc = (path: THREE.CurvePath<THREE.Vector3>, R: number, a0: number, a1: number) => {
      if (a1 < a0) a1 += 360;
      const n = Math.ceil((a1 - a0) / 80);
      for (let i = 0; i < n; i++) {
        const s0 = (a0 + ((a1 - a0) * i) / n) * D2R;
        const s1 = (a0 + ((a1 - a0) * (i + 1)) / n) * D2R;
        const k = (4 / 3) * Math.tan((s1 - s0) / 4) * R;
        const p0 = new THREE.Vector3(R * Math.cos(s0), Y, R * Math.sin(s0));
        const p3 = new THREE.Vector3(R * Math.cos(s1), Y, R * Math.sin(s1));
        const t0 = new THREE.Vector3(-Math.sin(s0), 0, Math.cos(s0));
        const t1 = new THREE.Vector3(-Math.sin(s1), 0, Math.cos(s1));
        path.add(
          new THREE.CubicBezierCurve3(
            p0,
            p0.clone().addScaledVector(t0, k),
            p3.clone().addScaledVector(t1, -k),
            p3,
          ),
        );
      }
    };
    /** full orbit path: merge-in cubic + carriageway arc + merge-out cubic */
    const buildOrbit = (
      pIn: [number, number],
      fwd: [number, number],
      R: number,
      eIn: number,
      eOut: number,
      pOut: [number, number],
    ) => {
      const path = new THREE.CurvePath<THREE.Vector3>();
      const P0 = new THREE.Vector3(pIn[0], Y, pIn[1]);
      const F = new THREE.Vector3(fwd[0], 0, fwd[1]);
      const E = new THREE.Vector3(R * Math.cos(eIn * D2R), Y, R * Math.sin(eIn * D2R));
      const Et = new THREE.Vector3(-Math.sin(eIn * D2R), 0, Math.cos(eIn * D2R));
      path.add(
        new THREE.CubicBezierCurve3(
          P0,
          P0.clone().addScaledVector(F, 2),
          E.clone().addScaledVector(Et, -1.7),
          E,
        ),
      );
      addArc(path, R, eIn, eOut);
      const X = new THREE.Vector3(R * Math.cos(eOut * D2R), Y, R * Math.sin(eOut * D2R));
      const Xt = new THREE.Vector3(-Math.sin(eOut * D2R), 0, Math.cos(eOut * D2R));
      const P3 = new THREE.Vector3(pOut[0], Y, pOut[1]);
      path.add(
        new THREE.CubicBezierCurve3(
          X,
          X.clone().addScaledVector(Xt, 1.7),
          P3.clone().addScaledVector(F, -2),
          P3,
        ),
      );
      return { curve: path, len: path.getLength() };
    };
    const carRoutes = [
      {
        axis: "x" as const,
        lane: -1.45,
        dir: 1,
        bypass: buildOrbit([-J, -1.45], [1, 0], 6.7, 207, 333, [J, -1.45]),
      },
      {
        axis: "x" as const,
        lane: 1.45,
        dir: -1,
        bypass: buildOrbit([J, 1.45], [-1, 0], 6.7, 27, 153, [-J, 1.45]),
      },
      // z-avenue on RIGHT-hand lanes (they were flipped, forcing exit
      // connectors to cut across the mouth through oncoming merges):
      // southbound keeps west (x −1.45), northbound keeps east (x +1.45) —
      // every merge now stays on its own side of its mouth, no crossings
      {
        axis: "z" as const,
        lane: -1.45,
        dir: -1,
        bypass: buildOrbit([-1.45, J], [0, -1], 7.9, 117, 243, [-1.45, -J]),
      },
      {
        axis: "z" as const,
        lane: 1.45,
        dir: 1,
        bypass: buildOrbit([1.45, -J], [0, 1], 7.9, 297, 63, [1.45, J]),
      },
    ];
    // a cheerful fleet — no pure black; pastels echo the facades
    const carColors = [
      "#FFFFFF",
      "#E8E4D8",
      "#D97757",
      "#5C574E",
      "#F2C9B2",
      "#C2613F",
      "#A8B89A", // sage
      "#9FB4C7", // dusty blue
      "#E5C97B", // butter
      "#E5AFA3", // blossom pink
    ];
    type Car = {
      route: (typeof carRoutes)[number];
      offset: number;
      speed: number;
      color: THREE.Color;
      parked?: { x: number; z: number; ry: number };
    };
    // SCHEDULED traffic: every route gets the SAME loop period (Tc), so all
    // lane-crossing events (inner-ring connectors crossing the outer orbit
    // lane) repeat at fixed phases — verified by offline simulation to keep
    // ≥2.9 units between any two cars over a full cycle. Equal periods ⇒ one
    // clean cycle ⇒ collision-free forever. (Unequal speeds made crossing
    // phases precess into eventual overlaps.)
    const Tc = 18; // seconds per loop, all routes
    const perLane = high ? 4 : 2;
    const laneSpan = range * 2 + 10;
    const L1 = laneSpan / 2 - 11.5; // must match the frame-loop path math
    const cars: Car[] = Array.from({ length: perLane * 4 }, (_, i) => {
      const lane = i % 4;
      const k = Math.floor(i / 4);
      const route = carRoutes[lane];
      const T = 2 * L1 + route.bypass.len;
      return {
        route,
        offset: (k / perLane) * T, // exact quarter slots — no jitter
        speed: T / Tc,
        color: new THREE.Color(carColors[Math.floor(rand() * carColors.length)]),
      };
    });
    // parked cars along the avenue curbs (skip crosswalks + plaza)
    if (high) {
      for (let s = -range + 2; s <= range - 2; s += 5.5) {
        // keep curbs clear of the roundabout steering zone (|s| < 17) and
        // the crosswalks
        if (Math.abs(s) < 17 || Math.abs(Math.abs(s) - 16.5) < 2.5) continue;
        if (rand() < 0.45) continue; // irregular occupancy
        const onXAve = rand() > 0.5;
        // curbside (drive lanes are at ±1.45; a car is ~0.78 wide, so the
        // parked lane needs ≥0.9 of separation to never get clipped)
        const side = rand() > 0.5 ? 2.42 : -2.42;
        cars.push({
          route: carRoutes[0],
          offset: 0,
          speed: 0,
          color: new THREE.Color(carColors[Math.floor(rand() * carColors.length)]),
          parked: onXAve
            ? { x: s, z: side, ry: 0 }
            : { x: side, z: s, ry: Math.PI / 2 },
        });
      }
    }

    return {
      buildings,
      windowsDark,
      windowsLit,
      greens,
      poles,
      lampPositions,
      nodes,
      nodeYaws,
      arcs,
      hub,
      roads,
      cars,
      range,
    };
  }, [high]);

  /* dispose merged GPU resources */
  useEffect(() => {
    const c = city;
    return () => {
      c.buildings?.dispose();
      c.windowsDark?.dispose();
      c.windowsLit?.dispose();
      c.greens?.dispose();
      c.poles?.dispose();
      c.roads?.dispose();
      c.arcs.forEach((a) => {
        a.geo.dispose();
        a.mat.dispose();
      });
    };
  }, [city]);

  /* ================= dynamic actor refs ================= */
  const nodeMeshRef = useRef<THREE.InstancedMesh>(null);
  const nodeMatRef = useRef<THREE.MeshStandardMaterial>(null);
  const lampMeshRef = useRef<THREE.InstancedMesh>(null);
  const lampMatRef = useRef<THREE.MeshStandardMaterial>(null);
  const litWinMatRef = useRef<THREE.MeshStandardMaterial>(null);
  const bodyMeshRef = useRef<THREE.InstancedMesh>(null);
  const cabinMeshRef = useRef<THREE.InstancedMesh>(null);
  const wheelMeshRef = useRef<THREE.InstancedMesh>(null);
  const hubRef = useRef<THREE.Mesh>(null);
  const hubRingRef = useRef<THREE.Mesh>(null);
  const highlightRef = useRef<THREE.Mesh>(null);
  /* beat-3 "results found" pins — small glowing markers hovering over the
     matched buildings (precise like real detections; tiny so a near camera
     pass can never smear the frame) */
  const resultPinRefs = useRef<(THREE.Mesh | null)[]>([]);
  const RESULT_PINS = useMemo(
    () => [
      new THREE.Vector3(-17, 10.5, -7),
      new THREE.Vector3(-11.5, 9.5, -12.5),
      new THREE.Vector3(-15.5, 10, -13.5),
    ],
    [],
  );
  const droneRef = useRef<THREE.Group>(null);
  const bladeRefs = useRef<(THREE.Mesh | null)[]>([]);
  const ledRef = useRef<THREE.Mesh>(null);
  const dummy = useMemo(() => new THREE.Object3D(), []);
  const colTmp = useMemo(() => new THREE.Color(), []);

  const setupNodes = (mesh: THREE.InstancedMesh | null) => {
    if (!mesh) return;
    (nodeMeshRef as React.MutableRefObject<THREE.InstancedMesh | null>).current = mesh;
    city.nodes.forEach((n, i) => {
      dummy.position.copy(n);
      dummy.rotation.set(0, 0, 0);
      dummy.scale.setScalar(1);
      dummy.updateMatrix();
      mesh.setMatrixAt(i, dummy.matrix);
      mesh.setColorAt(i, DORMANT);
    });
    mesh.instanceMatrix.needsUpdate = true;
    if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true;
  };

  const setupLamps = (mesh: THREE.InstancedMesh | null) => {
    if (!mesh) return;
    (lampMeshRef as React.MutableRefObject<THREE.InstancedMesh | null>).current = mesh;
    city.lampPositions.forEach((p, i) => {
      dummy.position.copy(p);
      dummy.rotation.set(0, 0, 0);
      dummy.scale.setScalar(1);
      dummy.updateMatrix();
      mesh.setMatrixAt(i, dummy.matrix);
    });
    mesh.instanceMatrix.needsUpdate = true;
  };

  /** static camera units: yaw toward the hub, pitched down at the street.
      offset = body-local +Z distance from the lens (node) position */
  const PITCH = 0.5;
  const placeCamParts = (mesh: THREE.InstancedMesh | null, offset: number) => {
    if (!mesh) return;
    dummy.rotation.order = "YXZ";
    const cp = Math.cos(PITCH);
    const sp = Math.sin(PITCH);
    city.nodes.forEach((n, i) => {
      const yaw = city.nodeYaws[i];
      // local +Z (front) in world, after yaw then downward pitch
      const fx = Math.sin(yaw) * cp;
      const fy = -sp;
      const fz = Math.cos(yaw) * cp;
      dummy.position.set(n.x - fx * offset, n.y - fy * offset, n.z - fz * offset);
      dummy.rotation.set(PITCH, yaw, 0);
      dummy.scale.setScalar(1);
      dummy.updateMatrix();
      mesh.setMatrixAt(i, dummy.matrix);
    });
    mesh.instanceMatrix.needsUpdate = true;
    dummy.rotation.order = "XYZ";
    dummy.rotation.set(0, 0, 0);
  };
  const setupCamBodies = (m: THREE.InstancedMesh | null) => placeCamParts(m, 0.27);
  const setupCamFaces = (m: THREE.InstancedMesh | null) => placeCamParts(m, 0.02);

  const setupBodies = (mesh: THREE.InstancedMesh | null) => {
    if (!mesh) return;
    (bodyMeshRef as React.MutableRefObject<THREE.InstancedMesh | null>).current = mesh;
    city.cars.forEach((c, i) => mesh.setColorAt(i, c.color));
    if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true;
  };

  /* ================= camera rig ================= */
  /* The flight path hugs the carved avenue corridors (z≈0) so the camera
     is always in open air: overview → descend over the +x avenue → street
     level approaching the plaza → glide out the −x avenue past the query
     block → rise out for the finale. */
  const camPath = useMemo(
    () =>
      new THREE.CatmullRomCurve3(
        [
          new THREE.Vector3(0, 52, 92),
          new THREE.Vector3(32, 13, 1.5),
          new THREE.Vector3(12, 4.2, 2.5),
          new THREE.Vector3(-4, 24, 16), // high oblique: the query block held in frame
          new THREE.Vector3(0, 66, 98),
        ],
        false,
        "catmullrom",
        0.5,
      ),
    [],
  );
  /* look targets are offset LEFT of each subject so the subject renders in
     the right two-thirds of frame — the copy owns the left third. */
  const lookTargets = useMemo(
    () => [
      new THREE.Vector3(-8, 0, 4),
      new THREE.Vector3(-6, 2, 3),
      new THREE.Vector3(-6, 3, 3),
      // aimed left of the block so it sits right-of-center, pins in frame
      new THREE.Vector3(-18, 4, -8),
      new THREE.Vector3(-6, 4, 2),
    ],
    [],
  );
  const lookCur = useMemo(() => new THREE.Vector3(0, 0, 0), []);
  const posCur = useMemo(() => new THREE.Vector3(0, 52, 92), []);
  const tmp = useMemo(() => new THREE.Vector3(), []);
  const carPos = useMemo(() => new THREE.Vector3(), []);
  const carTan = useMemo(() => new THREE.Vector3(), []);

  /* Beat-aligned pacing: the spline is arc-length uniform and the exit leg
     is ~42% of total length, so without remapping the camera climbs out
     before beat 3's text even fires. Map scroll progress → spline u so each
     camera leg plays during its narrative beat:
       beat 1 (0–.25)   overview → start of dive       u 0→.38
       beat 2 (.25–.5)  dive to the plaza/hub          u .38→.46
       beat 3 (.5–.72)  street-level glide (query)     u .46→.58
       beat 4 (.72–1)   pull up and out                u .58→1   */
  const remapU = (p: number) => {
    const P = [0, 0.25, 0.5, 0.72, 1];
    const U = [0, 0.38, 0.46, 0.58, 1];
    let i = 0;
    while (i < 3 && p > P[i + 1]) i++;
    return U[i] + ((U[i + 1] - U[i]) * (p - P[i])) / (P[i + 1] - P[i]);
  };

  useMemo(() => {
    scene.background = new THREE.Color(PAPER);
    scene.fog = new THREE.Fog(PAPER, 75, 200);
  }, [scene]);

  /* ================= frame loop ================= */
  useFrame(({ camera, clock }, delta) => {
    const p = THREE.MathUtils.clamp(progressRef.current, 0, 1);
    const t = clock.elapsedTime;

    /* ---- entry/exit fog veil: paper gives the world, paper takes it back.
       veil 0 = blank paper sheet, veil 1 = clear air. The constellation
       (nodes/arcs/hub) is fog-exempt, so it survives the exit whiteout. ---- */
    const eRaw = entryRef ? entryRef.current : 1;
    const e = 1 - Math.pow(1 - THREE.MathUtils.clamp(eRaw, 0, 1), 3); // easeOutCubic
    const exit = window01(p, 0.9, 1.0);
    // No exit mist — the next section physically slides OVER the city
    // (analog.io cover pattern); fog only serves the entry develop.
    const veil = e;
    const fog = scene.fog as THREE.Fog;
    fog.near = 4 + veil * 71; // 4 → 75
    fog.far = 24 + veil * 176; // 24 → 200

    camPath.getPointAt(remapU(p), tmp);
    // entry pre-roll: start higher/farther, settle onto the spline as the
    // world develops (the lerp below absorbs it smoothly)
    tmp.y += (1 - e) * 16;
    tmp.z += (1 - e) * 12;
    posCur.lerp(tmp, 0.08);
    camera.position.copy(posCur);

    const seg = Math.min(3, Math.floor(p * 4));
    const segT = p * 4 - seg;
    tmp.copy(lookTargets[seg]).lerp(lookTargets[seg + 1], segT);
    lookCur.lerp(tmp, 0.08);
    camera.lookAt(lookCur);

    const wake = window01(p, 0.22, 0.42);
    // timed to the elevated tracking shot, when the camera faces the block
    const querySpot = window01(p, 0.52, 0.6) * (1 - window01(p, 0.74, 0.82));
    const finale = window01(p, 0.78, 0.92);

    /* CCTV lenses: the wake IGNITES them (emissive, via nodeMatRef) rather
       than ballooning them — a lens bigger than its camera reads absurd */
    const nodes = nodeMeshRef.current;
    if (nodes) {
      for (let i = 0; i < city.nodes.length; i++) {
        const pulse = 1 + 0.08 * wake * Math.sin(t * 2.2 + i * 1.7);
        dummy.position.copy(city.nodes[i]);
        dummy.rotation.set(0, 0, 0);
        dummy.scale.setScalar((0.95 + 0.15 * wake + 0.2 * exit) * pulse);
        dummy.updateMatrix();
        nodes.setMatrixAt(i, dummy.matrix);
        colTmp.copy(DORMANT).lerp(CLAY, wake);
        if (finale > 0) colTmp.lerp(CLAY_DEEP, finale * 0.5);
        nodes.setColorAt(i, colTmp);
      }
      nodes.instanceMatrix.needsUpdate = true;
      if (nodes.instanceColor) nodes.instanceColor.needsUpdate = true;
    }

    /* lights of the city come alive (capped so bloom stays elegant) */
    if (lampMatRef.current) lampMatRef.current.emissiveIntensity = 0.05 + wake * 1.05;
    if (litWinMatRef.current) litWinMatRef.current.emissiveIntensity = 0.06 + wake * 1.3;
    /* lenses ignite on wake; constellation glows brighter through the exit */
    if (nodeMatRef.current)
      nodeMatRef.current.emissiveIntensity =
        0.35 + wake * 0.85 + finale * 0.25 + exit * 0.9;

    /* arcs draw on (brighten through the exit whiteout) */
    city.arcs.forEach((arc) => {
      const local = window01(p, 0.3 + arc.delay * 0.3, 0.55 + arc.delay * 0.3);
      arc.geo.setDrawRange(0, Math.floor(local * arc.total));
      arc.mat.opacity = Math.min(0.9, 0.55 * local + 0.3 * finale + 0.25 * exit);
    });

    /* hub breathes; ring spins */
    if (hubRef.current) {
      hubRef.current.scale.setScalar(1 + wake * 0.12 * Math.sin(t * 3));
      (hubRef.current.material as THREE.MeshStandardMaterial).emissiveIntensity =
        0.25 + wake * 0.7 + finale * 0.4 + 0.5 * exit;
    }
    if (hubRingRef.current) {
      hubRingRef.current.rotation.z = t * 0.4;
      (hubRingRef.current.material as THREE.MeshBasicMaterial).opacity = 0.15 + wake * 0.5;
    }

    if (highlightRef.current) {
      (highlightRef.current.material as THREE.MeshBasicMaterial).opacity = querySpot * 0.22;
    }
    resultPinRefs.current.forEach((pin, i) => {
      if (!pin) return;
      pin.visible = querySpot > 0.01;
      pin.position.y = RESULT_PINS[i].y + Math.sin(t * 2 + i * 2.1) * 0.35;
      pin.rotation.y = t * 1.2 + i;
      pin.scale.setScalar(querySpot * (1 + 0.15 * Math.sin(t * 3 + i)));
      (pin.material as THREE.MeshStandardMaterial).emissiveIntensity =
        0.8 + querySpot * 1.2;
    });

    /* cars: body + cabin + 4 wheels per car, all instanced */
    const bodies = bodyMeshRef.current;
    const cabins = cabinMeshRef.current;
    const wheels = wheelMeshRef.current;
    if (bodies && cabins && wheels) {
      const span = city.range * 2 + 10;
      city.cars.forEach((c, i) => {
        let px: number, pz: number, ry: number;
        if (c.parked) {
          px = c.parked.x;
          pz = c.parked.z;
          ry = c.parked.ry;
        } else {
          // path = lane straight → merge + carriageway arc + merge → straight
          const J = 11.5;
          const half = span / 2;
          const L1 = half - J;
          const T = 2 * L1 + c.route.bypass.len;
          const d = (c.offset + t * c.speed) % T;
          const baseRy =
            c.route.axis === "x"
              ? c.route.dir > 0
                ? 0
                : Math.PI
              : c.route.dir > 0
                ? -Math.PI / 2
                : Math.PI / 2;
          if (d < L1) {
            const coord = c.route.dir > 0 ? -half + d : half - d;
            px = c.route.axis === "x" ? coord : c.route.lane;
            pz = c.route.axis === "x" ? c.route.lane : coord;
            ry = baseRy;
          } else if (d < L1 + c.route.bypass.len) {
            const u = (d - L1) / c.route.bypass.len;
            c.route.bypass.curve.getPointAt(u, carPos);
            c.route.bypass.curve.getTangentAt(u, carTan);
            px = carPos.x;
            pz = carPos.z;
            ry = Math.atan2(-carTan.z, carTan.x);
          } else {
            const q = d - L1 - c.route.bypass.len;
            const coord = c.route.dir > 0 ? J + q : -J - q;
            px = c.route.axis === "x" ? coord : c.route.lane;
            pz = c.route.axis === "x" ? c.route.lane : coord;
            ry = baseRy;
          }
        }

        dummy.position.set(px, 0.46, pz);
        dummy.rotation.set(0, ry, 0);
        dummy.scale.setScalar(1);
        dummy.updateMatrix();
        bodies.setMatrixAt(i, dummy.matrix);

        // cabin sits up and slightly back in car-local space
        const back = 0.12;
        dummy.position.set(
          px - Math.cos(ry) * back,
          0.78,
          pz + Math.sin(ry) * back,
        );
        dummy.updateMatrix();
        cabins.setMatrixAt(i, dummy.matrix);

        // four wheels in car-local corners
        const cosr = Math.cos(ry);
        const sinr = Math.sin(ry);
        const corners: [number, number][] = [
          [0.48, 0.34],
          [0.48, -0.34],
          [-0.48, 0.34],
          [-0.48, -0.34],
        ];
        corners.forEach(([lx, lz], k) => {
          dummy.position.set(px + lx * cosr + lz * sinr, 0.2, pz - lx * sinr + lz * cosr);
          dummy.rotation.set(0, ry, 0);
          dummy.updateMatrix();
          wheels.setMatrixAt(i * 4 + k, dummy.matrix);
        });
      });
      bodies.instanceMatrix.needsUpdate = true;
      cabins.instanceMatrix.needsUpdate = true;
      wheels.instanceMatrix.needsUpdate = true;
    }

    /* drone: patrol + spinning rotors + blinking LED */
    if (droneRef.current) {
      const a = t * 0.25;
      droneRef.current.position.set(
        Math.cos(a) * 20,
        13 + Math.sin(t * 1.3) * 1.2,
        Math.sin(a) * 20,
      );
      droneRef.current.rotation.y = -a + Math.PI / 2;
      droneRef.current.rotation.z = Math.sin(t * 0.8) * 0.06; // gentle bank
      droneRef.current.visible = wake > 0.15;
      droneRef.current.scale.setScalar(0.6 + wake * 0.4);
      bladeRefs.current.forEach((b, i) => {
        if (b) b.rotation.y += delta * (28 + i * 1.5);
      });
      if (ledRef.current) {
        (ledRef.current.material as THREE.MeshStandardMaterial).emissiveIntensity =
          1.5 + Math.sin(t * 7) * 1.4;
      }
    }
  });

  /* ================= scene graph ================= */
  return (
    <group>
      {/* clay-miniature lighting: strong low warm key (~30° elevation) with
          soft shadows, quiet fill — key:fill ≈ 3:1 so faces read keyed/
          filled/shadowed instead of uniformly lit */}
      {/* golden hour: warm low key, blush-tinted fill and shadow bounce */}
      <hemisphereLight args={["#FFF4E4", "#E2C4B4", 0.55]} />
      <directionalLight
        position={[48, 30, 22]}
        intensity={1.75}
        color="#FFE3BC"
        castShadow={high}
        shadow-mapSize={[2048, 2048]}
        shadow-camera-left={-58}
        shadow-camera-right={58}
        shadow-camera-top={58}
        shadow-camera-bottom={-58}
        shadow-camera-far={180}
        shadow-bias={-0.0004}
      />

      {/* ground */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow={high}>
        <planeGeometry args={[420, 420]} />
        <meshStandardMaterial color="#EFEADF" roughness={1} />
      </mesh>

      {/* street network (avenues, grid, sidewalks, dashes, crosswalks) */}
      {city.roads && (
        <mesh geometry={city.roads} receiveShadow={high}>
          <meshStandardMaterial vertexColors roughness={1} />
        </mesh>
      )}

      {/* plaza island (the garden core inside the carriageway ring) */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.015, 0]} receiveShadow={high}>
        <circleGeometry args={[5.6, 48]} />
        <meshStandardMaterial color="#F3EEE3" roughness={1} />
      </mesh>
      <mesh ref={hubRingRef} rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.03, 0]}>
        <ringGeometry args={[5.6, 5.9, 64]} />
        <meshBasicMaterial color="#D97757" transparent opacity={0.15} fog={false} />
      </mesh>

      {/* buildings + rooftop furniture */}
      {city.buildings && (
        <mesh geometry={city.buildings} castShadow={high} receiveShadow={high}>
          <meshStandardMaterial vertexColors roughness={0.92} />
        </mesh>
      )}

      {/* window grids */}
      {city.windowsDark && (
        <mesh geometry={city.windowsDark}>
          <meshStandardMaterial vertexColors roughness={0.6} metalness={0.05} />
        </mesh>
      )}
      {city.windowsLit && (
        <mesh geometry={city.windowsLit}>
          <meshStandardMaterial
            ref={litWinMatRef}
            vertexColors
            roughness={0.5}
            emissive="#FFC98A"
            emissiveIntensity={0.08}
          />
        </mesh>
      )}

      {/* trees */}
      {city.greens && (
        <mesh geometry={city.greens} castShadow={high}>
          <meshStandardMaterial vertexColors roughness={1} />
        </mesh>
      )}

      {/* streetlight poles */}
      {city.poles && (
        <mesh geometry={city.poles} castShadow={high}>
          <meshStandardMaterial vertexColors roughness={0.9} />
        </mesh>
      )}

      {/* streetlight heads */}
      <instancedMesh
        ref={setupLamps}
        args={[undefined, undefined, city.lampPositions.length]}
        frustumCulled={false}
      >
        <sphereGeometry args={[0.11, 10, 10]} />
        <meshStandardMaterial
          ref={lampMatRef}
          color="#FFF5E0"
          emissive="#FFD9A0"
          emissiveIntensity={0.05}
        />
      </instancedMesh>

      {/* cars: bodies / cabins / wheels */}
      <instancedMesh
        ref={setupBodies}
        args={[undefined, undefined, city.cars.length]}
        frustumCulled={false}
        castShadow={high}
      >
        <boxGeometry args={[1.55, 0.42, 0.78]} />
        <meshStandardMaterial roughness={0.6} />
      </instancedMesh>
      <instancedMesh
        ref={(m) => {
          (cabinMeshRef as React.MutableRefObject<THREE.InstancedMesh | null>).current = m;
        }}
        args={[undefined, undefined, city.cars.length]}
        frustumCulled={false}
        castShadow={high}
      >
        <boxGeometry args={[0.82, 0.34, 0.7]} />
        <meshStandardMaterial color="#4A4842" roughness={0.25} metalness={0.1} />
      </instancedMesh>
      <instancedMesh
        ref={(m) => {
          (wheelMeshRef as React.MutableRefObject<THREE.InstancedMesh | null>).current = m;
        }}
        args={[undefined, undefined, city.cars.length * 4]}
        frustumCulled={false}
        geometry={wheelGeo}
      >
        <meshStandardMaterial color="#2C2B26" roughness={0.9} />
      </instancedMesh>

      {/* CCTV bullet bodies — white, the iconic silhouette */}
      <instancedMesh
        ref={setupCamBodies}
        args={[undefined, undefined, city.nodes.length]}
        frustumCulled={false}
        castShadow={high}
        geometry={bulletGeo}
      >
        <meshStandardMaterial color="#F6F2E8" roughness={0.45} fog={false} />
      </instancedMesh>
      {/* dark glass faces */}
      <instancedMesh
        ref={setupCamFaces}
        args={[undefined, undefined, city.nodes.length]}
        frustumCulled={false}
        geometry={camFaceGeo}
      >
        <meshStandardMaterial color="#2C2B26" roughness={0.25} fog={false} />
      </instancedMesh>

      {/* CCTV lenses — the glowing nodes of the network */}
      <instancedMesh
        ref={setupNodes}
        args={[undefined, undefined, city.nodes.length]}
        frustumCulled={false}
      >
        <sphereGeometry args={[0.085, 12, 12]} />
        <meshStandardMaterial
          ref={nodeMatRef}
          color="#FFFFFF"
          emissive="#D97757"
          emissiveIntensity={0.45}
          roughness={0.5}
          fog={false}
        />
      </instancedMesh>

      {/* network arcs */}
      {city.arcs.map((arc, i) => (
        <primitive key={i} object={arc.line} />
      ))}

      {/* the Triya edge hub — a real device, not a placeholder cube:
          ink chassis, glowing clay core seam, vent lines, beacon dome */}
      <group position={[0, 0, 0]}>
        {/* plinth */}
        <mesh position={[0, 0.15, 0]} receiveShadow={high}>
          <cylinderGeometry args={[1.7, 1.9, 0.3, 24]} />
          <meshStandardMaterial color="#E3DDCE" roughness={1} />
        </mesh>
        {/* split chassis — warm near-black halves; the glowing core shows in
            the gap between them (recessed, so it never reads as a stray car) */}
        {[0.7, 1.8].map((y) => (
          <mesh key={y} position={[0, y, 0]} castShadow={high} geometry={chassisGeo}>
            <meshPhysicalMaterial
              color="#1A1715"
              roughness={0.32}
              clearcoat={0.45}
              clearcoatRoughness={0.25}
              envMap={envMap}
              envMapIntensity={0.7}
              fog={false}
            />
          </mesh>
        ))}
        {/* glowing clay core in the seam gap, slightly recessed */}
        <mesh ref={hubRef} position={[0, 1.25, 0]}>
          <boxGeometry args={[1.56, 0.32, 1.56]} />
          <meshStandardMaterial
            color="#D97757"
            emissive="#D97757"
            emissiveIntensity={0.25}
            roughness={0.4}
            fog={false}
          />
        </mesh>
        {/* vent lines */}
        {[0.55, 0.8, 1.05].map((y) => (
          <mesh key={y} position={[0, y + 1.05, 0.86]}>
            <boxGeometry args={[1.3, 0.05, 0.02]} />
            <meshStandardMaterial color="#4A4842" roughness={0.8} fog={false} />
          </mesh>
        ))}
        {/* beacon dome */}
        <mesh position={[0, 2.3, 0]}>
          <sphereGeometry args={[0.22, 14, 10, 0, Math.PI * 2, 0, Math.PI / 2]} />
          <meshStandardMaterial
            color="#E8A381"
            emissive="#D97757"
            emissiveIntensity={1.25}
            roughness={0.3}
            fog={false}
          />
        </mesh>
      </group>

      {/* quad-rotor patrol drone */}
      <group ref={droneRef} visible={false}>
        {/* hull */}
        <mesh castShadow={high}>
          <boxGeometry args={[0.72, 0.16, 0.72]} />
          <meshStandardMaterial color="#D97757" emissive="#D97757" emissiveIntensity={0.35} />
        </mesh>
        <mesh position={[0, 0.13, 0]}>
          <sphereGeometry args={[0.18, 12, 8, 0, Math.PI * 2, 0, Math.PI / 2]} />
          <meshStandardMaterial color="#C2613F" roughness={0.5} />
        </mesh>
        {/* camera gimbal under the hull */}
        <mesh position={[0, -0.16, 0.08]}>
          <sphereGeometry args={[0.12, 10, 10]} />
          <meshStandardMaterial color="#3D3A33" roughness={0.4} />
        </mesh>
        <mesh position={[0, -0.16, 0.2]}>
          <cylinderGeometry args={[0.05, 0.05, 0.1, 8]} />
          <meshStandardMaterial color="#1F1E1B" roughness={0.2} />
        </mesh>
        {/* blinking LED */}
        <mesh ref={ledRef} position={[0, 0.02, -0.38]}>
          <sphereGeometry args={[0.05, 8, 8]} />
          <meshStandardMaterial color="#B5503C" emissive="#B5503C" emissiveIntensity={1.5} />
        </mesh>
        {/* arms + rotors + spinning blades */}
        {([
          [0.52, 0.52, 45],
          [0.52, -0.52, -45],
          [-0.52, 0.52, 135],
          [-0.52, -0.52, -135],
        ] as const).map(([rx, rz, deg], i) => (
          <group key={i}>
            <mesh
              position={[rx / 2, 0, rz / 2]}
              rotation={[0, (deg * Math.PI) / 180, 0]}
            >
              <boxGeometry args={[0.66, 0.06, 0.09]} />
              <meshStandardMaterial color="#C2613F" roughness={0.6} />
            </mesh>
            <mesh position={[rx, 0.04, rz]}>
              <cylinderGeometry args={[0.05, 0.06, 0.1, 8]} />
              <meshStandardMaterial color="#3D3A33" />
            </mesh>
            <mesh
              ref={(el) => {
                bladeRefs.current[i] = el;
              }}
              position={[rx, 0.1, rz]}
            >
              <boxGeometry args={[0.5, 0.015, 0.06]} />
              <meshStandardMaterial color="#2C2B26" transparent opacity={0.8} />
            </mesh>
          </group>
        ))}
      </group>

      {/* beat-3 query highlight: soft volume + pulsing ground ring */}
      <mesh ref={highlightRef} position={[-14, 5, -10]}>
        <boxGeometry args={[14, 10, 14]} />
        <meshBasicMaterial color="#D97757" transparent opacity={0} depthWrite={false} />
      </mesh>
      {/* "results found" pins over the matched buildings */}
      {RESULT_PINS.map((pos, i) => (
        <mesh
          key={i}
          ref={(el) => {
            resultPinRefs.current[i] = el;
          }}
          position={[pos.x, pos.y, pos.z]}
          visible={false}
        >
          <octahedronGeometry args={[0.8, 0]} />
          <meshStandardMaterial
            color="#E8A381"
            emissive="#D97757"
            emissiveIntensity={0.8}
            roughness={0.35}
            fog={false}
          />
        </mesh>
      ))}
    </group>
  );
}
