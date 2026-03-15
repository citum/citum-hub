# Style Wizard v2: Design Specification

**Status:** Draft
**Audience:** Implementing agents and human reviewers
**Supersedes:** `WIZARD_UX_SPEC.md` (v1 spec retained for reference)
**Stack:** SvelteKit 5 (Svelte 5 runes), TypeScript, Tailwind CSS 4, citum-engine WASM

---

## 1. Problem Statement

The current wizard is a linear decision tree: ~10 multiple-choice questions produce
a style via a Rust `intent-engine`. It works, but has fundamental limitations:

1. **Blind decisions.** Users choose "APA contributor preset" or "Harvard date format"
   without knowing what those words mean. Preview exists but is disconnected from the
   choices — it updates as a side-effect, not as the decision surface itself.

2. **Coarse granularity.** The intent model bundles formatting into presets. Users who
   want "APA names but Chicago dates" cannot express that; they must pick one preset
   and accept the package.

3. **No direct manipulation.** Users cannot click on a rendered author name and change
   its formatting. The visual output is read-only decoration, not the editing surface.

4. **Low ceiling.** The wizard produces preset-derived styles. There is no path from
   "almost right" to "exactly right" without leaving the wizard and editing raw YAML.

5. **SQI-unaware.** Nothing in the UX encourages preset reuse, template sharing, or
   type-override discipline — the factors that drive high SQI scores.

### What v1 Got Right

- Field-first branching (discipline → style family → options)
- Live preview concept (backend renders HTML)
- Completion detection (`question === null`)
- Branch-aware preview filtering

These survive into v2. The architecture changes; the core insight does not.

---

## 2. Design Philosophy

### 2.1 Preview Is the Interface

Every decision the user makes is visible in a live rendered preview *before* they
commit to it. The preview is not a side panel — it is the primary interaction surface
in Phase 2. Users point at what they want to change, and the system reveals options.

### 2.2 Presets First, Overrides on Demand

The wizard always starts from a preset. Customizations are layered on top, not built
from scratch. This produces naturally high SQI scores because:

- Preset usage score starts high (25% of SQI)
- Concision stays high (no redundant components)
- Type-coverage inherits from the preset's breadth
- Fallback robustness comes from the preset's base template

The wizard should make it *easier* to use a preset than to deviate from one.

### 2.3 Progressive Disclosure

Three tiers of complexity, each accessible from the previous:

| Tier | User | Interaction | Decisions |
|------|------|-------------|-----------|
| **Quick Start** | General user | Guided questions with visual choices | 5-7 |
| **Visual Customizer** | Intermediate | Click rendered output to edit properties | Unlimited |
| **Advanced Editor** | Expert | Type-specific templates, raw YAML | Full schema |

A general user can stop after Quick Start and have a working, high-SQI style.
An expert can drill through all three tiers without switching tools.

### 2.4 Show, Don't Describe

Where the v1 wizard says "APA contributor preset", v2 shows:

```
Smith, J. A., & Jones, B. C.    ← this one
Smith, John A., and Betty C. Jones
J. A. Smith and B. C. Jones
```

Every choice is a rendered example, never an abstract label. The user picks what
looks right, not what sounds right.

---

## 3. Architecture Overview

```
┌─────────────────────────────────────────────────────┐
│                    SvelteKit App                     │
│                                                      │
│  ┌──────────┐   ┌──────────────┐   ┌──────────────┐ │
│  │  Quick    │──▶│   Visual     │──▶│  Advanced    │ │
│  │  Start    │   │  Customizer  │   │  Editor      │ │
│  │  (Guide)  │◀──│  (Direct)    │◀──│  (YAML)      │ │
│  └──────────┘   └──────────────┘   └──────────────┘ │
│       │                │                    │         │
│       ▼                ▼                    ▼         │
│  ┌──────────────────────────────────────────────┐    │
│  │           WizardStore (Svelte 5 runes)        │    │
│  │                                                │    │
│  │  styleYaml ←→ parsedStyle ←→ wizardState      │    │
│  └──────────────────────────────────────────────┘    │
│                        │                              │
│                        ▼                              │
│  ┌──────────────────────────────────────────────┐    │
│  │          WASM Bridge (citum-engine)            │    │
│  │                                                │    │
│  │  renderCitation(yaml, refs) → html             │    │
│  │  renderBibliography(yaml, refs) → html         │    │
│  │  validateStyle(yaml) → errors[]                │    │
│  └──────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────┘
```

### Key Architectural Decisions

1. **Client-side WASM rendering.** The v1 wizard round-trips to the Axum server for
   every preview. v2 renders entirely in the browser via the citum-engine WASM bridge.
   This eliminates network latency and enables instant (<50ms) preview updates as the
   user adjusts settings.

2. **Single source of truth.** The `WizardStore` holds the style as a parsed Citum
   `Style` object (mirroring the Rust struct via Specta-generated TypeScript types).
   All three tiers read from and write to this same object. The YAML serialization is
   derived, not primary.

3. **No intent-engine dependency.** The v1 `StyleIntent` → `DecisionPackage` pipeline
   is replaced by direct style object manipulation. Presets are loaded client-side from
   embedded JSON (generated from the Rust `TemplatePreset` enum at build time). The
   intent-engine server endpoints (`/api/v1/decide`, `/api/v1/generate`) are retained
   for backward compatibility but are not used by the v2 wizard.

---

## 4. Phase 1: Quick Start

### Purpose

Get the user from zero to a working style in under 2 minutes with 5-7 guided
decisions. Every decision uses rendered examples as choices, not text labels.

### Flow

```
[1. Field]  →  [2. Style Family]  →  [3. Starting Preset]
                                            │
                              ┌─────────────┼─────────────┐
                              ▼             ▼             ▼
                       [4. Names]    [5. Dates]    [6. Titles]
                              │             │             │
                              └─────────────┼─────────────┘
                                            ▼
                                    [7. Review & Name]
```

