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
  paintGraded,
  popCellKey,
  popEase,
  setPopKey,
  addPopGrow,
  makePopDepthMaterial,
  POP_VERTEX_DECL,
  POP_VERTEX_CHUNK,
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
  /** handle to the SINGLE animated Bloom pass (spec §3). Null on mobile
      (no EffectComposer) → every write is null-guarded. */
  bloomRef?: React.MutableRefObject<{
    intensity: number;
    luminanceMaterial: { threshold: number };
  } | null>;
}

const PAPER = "#FAF9F5"; // brand cream-50 — seam-free with the page background
const CLAY = new THREE.Color("#D97757");
const CLAY_DEEP = new THREE.Color("#C2613F");
const CLAY_SOFT = new THREE.Color("#E8A381");
const DORMANT = new THREE.Color("#BDB6A2");
const INK = new THREE.Color("#3D3A33");

/* Bloom INTENSITY keyframes (spec §3 table) — [p, intensity]. Day restrained,
   festival blooms hard from intensity, finale eases back so arcs still kiss. */
const BLOOM_I: [number, number][] = [
  [0.0, 0.45],
  [0.2, 0.48],
  [0.4, 0.55],
  [0.47, 0.55],
  [0.56, 0.9],
  [0.8, 1.15],
  [0.93, 0.85],
];
/* piecewise-linear lerp over an [x, y] keyframe table (same pattern as the
   LIGHT_STOPS lerp) — clamps outside the table range */
function piecewise(x: number, stops: [number, number][]): number {
  if (x <= stops[0][0]) return stops[0][1];
  const last = stops[stops.length - 1];
  if (x >= last[0]) return last[1];
  let i = 0;
  while (i < stops.length - 2 && x > stops[i + 1][0]) i++;
  const [ax, ay] = stops[i];
  const [bx, by] = stops[i + 1];
  return ay + ((by - ay) * (x - ax)) / (bx - ax);
}




/**
 * Bake a per-object "pop key" into every vertex (attribute aPop) so the
 * entry can grow buildings out of the ground in a staggered pop-up-book
 * wave. Keyed by quantized footprint anchor, so a building and everything
 * standing on it (mast, AC, windows) rise together.
 */



