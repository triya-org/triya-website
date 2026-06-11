"use client";

import { useEffect, useState } from "react";
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
import { CityScene } from "./CityScene";

interface CityCanvasProps {
  progressRef: React.MutableRefObject<number>;
  entryRef?: React.MutableRefObject<number>;
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
export function CityCanvas({ progressRef, entryRef }: CityCanvasProps) {
  const [isMobile, setIsMobile] = useState(false);
  const [frameloop, setFrameloop] = useState<"always" | "never">("always");

  useEffect(() => {
    setIsMobile(window.matchMedia("(max-width: 767px)").matches);
    const onVisibility = () =>
      setFrameloop(document.hidden ? "never" : "always");
    document.addEventListener("visibilitychange", onVisibility);
    return () => document.removeEventListener("visibilitychange", onVisibility);
  }, []);

  return (
    <Canvas
      frameloop={frameloop}
      shadows={!isMobile}
      camera={{ position: [0, 52, 92], fov: 32, near: 0.5, far: 460 }}
      dpr={[1, isMobile ? 1.5 : 1.75]}
      gl={{ antialias: isMobile, powerPreference: "high-performance" }}
    >
      {!isMobile && <SoftShadows size={32} samples={12} focus={0.6} />}
      <CityScene
        progressRef={progressRef}
        entryRef={entryRef}
        quality={isMobile ? "low" : "high"}
      />
      {!isMobile && (
        <EffectComposer multisampling={4}>
          <Bloom
            mipmapBlur
            intensity={0.75}
            luminanceThreshold={1}
            luminanceSmoothing={0.15}
          />
          <BrightnessContrast brightness={0} contrast={0.06} />
          <HueSaturation saturation={0.14} />
          <Vignette eskil={false} offset={0.28} darkness={0.32} />
          <Noise premultiply opacity={0.5} />
        </EffectComposer>
      )}
    </Canvas>
  );
}
