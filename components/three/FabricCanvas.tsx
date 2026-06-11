"use client";

import { useEffect, useState } from "react";
import { Canvas } from "@react-three/fiber";
import { LivingFabric } from "./LivingFabric";

/**
 * R3F <Canvas> host for the Living Fabric. Client-only; meant to be
 * dynamically imported with `ssr: false` (see HeroFabric) so the static
 * export never tries to render WebGL at build time.
 *
 * Perf guards: DPR capped (lower on mobile), point count scaled down on
 * mobile, and the render loop pauses when the document is hidden.
 */
export function FabricCanvas() {
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
      camera={{ position: [0, 0, 12], fov: 55 }}
      dpr={[1, isMobile ? 1.5 : 2]}
      gl={{ antialias: true, alpha: true, powerPreference: "high-performance" }}
      style={{ background: "transparent" }}
    >
      <LivingFabric count={isMobile ? 2800 : 5500} />
    </Canvas>
  );
}
