# Triya Website — Technical SEO Implementation Spec (Tasks 1–6)

**Repo:** `triya-org/triya-website`
**Prepared for:** AI coding agents (e.g. Claude Code) executing fixes
**Goal:** Fix the technical and on-page SEO foundation so Triya's pages are crawlable, correctly targeted, and trustworthy to search engines. This document does NOT cover off-page work (backlinks, PR, directory listings) — that is a separate, non-code workstream.

---

## 0. Context the agent must know before starting

**Stack:** Next.js 14.2.3 (App Router), TypeScript, Tailwind, deployed as a **static export to GitHub Pages** via `.github/workflows/deploy.yml` (`next export`, `.nojekyll`, `CNAME = www.triya.ai`).

**Critical architectural facts:**
- **Every page (`app/**/page.tsx`) is a client component** (`"use client"`). Client components cannot export the Next.js `metadata` object.
- Per-page SEO metadata is therefore set in **server-component `layout.tsx` files** (one per route, e.g. `app/about/layout.tsx`), each of which does `export const metadata = pageMetadata.<key>` importing from **`app/lib/seo-config.ts`**.
- The root `app/layout.tsx` injects global `<OrganizationSchema />` and `<LocalBusinessSchema />`; the homepage `app/page.tsx` injects `<ProductSchema />`; `app/faq/layout.tsx` injects `<FAQSchema />`. All schema components live in **`app/components/structured-data.tsx`**.
- Because the site is a **static export**, anything in `next.config.js` that requires a Node server at runtime (custom `headers()`, `redirects()`, server-side image optimization) **does not run in production.** Keep this in mind for Task 3.

**Global guardrails for the agent:**
1. Work on a feature branch; open a PR. Do not push directly to `main`.
2. After every change, run `npm run build` locally and confirm it succeeds with no new type errors.
3. Do not invent facts, statistics, awards, ratings, or claims. If a value cannot be verified, remove it rather than guessing.
4. Preserve existing styling/design unless a task explicitly requires markup changes.
5. Where this spec proposes copy (titles, H1s), treat it as a **strong default to implement**, but flag it in the PR description so a human can adjust wording.

**Suggested execution order (by impact ÷ effort):** Task 4 → Task 5 → Task 1 → Task 2 → Task 3 → Task 6.

---

## TASK 1 — Make the homepage render its content in HTML (server-side / at build time)

### Problem (current state)
`app/page.tsx` is a client component containing:

```tsx
const [mounted, setMounted] = useState(false);
useEffect(() => { setMounted(true); /* ... */ }, []);
if (!mounted) { return null; }
```

Because the site is statically exported, the build-time render runs with `mounted === false`, so **the generated `index.html` for the homepage contains no `<h1>`, no hero copy, and no body text** — content only appears after JavaScript hydrates in the browser. This was confirmed externally: the homepage's search listing shows only the meta description, with no body snippet. The homepage is the most important URL on the site and currently ships an empty shell to crawlers.

### Why it matters
Google can render JavaScript, but it does so on a delayed, best-effort basis. Shipping zero crawlable body HTML on your flagship page slows indexing, weakens topical relevance signals, and removes all on-page keyword content from the most authoritative URL. This is the highest-priority technical fix.

### What to change
**File: `app/page.tsx`**

Remove the render-blocking pattern so the page's content is present in the static HTML.

1. **Delete the `if (!mounted) return null;` early return entirely.**
2. Remove the `mounted` state gate. The component should render its full markup on first paint (server/build-time render), defaulting to English (`language = "en"`).
3. Keep the language toggle and `localStorage` read, but make them **progressive enhancements** that run in `useEffect` *after* the initial render — they must not block or replace the initial HTML. Initializing `useState<"en"|"ar">("en")` and updating it inside `useEffect` is fine; the key requirement is that the first render already outputs the English hero/body markup.
4. The lazy-loaded background `<video>` can stay gated behind a state flag — video is not SEO-critical — **but the `<h1>`, subtitle `<p>`, CTAs, and the `ProductShowcase` / `HowItWorks` / `UseCases` / `CTASection` content must render unconditionally on first paint.**