Steps 4-6 are shown simultaneously as a "Refine Your Style" screen (not sequential
steps) — see Step 4-6 below.

---

### Step 1: Field Selector

**Question:** "What's your area?"

**Presentation:** Large cards with icons, 2×3 grid on desktop, single column on mobile.

| Card | Subtitle | Icon |
|------|----------|------|
| Sciences | Physics, Chemistry, Biology, Engineering | 🔬 |
| Medicine & Health | Clinical, Nursing, Public Health | 🏥 |
| Social Sciences | Psychology, Sociology, Economics, Education | 📊 |
| Humanities | History, Literature, Philosophy, Languages | 📚 |
| Law | Legal scholarship, Case law | ⚖️ |
| Other / Interdisciplinary | Cross-field, general use | 🌐 |

**Behavior:**
- Selecting a card immediately advances to Step 2.
- No preview shown (too early).
- No back button (entry point).
- The selection sets `wizardState.field` and infers a default style family.

**Field → Default Family Mapping:**

| Field | Default Family | Rationale |
|-------|---------------|-----------|
| Sciences | Numeric | Most science journals use numbered references |
| Medicine & Health | Numeric | Vancouver is the dominant medical style |
| Social Sciences | Author-Date | APA is the dominant social science style |
| Humanities | Note | Chicago Notes is the dominant humanities style |
| Law | Note | Legal citation is footnote-based |
| Other | Author-Date | Most broadly useful default |

---

### Step 2: Style Family

**Question:** "How should citations appear in your text?"

**Presentation:** 3 large panels, each showing a rendered paragraph with citations
highlighted. The user's field-default is pre-selected with a subtle highlight border.

#### Panel: Author-Date
```
According to Smith (2024), the results were significant. Several studies
confirm this finding (Jones & Lee, 2023; Chen et al., 2022).
```
Caption: "Author names and years appear in the text"

#### Panel: Numeric
```
According to Smith [1], the results were significant. Several studies
confirm this finding [2, 3].
```
Caption: "Numbers in brackets refer to a numbered list"

#### Panel: Note
```
According to Smith,¹ the results were significant. Several studies
confirm this finding.²
─────
1. John Smith, The Study of Things (Oxford: Oxford University Press,
   2024), 42.
2. See especially Jones and Lee, "Further Analysis," Journal of
   Studies 15 (2023): 100–115.
```
Caption: "Superscript numbers link to footnotes or endnotes"

**Behavior:**
- The field-default panel has a "Recommended for [field]" badge.
- User can select any family regardless of field recommendation.
- Selection sets `wizardState.family` and advances to Step 3.
- Back button returns to Step 1.

---

### Step 3: Starting Preset

**Question:** "Pick the closest match to start from"

**Presentation:** A gallery of 3-5 preset cards (filtered by the selected family).
Each card shows a mini bibliography (3 entries: article, book, chapter) rendered
via WASM.

#### Author-Date Presets

| Preset | Key Visual Traits |
|--------|-------------------|
| **APA** | `Smith, J. A. (2024). Title. Journal, 12(3), 45.` — year in parens after author, italic journal |
| **Chicago Author-Date** | `Smith, John A. 2024. "Title." Journal 12 (3): 45.` — year after author no parens, quoted article titles |
| **Harvard** | `Smith, J.A. (2024) Title. Journal, 12(3), pp.45-67.` — minimal punctuation, `pp.` prefix |
| **Elsevier** | `J.A. Smith, Title, Journal 12 (2024) 45-67.` — given-first, compact |

#### Numeric Presets

| Preset | Key Visual Traits |
|--------|-------------------|
| **Vancouver** | `1. Smith JA, Jones BC. Title. Journal. 2024;12(3):45-67.` — initials no dots, semicolon date |
| **IEEE** | `[1] J. A. Smith and B. C. Jones, "Title," Journal, vol. 12, no. 3, pp. 45-67, 2024.` — given-first, quoted titles |
| **Nature** | `1. Smith, J. A. & Jones, B. C. Title. Journal 12, 45-67 (2024).` — ampersand, year in parens at end |
| **ACS** | `(1) Smith, J. A.; Jones, B. C. Title. Journal 2024, 12 (3), 45-67.` — semicolon between authors |

#### Note Presets

| Preset | Key Visual Traits |
|--------|-------------------|
| **Chicago Notes** | `1. John A. Smith, Title of Book (Place: Publisher, 2024), 42.` — full names, comma-separated |
| **Turabian** | Similar to Chicago Notes with minor variations |

**Behavior:**
- Each card is a fully rendered bibliography preview (3 diverse reference types).
- User clicks a card to select it.
- Selection loads the preset into the `parsedStyle`, setting `options.contributors`,
  `options.dates`, `options.titles`, and `citation`/`bibliography` `use_preset`.
- Advances to Steps 4-6 (refinement screen).
- Back button returns to Step 2.

---

### Steps 4-6: Refine Your Style (Single Screen)

**Layout:** Split screen.
- **Left (60%):** Live preview showing rendered citations + bibliography (5-6 diverse
  reference types). Updated in real-time via WASM as user changes settings.
- **Right (40%):** Three collapsible sections, all visible at once.

**Question:** "Fine-tune the details (or skip to finish)"

Each section shows the current setting with a rendered example and a dropdown or
button group to change it. Changing a setting instantly updates the left preview.

#### Section: Names

Shows current name rendering with options:

```
┌─ Names ──────────────────────────────────────────┐
│                                                    │
│  Current: Smith, J. A., & Jones, B. C.             │
│                                                    │
│  Name order    [Family-first ▾]                    │
│                 ├ Family-first    Smith, J. A.      │
│                 ├ Given-first     J. A. Smith       │
│                 └ Full names      John A. Smith     │
│                                                    │
│  And/ampersand  [Symbol (&) ▾]                     │
│                  ├ Symbol (&)                       │
│                  ├ Word (and)                       │
│                  └ None (comma only)                │
│                                                    │
│  Et al. after   [3 authors ▾]                      │
│                  ├ 1 author                         │
│                  ├ 2 authors                        │
│                  ├ 3 authors                        │
│                  ├ 6 authors                        │
│                  └ Show all                         │
│                                                    │
│  Initials       [Abbreviated (J. A.) ▾]            │
│                  ├ Abbreviated (J. A.)              │
│                  ├ Compact (JA)                     │
│                  └ Full (John Andrew)               │
│                                                    │
└────────────────────────────────────────────────────┘
```

Each dropdown selection maps to specific fields in the style's `options.contributors`
preset or override:

| UI Control | Style Path | Values |
|-----------|-----------|--------|
| Name order | `options.contributors.form` | `short` (family-first) / `long` (given-first) |
| And/ampersand | `options.contributors.and` | `symbol` / `text` / none |
| Et al. after | `options.contributors.shorten.min` | 1-20 |
| Initials | `options.contributors.initialize-with` | `". "` / `""` / omit |

**Preset deviation tracking:** When the user changes a value that differs from the
loaded preset, the wizard tracks the deviation. If all values still match a known
preset, `options.contributors` stays as the preset name (high SQI). If any value
deviates, the wizard expands to an explicit configuration (lower SQI but accurate).

#### Section: Dates

```
┌─ Dates ──────────────────────────────────────────┐
│                                                    │
│  Current: (2024)                                   │
│                                                    │
│  Format        [Year only ▾]                       │
│                 ├ Year only         (2024)          │
│                 ├ Month and year    (January 2024)  │
│                 ├ Full date         (15 Jan 2024)   │
│                 └ Numeric           (2024-01-15)    │
│                                                    │
│  Position      [After author ▾]                    │
│                 ├ After author                      │
│                 └ End of entry                      │
│                                                    │
└────────────────────────────────────────────────────┘
```

#### Section: Titles

```
┌─ Titles ─────────────────────────────────────────┐
│                                                    │
│  Current: The role of memory in learning           │
│                                                    │
│  Article titles  [Sentence case ▾]                 │
│                   ├ Sentence case                   │
│                   ├ Title Case                      │
│                   └ As entered                      │
│                                                    │
│  Article style   [No decoration ▾]                 │
│                   ├ No decoration                   │
│                   ├ "In quotes"                     │
│                   └ Italic                          │
│                                                    │
│  Book titles     [Italic ▾]                        │
│                   ├ Italic                          │
│                   └ No decoration                   │
│                                                    │
└────────────────────────────────────────────────────┘
```

**Behavior:**
- All three sections are expanded by default. User can collapse any section.
- A "Skip — use defaults" button at the bottom advances directly to Step 7.
- Changes update the live preview within 50ms (WASM rendering).
- Back button returns to Step 3 (preset gallery).

---

### Step 7: Review & Name

**Layout:** Full-width preview with a name input above and action buttons below.

```
┌────────────────────────────────────────────────────┐
│  Name your style                                    │
│  ┌──────────────────────────────────────────────┐   │
│  │ My Department Style                           │   │
│  └──────────────────────────────────────────────┘   │
│  Auto-suggested: "APA Author-Date (Modified)"       │
│                                                      │
│  ┌──────────────────────────────────────────────┐   │
│  │              FINAL PREVIEW                    │   │
│  │                                                │   │
│  │  In-text (parenthetical):                     │   │
│  │  (Smith & Jones, 2024; Chen et al., 2023)     │   │
│  │                                                │   │
│  │  In-text (narrative):                         │   │
│  │  Smith and Jones (2024) argue that...         │   │
│  │                                                │   │
│  │  Bibliography:                                │   │
│  │  Chen, L., Kim, S., & Park, J. (2023).        │   │
│  │      Title of the article. Journal of          │   │
│  │      Examples, 15(2), 100–115.                 │   │
│  │      https://doi.org/10.1234/example           │   │
│  │  Smith, J. A., & Jones, B. C. (2024). ...     │   │
│  │                                                │   │
│  └──────────────────────────────────────────────┘   │
│                                                      │
│  ┌────────────┐  ┌───────────────┐  ┌───────────┐  │
│  │ ◉ Download  │  │ ✎ Customize   │  │ ↺ Start   │  │
│  │   YAML      │  │   Further     │  │   Over    │  │
│  └────────────┘  └───────────────┘  └───────────┘  │
│                                                      │
│  ┌────────────────────────────────────────────┐      │
│  │ 💾 Save to Library (sign in with GitHub)    │      │
│  └────────────────────────────────────────────┘      │
│                                                      │
└────────────────────────────────────────────────────┘
```

**Name Input:**
- Text field, required, max 100 characters.
- Auto-suggestion generated from preset + deviations (e.g., "APA Author-Date" if no
  changes, "APA with Full Names" if initials were changed to full).
- Used as the `info.title` in the generated YAML and sanitized for the download
  filename.

**Actions:**
- **Download YAML:** Generates the Citum style YAML and triggers a file download.
  Filename: slugified title (e.g., `my-department-style.yaml`).
- **Customize Further:** Transitions to Phase 2 (Visual Customizer).
- **Start Over:** Resets all wizard state, returns to Step 1.
- **Save to Library:** Requires authentication. Saves the style to the user's
  PostgreSQL-backed library. If not authenticated, shows GitHub OAuth prompt.

**Behavior:**
- The preview shows all relevant citation modes for the selected family:
  - Author-date: parenthetical + narrative + bibliography
  - Numeric: in-text numbers + bibliography
  - Note: footnote (full + short) + bibliography (if enabled)
