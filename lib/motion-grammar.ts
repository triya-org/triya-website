/**
 * The Triya landing "Standing Watch" motion grammar — ONE vocabulary, two verbs.
 *
 *   DRIFT — slow, atmospheric, scrubbed. Watching. Reveals, parallax, lifts.
 *   LOCK  — fast settle, decisive. Caught. Detection boxes, result snaps.
 *
 * Surveillance is long calm punctuated by a sharp catch; the page should move
 * the same way. If a transition isn't drift or lock, it doesn't ship.
 *
 * Exported in three shapes so CSS, Framer Motion and GSAP all speak it:
 *   *_CSS   → cubic-bezier() strings for inline style / className transitions
 *   DRIFT / LOCK arrays → Framer Motion `transition.ease`
 *   *_GSAP  → the closest GSAP named ease (site convention already uses these)
 */

export const DRIFT_CSS = "cubic-bezier(0.22, 1, 0.36, 1)";
export const LOCK_CSS = "cubic-bezier(0.16, 1, 0.3, 1)";

/** Framer Motion easing tuples. */
export const DRIFT = [0.22, 1, 0.36, 1] as const;
export const LOCK = [0.16, 1, 0.3, 1] as const;

/** GSAP named eases (matched to the curves above; site already standardises here). */
export const DRIFT_GSAP = "power3.out";
export const DRIFT_GSAP_STRONG = "power4.out";
export const LOCK_GSAP = "expo.out";

/** Canonical durations (seconds). Micro for hovers, reveal for entrances,
 *  scan for the watching sweep, lock for the catch. */
export const DUR = {
  micro: 0.2,
  reveal: 0.8,
  scan: 1.1,
  lock: 0.42,
} as const;
