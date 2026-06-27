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

/**
 * STACK — the third verb, added for the Scale-adapted "how the AI sees" beats.
 * A camera frame EXPLODES into its translucent perception layers (feed →
 * detections → wireframe → on-prem data plane) in 3D and reassembles. Slow,
 * dimensional, scroll-scrubbed (so it reads as linear `ease:none` against
 * scroll); pointer adds a gentle spring-y parallax tilt on top.
 *
 * Used by the hero (explode on enter) and resolved by the close (collapse back
 * into one watched frame) so the page opens and closes on the same gesture.
 */
export const STACK_SPRING = {
  type: "spring",
  stiffness: 90,
  damping: 22,
  mass: 1,
} as const;

/** word-fill (What It Is): the dim→bright sweep eases per word as it lands. */
export const FILL_CSS = LOCK_CSS;

/**
 * The page's dark/light rhythm (Scale's cinematic↔editorial alternation), so
 * every section knows which beat it is and the transitions between them land:
 *   Hero(dark) → WhatItIs(light) → LivingCity(warm) → Talk(dark) →
 *   WatchFloor(dark) → Proof(light) → Close(dark).
 * Dark beats carry the 3D/stack motion; light beats are the calm editorial
 * exhale (word-fill, count-ups). Adjacent same-tone beats get a seam (a sheet
 * slide or a tone wash) rather than a hard cut.
 */
export const RHYTHM = ["dark", "light", "warm", "dark", "dark", "light", "dark"] as const;