- Preview uses 5-6 diverse reference types (article-journal, book, chapter,
  report, thesis, webpage) drawn from field-specific test data.
- Back button returns to Steps 4-6 (refinement screen).

---

## 5. Phase 2: Visual Customizer

### Purpose

Direct manipulation of the rendered output. Users click on any element in the
preview to open a contextual editor for that component. This is where "almost
right" becomes "exactly right".

### Layout

```
┌──────────────────────────────────────────────────────────┐
│  ◀ Back to Quick Start          Visual Customizer         │
├──────────────────────────────────────────────────────────┤
│                                                            │
│  Reference type: [Article ▾] [Book] [Chapter] [Report]     │
│                                                            │
│  ┌─────────────────────────────────────────────┐           │
│  │               LIVE PREVIEW                   │           │
│  │                                               │           │
│  │  ╔═══════════════╗                            │           │
│  │  ║ Smith, J. A.  ║, & Jones, B. C. (2024).   │           │
│  │  ╚═══════════════╝                            │           │
│  │  Title of the article. Journal of Examples,   │           │
│  │  15(2), 100–115.                              │           │
│  │  https://doi.org/10.1234/example              │           │
│  │                                               │           │
│  └─────────────────────────────────────────────┘           │
│          ↕ Click any element to edit                        │
│                                                            │
│  ┌─────────────────────────────────────────────┐           │
│  │            COMPONENT EDITOR                  │           │
│  │                                               │           │
│  │  Editing: Author (first position)             │           │
│  │                                               │           │
│  │  Name order     [Family, Given ▾]             │           │
│  │  Initials       [J. A. ▾]                     │           │
│  │  And connector  [& ▾]                         │           │
│  │  Et al. after   [3 ▾]                         │           │
│  │                                               │           │
│  │  [Apply to all types]  [Only for articles]    │           │
│  │                                               │           │
│  └─────────────────────────────────────────────┘           │
│                                                            │
└──────────────────────────────────────────────────────────┘
```

### Interactive Preview

The WASM renderer must produce HTML with semantic annotations so that each rendered
element maps back to a template component. The WASM bridge should return structured
HTML like:

```html
<span class="citum-component" data-component="contributor" data-role="author"
      data-index="0">Smith, J. A.</span
><span class="citum-delimiter">, &amp; </span
><span class="citum-component" data-component="contributor" data-role="author"
      data-index="1">Jones, B. C.</span>
<span class="citum-component" data-component="date" data-field="issued">
  (2024)</span>.
<span class="citum-component" data-component="title" data-field="title">
  Title of the article</span>.
<span class="citum-component" data-component="title" data-field="container-title"
      style="font-style: italic">Journal of Examples</span>,
<span class="citum-component" data-component="number" data-field="volume">
  15</span>(<span class="citum-component" data-component="number"
  data-field="issue">2</span>),
<span class="citum-component" data-component="number" data-field="page">
  100–115</span>.
```

**Hover behavior:**
- Hovering over a component highlights it with a colored outline + tooltip showing
  the component type ("Author", "Date", "Title", "Volume", "DOI", etc.).
- The cursor changes to a pointer to signal clickability.

**Click behavior:**
- Clicking a component opens the Component Editor panel below the preview.
- The clicked element gets a persistent highlight (the "selected" state).
- The Component Editor shows options relevant to that component type.

### Component Editor Panels

Each template component type has a dedicated editor panel:

#### Contributor Editor

| Control | Maps To | Options |
|---------|---------|---------|
| Name order | `form` | Family-first, Given-first |
| First author inverted | `first-author-inverted` | Yes (family-first for first, given-first for rest) / No |
| Initials | `initialize-with` | `". "` (J. A.) / `""` (JA) / omit (full names) |
| And connector | `and` | `symbol` (&) / `text` (and) / omit |
| Et al. threshold | `shorten.min` | Number selector (1-20) |
| Et al. display | `shorten.use-first` | Number selector (1-20) |
| Label | `label` | None / Short (ed.) / Long (editor) / Verb (edited by) |
| Font | `emph`, `strong`, `small-caps` | Checkboxes |

#### Date Editor

| Control | Maps To | Options |
|---------|---------|---------|
| Format | `form` | Year / Month-Year / Full / Numeric |
| Wrap | `wrap` | Parentheses / Brackets / None |
| Prefix/Suffix | `prefix`, `suffix` | Text input |
| Font | `emph`, `strong` | Checkboxes |

#### Title Editor

| Control | Maps To | Options |
|---------|---------|---------|
| Case | `text-case` | Sentence / Title / As-Is / Lowercase |
| Style | `emph`, `quote` | Italic / Quoted / Plain |
| Prefix/Suffix | `prefix`, `suffix` | Text input |

#### Number Editor (Volume, Issue, Pages, Edition)

| Control | Maps To | Options |
|---------|---------|---------|
| Wrap | `wrap` | Parentheses / Brackets / None |
| Prefix | `prefix` | Text input (e.g., "vol. ", "pp. ") |
| Suffix | `suffix` | Text input |
| Font | `strong`, `emph` | Checkboxes |

#### Variable Editor (Publisher, URL, DOI, etc.)

| Control | Maps To | Options |
|---------|---------|---------|
| Show/Hide | `suppress` | Toggle |
| Prefix | `prefix` | Text input |
| Suffix | `suffix` | Text input |
| Font | `emph`, `strong` | Checkboxes |
| Link | (DOI/URL only) | Render as hyperlink toggle |

### Type-Specific Overrides

The reference type selector tabs above the preview let the user switch between
rendered examples of different reference types (article, book, chapter, report,
thesis, webpage).

When the user edits a component while viewing a specific type, the wizard asks:

```
┌────────────────────────────────────────────┐
│  Apply this change to:                      │
│                                              │
│  ◉ All reference types (recommended)        │
│  ○ Only Article Journal                      │
│                                              │
│  [Apply]                                     │
└────────────────────────────────────────────┘
```

- **"All types"** modifies the base template component → high concision SQI.
- **"Only [type]"** creates a type-override entry in `bibliography.type-templates`
  → lower concision but necessary for type-specific formatting.

The default is always "All types" to nudge toward high SQI. Type-specific overrides
are clearly marked in the preview with a small badge: `[article only]`.

### Adding and Removing Components

Beyond editing existing components, users may need to add or remove elements:

**Remove:** Right-clicking (or long-pressing on mobile) a component shows a context
menu with "Hide this element" (sets `suppress: true`). Suppressed components show as
faded/strikethrough in the preview and can be re-enabled.

**Add:** A "+" button at the end of the bibliography entry opens a component picker:

```
┌─ Add Component ──────────────┐
│                                │
│  ◉ Field       [DOI ▾]        │
│  ○ Text        [________]     │
│  ○ Localized   [retrieved ▾]  │
│                                │
│  [Add after: Page numbers ▾]   │
│  [Insert]                      │
└────────────────────────────────┘
```

This adds a new `TemplateVariable`, `TemplateNumber`, or `TemplateTerm` to the
template at the specified position.

### Delimiter Editing

Delimiters between components (periods, commas, spaces) are shown as subtle
markers between components. Clicking a delimiter opens a small inline editor:

```
  Smith, J. A.  [ . ]  Title of the article
                  ↑ click to change delimiter
```

Options: `. ` (period-space), `, ` (comma-space), `; ` (semicolon-space), ` `
(space only), or custom text input. This maps to the `suffix` of the preceding
component or `prefix` of the following component, depending on which produces
cleaner YAML.

---

## 6. Phase 3: Advanced Editor

### Purpose

Full access to the style schema for expert users. Accessible via an "Advanced"
toggle in the Visual Customizer.

### Features

#### 6.1 Type-Template Manager

A dedicated view for managing type-specific bibliography templates:

```
┌─ Type Templates ─────────────────────────────────────────┐
│                                                            │
│  Base template (all types)           [Edit visually]       │
│  ├─ article-journal                  [Override] [Remove]   │
│  ├─ book                             [Override] [Remove]   │
│  ├─ chapter                          ← uses base template  │
│  ├─ report                           [Override] [Remove]   │
│  ├─ thesis                           ← uses base template  │
│  └─ webpage                          ← uses base template  │
│                                                            │
│  Types using the base template are grayed out.             │
│  "Override" creates a copy of the base template for that   │
│  type, which can then be customized independently.         │
│                                                            │
└──────────────────────────────────────────────────────────┘
```

This gives experts visibility into the override structure and its SQI implications.
A sidebar indicator shows: "Concision score: 87 — fewer overrides = higher score."

#### 6.2 Options Panel

Global formatting options not covered by the visual customizer:

| Option | Control | Maps To |
|--------|---------|---------|
| Page range format | Dropdown | `options.page-range-format` |
| Punctuation in quotes | Toggle | `options.punctuation-in-quote` |
| Hanging indent | Toggle | `options.bibliography.hanging-indent` |
| Entry spacing | Number input | `options.bibliography.entry-spacing` |
| Subsequent citation | Dropdown | `citation.subsequent` template |
| Ibid handling | Toggle + options | `citation.ibid` |
| Sort order | Dropdown | `bibliography.sort` |
| Substitute rules | Multi-select | `options.substitute` |

#### 6.3 YAML Editor

A syntax-highlighted YAML editor (CodeMirror or Monaco) with:

- **Live validation:** Red underlines on invalid YAML or schema violations, powered
  by the WASM bridge's `validateStyle()` function.
- **Live preview:** The left panel continues to show rendered output, updating as
  the user types (debounced at 300ms).
- **Schema autocomplete:** Suggestions based on the Citum JSON Schema (generated
  from Rust types via `cargo run --bin citum -- schema`).
- **Bidirectional sync:** Changes in the YAML editor update the Visual Customizer
  state, and vice versa. The user can switch freely between visual and code views.

---

## 7. Preview System

### 7.1 Reference Data

The preview uses field-specific reference sets that stress-test diverse formatting
scenarios. Each set contains 6-8 references covering:

| Type | Why Included | Stress Tests |
|------|-------------|--------------|
| `article-journal` | Most common | Volume, issue, pages, DOI |
| `book` | Second most common | Publisher, place, edition |
| `chapter` | Tests container relationships | Editor, book title, pages |
| `report` | Institutional author | Organization names, report numbers |
| `thesis` | University context | Degree type, institution |
| `webpage` | Digital-only | URL, access date, no volume/pages |
| `paper-conference` | Event context | Conference name, proceedings |
| `article-magazine` | (optional) | Popular press, no DOI |

References should include edge cases: multi-author (for et al.), institutional
author (for literal names), translated works (for translator handling), and
entries with missing fields (for fallback/substitute behavior).

The existing `preview_data.rs` field-specific sets should be serialized as JSON
and bundled with the WASM module for client-side use.

### 7.2 Rendering Pipeline

```
User changes setting
        │
        ▼
WizardStore updates parsedStyle
        │
        ▼
serializeToYaml(parsedStyle) → yaml string
        │
        ▼
wasmBridge.renderBibliography(yaml, refs) → annotated HTML
wasmBridge.renderCitation(yaml, refs, mode) → annotated HTML
        │
        ▼
Preview component receives HTML, renders with interactive overlays
```

**Performance target:** <50ms from setting change to preview update. The WASM
bridge should be pre-initialized at page load. The serialization step should be
incremental (only re-serialize changed sections).