export function CityScene({ progressRef, entryRef, quality = "high", dir = 1, bloomRef }: CitySceneProps) {
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
    /* gate lintel caps ride a CAPPED ramp of their own — at full eventsLit
       intensity the three near-camera beams bloomed white and bisected the
       E-HOLD copy card */
    const gateGlowGeos: THREE.BufferGeometry[] = [];
    const mfgGlowGeos: THREE.BufferGeometry[] = [];
    /* WP2: Smart-Cities night bucket — downtown windows that IGNITE through
       the flip, plus the steady civic-teal accents (the ONE cool family) */
    const scWindowGeos: THREE.BufferGeometry[] = [];
    /* WP2: wet-street reflection streaks (additive, night-gated) */
    const wetGeos: THREE.BufferGeometry[] = [];
    const windowDarkGeos: THREE.BufferGeometry[] = [];
    const windowLitGeos: THREE.BufferGeometry[] = [];
    const treeGeos: THREE.BufferGeometry[] = [];
    const poleGeos: THREE.BufferGeometry[] = [];
    const lampPositions: THREE.Vector3[] = [];
    const lampKeys: number[] = [];
    /* per-lamp arm yaw — the streetlight POOL ellipse (§2) is stretched 1.4×
       along this axis so cast light reads as "thrown" down the road */
    const lampYaws: number[] = [];
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
    /* founder mandate: VIBRANT. Burano-painted-houses energy — saturated,
       joyful, harmonized. Cream breathers keep it sophisticated; clay stays
       the only MOVING light so the signal survives the chroma. */
    const FACADES: [string, number][] = [
      ["#F2E3C8", 13], // warm cream (breather)
      ["#7FA8C9", 12], // sky blue
      ["#93B17C", 11], // leaf green
      ["#5FA8A0", 10], // venetian teal
      ["#D98C9C", 10], // rose pink
      ["#E3B23C", 9], // mustard
      ["#E5C1A5", 11], // apricot
      ["#E8826B", 7], // coral (kept rarer than clay's airtime)
      ["#B89CC8", 8], // wisteria
      ["#C96F4A", 5], // terracotta
      ["#E8CFC8", 9], // shell pink
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
      /* WP2 routing: downtown dark windows (r<26, hash-picked — NO extra
         rand draws) move to the SC night bucket so the district can ignite
         through the flip; per-building tint alternates warm/teal */
      const scTintWarm = new THREE.Color("#FFDEBC");
      const scTintTeal = new THREE.Color("#BFD8D2");
      const pushWin = (g: THREE.BufferGeometry, lit: boolean) => {
        if (!lit && Math.hypot(x, z) < 26 && popCellKey(x + 1.7, z - 2.3) < 0.55) {
          paint(g, popCellKey(x, z) > 0.35 ? scTintWarm : scTintTeal);
          scWindowGeos.push(g);
          return;
        }
        paint(g, lit ? winLit : winDark);
        (lit ? windowLitGeos : windowDarkGeos).push(g);
      };
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
            pushWin(g, rand() < 0.12);
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
            pushWin(g, rand() < 0.12);
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
    /* WP3/WP4 scratch + ground-life buckets */
    const colCap = new THREE.Color();
    const dcolLot = new THREE.Color(); // WP6 storefront scratch
    const roofCapCol = new THREE.Color("#CBC2AE");
    const padGeos: THREE.BufferGeometry[] = [];

    for (let bx = -SPAN; bx <= SPAN; bx++) {
      for (let bz = -SPAN; bz <= SPAN; bz++) {
        if (Math.abs(bx) < 1 && Math.abs(bz) < 1) continue; // plaza
        /* WP4 ground life: per-block lot pad with seeded tonal jitter —
           restores the block/street figure-ground from the god view */
        if (high) {
          const pad = new THREE.PlaneGeometry(8.8, 8.8);
          pad.rotateX(-Math.PI / 2);
          pad.translate(bx * BLOCK, 0.03, bz * BLOCK);
          const hb = Math.abs(Math.sin(bx * 37.7 + bz * 91.3) * 43758.5453) % 1;
          colCap.set("#EDEAE0").offsetHSL((hb - 0.5) * 0.012, 0, (hb - 0.5) * 0.05);
          paint(pad, colCap);
          padGeos.push(pad);
        }
        // DISTRICT MASK (spec §1): these blocks are replaced by authored
        // sets built after the loop — same skip pattern as the PARK block.
        // The −z arm and the south-east quarter stay generic civilian tissue.
        // NOTE: the camera path threads these district corridors at LOW altitude
        // (A5/A6 gantry pass, T1a lift-off, T3 festival run) in BOTH quality
        // modes — the keys are absolute world coords, not SPAN-scaled. In low
        // quality the authored sets aren't built, but the blocks must STILL be
        // masked or the generic grid backfills the corridor and the camera
        // clips it (the pre-existing low-quality clearance bug). So the mask is
        // unconditional; on mobile these become open ground the camera flies over.
        if (bx >= -5 && bx <= -3 && (bz === -2 || bz === -1)) continue; // MFG halls
        if (bx >= -5 && bx <= -3 && (bz === 1 || bz === 2)) continue; // container yard
        if (bx >= 3 && bx <= 5 && (bz === -2 || bz === -1)) continue; // Events ground
        if (high && bx === PARK.bx && bz === PARK.bz) {
          // park: lawn + crossing paths + a small grove
          const px = bx * BLOCK;
          const pz = bz * BLOCK;
          const lawn = new THREE.PlaneGeometry(8.8, 8.8);
          lawn.rotateX(-Math.PI / 2);
          lawn.translate(px, 0.042, pz);
          paint(lawn, new THREE.Color("#A9B795"));
          parkGeos.push(lawn);
          for (const horizontal of [true, false]) {
            const path = new THREE.PlaneGeometry(horizontal ? 8.8 : 1.0, horizontal ? 1.0 : 8.8);
            path.rotateX(-Math.PI / 2);
            path.translate(px, 0.05, pz);
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
            const cr = 0.9 + rand() * 0.55;
            const canopy = new THREE.IcosahedronGeometry(cr, 1);
            canopy.scale(1, 0.85, 1);
            canopy.translate(tx, th + cr * 0.52, tz); // seats INTO the trunk (WP7)
            col.copy(rand() < 0.42 ? blossomCol : mossCol).offsetHSL(0, 0, (rand() - 0.5) * 0.06);
            paint(canopy, col);
            treeGeos.push(canopy);
          }
          continue;
        }
        for (let i = 0; i < 2; i++) {
          for (let j = 0; j < 2; j++) {
            let x = bx * BLOCK + (i - 0.5) * 4.4 + (rand() - 0.5) * 0.8;
            let z = bz * BLOCK + (j - 0.5) * 4.4 + (rand() - 0.5) * 0.8;

            // keep the avenue corridors CLEAR — the camera flies down them
            // and the boulevards must read from above
            if (Math.abs(x) < 4.8 || Math.abs(z) < 4.8) continue;
            // open square around the roundabout: the orbiting traffic needs
            // a clear annulus — no buildings hugging the plaza corners
            if (Math.hypot(x, z) < 11.5) continue;

            // the HIGH STREET never skips a lot — a street wall with a
            // missing tooth was the founder's "did you remove a building?"
            const retailFront = high && Math.abs(x) < 10 && z >= 14 && z <= 44;
            if (rand() < 0.22 && !retailFront) {
              if (rand() < 0.8) {
                const th = 0.8 + rand() * 0.5;
                const trunk = new THREE.CylinderGeometry(0.1, 0.14, th, 6);
                trunk.translate(x, th / 2, z);
                paint(trunk, trunkCol);
                treeGeos.push(trunk);
                const cr2 = 0.85 + rand() * 0.5;
                const canopy = new THREE.IcosahedronGeometry(cr2, 1);
                canopy.scale(1, 0.85, 1);
                canopy.translate(x, th + cr2 * 0.52, z);
                col.copy(rand() < 0.42 ? blossomCol : mossCol).offsetHSL(0, 0, (rand() - 0.5) * 0.06);
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
            // retail clamps live in the generator: the dive descends over
            // z<28 at y≈7, so pushed-out lots there stay low (CI-derived)
            if (retailZone)
              h = marketPocket
                ? 1.7 + (hOrig % 0.5)
                : z < 28
                  ? 2.2 + (hOrig % 1.9)
                  : 2.4 + (hOrig % 2.6);
            // footprint capped to fit the 4.4 lot pitch with a street gap
            // (was 2.7..4.0 + a 1.25x podium = up to 5.0 wide → buildings
            // spilled across roads & each other — founder img 31)
            let w = 2.3 + rand() * 0.9; // 2.3..3.2 → half ≤1.6
            let d = 2.3 + rand() * 0.9;
            if (flagship) {
              h = 3.4;
              w = 3.2;
              d = 3.1;
            }
            // WP6 (polish R2): push retail lots OUTWARD so every storefront
            // face lands exactly at |x| = 5.85 — the recessed-shop problem
            // dies at the root, awnings anchor to a consistent street wall
            if (retailZone && Math.abs(x) < 10) x = Math.sign(x) * (5.85 + w / 2);
            // PLOT CLAMP (founder img 31): every building's footprint stays
            // inside its lot cell (pitch 4.4, half 2.2) with a street margin
            // so nothing overhangs a road or a neighbour. Retail is exempt
            // (it is deliberately pushed to the street wall above).
            if (!retailZone) {
              const lotCx = bx * BLOCK + (i - 0.5) * 4.4;
              const lotCz = bz * BLOCK + (j - 0.5) * 4.4;
              const mX = Math.max(0, 2.0 - w / 2); // footprint edge ≤ lotC ±2.0
              const mZ = Math.max(0, 2.0 - d / 2);
              x = THREE.MathUtils.clamp(x, lotCx - mX, lotCx + mX);
              z = THREE.MathUtils.clamp(z, lotCz - mZ, lotCz + mZ);
            }

            // pastel facade, blushing gently toward clay with height
            const t = THREE.MathUtils.clamp((h - 4) / 18, 0, 1);
            col.set(pickFacade()).lerp(CLAY_SOFT, t * 0.25);
            // per-building albedo jitter — never one flat value
            col.offsetHSL((rand() - 0.5) * 0.012, (rand() - 0.5) * 0.06, (rand() - 0.5) * 0.05);
            if (retailZone)
              // palette reweight (WP6): shell pink / apricot / faded lilac
              col.set(
                flagship
                  ? "#E8CFC8"
                  : ["#7FA8C9", "#E3B23C", "#D98C9C", "#5FA8A0", "#E8CFC8"][
                      (((i + j * 2 + bx + bz) % 5) + 5) % 5
                    ],
              );

            // ~12% of the low-rises are cylindrical (silhouette variety)
            // (branch rolls gate on hOrig so the stream never shifts)
            if (hOrig < 9 && rand() < 0.12 && !retailZone) {
              const cyl = new THREE.CylinderGeometry(w * 0.55, w * 0.55, h, 14);
              cyl.translate(x, h / 2, z);
              paintGraded(cyl, col);
              buildingGeos.push(cyl);
              colliders.push({ x, z, hw: w * 0.55, hd: w * 0.55, h });
              continue;
            }

            // podium base on some towers (street presence) — 1.1x so it
            // stays inside the plot (1.25x overhung the lot, founder img 31)
            if (hOrig > 9 && rand() < 0.5 && !retailZone) {
              const ph = 1.4;
              const podium = new RoundedBoxGeometry(w * 1.1, ph, d * 1.1, 2, 0.1);
              podium.translate(x, ph / 2, z);
              paintGraded(podium, col.clone().lerp(baseCream, 0.3), { aoBand: 0.7 });
              buildingGeos.push(podium);
            }

            const body = new RoundedBoxGeometry(w, h, d, 2, 0.14);
            body.translate(x, h / 2, z);
            paintGraded(body, col);
            // clearance collider: widest of body/podium footprint, +1.6 head-
            // room for rooftop furniture (AC/antenna) — generators own safety
            colliders.push({ x, z, hw: w * 0.7, hd: d * 0.7, h: h + 1.6 });
            buildingGeos.push(body);
            addWindows(x, z, w, h, d);

            if (retailZone) {
              /* WP6 storefront kit: split glazing, recessed door, fascia +
                 signboard, 3-type anchored awnings. Awning fronts sit at
                 |x|≈5.3 — 0.5 outside the corridor; the clearance CI (1.2u
                 at dolly height) is the binding gate and stays green. */
              const sxd = x > 0 ? -1 : 1; // toward the street
              const faceX = x + sxd * (w / 2 + 0.035);
              const rotG = sxd > 0 ? Math.PI / 2 : -Math.PI / 2;
              // three glaze panes with gaps + ink frame strip
              const paneW = w * 0.21;
              for (const po of [-1, 0, 1]) {
                const pane = new THREE.PlaneGeometry(paneW, flagship ? 1.5 : 1.1);
                pane.rotateY(rotG);
                pane.translate(faceX, flagship ? 1.15 : 0.95, z + po * (paneW + 0.07));
                retailLitGeos.push(pane);
              }
              const frame = new THREE.BoxGeometry(0.05, 0.08, w * 0.78);
              frame.translate(faceX - sxd * 0.01, flagship ? 1.95 : 1.55, z);
              paint(frame, dcolLot.set("#56524A"));
              buildingGeos.push(frame);
              // recessed door + jamb (every shop has an entrance now)
              const door = new THREE.PlaneGeometry(0.55, 1.2);
              door.rotateY(rotG);
              door.translate(x + sxd * (w / 2 - 0.04), 0.6, z + w * 0.33);
              paint(door, winDark);
              windowDarkGeos.push(door);
              const jamb = new THREE.BoxGeometry(0.07, 1.3, 0.75);
              jamb.translate(x + sxd * (w / 2 - 0.02), 0.65, z + w * 0.33);
              paint(jamb, dcolLot.set("#56524A"));
              buildingGeos.push(jamb);
              // fascia band + ink signboard with cream dashes
              const fascia = new THREE.BoxGeometry(0.1, 0.16, w * 0.9);
              fascia.translate(faceX + sxd * 0.02, 1.78, z);
              paint(fascia, dcolLot.copy(col).offsetHSL(0, 0, -0.08));
              buildingGeos.push(fascia);
              const sign = new THREE.BoxGeometry(0.06, 0.18, w * 0.7);
              sign.translate(faceX + sxd * 0.04, 2.08, z);
              paint(sign, dcolLot.set("#3D3A33"));
              buildingGeos.push(sign);
              if (flagship)
                for (const tz of [z - 1.2, z + 1.2]) {
                  const till = new THREE.BoxGeometry(0.26, 0.26, 0.26);
                  till.translate(faceX + sxd * 0.12, 2.3, tz);
                  retailLitGeos.push(till);
                }
              if (!marketPocket) {
                // anchored awning family — rear edge buried in the facade,
                // tilted about the WALL edge (never floats again)
                const kind = (((i + bz) % 3) + 3) % 3;
                const stripes = [
                  ["#C97E5E", "#F5EFE2"],
                  ["#A8B89A", "#F5EFE2"],
                  ["#9FB4C7", "#F5EFE2"],
                ][kind];
                const awY = Math.min(2.45, h - 0.5);
                if (kind === 1) {
                  // barrel half-cylinder
                  const aw = new THREE.CylinderGeometry(
                    0.5,
                    0.5,
                    w * 0.8,
                    8,
                    1,
                    false,
                    0,
                    Math.PI,
                  );
                  aw.rotateZ(Math.PI / 2);
                  aw.rotateY(sxd > 0 ? 0 : Math.PI);
                  aw.translate(x + sxd * (w / 2 + 0.06), awY, z);
                  paint(aw, dcolLot.set(stripes[0]));
                  buildingGeos.push(aw);
                } else {
                  // r2: thicker slab + front VALANCE lip so the edge-on view
                  // from the R-hold/T2 family still reads as a canopy (the
                  // 0.07 slab read as a detached diagonal plank); span inset
                  // to w*0.7 so nothing crosses the facade corner
                  const tilt = kind === 0 ? 0.26 : 0.08;
                  const aw = new THREE.BoxGeometry(0.58, 0.12, w * 0.7);
                  aw.translate(0.29, 0, 0); // pivot at the rear (wall) edge
                  aw.rotateZ(sxd * tilt);
                  if (sxd < 0) aw.rotateY(Math.PI);
                  aw.translate(x + sxd * (w / 2 - 0.02), awY, z);
                  paint(aw, dcolLot.set(stripes[0]));
                  buildingGeos.push(aw);
                  const lip = new THREE.BoxGeometry(0.05, 0.2, w * 0.7);
                  lip.translate(0.56, -0.07, 0); // hangs off the outer edge
                  lip.rotateZ(sxd * tilt);
                  if (sxd < 0) lip.rotateY(Math.PI);
                  lip.translate(x + sxd * (w / 2 - 0.02), awY, z);
                  paint(lip, dcolLot.set(stripes[0]).offsetHSL(0, 0, -0.06));
                  buildingGeos.push(lip);
                  // two slim TIE RODS — wall anchor above → buried in the
                  // slab's front edge, both ends terminating (the old rods
                  // poked past the facade corner into the sky)
                  for (const rz of [z - w * 0.27, z + w * 0.27]) {
                    const rod = new THREE.CylinderGeometry(0.022, 0.022, 0.62, 5);
                    rod.rotateZ(sxd * 1.03);
                    rod.translate(
                      x + sxd * (w / 2 + 0.265),
                      awY + (kind === 0 ? 0.34 : 0.25),
                      rz,
                    );
                    paint(rod, dcolLot.set("#8C867A"));
                    buildingGeos.push(rod);
                  }
                }
              }
            }

            if (hOrig > 9 && rand() < 0.6 && !retailZone) {
              const ch = 2 + rand() * 3;
              const crown = new RoundedBoxGeometry(w * 0.62, ch, d * 0.62, 2, 0.12);
              crown.translate(x, h + ch / 2 - 0.05, z);
              col.lerp(CLAY_SOFT, 0.15);
              paintGraded(crown, col, { aoBand: 0.5 });
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

            /* WP3 cornice + roof-cap law: every building >4 reads as a
               capped, trimmed mass instead of an extruded slab */
            if (high && h > 4) {
              const rr = roofs[roofs.length - 1];
              const cap = new THREE.PlaneGeometry(
                Math.max(0.5, rr.w - 0.25),
                Math.max(0.5, rr.d - 0.25),
              );
              cap.rotateX(-Math.PI / 2);
              cap.translate(rr.x, rr.topY + 0.012, rr.z);
              paint(cap, colCap.copy(col).lerp(roofCapCol, 0.6));
              buildingGeos.push(cap);
              const cor = new THREE.BoxGeometry(rr.w + 0.05, 0.13, rr.d + 0.05);
              cor.translate(rr.x, rr.topY + 0.058, rr.z);
              paint(cor, colCap.copy(col).offsetHSL(0, 0, -0.07));
              buildingGeos.push(cor);
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
      // The camera threads a TIGHT low corridor through the manufacturing
      // approach (A5→A6 west sprint at y≈4.4, |z|≈1.2) in BOTH quality modes.
      // Avenue lamps standing at z=±2.9 in that x-window sit ~1.1u from the
      // lens — under the 1.2u canyon radius. In high quality the lamp PHASE
      // (anchored at -range) happened to miss it; in low quality (different
      // range → different phase) one lands right on the path = the pre-existing
      // low-quality clearance bug. The MFG district is lit by its own dedicated
      // floodmasts, so the avenue lamps west of the hub are redundant there —
      // skip x-avenue lamps in the manufacturing approach window (both modes).
      const inMfgApproach = (lx: number, lz: number) =>
        Math.abs(lz) < 4 && lx <= -18; // x-avenue (z≈±2.9) west of the hub
      for (const [lx, lz, side] of [
        [s, 2.9, 1],
        [s, -2.9, -1],
        [2.9, s, 1],
        [-2.9, s, -1],
      ] as const) {
        if (inMfgApproach(lx, lz)) continue;
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
        // yaw such that the pool ellipse long axis (local +Z after rotateX
        // -90°) points along the arm's towardRoad direction
        lampYaws.push(Math.atan2(towardRoad[0], towardRoad[1]));
      }
    }

    /* WP2: civic-teal accents (#6FE3DC, STEADY, Smart Cities only — the one
       admitted cool family) + wet-street reflection streaks for the night */
    if (high) {
      const TEAL = new THREE.Color("#6FE3DC");
      // hub skirt underglow ring
      const skirt = new THREE.RingGeometry(1.78, 2.08, 40);
      skirt.rotateX(-Math.PI / 2);
      skirt.translate(0, 0.315, 0);
      paint(skirt, TEAL);
      scWindowGeos.push(skirt);
      // crosswalk studs across the four avenue mouths at the plaza rim
      for (const [ax2, az2, horiz] of [
        [12.2, 0, false],
        [-12.2, 0, false],
        [0, 12.2, true],
        [0, -12.2, true],
      ] as const) {
        for (let st = -2; st <= 2; st++) {
          const stud = new THREE.BoxGeometry(horiz ? 0.5 : 0.1, 0.035, horiz ? 0.1 : 0.5);
          stud.translate(ax2 + (horiz ? st * 0.95 : 0), 0.045, az2 + (horiz ? 0 : st * 0.95));
          paint(stud, TEAL);
          scWindowGeos.push(stud);
        }
      }
      // (the old per-lamp wet-street STREAK quads are gone — replaced by the
      //  instanced radial streetlight POOLS, spec §2: one shared CanvasTexture
      //  + one instancedMesh over ALL lampPositions, centered under each pole,
      //  ellipse along the arm, gated on night01, NON-blooming. Built in JSX
      //  via the `streetPoolTex` memo + `setupStreetPools` below.)
      const wetTeal = new THREE.Color("#4FBDB6");
      // two teal pools at the hub
      for (const [px2, pz2] of [
        [2.6, 1.2],
        [-2.2, -1.8],
      ] as const) {
        const g = new THREE.CircleGeometry(1.05, 14);
        g.rotateX(-Math.PI / 2);
        g.translate(px2, 0.02, pz2);
        const pos = g.attributes.position;
        const colArr = new Float32Array(pos.count * 3);
        const vc = new THREE.Color();
        for (let vi = 0; vi < pos.count; vi++) {
          vc.copy(wetTeal).multiplyScalar(vi === 0 ? 0.8 : 0.06);
          colArr[vi * 3] = vc.r;
          colArr[vi * 3 + 1] = vc.g;
          colArr[vi * 3 + 2] = vc.b;
        }
        g.setAttribute("color", new THREE.BufferAttribute(colArr, 3));
        g.deleteAttribute("uv");
        wetGeos.push(g);
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
        if (hh > 1.4) paintGraded(g, dcol.set(hex));
        else paint(g, dcol.set(hex));
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
        // (0.7: the hold's sightline grazed a 1.0 top — worker bodies were
        // occluded down to floating hats)
        dbox(buildingGeos, 18, 0.7, 0.45, hx, 0.35, -6.2, SAND);
        /* WP5 (polish R3): CLOSED sawtooth — right-triangle prisms seated
           flush on the wall top; glaze on the real vertical riser face;
           ridge beam per crest. No daylight under any roof. */
        for (let b = 0; b < 4; b++) {
          const x0 = hx - 6.75 + b * 4.5;
          dbox(buildingGeos, 4.5, 5.6, 0.45, x0, 2.8, -14.9, SAGE); // back wall
          const profile = new THREE.Shape();
          profile.moveTo(-2.25, 0);
          profile.lineTo(-2.25, 1.9); // vertical riser (clerestory face)
          profile.lineTo(2.25, 0); // slope down to the next tooth
          profile.closePath();
          const tooth = new THREE.ExtrudeGeometry(profile, {
            depth: 9.4,
            bevelEnabled: false,
          });
          tooth.translate(x0, 5.6, -15.2);
          paintGraded(tooth, dcol.set(b % 2 ? ROOFTOOTH : "#D8C4A0"), { aoBand: 0.5 });
          buildingGeos.push(tooth);
          const ridge = new THREE.BoxGeometry(0.14, 0.14, 9.4);
          ridge.translate(x0 - 2.25, 7.55, hz);
          paint(ridge, dcol.set(INKISH));
          buildingGeos.push(ridge);
          const glaze = new THREE.PlaneGeometry(9.0, 1.6);
          glaze.rotateY(-Math.PI / 2);
          glaze.translate(x0 - 2.27, 6.5, hz);
          paint(glaze, winLit);
          windowLitGeos.push(glaze);
        }
        dbox(buildingGeos, 0.45, 5.6, 9.4, hx - 9, 2.8, hz, SAND); // side walls
        dbox(buildingGeos, 0.45, 5.6, 9.4, hx + 9, 2.8, hz, SAND);
        colliders.push({ x: hx, z: hz, hw: 9.2, hd: 4.9, h: 8.2, label: "mfg-hallA" });
        // interior, visible over the parapet: conveyor + pallet boxes
        // (bed in quiet warm-grey so the clay glow strip owns the eye)
        dbox(buildingGeos, 13, 0.32, 1.25, hx - 0.5, 1.15, -8.4, "#6B665C");
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
        // far hall: closed block + roof monitor + WP5 facade articulation
        dbox(buildingGeos, 17, 6.8, 7.5, hx, 3.4, -20.2, OCHRE, 0, 0.12);
        dbox(buildingGeos, 12, 1.4, 3.2, hx, 7.4, -20.2, SAND, 0, 0.08);
        dbox(buildingGeos, 17.2, 0.28, 7.7, hx, 6.95, -20.2, "#CBC2AE"); // cornice
        dbox(buildingGeos, 17, 0.3, 0.1, hx, 5.4, -16.4, SAND); // string band
        for (let k = 0; k < 6; k++)
          dbox(buildingGeos, 0.12, 6.4, 0.16, hx - 7.5 + k * 3, 3.2, -16.42, "#D9C8A8"); // pilasters
        for (const dxk of [-5.4, 0, 5.4])
          dbox(buildingGeos, 1.6, 2.2, 0.12, hx + dxk, 1.1, -16.41, "#8FA6B2"); // roll-up dock doors
        colliders.push({ x: hx, z: -20.2, hw: 8.7, hd: 3.9, h: 9, label: "mfg-hallB" });
        for (let k = 0; k < 7; k++) {
          if (k % 3 === 1) continue; // doors live where these were
          const g = new THREE.PlaneGeometry(1.2, 1.5);
          g.translate(hx - 6 + k * 2, 4.1, -16.35);
          paint(g, winDark);
          windowDarkGeos.push(g);
        }
        // smokestacks: the factory's twin-stack silhouette (WP5) — moved to
        // punch through the roof field, companion stack beside
        const st = new THREE.CylinderGeometry(0.85, 1.05, 13.5, 12);
        st.translate(-30.5, 6.75, -21);
        paintGraded(st, dcol.set(ROSE), { aoBand: 2 });
        buildingGeos.push(st);
        const cap = new THREE.CylinderGeometry(1.0, 1.0, 0.5, 12);
        cap.translate(-30.5, 13.4, -21);
        paint(cap, dcol.set(INKISH));
        buildingGeos.push(cap);
        const st2 = new THREE.CylinderGeometry(0.45, 0.58, 10.5, 10);
        st2.translate(-26.6, 5.25, -19.6);
        paintGraded(st2, dcol.set("#C9A29A"), { aoBand: 1.5 });
        buildingGeos.push(st2);
        dbox(buildingGeos, 3.2, 0.5, 2.2, -28.6, 0.25, -20.4, "#CBC2AE", 0, 0.06); // shared plinth
        colliders.push({ x: -30.5, z: -21, hw: 1.1, hd: 1.1, h: 14, label: "stack" });
        colliders.push({ x: -26.6, z: -19.6, hw: 0.7, hd: 0.7, h: 11, label: "stack2" });
        // box trucks at the dock
        [-31.5, -27.8].forEach((tx, ti) => {
          const tlen = ti ? 3.05 : 2.6;
          const tyaw = ti ? -0.05 : 0.06;
          dbox(buildingGeos, 1.1, 1.15, tlen, tx, 0.78, -7.9, ti ? SAND : "#FFFFFF", tyaw, 0.06);
          if (ti) dbox(buildingGeos, 1.12, 0.16, tlen * 0.9, tx, 0.92, -7.9, "#D97757", tyaw); // clay side stripe
          dbox(buildingGeos, 1.05, 0.8, 0.9, tx, 0.6, -9.6, INKISH, tyaw, 0.08);
          for (const [wx2, wz2] of [[-0.45, -8.9], [0.45, -8.9], [-0.45, -7.0], [0.45, -7.0]] as const)
            dbox(buildingGeos, 0.32, 0.45, 0.32, tx + wx2, 0.22, wz2, INKISH, tyaw);
        });
        // gantry sky-bridge across the x-avenue (deck underside y=7.2 —
        // the dive's signature fly-under; deck is NOT a ground collider,
        // its clearance has a dedicated assertion)
        for (const gz of [-5.6, 5.6]) {
          dbox(buildingGeos, 0.55, 7.2, 0.55, -30, 3.6, gz, "#C3CCC9");
          colliders.push({ x: -30, z: gz, hw: 0.35, hd: 0.35, h: 7.8, label: "gantry-leg" });
        }
        dbox(buildingGeos, 2.6, 0.5, 14.0, -30, 7.45, 0, INKISH); // deck — south end buries into the sawtooth roof (R5)
        // headhouse at the yard end: the bridge finally GOES somewhere
        dbox(buildingGeos, 1.4, 8.2, 1.4, -29.3, 4.1, 6.9, SAND);
        dbox(buildingGeos, 2.0, 0.9, 2.0, -29.3, 8.0, 6.9, INKISH);
        colliders.push({ x: -29.3, z: 6.9, hw: 0.8, hd: 0.8, h: 8.6, label: "headhouse" });
        for (const rx of [-1.25, 1.25])
          dbox(buildingGeos, 0.06, 0.18, 13.8, -30 + rx, 7.8, 0, "#C3CCC9"); // handrails
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
          for (let l = 0; l < levels; l++) {
            // WP10 (R7): saturated cargo quartet, drand-indexed, jittered —
            // freight finally reads as freight
            const chex = ["#5F8E8B", "#D9A441", "#6E7FA0", "#E8E4D8"][Math.floor(drand() * 4)];
            const cyaw = (drand() - 0.5) * 0.06;
            const cx3 = sx2 + (drand() - 0.5) * 0.3;
            const cz3 = sz2 + (drand() - 0.5) * 0.3;
            dbox(buildingGeos, 3.6, 0.95, 1.3, cx3, 0.5 + l * 1.0, cz3, chex, cyaw, 0.05);
            dbox(buildingGeos, 0.07, 0.82, 1.18, cx3 + 1.81, 0.5 + l * 1.0, cz3, "#3D3A33", cyaw); // door end
          }
          colliders.push({
            x: sx2,
            z: sz2,
            hw: 2.0,
            hd: 0.95,
            h: 0.5 + levels * 1.0 + 0.5, // ≤ 3.0 — pocket cap intact
            label: "container",
          });
        }

      /* ---- WP10: yard floor, perimeter fence, floodlights ---- */
      {
        for (const lz of [8.5, 12.6, 16.7, 20.8])
          dbox(buildingGeos, 19, 0.02, 0.25, -36.5, 0.018, lz, "#F5EFE2"); // lane stripes
        // post-and-rail perimeter with an avenue gate + clay swing bar
        const fence = (fx: number, fz: number, horiz: boolean, len: number) => {
          for (let fp = 0; fp <= len; fp += 2.4)
            dbox(
              buildingGeos,
              0.09,
              0.85,
              0.09,
              horiz ? fx + fp : fx,
              0.43,
              horiz ? fz : fz + fp,
              TRUNK,
            );
          for (const ry2 of [0.32, 0.68])
            dbox(
              buildingGeos,
              horiz ? len : 0.05,
              0.05,
              horiz ? 0.05 : len,
              horiz ? fx + len / 2 : fx,
              0.85 * ry2,
              horiz ? fz : fz + len / 2,
              TRUNK,
            );
        };
        fence(-46.5, 6.2, true, 9.5); // north-west run
        fence(-32.5, 6.2, true, 5.5); // north-east run (4u gate gap at -37..-32.5)
        fence(-46.5, 6.2, false, 17);
        fence(-46.5, 23.2, true, 19.5);
        fence(-27, 6.2, false, 17);
        dbox(buildingGeos, 3.8, 0.1, 0.08, -34.8, 0.7, 6.2, "#D97757"); // swing-gate bar (static clay albedo)
        for (const fz of [6.0, 20.8]) {
          dbox(buildingGeos, 0.18, 7.5, 0.18, -47.5, 3.75, fz, TRUNK); // floodlight masts
          dbox(buildingGeos, 1.4, 0.22, 0.3, -47.5, 7.4, fz, "#8C867A");
          for (const hx2 of [-0.45, 0, 0.45]) {
            const fl = new THREE.BoxGeometry(0.26, 0.12, 0.26);
            fl.translate(-47.5 + hx2, 7.28, fz);
            mfgGlowGeos.push(fl);
          }
          colliders.push({ x: -47.5, z: fz, hw: 0.8, hd: 0.3, h: 7.8, label: "floodmast" });
        }
      }

      /* ---- WP11.3: the CONTROL TOWER — the only mass breaking the fog
         line; the SC-hold's upper-left counterweight, clay-tipped ---- */
      {
        dbox(buildingGeos, 4.2, 10, 4.2, -13.5, 5, -15.5, "#C3CCC9", 0, 0.1);
        dbox(buildingGeos, 3.0, 8, 3.0, -13.5, 14, -15.5, "#CDD4D0", 0, 0.08);
        dbox(buildingGeos, 2.0, 6, 2.0, -13.5, 21, -15.5, "#C3CCC9", 0, 0.06);
        const obs = new THREE.TorusGeometry(1.7, 0.12, 8, 24);
        obs.rotateX(Math.PI / 2);
        obs.translate(-13.5, 22.5, -15.5);
        paint(obs, dcol.set("#56524A"));
        buildingGeos.push(obs);
        const ant = new THREE.CylinderGeometry(0.05, 0.08, 3.5, 6);
        ant.translate(-13.5, 25.75, -15.5);
        paint(ant, dcol.set("#D97757")); // clay tip — finale ember N
        buildingGeos.push(ant);
        colliders.push({ x: -13.5, z: -15.5, hw: 2.2, hd: 2.2, h: 27.6, label: "control-tower" });
      }

      /* ---- WP11.4: T3 banner pole — announces the turn to the gates ---- */
      {
        dbox(buildingGeos, 0.12, 5, 0.12, 29, 2.5, -6.5, TRUNK);
        for (let fb = 0; fb < 3; fb++) {
          const flag = new THREE.PlaneGeometry(1.1, 0.5);
          flag.translate(29.6, 4.4 - fb * 0.75, -6.5);
          paint(flag, dcol.set(["#D97757", "#A8B89A", "#E5B864"][fb]));
          buildingGeos.push(flag);
        }
      }

      /* ---- EVENTS — east arm festival ground (§1.4) ---- */
      {
        const pad = new RoundedBoxGeometry(17, 0.14, 16, 2, 0.05);
        pad.translate(37, 0.07, -14.5);
        paint(pad, dcol.set("#D8DCC4")); // festival green
        buildingGeos.push(pad);
        // WP9 proscenium stage: deck, double backdrop, wings, canopy on a
        // TRUNK truss (no more pink sticks), PA stacks, footlights, performer
        dbox(buildingGeos, 6.2, 1.1, 4.6, 43, 0.55, -18, INKISH, 0, 0.06);
        dbox(buildingGeos, 7.5, 4.6, 0.3, 43, 2.5, -20.6, "#3D3A33"); // ink back
        dbox(buildingGeos, 7.1, 4.2, 0.12, 43, 2.4, -20.38, ROSE); // rose inner
        for (let rb = 0; rb < 5; rb++)
          dbox(buildingGeos, 0.1, 4.0, 0.06, 40.2 + rb * 1.4, 2.4, -20.3, "#C9A29A"); // ribs
        dbox(buildingGeos, 2.6, 3.8, 0.3, 39.2, 1.9, -19.2, ROSE, 0.61); // wings
        dbox(buildingGeos, 2.6, 3.8, 0.3, 46.8, 1.9, -19.2, ROSE, -0.61);
        dbox(buildingGeos, 7.0, 0.35, 3.2, 43, 5.0, -18.8, INKISH); // canopy
        for (const px of [40.4, 45.6]) {
          dbox(buildingGeos, 0.4, 4.6, 0.4, px, 2.3, -18.6, TRUNK);
          dbox(buildingGeos, 0.08, 3.6, 0.08, px + 0.7, 2.1, -18.6, TRUNK, 0.5); // X brace
          dbox(buildingGeos, 0.08, 3.6, 0.08, px - 0.7, 2.1, -18.6, TRUNK, -0.5);
          colliders.push({ x: px, z: -18.6, hw: 0.3, hd: 0.3, h: 5.4, label: "truss" });
        }
        dbox(buildingGeos, 5.6, 0.3, 0.35, 43, 4.55, -18.6, TRUNK); // truss beam
        // PA stacks on plinths + emissive indicator dots
        for (const px of [39.2, 46.8]) {
          dbox(buildingGeos, 1.1, 0.5, 1.1, px, 0.25, -17.2, "#CBC2AE");
          dbox(buildingGeos, 0.9, 2.2, 0.9, px, 1.6, -17.2, "#3D3A33", 0, 0.05);
          const pdot = new THREE.BoxGeometry(0.12, 0.12, 0.12);
          pdot.translate(px, 2.5, -16.78);
          paint(pdot, dcol.set("#FFE2B8"));
          eventsLitGeos.push(pdot);
        }
        // footlight strip at the deck lip
        const foot = new THREE.BoxGeometry(5.8, 0.1, 0.14);
        foot.translate(43, 1.16, -15.75);
        paint(foot, dcol.set("#FFE2B8"));
        eventsLitGeos.push(foot);
        // performer + mic stand
        {
          const perf = new THREE.CapsuleGeometry(0.16, 0.42, 4, 8);
          perf.translate(43, 1.55, -17.4);
          paint(perf, dcol.set("#3D3A33"));
          buildingGeos.push(perf);
          dbox(buildingGeos, 0.04, 0.9, 0.04, 43.4, 1.55, -17.1, TRUNK);
        }
        // stage backdrop top-rim: a warm lit edge that separates the rose
        // backdrop from the night sky (plan §7). Tiny strip → eventsLit (free)
        {
          const rim = new THREE.BoxGeometry(6.8, 0.06, 0.08);
          rim.translate(43, 4.3, -20.3);
          paint(rim, dcol.set("#FFB5A0"));
          eventsLitGeos.push(rim);
        }
        // backdrop-mass accent (QA r2 soft): the stage backdrop + canopy mass
        // (#3D3A33/INKISH, top-center) is the only large dark patch in the hero
        // night frame. Lace its front edges with warm festival bulbs so the
        // big block reads as a LIT proscenium rather than a black wall. All
        // tiny dots → free eventsLit instances (no new draw call).
        {
          // a bulb row along the canopy FRONT lip (the top edge of the mass)
          for (let cb = 0; cb < 11; cb++) {
            const cbulb = new THREE.BoxGeometry(0.08, 0.08, 0.08);
            cbulb.translate(39.6 + cb * 0.68, 5.2, -17.3);
            paint(cbulb, dcol.set(cb % 3 === 1 ? "#FFB5A0" : "#FFE2B8"));
            eventsLitGeos.push(cbulb);
          }
          // two vertical bulb festoons framing the rose backdrop (left/right
          // edges of the dark ink panel) — they outline the mass against night
          for (const fx of [39.7, 46.3]) {
            for (let vb = 0; vb < 5; vb++) {
              const vbulb = new THREE.BoxGeometry(0.075, 0.075, 0.075);
              vbulb.translate(fx, 1.4 + vb * 0.78, -20.15);
              paint(vbulb, dcol.set("#FFD9A0"));
              eventsLitGeos.push(vbulb);
            }
          }
          // a soft warm sheen bar low across the rose inner panel so the
          // backdrop face itself catches light (not just its outline)
          const sheen = new THREE.BoxGeometry(6.6, 0.5, 0.04);
          sheen.translate(43, 1.45, -20.32);
          paint(sheen, dcol.set("#7A4A42"));
          eventsLitGeos.push(sheen);
        }
        /* additive ground decal helper (spec §1/§4): a flat fan, hot core
           → black at the rim with a ^1.6 falloff. Lives in the wet bucket
           (additive, fog:false, night01-gated). Vertex-colored, uv-free. */
        const wblack = new THREE.Color("#000000");
        const groundDecal = (
          cx: number,
          cz: number,
          radius: number,
          coreHex: string,
          peak = 1,
          segs = 28,
        ) => {
          const g = new THREE.CircleGeometry(radius, segs);
          g.rotateX(-Math.PI / 2);
          g.translate(cx, 0.02, cz);
          const pos = g.attributes.position;
          const colArr = new Float32Array(pos.count * 3);
          const core = new THREE.Color(coreHex);
          const vc = new THREE.Color();
          for (let vi = 0; vi < pos.count; vi++) {
            // CircleGeometry: vertex 0 is the center, the rest ring the rim
            const r =
              Math.hypot(pos.getX(vi) - cx, pos.getZ(vi) - cz) / radius;
            const a = Math.pow(1 - Math.min(1, r), 1.6) * peak;
            vc.copy(core).lerp(wblack, 1 - a);
            colArr[vi * 3] = vc.r;
            colArr[vi * 3 + 1] = vc.g;
            colArr[vi * 3 + 2] = vc.b;
          }
          g.setAttribute("color", new THREE.BufferAttribute(colArr, 3));
          g.deleteAttribute("uv");
          wetGeos.push(g);
        };

        // crossed stage beams (additive, ride the night gate via wet bucket)
        // — hot saturated cores (§0.9): rose #FFC8B0 / violet #C0A8FF. Each
        // beam DROPS a matching ground-wash decal at its landing footprint so
        // the beam visibly LANDS (the #1 festival aliveness win, §4.2).
        for (const [byaw, bhex] of [
          [0.5, "#FFC8B0"],
          [-0.55, "#C0A8FF"],
        ] as const) {
          const beam = new THREE.BufferGeometry();
          const apex = new THREE.Vector3(43, 4.6, -18.4);
          const dirL = new THREE.Vector3(Math.sin(byaw) * 7, 6.5, Math.cos(byaw) * 5);
          const a3 = apex.clone();
          const b3 = apex.clone().add(dirL).add(new THREE.Vector3(-1.4, 0, 0.8));
          const c3 = apex.clone().add(dirL).add(new THREE.Vector3(1.4, 0, -0.8));
          beam.setFromPoints([a3, b3, c3]);
          beam.computeVertexNormals();
          const bcol = new THREE.Color(bhex);
          const barr = new Float32Array(9);
          for (let vi = 0; vi < 3; vi++) {
            const fade = vi === 0 ? 0.6 : 0.0;
            barr[vi * 3] = bcol.r * fade;
            barr[vi * 3 + 1] = bcol.g * fade;
            barr[vi * 3 + 2] = bcol.b * fade;
          }
          beam.setAttribute("color", new THREE.BufferAttribute(barr, 3));
          wetGeos.push(beam); // (uv-free, like every wet geo)
          // landing footprint = apex + dirL projected to the deck/ground
          groundDecal(apex.x + dirL.x, apex.z + dirL.z, 4, bhex, 0.9);
        }
        // crowd-glow / string-pool: warm uplift over the verified kind:5
        // crowd centroid (~39.2,-18.0; spec §0.13/§4.6) — "warm uplight from
        // stage + strings," sized to the visible crowd footprint
        groundDecal(39.5, -17.5, 6.5, "#F0A868", 0.45, 36);
        // ferris-base decal (§0.12): the wheel reads as CASTING, not just
        // glowing — warm coin under the wheel footing
        groundDecal(45.5, -13.0, 7, "#FFDEBC", 0.5, 36);
        // PA-stack floor wash (plan §7): the two PA stacks throw light down,
        // anchoring the stage corners so the deck lip doesn't float dark.
        // Nudge the wash 0.7u SOUTH of the stack (stacks sit at z=-17.2) so the
        // decal's hot CORE lands on open ground in front of the post instead of
        // being eclipsed by the opaque plinth base — the cast now reads.
        groundDecal(39.2, -16.1, 2.0, "#FFE2B8", 0.4, 20);
        groundDecal(46.8, -16.1, 2.0, "#FFE2B8", 0.4, 20);
        // ---- GROUND LANE WASH (plan §1): the #1 dark fix. The crowd lanes
        // run gates(z -8.2) → stage(z -18) between the 4 barrier ribbons.
        // Warm coins down the 3 lane mid-lines literally make the floor glow.
        // Low peak + small radius keeps them CAST (sub-bloom, never a sheet).
        for (const lnx of [32.9, 36.3, 39.7])
          for (const lnz of [-9.6, -11.6, -13.6, -15.4])
            groundDecal(lnx, lnz, 1.1, "#FFD9A0", 0.35, 16);
        colliders.push({ x: 43, z: -19, hw: 3.9, hd: 1.8, h: 6.6, label: "stage" });
        // WP11.1 ferris wheel footing (the wheel itself is a rotating JSX
        // group) — A-frame legs + hub pylon are static masses
        // (r2: wheel pushed DEEP into the festival bowl behind the gate
        // line + hub lowered to 4.6 + the E-family look targets raised/
        // biased east — at 44/-7.4 the disc bisected the right frame edge
        // at every Events beat; at 45.5/-13 the full 9u disc lands inside
        // the 0.72–0.86 frusta)
        // (the visible A-frame support is built in the wheel's LOCAL frame
        // as JSX — see ferrisSupport — so it always meets the yawed axle;
        // the old world-space posts never connected to the hub)
        colliders.push({ x: 45.5, z: -13.0, hw: 4.5, hd: 1.0, h: 9.0, label: "ferris" });
        // the gate camera's GROUND POLE (founder: "still slightly levitating")
        dbox(buildingGeos, 0.18, 4.1, 0.18, 41.8, 2.05, -8.4, CREAM300);
        dbox(buildingGeos, 0.5, 0.12, 0.5, 41.8, 0.06, -8.4, "#CBC2AE"); // base
        // r3: gate-3 boom-barrier HINGE POST + curb foot (merged, 0 new draws)
        // — at rest the swing bar read as a stray clay plank on bare deck;
        // the post anchors it to a real gate mount at its pivot (38.25,-8.2)
        dbox(buildingGeos, 0.22, 0.95, 0.22, 38.25, 0.475, -8.2, "#CDC7B6");
        dbox(buildingGeos, 0.62, 0.12, 0.62, 38.25, 0.06, -8.2, "#C2BAA6"); // curb foot
        colliders.push({ x: 41.8, z: -8.4, hw: 0.3, hd: 0.3, h: 4.6, label: "campole" });

        /* ---- FESTIVAL KIT (founder: "make it look like a proper event") ---- */
        // striped pavilion tents, flanking the gate run
        for (const [tx2, tz2, tr] of [
          [29.8, -8.8, 1.7],
          // tent 2 moved west of the gate run (r2) — its old (43,-9.7) seat
          // is on the ferris wheel's new sight-line
          [30.6, -13.8, 1.5],
        ] as const) {
          const wall = new THREE.CylinderGeometry(tr * 0.92, tr, 1.5, 12);
          wall.translate(tx2, 0.75, tz2);
          // vertical stripes via per-vertex angle
          {
            const wpos = wall.attributes.position;
            const wcol = new Float32Array(wpos.count * 3);
            const c1 = new THREE.Color("#E8826B");
            const c2 = new THREE.Color("#F5EFE2");
            const wc = new THREE.Color();
            for (let vi = 0; vi < wpos.count; vi++) {
              const ang = Math.atan2(wpos.getZ(vi) - 0, wpos.getX(vi) - 0);
              wc.copy(Math.floor(((ang + Math.PI) / (Math.PI * 2)) * 12) % 2 ? c1 : c2);
              wcol[vi * 3] = wc.r;
              wcol[vi * 3 + 1] = wc.g;
              wcol[vi * 3 + 2] = wc.b;
            }
            wall.setAttribute("color", new THREE.BufferAttribute(wcol, 3));
          }
          buildingGeos.push(wall);
          const roof = new THREE.ConeGeometry(tr * 1.18, 1.3, 12);
          roof.translate(tx2, 2.15, tz2);
          paint(roof, dcol.set("#D98C9C"));
          buildingGeos.push(roof);
          const fin = new THREE.SphereGeometry(0.09, 8, 6);
          fin.translate(tx2, 2.86, tz2);
          paint(fin, dcol.set("#E5B864"));
          buildingGeos.push(fin);
          // lit finial topper (plan §6): tents are dead at night — a tiny amber
          // sparkle at each apex gives them a festive crown. Free eventsLit dot.
          const fintop = new THREE.BoxGeometry(0.07, 0.07, 0.07);
          fintop.translate(tx2, 2.95, tz2);
          paint(fintop, dcol.set("#FFD9A0"));
          eventsLitGeos.push(fintop);
          colliders.push({ x: tx2, z: tz2, hw: tr + 0.2, hd: tr + 0.2, h: 3.0, label: "tent" });
        }
        // balloon clusters on the gate posts + stalls (festival color!)
        const BALLOONS = ["#E8826B", "#7FA8C9", "#E3B23C", "#93B17C", "#D98C9C"];
        // cluster bases: gate posts touch the lintels at 3.6; the stall and
        // tent clusters rest ON their roof apexes (stall cone apex ≈2.32,
        // tent finial ≈2.95) — they floated 0.5–1.3u in empty air before
        for (const [bx3, bz3, bbase] of [
          [31.4, -8.2, 3.6],
          [41.0, -8.2, 3.6],
          [29.4, -10.5, 2.45],
          [29.4, -15.6, 2.45],
          [43.0, -9.7, 2.95],
        ] as const)
          for (let bb = 0; bb < 4; bb++) {
            const bl = new THREE.SphereGeometry(0.16 + drand() * 0.07, 8, 6);
            bl.scale(1, 1.18, 1);
            bl.translate(
              bx3 + (drand() - 0.5) * 0.5,
              bbase + drand() * 0.7,
              bz3 + (drand() - 0.5) * 0.5,
            );
            paint(bl, dcol.set(BALLOONS[Math.floor(drand() * 5)]));
            buildingGeos.push(bl);
          }
        // accent glints among the balloon clusters (plan §6): a single mint and
        // a single lilac sparkle for color variety — kept to 2 total to respect
        // the ≤1-in-5 accent ratio so the warm festival family still dominates
        for (const [ax3, ay3, az3, ahex] of [
          [41.0, 4.5, -8.2, "#BFEAD8"],
          [43.0, 3.85, -9.7, "#D8C8FF"],
        ] as const) {
          const glint = new THREE.BoxGeometry(0.07, 0.07, 0.07);
          glint.translate(ax3, ay3, az3);
          paint(glint, dcol.set(ahex));
          eventsLitGeos.push(glint);
        }
        // bunting between the gate lintels — triangle flags
        for (let bf = 0; bf < 16; bf++) {
          const bt = bf / 15;
          const bxp = 31.4 + bt * 9.6;
          const byp = 3.7 - Math.sin(Math.PI * bt) * 0.45;
          const flag2 = new THREE.BufferGeometry();
          flag2.setFromPoints([
            new THREE.Vector3(bxp - 0.12, byp, -8.05),
            new THREE.Vector3(bxp + 0.12, byp, -8.05),
            new THREE.Vector3(bxp, byp - 0.3, -8.05),
          ]);
          flag2.computeVertexNormals();
          flag2.setAttribute("uv", new THREE.BufferAttribute(new Float32Array(6), 2)); // merge parity
          paint(flag2, dcol.set(BALLOONS[bf % 5]));
          buildingGeos.push(flag2);
        }
        // ---- ENTRY FESTOON (plan §3): a bulb festoon riding the SAME catenary
        // as the bunting so the entry avenue reads as the grand lit marquee —
        // the single most "festival" gesture for the hero gate shot. Free dots.
        for (let fb = 0; fb < 14; fb++) {
          const ft = fb / 13;
          const fbx = 31.4 + ft * 9.6;
          const fby = 3.7 - Math.sin(Math.PI * ft) * 0.45;
          const fbulb = new THREE.BoxGeometry(0.085, 0.085, 0.085);
          fbulb.translate(fbx, fby - 0.12, -8.15);
          paint(fbulb, dcol.set(["#FFE2B8", "#FFD9A0", "#FFE2B8", "#FFB5A0"][fb % 4]));
          eventsLitGeos.push(fbulb);
        }
        // the lit ENTRY sign over the centre gate (bulb-bordered)
        dbox(buildingGeos, 3.4, 0.55, 0.16, 36.2, 4.1, -8.2, "#D97757");
        for (let sb = 0; sb < 9; sb++) {
          const bulb = new THREE.BoxGeometry(0.09, 0.09, 0.09);
          bulb.translate(34.9 + sb * 0.33, 4.46, -8.2);
          paint(bulb, dcol.set("#FFE2B8"));
          eventsLitGeos.push(bulb);
        }
        // three gate arches fronting the avenue (the crowd streams out of
        // downtown INTO the ground); the clay payoff hinge is wired in P4
        for (let g = 0; g < 3; g++) {
          const gx = 32.8 + g * 3.4;
          for (const s of [-1.35, 1.35]) {
            dbox(buildingGeos, 0.36, 3.1, 0.36, gx + s, 1.55, -8.2, [ROSE, LILAC][g % 2]);
            // marquee bulb border up each post (plan §4): rides the CAPPED
            // gateGlow material (NOT eventsLit) so the gates read as lit
            // portals without blooming hot this close to the gate camera
            for (const gby of [1.0, 1.7, 2.4, 3.0]) {
              const gb = new THREE.BoxGeometry(0.07, 0.07, 0.07);
              gb.translate(gx + s, gby, -8.05);
              paint(gb, dcol.set("#FFE2B8"));
              gateGlowGeos.push(gb);
            }
          }
          dbox(buildingGeos, 3.1, 0.4, 0.42, gx, 3.3, -8.2, SAND);
          {
            const cap2 = new THREE.BoxGeometry(2.9, 0.07, 0.1);
            cap2.translate(gx, 3.54, -8.0);
            paint(cap2, dcol.set("#FFE2B8"));
            gateGlowGeos.push(cap2); // lit lintel caps — festive, capped glow
          }
          colliders.push({ x: gx, z: -8.2, hw: 1.7, hd: 0.3, h: 3.7, label: "gate" });
        }
        // tiered stand facing the stage
        for (let s2 = 0; s2 < 3; s2++) {
          const th2 = 0.55 + s2 * 0.42; // full-height tiers — no gaps (WP7)
          dbox(
            buildingGeos,
            1.3,
            th2,
            7.5,
            30.2 + s2 * 1.05,
            th2 / 2,
            -16.5,
            [SAND, OCHRE, SAND][s2],
          );
          // step-nosing safety light per tier front edge (plan §9): a thin lit
          // lip on the stage-facing front of each riser — free eventsLit strip
          const nose = new THREE.BoxGeometry(1.3, 0.05, 0.1);
          nose.translate(30.2 + s2 * 1.05, th2, -12.75);
          paint(nose, dcol.set("#FFD9A0"));
          eventsLitGeos.push(nose);
        }
        colliders.push({ x: 31.3, z: -16.5, hw: 1.9, hd: 3.9, h: 1.9, label: "stand" });
        // barrier ribbons: three lanes, gates → stage
        for (let lane2 = 0; lane2 < 4; lane2++)
          dbox(buildingGeos, 0.16, 0.5, 6.5, 31.2 + lane2 * 3.4, 0.27, -12.2, CREAM300);
        // ---- BOLLARD LANE LIGHTS (plan §2): short unlit posts with a small
        // lit cap, one runway of amber lamps per lane mid-line guiding the eye
        // gates→stage. Posts → buildingGeos (unlit), caps → eventsLitGeos (free,
        // twinkles + night-gated). Sits over the lane wash coins above.
        for (const blx of [32.9, 36.3, 39.7])
          for (const blz of [-9.6, -11.6, -13.6, -15.4]) {
            dbox(buildingGeos, 0.08, 0.5, 0.08, blx, 0.25, blz, TRUNK);
            const cap = new THREE.BoxGeometry(0.1, 0.1, 0.1);
            cap.translate(blx, 0.55, blz);
            paint(cap, dcol.set("#FFD9A0"));
            eventsLitGeos.push(cap);
          }
        // string lights: posts + sagging butter dot chains (own emissive
        // mesh — they ignite one-by-one through T3, independent of windows)
        const lp3 = (x3: number, y3: number, z3: number) => new THREE.Vector3(x3, y3, z3);
        const posts: [number, number][] = [
          [33.5, -12.5],
          [39, -11.5],
          [44, -13.5],
          [36.5, -16.5],
        ];
        for (const [px, pz] of posts) dbox(buildingGeos, 0.14, 3.4, 0.14, px, 1.7, pz, TRUNK);
        // WP9.6 food stalls — the string lights hop between them
        const stallTops: THREE.Vector3[] = [];
        (
          [
            [29.4, -10.5],
            [29.4, -12.2],
            [29.4, -13.9],
            [29.4, -15.6],
          ] as const
        ).forEach(([sx3, sz3], si) => {
          dbox(buildingGeos, 1.0, 0.75, 1.0, sx3, 0.4, sz3, si % 2 ? "#F5EFE2" : "#D97757");
          for (const [cx2, cz2] of [
            [-0.42, -0.42],
            [0.42, -0.42],
            [-0.42, 0.42],
            [0.42, 0.42],
          ] as const)
            dbox(buildingGeos, 0.06, 1.9, 0.06, sx3 + cx2, 0.95, sz3 + cz2, TRUNK);
          const cone = new THREE.ConeGeometry(0.85, 0.55, 4);
          cone.translate(sx3, 2.05, sz3);
          paint(cone, dcol.set(si % 2 ? "#D97757" : "#E5B864"));
          buildingGeos.push(cone);
          stallTops.push(lp3(sx3, 2.1, sz3));
          // under-canopy service light + counter spill (plan §5): the west edge
          // is the darkest strip — a peach service bulb under each canopy plus a
          // ground pool in front makes the whole food row come alive at night
          const svc = new THREE.BoxGeometry(0.14, 0.14, 0.14);
          svc.translate(sx3, 1.55, sz3);
          paint(svc, dcol.set("#FFB5A0"));
          eventsLitGeos.push(svc);
          groundDecal(sx3, sz3, 1.4, "#FFB5A0", 0.4, 16);
        });
        /* WP9.1 (R4): catenary WIRE as chained thin boxes — lights hang from
           something real now; stage spans retarget to the truss posts */
        const spans3: [THREE.Vector3, THREE.Vector3][] = [
          [lp3(33.5, 3.4, -12.5), lp3(39, 3.4, -11.5)],
          [lp3(39, 3.4, -11.5), lp3(44, 3.4, -13.5)],
          [lp3(44, 3.4, -13.5), lp3(45.6, 4.5, -18.6)],
          [lp3(33.5, 3.4, -12.5), lp3(36.5, 3.4, -16.5)],
          [lp3(36.5, 3.4, -16.5), lp3(40.4, 4.5, -18.6)],
          [stallTops[0], lp3(33.5, 3.4, -12.5)],
          [stallTops[1], stallTops[0]],
          [stallTops[2], stallTops[1]],
          [stallTops[3], stallTops[2]],
          // the festival CANOPY: crisscross spans over the whole ground
          [lp3(31.4, 3.6, -8.3), lp3(36.5, 3.4, -16.5)],
          [lp3(41.0, 3.6, -8.3), lp3(33.5, 3.4, -12.5)],
          [lp3(36.2, 3.9, -8.3), lp3(44, 3.4, -13.5)],
          [lp3(29.8, 2.9, -8.8), lp3(33.5, 3.4, -12.5)],
          [lp3(43.0, 2.9, -9.7), lp3(44, 3.4, -13.5)],
          // WEST-VOID FILL (plan §8): the stalls/tents half read as voids — add
          // cross-ground spans so every pair of poles/tents/stalls is connected.
          // Each span auto-generates wire + 13 twinkle dots into eventsLit (free).
          [lp3(30.6, 2.9, -13.8), lp3(39, 3.4, -11.5)], // tent2 → post, crosses centre void
          [lp3(29.8, 2.9, -8.8), lp3(41.0, 3.6, -8.3)], // tent1 → gate post, high entry span
          [lp3(44, 3.4, -13.5), lp3(30.6, 2.9, -13.8)], // full-width mid span (biggest gap)
          [stallTops[3], lp3(36.5, 3.4, -16.5)], // food row → stage-left post
          [lp3(33.5, 3.4, -12.5), lp3(44, 3.4, -13.5)], // long diagonal for density
        ];
        const quartet = ["#FFE2B8", "#FFB5A0", "#BFEAD8", "#D8C8FF"]; // lantern tints
        const zAxis = new THREE.Vector3(0, 0, 1);
        const segQ = new THREE.Quaternion();
        const segDir = new THREE.Vector3();
        spans3.forEach(([A3, B3]) => {
          const NS = 14;
          let prev: THREE.Vector3 | null = null;
          for (let k = 0; k <= NS; k++) {
            const tt = k / NS;
            const pt = A3.clone().lerp(B3, tt);
            pt.y -= Math.sin(Math.PI * tt) * 0.7;
            if (prev) {
              // mid-warm grey, 0.04 thick — subliminal by day but the
              // catenary reads as a physical wire at night (TRUNK at 0.025
              // vanished and the lanterns hung as dotted arcs in mid-air)
              const wire = new THREE.BoxGeometry(0.04, 0.04, prev.distanceTo(pt));
              segDir.copy(pt).sub(prev).normalize();
              segQ.setFromUnitVectors(zAxis, segDir);
              wire.applyQuaternion(segQ);
              wire.translate((prev.x + pt.x) / 2, (prev.y + pt.y) / 2, (prev.z + pt.z) / 2);
              paint(wire, dcol.set("#8A8273"));
              buildingGeos.push(wire);
            }
            if (k > 0 && k < NS) {
              const dot = new THREE.BoxGeometry(0.085, 0.085, 0.085);
              dot.translate(pt.x, pt.y - 0.06, pt.z);
              paint(dot, dcol.set(quartet[k % 4]));
              eventsLitGeos.push(dot);
            }
            prev = pt;
          }
        });
      }

      /* district CCTV re-seats (hall parapets + gate + stage truss) —
         forced into the constellation via sort height; slice keeps 30 total */
      (
        [
          [-46, 5.98, -10.5],
          [-28, 5.98, -10.5],
          [-37, 7.18, -15.8],
          // gate cam: lens cantilevered SW (forward, toward the festival)
          // OFF the pole at (41.8,-8.4) so the body sits over the pole and
          // the lens sticks OUT front (founder: blinking part was in the pole)
          [41.4, 4.35, -8.28],
          [43, 5.08, -18.55],
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
      const jx = (rand() - 0.5) * 1.2;
      const jz = (rand() - 0.5) * 1.2;
      const pos = c.pos
        .clone()
        .add(new THREE.Vector3(c.roofIdx >= 0 ? jx : 0, 0.46, c.roofIdx >= 0 ? jz : 0));
      if (c.roofIdx >= 0) {
        // WP8: a lens never overhangs its roof (mast must have a foot)
        const rf = roofs[c.roofIdx];
        pos.x = THREE.MathUtils.clamp(pos.x, rf.x - rf.w / 2 + 0.18, rf.x + rf.w / 2 - 0.18);
        pos.z = THREE.MathUtils.clamp(pos.z, rf.z - rf.d / 2 + 0.18, rf.z + rf.d / 2 - 0.18);
      }
      nodes.push(pos);
      const isSeat = c.roofIdx < 0; // district re-seats get HEAVY mounts
      // each camera faces roughly toward the plaza core, with scatter —
      // EXCEPT the district re-seats: their masts must land exactly on the
      // authored pole axis / parapet, so no yaw scatter and no lateral
      // offset (the scatter cantilevered the gate-cam mast off its pole —
      // it read as a levitating assembly at night). The rand() draw is kept
      // so the shared stream stays byte-identical downstream.
      const yawScatter = (rand() - 0.5) * 0.5;
      const yaw = Math.atan2(-pos.x, -pos.z) + (isSeat ? 0 : yawScatter);
      nodeYaws.push(yaw);
      // the free-standing gate pole cam: the static campole (41.8,-8.4) is
      // its mast — the bullet cantilevers FORWARD off it on a bracket arm.
      const isGatePole =
        isSeat && Math.abs(pos.x - 41.4) < 1.8 && Math.abs(pos.z + 8.3) < 1.8;
      if (isGatePole) {
        // bracket arm from the pole top up/forward to the bullet back
        const fwdX = Math.sin(yaw);
        const fwdZ = Math.cos(yaw);
        const poleTop = new THREE.Vector3(41.8, 4.1, -8.4);
        const bulletBack = new THREE.Vector3(
          pos.x - fwdX * 0.28,
          pos.y - 0.02,
          pos.z - fwdZ * 0.28,
        );
        const bl = poleTop.distanceTo(bulletBack);
        const bracket = new THREE.CylinderGeometry(0.05, 0.05, bl, 6);
        bracket.applyQuaternion(
          new THREE.Quaternion().setFromUnitVectors(
            new THREE.Vector3(0, 1, 0),
            bulletBack.clone().sub(poleTop).normalize(),
          ),
        );
        bracket.translate(
          (poleTop.x + bulletBack.x) / 2,
          (poleTop.y + bulletBack.y) / 2,
          (poleTop.z + bulletBack.z) / 2,
        );
        paint(bracket, colCap.set("#D9D4C4"));
        setPopKey(bracket, popKey);
        poleGeos.push(bracket);
        return; // skip the generic mast/plate/arm — the campole IS the mast
      }
      // mast set BEHIND the body so the lens cantilevers OUT front (founder
      // img 32: seated cams had mast at offset 0 → lens sat on the mount and
      // the body stuck out backward = the 'orientation backwards' bug)
      const mx = pos.x - Math.sin(yaw) * (isSeat ? 0.4 : 0.5);
      const mz = pos.z - Math.cos(yaw) * (isSeat ? 0.4 : 0.5);
      const roofY = pos.y - 0.46;
      const mast = new THREE.CylinderGeometry(
        isSeat ? 0.09 : 0.04,
        isSeat ? 0.13 : 0.055,
        isSeat ? 1.0 : 0.68,
        6,
      );
      mast.translate(mx, roofY + (isSeat ? 0.18 : 0.34), mz);
      // r3: roof cams (isSeat=false) also get the light night-readable mast
      // (#CDC7B6) + a small foot plate. At night the old dark trunkCol mast
      // dissolved into the black ground/water so the bright bullet read as a
      // floating capsule — now every camera's mount reads grounded.
      paint(mast, colCap.set(isSeat ? "#D9D4C4" : "#CDC7B6"));
      {
        const plate = new THREE.CylinderGeometry(
          isSeat ? 0.24 : 0.14,
          isSeat ? 0.24 : 0.14,
          0.07,
          8,
        );
        plate.translate(mx, roofY + (isSeat ? -0.3 : 0.02), mz);
        paint(plate, colCap.set(isSeat ? "#CBC2AE" : "#C2BAA6"));
        setPopKey(plate, popKey);
        poleGeos.push(plate);
      }
      setPopKey(mast, popKey);
      poleGeos.push(mast);
      const arm = new THREE.BoxGeometry(0.06, 0.06, 0.42);
      arm.rotateY(yaw);
      arm.translate(
        pos.x - Math.sin(yaw) * 0.32,
        pos.y + 0.16,
        pos.z - Math.cos(yaw) * 0.32,
      );
      paint(arm, colCap.set(isSeat ? "#D9D4C4" : "#CDC7B6")); // r3: night-readable L-arm
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
    bakeRadial(gateGlowGeos);
    bakeRadial(mfgGlowGeos);
    bakeRadial(scWindowGeos);

    /* aPhase bake (spec §0.3/§4.5): one random phase PER source geometry,
       written to every vertex of that geo. A shared uTime uniform +
       onBeforeCompile then twinkles each string dot / chases each gondola
       INDEPENDENTLY — never a shared-scalar unison pulse. All eventsLit geos
       must carry the attribute (uniform across the geo) so mergeSafe keeps a
       consistent attribute set. */
    const phaseRand = mulberry32(9173);
    const bakePhase = (geos: THREE.BufferGeometry[]) => {
      geos.forEach((g) => {
        const n = g.attributes.position.count;
        const ph = phaseRand() * Math.PI * 2;
        const arr = new Float32Array(n);
        for (let i = 0; i < n; i++) arr[i] = ph;
        g.setAttribute("aPhase", new THREE.BufferAttribute(arr, 1));
      });
    };
    bakePhase(eventsLitGeos);

    const buildings = mergeSafe(buildingGeos);
    const windowsDark = mergeSafe(windowDarkGeos);
    const windowsLit = mergeSafe(windowLitGeos);
    const greens = mergeSafe(treeGeos);
    const poles = mergeSafe(poleGeos);

    /* network arcs node → the hub's beacon dome (a visible anchor — arcs
       must not vanish into the chassis) */
    const hub = new THREE.Vector3(0, 2.22, 0);
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
    const roadCol = new THREE.Color("#45423C"); // INK asphalt — founder spec: black roads, white stripes
    const sideCol = new THREE.Color("#F1ECDF");
    const dashCol = new THREE.Color("#FBF8F1");
    const gridCol = new THREE.Color("#57534B"); // side streets: one step lighter ink

    // roundabout carriageway: clearly road-toned annulus + raised curbs so
    // the orbit lane (bows ride ~6.8–7.7) unmistakably reads as ROAD
    {
      const ringRoad = new THREE.RingGeometry(6.0, 8.6, 64);
      ringRoad.rotateX(-Math.PI / 2);
      ringRoad.translate(0, 0.07, 0);
      paint(ringRoad, new THREE.Color("#45423C")); // carriageway ink asphalt
      roadGeos.push(ringRoad);
      // dashed centerline on the carriageway — reads as a real ring road
      for (let k = 0; k < 22; k++) {
        const a0 = (k / 22) * Math.PI * 2;
        const dashArc = new THREE.RingGeometry(7.22, 7.4, 6, 1, a0, 0.14);
        dashArc.rotateX(-Math.PI / 2);
        dashArc.translate(0, 0.084, 0);
        paint(dashArc, new THREE.Color("#FBF8F1"));
        roadGeos.push(dashArc);
      }
      // curbs ground the carriageway: inner ring is FULL (borders the island,
      // traffic never crosses it); outer ring is 4 arc segments with gaps at
      // the avenue mouths so entering/exiting cars never clip a curb
      const curbCol = new THREE.Color("#CFC8B6");
      const innerCurb = new THREE.CylinderGeometry(5.95, 5.95, 0.14, 64, 1, true);
      innerCurb.translate(0, 0.095, 0);
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
        arc.translate(0, 0.072, 0);
        paint(arc, curbCol);
        roadGeos.push(arc);
        const arcTop = new THREE.RingGeometry(8.58, 8.82, 24, 1, a0, aLen);
        arcTop.rotateX(-Math.PI / 2);
        arcTop.translate(0, 0.1, 0);
        paint(arcTop, curbCol);
        roadGeos.push(arcTop);
      }
    }

    // main avenues — SUBDIVIDED along their length so the edge-dissolve fade
    // (below) only affects the outer ~12u; a flat 4-corner plane has both
    // ends at the perimeter, so the whole road washed to cream (founder img37)
    const avLen = range * 2 + 14;
    const avSeg = Math.ceil(avLen / 4);
    for (const horizontal of [true, false]) {
      const road = new THREE.PlaneGeometry(
        horizontal ? avLen : 5.2,
        horizontal ? 5.2 : avLen,
        horizontal ? avSeg : 1,
        horizontal ? 1 : avSeg,
      );
      road.rotateX(-Math.PI / 2);
      road.translate(0, 0.066, 0);
      paint(road, roadCol);
      roadGeos.push(road);
      // sidewalks flanking the avenue — split into two segments that STOP
      // at the roundabout (they must never cross the circle)
      const walkLen = range + 7 - 9.5;
      const walkMid = 9.5 + walkLen / 2;
      const walkSeg = Math.ceil(walkLen / 4);
      for (const s of [1, -1]) {
        for (const seg of [1, -1]) {
          const walk = new THREE.PlaneGeometry(
            horizontal ? walkLen : 1.1,
            horizontal ? 1.1 : walkLen,
            horizontal ? walkSeg : 1,
            horizontal ? 1 : walkSeg,
          );
          walk.rotateX(-Math.PI / 2);
          walk.translate(
            horizontal ? seg * walkMid : s * 3.2,
            0.078,
            horizontal ? s * 3.2 : seg * walkMid,
          );
          paint(walk, sideCol);
          roadGeos.push(walk);
        }
      }
    }

    // secondary street grid between blocks (also subdivided for the fade)
    const stLen = range * 2 + 10;
    const stSeg = Math.ceil(stLen / 4);
    for (let k = -SPAN; k < SPAN; k++) {
      const c = (k + 0.5) * BLOCK;
      for (const horizontal of [true, false]) {
        const g = new THREE.PlaneGeometry(
          horizontal ? stLen : 2.0,
          horizontal ? 2.0 : stLen,
          horizontal ? stSeg : 1,
          horizontal ? 1 : stSeg,
        );
        g.rotateX(-Math.PI / 2);
        g.translate(horizontal ? 0 : c, 0.054, horizontal ? c : 0);
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
          dash.translate(horizontal ? s : 0, 0.082, horizontal ? 0 : s);
          paint(dash, dashCol);
          roadGeos.push(dash);
        }
      }
    }

    // crosswalks at the plaza ring and the first block ring — true zebra:
    // each bar spans the carriageway width, bars REPEAT along the road axis
    // (the old z-offsets stacked all five bars into one solid salmon slab
    // that read as a misplaced decal lying across the avenue)
    const walkCol = new THREE.Color("#D97757").lerp(new THREE.Color("#FFFFFF"), 0.45);
    for (const dist of [16.5, -16.5]) {
      for (let k = -2; k <= 2; k++) {
        for (const horizontal of [true, false]) {
          const bar = new THREE.PlaneGeometry(horizontal ? 0.55 : 4.0, horizontal ? 4.0 : 0.55);
          bar.rotateX(-Math.PI / 2);
          bar.translate(horizontal ? dist + k * 1.0 : 0, 0.08, horizontal ? 0 : dist + k * 1.0);
          paint(bar, walkCol);
          roadGeos.push(bar);
        }
      }
    }

    /* THE BACKGROUND — "Between the Guardian and the Lagoon" (artist spec):
       a delta town pinched between a paper-fold mountain wall NW (crowned
       by the snow-capped GUARDIAN) and a milky LAGOON east with a baked
       sun-glint path, a sleeping sister harbor + striped lighthouse, paper
       sailboats, contour-banded shores and Provence field patches. The
       value structure daylight was missing: city → pale shore → mid lagoon
       & foothills → light far wall → one dark/snow accent → cream sky. */
    const horizonGeos: THREE.BufferGeometry[] = [];
    if (high) {
      const hrand = mulberry32(515151);
      const hcol = new THREE.Color();
      const hbase = new THREE.Color();
      const hsummit = new THREE.Color();
      /* faceted paper-fold massif: low-seg cones, flat facets, painted
         light baked in (warm +x facets — the east sun) */
      const massif = (
        az: number,
        rr: number,
        baseHex: string,
        summitHex: string,
        peaks: [number, number][],
        snow = false,
      ) => {
        hbase.set(baseHex);
        hsummit.set(summitHex);
        peaks.forEach(([w2, h2], pi) => {
          const cone = new THREE.ConeGeometry(1, 1, 5 + Math.floor(hrand() * 3), 1);
          cone.scale(w2, h2, w2 * (0.55 + hrand() * 0.25));
          cone.rotateY(hrand() * Math.PI);
          cone.translate(0, h2 / 2 - 0.5, 0);
          const a2 = az + ((pi - (peaks.length - 1) / 2) * (w2 * 0.8)) / rr;
          cone.translate(
            Math.sin(a2) * rr + (hrand() - 0.5) * 6,
            0,
            Math.cos(a2) * rr + (hrand() - 0.5) * 6,
          );
          const g = cone.toNonIndexed();
          g.computeVertexNormals();
          const pos2 = g.attributes.position;
          const nor2 = g.attributes.normal;
          const carr = new Float32Array(pos2.count * 3);
          for (let f = 0; f < pos2.count; f += 3) {
            const fy = (pos2.getY(f) + pos2.getY(f + 1) + pos2.getY(f + 2)) / 3;
            const fx = (pos2.getX(f) + pos2.getX(f + 1) + pos2.getX(f + 2)) / 3;
            const t2 = THREE.MathUtils.clamp(fy / h2, 0, 1);
            hcol.copy(hbase).lerp(hsummit, t2);
            hcol.offsetHSL(0, 0, (hrand() - 0.5) * 0.06); // facet jitter
            const nx = nor2.getX(f);
            // r2: stronger two-value paper-fold so the warm/cool facet
            // split survives the golden-hour fog (far 245)
            if (nx > 0.3) hcol.offsetHSL(0.02, 0.1, 0.1); // sun side (r3: stronger paper-fold facet split)
            else if (nx < -0.3) hcol.offsetHSL(-0.015, -0.06, -0.08);
            if (snow && fy > 0.33 * h2 + 3 * Math.sin(fx * 0.7)) // r3: lower snowline → bigger cap reads against cream
              hcol.set(nx > 0.3 ? "#F9EDE0" : "#F7F4EC"); // wobbly snowline
            for (let v3 = 0; v3 < 3; v3++) {
              carr[(f + v3) * 3] = hcol.r;
              carr[(f + v3) * 3 + 1] = hcol.g;
              carr[(f + v3) * 3 + 2] = hcol.b;
            }
          }
          g.setAttribute("color", new THREE.BufferAttribute(carr, 3));
          horizonGeos.push(g);
        });
      };
      const D2R = Math.PI / 180;
      // Paper-cut atmospheric perspective (artist re-grade): near range
      // darkest/warmest → far range lightest/bluest, so the NW wall reads
      // as three separated planes instead of one olive smear.
      // Range 1 — near olive foothills, west (darkest, warmest — anchors near)
      for (let az = 215; az <= 310; az += 19)
        massif(az * D2R, 76 + hrand() * 20, "#B4C293", "#71885A", [ // r3: darker near range — 3 readable value steps under the gild
          [14 + hrand() * 6, 7 + hrand() * 4],
          [11 + hrand() * 5, 6 + hrand() * 3],
        ]);
      // Range 2 — dusty viridian (mid value)
      for (let az = 165; az <= 300; az += 21)
        massif(az * D2R, 112 + hrand() * 26, "#C5D6CE", "#8AA89E", [
          [20 + hrand() * 8, 15 + hrand() * 6],
          [16 + hrand() * 6, 12 + hrand() * 5],
        ]);
      // Range 3 — hazy steel far wall (lightest, bluest)
      for (let az = 150; az <= 320; az += 20)
        massif(az * D2R, 158 + hrand() * 24, "#EAEFF6", "#BCC8DC", [ // r3: paler+bluer far wall — separates from mid viridian
          [28 + hrand() * 12, 28 + hrand() * 9],
          [22 + hrand() * 8, 22 + hrand() * 7],
        ]);
      // THE GUARDIAN — r2: pulled IN (r 148→124) and grown to 72 so it
      // punches through the fog falloff and crests Range 3; body deepened
      // so residual blue survives the cream fog; az 218 lands it in the p0
      // god-view top-left and the p0.2 Manufacturing backdrop
      // r3: deepened + grown so the hero peak survives the day fog at far 245
      // and reads as the single dark-cool value anchor at NW (was fogged to
      // grey, no taller than Range-3 noise). Flanks dropped so it is clearly
      // the tallest. (snowline widened below — fy>0.33*h2)
      massif(218 * D2R, 116, "#6B7FA8", "#384A72", [[48, 92]], true);
      massif(226 * D2R, 128, "#7E94B8", "#44567E", [[24, 34]], true);
      massif(209 * D2R, 124, "#7E94B8", "#44567E", [[20, 28]], true);

      // THE LAGOON — milky jade east, glint path baked toward az 75°
      {
        // r2: sector widened (-65°, 140°) + an ANGULAR MELT at both theta
        // edges — the old hard sector terminus was a razor diagonal where
        // flat teal met the page (read as a geometric glitch, not a sea)
        const lag = new THREE.RingGeometry(58, 185, 72, 5, -65 * D2R, 140 * D2R);
        lag.rotateX(-Math.PI / 2);
        lag.translate(0, 0.02, 0);
        const lpos = lag.attributes.position;
        const lcol = new Float32Array(lpos.count * 3);
        // two steps deeper than page cream so the water separates from sky
        // and shore at every beat (was invisible — read as blank void)
        const shore = new THREE.Color("#A6CFC6"); // r3: two steps deeper/cooler
        const mid2 = new THREE.Color("#79B4C0");  // so the thin visible water strip still reads as sea
        const melt = new THREE.Color("#E9ECEA");
        const glint = new THREE.Color("#FFE0A0"); // r3: brighter warm glint
        const gdx = Math.sin(75 * D2R);
        const gdz = Math.cos(75 * D2R);
        for (let vi = 0; vi < lpos.count; vi++) {
          const vx = lpos.getX(vi);
          const vz = lpos.getZ(vi);
          const vr = Math.hypot(vx, vz);
          hcol.copy(shore).lerp(mid2, THREE.MathUtils.clamp((vr - 58) / 60, 0, 1));
          if (vr > 150) hcol.lerp(melt, THREE.MathUtils.clamp((vr - 150) / 35, 0, 1));
          const dline = Math.abs(vx * gdz - vz * gdx);
          const gw = 9 + ((vr - 58) / 127) * 22; // r3: wider glint path so it reads through the thin visible strip
          if (dline < gw && vx > 0)
            hcol.lerp(glint, 0.95 * (1 - dline / gw));
          // angular melt: water dissolves into the page at the sector edges
          // (mirrors the radial melt at vr>150)
          const th = Math.atan2(-vz, vx); // RingGeometry theta after rotateX
          const edge = Math.min(th + 65 * D2R, 75 * D2R - th);
          if (edge < 0.22)
            hcol.lerp(melt, THREE.MathUtils.clamp(1 - edge / 0.22, 0, 1));
          lcol[vi * 3] = hcol.r;
          lcol[vi * 3 + 1] = hcol.g;
          lcol[vi * 3 + 2] = hcol.b;
        }
        lag.setAttribute("color", new THREE.BufferAttribute(lcol, 3));
        horizonGeos.push(lag);
      }

      // SISTER HARBOR on a spit (NE, across the water) + striped lighthouse
      {
        // r3: pulled IN from r132 to r112 so the striped lighthouse lamp +
        // sister windows clear the city rooftops and read as warm pinpricks
        // on the dark water at the night beats (the far shore ANSWERS the city)
        const taz = 132 * D2R;
        const tcx = Math.sin(taz) * 112;
        const tcz = Math.cos(taz) * 112;
        const spit = new THREE.BoxGeometry(26, 1, 9);
        spit.rotateY(-taz + Math.PI / 2);
        spit.translate(tcx, 0.4, tcz);
        paint(spit, hcol.set("#D9CDB2"));
        horizonGeos.push(spit);
        const SISTER = ["#D9A8A0", "#A9C4BD", "#D6BE8C", "#B7C3D9", "#C9A0A8"];
        const sisterWinSpots: [number, number, number][] = [];
        for (let sb = 0; sb < 14; sb++) {
          const sw = 0.9 + hrand() * 1.3;
          const sh2 = 1.2 + hrand() * 2.4;
          const off = (sb - 7) * 1.6 + (hrand() - 0.5);
          const sx2 = tcx + Math.cos(taz) * off + (hrand() - 0.5) * 2.5;
          const sz2 = tcz - Math.sin(taz) * off + (hrand() - 0.5) * 2.5;
          const bgeo = new THREE.BoxGeometry(sw, sh2, sw * 0.9);
          bgeo.translate(sx2, 0.9 + sh2 / 2, sz2);
          paint(bgeo, hcol.set(SISTER[sb % 5]));
          horizonGeos.push(bgeo);
          if (sb % 2 === 0) sisterWinSpots.push([sx2, 1.4 + sh2 * 0.5, sz2]);
        }
        // campanile
        const camp = new THREE.BoxGeometry(1.1, 8.5, 1.1);
        camp.translate(tcx + 3, 5.1, tcz - 2);
        paint(camp, hcol.set("#E5DDD0"));
        horizonGeos.push(camp);
        const croof = new THREE.ConeGeometry(1.0, 1.6, 4);
        croof.translate(tcx + 3, 10.1, tcz - 2);
        paint(croof, hcol.set("#C97B6A"));
        horizonGeos.push(croof);
        // lighthouse at the spit tip — stacked stripe cylinders
        const lx2 = tcx - Math.cos(taz) * 13;
        const lz2 = tcz + Math.sin(taz) * 13;
        ["#EFE9DC", "#CE7B66", "#EFE9DC", "#CE7B66", "#EFE9DC"].forEach((sh3, si2) => {
          const seg = new THREE.CylinderGeometry(0.9 - si2 * 0.07, 0.95 - si2 * 0.07, 1.45, 10);
          seg.translate(lx2, 1.1 + si2 * 1.42, lz2);
          paint(seg, hcol.set(sh3));
          horizonGeos.push(seg);
        });
        const lamp2 = new THREE.CylinderGeometry(0.45, 0.55, 0.8, 8);
        lamp2.translate(lx2, 8.6, lz2);
        paint(lamp2, hcol.set("#56524A"));
        horizonGeos.push(lamp2);
        // the far shore ANSWERS the city at the flip: sister windows +
        // lighthouse lamp ride the existing scWindow ignition (0 draws)
        sisterWinSpots.forEach(([wx3, wy3, wz3]) => {
          const wq = new THREE.PlaneGeometry(0.18, 0.25);
          wq.rotateY(taz + Math.PI);
          wq.translate(wx3, wy3, wz3 - 0.01);
          paint(wq, hcol.set("#FFD9A0"));
          scWindowGeos.push(wq);
        });
        const llit = new THREE.BoxGeometry(0.5, 0.45, 0.5);
        llit.translate(lx2, 8.6, lz2);
        paint(llit, hcol.set("#FFD9A0"));
        scWindowGeos.push(llit);
        // paper sailboats on the glint — 2x scale, nearest pulled in to r=68
        // so at least one reads at the p0.2/p0.4 horizon distance.
        // r3: at night the hull went near-black and the unlit sail vanished,
        // so the boat read as a floating dark slab in the Events 0.7–0.85
        // hold. Hull lightened (#E3D9CA), and the sail now RIDES the scWindow
        // ignition (warm #FFE9C8) so each boat keeps a lit sail = a boat on
        // water, with a waterline lantern pinprick to anchor it.
        for (let sbt = 0; sbt < 4; sbt++) {
          const ba = (88 + sbt * 14) * D2R;
          const br = 68 + sbt * 11;
          const bx4 = Math.sin(ba) * br;
          const bz4 = Math.cos(ba) * br;
          const hull = new THREE.BoxGeometry(3.2, 0.5, 1.0);
          hull.rotateY(hrand() * Math.PI);
          hull.translate(bx4, 0.25, bz4);
          paint(hull, hcol.set(sbt === 1 ? "#D8A08E" : "#E3D9CA"));
          horizonGeos.push(hull);
          const sail = new THREE.BufferGeometry();
          sail.setFromPoints([
            new THREE.Vector3(bx4, 0.5, bz4),
            new THREE.Vector3(bx4, 3.6, bz4),
            new THREE.Vector3(bx4 + 1.7, 0.7, bz4 + 0.35),
          ]);
          sail.computeVertexNormals();
          sail.setAttribute("uv", new THREE.BufferAttribute(new Float32Array(6), 2));
          paint(sail, hcol.set("#FFE9C8"));
          scWindowGeos.push(sail);
          // waterline lantern: a tiny warm pinprick at the hull so the boat
          // reads as anchored on the (near-black) night water
          const lant = new THREE.PlaneGeometry(0.4, 0.4);
          lant.rotateY(ba + Math.PI);
          lant.translate(bx4, 0.55, bz4);
          paint(lant, hcol.set("#FFD9A0"));
          scWindowGeos.push(lant);
          // warm wake reflection on the water directly under the hull — gives
          // the boat a visible WATERLINE at night so it never reads as a slab
          // levitating over black water (rides the same scWindow ignition)
          const wake = new THREE.PlaneGeometry(2.6, 1.4);
          wake.rotateX(-Math.PI / 2);
          wake.translate(bx4, 0.04, bz4);
          paint(wake, hcol.set("#9A8866"));
          scWindowGeos.push(wake);
        }
      }

      // BANDED SHORE APRON — contour terraces W, sand lip toward the water E
      {
        const apron = new THREE.RingGeometry(52, 100, 64, 6);
        apron.rotateX(-Math.PI / 2);
        apron.translate(0, 0.006, 0);
        const apos = apron.attributes.position;
        const acol = new Float32Array(apos.count * 3);
        // r2: alternate band + sand lip deepened (the old #E7EADA delta
        // vanished under fog + grain) and the band stride made irregular so
        // the terracing reads as hand-cut topo lines from the god view
        const tA = new THREE.Color("#F1EFE6");
        const tB = new THREE.Color("#DDE4C8");
        const sand = new THREE.Color("#EAD7AE");
        for (let vi = 0; vi < apos.count; vi++) {
          const vx = apos.getX(vi);
          const vz = apos.getZ(vi);
          const vr = Math.hypot(vx, vz);
          const vaz = Math.atan2(vx, vz);
          if (vaz > 40 * D2R && vaz < 150 * D2R) {
            hcol.copy(tA).lerp(sand, THREE.MathUtils.clamp((vr - 70) / 30, 0, 1));
          } else {
            const b0 = Math.floor((vr - 52) / 8);
            const band = Math.floor((vr - 52) / (7 + (b0 % 3) * 2));
            hcol.copy(band % 2 ? tB : tA); // irregular contour bands
          }
          acol[vi * 3] = hcol.r;
          acol[vi * 3 + 1] = hcol.g;
          acol[vi * 3 + 2] = hcol.b;
        }
        apron.setAttribute("color", new THREE.BufferAttribute(acol, 3));
        horizonGeos.push(apron);
      }
      // Provence field QUILT, lower-west — a contiguous 3×3 tilled grid
      // (shared rotation + shared edges + hedge lines) instead of the old
      // seven confetti diamonds floating on the apron
      {
        const qa = 258 * D2R;
        const qcx = Math.sin(qa) * 64;
        const qcz = Math.cos(qa) * 64;
        const QROT = 0.3;
        const cell = 7.5;
        const QUILT = [
          "#E3D4A8", "#C9D9B2", "#D8CFE8",
          "#C9D9B2", "#D9A8A0", "#E3D4A8",
          "#D8CFE8", "#E3D4A8", "#C9D9B2",
        ];
        const ux = Math.cos(QROT);
        const uz = -Math.sin(QROT);
        const vxq = Math.sin(QROT);
        const vzq = Math.cos(QROT);
        for (let qi = -1; qi <= 1; qi++)
          for (let qj = -1; qj <= 1; qj++) {
            const fq = new THREE.PlaneGeometry(cell, cell);
            fq.rotateX(-Math.PI / 2);
            fq.rotateY(QROT + (hrand() - 0.5) * 0.2);
            fq.translate(
              qcx + (qi * ux + qj * vxq) * cell,
              0.04, // clear of the apron (0.006) — was 0.01 and z-fought the
              //       ground, so the field colors sank in (founder img 42)
              qcz + (qi * uz + qj * vzq) * cell,
            );
            paint(fq, hcol.set(QUILT[(qi + 1) * 3 + (qj + 1)]));
            horizonGeos.push(fq);
          }
        // hedge rows along the grid lines — tilled-field read from the god view
        for (let ql = -1; ql <= 2; ql++)
          for (const alongU of [true, false]) {
            const hedge = new THREE.BoxGeometry(
              alongU ? cell * 3 : 0.18,
              0.12,
              alongU ? 0.18 : cell * 3,
            );
            hedge.rotateY(QROT);
            const off = (ql - 0.5) * cell;
            hedge.translate(
              qcx + (alongU ? vxq : ux) * off,
              0.1, // sits ON the raised quilt (0.04) — base no longer dips
              qcz + (alongU ? vzq : uz) * off,
            );
            paint(hedge, hcol.set("#8FA06F"));
            horizonGeos.push(hedge);
          }
      }

      // NIGHT STARS — ~36 tiny paper quads on the dome shell, riding the
      // EXISTING scWindow ignition ramp at the flip (zero extra draw calls;
      // static — clay stays the only moving light)
      {
        const srand = mulberry32(83501);
        for (let st = 0; st < 90; st++) { // r3: 60→90, still scWindow-driven (0 new draws)
          const saz = srand() * Math.PI * 2;
          // low band (alt 6–28): the night cameras pitch DOWN, so only the
          // dome's lower third is ever in frame — stars hug the skyline
          const salt = 6 + srand() * 22;
          const sq = new THREE.PlaneGeometry(0.35, 0.35);
          sq.rotateY(saz + Math.PI); // face back toward the city center
          sq.translate(Math.sin(saz) * 188, salt, Math.cos(saz) * 188);
          paint(sq, hcol.set(srand() < 0.25 ? "#DCE8FF" : "#FFE2B8"));
          scWindowGeos.push(sq);
        }
      }
    }

    /* WP4: 110² hash-mottle sheet under downtown (vertex noise ±0.02 L) */
    if (high) {
      const mottle = new THREE.PlaneGeometry(110, 110, 44, 44);
      mottle.rotateX(-Math.PI / 2);
      mottle.translate(0, 0.018, 0);
      const npos = mottle.attributes.position;
      const ncol = new Float32Array(npos.count * 3);
      const nc = new THREE.Color();
      for (let i = 0; i < npos.count; i++) {
        const hx2 = npos.getX(i) * 12.9898 + npos.getZ(i) * 78.233;
        const jit = ((Math.abs(Math.sin(hx2) * 43758.5453) % 1) - 0.5) * 0.04;
        nc.set("#F0EDE5").offsetHSL(0, 0, jit);
        ncol[i * 3] = nc.r;
        ncol[i * 3 + 1] = nc.g;
        ncol[i * 3 + 2] = nc.b;
      }
      mottle.setAttribute("color", new THREE.BufferAttribute(ncol, 3));
      padGeos.push(mottle);
    }
    /* dissolve the road grid into the terrain at its far edges so it doesn't
       end on a hard rectangular cut. Re-grade roadGeos vertex colors toward the
       ground color (#F1EFE8) over the last D units before the grid perimeter.
       Scoped to roadGeos ONLY (NOT pad/park geos, which reach ±49 and must stay
       fully colored). Roundabout (|m|≤8.8), crosswalks (|m|≈18.5) and inner
       dashes are all well inside the fade window → untouched. No geometry moves;
       only diffuse colors change → no new z-fight, no floaters, no draw calls. */
    {
      const EDGE = range + 7; // 53 — avenue road outer edge
      const D = 12; // fade window
      const groundC = new THREE.Color("#F1EFE8");
      const tmpC = new THREE.Color();
      for (const g of roadGeos) {
        const pos = g.attributes.position;
        const col = g.attributes.color as THREE.BufferAttribute;
        if (!col) continue; // paint() guarantees a color attr on every road geo
        for (let v = 0; v < pos.count; v++) {
          const m = Math.max(Math.abs(pos.getX(v)), Math.abs(pos.getZ(v)));
          const f = THREE.MathUtils.clamp((m - (EDGE - D)) / D, 0, 1);
          if (f <= 0) continue;
          const sm = f * f * (3 - 2 * f); // smoothstep — soft dissolve, no banding
          tmpC.setRGB(col.getX(v), col.getY(v), col.getZ(v)).lerp(groundC, sm);
          col.setXYZ(v, tmpC.r, tmpC.g, tmpC.b);
        }
        col.needsUpdate = true;
      }
    }
    const roads = mergeSafe([...padGeos, ...roadGeos, ...parkGeos]);

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
      lampYaws,
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
      gateGlow: mergeSafe(gateGlowGeos),
      mfgGlow: mergeSafe(mfgGlowGeos),
      scWindow: mergeSafe(scWindowGeos),
      wet: mergeSafe(wetGeos),
      horizon: mergeSafe(horizonGeos),
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
      c.gateGlow?.dispose();
      c.mfgGlow?.dispose();
      c.scWindow?.dispose();
      c.wet?.dispose();
      c.horizon?.dispose();
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

  /* ---- per-element TWINKLE / CHASE (spec §0.3, §4.4-4.5) ----
     A baked aPhase attribute + a shared uTime uniform modulate each lit
     element's emissive INDEPENDENTLY (string dots flicker incoherently,
     ferris gondolas chase around the wheel) — never a shared-scalar unison
     pulse. The vertex shader writes a varying multiplier from sin(uTime·
     speed + aPhase); the fragment shader scales totalEmissiveRadiance.
     `withPop` also threads the pop-grow vertex chunk so lit elements still
     grow out of the entry. uTime is driven in useFrame via twinkleShaders. */
  const twinkleShaders = useRef<
    { uniforms: { uTime: { value: number } } }[]
  >([]);
  const addTwinkle = (
    m: THREE.MeshStandardMaterial | null,
    speed: number,
    amp: number,
    withPop: boolean,
    center = 1.0,
  ) => {
    if (!m || m.userData.twinkled) return;
    m.userData.twinkled = true;
    m.onBeforeCompile = (shader) => {
      shader.uniforms.uTime = { value: 0 };
      // vertex DECL: twinkle attrs, + pop attrs when withPop (combined into a
      // single <common> replacement so neither injection clobbers the other)
      const vDecl = withPop
        ? `${POP_VERTEX_DECL}\nattribute float aPhase;\nuniform float uTime;\nvarying float vEmiMul;`
        : `#include <common>\nattribute float aPhase;\nuniform float uTime;\nvarying float vEmiMul;`;
      const vBegin = `${withPop ? POP_VERTEX_CHUNK : "#include <begin_vertex>"}\nvEmiMul = ${center.toFixed(3)} + ${amp.toFixed(3)} * sin(uTime * ${speed.toFixed(3)} + aPhase);`;
      shader.vertexShader = shader.vertexShader
        .replace("#include <common>", vDecl)
        .replace("#include <begin_vertex>", vBegin);
      shader.fragmentShader = shader.fragmentShader
        .replace("#include <common>", `#include <common>\nvarying float vEmiMul;`)
        .replace(
          "#include <emissivemap_fragment>",
          `#include <emissivemap_fragment>\ntotalEmissiveRadiance *= vEmiMul;`,
        );
      if (withPop) {
        shader.uniforms.uPop = { value: 1 };
        popShaders.current.push(shader as never);
      }
      twinkleShaders.current.push(shader as never);
    };
  };

  /* ================= dynamic actor refs ================= */
  const nodeMeshRef = useRef<THREE.InstancedMesh>(null);
  const nodeMatRef = useRef<THREE.MeshStandardMaterial>(null);
  const lampMeshRef = useRef<THREE.InstancedMesh>(null);
  const lampMatRef = useRef<THREE.MeshStandardMaterial>(null);
  const litWinMatRef = useRef<THREE.MeshStandardMaterial>(null);
  const retailLitMatRef = useRef<THREE.MeshStandardMaterial>(null);
  const eventsLitMatRef = useRef<THREE.MeshStandardMaterial>(null);
  const gateGlowMatRef = useRef<THREE.MeshStandardMaterial>(null);
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

  /* "bean person" — a body capsule + a distinct ball head, merged into one
     instanced geometry (still ONE draw call). Same -0.31 foot / ~+0.33 crown
     envelope as the old plain capsule, so placement + hat alignment are
     unchanged; the head just makes every actor read as a little human. */
  const personGeo = useMemo(() => {
    const body = new THREE.CapsuleGeometry(0.11, 0.26, 4, 10);
    body.translate(0, -0.07, 0); // feet at -0.31
    const head = new THREE.SphereGeometry(0.1, 10, 8);
    head.translate(0, 0.235, 0); // ball on the shoulders, slight neck overlap
    return mergeSafe([body, head])!;
  }, []);
  useEffect(() => () => personGeo.dispose(), [personGeo]);
  const beatDotRef = useRef<THREE.Mesh>(null);
  const tillRef = useRef<THREE.Mesh>(null);
  const gateBarRef = useRef<THREE.Group>(null);
  const lastBeatRef = useRef(-1);
  const gzWasRef = useRef(false);

  /* COLOR SCRIPT (polish spec §3): morning → noon peak → retail golden →
     THE FLIP at T2 → Smart-Cities blue-hour → plum T3 → festival night →
     lit-city finale. scene.background stays cream FOREVER — night lives
     entirely in key/hemi/fog + the sky card. */
  const LIGHT_STOPS = useMemo(
    () =>
      (
        [
          // hemi GROUND is cool stone, never brown — shadows stop filling
          // with khaki; god-view fog pulled back so distant color survives
          [0.0, "#FFF6E8", 1.6, "#FFF4E4", "#CDC9C2", 0.6, "#F2EDDF", 115, 320],
          [0.1, "#FFF2DE", 1.65, "#FFF4E4", "#CDC9C2", 0.58, "#F7F3E9", 80, 230],
          [0.2, "#FFEFD2", 1.72, "#FFF1DC", "#C5C1B6", 0.55, "#F5F0E3", 85, 196], // r3: far 230→196 so the saturated lagoon-blue band desaturates into cream at the skyline (was a hard painted-wall seam against the foothills)
          [0.3, "#FFF6E8", 1.78, "#FFF1DC", "#C5C1B6", 0.58, "#F8F3E8", 90, 240],
          [0.4, "#FFE7C4", 1.6, "#FFE9CE", "#CCC0B2", 0.52, "#F6D8B2", 70, 245], // peach golden haze (far 245 + warmer fog: gilded peaks survive)
          [0.5, "#C9CFEC", 0.62, "#8B93BC", "#4A4858", 0.34, "#C8BCD0", 58, 185], // lilac flip
          [0.6, "#B8C4E8", 0.55, "#6E7BA8", "#3E4358", 0.3, "#A99FC0", 55, 210],
          [0.72, "#A9B4DE", 0.45, "#6E7BA8", "#3E4358", 0.27, "#9C92B4", 50, 205],
          [0.8, "#A8B0DC", 0.52, "#5E66A0", "#4E4450", 0.31, "#968CB0", 48, 205], // festival hemi-ground LIFTED+WARMED #3E3C4E→#4E4450 (spec §0.10/§4.1): clay catches warm spill so accents pop instead of floating on black
          [0.93, "#AEB6E0", 0.45, "#5E66A0", "#3E3C4E", 0.28, "#A89DBE", 46, 195],
        ] as [number, string, number, string, string, number, string, number, number][]
      ).map(([pp, k, ki, hs, hg, hi, f, fn, ff]) => ({
        p: pp,
        key: new THREE.Color(k),
        ki,
        hemiSky: new THREE.Color(hs),
        hemiGround: new THREE.Color(hg),
        hi,
        fog: new THREE.Color(f),
        fn,
        ff,
      })),
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
      /** ground offset — actors standing on raised decks (hall floor slab) */
      baseY?: number;
    };
    const list: Actor[] = [];
    // M: six workers pacing the hall mouth — they stand ON the hall floor
    // slab (top 0.3), so bodies clear the front parapet instead of sinking
    // to disembodied hats
    for (let k = 0; k < 6; k++)
      list.push({
        bx: -43 + k * 2.5,
        // 3 parallel lanes (±0.75 in z) so workers never share a track, and
        // amp 1.0 < the 2.5 x-spacing so same-lane pacers (k and k+3, 7.5
        // apart) never overlap → no two beans ever collide (founder fix)
        bz: -7.3 + ((k % 3) - 1) * 0.75,
        amp: 1.0,
        axis: 0,
        phase: arand() * 10,
        speed: 0.45 + arand() * 0.25,
        kind: k === 2 ? 2 : 1,
        baseY: 0.3,
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
    // R: the flagship queue — on the camera-facing FORECOURT (x −5.0,
    // between sidewalk and storefront face at −5.85; the old −6.1 stood
    // the whole queue inside the flagship's walls, invisible from A7)
    for (let q = 0; q < 5; q++)
      list.push({
        bx: -5.0,
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
    // E: the festival crowd (kind:5) lives entirely inside the `high`-gated
    // DISTRICTS block (ground, lights, tents, stage, ferris). On mobile that
    // ground is absent, so emitting the crowd there strands ~72 dark capsules
    // floating in a navy void (QA r2 BLOCKER / q-mob-72.png). Gate the whole
    // crowd behind `high` so it never renders without its stage.
    if (high) {
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
      // the gate-3 ENTRANT (r2) — the Events detection SUBJECT: shuffles at
      // the barrier lane; the beat dot rides this head and the payoff
      // barrier swings open FOR them (the old fixed dot floated in night air)
      list.push({ bx: 39.6, bz: -9.6, amp: 0, axis: 1, phase: 2, speed: 0, kind: 5 });
      // WP9.5 + founder round: a real festival crowd
      for (let k = 0; k < 58; k++) {
        const a = Math.PI * (0.7 + arand() * 0.7);
        const rr2 = 2.5 + arand() * 4;
        list.push({
          bx: 43 + Math.cos(a) * rr2,
          bz: -18 + Math.sin(a) * (rr2 * 0.8),
          amp: 0.15,
          axis: 0,
          phase: arand() * 6,
          speed: 0.22,
          kind: 5,
        });
      }
    }
    return list;
  }, [high]);
  const actorKeys = useMemo(
    () => ACTORS.map((a) => city.radialKey(a.bx, a.bz)),
    [ACTORS, city],
  );
  // the Events detection SUBJECT (r2): the gate-3 entrant capsule —
  // the dot tracks its head like the M beat tracks the bare-headed worker
  const eSubjectIdx = useMemo(
    () => ACTORS.findIndex((a) => a.kind === 5 && a.bx === 39.6 && a.bz === -9.6),
    [ACTORS],
  );

  /* beat arc rigs: dot anchor → district lens (drawRange bezier, the house
     arc grammar); node indices: 1 = hall parapet cam, 3 = gate cam */
  const beatRigs = useMemo(() => {
    const mk = (from: THREE.Vector3, lensIdx: number, lift = 0.25, bowZ = 0) => {
      const to = city.nodes[Math.min(lensIdx, city.nodes.length - 1)];
      const mid = from.clone().lerp(to, 0.5);
      mid.y = Math.max(from.y, to.y) + from.distanceTo(to) * lift;
      mid.z += bowZ; // bow toward the hold camera so the arc rides open air
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
      // M: starts AT the worker line in front of the hall face (r2 — the
      // old hall-mouth start hid behind the front wall, so only the mid-air
      // segment showed: a thread dangling in space) and bows hard toward
      // the A6 hold camera through the open yard air
      mk(new THREE.Vector3(-38, 1.9, -7.0), 2, 0.12, 9.5),
      mk(new THREE.Vector3(-5.0, 1.7, 26.8), rIdx), // R: queue heads → street cam
      // E: starts over the GATE-3 ENTRANT the dot now tracks (r2 — the
      // old (38.5,4.6) anchor floated in open night air with no subject)
      mk(new THREE.Vector3(39.6, 2.1, -9.6), 3),
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
  const skyMatRef = useRef<THREE.MeshBasicMaterial>(null);
  const skyCapMatRef = useRef<THREE.MeshBasicMaterial>(null);
  const horizonMatRef = useRef<THREE.MeshStandardMaterial>(null);
  const scWindowMatRef = useRef<THREE.MeshStandardMaterial>(null);
  const wetMatRef = useRef<THREE.MeshBasicMaterial>(null);
  /* streetlight cast-light POOLS (spec §2): shared radial texture, opacity
     rides night01 (same gate as the wet bucket) */
  const streetPoolMatRef = useRef<THREE.MeshBasicMaterial>(null);
  const camBodyMatRef = useRef<THREE.MeshStandardMaterial>(null);
  const ferrisRef = useRef<THREE.Group>(null);
  const ferrisLitMatRef = useRef<THREE.MeshStandardMaterial>(null);

  /* WP11.1 fix: the wheel's A-frame support, built in LOCAL space (hub at
     origin, axle along local Z) so it always meets the yawed axle. Static —
     sits as a sibling of the rotating ferrisRef inside the same group. */
  const ferrisSupport = useMemo(() => {
    const parts: THREE.BufferGeometry[] = [];
    const col = new THREE.Color("#9A9486");
    const yA = new THREE.Vector3(0, 1, 0);
    const q = new THREE.Quaternion();
    const connect = (a: THREE.Vector3, b: THREE.Vector3, th: number) => {
      const len = a.distanceTo(b);
      const cyl = new THREE.CylinderGeometry(th, th, len, 6);
      q.setFromUnitVectors(yA, b.clone().sub(a).normalize());
      cyl.applyQuaternion(q);
      cyl.translate((a.x + b.x) / 2, (a.y + b.y) / 2, (a.z + b.z) / 2);
      paint(cyl, col);
      parts.push(cyl);
    };
    const V = (x: number, y: number, z: number) => new THREE.Vector3(x, y, z);
    for (const sz of [-0.62, 0.62]) {
      connect(V(0, 0, sz), V(-2.5, -4.6, sz), 0.15); // splayed A-frame legs
      connect(V(0, 0, sz), V(2.5, -4.6, sz), 0.15);
      connect(V(-2.5, -4.6, sz), V(2.5, -4.6, sz), 0.11); // foot beam
    }
    connect(V(0, 0, -0.62), V(0, 0, 0.62), 0.2); // axle through the hub
    // motor housing at the hub base
    const hh = new RoundedBoxGeometry(0.9, 0.7, 1.5, 2, 0.08);
    hh.translate(0, -0.1, 0);
    paint(hh, col);
    parts.push(hh);
    return mergeSafe(parts)!;
  }, []);
  useEffect(() => () => ferrisSupport.dispose(), [ferrisSupport]);
  // the wheel SKELETON glows lavender at night so the gondola lights read
  // as a wheel even when partially framed (unlit it rendered near-black and
  // the gondolas read as disembodied blobs)
  const ferrisStructMatRef = useRef<THREE.MeshStandardMaterial>(null);

  /* WP11.1: the ferris wheel — rim + spokes (one geo) and 8 pastel
     gondolas (own emissive bucket); rotation is pure f(p) */
  const ferris = useMemo(() => {
    const parts: THREE.BufferGeometry[] = [];
    const rim = new THREE.TorusGeometry(4.2, 0.09, 8, 40);
    paint(rim, new THREE.Color("#C9B8D8"));
    parts.push(rim);
    for (let sp = 0; sp < 8; sp++) {
      const spoke = new THREE.BoxGeometry(0.08, 4.1, 0.08);
      spoke.translate(0, 2.05, 0);
      spoke.rotateZ((sp / 8) * Math.PI * 2);
      paint(spoke, new THREE.Color("#B5A8C8"));
      parts.push(spoke);
    }
    const hubP = new THREE.CylinderGeometry(0.35, 0.35, 0.5, 12);
    hubP.rotateX(Math.PI / 2);
    paint(hubP, new THREE.Color("#56524A"));
    parts.push(hubP);
    const structure = mergeSafe(parts)!;
    const gParts: THREE.BufferGeometry[] = [];
    const chorus = ["#E8CFC8", "#A8B89A", "#E5C1A5", "#9FB4C7", "#E2D6E0", "#D9BCAD", "#E5B864", "#C9A6A0"];
    const gc = new THREE.Color();
    for (let gi = 0; gi < 8; gi++) {
      const a = (gi / 8) * Math.PI * 2;
      const g = new RoundedBoxGeometry(0.5, 0.6, 0.5, 1, 0.08);
      // orbit pulled INSIDE the 4.2 rim (r2): at 4.2 the glowing rim torus
      // bisected every cabin, and bottom cabins grazed the ground slab —
      // 3.8 rings the rim outside the cabins and buys ~0.8 ground clearance
      g.translate(Math.cos(a) * 3.8, Math.sin(a) * 3.8, 0);
      paint(g, gc.set(chorus[gi]));
      // per-gondola phase = orbit angle → the glow CHASES around the wheel
      // (spec §4.4) via a shared uTime uniform, not a unison scalar
      const n = g.attributes.position.count;
      const parr = new Float32Array(n);
      for (let i = 0; i < n; i++) parr[i] = a;
      g.setAttribute("aPhase", new THREE.BufferAttribute(parr, 1));
      gParts.push(g);
    }
    const gondolas = mergeSafe(gParts)!;
    return { structure, gondolas };
  }, []);
  useEffect(
    () => () => {
      ferris.structure.dispose();
      ferris.gondolas.dispose();
    },
    [ferris],
  );

  /* WP1 sky card: ONE vertex-graded plane far behind the city. Outer edge +
     top rows are CREAM so it melts into the page; the horizon band carries
     blush→indigo night. Fog-exempt; opacity rides the flip. */
  const skyShaderRef = useRef<{ uniforms: { uDay: { value: number } } } | null>(null);
  const skyGeo = useMemo(() => {
    // a DOME (open cylinder, inside faces) with TWO bakes: the night
    // gradient in "color" and a peach→aqua→cream DAY sky in "aColorDay",
    // lerped by uDay — the cream void above the horizon was daylight
    // blandness culprit #1 (artist spec §4)
    const g = new THREE.CylinderGeometry(200, 200, 150, 48, 24, true);
    const pos = g.attributes.position;
    const colArr = new Float32Array(pos.count * 3);
    const dayArr = new Float32Array(pos.count * 3);
    const cream = new THREE.Color("#FAF9F5");
    const blush = new THREE.Color("#C98D7E");
    const dusk = new THREE.Color("#5E5680");
    const indigo = new THREE.Color("#383454");
    const peach = new THREE.Color("#F8E6C8"); // r3: warmer
    const aqua = new THREE.Color("#E4E6DD");  // r3: warmer mid/upper day sky (was cool lilac-grey at golden hour)
    const vc = new THREE.Color();
    for (let i = 0; i < pos.count; i++) {
      const ty = (pos.getY(i) + 75) / 150; // 0 bottom → 1 top
      if (ty < 0.2) vc.copy(blush).lerp(dusk, ty / 0.2);
      // night top stays DARK (30% melt only) — the full cream melt made the
      // night sky brighten toward the frame top; the cap disc above carries
      // the matching #726F84 so the page never leaks through at night
      else if (ty < 0.58) vc.copy(dusk).lerp(indigo, (ty - 0.2) / 0.38);
      else vc.copy(indigo).lerp(cream, 0.3 * ((ty - 0.58) / 0.42));
      colArr[i * 3] = vc.r;
      colArr[i * 3 + 1] = vc.g;
      colArr[i * 3 + 2] = vc.b;
      if (ty < 0.18) vc.copy(peach).lerp(aqua, ty / 0.18);
      else if (ty < 0.62) vc.copy(aqua); // r3: carry warmth higher (was 0.5)
      else vc.copy(aqua).lerp(cream, (ty - 0.62) / 0.38);
      dayArr[i * 3] = vc.r;
      dayArr[i * 3 + 1] = vc.g;
      dayArr[i * 3 + 2] = vc.b;
    }
    g.setAttribute("color", new THREE.BufferAttribute(colArr, 3));
    g.setAttribute("aColorDay", new THREE.BufferAttribute(dayArr, 3));
    return g;
  }, []);

  /* paper-cut clouds (artist Mesh B, +1 draw): flat-based blob clusters,
     gilded at golden hour, moonlit dark paper at night */
  const cloudGeo = useMemo(() => {
    const crand = mulberry32(909090);
    const parts: THREE.BufferGeometry[] = [];
    // r2 deepened bake: the old #FDFCF6 crown was indistinguishable from the
    // #FAF9F5 page and the belly matched the fogged far wall — the clouds
    // were invisible at every beat. Crown/belly two steps deeper + a drawn
    // SHADOW UNDERSIDE so each blob reads as cut paper.
    const crown = new THREE.Color("#F2EBDB");
    const belly = new THREE.Color("#CDB199"); // r3: deeper belly/under so blobs read as cut paper
    const under = new THREE.Color("#B89B82"); // against the pale day sky (were invisible)
    const cc2 = new THREE.Color();
    const CLOUDS: [number, number, number, number][] = [
      // [azimuth°, radius, altitude, scale] — east pair RAISED to alt 46/50
      // (r2: at 31/33 they hid behind the pyramid summits) + one wide hero
      // cloud riding the NW mountain wall
      [205, 150, 55, 1.6], // r3: enlarged — flat-based shelf anchoring upper-left
      [215, 145, 63, 0.9],
      [95, 128, 46, 0.9],
      [120, 140, 50, 0.8],
      [265, 130, 50, 1.0],
      [165, 150, 58, 1.1],
      [355, 145, 60, 1.7], // r3: NW hero cloud raised alt 36→60 + scale 1.4→1.7 over the Guardian
    ];
    CLOUDS.forEach(([azd, rr, alt, sc2]) => {
      const az = (azd * Math.PI) / 180;
      const cx2 = Math.sin(az) * rr;
      const cz2 = Math.cos(az) * rr;
      const blobs = 3 + Math.floor(crand() * 3);
      for (let b2 = 0; b2 < blobs; b2++) {
        const blob = new THREE.SphereGeometry(1, 7, 5);
        const bpos = blob.attributes.position;
        for (let vi = 0; vi < bpos.count; vi++)
          if (bpos.getY(vi) < -0.3) bpos.setY(vi, -0.3); // flat paper base
        blob.scale(
          (7 + crand() * 8) * sc2,
          (1.8 + crand() * 1.4) * sc2,
          (4 + crand() * 4) * sc2,
        );
        blob.translate(
          cx2 + (b2 - blobs / 2) * 6 * sc2,
          alt + crand() * 2,
          cz2 + (crand() - 0.5) * 4,
        );
        const bp2 = blob.attributes.position;
        const bcol = new Float32Array(bp2.count * 3);
        blob.computeBoundingBox();
        const bb2 = blob.boundingBox!;
        for (let vi = 0; vi < bp2.count; vi++) {
          const tt2 = (bp2.getY(vi) - bb2.min.y) / Math.max(0.01, bb2.max.y - bb2.min.y);
          // flat base row = drawn shadow underside (paper-cut read)
          if (tt2 < 0.08) cc2.copy(under);
          else cc2.copy(belly).lerp(crown, tt2);
          bcol[vi * 3] = cc2.r;
          bcol[vi * 3 + 1] = cc2.g;
          bcol[vi * 3 + 2] = cc2.b;
        }
        blob.setAttribute("color", new THREE.BufferAttribute(bcol, 3));
        parts.push(blob);
      }
    });
    return mergeSafe(parts)!;
  }, []);
  useEffect(() => () => cloudGeo.dispose(), [cloudGeo]);
  const cloudMatRef = useRef<THREE.MeshBasicMaterial>(null);
  useEffect(() => () => skyGeo.dispose(), [skyGeo]);

  /* r2 (artist): a static PAPER MOON + star quads for the night chapters.
     NOTE: every night HOLD camera pitches below horizontal — the p0.8
     "dead mauve" band is the dome's BOTTOM rows, not open sky — so no sky
     object can render at the holds themselves. The moon sits mid-dome at
     az 119 (over the lagoon, answering the lighthouse) where the pitch-up
     scrub moments between beats catch it. ONE merged mesh (+1 draw),
     opacity rides the flip window — static and pale, the clay stays the
     only signal light. */
  const moonGeo = useMemo(() => {
    const D2R = Math.PI / 180;
    const srand = mulberry32(771177);
    const parts: THREE.BufferGeometry[] = [];
    const mc = new THREE.Color();
    const maz = 119 * D2R;
    const face = maz + Math.PI; // disc normal points back at the city core
    const mx = Math.sin(maz) * 170;
    const mz = Math.cos(maz) * 170;
    const disc = new THREE.CircleGeometry(5.5, 32);
    disc.rotateY(face);
    disc.translate(mx, 45, mz);
    paint(disc, mc.set("#EFE8D6"));
    parts.push(disc);
    // a slim dusk-tone bite makes it a WAXING moonrise, not a dome
    const cut = new THREE.CircleGeometry(5.5, 32);
    cut.translate(2.6, 0.8, 0.25);
    cut.rotateY(face);
    cut.translate(mx, 45, mz);
    paint(cut, mc.set("#5E5680"));
    parts.push(cut);
    // stars stay high on the dome — they catch the scrub moments when the
    // camera pitches up between beats (invisible at the holds, 0 cost)
    for (let st = 0; st < 12; st++) {
      const saz = (60 + srand() * 100) * D2R;
      const sr = 168 + srand() * 8;
      const sy = 70 + srand() * 40;
      const sq = new THREE.PlaneGeometry(0.6, 0.6);
      sq.rotateZ(srand() * Math.PI);
      sq.rotateY(saz + Math.PI);
      sq.translate(Math.sin(saz) * sr, sy, Math.cos(saz) * sr);
      paint(sq, mc.set("#D9D6E8"));
      parts.push(sq);
    }
    return mergeSafe(parts)!;
  }, []);
  useEffect(() => () => moonGeo.dispose(), [moonGeo]);
  const moonMatRef = useRef<THREE.MeshBasicMaterial>(null);

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
    const hub = new THREE.Vector3(0, 2.22, 0);
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
  // pins lowered to just-over-roof height (r2): at y 9.5–10.5 they sat
  // above the A8 frame top — the "results found" payoff fired out of frame
  const RESULT_PINS = useMemo(
    () => [
      new THREE.Vector3(-17, 8.2, -7),
      new THREE.Vector3(-11.5, 7.4, -12.5),
      new THREE.Vector3(-15.5, 7.8, -13.5),
    ],
    [],
  );
  const droneRef = useRef<THREE.Group>(null);
  const bladeRefs = useRef<(THREE.Mesh | null)[]>([]);
  const ledRef = useRef<THREE.Mesh>(null);
  const dummy = useMemo(() => new THREE.Object3D(), []);
  const colTmp = useMemo(() => new THREE.Color(), []);

  /* ---- STREETLIGHT POOLS (spec §2): one shared radial CanvasTexture (warm
     core → transparent edge) + one unit PlaneGeometry, rotated flat.
     Instanced over ALL lampPositions (+1 draw call). Material is toneMapped
     (ACES) so the CAST pool never crosses the bloom threshold — only the
     luminaire HEAD blooms.
     QA r1: the old (1-t)^1.6 curve crammed all the alpha into a tiny hot
     center with a near-invisible skirt → the pool read as a disconnected
     glint, not cast light spreading on asphalt. New curve: a small bright
     plateau (the lit road directly under the head) that rolls off SLOWLY
     with a long, clearly-visible skirt (smoothstep tail), so the light
     fades into the road instead of cutting off — believable spill. ---- */
  const streetPool = useMemo(() => {
    const size = 128;
    const cv = document.createElement("canvas");
    cv.width = cv.height = size;
    const ctx = cv.getContext("2d")!;
    const cx = size / 2;
    const grad = ctx.createRadialGradient(cx, cx, 0, cx, cx, cx);
    // bright plateau out to ~22% radius, then a long smoothstep skirt that
    // stays visible nearly to the edge — a wide soft pool, not a point glint
    for (let s = 0; s <= 24; s++) {
      const t = s / 24;
      const plateau = 0.22;
      let a: number;
      if (t < plateau) {
        a = 1;
      } else {
        const u = (t - plateau) / (1 - plateau); // 0..1 across the skirt
        const sm = u * u * (3 - 2 * u); // smoothstep
        a = (1 - sm) * 0.92; // long falloff, slightly soft peak on the skirt
      }
      grad.addColorStop(t, `rgba(255,255,255,${a.toFixed(4)})`);
    }
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, size, size);
    const tex = new THREE.CanvasTexture(cv);
    tex.colorSpace = THREE.SRGBColorSpace;
    const geo = new THREE.PlaneGeometry(1, 1);
    geo.rotateX(-Math.PI / 2);
    return { tex, geo };
  }, []);
  useEffect(
    () => () => {
      streetPool.tex.dispose();
      streetPool.geo.dispose();
    },
    [streetPool],
  );

  /* lay out the pool instances: one per lamp. QA r1 — the old pool was a
     small (R=1.6) ellipse centered DIRECTLY under the luminaire (out over the
     road), leaving a visible GAP back to the pole base → read as a floating
     blob. Fix: bigger pool (Rw=2.6 across the road × Rl=4.2 along the arm)
     ANCHORED so its rear edge reaches the pole BASE and it spills forward
     under + past the luminaire. The luminaire (pp) sits ~1.8 units out along
     +yaw from the base; we pull the pool centre BACK toward the base so the
     skirt visibly connects pole → cast light, then spreads on the asphalt. */
  const setupStreetPools = (mesh: THREE.InstancedMesh | null) => {
    if (!mesh) return;
    const Rw = 2.6; // half-width across the road (was 1.6)
    const Rl = 4.2; // half-length along the arm — long elongated pool
    const tmp = new THREE.Vector2();
    city.lampPositions.forEach((pp, i) => {
      const yaw = city.lampYaws[i] ?? 0;
      // forward unit vector along the arm (towardRoad). lampYaw = atan2(dx,dz)
      tmp.set(Math.sin(yaw), Math.cos(yaw));
      // pole base is ~1.8 back along -forward from the luminaire; centre the
      // pool ~0.6 forward of the base so its rear skirt overlaps the base
      const cxp = pp.x - tmp.x * 1.8 + tmp.x * 0.6;
      const czp = pp.z - tmp.y * 1.8 + tmp.y * 0.6;
      dummy.position.set(cxp, 0.022, czp);
      dummy.rotation.set(0, yaw, 0);
      dummy.scale.set(Rw, 1, Rl);
      dummy.updateMatrix();
      mesh.setMatrixAt(i, dummy.matrix);
    });
    mesh.instanceMatrix.needsUpdate = true;
  };

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
        // ── PROLOGUE ─────────────────────────────────────────────
        { p: 0.0, pos: new THREE.Vector3(0, 54, 94), look: [0, 1, 2], xOff: -8 }, // A0 god establish — high oblique, whole city reads, copy left
        { p: 0.05, pos: new THREE.Vector3(2, 30, 60), look: [0, 4, 14], xOff: -6 }, // A1 descent begins — settle toward the +z avenue mouth
        // ── DIVE: down the +z avenue canyon, copy-free ───────────
        { p: 0.085, pos: new THREE.Vector3(2, 11, 34), look: [0, 3, 12], xOff: -4 }, // A2 enter the canyon — facades rise on both flanks
        { p: 0.11, pos: new THREE.Vector3(1.4, 5.6, 18), look: [0, 2.4, 4], xOff: -3 }, // A3 canyon floor — pure corridor (|x|<4.8), street rushing
        // bank LEFT into the roundabout's clear annulus (r<11.5), still low
        { p: 0.125, pos: new THREE.Vector3(-3.5, 5.4, 6), look: [-9, 2, -1], xOff: -3 }, // A4 plaza turn — swing west around the hub
        // west sprint down the x-avenue (|z|<4.8 corridor) toward the works
        { p: 0.135, pos: new THREE.Vector3(-16, 5.2, 1.6), look: [-26, 2.6, -2], xOff: -5 }, // A5 west sprint — speed-line toward Manufacturing
        // gantry fly-under: deck underside y7.2 → stay at y4.4 (≥2.45 gap),
        // hold low across the full deck x-window before any climb
        { p: 0.143, pos: new THREE.Vector3(-32, 4.4, 1.2), look: [-37, 2.8, -3], xOff: -5 }, // A6 gantry fly-UNDER — the dive's signature beat
        // ── MANUFACTURING HOLD (0.14–0.27) ──────────────────────
        // FOUNDER FIX: pull WAY back + up to a 3/4 aerial standoff that reads
        // the WHOLE works. Camera sits OVER the container-yard pocket (cargo
        // ≤3.0 → y15 clears by >2.5 vertical) at its SOUTH end, looking NW. The
        // city-block column at x≈-22/-18 stays BEHIND the lens. Sightline runs
        // NW across the whole complex: container yard FOREGROUND, sawtooth
        // halls + gantry MIDGROUND, twin stacks + far hall + mountains
        // BACKGROUND. Copy owns the left third.
        { p: 0.16, pos: new THREE.Vector3(-34, 15.5, 22), look: [-38, 3.2, -9], xOff: -6 }, // A7 M-HOLD establish — full works, yard reads as foreground
        { p: 0.27, pos: new THREE.Vector3(-35.5, 14, 18), look: [-38, 3.2, -10], xOff: -6 }, //    gentle aerial drift NW — settle over the works, never inside it
        // ── T1: rise out of the works, sweep past the hub ───────
        // lift straight up out of the yard, slide SOUTH into the x-avenue
        // corridor (|z|<4.8, the only building-free channel east), then fly the
        // TRANSIT band east over the hub — never crosses the x≈-22 block column.
        { p: 0.30, pos: new THREE.Vector3(-31, 20, 3), look: [-12, 5, 1], xOff: -3 }, // T1a lift-off — corridor-aligned, the works fall away below
        { p: 0.325, pos: new THREE.Vector3(-12, 18, 2.5), look: [0, 3, 3], xOff: -2 }, // T1b hub pass — roundabout + orbiting traffic read below
        // descend INTO the +z avenue mouth, inside the corridor (|x|<4.8)
        { p: 0.34, pos: new THREE.Vector3(1.6, 12, 20), look: [0, 2.6, 34], xOff: -5 }, // T1c turn down the high street
        // ── RETAIL HOLD (0.34–0.47) ─────────────────────────────
        // street-level dolly NORTH up the +z high street: storefronts flank
        // the corridor (pushed to |x|≈5.85), glazing + tills warm. Copy left.
        { p: 0.40, pos: new THREE.Vector3(1.8, 5.8, 36), look: [0, 2.6, 16], xOff: -7 }, // A8 R-HOLD — high-street oblique, shops both flanks
        { p: 0.47, pos: new THREE.Vector3(1.6, 5.4, 28), look: [0, 2.6, 12], xOff: -7 }, //    slow dolly-in toward the flagship/market pocket
        // ── T2: the FLIP crane — day→night, retail → downtown ───
        // crane up out of the corridor (tower occlusion wipe at 0.50), bank east
        { p: 0.50, pos: new THREE.Vector3(5, 17, 16), look: [4, 4, 4], xOff: -2 }, // T2 flip crane — vertical wipe, the night ignites
        // ── SMART CITIES HOLD (0.53–0.68) ───────────────────────
        // golden-hour high oblique over downtown core: roundabout hub +
        // query ring + result pins (x[-17,-11] z[-13,-7]) + chat card near
        // origin. Look down/west so the payoff fires in the right two-thirds.
        { p: 0.53, pos: new THREE.Vector3(17, 24, 18), look: [0, 2.5, -5], xOff: -6 }, // A9 SC-HOLD — the CFO screenshot, whole core lit
        { p: 0.68, pos: new THREE.Vector3(21, 22, 9), look: [-1, 2.5, -6], xOff: -6 }, //    slow orbit-drift — parallax across the result pins
        // ── T3: descend to the festival, dusk → night ───────────
        // drop into the EAST x-avenue corridor (|z|<4.8 — the only building-
        // free channel; a row of towers lines z≈8/12) and run east at z≈3.
        // The path stays at x≤34 / z≈3, threading the low gap at x32 (h4.6)
        // between the tall x27.7 / x37.9 blocks — and NEVER nears the gate-cam
        // pole at (41.8,-8.4), which sits 8u east and 11u north of the lens.
        { p: 0.715, pos: new THREE.Vector3(23, 18, 3), look: [37, 5, -10], xOff: -3 }, // T3a turn east into the corridor — string lights ignite
        { p: 0.745, pos: new THREE.Vector3(31, 17, 5), look: [40, 3, -13], xOff: -3 }, // T3b climb the corridor mouth, the bowl opens below-right
        // ── EVENTS HOLD (0.75–0.88) ─────────────────────────────
        // FOUNDER FIX (two-part): (1) the lens sits in the x-avenue corridor
        // (z≈5), WEST of the gate-cam pole (x≈33 ≪ 41.8) — it clears the pole
        // by >8u in x and ~13u in z, never flying near it. (2) a HIGH 3/4
        // aerial (y≈18) looking DOWN into the bowl, so the ferris wheel is
        // foreshortened into one element of the diorama rather than a wall —
        // matching the M/SC hold language. Reads the WHOLE festival in depth:
        // gate arches + bunting FOREGROUND, striped tents + proscenium stage
        // MIDGROUND, ferris wheel (45.5,-13,h9) BACK-RIGHT, harbor beyond.
        // Look biased to the bowl CENTRE so copy owns the left third.
        { p: 0.78, pos: new THREE.Vector3(33, 18, 5.5), look: [41, 2, -14], xOff: -4 }, // A10 E-HOLD — festival bowl as a lit diorama, wheel back-right
        { p: 0.88, pos: new THREE.Vector3(34.5, 17, 4), look: [42, 2, -14], xOff: -4 }, //    gentle aerial push — the wheel turns, crowd streams the gates
        // ── FINALE: closed-loop crane back to the god framing ───
        // lift straight up in the corridor (clears the flanking blocks by
        // altitude), then arc back high over the city to the A0 framing.
        { p: 0.91, pos: new THREE.Vector3(33, 24, 3), look: [22, 4, -4], xOff: -4 }, // A11 crane lift — the transformed night city falls away
        { p: 0.95, pos: new THREE.Vector3(20, 42, 48), look: [0, 1, 4], xOff: -6 }, //    arc out and up — whole city re-enters frame
        { p: 1.0, pos: new THREE.Vector3(0, 54, 94), look: [0, 1, 2], xOff: -8 }, // A12 closed loop — same shot as A0, city transformed
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
      // T2 redistribution: ease the FLIP crane across the whole 0.47–0.53
      // window (smoothstep, fixed point at 0.5 → the tower wipe stays put)
      // instead of the front-loaded snap that compressed the entire
      // retail→roundabout move into ~1.5% of scroll. Warping p here keeps
      // the clearance CI sweeping the path actually flown.
      if (p > 0.47 && p < 0.53) {
        const tw = (p - 0.47) / 0.06;
        p = 0.47 + 0.06 * (tw * tw * (3 - 2 * tw));
      }
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
    // veil FLOOR 0.75 (r3, was 0.55): the old floor whited-out the top rows
    // of buildings + the tower during the slide-in (stacked with the page
    // cream gradients into a milky band). A higher floor lets building
    // silhouettes + the control tower read through the haze EARLY so the
    // skyline develops crisply instead of dissolving into white.
    const veil = Math.min(1, 0.75 + e * 0.65);
    const fog = scene.fog as THREE.Fog;
    // fog near/far/color are written by the COLOR SCRIPT below (the stops
    // table carries the entry develop, the night flip AND the softened exit
    // — 45/120 at p.93 keeps the lit city visible under the cover)

    /* pop-up-book entry: the hub + inner ring already stand at first sight
       (floor 0.22 — emerging from mist, never a blank void), the wave rolls
       through the slide-in, completing as the prologue scrim releases */
    const pop = Math.min(1, 0.22 + e * 0.38 + window01(p, 0, 0.06) * 0.55);
    const popE = 1 - Math.pow(1 - pop, 3);
    popShaders.current.forEach((sh) => {
      sh.uniforms.uPop.value = pop;
    });
    // drive the per-element twinkle/chase clock (string dots + gondolas)
    twinkleShaders.current.forEach((sh) => {
      sh.uniforms.uTime.value = t;
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
    // entry pre-roll: gentler — start a touch higher/farther and settle
    // (the old 16/12 offsets pushed the whole city past the fog wall)
    posCur.y += (1 - e) * 9;
    posCur.z += (1 - e) * 7;
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

    /* FOV script (spec §0.19, DP note): ~27 through the dive, 32 cruising.
       Retail & Smart Cities keep the gentle warm-in to 34.5 (push-in holds);
       Manufacturing[0] & Events[3] are now pull-back/drift standoffs, so a
       tightening lens fights the move — cap their ease at 33 (+1). */
    const diveW = window01(p, 0.05, 0.08) * (1 - window01(p, 0.125, 0.155));
    let fovT = 32 - 5 * diveW;
    FRACTIONS.parks.forEach(([a, b], i) => {
      const ease = i === 0 || i === 3 ? 1 : 2.5; // M/E standoff vs R/SC push-in
      fovT += ease * window01(p, (a + b) / 2, b) * (1 - window01(p, b, b + 0.035));
    });
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

    /* ---- the color script (polish WP1): full day→night grade ---- */
    const night01 = window01(p, 0.47, 0.56); // THE FLIP — gates every night ride
    if (cityKeyRef.current && cityHemiRef.current) {
      let si = 0;
      while (si < LIGHT_STOPS.length - 2 && p > LIGHT_STOPS[si + 1].p) si++;
      const A = LIGHT_STOPS[si];
      const B = LIGHT_STOPS[si + 1];
      const lt = THREE.MathUtils.clamp((p - A.p) / (B.p - A.p), 0, 1);
      cityKeyRef.current.color.copy(A.key).lerp(B.key, lt);
      cityKeyRef.current.intensity = THREE.MathUtils.lerp(A.ki, B.ki, lt);
      // moonlight casts SOFT light: fade the key's shadow with the flip so
      // the terminator never saws across the night plaza (the darkness is
      // already carried by the dropped key/hemi intensities)
      cityKeyRef.current.shadow.intensity = 1 - 0.85 * night01;
      cityHemiRef.current.color.copy(A.hemiSky).lerp(B.hemiSky, lt);
      cityHemiRef.current.groundColor.copy(A.hemiGround).lerp(B.hemiGround, lt);
      cityHemiRef.current.intensity = THREE.MathUtils.lerp(A.hi, B.hi, lt);
      // fog rides the same stops (color + range), gated by the entry veil
      fog.color.copy(A.fog).lerp(B.fog, lt);
      const fn = THREE.MathUtils.lerp(A.fn, B.fn, lt);
      const ff = THREE.MathUtils.lerp(A.ff, B.ff, lt);
      fog.near = THREE.MathUtils.lerp(4, fn, veil);
      fog.far = THREE.MathUtils.lerp(24, ff, veil);
    }
    // sky script (artist §4): day bake → gilded golden hour → night bake
    if (skyMatRef.current)
      skyMatRef.current.opacity = 0.85 + 0.15 * window01(p, 0.2, 0.5);
    // sky crosses dusk in LOCKSTEP with the ground lights (LIGHT_STOPS lerp
    // 0.4→0.5) — the old 0.42–0.6 ramp left a noon sky over a night city
    if (skyShaderRef.current)
      skyShaderRef.current.uniforms.uDay.value =
        1 - 0.3 * window01(p, 0.3, 0.42) - 0.7 * window01(p, 0.42, 0.52);
    // clouds: white → gilded #FFE6C6 → lilac → moonlit dark paper
    if (cloudMatRef.current) {
      const cm = cloudMatRef.current;
      const gild = window01(p, 0.3, 0.42) * (1 - window01(p, 0.45, 0.55));
      const nightC = window01(p, 0.44, 0.54);
      // r2 strengthened gild — p0.4 clouds hit ~#FFD199 against the aqua dome
      cm.color.setRGB(
        1 - 0.55 * nightC,
        1 - 0.18 * gild - 0.54 * nightC,
        1 - 0.4 * gild - 0.39 * nightC,
      );
      cm.opacity = 0.95 + 0.05 * gild - 0.6 * nightC;
    }
    // night cap disc: seals the dome top through the night chapters
    if (skyCapMatRef.current)
      skyCapMatRef.current.opacity = window01(p, 0.47, 0.56);
    // paper moon + stars ride the same flip window
    if (moonMatRef.current)
      moonMatRef.current.opacity = window01(p, 0.47, 0.56);
    // horizon color script (artist): white → gilded ~#FFE0B3 at golden hour
    // → deep blue-violet ~#616694 after the flip (mirrors the cloud grade)
    if (horizonMatRef.current) {
      const gildH = window01(p, 0.3, 0.42) * (1 - window01(p, 0.45, 0.55));
      const nightH = window01(p, 0.47, 0.58);
      // r2 stronger gild — eastern pyramids hit ~#FFC78A at p0.4 instead of
      // washing to flat beige under the far-245 fog
      horizonMatRef.current.color.setRGB(
        1 - 0.62 * nightH,
        1 - 0.22 * gildH - 0.6 * nightH,
        1 - 0.46 * gildH - 0.42 * nightH,
      );
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
    // +z rotation swings the +x arm UP like a real boom barrier (negative
    // drove the tip through the pavement — the gate read as melting)
    if (gateBarRef.current) gateBarRef.current.rotation.z = 1.15 * payE;

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
      // R: snapped to the flagship-queue heads (r2 — the old (-5,2.3,26)
      // pin read as a sticker on the blank side wall, no subject beneath)
      if (bi === 1) dotScratch.set(-5.0, 1.35, 26.8);
      // E is anchored AFTER the actor loop below — it tracks the
      // middle-gate-lane capsule's head (eSubjectIdx), like the M beat
    }

    /* ---- actor pools: walkers/queue/crowd, riding the bloom wave ---- */
    const actorsMesh = actorMeshRef.current;
    let w2x = -38;
    let w2z = -7.3;
    let e5x = 39.6;
    let e5z = -9.6;
    let e5sc = 1;
    let e5by = 0;
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
        const by = (a.baseY ?? 0) * sc;
        dummy.position.set(px2, by + (0.31 + bob) * sc, pz2);
        dummy.rotation.set(0, 0, 0);
        dummy.scale.setScalar(Math.max(0.001, sc));
        dummy.updateMatrix();
        actorsMesh.setMatrixAt(i, dummy.matrix);
        if (a.kind === 2) {
          w2x = px2;
          w2z = pz2;
        }
        if (i === eSubjectIdx) {
          e5x = px2;
          e5z = pz2;
          e5sc = sc;
          e5by = by;
        }
        if (a.kind === 1 && hats) {
          dummy.position.set(px2, by + (0.72 + bob) * sc, pz2);
          dummy.updateMatrix();
          hats.setMatrixAt(hatIdx++, dummy.matrix);
        }
      });
      actorsMesh.instanceMatrix.needsUpdate = true;
      if (hats) hats.instanceMatrix.needsUpdate = true;
    }
    // the M dot hovers over the BARE head — the missing hat IS the payoff
    // (r2: head+~0.6 — at head+1.0 it optically landed ON the conveyor line
    // and read as glowing belt cargo instead of a worker detection)
    if (activeBeat === 0) dotScratch.set(w2x, 1.55, w2z);
    // E (r3): the dot RIDES the gate-3 entrant's SCALED head. The old fixed
    // y=1.7 sat ~a full capsule-height above the tiny (sc~0.6) entrant — it
    // read as a balloon in open air. Derive the head from the same per-actor
    // sc/by used in the loop (capsule center 0.31, half-height ~0.3) so the
    // dot lands on the capsule like the M beat does.
    if (activeBeat === 3)
      dotScratch.set(e5x, e5by + (0.31 + 0.34) * e5sc + 0.12, e5z);
    if (beatDotRef.current) {
      beatDotRef.current.visible = dotW > 0.01;
      if (dotW > 0.01) {
        // R/E dots scaled −30% (r2): full size they out-read the capsules
        // beneath them — a marker, not a balloon
        const dotS = activeBeat === 3 || activeBeat === 1 ? 0.7 : 1;
        beatDotRef.current.position.copy(dotScratch);
        beatDotRef.current.scale.setScalar(dotW * dotS * (1 + 0.12 * Math.sin(t * 3)));
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
    if (lampMatRef.current)
      lampMatRef.current.emissiveIntensity = 0.05 + wake * 1.05 + night01 * 0.55;
    /* KHAKI-MUD LAW (amended, polish R1): incandescent family stays capped
       at #FFDEBC; civic teal #6FE3DC is the ONE admitted cool family (SC,
       steady); clay remains the only moving light. The night flip boosts
       every emissive — the city becomes the light source. */
    if (litWinMatRef.current)
      litWinMatRef.current.emissiveIntensity = 0.06 + wake * 0.95 + night01 * 1.35;
    if (retailLitMatRef.current)
      retailLitMatRef.current.emissiveIntensity =
        (0.15 + window01(p, 0.3, 0.36) * 0.75) * (1 + 1.2 * night01);
    if (eventsLitMatRef.current)
      eventsLitMatRef.current.emissiveIntensity =
        (0.1 + window01(p, 0.7, 0.76) * 1.05) * (1 + 1.2 * night01);
    // gate lintel caps: same curve, capped ≤ ~0.9 so the near-camera beams
    // glow warmly instead of blooming white across the E-HOLD copy
    if (gateGlowMatRef.current)
      gateGlowMatRef.current.emissiveIntensity =
        (0.1 + window01(p, 0.7, 0.76) * 0.45) * (1 + 0.6 * night01);
    if (mfgGlowMatRef.current)
      mfgGlowMatRef.current.emissiveIntensity = 0.12 + window01(p, 0.1, 0.15) * 0.5;
    /* WP2: Smart-Cities ignition — downtown windows + the civic-teal layer
       detonate through the flip and hold lit to the end */
    if (scWindowMatRef.current)
      // ignition chases the flip: windows catch as the daylight leaves, so
      // mid-flip (p=.50) never parks dark
      scWindowMatRef.current.emissiveIntensity = 1.7 * window01(p, 0.475, 0.545);
    if (wetMatRef.current) wetMatRef.current.opacity = night01;
    // streetlight cast pools ignite at the flip with the wet bucket; a touch
    // brighter at festival so the lit grid reads as casting (spec §2)
    if (streetPoolMatRef.current)
      // pool is now much larger (QA r1) so dial the base alpha back to keep
      // the additive spill tasteful — a soft cast on asphalt, not a wash
      streetPoolMatRef.current.opacity = night01 * (0.6 + 0.22 * window01(p, 0.7, 0.82));

    /* ---- SINGLE animated Bloom pass (spec §3) — drive intensity + threshold
       from p. Day restrained; festival blooms HARD from intensity (1.15), not
       from collapsing threshold below the on-screen cream UI card. Threshold
       held at 1.0 while paper/UI is on screen (p ≤ 0.56), then ramped to the
       0.82 floor (never below). NO exposure ramp (§0.5). Null on mobile. ---- */
    if (bloomRef?.current) {
      // intensity: piecewise-lerp the §3 table
      const bIntens = piecewise(p, BLOOM_I);
      // threshold: 1.0 through the flip leg (cream safe), then 1.0→0.86 across
      // p 0.56→0.6 tracking the flip's tail, then ease to the 0.82 festival
      // floor by p0.8 and hold (finale stays 0.82 so the arcs still kiss bloom)
      const postFlip = window01(p, 0.56, 0.6); // 0 until paper is gone
      const toFloor = window01(p, 0.6, 0.8);
      const bThresh = 1.0 - 0.14 * postFlip - 0.04 * toFloor; // 1.0 → 0.86 → 0.82
      bloomRef.current.intensity = bIntens;
      bloomRef.current.luminanceMaterial.threshold = Math.max(0.82, bThresh);
    }
    // the hero prop must READ at night, not silhouette
    if (camBodyMatRef.current) camBodyMatRef.current.emissiveIntensity = 0.18 * night01;
    /* ferris: rotation pure f(p); gondolas ignite through T3 with the
       string lights */
    if (ferrisRef.current) ferrisRef.current.rotation.z = p * Math.PI * 1.4;
    // cabin glow capped ~½ (r2): at full intensity the near cabins bloomed
    // into formless white blobs at the p0.85 hold, out-glowing the clay dot
    if (ferrisLitMatRef.current)
      ferrisLitMatRef.current.emissiveIntensity =
        (0.05 + window01(p, 0.7, 0.76) * 0.55) * (1 + 0.7 * night01);
    if (ferrisStructMatRef.current)
      ferrisStructMatRef.current.emissiveIntensity =
        0.35 * night01 + 0.25 * window01(p, 0.7, 0.76);
    /* lenses ignite on wake; constellation glows brighter through the exit.
       HEARTBEAT (spec §4.2): one synchronized pulse as the bloom completes —
       every lens fires through the bloom threshold at once. */
    const heart = Math.sin(Math.PI * window01(p, 0.028, 0.062));
    if (nodeMatRef.current)
      nodeMatRef.current.emissiveIntensity =
        (0.35 + wake * 0.85 + finale * 0.25 + exit * 0.9 + heart * 1.7) * (1 + 0.45 * night01);

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
    // street-level attenuation: at the T3/Events ground holds a single arc
    // reads as a harsh wire slicing the sky — KILL the constellation there
    // (r2: at 25% residual a long-haul arc still crossed the full 1920px
    // frame at p0.70–0.75 and threaded the CCTV mast at p0.85) and bring it
    // back for the finale draw-through
    const arcLow =
      1 - 0.98 * window01(p, 0.655, 0.7) * (1 - window01(p, 0.86, 0.9));
    city.arcs.forEach((arc, i) => {
      const local = window01(p, 0.22 + arc.delay * 0.5, 0.55 + arc.delay * 0.5);
      arc.geo.setDrawRange(0, Math.floor(local * arc.total));
      const hop = i === hopIdx ? hopW * 0.5 : 0;
      arc.mat.opacity =
        Math.min(
          0.95,
          (0.45 + parksLit) * local + 0.3 * finale + 0.25 * exit + hop,
        ) * arcLow;
    });

    /* hub breathes; ring spins */
    if (hubRef.current) {
      // breathe ≤6%: at 12% the 1.56 core POKED past the 1.7 chassis and the
      // hub read as two offset slabs at close range (panel finding)
      hubRef.current.scale.setScalar(1 + wake * 0.035 * Math.sin(t * 3));
      (hubRef.current.material as THREE.MeshStandardMaterial).emissiveIntensity =
        (0.25 + wake * 0.7 + finale * 0.4 + 0.5 * exit + blinkW * 0.6) * (1 + 0.4 * night01);
    }
    if (hubRingRef.current) {
      hubRingRef.current.rotation.z = t * 0.4;
      (hubRingRef.current.material as THREE.MeshBasicMaterial).opacity = 0.15 + wake * 0.5;
    }

    if (highlightRef.current) {
      (highlightRef.current.material as THREE.MeshBasicMaterial).opacity =
        querySpot * (0.16 + 0.12 * night01); // r3: lower opacity — reads as a focused detection glow, not a translucent building
    }
    resultPinRefs.current.forEach((pin, i) => {
      if (!pin) return;
      pin.visible = querySpot > 0.01;
      pin.position.y = RESULT_PINS[i].y + Math.sin(t * 2 + i * 2.1) * 0.35;
      pin.rotation.y = t * 1.2 + i;
      pin.scale.setScalar(querySpot * (1 + 0.15 * Math.sin(t * 3 + i)));
      (pin.material as THREE.MeshStandardMaterial).emissiveIntensity =
        0.8 + querySpot * (1.2 + 0.8 * night01); // 2.8 at night — the neon detonation
    });

    /* cars: body + cabin + 4 wheels per car, all instanced */
    const bodies = bodyMeshRef.current;
    const cabins = cabinMeshRef.current;
    const wheels = wheelMeshRef.current;
    if (bodies && cabins && wheels) {
      const span = city.range * 2 + 10;
      city.cars.forEach((c, i) => {
        let px: number, pz: number, ry: number;
        // graceful end-of-road scale envelope: parked cars are always full-size;
        // moving cars fade 0→1 over the first F units after spawn and 1→0 over
        // the last F units before the loop wrap, so they emerge from / dissolve
        // into the haze at the road edges instead of teleporting. POSITIONS and
        // TIMING are byte-identical — only dummy.scale changes at the far slivers.
        let s = 1;
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
          // scale envelope over the 3-unit slivers at d=0 (spawn far edge) and
          // d→T (wrap far edge). F ≪ L1 (39.5) and F ≪ T, so the bypass arc and
          // roundabout cars (d in the middle) are always full-scale (s=1).
          const F = 3.0;
          const fadeIn = THREE.MathUtils.clamp(d / F, 0, 1);
          const fadeOut = THREE.MathUtils.clamp((T - d) / F, 0, 1);
          const env = Math.min(fadeIn, fadeOut);
          s = env * env * (3 - 2 * env); // smoothstep — no linear stretch from ground
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
        dummy.scale.setScalar(s);
        dummy.updateMatrix();
        bodies.setMatrixAt(i, dummy.matrix);

        // cabin sits up and slightly back in car-local space. Collapse its
        // height toward the body centre (0.46) as s→0 — same treatment as the
        // wheels — so the whole car contracts to a single point at the fade
        // ends instead of leaving the cabin floating above the shrinking body.
        const back = 0.12 * s;
        dummy.position.set(
          px - Math.cos(ry) * back,
          0.78 * s + 0.46 * (1 - s),
          pz + Math.sin(ry) * back,
        );
        dummy.scale.setScalar(s);
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
          // scale the corner spread by s too, so the wheels collapse toward the
          // body centre as the car fades to a point (no orphaned wheels)
          const wlx = lx * s;
          const wlz = lz * s;
          dummy.position.set(px + wlx * cosr + wlz * sinr, 0.2 * s + 0.46 * (1 - s), pz - wlx * sinr + wlz * cosr);
          dummy.rotation.set(0, ry, 0);
          dummy.scale.setScalar(s);
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
        // 8192 over the ±58 frustum ≈ 0.014 u/texel — at the grazing god
        // view the long raking shadows down the distant avenues were
        // FRAGMENTING into scattered dark patches (projective shadow-map
        // aliasing); halving the texel again resolves them into continuous
        // shadows. normalBias cures self-shadow acne on lit faces.
        shadow-mapSize={[4096, 4096]}
        shadow-camera-left={-58}
        shadow-camera-right={58}
        shadow-camera-top={58}
        shadow-camera-bottom={-58}
        shadow-camera-far={180}
        shadow-bias={-0.0002}
        shadow-normalBias={0.04}
      />

      {/* ground — dropped to -0.05 so the stacked road/pad/mottle sheets
          (now spread up to ~0.095) never z-fight it at the grazing god view
          (founder: shadow/edge conflict with the overlapping ground) */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.05, 0]} receiveShadow={high}>
        <planeGeometry args={[420, 420]} />
        <meshStandardMaterial color="#F1EFE8" roughness={1} />
      </mesh>

      {/* street network (avenues, grid, sidewalks, dashes, crosswalks) */}
      {city.roads && (
        <mesh geometry={city.roads} receiveShadow={high}>
          <meshStandardMaterial vertexColors roughness={1} />
        </mesh>
      )}

      {/* plaza island (the garden core inside the carriageway ring) */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.06, 0]} receiveShadow={high}>
        <circleGeometry args={[5.6, 48]} />
        <meshStandardMaterial color="#F3EEE3" roughness={1} />
      </mesh>
      <mesh ref={hubRingRef} rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.088, 0]}>
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
              // string-lantern TWINKLE (§4.5): per-dot aPhase + shared uTime,
              // ±12% incoherent flicker; withPop=true keeps the pop-grow in
              addTwinkle(m, 2.0, 0.12, true);
            }}
            vertexColors
            roughness={0.4}
            emissive="#FFDEBC"
            emissiveIntensity={0.25}
          />
        </mesh>
      )}
      {city.gateGlow && (
        <mesh geometry={city.gateGlow}>
          <meshStandardMaterial
            ref={(m) => {
              (gateGlowMatRef as React.MutableRefObject<THREE.MeshStandardMaterial | null>).current = m;
              popMat(m);
            }}
            vertexColors
            roughness={0.4}
            emissive="#FFDEBC"
            emissiveIntensity={0.1}
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
        <meshStandardMaterial
          ref={camBodyMatRef}
          color="#F6F2E8"
          roughness={0.45}
          fog={false}
          emissive="#FFF4E0"
          emissiveIntensity={0}
        />
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

      {/* WP11.1: the ferris wheel — the east skyline icon
          (r3: yawed −0.78 rad so the DISC faces the SW Events cameras —
          at +0.6 the sight-line ran along the wheel plane and it read as a
          tall edge-on column of gondolas at p0.71–0.74, not a wheel) */}
      <group position={[45.5, 4.6, -13.0]} rotation={[0, -0.78, 0]}>
        {/* static A-frame support — meets the axle, reaches the ground */}
        <mesh geometry={ferrisSupport}>
          <meshStandardMaterial vertexColors roughness={0.8} />
        </mesh>
        <group ref={ferrisRef}>
          <mesh geometry={ferris.structure}>
            <meshStandardMaterial
              ref={ferrisStructMatRef}
              vertexColors
              roughness={0.7}
              emissive="#C9B8D8"
              emissiveIntensity={0}
            />
          </mesh>
          <mesh geometry={ferris.gondolas}>
            <meshStandardMaterial
              ref={(m) => {
                (ferrisLitMatRef as React.MutableRefObject<THREE.MeshStandardMaterial | null>).current = m;
                // gondola CHASE (§4.4): aPhase = orbit angle, 0.6+0.4·sin so
                // the glow runs around the wheel (no pop-grow on the wheel)
                addTwinkle(m, 1.5, 0.4, false, 0.6);
              }}
              vertexColors
              roughness={0.5}
              emissive="#FFDEBC"
              emissiveIntensity={0}
            />
          </mesh>
        </group>
      </group>

      {/* the paper horizon — pastel hills, turbines, meadow apron; the
          material rides its own color script (white → gilded → blue-violet)
          so the far land never inverts the night value structure */}
      {city.horizon && (
        <mesh geometry={city.horizon}>
          <meshStandardMaterial ref={horizonMatRef} vertexColors roughness={1} />
        </mesh>
      )}

      {/* the sky DOME — alive in daylight too (peach→aqua→cream), night
          bake lerped in by uDay; cream top melts into the page */}
      <mesh geometry={skyGeo} position={[0, 58, 0]} renderOrder={-2}>
        <meshBasicMaterial
          ref={skyMatRef}
          vertexColors
          transparent
          opacity={0.85}
          fog={false}
          depthWrite={false}
          toneMapped={false}
          side={THREE.BackSide}
          onBeforeCompile={(sh) => {
            sh.uniforms.uDay = { value: 1 };
            (skyShaderRef as React.MutableRefObject<unknown>).current = sh;
            sh.vertexShader = sh.vertexShader
              .replace(
                "#include <common>",
                "#include <common>\nattribute vec3 aColorDay;\nuniform float uDay;",
              )
              .replace(
                "#include <color_vertex>",
                "#include <color_vertex>\n vColor.rgb = mix(vColor.rgb, aColorDay, uDay);",
              );
          }}
        />
      </mesh>
      {/* night cap disc — seals the dome's open top so the cream page never
          shows above the rim at low-pitch night holds; color matches the
          night bake's top row, opacity rides the flip */}
      <mesh position={[0, 132.5, 0]} rotation={[Math.PI / 2, 0, 0]} renderOrder={-2}>
        <circleGeometry args={[210, 32]} />
        <meshBasicMaterial
          ref={skyCapMatRef}
          color="#726F84"
          transparent
          opacity={0}
          fog={false}
          depthWrite={false}
          toneMapped={false}
        />
      </mesh>
      {/* paper moon + stars — fade in with the flip, scrub back cleanly */}
      <mesh geometry={moonGeo} renderOrder={-1}>
        <meshBasicMaterial
          ref={moonMatRef}
          vertexColors
          transparent
          opacity={0}
          fog={false}
          toneMapped={false}
          depthWrite={false}
        />
      </mesh>
      {/* paper-cut clouds — gilded at golden hour, dark paper at night */}
      <mesh geometry={cloudGeo} renderOrder={-1}>
        <meshBasicMaterial
          ref={cloudMatRef}
          vertexColors
          transparent
          opacity={0.95}
          fog={false}
          toneMapped={false}
          depthWrite={false}
        />
      </mesh>

      {/* WP2: SC ignition windows + civic-teal accents (one mesh) */}
      {city.scWindow && (
        <mesh geometry={city.scWindow}>
          <meshStandardMaterial
            ref={(m) => {
              (scWindowMatRef as React.MutableRefObject<THREE.MeshStandardMaterial | null>).current = m;
              popMat(m);
            }}
            vertexColors
            roughness={0.5}
            emissive="#E9E4D4"
            emissiveIntensity={0}
            fog={false}
          />
        </mesh>
      )}
      {/* WP2: wet-street reflections (teal hub pools) — additive, night-gated */}
      {city.wet && (
        <mesh geometry={city.wet} renderOrder={2}>
          <meshBasicMaterial
            ref={wetMatRef}
            vertexColors
            transparent
            opacity={0}
            blending={THREE.AdditiveBlending}
            depthWrite={false}
            fog={false}
          />
        </mesh>
      )}

      {/* STREETLIGHT CAST-LIGHT POOLS (spec §2): instanced radial decals, one
          per lamp, warm #FFCF8A (matches the lampMat head). Additive read via
          the radial texture, but toneMapped (ACES) so the cast pool does NOT
          cross the bloom threshold — the luminaire HEAD blooms, its thrown
          light does not. Opacity rides night01 → ignites free at the flip,
          zero in daylight (no golden-hour smudge). +1 draw call. */}
      <instancedMesh
        ref={setupStreetPools}
        args={[streetPool.geo, undefined, city.lampPositions.length]}
        frustumCulled={false}
        renderOrder={2}
      >
        <meshBasicMaterial
          ref={streetPoolMatRef}
          map={streetPool.tex}
          color="#FFCF8A"
          transparent
          opacity={0}
          blending={THREE.AdditiveBlending}
          depthWrite={false}
          fog={false}
        />
      </instancedMesh>

      {/* actor pools — ONE capsule mesh for all four districts + hat discs
          (five butter hats, one conspicuously bare head: the M beat) */}
      <instancedMesh
        ref={(m) => {
          (actorMeshRef as React.MutableRefObject<THREE.InstancedMesh | null>).current = m;
          if (m && !m.userData.colored) {
            m.userData.colored = true;
            // WP9.5 re-tint: rose/sage/cream/lilac + ~20% ink
            const pal = ["#C9A6A0", "#A8B89A", "#E8E2D2", "#C8B8D8", "#3D3A33", "#D9BCAD"];
            const ac = new THREE.Color();
            for (let i = 0; i < ACTORS.length; i++)
              m.setColorAt(i, ac.set(pal[i % pal.length]));
            if (m.instanceColor) m.instanceColor.needsUpdate = true;
          }
        }}
        args={[undefined, undefined, ACTORS.length]}
        frustumCulled={false}
      >
        <primitive object={personGeo} attach="geometry" />
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
      {/* second till lamp at the flagship (ignites clay on the R payoff) —
          forecourt-side and below the awning so it never pokes through it */}
      <mesh ref={tillRef} position={[-4.9, 1.7, 29.2]}>
        <boxGeometry args={[0.3, 0.3, 0.3]} />
        <meshStandardMaterial
          color="#D97757"
          emissive="#D97757"
          emissiveIntensity={0.1}
          fog={false}
        />
      </mesh>
      {/* gate-3 barrier — swings open on the E payoff (hinged at the post) */}
      <group ref={gateBarRef} position={[38.25, 0.45, -8.2]}>
        <mesh position={[1.375, 0, 0]}>
          <boxGeometry args={[2.75, 0.12, 0.14]} />
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
        {/* beacon dome — seated ON the chassis top (WP7) */}
        <mesh position={[0, 2.19, 0]}>
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

      {/* beat-3 query highlight: soft volume + pulsing ground ring —
          lowered/shrunk (r2) so its top stays under the nav from A8.
          r3: shrunk 13×7×13 → 8×5×8 so it no longer engulfs real towers and
          read as a see-through building (arcs/lamps showing through it) over
          the SC scrim card — it's now a tight detection volume, not a slab. */}
      <mesh ref={highlightRef} position={[-14, 2.8, -10]}>
        <boxGeometry args={[8, 5, 8]} />
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
