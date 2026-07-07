/**
 * Detection-scenario data for the Command Room.
 *
 * The Triya app's "Scenarios & Alerts" are always-on AI detections a customer
 * enables (Intrusion Detection, No Parking Zone, Crowd Gathering, …). The
 * landing console DEMOS a few flagships firing on real footage; the detection
 * wall shows the full library.
 *
 * Camera-ID grammar (CCTV-NNN-XX-N-X-NN-XN) mirrors Triya's real product output
 * so the demo reads as a live system. Box coords are % of the viewport, tuned to
 * the current B-roll (the one thing to retune when purpose-built clips land).
 */

export type Category = "security" | "safety" | "compliance" | "operations";

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
  /** hollow detection box, or a filled density zone */
  mode?: "box" | "zone";
}

/** a flagship scenario — has live footage + a resolve demo in the console */
export interface Channel {
  id: string;
  index: string;
  label: string; // scenario name
  category: Category;
  detects: string[];
  verb: string; // one-line description
  /** short natural-language form, for the "ask it yourself" chips */
  chip: string;
  cameraId: string;
  location: string;
  timestamp: string;
  query: string;
  answer: AnswerSeg[];
  box: BoundingBox;
  matchChip: string;
  latency: string;
  video: string;
  poster: string;
}

export const CHANNELS: Channel[] = [
  {
    id: "uniform-compliance",
    index: "01",
    label: "Uniform Compliance",
    category: "compliance",
    detects: ["Person"],
    verb: "Flag anyone out of required PPE or uniform",
    chip: "Anyone missing their hi-vis vest?",
    cameraId: "CCTV-131-LT-2-G-38-B1",
    location: "Assembly Line 3 · Press Bay",
    timestamp: "14:22:07",
    query: "Flag anyone on the floor not in the required hi-vis.",
    answer: [
      { t: "1 worker on " },
      { t: "CCTV-131", em: true },
      { t: " entered the press bay at " },
      { t: "14:22", em: true },
      {
        t: " without a hi-vis vest — required for that zone. Compliance held everywhere else this hour. Alert raised to the shift supervisor.",
      },
    ],
    box: { x: 13, y: 8, w: 31, h: 86, label: "NO HI-VIS VEST" },
    matchChip: "1 alert",
    latency: "0.3s",
    video: "/videos/manufacturing_hero_1.mp4",
    poster: "/images/scenarios/manufacturing.jpg",
  },
  {
    id: "intrusion",
    index: "02",
    label: "Intrusion Detection",
    category: "security",
    detects: ["Person"],
    verb: "Catch anyone in a zone they shouldn’t be in",
    chip: "Anyone in a restricted area?",
    cameraId: "CCTV-204-RT-1-F-12-A2",
    location: "Stockroom Corridor · Aisle 6",
    timestamp: "17:48:31",
    query: "Has anyone entered the restricted stockroom area?",
    answer: [
      { t: "An unauthorized person entered the stockroom corridor on " },
      { t: "CCTV-204", em: true },
      { t: " at " },
      { t: "17:48", em: true },
      {
        t: " — no clearance on file for that zone. Clip flagged and security notified on the spot.",
      },
    ],
    box: { x: 43, y: 26, w: 20, h: 48, label: "UNAUTHORIZED" },
    matchChip: "1 alert",
    latency: "0.4s",
    video: "/videos/intrusion_detection.mp4",
    poster: "/images/scenarios/intrusion_detection.jpg",
  },
  {
    id: "no-parking",
    index: "03",
    label: "No Parking Zone",
    category: "security",
    detects: ["Vehicle"],
    verb: "Spot vehicles loitering where they shouldn’t",
    chip: "A vehicle parked in a no-stop zone?",
    cameraId: "CCTV-069-SC-3-J-30-C1",
    location: "Junction 30 · Eastbound",
    timestamp: "19:03:55",
    query: "Any vehicle stopped in the no-parking zone at junction 30?",
    answer: [
      { t: "A vehicle has been stationary in the no-parking zone on " },
      { t: "CCTV-069", em: true },
      { t: " since " },
      { t: "19:03", em: true },
      {
        t: " — past the 3-minute limit. Plate captured across 3 frames. Raised as a live incident for your traffic desk.",
      },
    ],
    box: { x: 33, y: 44, w: 31, h: 30, label: "PARKING VIOLATION" },
    matchChip: "1 incident",
    latency: "0.3s",
    video: "/videos/smartcity_hero_1.mp4",
    poster: "/images/scenarios/smartcity.jpg",
  },
  {
    id: "crowd",
    index: "04",
    label: "Crowd Gathering",
    category: "safety",
    detects: ["Person"],
    verb: "Move the crowd before it becomes a crush",
    chip: "Where’s the crowd too dense?",
    cameraId: "CCTV-318-EV-2-H-22-D4",
    location: "North Gate · Concourse",
    timestamp: "20:41:12",
    query: "Where is a crowd building past safe limits?",
    answer: [
      { t: "Density at the North Gate concourse (" },
      { t: "CCTV-318", em: true },
      { t: ") crossed your safe threshold at " },
      { t: "20:41", em: true },
      {
        t: " — about 4.1 people/m². Two adjacent zones still have headroom; alerting before it builds.",
      },
    ],
    box: { x: 39, y: 24, w: 34, h: 46, label: "CROWD DENSITY", mode: "zone" },
    matchChip: "1 zone",
    latency: "0.2s",
    video: "/videos/event_hero_4.mp4",
    poster: "/images/scenarios/events.jpg",
  },
];

