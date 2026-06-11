"use client";

import { useEffect, useLayoutEffect } from "react";

/**
 * useLayoutEffect on the client (runs before paint, so GSAP can set start
 * states without a flash), useEffect on the server (avoids the SSR warning).
 */
export const useIsomorphicLayoutEffect =
  typeof window !== "undefined" ? useLayoutEffect : useEffect;
