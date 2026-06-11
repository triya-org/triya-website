# Triya.ai Website Revamp — analog.io-grade Cinematic Motion

> **Goal:** Rebuild the `triya.ai` marketing experience to feel like [analog.io](https://analog.io) — dark, cinematic, WebGL-driven, scroll-scrubbed storytelling — while staying true to Triya's brand (edge-AI spatial surveillance) and the hard constraints of the existing codebase.
>
> **Status:** Plan (no code yet). **Scope (this phase):** Landing page first. **Build location:** this repo (`triya-website`), branch `cipher/feature/revamp`.

---

## 0. Reality check — what we're actually working with

This is **not** a greenfield project. The original brief assumed a fresh Next + R3F app; the real repo is a mature site with constraints that drive every decision below.

| Fact | Source | Implication |
|---|---|---|
| **Next.js 14.2.3, App Router, React 18, TS** | `package.json` | Modern enough for R3F/GSAP. No need to scaffold. |
| **Deploys as a STATIC EXPORT to GitHub Pages** | `.github/workflows/deploy.yml` uses `configure-pages` with `static_site_generator: next` (injects `output: export`, `images.unoptimized`); `CNAME` = `www.triya.ai` | **No SSR, no runtime API routes, no `next/image` optimization in prod.** Everything cinematic must be client-side or build-time. `headers()`/`redirects()` in `next.config.js` are **ignored** on Pages. |
| **Bilingual EN / AR with RTL toggle** | `app/page.tsx` (`toggleLanguage`, `document.documentElement.dir`) | Motion + layout must work in **both LTR and RTL**. Kinetic type and horizontal scroll need mirrored variants. |
| **Warm/sand light brand palette** | `app/globals.css` (`--background: 30 41% 98%`, `--primary: 25 50% 35%` brown) + amber hero gradient (`from-yellow-400 to-orange-400`) | Tension with analog.io's dark cinematic look. Resolved below via a **dark canvas + amber signal accent** that *extends* the existing amber rather than discarding the brand. |
| **DM Sans (self-hosted) + Noto Sans Arabic** | `app/layout.tsx` `localFont` | Font strategy already CSP-safe. We add a **display face** for cinematic headlines, self-hosted. |
| **Framer Motion 12 already installed** | `package.json` | UI micro-interactions covered. We **add** Three/R3F + GSAP ScrollTrigger + Lenis. |
| **Restrictive CSP** (`font-src 'self' data:`, `connect-src 'self' + GA`) | `next.config.js` headers | Self-host all fonts/assets. No external font CDNs. (`script-src` allows `unsafe-eval` so shader compilation is fine.) Note: CSP only applies if/when moved to a header-capable host; not enforced on Pages. |
| **Existing IA**: Home, About, Blog (+ `[slug]`), FAQ, Contact, Privacy, Terms, Use-cases (manufacturing/retail/smart-cities/events) | `app/**/page.tsx` | The revamp's motion system must be **shareable** across these later. Landing first; don't break the rest. |
| **Existing homepage sections** | `components/sections/*` | ProductShowcase (6 features), HowItWorks (4 steps), UseCases (4 industries), CTASection (4 stats). **Content is solid — we restage it cinematically, we don't rewrite the value prop.** |
| **Hero video assets exist** | `public/videos/*.mp4` (hero, manufacturing, retail, smartcity, event, monitoring) | Reusable as WebGL textures / fallbacks / scene backdrops. |

**The single most important constraint: static export on GitHub Pages.** No server at runtime. This is fine for WebGL (all client-side) but means: bundle size discipline, code-split the 3D engine, no server-side personalization, and the contact form keeps whatever mechanism it uses today (Resend) — out of scope for this phase.

---

## 1. Strategic concept — the metaphor

analog.io sells "a living fabric of physical intelligence" with point-cloud/particle visuals. Triya sells **edge AI that turns any camera into intelligence**. The metaphor transfers almost 1:1:

> **"Every camera is a point of light. Triya weaves them into a living fabric of awareness — on the edge, in your language, under your control."**

The whole site is staged as a **journey from raw pixels → points → connected intelligence → human insight**:

1. **Pixels** — a dark field resolves from video noise.
2. **Points** — pixels condense into a 3D point cloud (the "living fabric"); cameras light up as nodes.
3. **Edge** — points cluster around an edge box; data stays local (no cloud tether animates away).
4. **Conversation** — the fabric responds to natural-language queries; relevant points illuminate.
5. **Insight** — points resolve into dashboards, industries, outcomes (the 85% / 24/7 / real-time stats).

This narrative is the **scroll spine**. Each landing section is one beat.

### The Living City flow (implemented)

> A blank sheet of paper holds a scatter of dormant dots — cameras no one is watching. As you scroll, the world **develops out of the paper** around them (beat 1: your cameras already see everything); intelligence arrives at the edge and the dots ignite, weaving arcs into one hub (beat 2); you ask in plain language and a block of the city answers (beat 3); and as you pull away, the clay world dissolves back into paper — but **the constellation you built remains, glowing** (beat 4 → exit), resolving into the plain-spoken features that explain how it works.

**In one sentence:** *Paper gives the world, paper takes it back — what remains is the intelligence you wove, handed to the human in command.*

Mechanics: entry = pre-pin fog-lift (fog.near/far collapse → expand, camera pre-rolls onto its spline); exit = fog rolls back in during the last 10% of the pin while the fog-exempt constellation (nodes, arcs, hub) survives the whiteout.

---

## 2. Design language

### 2.1 Color — "dark canvas, amber signal"
Pivot the *marketing surface* to dark cinematic while honoring the brand's amber. (The product/dashboard stays as-is; the dashboard concept mockups in the other repo were dark ink-blue — compatible direction.)

```
--canvas:        12 8% 4%      /* near-black, faint warm undertone */
--canvas-2:      24 10% 7%     /* raised surfaces */
--signal:        28 92% 55%    /* amber/orange — the Triya accent, extends existing hero gradient */
--signal-hot:    18 95% 52%    /* deep orange for emphasis */
--data-cool:     200 90% 60%   /* electric cyan — "AI/data" secondary, used sparingly in viz */
--ink:           36 30% 96%    /* warm off-white text */
--ink-dim:       36 12% 65%    /* muted text */
--hairline:      36 14% 18%    /* borders / grid lines */
```
- Light theme remains available for non-landing pages; landing is **dark-first**.
- Accent usage: amber is the *signal* (alerts, highlights, CTAs); cyan is the *machine* (data, points, scan lines). Never 50/50 — amber dominates, cyan punctuates.

### 2.2 Typography
- **Display:** a distinctive, characterful face for hero/section headlines — candidates: **Clash Display**, **Hanken Grotesk**, **Söhne**, or **General Sans** (self-hosted, OFL/permissive). *Avoid* Inter/Space Grotesk/Roboto. Final pick in Phase 0.
- **Body:** keep **DM Sans** (already self-hosted, brand-consistent).
- **Arabic:** keep **Noto Sans Arabic**; pair display headlines in AR with a suitable Arabic display weight (e.g. **IBM Plex Sans Arabic** or Noto bold) — never letter-space Arabic.
- **Mono accents:** a mono (e.g. **JetBrains Mono** / **Geist Mono**) for labels, coordinates, "system" microcopy (camera IDs, latency readouts) — reinforces the surveillance/edge texture. (Mirrors the dashboard concepts' Inter+JetBrains pairing.)

### 2.3 Motion principles
1. **One orchestrated entrance > scattered micro-interactions.** Hero load is the signature moment.
2. **Scroll is the camera.** GSAP ScrollTrigger + Lenis drive a scrubbed journey; sections pin and transform rather than just fade in.
3. **Physics, not linear.** Momentum (Lenis), spring easing (Framer), inertia on the point cloud. Nothing moves at constant velocity.
4. **The fabric is always alive.** Idle point-cloud drift even when not scrolling (subtle, low-GPU).
5. **Reveal, don't decorate.** Motion communicates the pixels→points→insight story; no animation that doesn't carry meaning.
6. **Respect the user.** `prefers-reduced-motion` → static, beautiful fallback (poster frames, no scrub).

---

## 3. Technical architecture

### 3.1 Stack additions (on top of existing Next 14 / Tailwind / Framer / Radix)
```
three                      WebGL engine
@react-three/fiber         React renderer for three
@react-three/drei          helpers (loaders, controls, perf)
@react-three/postprocessing + postprocessing   bloom / film grain / DOF
gsap  (+ ScrollTrigger)    scroll-scrubbed timelines
lenis (@studio-freight/lenis)  momentum smooth-scroll
maath / leva(dev only)     math helpers / debug controls
```
All are **client-only** and tree-shakeable. The 3D engine is loaded via `next/dynamic({ ssr:false })` so static export never tries to render WebGL at build time.

### 3.2 Static-export safety
- 3D + scroll components are `"use client"` and dynamically imported with `ssr:false`.
- No new API routes (none would run on Pages anyway).
- `next/image` already effectively unoptimized in export — keep using plain `<img>`/existing `Image` with `unoptimized`.
- Verify `next build` (export path) produces a working `out/` locally before any deploy.

### 3.3 Performance budget (GitHub Pages = dumb static host, no edge)
- **Hero 3D chunk lazy-loaded & code-split**; initial HTML/CSS paints instantly with a CSS-only hero poster.
- Point cloud: instanced points / `BufferGeometry`, target **≤ 60k points desktop / ≤ 15k mobile**, DPR-capped (`min(devicePixelRatio, 2)`, 1.5 on mobile).
- Pause RAF when canvas off-screen (IntersectionObserver) and on `document.hidden`.
- Mobile + low-power → **2D fallback** (animated gradient/grain + video poster), no WebGL.
- Targets: LCP < 2.5s on 4G mid-tier mobile (hero text is real DOM, not in canvas), TBT low via deferred 3D, CLS ~0.

### 3.4 Accessibility & i18n
- `prefers-reduced-motion`: disable scrub/parallax/point-drift; show curated static frames. Single source of truth via a `useReducedMotion` gate around all timelines.
- All hero/section copy is **real selectable DOM text** layered over the canvas (SEO + a11y); canvas is `aria-hidden`.
- **RTL:** Lenis works in both; GSAP horizontal/x-based tweens read a `dir` sign factor; kinetic type mirrors. Test every pinned section in AR.
- Keyboard: skip-to-content, focus-visible rings in `--signal`, no focus traps in canvas.
- Maintain existing SEO (`seo-config.ts`, structured data, sitemap) — don't regress.

### 3.5 Code organization
```
components/
  three/                # R3F scenes, shaders, materials
    LivingFabric.tsx    # the point-cloud system
    shaders/*.glsl(.ts) # GLSL as TS template strings (CSP-safe, no fetch)
    FabricCanvas.tsx    # dynamic(ssr:false) wrapper + perf guards
  scroll/
    SmoothScroll.tsx    # Lenis provider
    useScrollScene.ts   # GSAP ScrollTrigger hooks
  sections/landing/     # new cinematic sections (parallel to existing sections/)
lib/
  motion-variants.ts    # extend existing file
  reduced-motion.ts
```
Keep existing `components/sections/*` intact; new landing composes new staged versions so we can A/B and roll back by swapping `app/page.tsx`.

---

## 4. Landing page — section-by-section

Each beat maps to the metaphor (§1). Existing copy reused unless noted.

| # | Section | Visual / Motion | Source content |
|---|---|---|---|
| **0** | **Preloader** (optional) | Brief "calibrating fabric" — points seek positions; resolves into hero. Skippable, ≤1.2s, reduced-motion → instant. | new |
| **1** | **Hero — "Living Fabric"** | Full-viewport WebGL point cloud drifting in 3D; camera nodes pulse amber. Headline staggers in over it (existing: *"UAE's Leading Edge AI Surveillance Platform"*). Mouse parallax. CTA "Request Demo". | `app/page.tsx` hero |
| **2** | **Pixels → Points** | Scroll-scrubbed: a video feed (reuse `hero_1.mp4` as texture) dissolves into the point cloud — literal "any camera becomes intelligence." | new (uses existing video) |
| **3** | **How It Works (Edge journey)** | Pin section; 4 steps (Camera → Edge Box → AI Agents → Command Center) reveal as the camera flies along the fabric; a "cloud tether" animates away on the Edge step (data sovereignty). | `how-it-works.tsx` |
| **4** | **Features** | The 6 feature cards (85% savings, Sovereign AI, 90% faster, no lock-in, analytics, multi-industry) emerge as illuminated clusters; magnetic hover, amber glow. | `product-showcase.tsx` |
| **5** | **Conversation** | "Ask the fabric" beat — a natural-language query types in (30+ languages / Arabic), and the relevant points in the cloud light up. Demonstrates the conversational investigation feature. | new (from feature copy) |
| **6** | **Industries** | Horizontal scroll / pinned panels: Manufacturing, Retail, Smart Cities, Events — each with its existing hero video + slug link. RTL-aware direction. | `use-cases.tsx` + `public/videos/*` |
| **7** | **Stats / Outcome** | Points resolve into the 4 stats (85% / 24/7 / Real-time / 360°) counting up; the fabric settles into an ordered grid (chaos → insight). | `cta-section.tsx` |
| **8** | **CTA + Footer** | Calm closer; fabric dims to embers. "Schedule Demo / Contact Sales". Existing footer. | `cta-section.tsx`, `footer` |

Language toggle + dark/light handling restyled to match the new dark canvas.

---

## 5. The "Living Fabric" WebGL system (hero centerpiece)

- **Geometry:** `BufferGeometry` of N points; positions seeded from a 3D noise field shaped like a sloping plane/wave ("fabric"). Subset flagged as **camera nodes** (brighter, pulsing).
- **Material:** custom `ShaderMaterial` (GLSL as TS strings, CSP-safe). Vertex shader: curl-noise drift + scroll-driven morph (uniform `uProgress`). Fragment: soft circular points, amber↔cyan mix by depth/state, additive blending.
- **States driven by scroll uniforms:** `uProgress` morphs the cloud between beats (video-dissolve → fabric → edge-cluster → query-highlight → ordered-grid).
- **Post:** subtle bloom on nodes + light film grain for cinematic texture (toggle off on low-power).
- **Interaction:** pointer parallax (damped); on the Conversation beat, raycast-free "highlight" via shader uniform from query state.
- **Perf:** instanced, DPR-capped, RAF-gated; mobile uses lower N + simpler shader; reduced-motion uses a single static rendered frame or CSS fallback.

---

## 6. Performance & fallback ladder

1. **Capable desktop:** full point cloud + post + scrub.
2. **Mid mobile:** reduced N, no post, lighter scrub.
3. **Low-power / save-data / reduced-motion / WebGL-unavailable:** CSS gradient-mesh + grain + video poster, Framer fade-ins only (no GSAP scrub). Detect via `navigator.connection`, `matchMedia`, and a WebGL capability probe.

Every section must be **legible and complete with zero JS-driven motion** — motion is enhancement, never a dependency for content.

---

## 7. Phased delivery

| Phase | Output | Done when |
|---|---|---|
| **P0 — Foundations** | Install deps; add `SmoothScroll` (Lenis), `FabricCanvas` dynamic wrapper, dark-canvas tokens in `globals.css`, display+mono fonts self-hosted, reduced-motion gate. | App still builds as static export; hero shows a basic live point cloud; no regressions on other pages. |
| **P1 — Hero** | Signature hero (§5): point cloud + staggered headline + parallax + CTA + CSS fallback. | Hero feels "analog.io-grade" on desktop; graceful fallback on mobile/reduced-motion. |
| **P2 — Scroll spine** | Lenis + GSAP ScrollTrigger wired; beats 2–4 (pixels→points, How It Works edge journey). RTL verified. | Scrubbed narrative works LTR + RTL, 60fps desktop. |
| **P3 — Remaining sections** | Beats 5–8 (Conversation, Industries horizontal, Stats count-up, CTA/footer) restaged. | Full landing complete end-to-end. |
| **P4 — Polish & perf** | Bloom/grain tuning, bundle splitting, Lighthouse pass, a11y/i18n audit, cross-browser/mobile QA. | LCP/CLS/TBT budgets met; AR + reduced-motion + low-power all clean. |
| **P5 (later, out of this phase)** | Propagate motion system to About / Industries detail / Blog / FAQ. | Consistent system site-wide. |

Each phase ends on a green static-export build and is independently reviewable; `app/page.tsx` can swap back to the current homepage at any time (rollback safety).

---

## 8. Open decisions (need your call before/while building)

1. **Brand pivot to dark landing** — OK to make the landing dark-cinematic (amber accent) while keeping the rest of the site as-is? (Recommended; matches analog.io + the product's nature + the dashboard concepts.) Or keep the warm light theme and go cinematic *within* it?
2. **Display font** — pick the headline face in P0 (Clash Display / General Sans / Hanken Grotesk / Söhne). Any brand font you must use?
3. **Preloader** — include the short "calibrating" intro (beat 0) or skip straight to hero?
4. **Motion intensity confirm** — you chose **Cinematic (full WebGL)**; given GitHub Pages + mobile, I'll ship cinematic-on-capable + strong fallbacks. OK?
5. **Deploy target** — staying on GitHub Pages static export, or is a move to Vercel (SSR, image opt, real headers) on the table? Affects perf ceiling, not the design.

---

*Built from inspection of the live repo on branch `cipher/feature/revamp`. Existing value prop, bilingual content, and SEO are preserved; this revamp restages them cinematically — it does not rewrite the message.*