/* ── the full detection library (the "standing watch" wall) ── */

export type ScenarioStatus = "active" | "available" | "soon";

/** a still "preview" for an available (no-live-footage) scenario in the deck */
export interface ScenarioPreview {
  poster: string;
  cameraId: string;
  location: string;
  timestamp: string;
  box: BoundingBox;
  /** plain-language alert behaviour, shown in the deck detail */
  alert: string;
}

export interface Scenario {
  id: string;
  name: string;
  category: Category;
  detects: string[];
  description: string;
  status: ScenarioStatus;
  /** if this scenario is one of the flagships, the CHANNELS id to demo on click */
  demoId?: string;
  /** for available scenarios (no flagship footage): a still detection preview */
  preview?: ScenarioPreview;
}

export const CATEGORY_LABELS: Record<Category, string> = {
  security: "Security",
  safety: "Safety",
  compliance: "Compliance",
  operations: "Operations",
};

export const CATEGORY_ORDER: Category[] = [
  "security",
  "safety",
  "compliance",
  "operations",
];

export const SCENARIOS: Scenario[] = [
  // security
  {
    id: "intrusion",
    name: "Intrusion Detection",
    category: "security",
    detects: ["Person"],
    description: "Unauthorized persons in a camera view, flagged the instant they appear.",
    status: "active",
    demoId: "intrusion",
  },
  {
    id: "no-parking",
    name: "No Parking Zone",
    category: "security",
    detects: ["Vehicle"],
    description: "Vehicles that linger in restricted areas past a set duration.",
    status: "active",
    demoId: "no-parking",
  },
  // safety
  {
    id: "crowd",
    name: "Crowd Gathering",
    category: "safety",
    detects: ["Person"],
    description: "Sustained crowds in a zone, with an AI second pass to kill false positives.",
    status: "active",
    demoId: "crowd",
  },
  {
    id: "smoking",
    name: "Smoking Detection",
    category: "safety",
    detects: ["Person", "Behavior"],
    description: "Smoking in restricted zones — multi-layer AI with auto-validation.",
    status: "available",
    preview: {
      poster: "/images/scenarios/manufacturing.jpg",
      cameraId: "CCTV-077-MF-1-D-09-S2",
      location: "Loading Dock · No-Smoking Zone",
      timestamp: "11:36:02",
      box: { x: 52, y: 22, w: 34, h: 48, label: "NO-SMOKING ZONE", mode: "zone" },
      alert: "Raises only after a multi-layer pass confirms it — so steam and exhaust don’t trip the alarm.",
    },
  },
  {
    id: "fire-smoke",
    name: "Fire & Smoke",
    category: "safety",
    detects: ["Hazard"],
    description: "Fire and smoke hazards caught by multi-stage AI that clears false alarms.",
    status: "available",
    preview: {
      poster: "/images/scenarios/manufacturing.jpg",
      cameraId: "CCTV-012-MF-2-A-03-F1",
      location: "Machine Hall · Bay 2",
      timestamp: "03:14:48",
      box: { x: 55, y: 12, w: 34, h: 46, label: "SMOKE — HAZARD", mode: "zone" },
      alert: "A multi-stage check validates the hazard before it raises, clearing dust and glare as false alarms.",
    },
  },
  // compliance
  {
    id: "uniform-compliance",
    name: "Uniform Compliance",
    category: "compliance",
    detects: ["Person"],
    description: "People missing required PPE or factory uniform after a sustained breach.",
    status: "active",
    demoId: "uniform-compliance",
  },
  {
    id: "labcoat",
    name: "Labcoat Violation",
    category: "compliance",
    detects: ["Person"],
    description: "People without a lab coat in designated clean or lab areas.",
    status: "available",
    preview: {
      poster: "/images/scenarios/manufacturing.jpg",
      cameraId: "CCTV-145-MF-3-C-21-L1",
      location: "Clean Room · Entry Vestibule",
      timestamp: "09:02:19",
      box: { x: 12, y: 6, w: 32, h: 90, label: "NO LAB COAT" },
      alert: "Flags entry to a designated clean area without a lab coat, after a sustained breach.",
    },
  },
  {
    id: "phone-usage",
    name: "Mobile Phone Usage",
    category: "compliance",
    detects: ["Person"],
    description: "Prolonged phone use in work zones or restricted areas.",
    status: "available",
    preview: {
      poster: "/images/scenarios/retail.jpg",
      cameraId: "CCTV-231-RT-1-B-14-P3",
      location: "Checkout Lane · Till 4",
      timestamp: "16:51:33",
      box: { x: 26, y: 33, w: 18, h: 62, label: "PHONE USE" },
      alert: "Triggers on prolonged phone use in a work zone — not a glance, a pattern.",
    },
  },
  // operations
  {
    id: "active-assurance",
    name: "Active Assurance",
    category: "operations",
    detects: ["Person"],
    description: "Zones that should be staffed — alerts when no one shows up in a set window.",
    status: "available",
    preview: {
      poster: "/images/scenarios/smartcity.jpg",
      cameraId: "CCTV-058-SC-2-E-17-A1",
      location: "Control Post · Gate 2",
      timestamp: "02:47:55",
      box: { x: 30, y: 56, w: 40, h: 38, label: "NO ACTIVITY", mode: "zone" },
      alert: "Inverts the usual alert — it fires when a post that should be staffed sits empty past your window.",
    },
  },
];

/** plain-string answer (for reduced-motion / no-JS legibility) */
export function answerToText(segs: AnswerSeg[]): string {
  return segs.map((s) => s.t).join("");
}
