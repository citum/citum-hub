# Design System: Citation Style Detailed Preview

**Project ID:** projects/4997510721725575250

## 1. Visual Theme & Atmosphere

The design embodies a **refined, scholarly functionalism**. It marries the utility of a technical tool with the typographic elegance of academic publishing. The overarching mood is **focused, crisp, and intellectual**, utilizing a serif typeface (Newsreader) throughout strictly "app" UI elements—a bold choice that elevates the interface from a standard utility to a premium research environment.

The atmosphere feels **grounded and authoritative**, with a high-contrast interaction between the soft, cool-toned application chrome and the stark, bright white "paper" surfaces used for previewing citations.

## 2. Color Palette & Roles

### Primary Brand

- **Royal Academic Blue** (`#135bec`) – Used for primary actions (buttons), key icons, and active states. It provides a vibrant, digital-native contrast to the otherwise muted palette.

### Surfaces & Backgrounds

- **Cool Mist White** (`#f6f6f8`) – The primary application background. A very light, cool gray that reduces glare compared to pure white.
- **Pure Paper White** (`#ffffff`) – Reserved for content cards and the "paper" preview area to simulate a physical document.
- **Obsidian Navy** (`#101622`) – Dark mode background foundation.

### Typography & Borders

- **Ink Black** (`#0d121b`) – Primary text color. Softer than pure black, reading like high-quality print ink.
- **Muted Steel Blue** (`#4c669a`) – Secondary text, metadata labels, and breadcrumb links.
- **Soft Border Gray** (`#e7ebf3`) – Layout dividers and card borders.
- **Interactable Border** (`#cfd7e7`) – Borders for buttons and interactive elements.

### Status & Accents

- **Tag Gray** (`#e7ebf3`) – Background for neutral category tags.
- **Alert Orange** (`bg-orange-100` / `#ffedd5`) – "Note" style indicators.
- **Success Green** (`bg-green-100` / `#dcfce7`) – "Bibliography" style indicators.

## 3. Typography Rules

The Hub uses **two typefaces with distinct roles**:

- **UI chrome — Lexend (sans-serif).** Designed for reading proficiency. Friendly to readers across fluency levels (including dyslexic users), which matters for an academic tool that includes student users. All chrome, controls, navigation, headings, and body copy.
- **Citation output — Merriweather (serif).** The rendered citation preview and bibliography. Serif here preserves the "this is the published output" feel exactly where it has emotional payoff. Reach for this only inside `.live-preview-content` and bibliography rendering.

The split mirrors the user's mental model: sans for *I'm operating a tool*, serif for *I'm reading the deliverable*. Don't introduce a third typeface without retiring one.

### Hierarchy

- **Page Titles (H1):** `text-4xl font-black tracking-tight text-slate-950 sm:text-5xl`. Authoritative.
- **Section Headers (H2/H3):** `text-lg` or `text-2xl`, `font-bold`, `text-slate-950`. Distinct but integrated.
- **Body Text:** `text-base leading-7 text-slate-600` for ledes; `text-sm` for in-card copy.
- **Eyebrow Labels:** `text-xs` or `text-sm`, `font-semibold uppercase tracking-[0.2em]`, accent color (mode color or `text-slate-400` on dark surfaces).
- **Citation preview body:** `text-sm leading-7` inside `.live-preview-content` (Merriweather). Bibliography entries scale up to `text-base` to mimic document reading.

## 4. Component Stylings

### Buttons

- **Primary Action:**
  - **Color:** Royal Academic Blue (`#135bec`) background, White text.
  - **Shape:** Rounded-lg (8px radius).
  - **Effect:** Subtle shadow (`shadow-md`) that deepens on hover (`shadow-lg`).
- **Secondary Action:**
  - **Color:** White background, Interactable Border (`#cfd7e7`), Ink Black text.
  - **Hover:** Slight gray tint (`hover:bg-gray-50`).

### Cards & Containers

- **App Panels:**
  - **Bg:** White (`bg-white`).
  - **Shape:** Rounded-xl (rounded corners, approx 12px).
  - **Border:** Soft Border Gray (`#e7ebf3`).
  - **Shadow:** Subtle shadow-sm.
- **The "Paper" Preview:**
  - **Bg:** White.
  - **Shape:** Rounded-md.
  - **Effect:** Realistic, deep shadow (`shadow-[0_4px_20px_-4px_rgba(0,0,0,0.1)]`) to lift it off the background like a physical sheet. Includes a subtle top gradient overlay (`bg-gradient-to-b from-gray-50`) to suggest paper texture/depth.

### Chips & Badges

