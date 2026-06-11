"use client";

import { useEffect, useMemo, useRef } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";
import { RoomEnvironment } from "three/examples/jsm/environments/RoomEnvironment.js";
import {
  window01,
  addPopSlide,
  makeSlideDepthMaterial,
  type PopShaderStore,
} from "@/components/three/lib/popGrow";
import { buildMurmuration } from "./murmuration";
import { buildAllSets, type IndustrySet } from "./sets";

/* ============================================================
   "The Turntable" — one clay maquette on a paper plinth that
   re-dresses itself four times. The CAMERA RING IS FIXED; the
   plinth rotates a curator's quarter-turn between industries
   while the outgoing set telescopes into the paper and the
   incoming set pops up through it (angular-staggered uPop).
   The world changes; Triya's awareness is the constant.

   Storyboard fractions (master progress p ∈ 0..1 over a 600% pin):
     PARK1 Manufacturing 0.00–0.15   TURN1 0.15–0.27
     PARK2 Retail        0.27–0.42   TURN2 0.42–0.54
     PARK3 Smart Cities  0.54–0.69   TURN3 0.69–0.81
     PARK4 Events        0.81–0.93   EXIT  0.93–1.00
   ============================================================ */

export const FRACTIONS = {
  parks: [
    [0.0, 0.15],
    [0.27, 0.42],
    [0.54, 0.69],
    [0.81, 0.93],
  ] as const,
  turns: [
    [0.15, 0.27],
    [0.42, 0.54],
    [0.69, 0.81],
  ] as const,
  exit: [0.93, 1.0] as const,
};

const PAPER = "#FAF9F5";
const CLAY = "#D97757";

/* per-industry light script (key color/intensity lerped across turns) */
const LIGHTS = [
  { color: new THREE.Color("#FFF8EC"), intensity: 1.6 }, // Manufacturing noon
  { color: new THREE.Color("#FFEFD8"), intensity: 1.65 }, // Retail warm
  { color: new THREE.Color("#FFE9C9"), intensity: 1.6 }, // Smart Cities golden
  { color: new THREE.Color("#FFD9B0"), intensity: 0.9 }, // Events dusk
];

/* eased quarter-turn: 15% anticipation / 60% action / 25% settle */
function turnAngle(s: number) {
  const D = Math.PI / 2;
  if (s < 0.15) {
    const t = s / 0.15;
    return D * 0.055 * t * t; // power2.in creep → 5°
  }
  if (s < 0.75) {
    const t = (s - 0.15) / 0.6;
    const e = t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2; // inOut
    return D * (0.055 + e * (0.955 - 0.055));
  }
  const t = (s - 0.75) / 0.25;
  return D * (0.955 + (1 - Math.pow(1 - t, 3)) * 0.045); // power3.out settle
}

interface JourneySceneProps {
  progressRef: React.MutableRefObject<number>;
  entryRef?: React.MutableRefObject<number>;
  /** mirror look composition for RTL */
  dir?: 1 | -1;
}

