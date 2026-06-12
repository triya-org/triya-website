"use client";

import { useEffect, useMemo, useRef } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";
import { RoundedBoxGeometry } from "three/examples/jsm/geometries/RoundedBoxGeometry.js";
import { RoomEnvironment } from "three/examples/jsm/environments/RoomEnvironment.js";
import {
  mulberry32,
  window01,
  paint,
  mergeSafe,
  popCellKey,
  popEase,
  setPopKey,
  addPopGrow,
  makePopDepthMaterial,
  type PopShaderStore,
} from "@/components/three/lib/popGrow";
import { assertClearance, type Collider } from "@/components/three/city/clearance";
import { FRACTIONS } from "@/components/three/city/fractions";

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
  /** RTL composition mirror: flips look-target x-offsets only — the world
      geometry is never mirrored (spec §0.21) */
  dir?: 1 | -1;
}

const PAPER = "#FAF9F5"; // brand cream-50 — seam-free with the page background
const CLAY = new THREE.Color("#D97757");
const CLAY_DEEP = new THREE.Color("#C2613F");
const CLAY_SOFT = new THREE.Color("#E8A381");
const DORMANT = new THREE.Color("#BDB6A2");
const INK = new THREE.Color("#3D3A33");




/**
 * Bake a per-object "pop key" into every vertex (attribute aPop) so the
 * entry can grow buildings out of the ground in a staggered pop-up-book
 * wave. Keyed by quantized footprint anchor, so a building and everything
 * standing on it (mast, AC, windows) rise together.
 */