- **Shape:** Full rounded (`rounded-full`).
- **Padding:** px-3 py-1.
- **Typography:** Text-sm, Font-medium.
- **Colors:** Context-dependent pastels (Gray, Orange, Green) with matching colored text.

### Navigation & Header

- **Style:** Sticky, semi-transparent backdrop (`bg-white/80 backdrop-blur-md`).
- **Border:** Bottom border in Soft Border Gray (`#e7ebf3`).
- **Content:** Clean separation between the brand/search (left) and navigation links (right).

## 5. Layout Principles

### Grid & Structure

- **Max Width:** Restricted to `1440px` for optimal readability.
- **Columns:** Standard 12-column grid.
  - **Sidebar:** 4 columns (Metadata, Actions).
  - **Main:** 8 columns (Preview Area).
- **Spacing:** Generous gaps (`gap-8`) between major layout zones.

### Visual Metaphor

- **"Desk & Paper":** The UI mimics a researcher's desk. The gray background acts as the desk surface, with panels and the main "paper" preview sitting on top of it, distinguished by borders and shadows.

---

# Part II — Current Implementation & Drift

§1–§5 above describe the **target** design vision (Stitch-derived, scholarly-functionalist, "desk & paper"). Sections 6–9 below describe what is **actually in the code** as of `design/create-flow-refresh`, where reality has drifted from vision, and the rules and sequence for closing the gap. When a component disagrees with §6–§7, the component is wrong unless this file is updated in the same commit.

## 6. Current Reality (what the code does today)

### 6.1 Tokens defined in `client/src/index.css`

| Token | Value | Vision §? | Currently used in components |
|-------|-------|-----------|-------------------------------|
| `--color-primary` | `#135bec` | §2 ✓ | Yes (root chrome buttons, eyebrow links) |
| `--color-background-light` | `#f6f7f8` | §2 (close to "Cool Mist White" `#f6f6f8`) | `bg-background-light` on root layout only |
| `--color-background-dark` | `#111821` | §2 ✓ (Obsidian Navy) | Not used directly |
| `--color-surface-light` | `#ffffff` | §2 ✓ (Pure Paper White) | Not referenced — `bg-white` used instead |
| `--color-border-light` | `#e7ebf3` | §2 ✓ (Soft Border Gray) | Used in `.preview-bibliography` only |
| `--color-text-main` | `#0d121b` | §2 ✓ (Ink Black) | `:root` color only — not in components |
| `--color-text-secondary` | `#4c669a` | §2 ✓ (Muted Steel Blue) | `.preview-bibliography h4` and `.csln-tooltip` only |
| `--font-display` | `Lexend` | §3 ✗ — vision says **Newsreader** | `:root font-family` |
| `--font-sans` | `Lexend` | §3 ✗ | (alias) |
| `--font-serif` | `Merriweather` | §3 ✗ — vision says Newsreader for everything | `.live-preview-content`, `.bib-entry` |
| `--radius-lg` | `0.5rem` | §4 ✓ (matches button rounded-lg) | Not referenced — components use `rounded-lg` directly |
| `--radius-xl` | `0.75rem` | §4 ✓ | Not referenced |
| `--radius-2xl` | `1rem` | §4 (vision says rounded-md for paper, rounded-xl for panels) | Not referenced |

### 6.2 Tailwind palette in active use (not tokenized)

- Neutrals: `slate-50 / 100 / 200 / 400 / 500 / 600 / 700 / 900 / 950`. Used everywhere in `/create/*`. The vision calls these "Ink Black / Muted Steel Blue / Soft Border Gray" but components don't pull from those tokens.
- Mode accents: `sky-600` (Find), `amber-600` (Tweak), `emerald-600` (Build). Not in vision.
- Status: `red-600` (error), `blue-50/200/800/950` (info notice on `/create`).

### 6.3 De-facto component patterns

These appear in 3+ places. Treat them as canonical until §7 is resolved.

#### 6.3.1 Mode-hub hero (`/create/*` mode pages)
```
<section>
  <p class="mb-3 text-sm font-semibold uppercase tracking-[0.2em] text-{accent}-600">{Mode}</p>
  <h1 class="text-4xl font-black tracking-tight text-slate-950 sm:text-5xl">{Headline}</h1>
  <p class="mt-4 max-w-2xl text-base leading-7 text-slate-600">{Lede}</p>
</section>
```
Used by `/create`, `/create/find`, `/create/tweak`, `/create/build`.

#### 6.3.2 Surface card
```
<div class="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm sm:p-8">…</div>
```
Used by mode hub cards and Build's primary section.