export function JourneyScene({ progressRef, entryRef, dir = 1 }: JourneySceneProps) {
  const { scene, gl } = useThree();

  /* ---------- IBL for the hub clearcoat (local, no fetch) ---------- */
  const envMap = useMemo(() => {
    const pmrem = new THREE.PMREMGenerator(gl);
    const tex = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
    pmrem.dispose();
    return tex;
  }, [gl]);
  useEffect(() => () => envMap.dispose(), [envMap]);

  /* ---------- industry sets (built once) ---------- */
  const sets = useMemo(() => buildAllSets(), []);
  useEffect(() => {
    return () => {
      Object.values(sets).forEach((s: IndustrySet) =>
        Object.values(s).forEach((g) => g?.dispose()),
      );
    };
  }, [sets]);

  /* per-set pop stores + depth materials (one uPop write drives color+depth) */
  const popStores = useMemo<PopShaderStore[]>(
    () => [0, 1, 2, 3].map(() => ({ current: [] })),
    [],
  );
  const depthMats = useMemo(
    () => popStores.map((st) => makeSlideDepthMaterial(st)),
    [popStores],
  );
  const setGroupRefs = useRef<(THREE.Group | null)[]>([]);
  const popMat = (idx: number) => (m: THREE.MeshStandardMaterial | null) => {
    if (m && !m.userData.popped) {
      m.userData.popped = true;
      addPopSlide(m, popStores[idx]);
    }
  };

  /* ---------- persistent cast: plinth, CCTV ring, hub ---------- */
  const plinthGroup = useRef<THREE.Group>(null);
  const hubSeamRef = useRef<THREE.Mesh>(null);
  const hubRingRef = useRef<THREE.Mesh>(null);

  const RIM = 14;
  const camRing = useMemo(() => {
    const units: { pos: THREE.Vector3; yaw: number }[] = [];
    for (let i = 0; i < 12; i++) {
      const a = (i / 12) * Math.PI * 2 + Math.PI / 12;
      const pos = new THREE.Vector3(Math.cos(a) * RIM, 1.9, Math.sin(a) * RIM);
      units.push({ pos, yaw: Math.atan2(-pos.x, -pos.z) });
    }
    return units;
  }, []);

  const bulletGeo = useMemo(() => {
    const g = new THREE.CylinderGeometry(0.15, 0.115, 0.52, 12);
    g.rotateX(Math.PI / 2);
    return g;
  }, []);
  const faceGeo = useMemo(() => {
    const g = new THREE.CylinderGeometry(0.135, 0.135, 0.035, 12);
    g.rotateX(Math.PI / 2);
    return g;
  }, []);
  const mastGeo = useMemo(() => new THREE.CylinderGeometry(0.05, 0.07, 1.9, 6), []);
  useEffect(
    () => () => {
      bulletGeo.dispose();
      faceGeo.dispose();
      mastGeo.dispose();
    },
    [bulletGeo, faceGeo, mastGeo],
  );
  const dummy = useMemo(() => new THREE.Object3D(), []);
  const PITCH = 0.5;
  const placeRing = (mesh: THREE.InstancedMesh | null, offset: number, geoY = 0) => {
    if (!mesh) return;
    dummy.rotation.order = "YXZ";
    camRing.forEach((u, i) => {
      const cp = Math.cos(PITCH);
      const fx = Math.sin(u.yaw) * cp;
      const fy = -Math.sin(PITCH);
      const fz = Math.cos(u.yaw) * cp;
      dummy.position.set(
        u.pos.x - fx * offset,
        u.pos.y - fy * offset + geoY,
        u.pos.z - fz * offset,
      );
      dummy.rotation.set(offset >= 0 ? PITCH : 0, u.yaw, 0);
      dummy.scale.setScalar(1);
      dummy.updateMatrix();
      mesh.setMatrixAt(i, dummy.matrix);
    });
    mesh.instanceMatrix.needsUpdate = true;
    dummy.rotation.order = "XYZ";
  };
  const placeMasts = (mesh: THREE.InstancedMesh | null) => {
    if (!mesh) return;
    camRing.forEach((u, i) => {
      dummy.position.set(u.pos.x, u.pos.y - 0.95, u.pos.z);
      dummy.rotation.set(0, 0, 0);
      dummy.scale.setScalar(1);
      dummy.updateMatrix();
      mesh.setMatrixAt(i, dummy.matrix);
    });
    mesh.instanceMatrix.needsUpdate = true;
  };

  /* network arcs: every rim lens → hub, ONE merged LineSegments */
  const arcs = useMemo(() => {
    const hub = new THREE.Vector3(0, 2.3, 0);
    const positions: number[] = [];
    const ranges: { start: number; count: number }[] = [];
    camRing.forEach((u) => {
      const mid = u.pos.clone().lerp(hub, 0.5);
      mid.y += u.pos.distanceTo(hub) * 0.14;
      const pts = new THREE.QuadraticBezierCurve3(u.pos, mid, hub).getPoints(48);
      const start = positions.length / 3;
      for (let i = 0; i < pts.length - 1; i++) {
        positions.push(pts[i].x, pts[i].y, pts[i].z, pts[i + 1].x, pts[i + 1].y, pts[i + 1].z);
      }
      ranges.push({ start, count: (pts.length - 1) * 2 });
    });
    const geo = new THREE.BufferGeometry();
    geo.setAttribute("position", new THREE.Float32BufferAttribute(positions, 3));
    geo.setDrawRange(0, 0);
    const mat = new THREE.LineBasicMaterial({
      color: "#C2613F",
      transparent: true,
      opacity: 0,
      fog: false,
    });
    return { geo, mat, ranges, total: positions.length / 3 };
  }, [camRing]);
  useEffect(
    () => () => {
      arcs.geo.dispose();
      arcs.mat.dispose();
    },
    [arcs],
  );

  /* ---------- detection rig (repositioned per park) ---------- */
  const dotRef = useRef<THREE.Mesh>(null);
  const detArcRef = useRef<THREE.Line | null>(null);
  const payoffTill = useRef<THREE.Mesh>(null);
  const payoffSignal = useRef<THREE.Mesh>(null);
  const payoffGate = useRef<THREE.Mesh>(null);
  /* per-park vignette anchors IN PLINTH-LOCAL space (rotate with the world);
     dot floats over the subject, arc goes to the nearest rim lens (world). */
  const VIGNETTES = useMemo(
    () => [
      { dot: new THREE.Vector3(-0.8, 2.4, 3.4) }, // M: over the walkway, by the bare head
      { dot: new THREE.Vector3(0.8, 3.3, 3.0) }, // R: queue at counter
      { dot: new THREE.Vector3(3.8, 2.3, 0.8) }, // SC: stalled car
      { dot: new THREE.Vector3(-5.0, 3.7, 0.0) }, // E: swelling gate
    ],
    [],
  );
  const detArcGeo = useMemo(() => {
    const geo = new THREE.BufferGeometry();
    geo.setAttribute("position", new THREE.Float32BufferAttribute(new Float32Array(49 * 3), 3));
    geo.setDrawRange(0, 0);
    return geo;
  }, []);
  const detArcMat = useMemo(
    () => new THREE.LineBasicMaterial({ color: CLAY, transparent: true, opacity: 0.9, fog: false }),
    [],
  );
  const detLine = useMemo(() => new THREE.Line(detArcGeo, detArcMat), [detArcGeo, detArcMat]);
  useEffect(
    () => () => {
      detArcGeo.dispose();
      detArcMat.dispose();
    },
    [detArcGeo, detArcMat],
  );

  /* ---------- actor pools (time-driven ambience) ---------- */
  const capsGeo = useMemo(() => {
    const g = new THREE.CapsuleGeometry(0.2, 0.55, 3, 8);
    g.translate(0, 0.52, 0);
    return g;
  }, []);
  const boxGeo = useMemo(() => new THREE.BoxGeometry(0.5, 0.42, 0.5), []);
  useEffect(
    () => () => {
      capsGeo.dispose();
      boxGeo.dispose();
    },
    [capsGeo, boxGeo],
  );
  const capsRef = useRef<THREE.InstancedMesh>(null);
  const boxesRef = useRef<THREE.InstancedMesh>(null);
  const hatsRef = useRef<THREE.InstancedMesh>(null);
  const armUpperRef = useRef<THREE.Mesh>(null);
  const armForeRef = useRef<THREE.Mesh>(null);
  const hatGeo = useMemo(() => {
    const g = new THREE.CylinderGeometry(0.27, 0.3, 0.09, 10);
    return g;
  }, []);
  useEffect(() => () => hatGeo.dispose(), [hatGeo]);
  const CAPS = 160;
  const BOXES = 24;
  /* per-industry actor plans: position fn(local t, index) in plinth space */
  const actorPlan = useMemo(() => {
    const plans: ((t: number, i: number) => [number, number, number] | null)[] = [
      // M: 6 workers pacing the walkway + boxes on conveyor
      (t, i) =>
        i < 6
          ? [-6 + ((i * 2.3 + t * 0.6) % 12), 0.28, 3.4 + Math.sin(i * 7) * 0.3]
          : null,
      // R: 5 queue at the first till + 19 drifting the aisles
      (t, i) => {
        if (i < 5) return [-2.2 - i * 0.12, 0.24, 2.5 - i * 0.62];
        if (i < 24)
          return [
            -5.5 + ((i % 4) * 3 + Math.sin(t * 0.25 + i) * 1.1),
            0.24,
            -3.6 + ((i * 1.7 + t * 0.5) % 7.4),
          ];
        return null;
      },
      // SC: 8 pedestrians on crosswalks
      (t, i) =>
        i < 8
          ? i % 2
            ? [-3.6 + ((t * 0.8 + i) % 7.2), 0.18, 2.0 - (i % 4)]
            : [2.0 - (i % 4), 0.18, -3.6 + ((t * 0.7 + i * 1.3) % 7.2)]
          : null,
      // E: 150 crowd streaming through gates toward the stage — lanes sit
      // BETWEEN the barrier ribbons, and bow around the hub footprint
      (t, i) => {
        if (i >= 150) return null;
        const lane = i % 3;
        const u = (i * 0.61 + t * 0.55) % 14;
        const x = -8.5 + u * 1.05;
        let z = -3.7 + lane * 3.55 + Math.sin(i * 3.3) * 0.45;
        const dHub = Math.abs(x + 3);
        if (dHub < 2.2 && Math.abs(z) < 2.2) z += (z >= 0 ? 1 : -1) * (2.2 - dHub);
        return [x, 0.18, z];
      },
    ];
    return plans;
  }, []);

  /* ---------- camera rig (FIXED ring; world rotates) ---------- */
  const camPath = useMemo(
    () =>
      new THREE.CatmullRomCurve3(
        [
          new THREE.Vector3(-30, 9, 34),
          new THREE.Vector3(-15, 4.8, 14),
          new THREE.Vector3(-21, 15, 27),
          new THREE.Vector3(-19, 16, 24),
          new THREE.Vector3(-12, 26, 25),
          new THREE.Vector3(-17, 5.5, 16),
          new THREE.Vector3(0, 42, 48),
        ],
        false,
        "catmullrom",
        0.5,
      ),
    [],
  );
  const LOOKS = useMemo(
    () => [
      // NEGATIVE x: lookAt() CENTERS its target — to compose the maquette in
      // the right two-thirds (copy owns the left), aim left of the subject
      new THREE.Vector3(-4, 2.6, 1),
      new THREE.Vector3(-5, 2.4, 1),
      new THREE.Vector3(-3.5, 3, 0),
      new THREE.Vector3(-4, 2.0, 0),
      new THREE.Vector3(-4, 0.5, 2),
      new THREE.Vector3(-1.5, 2.4, -2),
      new THREE.Vector3(-2, 3, 0),
    ],
    [],
  );
  // parks hold near-still; turns carry the drift. U is derived from the
  // anchors' TRUE arc-length parameters (CatmullRom anchors are NOT at i/N).
  const anchorU = useMemo(() => {
    const pts = camPath.points as THREE.Vector3[];
    const SAMPLES = 400;
    const us = pts.map(() => 0);
    const best = pts.map(() => Infinity);
    const probe = new THREE.Vector3();
    for (let s = 0; s <= SAMPLES; s++) {
      const u = s / SAMPLES;
      camPath.getPointAt(u, probe);
      pts.forEach((a, i) => {
        const d = probe.distanceToSquared(a);
        if (d < best[i]) {
          best[i] = d;
          us[i] = u;
        }
      });
    }
    return us; // 7 entries
  }, [camPath]);
  const P = useMemo(() => [0, 0.15, 0.27, 0.42, 0.54, 0.69, 0.81, 0.93, 1], []);
  const U = useMemo(() => {
    const a = anchorU;
    return [
      Math.max(0, a[1] - 0.03), // P1 approach is the pre-roll's job — hold near-still
      a[1], // P1 hold
      (a[2] + a[3]) / 2,
      a[3], // P2 hold
      a[4] - 0.015, // P3 hold window
      a[4] + 0.015,
      a[5] - 0.015, // P4 hold window
      a[5] + 0.015,
      1.0,
    ];
  }, [anchorU]);
  const remapU = (p: number) => {
    let i = 0;
    while (i < P.length - 2 && p > P[i + 1]) i++;
    return U[i] + ((U[i + 1] - U[i]) * (p - P[i])) / (P[i + 1] - P[i]);
  };
  const AXIS_Y = useMemo(() => new THREE.Vector3(0, 1, 0), []);
  const posCur = useMemo(() => new THREE.Vector3(-30, 9, 34), []);
  const lookCur = useMemo(() => new THREE.Vector3(3, 3, 0), []);
  const tmp = useMemo(() => new THREE.Vector3(), []);
  const tmp2 = useMemo(() => new THREE.Vector3(), []);

  const keyLightRef = useRef<THREE.DirectionalLight>(null);
  const hemiRef = useRef<THREE.HemisphereLight>(null);
  const eventsLitRef = useRef<THREE.MeshStandardMaterial>(null);
  const baseFog = useMemo(() => ({ near: 55, far: 150 }), []);
  useMemo(() => {
    scene.fog = new THREE.Fog(PAPER, baseFog.near, baseFog.far);
    scene.background = new THREE.Color(PAPER);
  }, [scene, baseFog]);

  /* exit murmuration — Events set thins into the living-fabric points */
  const murm = useMemo(
    () =>
      buildMurmuration(
        new THREE.Box3(new THREE.Vector3(-6, 0.28, -5.5), new THREE.Vector3(11.5, 5.3, 6)),
      ),
    [],
  );
  useEffect(
    () => () => {
      murm.geo.dispose();
      murm.mat.dispose();
    },
    [murm],
  );

  /* dev draw-call budget assertion */
  const budgetWarned = useRef(false);

  /* ================= frame loop ================= */
  useFrame(({ camera, clock }) => {
    const p = THREE.MathUtils.clamp(progressRef.current, 0, 1);
    const t = clock.elapsedTime;
    const e = entryRef ? THREE.MathUtils.clamp(entryRef.current, 0, 1) : 1;
    const eE = 1 - Math.pow(1 - e, 3);

    /* --- which beat are we in? --- */
    let parkIdx = 0;
    let turnIdx = -1;
    let turnS = 0;
    FRACTIONS.turns.forEach(([a, b], i) => {
      if (p >= a && p < b) {
        turnIdx = i;
        turnS = (p - a) / (b - a);
      }
    });
    for (let i = 0; i < 4; i++) {
      const [a] = FRACTIONS.parks[i];
      if (p >= a) parkIdx = i;
    }

    /* --- plinth rotation: settled quarter-turns + eased current turn --- */
    let angle = 0;
    for (let i = 0; i < 3; i++) {
      const [a, b] = FRACTIONS.turns[i];
      if (p >= b) angle += Math.PI / 2;
      else if (p >= a) angle += turnAngle((p - a) / (b - a));
    }
    if (plinthGroup.current) plinthGroup.current.rotation.y = -angle;

    /* --- set uPop windows (entry develop drives set 0 initially) --- */
    // OUT window leads IN window (Δ≈0.12) so the outgoing seam clears each
    // wedge just before the incoming peaks there — same direction (uInv),
    // co-occupancy impossible by construction
    const OUT_W: [number, number] = [0.02, 0.64];
    const IN_W: [number, number] = [0.14, 0.96];
    const setPop = [0, 0, 0, 0];
    const setInv = [0, 0, 0, 0];
    setPop[0] = Math.min(eE, 1 - window01(turnIdx === 0 ? turnS : p >= FRACTIONS.turns[0][1] ? 1 : 0, OUT_W[0], OUT_W[1]));
    if (turnIdx === 0) setInv[0] = 1;
    for (let i = 1; i < 4; i++) {
      const [a, b] = FRACTIONS.turns[i - 1];
      const sIn = p < a ? 0 : p >= b ? 1 : (p - a) / (b - a);
      let v = window01(sIn, IN_W[0], IN_W[1]);
      if (i - 1 < 2) {
        const [na, nb] = FRACTIONS.turns[i];
        const sOut = p < na ? 0 : p >= nb ? 1 : (p - na) / (nb - na);
        v = Math.min(v, 1 - window01(sOut, OUT_W[0], OUT_W[1]));
        if (turnIdx === i) setInv[i] = 1; // it is the outgoing set this turn
      }
      setPop[i] = v;
    }
    // exit: events set sinks to 0.3
    const exitW = window01(p, FRACTIONS.exit[0], 1);
    if (exitW > 0) setPop[3] = Math.min(setPop[3], 1 - window01(p, 0.93, 0.972));

    /* murmuration: continuity before the set fade passes 50% */
    murm.points.visible = exitW > 0.01;
    if (murm.points.visible) {
      murm.mat.uniforms.uProgress.value = exitW;
      murm.mat.uniforms.uTime.value = t;
    }

    popStores.forEach((st, i) => {
      st.current.forEach((sh) => {
        sh.uniforms.uPop.value = setPop[i];
        if (sh.uniforms.uInv) sh.uniforms.uInv.value = setInv[i];
      });
      const g = setGroupRefs.current[i];
      if (g) g.visible = setPop[i] > 0.001;
    });

    /* --- fog micro-veil during turns (the exhale) + entry develop --- */
    let veil = 0;
    if (turnIdx >= 0) veil = Math.sin(Math.PI * THREE.MathUtils.clamp((turnS - 0.2) / 0.6, 0, 1)) * 0.18;
    const dev = eE; // entry: fog develops the maquette out of paper
    const fog = scene.fog as THREE.Fog;
    fog.near = (8 + dev * (baseFog.near - 8)) * (1 - veil);
    fog.far = (26 + dev * (baseFog.far - 26)) * (1 - veil * 0.6);

    /* --- light script --- */
    const li = turnIdx >= 0 ? turnIdx : Math.max(0, parkIdx - (turnIdx >= 0 ? 0 : 0));
    const from = LIGHTS[turnIdx >= 0 ? turnIdx : parkIdx];
    const to = LIGHTS[turnIdx >= 0 ? turnIdx + 1 : parkIdx];
    const lt = turnIdx >= 0 ? window01(turnS, 0.6, 1) : 0;
    if (keyLightRef.current) {
      keyLightRef.current.color.copy(from.color).lerp(to.color, lt);
      keyLightRef.current.intensity = THREE.MathUtils.lerp(from.intensity, to.intensity, lt);
    }
    if (hemiRef.current) {
      // fill rides the grade so dusk reads as DUSK, not dimmer noon
      const k = THREE.MathUtils.lerp(from.intensity, to.intensity, lt) / 1.6;
      hemiRef.current.intensity = 0.5 + 0.3 * k;
    }
    // Events string lights ignite through Turn-3's settle (clock-staggered
    // feel via the eased window), then hold lit
    if (eventsLitRef.current) {
      const ig =
        turnIdx === 2 ? window01(turnS, 0.72, 1) : p >= FRACTIONS.turns[2][1] ? 1 : 0;
      eventsLitRef.current.emissiveIntensity = 0.05 + ig * 1.6;
    }
    void li;

    /* --- camera --- */
    camPath.getPointAt(remapU(p), tmp);
    // entry pre-roll
    tmp.y += (1 - eE) * 10;
    tmp.z += (1 - eE) * 9;
    posCur.lerp(tmp, 0.08);
    camera.position.copy(posCur);
    // piecewise look targets across the 7 spline anchors
    const uNow = remapU(p);
    let seg = 0;
    while (seg < anchorU.length - 2 && uNow > anchorU[seg + 1]) seg++;
    const segT = THREE.MathUtils.clamp(
      (uNow - anchorU[seg]) / Math.max(1e-5, anchorU[seg + 1] - anchorU[seg]),
      0,
      1,
    );
    tmp2.copy(LOOKS[seg]).lerp(LOOKS[Math.min(6, seg + 1)], segT);
    tmp2.x *= dir;
    lookCur.lerp(tmp2, 0.08);
    camera.lookAt(lookCur);

    /* --- rim arcs glow with each detection + exit --- */
    const parkLocal = (() => {
      const [a, b] = FRACTIONS.parks[parkIdx];
      return window01(p, a, b);
    })();
    const det = window01(parkLocal, 0.35, 0.5) * (1 - window01(parkLocal, 0.85, 0.97));
    arcs.mat.opacity = 0.25 * det + 0.55 * exitW;
    arcs.geo.setDrawRange(0, Math.floor((det > 0 ? det : exitW) * arcs.total));

    /* --- detection vignette: dot ignites → arc to nearest lens → payoff --- */
    if (dotRef.current && plinthGroup.current) {
      const v = VIGNETTES[parkIdx];
      // dot position in WORLD (vignette anchors rotate with the plinth)
      tmp.copy(v.dot).applyAxisAngle(AXIS_Y, -angle);
      dotRef.current.position.copy(tmp);
      const ignite = window01(parkLocal, 0.35, 0.42);
      const fade = 1 - window01(parkLocal, 0.9, 1);
      const on = (turnIdx < 0 ? ignite * fade : 0) * (exitW > 0 ? 0 : 1);
      dotRef.current.visible = on > 0.01;
      dotRef.current.scale.setScalar(0.001 + on * (1 + 0.12 * Math.sin(t * 4)));
      (dotRef.current.material as THREE.MeshStandardMaterial).emissiveIntensity = 0.6 + on * 1.4;
      // arc to nearest rim lens
      if (on > 0.01) {
        let nearest = camRing[0].pos;
        let nd = Infinity;
        camRing.forEach((u) => {
          const d = u.pos.distanceToSquared(tmp);
          if (d < nd) {
            nd = d;
            nearest = u.pos;
          }
        });
        // quadratic bezier evaluated inline — zero allocation
        const attr = detArcGeo.attributes.position as THREE.BufferAttribute;
        const mx = (tmp.x + nearest.x) / 2;
        const my = (tmp.y + nearest.y) / 2 + 2.2;
        const mz = (tmp.z + nearest.z) / 2;
        for (let k = 0; k <= 48; k++) {
          const tt = k / 48;
          const it = 1 - tt;
          attr.setXYZ(
            k,
            it * it * tmp.x + 2 * it * tt * mx + tt * tt * nearest.x,
            it * it * tmp.y + 2 * it * tt * my + tt * tt * nearest.y,
            it * it * tmp.z + 2 * it * tt * mz + tt * tt * nearest.z,
          );
        }
        attr.needsUpdate = true;
        const drawW = window01(parkLocal, 0.42, 0.55);
        detArcGeo.setDrawRange(0, Math.floor(drawW * 49));
        detArcMat.opacity = 0.9 * fade;
      } else {
        detArcGeo.setDrawRange(0, 0);
      }
    }

    /* --- payoffs (ONE clay element per park) --- */
    const pay = window01(parkLocal, 0.55, 0.65) * (turnIdx < 0 ? 1 : 0);
    if (payoffTill.current) {
      (payoffTill.current.material as THREE.MeshStandardMaterial).emissiveIntensity =
        parkIdx === 1 ? pay * 2.4 : 0;
      payoffTill.current.visible = parkIdx === 1 && turnIdx < 0;
    }
    if (payoffSignal.current) {
      const m = payoffSignal.current.material as THREE.MeshStandardMaterial;
      m.emissiveIntensity = parkIdx === 2 ? 0.4 + pay * 1.2 : 0;
      m.emissive.set(parkIdx === 2 && pay > 0.6 ? "#A8C09A" : CLAY);
      payoffSignal.current.visible = parkIdx === 2 && turnIdx < 0;
    }
    if (payoffGate.current) {
      payoffGate.current.visible = parkIdx === 3 && turnIdx < 0;
      payoffGate.current.rotation.z = -pay * 1.2; // barrier swings open
      (payoffGate.current.material as THREE.MeshStandardMaterial).emissiveIntensity =
        parkIdx === 3 ? 0.3 + pay : 0;
    }

    /* --- hub acknowledges each detection --- */
    if (hubSeamRef.current) {
      const blink = window01(parkLocal, 0.55, 0.6) * (1 - window01(parkLocal, 0.7, 0.8));
      (hubSeamRef.current.material as THREE.MeshStandardMaterial).emissiveIntensity =
        0.3 + blink * 1.3 + exitW * 0.8;
    }
    if (hubRingRef.current) hubRingRef.current.rotation.z = t * 0.4;

    /* --- actors (time-driven; hand off at turn midpoints) --- */
    const caps = capsRef.current;
    if (caps) {
      const plan = actorPlan[parkIdx];
      const nextPlan = turnIdx >= 0 ? actorPlan[Math.min(3, turnIdx + 1)] : null;
      const swap = turnIdx >= 0 ? window01(turnS, 0.45, 0.55) : 0;
      const activePlan = swap > 0.5 && nextPlan ? nextPlan : plan;
      const scl = turnIdx >= 0 ? Math.abs(swap - 0.5) * 2 : 1;
      for (let i = 0; i < CAPS; i++) {
        const lp = activePlan(t, i);
        if (!lp) {
          dummy.scale.setScalar(0.001);
          dummy.position.set(0, -5, 0);
        } else {
          tmp.set(lp[0] + 3, lp[1] + 0.28, lp[2]).applyAxisAngle(AXIS_Y, -angle);
          dummy.position.copy(tmp);
          dummy.scale.setScalar(
            Math.max(0.001, scl * Math.min(1, eE * 2) * (1 - exitW)),
          );
        }
        dummy.rotation.set(0, 0, 0);
        dummy.updateMatrix();
        caps.setMatrixAt(i, dummy.matrix);
      }
      caps.instanceMatrix.needsUpdate = true;
      // hard hats ride the first six workers — index 2 is the BARE HEAD
      const hats = hatsRef.current;
      if (hats) {
        for (let i = 0; i < 6; i++) {
          const hatScl = turnIdx === 0 ? Math.max(0.001, Math.abs(window01(turnS, 0.45, 0.55) - 0.5) * 2) : 1;
          const lp = parkIdx === 0 && i !== 2 && hatScl > 0.02 ? actorPlan[0](t, i) : null;
          if (!lp) {
            dummy.position.set(0, -5, 0);
            dummy.scale.setScalar(0.001);
          } else {
            tmp.set(lp[0] + 3, lp[1] + 0.28 + 1.12, lp[2]).applyAxisAngle(AXIS_Y, -angle);
            dummy.position.copy(tmp);
            dummy.scale.setScalar(hatScl);
          }
          dummy.rotation.set(0, 0, 0);
          dummy.updateMatrix();
          hats.setMatrixAt(i, dummy.matrix);
        }
        hats.instanceMatrix.needsUpdate = true;
      }
      // robot arm pick loop (Manufacturing only, clock time)
      if (armUpperRef.current && armForeRef.current) {
        const sw = Math.sin(t * 0.9);
        armUpperRef.current.rotation.y = sw * 0.7; // plinth already carries -angle
        armUpperRef.current.rotation.z = 0.5 + Math.sin(t * 1.3) * 0.25;
        armForeRef.current.rotation.z = -0.9 + Math.cos(t * 1.1) * 0.3;
        const armS = Math.max(0.001, setPop[0]);
        armUpperRef.current.visible = armS > 0.05;
        armForeRef.current.visible = armS > 0.05;
        armUpperRef.current.scale.setScalar(armS);
        armForeRef.current.scale.setScalar(armS);
      }
    }
    const boxes = boxesRef.current;
    if (boxes) {
      for (let i = 0; i < BOXES; i++) {
        let lp: [number, number, number] | null = null;
        if (parkIdx === 0) lp = [-6 + ((i * 1.9 + t * 1.6) % 11.5), 1.43, 1.6]; // conveyor
        else if (parkIdx === 2 && i < 8)
          lp = i % 2 ? [-9 + ((t * 2.2 + i * 2.7) % 18), 0.35, 2.1] : [2.1, 0.35, -9 + ((t * 2 + i * 3.1) % 18)];
        else if (parkIdx === 3 && i < 6) lp = [3 + (i % 3) * 1.2, 1.35, -1.5 + Math.floor(i / 3) * 1.2];
        if (!lp) {
          dummy.scale.setScalar(0.001);
          dummy.position.set(0, -5, 0);
        } else {
          tmp.set(lp[0] + 3, lp[1] + 0.28, lp[2]).applyAxisAngle(AXIS_Y, -angle);
          dummy.position.copy(tmp);
          // cars read as cars, not cubes (D9e)
          if (parkIdx === 2) dummy.scale.set(1.7, 0.8, 1);
          else dummy.scale.setScalar(1);
          // boxes hand off with the actor swap (D9c)
          if (turnIdx >= 0) dummy.scale.multiplyScalar(Math.max(0.001, Math.abs(window01((p - FRACTIONS.turns[turnIdx][0]) / (FRACTIONS.turns[turnIdx][1] - FRACTIONS.turns[turnIdx][0]), 0.45, 0.55) - 0.5) * 2));
        }
        dummy.rotation.set(0, 0, 0);
        dummy.updateMatrix();
        boxes.setMatrixAt(i, dummy.matrix);
      }
      boxes.instanceMatrix.needsUpdate = true;
    }

    /* --- dev budget assertion --- */
    if (process.env.NODE_ENV !== "production" && !budgetWarned.current) {
      const calls = gl.info.render.calls;
      if (calls > 60) {
        budgetWarned.current = true;
        console.error(`[journey] draw-call budget exceeded: ${calls} > 60`);
      }
    }
  });

  const setOrder: (keyof ReturnType<typeof buildAllSets>)[] = [
    "manufacturing",
    "retail",
    "smartCities",
    "events",
  ];

  return (
    <group>
      {/* lighting: static ortho shadow box sized to the plinth (never moves) */}
      <hemisphereLight ref={hemiRef} args={["#FFF8EC", "#E8D2C2", 0.8]} />
      <directionalLight
        ref={keyLightRef}
        position={[26, 22, 14]}
        intensity={1.6}
        color="#FFF8EC"
        castShadow
        shadow-mapSize={[2048, 2048]}
        shadow-camera-left={-20}
        shadow-camera-right={20}
        shadow-camera-top={20}
        shadow-camera-bottom={-20}
        shadow-camera-far={90}
        shadow-bias={-0.0004}
      />

      {/* paper ground + plinth (persistent) */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.31, 0]} receiveShadow>
        <circleGeometry args={[60, 48]} />
        <meshStandardMaterial color={PAPER} roughness={1} />
      </mesh>
      <mesh position={[0, -0.05, 0]} receiveShadow>
        <cylinderGeometry args={[14.5, 14.9, 0.6, 64]} />
        <meshStandardMaterial color="#F3EFE4" roughness={1} />
      </mesh>
      {/* crisp cream rim — the maquette reads as a museum object */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.262, 0]}>
        <ringGeometry args={[13.9, 14.5, 64]} />
        <meshStandardMaterial color="#E8E4D8" roughness={1} />
      </mesh>

      {/* THE TURNTABLE — everything industry-specific lives in here */}
      <group ref={plinthGroup}>
        {setOrder.map((key, i) => {
          const set = sets[key];
          return (
            <group
              key={key}
              position={[3, 0.28, 0]} /* +y: floors above the plinth top;
                +x: the hub gets a forecourt instead of sitting inside sets */
              ref={(g) => {
                setGroupRefs.current[i] = g;
              }}
            >
              {set.structures && (
                <mesh geometry={set.structures} castShadow receiveShadow customDepthMaterial={depthMats[i]}>
                  <meshStandardMaterial ref={popMat(i)} vertexColors roughness={0.92} />
                </mesh>
              )}
              {set.windowsDark && (
                <mesh geometry={set.windowsDark}>
                  <meshStandardMaterial ref={popMat(i)} vertexColors roughness={0.6} />
                </mesh>
              )}
              {set.windowsLit && (
                <mesh geometry={set.windowsLit}>
                  <meshStandardMaterial
                    ref={(m) => {
                      popMat(i)(m);
                      if (i === 3 && m)
                        (eventsLitRef as React.MutableRefObject<THREE.MeshStandardMaterial | null>).current = m;
                    }}
                    vertexColors
                    roughness={0.5}
                    emissive="#FFC98A"
                    emissiveIntensity={0.9}
                  />
                </mesh>
              )}
              {set.props && (
                <mesh geometry={set.props} castShadow customDepthMaterial={depthMats[i]}>
                  <meshStandardMaterial ref={popMat(i)} vertexColors roughness={0.85} />
                </mesh>
              )}
            </group>
          );
        })}

        {/* exit murmuration (12k points, 140 clay motes → the hub) */}
        <primitive object={murm.points} />

        {/* payoff elements (clay budget: ONE per park) */}
        <mesh ref={payoffTill} position={[5.2, 1.57, 3.6]} visible={false}>
          <boxGeometry args={[0.34, 0.5, 0.34]} />
          <meshStandardMaterial color={CLAY} emissive={CLAY} emissiveIntensity={0} fog={false} />
        </mesh>
        <mesh ref={payoffSignal} position={[5.6, 3.33, 2.8]} visible={false}>
          <boxGeometry args={[0.42, 0.36, 0.2]} />
          <meshStandardMaterial color={INK_SAFE} emissive={CLAY} emissiveIntensity={0} fog={false} />
        </mesh>
        <mesh ref={payoffGate} position={[-5.5, 1.38, 3.4]} visible={false}>
          <boxGeometry args={[0.12, 1.6, 0.12]} />
          <meshStandardMaterial color={CLAY} emissive={CLAY} emissiveIntensity={0} fog={false} />
        </mesh>

        {/* hard hats (clay-free sand discs; worker #2 is conspicuously bare) */}
        <instancedMesh ref={hatsRef} args={[hatGeo, undefined, 6]} frustumCulled={false}>
          <meshStandardMaterial color="#E5C97B" roughness={0.7} />
        </instancedMesh>
        {/* robot arm: base + upper + forearm, hinged on clock time */}
        <mesh position={[4.6, 0.78, -0.9]} castShadow>
          <cylinderGeometry args={[0.45, 0.55, 1.0, 12]} />
          <meshStandardMaterial color="#C3CCC9" roughness={0.7} />
        </mesh>
        <mesh ref={armUpperRef} position={[4.6, 1.35, -0.9]} castShadow>
          <boxGeometry args={[0.32, 2.0, 0.32]} />
          <meshStandardMaterial color="#CFD3BC" roughness={0.7} />
        </mesh>
        <mesh ref={armForeRef} position={[4.6, 2.6, -0.9]} castShadow>
          <boxGeometry args={[0.24, 1.5, 0.24]} />
          <meshStandardMaterial color="#C3CCC9" roughness={0.7} />
        </mesh>

        {/* actor pools */}
        <instancedMesh ref={capsRef} args={[capsGeo, undefined, CAPS]} frustumCulled={false} castShadow>
          <meshStandardMaterial color="#F0E9DC" roughness={0.8} />
        </instancedMesh>
        <instancedMesh ref={boxesRef} args={[boxGeo, undefined, BOXES]} frustumCulled={false} castShadow>
          <meshStandardMaterial color="#C9BFA8" roughness={0.8} />
        </instancedMesh>
      </group>

      {/* CCTV ring — FIXED in world (awareness is the constant) */}
      <instancedMesh ref={(m) => placeRing(m, 0.16)} args={[bulletGeo, undefined, 12]} frustumCulled={false} castShadow>
        <meshStandardMaterial color="#F6F2E8" roughness={0.45} fog={false} />
      </instancedMesh>
      <instancedMesh ref={(m) => placeRing(m, 0.02)} args={[faceGeo, undefined, 12]} frustumCulled={false}>
        <meshStandardMaterial color="#2C2B26" roughness={0.25} fog={false} />
      </instancedMesh>
      <instancedMesh ref={placeMasts} args={[mastGeo, undefined, 12]} frustumCulled={false}>
        <meshStandardMaterial color="#A8A293" roughness={0.9} />
      </instancedMesh>

      {/* hub (clone of the city's device) */}
      <group position={[0, 0.3, 0]}>
        <mesh position={[0, 0.15, 0]} receiveShadow>
          <cylinderGeometry args={[1.5, 1.7, 0.3, 24]} />
          <meshStandardMaterial color="#E3DDCE" roughness={1} />
        </mesh>
        {[0.7, 1.8].map((y) => (
          <mesh key={y} position={[0, y, 0]} castShadow>
            <boxGeometry args={[1.5, 0.8, 1.5]} />
            <meshPhysicalMaterial
              color="#1A1715"
              roughness={0.32}
              clearcoat={0.45}
              clearcoatRoughness={0.25}
              envMap={envMap}
              envMapIntensity={1.25}
              fog={false}
            />
          </mesh>
        ))}
        <mesh ref={hubSeamRef} position={[0, 1.25, 0]}>
          <boxGeometry args={[1.38, 0.3, 1.38]} />
          <meshStandardMaterial color={CLAY} emissive={CLAY} emissiveIntensity={0.3} fog={false} />
        </mesh>
        <mesh ref={hubRingRef} rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.31, 0]}>
          <ringGeometry args={[2.2, 2.4, 48]} />
          <meshBasicMaterial color={CLAY} transparent opacity={0.35} fog={false} />
        </mesh>
        <mesh position={[0, 2.32, 0]}>
          <sphereGeometry args={[0.2, 14, 10, 0, Math.PI * 2, 0, Math.PI / 2]} />
          <meshStandardMaterial color="#E8A381" emissive={CLAY} emissiveIntensity={1.25} roughness={0.3} fog={false} />
        </mesh>
      </group>

      {/* merged rim arcs */}
      <primitive object={useMemo(() => new THREE.LineSegments(arcs.geo, arcs.mat), [arcs])} />

      {/* detection rig */}
      <mesh ref={dotRef} visible={false}>
        <sphereGeometry args={[0.3, 12, 12]} />
        <meshStandardMaterial color="#FFFFFF" emissive={CLAY} emissiveIntensity={2.0} fog={false} />
      </mesh>
      <primitive object={detLine} />
    </group>
  );
}

const INK_SAFE = "#56524A";
