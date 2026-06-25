/**
 * Query Room channel data — one real query → real answer per vertical.
 *
 * The camera-ID grammar (CCTV-NNN-XX-N-X-NN-XN) mirrors Triya's actual product
 * output (see /public/images/product/triya-ai-chat.png), so the demo reads as a
 * real system, not a UI mock. Answers are written in Triya's voice and carry
 * live telemetry (camera, timestamp, latency). Bounding-box coords are percent
 * of the viewport; they're tuned to sit on the action in the current B-roll and
 * are the one thing to retune when the purpose-built Seedance clips land.
 */

export interface AnswerSeg {
  t: string;
  /** emphasized run — camera IDs, timestamps, the load-bearing facts */
  em?: boolean;
}

export interface BoundingBox {
  /** all values are % of the viewport box */
  x: number;
  y: number;
  w: number;
  h: number;
  label: string;
  /** how Triya draws the finding: a hollow detection box, or a filled density
   *  zone (so switching channel feels like switching capability, not footage) */
  mode?: "box" | "zone";
}

export interface Channel {
  id: string;
  index: string;
  label: string;
  verb: string;
  cameraId: string;
  location: string;
  timestamp: string;
  query: string;
  answer: AnswerSeg[];
  box: BoundingBox;
  /** terse result chips under the answer */
  matchChip: string;
  latency: string;
  /** active footage (falls back to poster + gradient until Seedance clips drop) */
  video: string;
  poster: string;
}

export const CHANNELS: Channel[] = [
  {
    id: "manufacturing",
    index: "01",
    label: "Manufacturing",
    verb: "Catch safety violations before they cost you",
    cameraId: "CCTV-131-LT-2-G-38-B1",
    location: "Assembly Line 3 · Press Bay",
    timestamp: "14:22:07",
    query: "Show me anyone on the floor without a hard hat in the last hour.",
    answer: [
      { t: "1 worker on " },
      { t: "CCTV-131", em: true },
      { t: " entered the press area at " },
      { t: "14:22", em: true },
      {
        t: " without a hard hat. PPE compliance held everywhere else this hour. Ready to flag the clip to your shift supervisor.",
      },
    ],
    box: { x: 37, y: 28, w: 27, h: 46, label: "NO HARD HAT" },
    matchChip: "1 match",
    latency: "0.3s",
    video: "/videos/manufacturing_hero_1.mp4",
    poster: "/images/industries/manufacturing_1.png",
  },
  {
    id: "retail",
    index: "02",
    label: "Retail",
    verb: "Find the moment in seconds, not shifts",
    cameraId: "CCTV-204-RT-1-F-12-A2",
    location: "Aisle 6 · Electronics",
    timestamp: "17:48:31",
    query: "When did someone leave a bag unattended near aisle 6 today?",
    answer: [
      { t: "A backpack was left at the aisle-6 endcap on " },
      { t: "CCTV-204", em: true },
      { t: " at " },
      { t: "17:48", em: true },
      {
        t: " and sat there for 4m12s before the owner returned. No theft event tied to it — here’s the exact frame.",
      },
    ],
    box: { x: 43, y: 41, w: 22, h: 34, label: "UNATTENDED BAG" },
    matchChip: "1 match",
    latency: "0.4s",
    video: "/videos/retail_hero_1.mp4",
    poster: "/images/industries/retail_1.png",
  },
  {
    id: "smart-cities",
    index: "03",
    label: "Smart Cities",
    verb: "See the incident the instant it happens",
    cameraId: "CCTV-069-SC-3-J-30-C1",
    location: "Junction 30 · Eastbound",
    timestamp: "19:03:55",
    query: "Has any vehicle driven against traffic at junction 30 tonight?",
    answer: [
      { t: "One vehicle entered eastbound against the flow on " },
      { t: "CCTV-069", em: true },
      { t: " at " },
      { t: "19:03", em: true },
      {
        t: ". Direction confirmed across 3 frames and the plate is captured. Ready to raise as a live incident for your traffic desk.",
      },
    ],
    box: { x: 33, y: 44, w: 31, h: 30, label: "WRONG WAY" },
    matchChip: "1 incident",
    latency: "0.3s",
    video: "/videos/smartcity_hero_1.mp4",
    poster: "/images/industries/smart-cities_1.png",
  },
  {
    id: "events",
    index: "04",
    label: "Events",
    verb: "Move the crowd before it becomes a crush",
    cameraId: "CCTV-318-EV-2-H-22-D4",
    location: "North Gate · Concourse",
    timestamp: "20:41:12",
    query: "Where is the crowd getting too dense right now?",
    answer: [
      { t: "Density at the North Gate concourse (" },
      { t: "CCTV-318", em: true },
      { t: ") crossed your threshold at " },
      { t: "20:41", em: true },
      {
        t: " — about 4.1 people/m². Two adjacent zones still have headroom; suggesting a redirect before it builds.",
      },
    ],
    box: { x: 39, y: 24, w: 34, h: 46, label: "DENSITY SPIKE", mode: "zone" },
    matchChip: "1 zone",
    latency: "0.2s",
    video: "/videos/event_hero_4.mp4",
    poster: "/images/industries/events_1.png",
  },
];

/** plain-string answer (for reduced-motion / no-JS legibility) */
export function answerToText(segs: AnswerSeg[]): string {
  return segs.map((s) => s.t).join("");
}