#### 6.3.3 Inset notice / sidecar panel
```
<div class="rounded-[1.6rem] border border-{accent}-100 bg-{accent}-50 px-5 py-4">…</div>
```
Used by Build's progress panel and "Starting Point" block.

#### 6.3.4 Pill button
- Primary: `inline-flex items-center justify-center rounded-full bg-slate-950 px-5 py-3 text-sm font-semibold text-white transition-colors hover:bg-slate-800`
- Secondary: `inline-flex items-center justify-center rounded-full border border-slate-200 px-5 py-3 text-sm font-semibold text-slate-700 transition-colors hover:border-slate-300 hover:text-slate-950`

#### 6.3.5 Dark inverted state panel
```
<div class="rounded-[2rem] border border-slate-200 bg-slate-950 p-6 text-white">…</div>
```
Used in `/create/build` for the "Current build state" sidebar.

#### 6.3.6 Two-column build layout
```
<div class="mx-auto grid w-full max-w-6xl gap-8 px-4 py-10 sm:px-6 lg:grid-cols-[minmax(0,1fr)_360px]">
  <section>…</section>
  <aside>…</aside>
</div>
```

## 7. Drift From Vision (priority work)

Each item is either "reality is right, update §1–§5" or "vision is right, fix the code." Decide both at the same time.

### 7.1 Two competing chrome systems
- Root `+layout.svelte`: `bg-background-light`, `--color-primary` blue, `material-symbols-outlined`, `rounded-lg` buttons, "Citum Hub / school" branding. Closer to vision §2 + §4.
- `CreateFlowHeader.svelte`: pure slate, pill nav, `bg-white/90 backdrop-blur`, "Citum Create" branding, no `--color-primary`, no Material Symbols. Closer to vision §4 "sticky, semi-transparent backdrop" but skips the brand color.

Same product, two skins. **Decision needed:** is `/create` an intentionally distinct "studio" surface (then update vision §4 to say so), or did the new header drift? Recommend unifying on the new (slate + backdrop-blur + pill) treatment, and updating §2 to acknowledge `--color-primary` as a *root-chrome* accent rather than a universal action color.

### 7.2 ~~Font drift~~ — RESOLVED
Vision §3 has been updated to acknowledge the Lexend (UI) + Merriweather (citations) split rather than a single Newsreader treatment. Reasoning: the split matches the user's mental model (tool vs deliverable), Lexend is purpose-built for reading proficiency (an asset for student users), and adopting Newsreader would be high-effort for mostly aesthetic payoff. Inter was an orphan and has been removed from the layout font link.

### 7.3 Radius zoo
Six radii in active use, none citing `--radius-*` tokens:

| In code | Where |
|---------|-------|
| `rounded-lg` | Root header buttons (matches vision §4) |
| `rounded-full` | CreateFlowHeader nav, all pill buttons |
| `rounded-2xl` | Inline preview panels |
| `rounded-3xl` | Find / Tweak surface cards |
| `rounded-[2rem]` | Mode-hub cards, Build sections |
| `rounded-[1.6rem]` | Build inset notices |
| `rounded-[1.2rem]` | Tweak source preview |

**Rule going forward** (§8): use `rounded-2xl` for surface cards, `rounded-xl` for inset notices, `rounded-full` for pills, `rounded-lg` for inputs. No bracket values without a token.

### 7.4 Color tokens defined but unused
`--color-surface-light`, `--color-text-main`, `--color-text-secondary` are dead in component code — `bg-white`, `text-slate-950`, `text-slate-600` are used instead. **Decision needed:** delete the unused tokens, or migrate component code to reference them. Recommend keeping the chrome-level tokens (background, border, text-main, primary) and migrating components to reference them; delete `--color-surface-light` (interchangeable with `bg-white`).

### 7.5 ~~Orphan Inter~~ — RESOLVED
Inter has been removed from the Google Fonts `<link>` in `+layout.svelte`. See §7.2.

### 7.6 Mode color coding inconsistent

| Mode | On hub card (in `/create`) | On its own page (eyebrow) |
|------|----------------------------|---------------------------|
| Find | `hover:border-primary/40` (blue) | `text-sky-600` |
| Tweak | `hover:border-amber-400/50` | `text-amber-600` |
| Build | dark slate, no accent | `text-emerald-600` |

Pick one set. Recommend: drop `--color-primary` blue for "Find" in favor of `sky` (matches the route's eyebrow), and pick an explicit Build accent (`emerald`, since it's already on the Build page — and update the hub card to hint emerald on hover instead of relying on dark fill alone).

