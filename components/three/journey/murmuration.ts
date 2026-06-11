import * as THREE from "three";
import { mulberry32 } from "@/components/three/lib/popGrow";

/* ============================================================
   Exit murmuration — the LivingFabric metaphor cashed once, at
   the only moment nobody scrubs backwards: the Events set thins
   into a cream point-cloud whose 140 clay motes arc to the hub.

   ~12k points; aFrom = sampled from the Events set's bounding
   surfaces, aTo = arc waypoints toward the hub + a dispersal
   shell. Blended by uProgress with stateless curl-ish
   displacement scaled by sin(π·uProgress) — fully scrubbable,
   zero per-frame allocation.
   ============================================================ */

const COUNT = 12000;
const CLAY_COUNT = 140;

export function buildMurmuration(eventsBounds: THREE.Box3) {
  const rand = mulberry32(99);
  const from = new Float32Array(COUNT * 3);
  const to = new Float32Array(COUNT * 3);
  const colors = new Float32Array(COUNT * 3);
  const seeds = new Float32Array(COUNT);
  const isClayArr = new Float32Array(COUNT);

  const cream = new THREE.Color("#BDB6A2");
  const clay = new THREE.Color("#D97757");
  const hub = new THREE.Vector3(0, 2.5, 0);
  const size = new THREE.Vector3();
  eventsBounds.getSize(size);
  const min = eventsBounds.min;

  for (let i = 0; i < COUNT; i++) {
    // FROM: rejection-lite sampling across the set volume, biased to surfaces
    const fx = min.x + rand() * size.x;
    const fy = min.y + Math.pow(rand(), 0.6) * size.y;
    const fz = min.z + rand() * size.z;
    from[i * 3] = fx;
    from[i * 3 + 1] = fy;
    from[i * 3 + 2] = fz;

    const isClay = i < CLAY_COUNT;
    isClayArr[i] = isClay ? 1 : 0;
    if (isClay) {
      // clay motes converge on the hub (slight scatter at arrival)
      to[i * 3] = hub.x + (rand() - 0.5) * 1.2;
      to[i * 3 + 1] = hub.y + rand() * 1.5;
      to[i * 3 + 2] = hub.z + (rand() - 0.5) * 1.2;
      // HDR boost — bloom selects exactly these 140 motes
      colors[i * 3] = clay.r * 2.3;
      colors[i * 3 + 1] = clay.g * 2.3;
      colors[i * 3 + 2] = clay.b * 2.3;
    } else {
      // cream points disperse upward into a wide shell and thin out
      const a = rand() * Math.PI * 2;
      const r = 18 + rand() * 26;
      to[i * 3] = Math.cos(a) * r;
      to[i * 3 + 1] = 14 + rand() * 26;
      to[i * 3 + 2] = Math.sin(a) * r;
      colors[i * 3] = cream.r;
      colors[i * 3 + 1] = cream.g;
      colors[i * 3 + 2] = cream.b;
    }
    seeds[i] = rand();
  }

  const geo = new THREE.BufferGeometry();
  geo.setAttribute("position", new THREE.BufferAttribute(from.slice(), 3)); // placeholder
  geo.setAttribute("aFrom", new THREE.BufferAttribute(from, 3));
  geo.setAttribute("aTo", new THREE.BufferAttribute(to, 3));
  geo.setAttribute("aColor", new THREE.BufferAttribute(colors, 3));
  geo.setAttribute("aSeed", new THREE.BufferAttribute(seeds, 1));
  geo.setAttribute("aIsClay", new THREE.BufferAttribute(isClayArr, 1));

  const mat = new THREE.ShaderMaterial({
    uniforms: {
      uProgress: { value: 0 },
      uTime: { value: 0 },
      uSize: { value: 9.5 },
    },
    vertexShader: /* glsl */ `
      uniform float uProgress;
      uniform float uTime;
      uniform float uSize;
      attribute vec3 aFrom;
      attribute vec3 aTo;
      attribute vec3 aColor;
      attribute float aSeed;
      attribute float aIsClay;
      varying vec3 vColor;
      varying float vFade;
      void main() {
        float p = uProgress;
        // staggered departure by seed (later points leave later)
        float lp = clamp((p * 1.35 - aSeed * 0.35), 0.0, 1.0);
        float ease = lp * lp * (3.0 - 2.0 * lp); // smoothstep
        vec3 pos = mix(aFrom, aTo, ease);
        // stateless curl-ish swirl, strongest mid-flight
        float sw = sin(3.14159 * lp);
        pos.x += sin(uTime * 0.9 + aSeed * 6.2831 + pos.y * 0.35) * 1.6 * sw;
        pos.z += cos(uTime * 0.8 + aSeed * 6.2831 + pos.x * 0.3) * 1.6 * sw;
        pos.y += sin(uTime * 0.7 + aSeed * 12.566) * 0.8 * sw;
        vColor = aColor;
        // clay motes persist (and grow); cream thins as it disperses
        vFade = 1.0 - ease * mix(0.85, 0.1, aIsClay);
        vec4 mv = modelViewMatrix * vec4(pos, 1.0);
        gl_Position = projectionMatrix * mv;
        gl_PointSize = uSize * (1.0 + sw * 0.4) * (1.0 + aIsClay * 0.9)
          * (140.0 / max(-mv.z, 0.001)) * 0.18;
      }
    `,
    fragmentShader: /* glsl */ `
      precision highp float;
      varying vec3 vColor;
      varying float vFade;
      void main() {
        vec2 uv = gl_PointCoord - 0.5;
        float d = length(uv);
        if (d > 0.5) discard;
        float alpha = smoothstep(0.5, 0.05, d) * vFade;
        gl_FragColor = vec4(vColor, alpha);
      }
    `,
    transparent: true,
    depthWrite: false,
  });

  const points = new THREE.Points(geo, mat);
  points.visible = false;
  points.frustumCulled = false;
  return { points, geo, mat };
}