### Cross-cutting recommendation (apply if in scope)
The same `"use client"` + `useState`-for-language pattern is used on every page. Even where it doesn't return `null`, it ships unnecessary JS and prevents use of the native metadata API. A stronger long-term refactor is to make the page bodies **server components** and move the small interactive bits (language toggle, video modal) into isolated child client components. Not required for Task 1, but note it in the PR as a follow-up.

### Acceptance criteria
- `curl https://www.triya.ai/` (or the built `out/index.html`) contains the literal hero headline text and subtitle in the raw HTML, with JavaScript disabled.
- `npm run build` succeeds.
- Visual appearance and language toggle behavior are unchanged in the browser.

---

## TASK 2 — Re-target titles, H1s, and URLs to the keywords customers actually search

### Problem (current state)
The entire site is optimized around **"AI surveillance platform"** and **"85% cost savings."** The phrases prospects search — **"video analytics," "CCTV analytics," "video insights"** — are nearly absent from title tags, H1s, and URLs. Competitors who rank for these terms (Avigilon, Bosch, VOLT AI, viAct, icetana, visionplatform.ai) put the exact phrase in the page `<title>`, the URL slug, and the `<h1>`.

Current homepage `<title>`: *"Triya | UAE's Leading AI Surveillance Platform - Dubai, Abu Dhabi"*
Current homepage `<h1>` highlight (`app/page.tsx:60`): *"Edge AI Surveillance Platform"*

Also note: `app/lib/seo-config.ts` contains a large `keywords` array and per-page `keywords`. The **`<meta keywords>` tag is ignored by Google** and carries no ranking value. It is harmless but should not be relied on; real targeting lives in titles, H1s, URLs, and body copy.

### Why it matters
You cannot rank for words you do not prominently use. Aligning titles/H1s/URLs with the target vocabulary is the single highest-leverage *on-page* change.

### What to change

**2a. Title tags + meta descriptions — File: `app/lib/seo-config.ts`**
Update the `title` and `description` fields in `pageMetadata`. Recommended defaults (review wording before shipping):

| Key | Current title | Proposed new title |
|---|---|---|
| `home` | Triya \| UAE's Leading AI Surveillance Platform - Dubai, Abu Dhabi | **AI Video Analytics & CCTV Intelligence Platform \| Triya** |
| `about` | About Triya \| Leading Edge AI Surveillance Company in MENA | **About Triya \| AI Video Analytics Company in Abu Dhabi & GCC** |
| `manufacturing` | Manufacturing Surveillance \| Industrial Safety AI Monitoring - Triya | **Manufacturing Video Analytics \| AI CCTV Safety Monitoring - Triya** |
| `retail` | Retail Security AI \| Loss Prevention & Customer Analytics - Triya | **Retail Video Analytics \| AI CCTV Loss Prevention - Triya** |
| `smartCities` | Smart City Surveillance \| AI Traffic & Crowd Monitoring - Triya | **Smart City Video Analytics \| AI CCTV Traffic & Crowd - Triya** |
| `events` | Event Security AI \| Crowd Control & VIP Protection - Triya | **Event Video Analytics \| AI CCTV Crowd Monitoring - Triya** |

Keep each title under ~60 characters where possible so it isn't truncated in results. Rewrite each `description` to naturally include "AI video analytics" and/or "CCTV analytics" in the first ~120 characters, while staying accurate.

**2b. H1s and on-page copy — Files: the `content` objects inside each `app/**/page.tsx`**
Update the `hero.title` / `titleHighlight` strings so the visible H1 contains the target phrase. Example for `app/page.tsx` (lines ~58–61):
- Change `titleHighlight: "Edge AI Surveillance Platform"` → e.g. `titleHighlight: "AI Video Analytics Platform"` and adjust `title` so the full H1 reads naturally, e.g. *"Turn Any CCTV Into an [AI Video Analytics Platform]"*.
- Apply the same principle to the four `use-cases/*/page.tsx` H1s and the `about` H1.
- Ensure the target phrase also appears in the **first paragraph of body copy** on each page, written naturally (no keyword stuffing).

