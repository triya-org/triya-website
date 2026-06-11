"use client";

import { useEffect, useState } from "react";
import { Canvas } from "@react-three/fiber";
import {
  EffectComposer,
  Bloom,
  Vignette,
  Noise,
  BrightnessContrast,
  HueSaturation,
} from "@react-three/postprocessing";
import { JourneyScene } from "./JourneyScene";

interface JourneyCanvasProps {
  progressRef: React.MutableRefObject<number>;
  entryRef?: React.MutableRefObject<number>;
  /** flips to true when the section is covered/off-screen → frameloop "never"
      (never two live PCSS+post stacks on one page) */
  coveredRef?: React.MutableRefObject<boolean>;
  dir?: 1 | -1;
}

export function JourneyCanvas({ progressRef, entryRef, coveredRef, dir = 1 }: JourneyCanvasProps) {
  const [frameloop, setFrameloop] = useState<"always" | "never">("always");

  useEffect(() => {
    const decide = () =>
      setFrameloop(document.hidden || coveredRef?.current ? "never" : "always");
    document.addEventListener("visibilitychange", decide);
    const id = setInterval(decide, 300); // coveredRef is a plain ref — poll cheaply
    return () => {
      document.removeEventListener("visibilitychange", decide);
      clearInterval(id);
    };
  }, [coveredRef]);

  return (
    <Canvas
      frameloop={frameloop}
      shadows
      camera={{ position: [-30, 9, 34], fov: 38, near: 0.5, far: 240 }}
      dpr={[1, 1.75]}
      gl={{ antialias: false, powerPreference: "high-performance" }}
    >
      {/* NO <SoftShadows> here: drei patches three's GLOBAL shader chunks,
          and the Living City's instance already applies PCSS to every
          program compiled after it — mounting it twice double-injects the
          PCSS functions and breaks compilation of all standard materials */}
      <JourneyScene progressRef={progressRef} entryRef={entryRef} dir={dir} />
      <EffectComposer multisampling={4}>
        <Bloom mipmapBlur intensity={0.75} luminanceThreshold={1} luminanceSmoothing={0.15} />
        <BrightnessContrast brightness={0} contrast={0.06} />
        <HueSaturation saturation={0.14} />
        <Vignette eskil={false} offset={0.28} darkness={0.32} />
        <Noise premultiply opacity={0.5} />
      </EffectComposer>
    </Canvas>
  );
}
