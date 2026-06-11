"use client";

import dynamic from "next/dynamic";
import { useCanRender3D } from "@/lib/reduced-motion";

// Code-split the entire WebGL engine out of the initial bundle and never run it
// on the server (required for the static export).
const FabricCanvas = dynamic(
  () => import("./FabricCanvas").then((m) => m.FabricCanvas),
  { ssr: false },
);

/**
 * Drop-in hero background layer. Renders the Living Fabric only when the device
 * is capable and the user hasn't opted out of motion; otherwise renders nothing
 * and the existing hero (video + overlay) stands on its own.
 *
 * `pointer-events-none` keeps the CTA fully clickable through the canvas; the
 * fabric reads pointer movement from the window directly.
 */
export function HeroFabric() {
  const canRender = useCanRender3D();
  if (!canRender) return null;

  return (
    <div className="absolute inset-0 z-[1] pointer-events-none" aria-hidden="true">
      <FabricCanvas />
    </div>
  );
}
