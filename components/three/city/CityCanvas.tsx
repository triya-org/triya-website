"use client";

import { useEffect, useRef, useState } from "react";
import { Canvas } from "@react-three/fiber";
import { SoftShadows } from "@react-three/drei";
import {
  EffectComposer,
  Bloom,
  Vignette,
  Noise,
  BrightnessContrast,
  HueSaturation,
} from "@react-three/postprocessing";
import type { BloomEffect } from "postprocessing";
import { CityScene } from "./CityScene";

interface CityCanvasProps {
  progressRef: React.MutableRefObject<number>;
  entryRef?: React.MutableRefObject<number>;
  /** true when the section is covered/off-screen → pause the render loop */
  coveredRef?: React.MutableRefObject<boolean>;
  /** RTL composition mirror (look offsets only) */
  dir?: 1 | -1;
}

/**
 * Canvas host for the Living City.
 *
 * Desktop: PCSS soft shadows + a film-grade post stack —
 *   · Bloom with luminanceThreshold=1 → ONLY HDR emissives glow (lamps,
 *     lit windows, CCTV nodes, the hub). The cream paper (≈0.97 luminance)
 *     stays matte, so the "city waking up" beat reads as light blooming on.
 *   · Vignette + fine Noise → editorial print grain, draws the eye center.
 *   · BrightnessContrast → a touch of clay-render contrast.
 * Mobile: lighter city, no shadows, no post (GPU budget).
 */
export function CityCanvas({ progressRef, entryRef, coveredRef, dir = 1 }: CityCanvasProps) {
  const [isMobile, setIsMobile] = useState(false);
  const [frameloop, setFrameloop] = useState<"always" | "never">("always");
  /* handle to the SINGLE Bloom pass — CityScene's useFrame animates its
     intensity/threshold from progressRef (spec §3). Null on mobile (no
     EffectComposer) → CityScene null-checks it, so the writes are no-ops.
     (@react-three/postprocessing types the ref as `typeof BloomEffect` but
     hands back the instance at runtime — cast to the instance type.) */
  const bloomRef = useRef<typeof BloomEffect & BloomEffect>(null);

  useEffect(() => {
    setIsMobile(window.matchMedia("(max-width: 767px)").matches);
    const decide = () =>
      setFrameloop(document.hidden || coveredRef?.current ? "never" : "always");
    document.addEventListener("visibilitychange", decide);
    const id = setInterval(decide, 300);
    return () => {
      document.removeEventListener("visibilitychange", decide);
      clearInterval(id);
    };
  }, []);

  return (
    <Canvas
      frameloop={frameloop}
      shadows={!isMobile}
      camera={{ position: [0, 52, 92], fov: 32, near: 0.5, far: 460 }}
      dpr={[1, isMobile ? 1.5 : 1.75]}
      gl={{ antialias: isMobile, powerPreference: "high-performance" }}
    >
      {/* tighter penumbra (size 32→14) + more samples (12→18): the wide
          soft kernel with few samples gave noisy, jagged, crawling shadow
          edges along the roads + manufacturing plant (founder). A tighter,
          better-sampled kernel reads clean and stable. */}
      {!isMobile && <SoftShadows size={14} samples={18} focus={0.75} />}
      <CityScene
        progressRef={progressRef}
        entryRef={entryRef}
        quality={isMobile ? "low" : "high"}
        dir={dir}
        bloomRef={
          bloomRef as unknown as React.MutableRefObject<{
            intensity: number;
            luminanceMaterial: { threshold: number };
          } | null>
        }
      />
      {!isMobile && (
        <EffectComposer multisampling={8}>
          <Bloom
            ref={bloomRef}
            mipmapBlur
            intensity={0.45}
            luminanceThreshold={1}
            luminanceSmoothing={0.15}
          />
          <BrightnessContrast brightness={0} contrast={0.06} />
          <HueSaturation saturation={0.14} />
          <Vignette eskil={false} offset={0.28} darkness={0.32} />
          {/* film grain dialed WAY back: 0.5 premultiply read as a sandstorm
              of speckle across the cream ground + building faces (founder:
              "shadows causing artifacts"). 0.12 keeps a faint editorial tooth */}
          <Noise premultiply opacity={0.12} />
        </EffectComposer>
      )}
    </Canvas>
  );
}
