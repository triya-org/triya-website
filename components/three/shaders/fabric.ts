/**
 * "Living Fabric" point-cloud shaders.
 *
 * GLSL is shipped as TS template strings (no fetch / no eval of external
 * resources) so it stays compatible with the site's strict CSP and with the
 * static export — nothing is loaded at runtime.
 *
 * The metaphor: every point is a camera; ~4% are "nodes" that pulse brighter,
 * representing live intelligence in the fabric. `uProgress` is reserved for the
 * scroll-scrubbed morph wired up in phase P2.
 */

export const fabricVertex = /* glsl */ `
  uniform float uTime;
  uniform float uSize;
  uniform float uProgress;
  uniform vec2 uPointer;

  attribute float aScale;
  attribute float aNode;
  attribute float aSeed;

  varying float vNode;
  varying float vDepth;

  void main() {
    vNode = aNode;

    vec3 pos = position;

    // Gentle, always-alive drift (cheap pseudo-noise, no textures).
    float t = uTime * 0.2;
    pos.y += sin(t + aSeed * 6.2831 + pos.x * 0.4) * 0.18;
    pos.x += cos(t * 0.8 + aSeed * 6.2831 + pos.z * 0.4) * 0.14;
    pos.z += sin(t * 0.6 + aSeed * 3.1415 + pos.y * 0.4) * 0.14;

    // Damped pointer parallax — closer points react more.
    pos.xy += uPointer * (0.3 + aScale * 0.5);

    vec4 mvPosition = modelViewMatrix * vec4(pos, 1.0);
    vDepth = -mvPosition.z;
    gl_Position = projectionMatrix * mvPosition;

    float nodePulse = aNode > 0.5
      ? (1.6 + 0.5 * sin(uTime * 2.0 + aSeed * 6.2831))
      : 1.0;

    // Perspective attenuation kept small so points read as fine specks, not blobs.
    gl_PointSize = uSize * aScale * nodePulse * (10.0 / max(-mvPosition.z, 0.001));
  }
`;

export const fabricFragment = /* glsl */ `
  precision highp float;

  uniform vec3 uColorA;
  uniform vec3 uColorB;
  uniform float uOpacity;

  varying float vNode;
  varying float vDepth;

  void main() {
    // Soft circular sprite.
    vec2 uv = gl_PointCoord - 0.5;
    float d = length(uv);
    if (d > 0.5) discard;
    float alpha = smoothstep(0.5, 0.0, d);

    // Amber in front, deeper orange toward the back for depth.
    vec3 col = mix(uColorA, uColorB, clamp(vDepth / 18.0, 0.0, 1.0));

    // Ordinary points stay faint; camera nodes glow toward a hot white-gold core.
    float intensity = 0.35;
    if (vNode > 0.5) {
      col = mix(col, vec3(1.0, 0.96, 0.82), 0.6);
      intensity = 1.0;
    }

    gl_FragColor = vec4(col, alpha * uOpacity * intensity);
  }
`;
