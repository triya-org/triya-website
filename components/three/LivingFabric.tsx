"use client";

import { useEffect, useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { fabricVertex, fabricFragment } from "./shaders/fabric";

interface LivingFabricProps {
  /** Number of points. Tune down on mobile for performance. */
  count?: number;
  /** Front color (amber). Defaults to brand yellow-400. */
  colorA?: string;
  /** Back/depth color (orange). Defaults to brand orange-400. */
  colorB?: string;
  opacity?: number;
}

/**
 * The point-cloud "living fabric" — a wavy plane of drifting points seeded
 * from the current Triya warm/amber palette. ~4% of points are camera "nodes"
 * that pulse brighter. Pointer parallax + idle drift keep it alive.
 */
export function LivingFabric({
  count = 5000,
  colorA = "#E8A381", // clay-300
  colorB = "#D97757", // clay-400, the brand accent
  opacity = 0.85,
}: LivingFabricProps) {
  const pointsRef = useRef<THREE.Points>(null);
  const pointer = useRef({ x: 0, y: 0 });

  const { geometry, material } = useMemo(() => {
    const positions = new Float32Array(count * 3);
    const scales = new Float32Array(count);
    const nodes = new Float32Array(count);
    const seeds = new Float32Array(count);

    const W = 38;
    const H = 22;
    const D = 10; // depth spread so the field reads as a 3D cloud, not a wall
    for (let i = 0; i < count; i++) {
      const x = (Math.random() - 0.5) * W;
      const y = (Math.random() - 0.5) * H;
      const z =
        Math.sin(x * 0.3) * 1.5 +
        Math.cos(y * 0.4) * 1.2 +
        (Math.random() - 0.5) * D;
      positions[i * 3] = x;
      positions[i * 3 + 1] = y;
      positions[i * 3 + 2] = z;
      scales[i] = 0.5 + Math.random() * 1.0;
      nodes[i] = Math.random() < 0.05 ? 1 : 0;
      seeds[i] = Math.random();
    }

    const geo = new THREE.BufferGeometry();
    geo.setAttribute("position", new THREE.BufferAttribute(positions, 3));
    geo.setAttribute("aScale", new THREE.BufferAttribute(scales, 1));
    geo.setAttribute("aNode", new THREE.BufferAttribute(nodes, 1));
    geo.setAttribute("aSeed", new THREE.BufferAttribute(seeds, 1));

    const mat = new THREE.ShaderMaterial({
      uniforms: {
        uTime: { value: 0 },
        uSize: { value: 6 },
        uProgress: { value: 0 },
        uPointer: { value: new THREE.Vector2(0, 0) },
        uColorA: { value: new THREE.Color(colorA) },
        uColorB: { value: new THREE.Color(colorB) },
        uOpacity: { value: opacity },
      },
      vertexShader: fabricVertex,
      fragmentShader: fabricFragment,
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
    });

    return { geometry: geo, material: mat };
  }, [count, colorA, colorB, opacity]);

  // Dispose GPU resources when geometry/material are recreated or unmounted.
  useEffect(() => {
    return () => {
      geometry.dispose();
      material.dispose();
    };
  }, [geometry, material]);

  useEffect(() => {
    const onMove = (e: MouseEvent) => {
      pointer.current.x = (e.clientX / window.innerWidth - 0.5) * 2;
      pointer.current.y = -(e.clientY / window.innerHeight - 0.5) * 2;
    };
    window.addEventListener("mousemove", onMove, { passive: true });
    return () => window.removeEventListener("mousemove", onMove);
  }, []);

  useFrame((state) => {
    material.uniforms.uTime.value = state.clock.elapsedTime;
    const p = material.uniforms.uPointer.value as THREE.Vector2;
    p.x += (pointer.current.x - p.x) * 0.05;
    p.y += (pointer.current.y - p.y) * 0.05;
    if (pointsRef.current) {
      pointsRef.current.rotation.y = Math.sin(state.clock.elapsedTime * 0.05) * 0.08;
    }
  });

  return <points ref={pointsRef} geometry={geometry} material={material} />;
}