### 7.7 Container width drift
Vision §5 says `1440px`. Code uses `max-w-[1200px]` (root chrome), `max-w-6xl` (≈1152px) in CreateFlowHeader and Build, `max-w-5xl` in Find / Tweak. Recommend pick `max-w-6xl` for `/create/*` (the flow surface) and `max-w-7xl` (≈1280px) for `/library` and `/style` data views, and update §5 to reflect both. 1440px is too wide for line lengths in copy-heavy mode hubs.

### 7.8 Two icon systems
`material-symbols-outlined` (root chrome, font request) vs `lucide-svelte` (already a dep). Recommend Lucide everywhere, drop the Material Symbols `<link>`.

### 7.9 Refine and Customize chrome lives inside the components
`/create/build/refine` and `/create/build/customize` skip *both* the root header and the create / wizard headers, but the underlying `RefinementPanel` and `VisualCustomizer` components render their own internal chrome — top-left back button, plus a row of Save / Back / Start Over actions at the bottom. So the routes are not trapped, but the internal chrome predates the design system: the back button uses `material-symbols-outlined` (§7.8), the Save button uses `bg-primary` blue rather than the Build mode's emerald (§7.6), and the progress bar is a hardcoded `width: 80%` rather than computed. These are the targets for the dedicated refine/customize refactor PR — too big to bundle into the foundation PR.

### 7.10 Two stores
`wizardStore` (legacy step-based) and `createFlowStore` (new mode-aware) coexist. `CreateFlowHeader.handleReset()` calls both. `/create/build/refine` and `/create/build/customize` still drive `wizardStore`. Cutover is half-done — see `specs/CREATE_REWRITE_ARCHITECTURE.md` § "Reuse And Deletion."

### 7.11 Body color drift
`text-slate-600` (most lede paragraphs), `text-slate-700` (preview body), `--color-text-secondary` (`#4c669a`, used only in legacy `.preview-bibliography h4`). Pick one for body copy: recommend `text-slate-600`.

### 7.12 "Paper" preview metaphor not landed
Vision §4 describes a `shadow-[0_4px_20px_-4px_rgba(0,0,0,0.1)]` paper card with a `bg-gradient-to-b from-gray-50` overlay. Current preview panels are flat `rounded-2xl border border-slate-200 bg-slate-50`. **Decision needed:** ship the paper metaphor as part of the Build / Refine polish pass, or retire it from §4 as a non-goal.

## 8. Rules Going Forward

1. **No new bracket-radius values.** Use `rounded-full` / `rounded-2xl` / `rounded-xl` / `rounded-lg`. If a token is needed, add it to `@theme` first and reference it.
2. **No new ad-hoc color hex in components.** Use `@theme` tokens (§6.1) or the documented Tailwind palette (§6.2).
3. **Hero shape (§6.3.1) for every `/create/*` route.** Including future ones (e.g. `/create/find/results`).
4. **One icon library: Lucide.** Do not import `material-symbols-outlined` in new code. Replace existing use as you touch the file.
5. **Container width: `max-w-6xl` for `/create/*`.** `/library` and `/style` may widen to `max-w-7xl` if the data needs it.
6. **Mode color = `sky` (Find), `amber` (Tweak), `emerald` (Build).** Apply on eyebrow, hover accent, and any mode-scoped progress UI.
7. **Focus-mode screens (`refine`, `customize`) must include an exit affordance.** Chromeless is fine; trapped is not.
8. **`/impeccable` reviews must reference this file.** Suggestions that contradict §1–§7 must include an update to this file in the same change.

## 9. Priority Order (screen-by-screen pass)

Aligned with `~/.claude/plans/this-branch-was-last-floofy-spark.md` Step 4. Each pass produces a PR scoped to one screen plus any token / component additions required to support it.

1. `/create` (mode hub) — locks the chrome decision (§7.1) and the mode-color rule (§7.6). Smallest blast radius, biggest framing impact.
2. `/create/build` — applies the dark inverted state pattern (§6.3.5), resolves the inset-notice radius (§7.3), tightens body color (§7.11).
3. `/create/build/refine` — first place to land the Phase 1 refinement ideas from `specs/WIZARD_LEGACY_NOTES.md` §1, plus an exit affordance (§7.9).
4. `/create/build/customize` — apply the "no cross-family controls" discipline from `specs/WIZARD_LEGACY_NOTES.md` §2.
5. `/create/find` and `/create/tweak` — consistency with §6.3 patterns; make Find feel like discovery, not a stub.
6. Root chrome (`+layout.svelte` header + footer) and `/library`, `/style` — chrome unification (§7.1), width fix (§7.7), icon swap (§7.8).