### 7.3 Annotated Rendering Mode

The WASM bridge needs a new rendering mode (`annotated: true`) that wraps each
output token in a `<span>` with `data-component` attributes identifying the
source template component. This is required for the click-to-edit feature in
Phase 2.

The annotated mode is used only in the wizard; the standard rendering mode (for
published styles) remains unchanged.

---

## 8. SQI-Aware Design

The wizard should actively guide users toward high-SQI styles. This is not about
scoring — users never see "SQI" — but about designing interactions that naturally
produce maintainable, clean styles.

### 8.1 Preset Preservation

When the user's settings match a known preset, the YAML output uses the preset
name rather than expanding to explicit configuration:

```yaml
# High SQI (preset match)
options:
  contributors: apa

# Lower SQI (expanded — same behavior, harder to maintain)
options:
  contributors:
    form: short
    and: symbol
    initialize-with: ". "
    shorten:
      min: 3
      use-first: 1
```

The wizard tracks preset deviation and only expands when necessary. A subtle
indicator could show: "Based on APA preset" or "Custom configuration" — this
helps users understand they're building on a standard.

### 8.2 Type-Override Discipline

The "Apply to all types" default in the Component Editor nudges users toward
fewer type-overrides (higher concision score). Type-overrides are still easy to
create, but the default is always the base template.

### 8.3 Template Reuse (use_preset)

When a user's bibliography template exactly matches a known embedded template
(APA, Chicago, Vancouver, IEEE, Harvard), the YAML uses `use_preset: apa`
instead of inlining the full template. The wizard automatically detects this.

### 8.4 SQI Dashboard (Advanced Only)

In the Advanced Editor, an optional SQI panel shows the four subscores with
brief explanations:

```
┌─ Style Quality ──────────────────────────────────┐
│                                                    │
│  Overall                          ████████░░  85   │
│                                                    │
│  Type Coverage         30%        ██████████  95   │
│  Fallback Robustness   20%        ████████░░  82   │
│  Concision             25%        ███████░░░  78   │
│  Preset Usage          25%        ████████░░  84   │
│                                                    │
│  Tip: Use the APA contributor preset instead of    │
│  custom settings to improve your concision score.  │
│                                                    │
└────────────────────────────────────────────────────┘
```

This is strictly opt-in (Advanced tier) and never shown to general users.

---

## 9. Data Model

### 9.1 WizardState

The central store uses Svelte 5 runes (`$state`, `$derived`):

```typescript
interface WizardState {
  // Phase 1 tracking
  phase: 'quick-start' | 'visual-customizer' | 'advanced';
  quickStartStep: number; // 1-7
  field: CitationField | null;
  family: 'author-date' | 'numeric' | 'note' | null;
  presetName: string | null; // 'apa', 'chicago-ad', 'vancouver', etc.

  // The style being built (single source of truth)
  style: Style;

  // Deviation tracking for SQI optimization
  contributorPresetMatch: string | null; // null = custom
  datePresetMatch: string | null;
  titlePresetMatch: string | null;
  templatePresetMatch: string | null;

  // UI state
  selectedComponent: ComponentSelection | null;
  activeReferenceType: string; // 'article-journal', 'book', etc.
  styleName: string;

  // Undo history
  history: Style[];
  historyIndex: number;
}

interface ComponentSelection {
  componentType: 'contributor' | 'date' | 'title' | 'number' | 'variable' | 'term';
  index: number; // position in template
  scope: 'base' | string; // 'base' or type name for type-override
}
```

### 9.2 Style ↔ YAML Serialization

The `Style` TypeScript type is generated from the Rust `Style` struct via Specta
at build time. Serialization to YAML uses a custom serializer that:

1. Replaces expanded configs with preset names when they match
2. Omits default values (e.g., `version: "0.8.0"` is always included but other
   defaults are elided)
3. Orders keys in the canonical order: `version`, `info`, `options`, `citation`,
   `bibliography`

### 9.3 Preset Registry

All presets are bundled as a JSON registry at build time:

```typescript
interface PresetRegistry {
  contributors: Record<string, ContributorConfig>;
  dates: Record<string, DateConfig>;
  titles: Record<string, TitleConfig>;
  templates: Record<string, {
    citation: Template;
    bibliography: Template;
  }>;
}
```

Generated from the Rust `TemplatePreset` and options preset enums. This enables
client-side preset matching without server round-trips.

---

## 10. Component Architecture

### 10.1 Route Structure

```
/create/                   → Redirects to /create/field
/create/field              → Step 1: Field selector
/create/family             → Step 2: Style family
/create/preset             → Step 3: Preset gallery
/create/refine             → Steps 4-6: Refinement
/create/review             → Step 7: Review & name
/create/customize          → Phase 2: Visual customizer
/create/advanced           → Phase 3: Advanced editor
```

Each route is a SvelteKit page that reads from and writes to the shared
`WizardStore`. URL-based routing enables deep linking and browser back/forward.

### 10.2 Component Tree

```
+layout.svelte
├── WizardHeader.svelte          # Progress, back button, phase indicator
├── +page.svelte (per route)
│   ├── FieldSelector.svelte     # Step 1
│   ├── FamilySelector.svelte    # Step 2
│   ├── PresetGallery.svelte     # Step 3
│   ├── RefinementPanel.svelte   # Steps 4-6
│   │   ├── NameOptions.svelte
│   │   ├── DateOptions.svelte
│   │   └── TitleOptions.svelte
│   ├── ReviewScreen.svelte      # Step 7
│   ├── VisualCustomizer.svelte  # Phase 2
│   │   ├── InteractivePreview.svelte
│   │   ├── ComponentEditor.svelte
│   │   │   ├── ContributorEditor.svelte
│   │   │   ├── DateEditor.svelte
│   │   │   ├── TitleEditor.svelte
│   │   │   ├── NumberEditor.svelte
│   │   │   └── VariableEditor.svelte
│   │   ├── TypeSelector.svelte
│   │   └── ComponentAdder.svelte
│   └── AdvancedEditor.svelte    # Phase 3
│       ├── TypeTemplateManager.svelte
│       ├── OptionsPanel.svelte
│       ├── YamlEditor.svelte
│       └── SqiDashboard.svelte
└── PreviewPane.svelte           # Shared live preview (WASM-rendered)
```