export function CityScene({ progressRef, entryRef, quality = "high", dir = 1 }: CitySceneProps) {
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
    const colliders: Collider[] = []; // camera-clearance AABBs (spec §3.4)
    /* per-district emissive buckets (own mesh+material = wake-on-approach
       is a material write, never a vertex-color rewrite — spec §0.4) */
    const retailLitGeos: THREE.BufferGeometry[] = [];
    const eventsLitGeos: THREE.BufferGeometry[] = [];
    const mfgGlowGeos: THREE.BufferGeometry[] = [];
    const windowDarkGeos: THREE.BufferGeometry[] = [];
    const windowLitGeos: THREE.BufferGeometry[] = [];
    const treeGeos: THREE.BufferGeometry[] = [];
    const poleGeos: THREE.BufferGeometry[] = [];
    const lampPositions: THREE.Vector3[] = [];
    const lampKeys: number[] = [];
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
        // DISTRICT MASK (spec §1): these blocks are replaced by authored
        // sets built after the loop — same skip pattern as the PARK block.
        // The −z arm and the south-east quarter stay generic civilian tissue.
        if (high && bx >= -5 && bx <= -3 && (bz === -2 || bz === -1)) continue; // MFG halls
        if (high && bx >= -5 && bx <= -3 && (bz === 1 || bz === 2)) continue; // container yard
        if (high && bx >= 3 && bx <= 5 && (bz === -2 || bz === -1)) continue; // Events ground
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
            /* RETAIL HIGH STREET (spec §1.2): lots fronting the +z avenue
               are re-dressed in place — heights clamped, storefront butter
               glazing, awnings under generator law. hOrig keeps the shared
               rand stream byte-identical for every branch roll. */
            const retailZone = high && Math.abs(x) < 10 && z >= 14 && z <= 44;
            const marketPocket = retailZone && x >= 6 && x <= 14 && z >= 24 && z <= 34;
            const flagship = retailZone && bx === -1 && bz === 3 && i === 1 && j === 0;
            const hOrig = 2 + rand() * 4.5 + centerBias * rand() * 9.5;
            let h = hOrig;
            if (retailZone) h = marketPocket ? 1.7 + (hOrig % 0.5) : 2.4 + (hOrig % 2.6);
            let w = 2.7 + rand() * 1.3;
            let d = 2.7 + rand() * 1.3;
            if (flagship) {
              h = 3.4;
              w = 4.3;
              d = 4.0;
            }

            // pastel facade, blushing gently toward clay with height
            const t = THREE.MathUtils.clamp((h - 4) / 18, 0, 1);
            col.set(pickFacade()).lerp(CLAY_SOFT, t * 0.25);
            // per-building albedo jitter — never one flat value
            col.offsetHSL((rand() - 0.5) * 0.012, (rand() - 0.5) * 0.06, (rand() - 0.5) * 0.05);
            if (retailZone)
              // palette reweight: apricot / shell / blush (deterministic, no draw)
              col.set(
                flagship
                  ? "#E8CFC8"
                  : ["#E5C1A5", "#E8CFC8", "#DFAE92"][(((i + j + bx + bz) % 3) + 3) % 3],
              );

            // ~12% of the low-rises are cylindrical (silhouette variety)
            // (branch rolls gate on hOrig so the stream never shifts)
            if (hOrig < 9 && rand() < 0.12 && !retailZone) {
              const cyl = new THREE.CylinderGeometry(w * 0.55, w * 0.55, h, 14);
              cyl.translate(x, h / 2, z);
              paint(cyl, col);
              buildingGeos.push(cyl);
              colliders.push({ x, z, hw: w * 0.55, hd: w * 0.55, h });
              continue;
            }

            // podium base on some towers (street presence)
            if (hOrig > 9 && rand() < 0.5 && !retailZone) {
              const ph = 1.4;
              const podium = new RoundedBoxGeometry(w * 1.25, ph, d * 1.25, 2, 0.1);
              podium.translate(x, ph / 2, z);
              paint(podium, col.clone().lerp(baseCream, 0.3));
              buildingGeos.push(podium);
            }

            const body = new RoundedBoxGeometry(w, h, d, 2, 0.14);
            body.translate(x, h / 2, z);
            paint(body, col);
            // clearance collider: widest of body/podium footprint, +1.6 head-
            // room for rooftop furniture (AC/antenna) — generators own safety
            colliders.push({ x, z, hw: w * 0.7, hd: d * 0.7, h: h + 1.6 });
            buildingGeos.push(body);
            addWindows(x, z, w, h, d);

            if (retailZone) {
              /* storefront butter glazing facing the street + awning.
                 GENERATOR LAW (spec §0.20): awning top ≤3.2, front edge
                 |x| ≥ 5.7 — the corridor and its lamp arms own that air;
                 signboards over the corridor are BANNED outright. */
              const sxd = x > 0 ? -1 : 1; // toward the street
              const faceX = x + sxd * (w / 2 + 0.035);
              const glaze = new THREE.PlaneGeometry(
                w * (flagship ? 0.8 : 0.7),
                flagship ? 1.5 : 1.15,
              );
              glaze.rotateY(sxd > 0 ? Math.PI / 2 : -Math.PI / 2);
              glaze.translate(faceX, flagship ? 1.15 : 1.0, z);
              retailLitGeos.push(glaze);
              if (flagship)
                // two till lamps flanking the door (the queue beat's payoff
                // handles — clay ignition is wired in P4)
                for (const tz of [z - 1.2, z + 1.2]) {
                  const till = new THREE.BoxGeometry(0.26, 0.26, 0.26);
                  till.translate(faceX + sxd * 0.12, 2.3, tz);
                  retailLitGeos.push(till);
                }
              if (!marketPocket) {
                const aw = new THREE.BoxGeometry(0.6, 0.1, w * 0.82);
                aw.rotateZ(sxd * 0.24);
                const axRaw = x + sxd * (w / 2 + 0.32);
                const ax = Math.sign(x) * Math.max(5.7, Math.abs(axRaw));
                aw.translate(ax, Math.min(2.45, h - 0.4), z);
                paint(aw, col.set(["#E5C1A5", "#E8CFC8"][(i + bz) & 1]));
                buildingGeos.push(aw);
              }
            }

            if (hOrig > 9 && rand() < 0.6 && !retailZone) {
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

    /* THE BLOOM (spec §4.1): entry keys become a radial wave rolling out
       from the hub through the district skylines — 70% radius, 30% the old
       hash sparkle, quantized per 3-unit cell so a building and everything
       standing on it (mast, lamp, CCTV) rise as one. */
    const POP_RADIAL_BLEND = 0.7;
    const radialCellKey = (x: number, z: number) => {
      const qx = Math.round(x / 3) * 3;
      const qz = Math.round(z / 3) * 3;
      const radial = Math.min(1, Math.hypot(qx, qz) / 55);
      return POP_RADIAL_BLEND * radial + (1 - POP_RADIAL_BLEND) * popCellKey(x, z);
    };

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
        const lampKey = radialCellKey(lx, lz);
        lampKeys.push(lampKey);
        const pole = new THREE.CylinderGeometry(0.06, 0.08, 2.8, 6);
        pole.translate(lx, 1.4, lz);
        paint(pole, trunkCol);
        setPopKey(pole, lampKey);
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
        setPopKey(arm, lampKey);
        poleGeos.push(arm);
        // luminaire housing at the arm's end, head right beneath it
        const housing = new THREE.CylinderGeometry(0.16, 0.13, 0.14, 8);
        housing.translate(lx + towardRoad[0] * 1.8, 2.74, lz + towardRoad[1] * 1.8);
        paint(housing, new THREE.Color("#8C867A"));
        setPopKey(housing, lampKey);
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

    /* ================== DISTRICTS (spec §1) — authored sets ==================
       Own PRNG: the shared city stream stays untouched downstream (traffic
       offsets are slot-deterministic anyway, but layout draws stay isolated). */
    if (high) {
      const drand = mulberry32(20260612);
      const dcol = new THREE.Color();
      const dbox = (
        arr: THREE.BufferGeometry[],
        w: number,
        hh: number,
        dd: number,
        x: number,
        y: number,
        z: number,
        hex: string,
        ry = 0,
        round = 0,
      ) => {
        const g =
          round > 0
            ? new RoundedBoxGeometry(w, hh, dd, 2, round)
            : new THREE.BoxGeometry(w, hh, dd);
        if (ry) g.rotateY(ry);
        g.translate(x, y, z);
        paint(g, dcol.set(hex));
        buildingGeos.push(g);
        if (arr !== buildingGeos) {
          buildingGeos.pop();
          arr.push(g);
        }
        return g;
      };
      const SAND = "#EDE4D3";
      const OCHRE = "#E9D8C0";
      const SAGE = "#CFD3BC";
      const ROOFTOOTH = "#E5D3AE";
      const ROSE = "#D9BCAD";
      const LILAC = "#E2D6E0";
      const INKISH = "#56524A";
      const TRUNK = "#A8A293";
      const CREAM300 = "#D9D4C4";

      /* ---- MANUFACTURING — west arm (§1.1) ---- */
      {
        const hx = -37;
        const hz = -10.5; // near hall center
        dbox(buildingGeos, 18, 0.3, 9.4, hx, 0.15, hz, SAGE); // floor slab
        // LOW front parapet — the M-hold sightline lesson from the Turntable
        dbox(buildingGeos, 18, 1.0, 0.45, hx, 0.5, -6.2, SAND);
        for (let b = 0; b < 4; b++) {
          const x0 = hx - 6.75 + b * 4.5;
          dbox(buildingGeos, 4.5, 5.6, 0.45, x0, 2.8, -14.9, SAGE); // back wall
          const slope = new THREE.BoxGeometry(4.7, 0.24, 9.4);
          slope.rotateZ(0.42);
          slope.translate(x0 + 0.4, 6.3, hz);
          paint(slope, dcol.set(ROOFTOOTH));
          buildingGeos.push(slope);
          const glaze = new THREE.PlaneGeometry(3.4, 1.15);
          glaze.rotateY(Math.PI / 2);
          glaze.translate(x0 - 1.55, 6.2, hz);
          paint(glaze, winLit);
          windowLitGeos.push(glaze);
        }
        dbox(buildingGeos, 0.45, 5.6, 9.4, hx - 9, 2.8, hz, SAND); // side walls
        dbox(buildingGeos, 0.45, 5.6, 9.4, hx + 9, 2.8, hz, SAND);
        colliders.push({ x: hx, z: hz, hw: 9.2, hd: 4.9, h: 8.2, label: "mfg-hallA" });
        // interior, visible over the parapet: conveyor + pallet boxes
        dbox(buildingGeos, 13, 0.32, 1.25, hx - 0.5, 1.15, -8.4, INKISH);
        for (let k = 0; k < 5; k++)
          dbox(buildingGeos, 0.2, 1.0, 0.2, hx - 6 + k * 2.8, 0.5, -8.4, TRUNK);
        for (let k = 0; k < 6; k++)
          dbox(
            buildingGeos,
            0.9,
            0.5 + drand() * 0.55,
            0.9,
            hx - 7 + drand() * 14,
            0.55,
            -12.6 + drand() * 1.6,
            [SAND, OCHRE, ROSE][k % 3],
            0,
            0.05,
          );
        const strip = new THREE.PlaneGeometry(12.6, 0.18); // conveyor glow line
        strip.rotateX(-Math.PI / 2);
        strip.translate(hx - 0.5, 1.33, -8.4);
        mfgGlowGeos.push(strip);
        // far hall: closed block + roof monitor
        dbox(buildingGeos, 17, 6.8, 7.5, hx, 3.4, -20.2, OCHRE, 0, 0.12);
        dbox(buildingGeos, 12, 1.4, 3.2, hx, 7.4, -20.2, SAND, 0, 0.08);
        colliders.push({ x: hx, z: -20.2, hw: 8.7, hd: 3.9, h: 9, label: "mfg-hallB" });
        for (let k = 0; k < 7; k++) {
          const g = new THREE.PlaneGeometry(1.2, 1.5);
          g.translate(hx - 6 + k * 2, 3.4, -16.35);
          paint(g, winDark);
          windowDarkGeos.push(g);
        }
        // smokestack
        const st = new THREE.CylinderGeometry(0.85, 1.05, 11.5, 12);
        st.translate(-28.6, 5.75, -21);
        paint(st, dcol.set(ROSE));
        buildingGeos.push(st);
        const cap = new THREE.CylinderGeometry(1.0, 1.0, 0.5, 12);
        cap.translate(-28.6, 11.4, -21);
        paint(cap, dcol.set(INKISH));
        buildingGeos.push(cap);
        colliders.push({ x: -28.6, z: -21, hw: 1.1, hd: 1.1, h: 12, label: "stack" });
        // box trucks at the dock
        for (const tx of [-31.5, -27.8]) {
          dbox(buildingGeos, 1.1, 1.15, 2.9, tx, 0.85, -7.9, "#FFFFFF", 0.06, 0.06);
          dbox(buildingGeos, 1.05, 0.8, 0.9, tx, 0.62, -9.6, INKISH, 0.06, 0.08);
        }
        // gantry sky-bridge across the x-avenue (deck underside y=7.2 —
        // the dive's signature fly-under; deck is NOT a ground collider,
        // its clearance has a dedicated assertion)
        for (const gz of [-5.6, 5.6]) {
          dbox(buildingGeos, 0.55, 7.2, 0.55, -30, 3.6, gz, "#C3CCC9");
          colliders.push({ x: -30, z: gz, hw: 0.35, hd: 0.35, h: 7.8, label: "gantry-leg" });
        }
        dbox(buildingGeos, 2.6, 0.5, 12.4, -30, 7.45, 0, INKISH); // deck
        for (let k = 0; k < 5; k++)
          dbox(
            buildingGeos,
            0.8,
            0.55,
            0.8,
            -30 + (drand() - 0.5) * 1.2,
            7.98,
            -4.5 + k * 2.2,
            [OCHRE, SAGE, SAND][k % 3],
            0,
            0.05,
          );
      }

      /* ---- CONTAINER YARD — west-south (§1.1), ≤3.2 authored camera pocket:
         the M-hold flies INSIDE it; the height cap lives HERE, in the
         generator, so reseeds can never break the camera ---- */
      for (let cx = 0; cx < 5; cx++)
        for (let cz = 0; cz < 4; cz++) {
          if (drand() < 0.18) continue;
          const sx2 = -44.5 + cx * 3.9;
          const sz2 = 7.6 + cz * 4.1;
          const levels = drand() < 0.5 ? 1 : 2;
          for (let l = 0; l < levels; l++)
            dbox(
              buildingGeos,
              3.1,
              1.32,
              1.5,
              sx2 + (drand() - 0.5) * 0.3,
              0.7 + l * 1.36,
              sz2 + (drand() - 0.5) * 0.3,
              [OCHRE, SAGE, SAND, ROSE][(cx + cz + l) % 4],
              0,
              0.07,
            );
          colliders.push({
            x: sx2,
            z: sz2,
            hw: 1.75,
            hd: 0.95,
            h: 0.74 + levels * 1.36, // ≤ 3.2 by construction
            label: "container",
          });
        }

      /* ---- EVENTS — east arm festival ground (§1.4) ---- */
      {
        const pad = new RoundedBoxGeometry(17, 0.14, 16, 2, 0.05);
        pad.translate(37, 0.07, -14.5);
        paint(pad, dcol.set("#D8DCC4")); // festival green
        buildingGeos.push(pad);
        // stage at (43,−18) facing southwest
        dbox(buildingGeos, 6.2, 1.1, 4.6, 43, 0.55, -18, INKISH, 0, 0.06);
        dbox(buildingGeos, 6.2, 3.6, 0.5, 43, 2.9, -20, ROSE);
        for (const px of [40.4, 45.6]) {
          dbox(buildingGeos, 0.4, 4.6, 0.4, px, 2.3, -18.6, LILAC);
          colliders.push({ x: px, z: -18.6, hw: 0.3, hd: 0.3, h: 5.2, label: "truss" });
        }
        dbox(buildingGeos, 5.6, 0.3, 0.35, 43, 4.55, -18.6, LILAC); // truss beam
        colliders.push({ x: 43, z: -19, hw: 3.3, hd: 1.6, h: 6.6, label: "stage" });
        // three gate arches fronting the avenue (the crowd streams out of
        // downtown INTO the ground); the clay payoff hinge is wired in P4
        for (let g = 0; g < 3; g++) {
          const gx = 32.8 + g * 3.4;
          for (const s of [-1.35, 1.35])
            dbox(buildingGeos, 0.36, 3.1, 0.36, gx + s, 1.55, -8.2, [ROSE, LILAC][g % 2]);
          dbox(buildingGeos, 3.1, 0.4, 0.42, gx, 3.3, -8.2, SAND);
          colliders.push({ x: gx, z: -8.2, hw: 1.7, hd: 0.3, h: 3.7, label: "gate" });
        }
        // tiered stand facing the stage
        for (let s2 = 0; s2 < 3; s2++)
          dbox(
            buildingGeos,
            1.3,
            0.5,
            7.5,
            30.2 + s2 * 1.05,
            0.3 + s2 * 0.42,
            -16.5,
            [SAND, OCHRE, SAND][s2],
          );
        colliders.push({ x: 31.3, z: -16.5, hw: 1.9, hd: 3.9, h: 1.9, label: "stand" });
        // barrier ribbons: three lanes, gates → stage
        for (let lane2 = 0; lane2 < 4; lane2++)
          dbox(buildingGeos, 0.16, 0.5, 6.5, 31.2 + lane2 * 3.4, 0.32, -12.2, CREAM300);
        // string lights: posts + sagging butter dot chains (own emissive
        // mesh — they ignite one-by-one through T3, independent of windows)
        const posts: [number, number][] = [
          [33.5, -12.5],
          [39, -11.5],
          [44, -13.5],
          [36.5, -16.5],
        ];
        for (const [px, pz] of posts) dbox(buildingGeos, 0.14, 3.4, 0.14, px, 1.7, pz, TRUNK);
        const spans: [[number, number], [number, number]][] = [
          [posts[0], posts[1]],
          [posts[1], posts[2]],
          [posts[2], [43, -18]],
          [posts[0], posts[3]],
          [posts[3], [43, -18]],
        ];
        for (const [[ax2, az2], [bx2, bz2]] of spans)
          for (let k = 1; k < 12; k++) {
            const tt = k / 12;
            const dot = new THREE.BoxGeometry(0.11, 0.11, 0.11);
            dot.translate(
              ax2 + (bx2 - ax2) * tt,
              3.3 - Math.sin(Math.PI * tt) * 0.55,
              az2 + (bz2 - az2) * tt,
            );
            eventsLitGeos.push(dot);
          }
      }

      /* district CCTV re-seats (hall parapets + gate + stage truss) —
         forced into the constellation via sort height; slice keeps 30 total */
      (
        [
          [-44, 6.45, -6.4],
          [-30, 6.45, -6.4],
          [-37, 7.9, -15.2],
          // gate cam on GATE-3's post (right of frame, where its payoff
          // barrier swings) — gates 1-2 posts park ON the copy card from
          // the E-hold sightline (panel finding, twice)
          [40.95, 3.42, -8.2],
          [43, 5.1, -18.4],
        ] as const
      ).forEach(([nx, ny, nz], k) => {
        nodeCandidates.push({ pos: new THREE.Vector3(nx, ny, nz), h: 99 - k, roofIdx: -1 });
      });
    }

    /* CCTV camera units on the tallest rooftops — the ICONIC silhouette:
       white bullet body on an L-bracket mast, pitched down at the street.
       The "node" position is the LENS; arcs emanate from it. */
    nodeCandidates.sort((a, b) => b.h - a.h);
    const nodes: THREE.Vector3[] = [];
    const nodeYaws: number[] = [];
    const nodeKeys: number[] = [];
    const cameraRoofs = new Set<number>();
    nodeCandidates.slice(0, high ? 30 : 16).forEach((c) => {
      if (c.roofIdx >= 0) cameraRoofs.add(c.roofIdx);
      // district re-seats (roofIdx −1) key by their own anchor cell
      const popKey =
        c.roofIdx >= 0
          ? radialCellKey(roofs[c.roofIdx].x, roofs[c.roofIdx].z) // EXACT building key
          : radialCellKey(c.pos.x, c.pos.z);
      nodeKeys.push(popKey);
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
      setPopKey(mast, popKey);
      poleGeos.push(mast);
      const arm = new THREE.BoxGeometry(0.06, 0.06, 0.42);
      arm.rotateY(yaw);
      arm.translate(
        pos.x - Math.sin(yaw) * 0.32,
        pos.y + 0.16,
        pos.z - Math.cos(yaw) * 0.32,
      );
      paint(arm, trunkCol);
      setPopKey(arm, popKey);
      poleGeos.push(arm);
    });

    // rooftop furniture only on roofs WITHOUT a camera (no interpenetration)
    roofs.forEach((r, i) => {
      if (!cameraRoofs.has(i)) addRoof(r.x, r.z, r.w, r.topY, r.d);
    });

    // pop-up-book entry: per-object grow keys on the RADIAL wave (quantized
    // anchor → a building and the things standing on it rise together)
    const bakeRadial = (geos: THREE.BufferGeometry[]) => {
      const cc = new THREE.Vector3();
      geos.forEach((g) => {
        if (g.attributes.aPop) return; // explicitly keyed at creation
        g.computeBoundingBox();
        g.boundingBox!.getCenter(cc);
        setPopKey(g, radialCellKey(cc.x, cc.z));
      });
    };
    bakeRadial(buildingGeos);
    bakeRadial(windowDarkGeos);
    bakeRadial(windowLitGeos);
    bakeRadial(treeGeos);
    bakeRadial(poleGeos);
    bakeRadial(retailLitGeos);
    bakeRadial(eventsLitGeos);
    bakeRadial(mfgGlowGeos);

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
      // dashed centerline on the carriageway — reads as a real ring road
      for (let k = 0; k < 22; k++) {
        const a0 = (k / 22) * Math.PI * 2;
        const dashArc = new THREE.RingGeometry(7.22, 7.4, 6, 1, a0, 0.14);
        dashArc.rotateX(-Math.PI / 2);
        dashArc.translate(0, 0.015, 0);
        paint(dashArc, new THREE.Color("#FBF8F1"));
        roadGeos.push(dashArc);
      }
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
      // sidewalks flanking the avenue — split into two segments that STOP
      // at the roundabout (they must never cross the circle)
      const walkLen = range + 7 - 9.5;
      const walkMid = 9.5 + walkLen / 2;
      for (const s of [1, -1]) {
        for (const seg of [1, -1]) {
          const walk = new THREE.PlaneGeometry(
            horizontal ? walkLen : 1.1,
            horizontal ? 1.1 : walkLen,
          );
          walk.rotateX(-Math.PI / 2);
          walk.translate(
            horizontal ? seg * walkMid : s * 3.2,
            0.016,
            horizontal ? s * 3.2 : seg * walkMid,
          );
          paint(walk, sideCol);
          roadGeos.push(walk);
        }
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
        if (Math.abs(s) < 10.5) continue; // clear of the carriageway ring
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
    for (const dist of [16.5, -16.5]) {
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
      "#DCC9A0", // muted sand (butter screamed beside the clay dot)
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
      lampKeys,
      nodes,
      nodeYaws,
      nodeKeys,
      arcs,
      hub,
      roads,
      cars,
      range,
      colliders,
      radialKey: radialCellKey, // actors ride the same bloom wave
      retailLit: mergeSafe(retailLitGeos),
      eventsLit: mergeSafe(eventsLitGeos),
      mfgGlow: mergeSafe(mfgGlowGeos),
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
      c.retailLit?.dispose();
      c.eventsLit?.dispose();
      c.mfgGlow?.dispose();
      c.arcs.forEach((a) => {
        a.geo.dispose();
        a.mat.dispose();
      });
    };
  }, [city]);

  /* pop-grow shader handles (uPop driven by entry progress each frame) */
  const popShaders = useRef<PopShaderStore["current"]>([]);
  // shadows must telescope with the pop growth (depth pass gets the same chunk)
  const popDepth = useMemo(
    () => makePopDepthMaterial({ current: popShaders.current } as never),
    [],
  );
  const popMat = (m: THREE.MeshStandardMaterial | null) => {
    if (m && !m.userData.popped) {
      m.userData.popped = true;
      addPopGrow(m, popShaders);
    }
  };

  /* ================= dynamic actor refs ================= */
  const nodeMeshRef = useRef<THREE.InstancedMesh>(null);
  const nodeMatRef = useRef<THREE.MeshStandardMaterial>(null);
  const lampMeshRef = useRef<THREE.InstancedMesh>(null);
  const lampMatRef = useRef<THREE.MeshStandardMaterial>(null);
  const litWinMatRef = useRef<THREE.MeshStandardMaterial>(null);
  const retailLitMatRef = useRef<THREE.MeshStandardMaterial>(null);
  const eventsLitMatRef = useRef<THREE.MeshStandardMaterial>(null);
  const mfgGlowMatRef = useRef<THREE.MeshStandardMaterial>(null);
  const bodyMeshRef = useRef<THREE.InstancedMesh>(null);
  const cabinMeshRef = useRef<THREE.InstancedMesh>(null);
  const wheelMeshRef = useRef<THREE.InstancedMesh>(null);
  const hubRef = useRef<THREE.Mesh>(null);
  const hubRingRef = useRef<THREE.Mesh>(null);
  const highlightRef = useRef<THREE.Mesh>(null);
  const cityHemiRef = useRef<THREE.HemisphereLight>(null);
  const cityKeyRef = useRef<THREE.DirectionalLight>(null);
  const actorMeshRef = useRef<THREE.InstancedMesh>(null);
  const hatMeshRef = useRef<THREE.InstancedMesh>(null);
  const beatDotRef = useRef<THREE.Mesh>(null);
  const tillRef = useRef<THREE.Mesh>(null);
  const gateBarRef = useRef<THREE.Group>(null);
  const lastBeatRef = useRef(-1);
  const gzWasRef = useRef(false);

  /* day-aging light stops: p → key color / key intensity / hemi intensity */
  const LIGHT_STOPS = useMemo(
    () =>
      (
        [
          [0.0, "#FFF6E8", 1.6, 0.6],
          [0.34, "#FFF0DC", 1.65, 0.56],
          [0.55, "#FFE7CC", 1.7, 0.5],
          [0.8, "#FFDEBC", 1.3, 0.42],
          [1.0, "#FFDEBC", 1.25, 0.4],
        ] as [number, string, number, number][]
      ).map(([pp, hex, ki, hi]) => ({ p: pp, col: new THREE.Color(hex), ki, hi })),
    [],
  );

  /* ---------- actor pools (spec §7): ONE capsule mesh, four districts ----------
     kinds: 0 walker · 1 hatted M worker · 2 the BARE-HEADED worker (the
     detection subject) · 3 queue · 4 queue-that-splits · 5 events crowd */
  const ACTORS = useMemo(() => {
    const arand = mulberry32(4242);
    type Actor = {
      bx: number;
      bz: number;
      amp: number;
      axis: 0 | 1;
      phase: number;
      speed: number;
      kind: number;
    };
    const list: Actor[] = [];
    // M: six workers pacing the hall mouth (visible over the LOW parapet)
    for (let k = 0; k < 6; k++)
      list.push({
        bx: -43 + k * 2.5,
        bz: -7.3,
        amp: 1.6,
        axis: 0,
        phase: arand() * 10,
        speed: 0.45 + arand() * 0.25,
        kind: k === 2 ? 2 : 1,
      });
    // R: high-street shoppers on both sidewalks
    for (let k = 0; k < 12; k++)
      list.push({
        bx: (k % 2 ? 3.7 : -3.7) + (arand() - 0.5) * 0.7,
        bz: 18 + arand() * 22,
        amp: 3.5 + arand() * 3,
        axis: 1,
        phase: arand() * 20,
        speed: 0.5 + arand() * 0.35,
        kind: 0,
      });
    // R: the flagship queue (last two split at the payoff)
    for (let q = 0; q < 5; q++)
      list.push({
        bx: -6.1,
        bz: 26.2 + q * 0.62,
        amp: 0,
        axis: 1,
        phase: q * 1.7,
        speed: 0,
        kind: q >= 3 ? 4 : 3,
      });
    // SC: avenue-sidewalk pedestrians — bases OUTSIDE the plaza bowl so no
    // capsule ever strands on the hub island (panel finding)
    for (let k = 0; k < 12; k++) {
      const onX = k % 2 === 0;
      const side = k % 4 < 2 ? 3.9 : -3.9;
      const band = (13 + arand() * 14) * (arand() < 0.5 ? -1 : 1);
      list.push({
        bx: onX ? band : side,
        bz: onX ? side : band,
        amp: 2.5 + arand() * 3,
        axis: onX ? 0 : 1,
        phase: arand() * 20,
        speed: 0.45 + arand() * 0.3,
        kind: 0,
      });
    }
    // E: three gate lanes streaming + a loose stage crowd
    for (let k = 0; k < 14; k++)
      list.push({
        bx: 32.8 + (k % 3) * 3.4 + (arand() - 0.5) * 0.8,
        bz: -11.5,
        amp: 2.8,
        axis: 1,
        phase: arand() * 20,
        speed: 0.5 + arand() * 0.3,
        kind: 5,
      });
    for (let k = 0; k < 10; k++) {
      const a = Math.PI * (0.9 + arand() * 1.2);
      list.push({
        bx: 43 + Math.cos(a) * (3 + arand() * 2.2),
        bz: -18 + Math.sin(a) * (2.5 + arand() * 2),
        amp: 0.25,
        axis: 0,
        phase: arand() * 6,
        speed: 0.25,
        kind: 5,
      });
    }
    return list;
  }, []);
  const actorKeys = useMemo(
    () => ACTORS.map((a) => city.radialKey(a.bx, a.bz)),
    [ACTORS, city],
  );

  /* beat arc rigs: dot anchor → district lens (drawRange bezier, the house
     arc grammar); node indices: 1 = hall parapet cam, 3 = gate cam */
  const beatRigs = useMemo(() => {
    const mk = (from: THREE.Vector3, lensIdx: number) => {
      const to = city.nodes[Math.min(lensIdx, city.nodes.length - 1)];
      const mid = from.clone().lerp(to, 0.5);
      mid.y = Math.max(from.y, to.y) + from.distanceTo(to) * 0.25;
      const pts = new THREE.QuadraticBezierCurve3(from, mid, to).getPoints(36);
      const geo = new THREE.BufferGeometry().setFromPoints(pts);
      geo.setDrawRange(0, 0);
      const mat = new THREE.LineBasicMaterial({
        color: "#D97757",
        transparent: true,
        opacity: 0,
        fog: false,
      });
      return { line: new THREE.Line(geo, mat), geo, mat, total: pts.length, lensIdx };
    };
    let rIdx = 0;
    let best = Infinity;
    city.nodes.forEach((n, i) => {
      const d2 = (n.x + 6.5) ** 2 + (n.z - 28) ** 2;
      if (d2 < best) {
        best = d2;
        rIdx = i;
      }
    });
    return [
      mk(new THREE.Vector3(-36, 2.9, -7.2), 1), // M: hall mouth → parapet cam
      mk(new THREE.Vector3(-6.0, 2.4, 26.8), rIdx), // R: queue → street cam
      mk(new THREE.Vector3(38.5, 4.6, -10.5), 3), // E: gate swell → gate cam (clear of the copy card)
    ];
  }, [city]);
  useEffect(
    () => () =>
      beatRigs.forEach((r) => {
        r.geo.dispose();
        r.mat.dispose();
      }),
    [beatRigs],
  );
  const dotScratch = useMemo(() => new THREE.Vector3(), []);

  /* FINALE MOTES (spec §8): 140 clay fireflies riding the EXISTING arc
     bezier geometry home — tributaries converging on the hub; convergence,
     never dispersal (the murmuration is retired). One Points, fog-exempt,
     HDR color so ONLY they bloom. Pure f(uProgress): scrub-back reads as
     the network exhaling its data home. */
  const motes = useMemo(() => {
    const N = 140;
    const aP0 = new Float32Array(N * 3);
    const aP1 = new Float32Array(N * 3);
    const aP2 = new Float32Array(N * 3);
    const aSeed = new Float32Array(N);
    const hub = new THREE.Vector3(0, 2.32, 0);
    const mrand = mulberry32(777);
    for (let i = 0; i < N; i++) {
      const n = city.nodes[i % city.nodes.length];
      const fx = n.x + (mrand() - 0.5) * 0.9;
      const fy = n.y + mrand() * 0.5;
      const fz = n.z + (mrand() - 0.5) * 0.9;
      const dist = Math.hypot(fx - hub.x, fy - hub.y, fz - hub.z);
      const mx = (fx + hub.x) / 2;
      const my = Math.max(fy, 6) + dist * 0.16; // the arcs' own mid formula
      const mz = (fz + hub.z) / 2;
      aP0.set([fx, fy, fz], i * 3);
      aP1.set([mx, my, mz], i * 3);
      aP2.set(
        [hub.x + (mrand() - 0.5) * 0.7, hub.y + mrand() * 0.7, hub.z + (mrand() - 0.5) * 0.7],
        i * 3,
      );
      aSeed[i] = mrand();
    }
    const geo = new THREE.BufferGeometry();
    geo.setAttribute("position", new THREE.BufferAttribute(aP0.slice(), 3));
    geo.setAttribute("aP0", new THREE.BufferAttribute(aP0, 3));
    geo.setAttribute("aP1", new THREE.BufferAttribute(aP1, 3));
    geo.setAttribute("aP2", new THREE.BufferAttribute(aP2, 3));
    geo.setAttribute("aSeed", new THREE.BufferAttribute(aSeed, 1));
    const mat = new THREE.ShaderMaterial({
      uniforms: { uProgress: { value: 0 }, uTime: { value: 0 } },
      vertexShader: /* glsl */ `
        uniform float uProgress;
        uniform float uTime;
        attribute vec3 aP0;
        attribute vec3 aP1;
        attribute vec3 aP2;
        attribute float aSeed;
        varying float vA;
        void main() {
          float lp = clamp(uProgress * 1.35 - aSeed * 0.35, 0.0, 1.0);
          float e = lp * lp * (3.0 - 2.0 * lp);
          vec3 q0 = mix(aP0, aP1, e);
          vec3 q1 = mix(aP1, aP2, e);
          vec3 pos = mix(q0, q1, e); // quadratic bezier — the arc itself
          pos.x += sin(uTime * 1.4 + aSeed * 40.0) * 0.12 * (1.0 - e);
          pos.y += cos(uTime * 1.1 + aSeed * 30.0) * 0.10 * (1.0 - e);
          vA = smoothstep(0.0, 0.08, lp) * (1.0 - 0.6 * smoothstep(0.93, 1.0, lp));
          vec4 mv = modelViewMatrix * vec4(pos, 1.0);
          gl_Position = projectionMatrix * mv;
          gl_PointSize = (5.0 + 3.0 * sin(3.14159 * e)) * (140.0 / max(-mv.z, 0.001)) * 0.35;
        }
      `,
      fragmentShader: /* glsl */ `
        precision highp float;
        varying float vA;
        void main() {
          vec2 uv = gl_PointCoord - 0.5;
          float d = length(uv);
          if (d > 0.5) discard;
          float alpha = smoothstep(0.5, 0.08, d) * vA;
          gl_FragColor = vec4(vec3(0.851, 0.467, 0.341) * 2.2, alpha);
        }
      `,
      transparent: true,
      depthWrite: false,
      fog: false,
    });
    const pts = new THREE.Points(geo, mat);
    pts.visible = false;
    pts.frustumCulled = false;
    return { pts, geo, mat };
  }, [city]);
  useEffect(
    () => () => {
      motes.geo.dispose();
      motes.mat.dispose();
    },
    [motes],
  );
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

  /** GAZE state (spec §4.2): while active, the nearest 6 lenses yaw a few
      degrees toward the camera — the city notices you. Progress-windowed. */
  const gazeRef = useRef<{ amt: number; x: number; z: number; set: Set<number> }>({
    amt: 0,
    x: 0,
    z: 0,
    set: new Set(),
  });

  /** static camera units: yaw toward the hub, pitched down at the street.
      offset = body-local +Z distance from the lens (node) position */
  const PITCH = 0.5;
  const placeCamParts = (
    mesh: THREE.InstancedMesh | null,
    offset: number,
    pop = 1,
  ) => {
    if (!mesh) return;
    dummy.rotation.order = "YXZ";
    const cp = Math.cos(PITCH);
    const sp = Math.sin(PITCH);
    const gz = gazeRef.current;
    city.nodes.forEach((n, i) => {
      let yaw = city.nodeYaws[i];
      if (gz.amt > 0 && gz.set.has(i)) {
        let dy = Math.atan2(gz.x - n.x, gz.z - n.z) - yaw;
        dy = THREE.MathUtils.euclideanModulo(dy + Math.PI, Math.PI * 2) - Math.PI;
        yaw += THREE.MathUtils.clamp(dy, -0.45, 0.45) * gz.amt;
      }
      // ride the SAME grow curve as the building underneath (y compresses
      // toward the ground exactly like the vertex shader)
      const pe = pop >= 1 ? 1 : popEase(pop, city.nodeKeys[i]);
      // local +Z (front) in world, after yaw then downward pitch
      const fx = Math.sin(yaw) * cp;
      const fy = -sp;
      const fz = Math.cos(yaw) * cp;
      dummy.position.set(
        n.x - fx * offset,
        (n.y - fy * offset) * pe,
        n.z - fz * offset,
      );
      dummy.rotation.set(PITCH, yaw, 0);
      dummy.scale.setScalar(Math.max(0.001, pe));
      dummy.updateMatrix();
      mesh.setMatrixAt(i, dummy.matrix);
    });
    mesh.instanceMatrix.needsUpdate = true;
    dummy.rotation.order = "XYZ";
    dummy.rotation.set(0, 0, 0);
  };
  const camBodyMeshRef = useRef<THREE.InstancedMesh | null>(null);
  const camFaceMeshRef = useRef<THREE.InstancedMesh | null>(null);
  const setupCamBodies = (m: THREE.InstancedMesh | null) => {
    camBodyMeshRef.current = m;
    placeCamParts(m, 0.27);
  };
  const setupCamFaces = (m: THREE.InstancedMesh | null) => {
    camFaceMeshRef.current = m;
    placeCamParts(m, 0.02);
  };

  const setupBodies = (mesh: THREE.InstancedMesh | null) => {
    if (!mesh) return;
    (bodyMeshRef as React.MutableRefObject<THREE.InstancedMesh | null>).current = mesh;
    city.cars.forEach((c, i) => mesh.setColorAt(i, c.color));
    if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true;
  };

  /* ================= camera rig — the unified journey (spec §3.3) ================= */
  /* One continuous flight: god view → +z canyon dive → annulus swing →
     west sprint to the M-hold → T1 rise past the hub → the +z high-street
     dolly (R-hold) → T2 crane → the golden-hour high oblique (SC-hold,
     the CFO screenshot) → T3 descent to the gates (E-hold) → closed-loop
     crane back to the ENTRY FRAMING (same shot, city transformed).

     v1 NOTE: the M/E holds ride the west/east avenue corridors until
     their authored pockets land in P2 (container yard ≤3.2, gates apron).

     Every key: scroll-p stop · spline position · look SUBJECT (world) ·
     compositional x-offset (subject sits right-of-center, copy owns the
     left third). xOff flips with `dir` for RTL — the world is never
     mirrored, only the composition. */
  const CAM_KEYS = useMemo(
    () =>
      [
        { p: 0.0, pos: new THREE.Vector3(0, 52, 92), look: [0, 0, 4], xOff: -8 }, // A0 god
        { p: 0.06, pos: new THREE.Vector3(2.5, 16, 40), look: [0, 4, 10], xOff: -4 }, // A1 dive-in
        // A2 look down-street with less left bias — at xOff -5 a corridor-
        // edge facade stacked dead-center over a passing car (panel finding)
        { p: 0.09, pos: new THREE.Vector3(2.0, 5.0, 20), look: [0, 2.6, 6], xOff: -2 }, // A2 canyon floor
        { p: 0.11, pos: new THREE.Vector3(-7.5, 5.5, 6), look: [0, 1.5, -2], xOff: -2 }, // A3 annulus swing
        // corridor pin: the annulus→sprint corner cut a facade at 0.79u (CI)
        { p: 0.118, pos: new THREE.Vector3(-13, 5.4, 2.2), look: [-22, 3, -2], xOff: -5 },
        { p: 0.125, pos: new THREE.Vector3(-20, 5.0, 1.6), look: [-28, 3, -3], xOff: -6 }, // A4 west sprint
        // A5 at 4.5: CatmullRom rides ~0.25 above the key near the deck
        // edges — 4.5 keeps the whole ±1.3 window ≥2.45 under the 7.2 deck
        { p: 0.135, pos: new THREE.Vector3(-30, 4.35, 1.2), look: [-34, 3, -4], xOff: -6 }, // A5 gantry fly-under
        // stay LOW until clear of the deck's x-window, then climb to the hold
        { p: 0.1375, pos: new THREE.Vector3(-33, 4.8, 4), look: [-36, 3, -8], xOff: -5 },
        // M-HOLD above the container-yard pocket (≤3.2 by generator law):
        // high enough that the sawtooth pair + yard read as a diorama, the
        // gantry at frame edge — halls right two-thirds, copy owns the left
        { p: 0.14, pos: new THREE.Vector3(-33, 8.6, 12.5), look: [-37, 3.5, -12], xOff: -5 }, // A6 M-HOLD
        { p: 0.27, pos: new THREE.Vector3(-36, 8.9, 12), look: [-37, 3.5, -12], xOff: -5 }, //    (push-in)
        // T1 exit overfly: climb begins INSIDE the yard so the gantry deck
        // clears by 4u+ (the direct yard→hub diagonal skimmed it — CI)
        { p: 0.278, pos: new THREE.Vector3(-34.5, 9.5, 8), look: [-24, 4, 0], xOff: -3 },
        { p: 0.29, pos: new THREE.Vector3(-30, 14, 5), look: [-18, 4, 0], xOff: -3 },
        { p: 0.305, pos: new THREE.Vector3(-12, 16, 2), look: [0, 2, 0], xOff: -2 }, // T1 hub pass
        // T1→A7 routing: ride the TRANSIT band to the +z avenue mouth, then
        // descend INSIDE the corridor (a direct diagonal crosses tower blocks
        // at y≈14 — caught by the clearance CI)
        { p: 0.315, pos: new THREE.Vector3(1.5, 14, 12), look: [0, 3, 24], xOff: -5 },
        { p: 0.328, pos: new THREE.Vector3(1.9, 8.5, 28), look: [0, 2.6, 34], xOff: -6 },
        { p: 0.34, pos: new THREE.Vector3(1.8, 5.8, 38), look: [0, 2.6, 18], xOff: -7 }, // A7 R-HOLD
        { p: 0.47, pos: new THREE.Vector3(1.6, 5.2, 31), look: [0, 2.6, 14], xOff: -7 }, //    (dolly north)
        { p: 0.5, pos: new THREE.Vector3(3, 15, 14), look: [5, 4, 3], xOff: -2 }, // T2 crane (tower wipe at 2.5u+)
        { p: 0.53, pos: new THREE.Vector3(16, 24, 18), look: [2, 2, -2], xOff: -6 }, // A8 SC-HOLD
        { p: 0.68, pos: new THREE.Vector3(20, 23, 8), look: [2, 2, -2], xOff: -6 }, //    (drift)
        { p: 0.715, pos: new THREE.Vector3(26, 13, 2.5), look: [35, 3, -7], xOff: -2 }, // T3 toward gates
        // corridor pin: the T3 descent bowed +x/+z into a facade at 2.1u (CI)
        { p: 0.735, pos: new THREE.Vector3(30, 8.5, 2.2), look: [40, 3, -10], xOff: -2 },
        // E-HOLD: low at the avenue mouth so the gate arches read as
        // foreground occlusion, stage + string lights stacked behind
        { p: 0.75, pos: new THREE.Vector3(34, 4.6, 0.5), look: [43, 2.2, -16], xOff: -3 }, // A9 E-HOLD
        { p: 0.88, pos: new THREE.Vector3(35.5, 4.8, -0.5), look: [43, 2.2, -16], xOff: -3 }, //    (push-in)
        // crane departure: climb IN the corridor first, then arc out high —
        // the direct diagonal skimmed the SE tower field at 2.1u (CI)
        { p: 0.9, pos: new THREE.Vector3(33.5, 12, 1.2), look: [30, 2, -6], xOff: -3 },
        { p: 0.925, pos: new THREE.Vector3(27, 26, 14), look: [10, 1, 5], xOff: -4 },
        { p: 0.94, pos: new THREE.Vector3(20, 38, 40), look: [0, 1, 2], xOff: -4 }, // A10 crane out
        { p: 1.0, pos: new THREE.Vector3(0, 52, 92), look: [0, 0, 4], xOff: -8 }, // closed loop
      ] as { p: number; pos: THREE.Vector3; look: [number, number, number]; xOff: number }[],
    [],
  );
  const camPath = useMemo(
    () =>
      new THREE.CatmullRomCurve3(
        CAM_KEYS.map((k) => k.pos),
        false,
        "catmullrom",
        0.5,
      ),
    [CAM_KEYS],
  );
  const lookCur = useMemo(() => new THREE.Vector3(0, 0, 0), []);
  const posCur = useMemo(() => new THREE.Vector3(0, 52, 92), []);
  const pSmoothRef = useRef(0); // 1D smoothed progress — see MOTION LAW below
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
  const remapU = useMemo(() => {
    // ANCHOR-TRUE U: CatmullRom anchors do NOT sit at i/N along arc length —
    // derive each key's u by MONOTONIC nearest-distance sampling (the scan
    // window starts at the previous key's u, which disambiguates the
    // closed-loop duplicate endpoint and near-identical hold pairs).
    const probe = new THREE.Vector3();
    const N = 800;
    const U: number[] = [];
    let s0 = 0;
    CAM_KEYS.forEach((k, i) => {
      let bestU = s0 / N;
      let bestD = Infinity;
      for (let s = s0; s <= N; s++) {
        camPath.getPointAt(s / N, probe);
        const d = probe.distanceToSquared(k.pos);
        if (d < bestD) {
          bestD = d;
          bestU = s / N;
        }
      }
      const u =
        i === 0 ? 0 : i === CAM_KEYS.length - 1 ? 1 : Math.max(bestU, U[i - 1] + 0.002);
      U.push(u);
      s0 = Math.min(N, Math.ceil(u * N));
    });
    return (p: number) => {
      let i = 0;
      while (i < CAM_KEYS.length - 2 && p > CAM_KEYS[i + 1].p) i++;
      const a = CAM_KEYS[i];
      const b = CAM_KEYS[i + 1];
      const t = THREE.MathUtils.clamp((p - a.p) / (b.p - a.p), 0, 1);
      return U[i] + (U[i + 1] - U[i]) * t;
    };
  }, [camPath, CAM_KEYS]);

  useMemo(() => {
    scene.background = new THREE.Color(PAPER);
    scene.fog = new THREE.Fog(PAPER, 75, 200);
  }, [scene]);

  /* clearance CI (dev only, spec §3.4): sweep the spline AND the pSmooth-
     simulated worst-case scrub path against generator-captured colliders
     (buildings + antenna headroom + lamp heads). Runs before districts
     land so every later geometry change is tested from day one. */
  useEffect(() => {
    if (process.env.NODE_ENV === "production") return;
    const lampColliders: Collider[] = city.lampPositions.map((pp) => ({
      x: pp.x,
      z: pp.z,
      hw: 1.15, // arm reach |x|≈1.1
      hd: 1.15,
      h: 3.0, // lamp head ≈2.78
      label: "lamp",
    }));
    assertClearance(
      [...city.colliders, ...lampColliders],
      (u, out) => camPath.getPointAt(u, out),
      remapU,
    );
    // dedicated assertion (spec §3.4): the gantry deck is an ELEVATED volume
    // the ground-anchored AABB sweep can't model — check both regimes:
    // UNDER (the A5 fly-under): underside 7.2 − y ≥ 2.5
    // OVER (the T1 overfly): y − 8.3 (deck top + conveyor boxes) ≥ 2.5
    const gp = new THREE.Vector3();
    let worstGap = Infinity;
    for (let s = 0; s <= 1000; s++) {
      camPath.getPointAt(s / 1000, gp);
      if (Math.abs(gp.x + 30) < 1.45 && Math.abs(gp.z) < 6.4) {
        // conveyor boxes (top 8.25) only ride the deck's middle span
        const top = Math.abs(gp.z) < 4.8 ? 8.25 : 7.7;
        worstGap = Math.min(worstGap, gp.y < 7.2 ? 7.2 - gp.y : gp.y - top);
      }
    }
    if (worstGap !== Infinity && worstGap < 2.45)
      console.error(
        `[city-clearance] gantry pass clearance ${worstGap.toFixed(2)} < 2.5`,
      );
  }, [city, camPath, remapU]);

  /* perf budget (dev, spec §2): ≤55 draw calls / ≤450k triangles */
  const budgetFrameRef = useRef(0);

  /* ================= frame loop ================= */
  useFrame(({ camera, clock }, delta) => {
    const p = THREE.MathUtils.clamp(progressRef.current, 0, 1);
    const t = clock.elapsedTime;

    if (process.env.NODE_ENV !== "production" && ++budgetFrameRef.current === 90) {
      const r = gl.info.render;
      if (r.calls > 55 || r.triangles > 450_000)
        console.error(
          `[city-budget] ${r.calls} draw calls / ${r.triangles} tris (caps: 55 / 450k)`,
        );
    }

    /* ---- entry/exit fog veil: paper gives the world, paper takes it back.
       veil 0 = blank paper sheet, veil 1 = clear air. The constellation
       (nodes/arcs/hub) is fog-exempt, so it survives the exit whiteout. ---- */
    const eRaw = entryRef ? entryRef.current : 1;
    const e = 1 - Math.pow(1 - THREE.MathUtils.clamp(eRaw, 0, 1), 3); // easeOutCubic
    const exit = window01(p, 0.93, 1.0);
    // No exit mist — the next section physically slides OVER the city
    // (analog.io cover pattern); fog only serves the entry develop, and it
    // clears EARLY so the pop-up growth happens in clear air, on screen.
    const veil = Math.min(1, e * 1.8);
    const fog = scene.fog as THREE.Fog;
    // SOFTENED exit veil (spec §5.3): a partial pinch (~60% of clear) so the
    // lit city stays visible under the incoming cover — covered mid-breath,
    // alive, never faded. Constellation/hub/motes are fog-exempt.
    const exitVeil = window01(p, 0.93, 1.0);
    fog.near = THREE.MathUtils.lerp(4 + veil * 71, 45, exitVeil); // 4 → 75 → 45
    fog.far = THREE.MathUtils.lerp(24 + veil * 176, 120, exitVeil); // 24 → 200 → 120

    /* pop-up-book entry: half the growth during the slide-in, the rest
       through the GAZE beat — the wave completes as the prologue scrim
       releases, so the heartbeat (P3) lands on a fully-stood city */
    const pop = Math.min(1, e * 0.45 + window01(p, 0, 0.06) * 0.55);
    const popE = 1 - Math.pow(1 - pop, 3);
    popShaders.current.forEach((sh) => {
      sh.uniforms.uPop.value = pop;
    });

    /* GAZE (spec §4.2): as the bloom completes, the nearest 6 lenses turn
       toward the camera — pure progress window, no clock relax */
    const gazeAmt = window01(p, 0.005, 0.03) * (1 - window01(p, 0.055, 0.08));
    const gz = gazeRef.current;
    gz.amt = gazeAmt;
    gz.x = posCur.x;
    gz.z = posCur.z;
    if (gazeAmt > 0 && gz.set.size === 0) {
      const order = city.nodes
        .map((n, i) => ({ i, d: n.distanceToSquared(posCur) }))
        .sort((a, b) => a.d - b.d);
      gz.set = new Set(order.slice(0, 6).map((o) => o.i));
    } else if (gazeAmt === 0 && gz.set.size) {
      gz.set.clear();
    }

    if (pop < 0.999 || gazeAmt > 0) {
      // instanced hardware rides its own building/pole grow curve
      placeCamParts(camBodyMeshRef.current, 0.27, pop);
      placeCamParts(camFaceMeshRef.current, 0.02, pop);
      const lampMesh = lampMeshRef.current;
      if (lampMesh) {
        city.lampPositions.forEach((pp, i) => {
          const pe = popEase(pop, city.lampKeys[i]);
          dummy.position.set(pp.x, pp.y * pe, pp.z);
          dummy.rotation.set(0, 0, 0);
          dummy.scale.setScalar(Math.max(0.001, pe));
          dummy.updateMatrix();
          lampMesh.setMatrixAt(i, dummy.matrix);
        });
        lampMesh.instanceMatrix.needsUpdate = true;
      }
    }

    /* MOTION LAW (spec §3.1): smooth the PROGRESS SCALAR, never the 3D
       position — the camera is evaluated exactly ON the spline, so the
       clearance sweep certifies the path actually flown. Frame-rate
       invariant lag (k = 1 - e^(-λ·dt); λ≈6.5 ≈ the old 0.10@60fps). */
    pSmoothRef.current += (p - pSmoothRef.current) * (1 - Math.exp(-6.5 * delta));
    const pS = pSmoothRef.current;
    camPath.getPointAt(remapU(pS), posCur);
    // entry pre-roll: start higher/farther, settle onto the spline as the
    // world develops (offset rides ABOVE the tested path — adds clearance)
    posCur.y += (1 - e) * 16;
    posCur.z += (1 - e) * 12;
    camera.position.copy(posCur);

    // look: keyframe-interpolated subject + dir-flipped composition offset;
    // 3D lerp kept for the target only (look lag cannot clip geometry)
    let ki = 0;
    while (ki < CAM_KEYS.length - 2 && pS > CAM_KEYS[ki + 1].p) ki++;
    const ka = CAM_KEYS[ki];
    const kb = CAM_KEYS[ki + 1];
    const kt = THREE.MathUtils.clamp((pS - ka.p) / (kb.p - ka.p), 0, 1);
    const lax = ka.look[0] + ka.xOff * dir;
    const lbx = kb.look[0] + kb.xOff * dir;
    tmp.set(
      lax + (lbx - lax) * kt,
      ka.look[1] + (kb.look[1] - ka.look[1]) * kt,
      ka.look[2] + (kb.look[2] - ka.look[2]) * kt,
    );
    lookCur.lerp(tmp, 0.08);
    camera.lookAt(lookCur);

    /* FOV script (spec §0.19): ~27 through the dive, 32 cruising, ease
       toward 34.5 in each hold's push-in — the film gets lenses */
    const diveW = window01(p, 0.05, 0.08) * (1 - window01(p, 0.125, 0.155));
    let fovT = 32 - 5 * diveW;
    for (const [a, b] of FRACTIONS.parks)
      fovT += 2.5 * window01(p, (a + b) / 2, b) * (1 - window01(p, b, b + 0.035));
    const pcam = camera as THREE.PerspectiveCamera;
    const nf = pcam.fov + (fovT - pcam.fov) * (1 - Math.exp(-4 * delta));
    if (Math.abs(nf - pcam.fov) > 0.002) {
      pcam.fov = nf;
      pcam.updateProjectionMatrix();
    }

    /* narrative windows — keyed to the unified FRACTIONS (spec §5.1):
       wake = the silhouette overture (lenses/lamps/skyline rows ramp as the
       bloom completes and the dive flies); querySpot rides the SC park;
       finale arcs draw through the closed-loop crane */
    const wake = window01(p, 0.01, 0.1);
    const querySpot = window01(p, 0.555, 0.615) * (1 - window01(p, 0.67, 0.7));
    const finale = window01(p, 0.88, 0.97);

    /* ---- day-aging light script (spec §6.5) ---- */
    if (cityKeyRef.current && cityHemiRef.current) {
      let si = 0;
      while (si < LIGHT_STOPS.length - 2 && p > LIGHT_STOPS[si + 1].p) si++;
      const A = LIGHT_STOPS[si];
      const B = LIGHT_STOPS[si + 1];
      const lt = THREE.MathUtils.clamp((p - A.p) / (B.p - A.p), 0, 1);
      cityKeyRef.current.color.copy(A.col).lerp(B.col, lt);
      cityKeyRef.current.intensity = THREE.MathUtils.lerp(A.ki, B.ki, lt);
      cityHemiRef.current.intensity = THREE.MathUtils.lerp(A.hi, B.hi, lt);
    }

    /* ---- SURVEILLANCE BEATS (spec §7): dot → arc to district lens →
       two-hop hub brighten → hub blink → exactly ONE clay payoff.
       All windows on park-local progress: scrub-reversible. ---- */
    const sR = window01(p, FRACTIONS.parks[1][0], FRACTIONS.parks[1][1]);
    const sE = window01(p, FRACTIONS.parks[3][0], FRACTIONS.parks[3][1]);
    const payR = window01(sR, 0.55, 0.65); // second till lamp + queue split
    const payE = window01(sE, 0.55, 0.65); // third gate barrier swings open
    const splitW = payR;
    if (tillRef.current)
      (tillRef.current.material as THREE.MeshStandardMaterial).emissiveIntensity =
        0.1 + payR * 2.4;
    if (gateBarRef.current) gateBarRef.current.rotation.z = -1.15 * payE;

    let dotW = 0;
    let hopIdx = -1;
    let hopW = 0;
    let blinkW = 0;
    let activeBeat = -1;
    beatRigs.forEach((rig) => {
      rig.mat.opacity = 0;
      rig.geo.setDrawRange(0, 0);
    });
    const BEAT_MAP: [number, number][] = [
      [0, 0],
      [1, 1],
      [3, 2],
    ]; // park → rig (SC's beat is the existing query machinery)
    for (const [bi, ri] of BEAT_MAP) {
      const [a, b] = FRACTIONS.parks[bi];
      if (p < a || p > b) continue;
      const s = (p - a) / (b - a);
      const rig = beatRigs[ri];
      const fade = 1 - window01(s, 0.9, 1);
      dotW = window01(s, 0.35, 0.42) * fade;
      const arcW = window01(s, 0.42, 0.55) * fade;
      hopW = window01(s, 0.55, 0.62) * fade;
      blinkW = Math.sin(Math.PI * window01(s, 0.6, 0.7)) * fade;
      activeBeat = bi;
      hopIdx = rig.lensIdx;
      rig.geo.setDrawRange(0, Math.floor(arcW * rig.total));
      rig.mat.opacity = 0.85 * arcW;
      if (bi === 1) dotScratch.set(-6.0, 2.3, 26.0);
      if (bi === 3) dotScratch.set(38.5, 4.6, -10.5);
    }

    /* ---- actor pools: walkers/queue/crowd, riding the bloom wave ---- */
    const actorsMesh = actorMeshRef.current;
    let w2x = -38;
    let w2z = -7.3;
    if (actorsMesh) {
      const hats = hatMeshRef.current;
      let hatIdx = 0;
      ACTORS.forEach((a, i) => {
        const pe = pop >= 1 ? 1 : popEase(pop, actorKeys[i]);
        let along = 0;
        if (a.amp > 0) {
          const L = a.amp * 2;
          const tt2 = (a.phase + t * a.speed) % (L * 2);
          along = (tt2 < L ? tt2 : L * 2 - tt2) - a.amp;
        }
        let px2 = a.bx + (a.axis === 0 ? along : 0);
        const pz2 = a.bz + (a.axis === 1 ? along : 0);
        if (a.kind === 4) px2 += 0.95 * splitW; // the queue visibly drains
        let sc = pe;
        // crowd density biased by the Events park window (the stream thickens)
        if (a.kind === 5) sc *= 0.55 + 0.45 * window01(p, 0.69, 0.76);
        const bob = a.speed > 0.3 ? Math.abs(Math.sin(t * 3.2 * a.speed + a.phase)) * 0.05 : 0;
        dummy.position.set(px2, (0.31 + bob) * sc, pz2);
        dummy.rotation.set(0, 0, 0);
        dummy.scale.setScalar(Math.max(0.001, sc));
        dummy.updateMatrix();
        actorsMesh.setMatrixAt(i, dummy.matrix);
        if (a.kind === 2) {
          w2x = px2;
          w2z = pz2;
        }
        if (a.kind === 1 && hats) {
          dummy.position.set(px2, (0.72 + bob) * sc, pz2);
          dummy.updateMatrix();
          hats.setMatrixAt(hatIdx++, dummy.matrix);
        }
      });
      actorsMesh.instanceMatrix.needsUpdate = true;
      if (hats) hats.instanceMatrix.needsUpdate = true;
    }
    // the M dot hovers over the BARE head — the missing hat IS the payoff
    if (activeBeat === 0) dotScratch.set(w2x, 1.8, w2z);
    if (beatDotRef.current) {
      beatDotRef.current.visible = dotW > 0.01;
      if (dotW > 0.01) {
        beatDotRef.current.position.copy(dotScratch);
        beatDotRef.current.scale.setScalar(dotW * (1 + 0.12 * Math.sin(t * 3)));
      }
    }
    // nearest 3-4 lenses yaw-track the dot during the hold
    if (dotW > 0.01) {
      const gzb = gazeRef.current;
      gzb.amt = Math.max(gzb.amt, dotW * 0.7);
      gzb.x = dotScratch.x;
      gzb.z = dotScratch.z;
      if (lastBeatRef.current !== activeBeat) {
        lastBeatRef.current = activeBeat;
        const order = city.nodes
          .map((n, i) => ({ i, d: (n.x - dotScratch.x) ** 2 + (n.z - dotScratch.z) ** 2 }))
          .sort((q1, q2) => q1.d - q2.d);
        gzb.set = new Set(order.slice(0, 4).map((o) => o.i));
      }
    } else if (activeBeat === -1 && p > 0.12 && gazeRef.current.set.size) {
      gazeRef.current.set.clear();
      gazeRef.current.amt = 0;
      lastBeatRef.current = -1;
    }
    // re-place cam instances while tracking (the pop block stops at pop≥1)
    const tracking = pop >= 0.999 && (gazeRef.current.amt > 0.01 || gzWasRef.current);
    if (tracking) {
      placeCamParts(camBodyMeshRef.current, 0.27, 1);
      placeCamParts(camFaceMeshRef.current, 0.02, 1);
    }
    gzWasRef.current = gazeRef.current.amt > 0.01;

    /* CCTV lenses: the wake IGNITES them (emissive, via nodeMatRef) rather
       than ballooning them — a lens bigger than its camera reads absurd */
    const nodes = nodeMeshRef.current;
    if (nodes) {
      for (let i = 0; i < city.nodes.length; i++) {
        const pulse = 1 + 0.08 * wake * Math.sin(t * 2.2 + i * 1.7);
        const pe = pop >= 1 ? 1 : popEase(pop, city.nodeKeys[i]);
        dummy.position.copy(city.nodes[i]);
        dummy.position.y *= pe;
        dummy.rotation.set(0, 0, 0);
        dummy.scale.setScalar((0.95 + 0.15 * wake + 0.2 * exit) * pulse * Math.max(0.001, pe));
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
    /* KHAKI-MUD LAW (panel): every emissive is tint-capped at #FFDEBC in
       the materials — the day ages via INTENSITY only, never chroma */
    if (litWinMatRef.current) litWinMatRef.current.emissiveIntensity = 0.06 + wake * 0.95;
    /* district interiors ride their own park windows */
    if (retailLitMatRef.current)
      retailLitMatRef.current.emissiveIntensity = 0.15 + window01(p, 0.3, 0.36) * 0.75;
    if (eventsLitMatRef.current)
      eventsLitMatRef.current.emissiveIntensity = 0.1 + window01(p, 0.7, 0.76) * 1.05;
    if (mfgGlowMatRef.current)
      mfgGlowMatRef.current.emissiveIntensity = 0.12 + window01(p, 0.1, 0.15) * 0.5;
    /* lenses ignite on wake; constellation glows brighter through the exit.
       HEARTBEAT (spec §4.2): one synchronized pulse as the bloom completes —
       every lens fires through the bloom threshold at once. */
    const heart = Math.sin(Math.PI * window01(p, 0.028, 0.062));
    if (nodeMatRef.current)
      nodeMatRef.current.emissiveIntensity =
        0.35 + wake * 0.85 + finale * 0.25 + exit * 0.9 + heart * 1.7;

    /* finale motes: the network exhales home (0.89–0.97) */
    const moteW = window01(p, 0.89, 0.97);
    motes.pts.visible = moteW > 0.001;
    if (moteW > 0.001) {
      (motes.mat.uniforms.uProgress as { value: number }).value = moteW;
      (motes.mat.uniforms.uTime as { value: number }).value = t;
    }

    /* arcs draw on across the whole journey — the network learns the city
       park by park (each settled park lifts the baseline), the detection
       beat's lens runs a brighter two-hop, full draw through the finale */
    const parksLit =
      0.1 * window01(p, 0.27, 0.29) +
      0.1 * window01(p, 0.47, 0.49) +
      0.1 * window01(p, 0.68, 0.7);
    city.arcs.forEach((arc, i) => {
      const local = window01(p, 0.22 + arc.delay * 0.5, 0.55 + arc.delay * 0.5);
      arc.geo.setDrawRange(0, Math.floor(local * arc.total));
      const hop = i === hopIdx ? hopW * 0.5 : 0;
      arc.mat.opacity = Math.min(
        0.95,
        (0.45 + parksLit) * local + 0.3 * finale + 0.25 * exit + hop,
      );
    });

    /* hub breathes; ring spins */
    if (hubRef.current) {
      // breathe ≤6%: at 12% the 1.56 core POKED past the 1.7 chassis and the
      // hub read as two offset slabs at close range (panel finding)
      hubRef.current.scale.setScalar(1 + wake * 0.035 * Math.sin(t * 3));
      (hubRef.current.material as THREE.MeshStandardMaterial).emissiveIntensity =
        0.25 + wake * 0.7 + finale * 0.4 + 0.5 * exit + blinkW * 0.6;
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
      {/* the day ages noon→dusk across the journey (script in the frame
          loop, khaki-mud law: mood = intensity + emissives, tint floor
          #FFDEBC, hemisphere rides down with the key) */}
      <hemisphereLight ref={cityHemiRef} args={["#FFF4E4", "#E2C4B4", 0.55]} />
      <directionalLight
        ref={cityKeyRef}
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
        <meshStandardMaterial color="#F2EEE3" roughness={1} />
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
        <mesh geometry={city.buildings} castShadow={high} receiveShadow={high} customDepthMaterial={popDepth}>
          <meshStandardMaterial ref={popMat} vertexColors roughness={0.92} />
        </mesh>
      )}

      {/* window grids */}
      {city.windowsDark && (
        <mesh geometry={city.windowsDark}>
          <meshStandardMaterial ref={popMat} vertexColors roughness={0.6} metalness={0.05} />
        </mesh>
      )}
      {city.windowsLit && (
        <mesh geometry={city.windowsLit}>
          <meshStandardMaterial
            ref={(m) => {
              (litWinMatRef as React.MutableRefObject<THREE.MeshStandardMaterial | null>).current = m;
              popMat(m);
            }}
            vertexColors
            roughness={0.5}
            emissive="#FFDEBC"
            emissiveIntensity={0.08}
          />
        </mesh>
      )}

      {/* per-district emissive layers (spec §0.4): own mesh+material each, so
          wake-on-approach is ONE material write per district (P4 wires the
          approach ramps; until then they ride the global wake) */}
      {city.retailLit && (
        <mesh geometry={city.retailLit}>
          <meshStandardMaterial
            ref={(m) => {
              (retailLitMatRef as React.MutableRefObject<THREE.MeshStandardMaterial | null>).current = m;
              popMat(m);
            }}
            color="#FFEFD8"
            roughness={0.45}
            emissive="#FFDEBC"
            emissiveIntensity={0.2}
          />
        </mesh>
      )}
      {city.eventsLit && (
        <mesh geometry={city.eventsLit}>
          <meshStandardMaterial
            ref={(m) => {
              (eventsLitMatRef as React.MutableRefObject<THREE.MeshStandardMaterial | null>).current = m;
              popMat(m);
            }}
            color="#FFE9C8"
            roughness={0.4}
            emissive="#FFDEBC"
            emissiveIntensity={0.25}
          />
        </mesh>
      )}
      {city.mfgGlow && (
        <mesh geometry={city.mfgGlow}>
          <meshStandardMaterial
            ref={(m) => {
              (mfgGlowMatRef as React.MutableRefObject<THREE.MeshStandardMaterial | null>).current = m;
              popMat(m);
            }}
            color="#FFE2B8"
            roughness={0.4}
            emissive="#FFDEBC"
            emissiveIntensity={0.3}
          />
        </mesh>
      )}

      {/* trees */}
      {city.greens && (
        <mesh geometry={city.greens} castShadow={high} customDepthMaterial={popDepth}>
          <meshStandardMaterial ref={popMat} vertexColors roughness={1} />
        </mesh>
      )}

      {/* streetlight poles */}
      {city.poles && (
        <mesh geometry={city.poles} castShadow={high} customDepthMaterial={popDepth}>
          <meshStandardMaterial ref={popMat} vertexColors roughness={0.9} />
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
      {beatRigs.map((rig, i) => (
        <primitive key={`beat-${i}`} object={rig.line} />
      ))}
      <primitive object={motes.pts} />

      {/* actor pools — ONE capsule mesh for all four districts + hat discs
          (five butter hats, one conspicuously bare head: the M beat) */}
      <instancedMesh
        ref={(m) => {
          (actorMeshRef as React.MutableRefObject<THREE.InstancedMesh | null>).current = m;
          if (m && !m.userData.colored) {
            m.userData.colored = true;
            const pal = ["#8E8A7E", "#A8A293", "#B5A08E", "#9FB4C7", "#A8B89A", "#C9A6A0"];
            const ac = new THREE.Color();
            for (let i = 0; i < ACTORS.length; i++)
              m.setColorAt(i, ac.set(pal[i % pal.length]));
            if (m.instanceColor) m.instanceColor.needsUpdate = true;
          }
        }}
        args={[undefined, undefined, ACTORS.length]}
        frustumCulled={false}
      >
        <capsuleGeometry args={[0.14, 0.34, 4, 8]} />
        <meshStandardMaterial roughness={0.85} />
      </instancedMesh>
      <instancedMesh
        ref={hatMeshRef}
        args={[undefined, undefined, 5]}
        frustumCulled={false}
      >
        <cylinderGeometry args={[0.17, 0.17, 0.07, 10]} />
        <meshStandardMaterial color="#E5C97B" roughness={0.55} />
      </instancedMesh>

      {/* detection dot (HDR — blooms) + the two clay payoff rigs */}
      <mesh ref={beatDotRef} visible={false}>
        <sphereGeometry args={[0.24, 12, 12]} />
        <meshStandardMaterial
          color="#D97757"
          emissive="#D97757"
          emissiveIntensity={2.4}
          fog={false}
        />
      </mesh>
      {/* second till lamp at the flagship (ignites clay on the R payoff) */}
      <mesh ref={tillRef} position={[-5.45, 2.3, 29.2]}>
        <boxGeometry args={[0.3, 0.3, 0.3]} />
        <meshStandardMaterial
          color="#D97757"
          emissive="#D97757"
          emissiveIntensity={0.1}
          fog={false}
        />
      </mesh>
      {/* gate-3 barrier — swings open on the E payoff (hinged at the post) */}
      <group ref={gateBarRef} position={[38.25, 0.95, -8.2]}>
        <mesh position={[1.2, 0, 0]}>
          <boxGeometry args={[2.4, 0.12, 0.14]} />
          <meshStandardMaterial
            color="#D97757"
            emissive="#D97757"
            emissiveIntensity={0.55}
            fog={false}
          />
        </mesh>
      </group>

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
