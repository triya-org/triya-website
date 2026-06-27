"use client";

import { useEffect, useState } from "react";

/**
 * Tracks the user's `prefers-reduced-motion` setting.
 * All scroll-scrubbed / 3D motion must be gated on this so the site stays
 * usable and beautiful for users who opt out of motion.
 */
export function usePrefersReducedMotion(): boolean {
  // Lazy initial read so opt-out users don't get one animated frame before the
  // effect runs (SSR-safe: window is absent on the server → false).
  const [reduced, setReduced] = useState(() =>
    typeof window !== "undefined" &&
    typeof window.matchMedia === "function"
      ? window.matchMedia("(prefers-reduced-motion: reduce)").matches
      : false,
  );

  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    setReduced(mq.matches);
    const handler = () => setReduced(mq.matches);
    mq.addEventListener("change", handler);
    return () => mq.removeEventListener("change", handler);
  }, []);

  return reduced;
}

/** One-off WebGL capability probe (safe on the server: returns false). */
export function detectWebGL(): boolean {
  if (typeof window === "undefined") return false;
  try {
    const canvas = document.createElement("canvas");
    return !!(
      window.WebGLRenderingContext &&
      (canvas.getContext("webgl") || canvas.getContext("experimental-webgl"))
    );
  } catch {
    return false;
  }
}

/**
 * Master gate for the cinematic 3D layer. Returns true only when the device
 * can render WebGL AND the user hasn't opted out of motion / data usage.
 * Falls back to `false` during SSR and on the first client paint, so the
 * non-WebGL experience renders first and the canvas mounts in progressively.
 */
export function useCanRender3D(): boolean {
  const reduced = usePrefersReducedMotion();
  const [capable, setCapable] = useState(false);

  useEffect(() => {
    const conn = (navigator as unknown as { connection?: { saveData?: boolean } }).connection;
    const saveData = Boolean(conn?.saveData);
    setCapable(detectWebGL() && !saveData);
  }, []);

  return capable && !reduced;
}