### 10.3 Shared Components

- **PreviewPane.svelte**: Renders citations and bibliography via WASM. Accepts
  `annotated: boolean` prop to enable click-to-edit overlays. Used across all
  phases.
- **WizardHeader.svelte**: Shows phase indicator (Quick Start / Customize /
  Advanced), back button, and breadcrumb trail (e.g., "Sciences > Numeric >
  Vancouver").

---

## 11. WASM Bridge Requirements

The existing `wasm-bridge` crate needs these additions for v2:

### New Functions

```rust
/// Render bibliography with component annotations for click-to-edit
#[wasm_bindgen]
pub fn render_bibliography_annotated(
    style_yaml: &str,
    refs_json: &str,
) -> Result<String, JsValue>;

/// Render citation with component annotations
#[wasm_bindgen]
pub fn render_citation_annotated(
    style_yaml: &str,
    refs_json: &str,
    mode: &str, // "integral", "non-integral"
) -> Result<String, JsValue>;

/// Validate a style YAML and return structured errors
#[wasm_bindgen]
pub fn validate_style(style_yaml: &str) -> Result<String, JsValue>;
// Returns JSON: { valid: boolean, errors: [{path: string, message: string}] }

/// Check if a contributor config matches a known preset
#[wasm_bindgen]
pub fn match_contributor_preset(config_json: &str) -> Option<String>;
// Returns preset name or null

/// Serialize a Style object to YAML with preset optimization
#[wasm_bindgen]
pub fn style_to_yaml(style_json: &str) -> Result<String, JsValue>;
```

### Annotated Rendering

The annotated rendering mode requires changes to the citum-engine renderer. Each
rendered token must carry metadata identifying its source template component. The
engine should emit structured output that the WASM bridge formats as annotated
HTML.

This is the single largest implementation task and should be built incrementally:
1. First: annotate top-level components (contributor block, date, title, etc.)
2. Then: annotate within-component elements (individual author names, initials)
3. Finally: annotate delimiters and punctuation

---

## 12. Navigation & State

### 12.1 URL State

The wizard phase and step are encoded in the URL path (see 10.1). This enables:
- Browser back/forward navigation
- Deep linking to any wizard step
- Page refresh without state loss (WizardStore persists to `sessionStorage`)

### 12.2 Undo/Redo

The WizardStore maintains a history stack of `Style` snapshots:
- Every user action that modifies the style pushes a snapshot.
- Ctrl+Z / Cmd+Z pops the stack (undo).
- Ctrl+Shift+Z / Cmd+Shift+Z re-applies (redo).
- History is capped at 50 entries to limit memory usage.

### 12.3 Progress Indicator

Phase 1 uses a step-based progress bar:
- Total steps = 7 (fixed, regardless of branch).
- Current step = the route's step number.
- Back navigation updates the progress bar accurately (no missing_fields drift).

Phase 2 and 3 do not show a progress bar (there is no linear path to "complete").
Instead, the header shows the current phase name.

### 12.4 Session Persistence

`WizardStore` serializes to `sessionStorage` on every state change. If the user
refreshes or navigates away and returns, the wizard resumes where they left off.
A "Start Over" action clears `sessionStorage`.

---

## 13. Mobile & Responsive Design

### Layout Breakpoints

| Breakpoint | Layout |
|-----------|--------|
| Desktop (≥1024px) | Side-by-side: options left, preview right |
| Tablet (768-1023px) | Stacked: preview above, options below |
| Mobile (<768px) | Single column: options only, preview in collapsible drawer |

### Mobile-Specific Adaptations

- **Step 1 (Field):** Cards stack 1-column.
- **Steps 4-6 (Refine):** Sections stack vertically; preview available via a
  floating "Preview" button that opens a bottom sheet.
- **Phase 2 (Visual Customizer):** The interactive preview becomes a scrollable
  top section; the component editor is a bottom sheet that slides up on tap.
- **Phase 3 (YAML Editor):** Full-screen with a toggle button for preview.

### Touch Interactions

- **Tap** replaces click for component selection.
- **Long press** replaces right-click for context menus (remove component, etc.).
- **Swipe left/right** navigates between reference type tabs.

---

## 14. Accessibility

- All interactive elements have `aria-label` attributes.
- Component editor panels use `role="dialog"` with focus trapping.
- The preview area has `aria-live="polite"` so screen readers announce updates.
- Keyboard navigation: Tab cycles through components in the preview; Enter opens
  the editor; Escape closes it.
- Color is never the sole indicator of state (selected, error, etc.) — icons and
  text labels are always present.
- All dropdowns are native `<select>` elements or use a custom component with
  proper ARIA roles (`listbox`, `option`).

---

## 15. Error Handling

| Error | UI Response |
|-------|-------------|
| WASM fails to load | Show error banner with "Reload" button; disable preview |
| YAML validation fails | Red underline on invalid field; tooltip with error message |
| Preset not found | Fall back to explicit configuration; log warning |
| Render throws | Show last valid preview with "Preview outdated" banner |
| Network error (save) | Retry button; offline indicator; queue save for later |
| Session storage full | Warn user; offer to clear old wizard sessions |

---

## 16. Migration from v1

### Backward Compatibility

- The v1 API endpoints (`/api/v1/decide`, `/api/v1/generate`, `/api/v1/preview`)
  remain functional. Existing saved styles with `intent` data continue to work.
- The v1 wizard route (`/create-wizard`) redirects to `/create/field` with a
  banner: "We've redesigned the style builder!"
- Existing styles saved with the v1 wizard can be loaded into the v2 Visual
  Customizer via their stored YAML (not their `intent` object).

### Data Migration

Styles stored in PostgreSQL with `intent` JSON are not modified. The v2 wizard
reads and writes `citum` (YAML) directly, ignoring the `intent` column. A future
migration can backfill `citum` for styles that only have `intent`.

---

## 17. Acceptance Criteria

An implementation is complete when:

### Phase 1: Quick Start
1. Field selector shows 6 discipline cards; selection advances to family step.
2. Family selector shows 3 panels with rendered paragraph examples; field-default
   is highlighted with a recommendation badge.
3. Preset gallery shows 3-5 cards per family, each with a WASM-rendered mini
   bibliography of 3 reference types.
4. Refinement screen shows Names, Dates, Titles sections simultaneously with
   dropdown controls; changes update the live preview within 50ms.
5. Review screen shows a name input (required, validated), full preview, and
   Download/Customize/Start Over/Save actions.
6. Download produces valid Citum YAML that passes `validateStyle()`.
7. All preset-matching settings use preset names in the generated YAML.
8. Back navigation works on all steps; state is preserved.
9. Progress bar shows accurate step position (no backward jumps).
10. Total time from start to download ≤ 2 minutes for a user accepting defaults.

### Phase 2: Visual Customizer
11. Hovering over rendered components highlights them with a colored outline.
12. Clicking a component opens the correct editor panel with current values.
13. Changes in the editor panel update the preview within 50ms.
14. Reference type tabs switch the preview between article, book, chapter, etc.
15. "Apply to all types" vs. "Only for [type]" creates appropriate YAML structure.
16. Components can be suppressed (hidden) and re-enabled.
17. New components can be added at any position in the template.
18. Delimiter editing works for punctuation between components.
19. Undo/Redo works for all edits (Ctrl+Z / Ctrl+Shift+Z).

### Phase 3: Advanced Editor
20. Type-template manager shows override structure clearly.
21. Options panel exposes all `Config` settings not covered by Phase 2.
22. YAML editor has syntax highlighting, validation, and live preview.
23. Bidirectional sync between visual and YAML views works without data loss.
24. SQI dashboard shows four subscores with actionable improvement tips.

### Cross-Cutting
25. WASM bridge loads and renders on Chrome, Firefox, Safari, and Edge.
26. Mobile layout is usable on 375px-wide screens (no horizontal scroll).
27. Session persistence: refresh preserves all wizard state.
28. Accessible: keyboard-navigable, screen-reader-compatible.
29. Generated styles from the wizard score SQI ≥ 75 when using a preset base.

---

## 18. Implementation Priority

### Wave 1: Quick Start MVP
- Steps 1-3 (field → family → preset) with WASM preview
- Step 7 (review & download) with name input
- Skip steps 4-6 (refinement) — go straight from preset to review
- WASM bridge: `render_bibliography`, `render_citation`, `validate_style`

### Wave 2: Refinement & Visual Basics
- Steps 4-6 (names, dates, titles refinement controls)
- Phase 2 basic: annotated rendering, click-to-select (highlight only)
- Component Editor for contributor, date, title types

### Wave 3: Full Visual Customizer
- Component Editor for all types (number, variable, term)
- Type-specific override UI with "all types" / "only [type]" prompt
- Add/remove components
- Delimiter editing
- Undo/redo

### Wave 4: Advanced Editor
- Type-template manager
- Options panel
- YAML editor with bidirectional sync
- SQI dashboard

---

## 19. Open Questions

1. **Annotated rendering scope.** How deep should annotations go? Annotating
   top-level components (author block, date, title) is straightforward. Annotating
   *within* an author block (each individual name, the "et al." text, the "&"
   connector) requires the engine to emit much finer-grained markup. Start with
   top-level and iterate.

2. **Preset registry freshness.** If new presets are added to citum-core, the
   client-side registry needs rebuilding. Should this be a build-time step
   (static JSON) or a runtime fetch from the server? Build-time is simpler and
   avoids network dependency; runtime allows updates without redeploying the
   frontend.

3. **Save-to-library granularity.** Should the wizard save the `WizardState`
   (allowing re-entry into the wizard) or only the generated YAML? Saving
   `WizardState` enables "Resume editing in wizard" but adds storage complexity.
   Saving only YAML is simpler but means re-editing requires the Visual Customizer
   (no wizard re-entry). Given that only wizard-created styles need round-trip
   support, saving `WizardState` alongside the YAML is recommended.

4. **Citation template editing.** The Visual Customizer spec focuses on
   bibliography editing. Citation templates (especially author-date with
   integral/non-integral modes) need their own editing surface. The same
   click-to-edit pattern applies, but the rendered context is different (inline
   citations vs. bibliography entries). This should be designed in Wave 3.

---

## 20. References

- `WIZARD_UX_SPEC.md` — v1 spec (branching flow, acceptance criteria, audit findings)
- `STYLE_EDITOR_VISION.md` — Platform-level Find/Tweak/Build strategy
- `citum-core/docs/reference/SQI.md` — SQI scoring system
- `citum-core/docs/architecture/DESIGN_PRINCIPLES.md` — Style design philosophy
- `citum-core/crates/citum-schema-style/src/presets.rs` — Preset definitions
- `citum-core/crates/citum-schema-style/src/template.rs` — Template component types
- `server/crates/wasm-bridge/` — Existing WASM bridge (to be extended)
- `server/crates/intent-engine/` — v1 decision engine (retained, not used by v2)