**2c. New dedicated landing pages (recommended, higher effort)**
Create two new server-rendered routes whose URL, title, and H1 all contain the exact head terms:
- `app/ai-video-analytics/` → URL `/ai-video-analytics/`, title *"AI Video Analytics Software \| Triya"*, H1 *"AI Video Analytics Software"*.
- `app/cctv-analytics/` → URL `/cctv-analytics/`, title *"AI CCTV Analytics Solution \| Triya"*, H1 *"AI CCTV Video Analytics Solution"*.

Each should be a substantial page (≥600 words) that opens with a direct, complete answer to "what is AI video analytics / AI CCTV analytics" in the first ~150 words, then covers how Triya does it (camera-agnostic, on-prem/edge, Arabic-first), use cases, and a CTA. Add both to the sitemap config and link to them from the navbar and homepage. Follow the existing per-route pattern: a `layout.tsx` (server component) exporting metadata from `seo-config.ts`, plus a `page.tsx` for content.

### Acceptance criteria
- Updated `<title>` tags visible in built HTML `<head>` and under 60 chars where feasible.
- Each page's visible `<h1>` and first body paragraph contain the relevant target phrase.
- (If 2c done) `/ai-video-analytics/` and `/cctv-analytics/` build, render content in static HTML, are in the sitemap, and are linked internally.
- `npm run build` succeeds.

---

## TASK 3 — Resolve the config-vs-deployment mismatch (decide: static or server)

### Problem (current state)
`next.config.js` is written as if the site runs on a Node server (Vercel): it defines `async headers()`, `async redirects()`, and image optimization (`formats: ['image/avif','image/webp']`). But production is a **static GitHub Pages export**, where **none of these execute**. Consequences live today:
- The redirects `/pricing → /contact`, `/demo → /contact`, `/ar → /` **do not work** — those URLs likely return 404s.
- The security headers (CSP, X-Frame-Options, etc.) are **not applied**.
- Images are served **unoptimized**; large assets (`public/logo.png` ~924KB, `public/og-image.png` ~88KB, `public/how_it_works.png` ~72KB) and a ~2.6MB hero video hurt Core Web Vitals (a ranking factor).

### Decision required (surface to a human)
**Option A — Stay on GitHub Pages (static).** Lowest change; keep current hosting. Requires implementing redirects, headers, and image optimization by static-compatible means.
**Option B — Move to a host that supports the Next.js server runtime (Vercel or Cloudflare Pages).** Makes the existing `headers()`/`redirects()`/image optimization work as written; better long-term for SEO/perf. Larger operational change.

**Recommendation:** If the team wants minimum disruption now, do Option A and revisit Option B later. The agent should implement **Option A** unless told otherwise, and note Option B in the PR.

### What to change — Option A (static)
**File: `next.config.js`**
- Add `output: 'export'` and `images: { unoptimized: true }` so the config truthfully reflects static hosting (this also stops Next from assuming server image optimization). Keep `trailingSlash: true`.
- The `headers()` and `redirects()` blocks will still not run on GitHub Pages — either remove them to avoid the false impression of protection, or clearly comment that they are inert on static hosting. Prefer removing `headers()`.

**Redirects (replace the non-functional `redirects()`):**
- For `/pricing`, `/demo`: create static stub pages at `app/pricing/page.tsx` and `app/demo/page.tsx` that client-side redirect (or, better, render a thin page with a canonical link and a meta refresh / `router.replace('/contact/')`). The cleanest static approach is a tiny page that immediately routes to `/contact/`.
- For `/ar`: see Task 6 — do **not** redirect Arabic to the English homepage long-term; that destroys Arabic SEO. As an interim, leave `/ar` unhandled until Task 6 builds real Arabic routes.

**Image/perf optimization (static-safe):**
- Compress `public/logo.png`, `public/og-image.png`, `public/how_it_works.png` (target: logo < 100KB) and provide WebP/AVIF variants; reference optimized assets in markup.
- Ensure the hero video is compressed and `poster` is set (already present). Confirm `loading="lazy"` / deferred load patterns for below-the-fold media.
- Set explicit `width`/`height` (or aspect-ratio) on images to avoid layout shift (CLS).

### What to change — Option B (server host)
- Remove `output: 'export'` assumptions; deploy to Vercel/Cloudflare. The existing `headers()`, `redirects()`, and `next/image` optimization then work as written. Update the GitHub Actions workflow accordingly and re-point DNS. (Larger task — scope separately.)

