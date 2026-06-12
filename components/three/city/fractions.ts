/* ============================================================
   FRACTIONS — the single source of truth for the unified city
   scroll structure (spec §5.1). One pinned section, +=800%.

   TUNING LAW: this const is the only tuning surface. If fatigue
   appears, shrink transits to 0.06 first — NEVER parks.
   ============================================================ */

export const FRACTIONS = {
  /** prologue: gaze beat — scrim "Your cameras already see everything."
      in 0.006, out 0.042 */
  gaze: [0.0, 0.05],
  /** copy-free dive; crumb "01 / Manufacturing →" rides 0.115–0.135 */
  dive: [0.05, 0.14],
  parks: [
    [0.14, 0.27], // Manufacturing — scrim in 0.148, out 0.246
    [0.34, 0.47], // Retail        — scrim in 0.348, out 0.446
    [0.53, 0.68], // Smart Cities  — scrim in 0.538, out 0.656; chat card 0.575–0.665
    [0.75, 0.88], // Events        — scrim in 0.758, out 0.856
  ],
  transits: [
    [0.27, 0.34], // T1 — crumb "02 / Retail →" + edge caption 0.292–0.325 at the hub pass
    [0.47, 0.53], // T2 — crumb "03 / Smart Cities →"; tower occlusion wipe at 0.50
    [0.68, 0.75], // T3 — crumb "04 / Events →"; dusk lerp; string lights ignite
  ],
  /** finale scrim in 0.895, HOLDS through the cover; motes 0.89–0.97 */
  finale: [0.88, 1.0],
} as const;

/** pin length for the unified section (replaces 450% city + 600% journey) */
export const PIN_LENGTH = "+=800%";