### Acceptance criteria
- `next.config.js` accurately reflects the chosen hosting model and `npm run build` succeeds.
- `/pricing` and `/demo` resolve to the contact page (no 404) under the chosen approach.
- Largest images compressed; verify a Lighthouse/PageSpeed run shows improved LCP and no "properly size images" / "serve images in next-gen formats" failures.

---

## TASK 4 — Remove fabricated / inaccurate structured data (do this first)

### Problem (current state)
**File: `app/components/structured-data.tsx`** contains claims that appear fabricated or are factually wrong:

In `ProductSchema()`:
```json
"aggregateRating": { "@type": "AggregateRating", "ratingValue": "4.8", "reviewCount": "50" },
"award": "ADGM Innovation Award 2024",
```
In `OrganizationSchema()`:
```json
"legalName": "Triya Technologies",
"foundingDate": "2023",
```
`LocalBusinessSchema()` and `ProductSchema()` also use `"Triya Technologies"` as name/manufacturer.

The correct legal entity is **TRIYA AI LIMITED**, incorporated **December 2025**. The 4.8★ / 50-review rating and the "ADGM Innovation Award 2024" cannot be substantiated and read as invented.

### Why it matters
Self-serving `aggregateRating` markup not backed by real, visible on-page reviews violates Google's review snippet guidelines and is a common trigger for **manual structured-data penalties** — especially damaging for a young domain. Beyond SEO, fabricated ratings/awards are a credibility and reputational risk if a customer or investor inspects the page source. Accuracy is non-negotiable here.

### What to change
**File: `app/components/structured-data.tsx`**
1. **Delete the entire `aggregateRating` object** from `ProductSchema` (do not re-add unless/until real, verifiable reviews are published on-page with corresponding markup).
2. **Delete the `award` field** unless the team confirms a real, named award with public evidence (then use the exact official name/year).
3. In `OrganizationSchema`: set `"legalName": "TRIYA AI LIMITED"` and `"foundingDate": "2025"` (use the precise incorporation date `"2025-12-08"` if acceptable). Optionally replace the generic `founder` with the actual named founders if the team approves making that public.
4. Replace every `"Triya Technologies"` (in `OrganizationSchema.legalName`, `ProductSchema.manufacturer`, `LocalBusinessSchema.name`) with the correct legal name **"TRIYA AI LIMITED"** (the public-facing display `"name": "Triya"` can remain).
5. Expand `sameAs` beyond LinkedIn as official profiles go live (Crunchbase, etc.) — additive, not required now.
6. Verify all remaining fields (address, phone, email, geo) are accurate.

### Acceptance criteria
- No `aggregateRating` or unverifiable `award` remains anywhere in `structured-data.tsx`.
- Legal name and founding date are correct in all three schema blocks.
- Run the rendered JSON-LD through Google's Rich Results Test (or schema.org validator) — no errors, no review/rating warnings.
- `npm run build` succeeds.

---

## TASK 5 — Set up Google Search Console + fix the verification placeholder

### Problem (current state)
**File: `app/layout.tsx`** still contains placeholder verification values:
```tsx
verification: {
  google: 'add-your-google-verification-code',
  yandex: 'add-your-yandex-verification-code',
},
```
This strongly suggests Search Console was never properly connected. Without it, there is **no visibility** into indexed pages, search queries, impressions, click-through, or crawl/indexing errors — the team is optimizing blind, and cannot confirm whether Tasks 1–4 actually worked.

### What to do
**Non-code (human, prerequisite):**
1. Create/verify the property for `https://www.triya.ai` in **Google Search Console** (domain or URL-prefix property). Domain-property verification via DNS TXT is preferred and survives code changes.
2. Submit the sitemap `https://www.triya.ai/sitemap.xml` in GSC.
3. Repeat in **Bing Webmaster Tools** (covers Bing + powers some AI answer engines).

**Code (agent):**
4. In `app/layout.tsx`, replace the Google placeholder with the **real** verification token from GSC (only needed if using the HTML-tag verification method; if DNS verification is used, remove the `google` placeholder rather than leaving a fake value).
5. Remove the `yandex` placeholder unless Yandex Webmaster is actually being used.
6. Confirm `public/robots.txt` references the sitemap (it does: `Sitemap: https://www.triya.ai/sitemap.xml`) and that `sitemap.xml` is current after any new pages from Task 2/6 are added.

### Acceptance criteria
- No placeholder strings remain in `app/layout.tsx` `verification`.
- GSC property verified and sitemap submitted (human confirms).
- `npm run build` succeeds.

---

## TASK 6 — Build a real, indexable Arabic version (Triya's least-contested ranking opportunity)

### Problem (current state)
Arabic — described as Triya's primary differentiator — has **zero search presence**. It exists only as a client-side `localStorage` language toggle that swaps text in place on already-rendered English URLs. There are:
- **No separate Arabic URLs** (so nothing Arabic to index),
- **No `hreflang` tags** (so Google can't associate language variants),
- and `/ar` currently redirects to the English homepage.

Result: Triya cannot rank for a single Arabic-language query, despite Arabic competition for these terms being far thinner than English.

### Why it matters
Distinct, indexable Arabic URLs targeting Arabic search terms (e.g. تحليلات الفيديو بالذكاء الاصطناعي, تحليل كاميرات المراقبة) face much lower competition than the English head terms and align with Triya's GCC positioning. This is a genuine, winnable opening currently being discarded.

### Approach (this is a larger build — scope as its own project)
Implement locale-segmented routing so each page has a real Arabic counterpart with its own URL.

**Recommended implementation:**
1. Introduce a locale path segment, e.g. `app/[locale]/...`, serving `en` and `ar`, using `generateStaticParams` so both locales are pre-rendered in the static export. (Alternatively adopt `next-intl` configured for static export.)
2. For each page, output the correct `lang` and `dir` attributes server-side: `<html lang="ar" dir="rtl">` for Arabic routes (do not rely on the client-side `document.documentElement.dir` toggle for the indexed version).
3. Add **`hreflang` alternates** in metadata for every page, e.g.:
   ```tsx
   alternates: {
     canonical: 'https://www.triya.ai/ar/<path>/',
     languages: {
       'en': 'https://www.triya.ai/<path>/',
       'ar': 'https://www.triya.ai/ar/<path>/',
       'x-default': 'https://www.triya.ai/<path>/',
     },
   }
   ```
4. Translate titles, descriptions, H1s, and body copy into Arabic with **Arabic target keywords** (not machine-translated English keywords). Use a professional/native reviewer.
5. Add all Arabic URLs to the sitemap.
6. **Remove the `/ar → /` redirect.** Keep the visible EN/AR toggle, but have it navigate between the real `/...` and `/ar/...` URLs rather than swapping text on one URL.

**Phasing:** Start with the highest-value pages (home, the two new Task 2c landing pages, the four use-cases) before translating the full blog.

### Acceptance criteria
- Arabic pages exist at distinct URLs (e.g. `/ar/`, `/ar/use-cases/manufacturing/`) and their content is present in static HTML.
- Each language variant declares correct `lang`/`dir` and reciprocal `hreflang` (including `x-default`).
- Arabic URLs appear in `sitemap.xml`.
- The `/ar → /` redirect is gone; the language toggle navigates between real localized URLs.
- `npm run build` succeeds.

---

## Out of scope (not code — separate workstream)
Ranking for the most competitive head terms also depends on **domain authority and backlinks**, which no code change provides. In parallel with the above, pursue: Crunchbase/G2/Capterra/Hub71/ADGM directory listings, a Google Business Profile, and PR/backlinks around the Hub71 endorsement and customer pilots. Also worth a separate brief: optimizing content to be **cited by AI answer engines** (ChatGPT/Perplexity/Google AI Overviews), where a young domain can gain visibility faster than in classic organic results.

## Definition of done (whole spec)
- All six tasks merged via reviewed PRs; `npm run build` green.
- Homepage and all key pages contain crawlable body HTML and correctly-targeted titles/H1s.
- No fabricated or inaccurate structured data remains; Rich Results Test passes.
- GSC + Bing verified, sitemaps submitted.
- Config matches hosting; redirects resolve; large images optimized.
- (If Task 6 shipped) Indexable Arabic URLs with hreflang live and in the sitemap.
