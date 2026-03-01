# Create Wizard UX Specification

**Audience:** LLM agents (future implementers), with human reviewers as secondary readers.

**Purpose:** Define interaction patterns, flow architecture, and evaluation rubrics for the citation style creation wizard. This spec enables confident critique and iteration without human re-specification.

---

## 1. Personas & Intent

### Intended Users

The wizard does not distinguish by seniority or career stage — what matters is **discipline**. A grad student in chemistry and a senior chemist have the same citation needs. The branching logic serves the field, not the person.

One additional archetype — Librarian / Admin — has distinct needs around completeness and repeatability, but follows the same branch structure.

| Persona | Profile | Citation Style Expectation | Success Metric |
|---------|---------|---------------------------|-----------------|
| **Academic Researcher** | Any career stage; field-specific | Expects the conventions of their discipline without having to name them | Reaches a correct style quickly, without needing citation expertise |
| **Librarian / Admin** | Building institution or journal styles, edge case coverage | Full control, all variants covered, auditable output | All options visible, testable, repeatable |

### Entry Points & Context

- **From library search:** User found a close style (e.g., "APA") and selected "Create variant" or "Start fresh"
- **From journal submission form:** Author instructions link to wizard with pre-filled field hint
- **Direct from homepage:** User clicked "Build New Style" with no prior context
- **From style editor:** User decided to start over rather than tweak

**Critical insight:** Users do NOT arrive with a clear citation style in mind. They arrive with a **problem** ("I need to cite X the way my field does it") or a **reference** ("my journal uses this format").

---

## 2. Branching Flow Architecture

### Core Principle

The wizard MUST branch by **discipline/field first**, then by **style family**, then by specific options. This respects academic conventions and reduces cognitive load.

```
START
 └─ What is your primary discipline/field?
     ├─ Social Sciences → Author-date family
     │   ├─ APA (default) → Customize
     │   ├─ ASA → Customize
     │   └─ Chicago Author-Date → Customize
     │
     ├─ Humanities → Note family
     │   ├─ Chicago Notes (default) → Customize
     │   ├─ MHRA → Customize
     │   └─ Turabian Notes → Customize
     │
     ├─ Law → Note family (legal)
     │   ├─ Bluebook → Customize
     │   ├─ OSCOLA → Customize
     │   └─ Jurisdiction-specific → Customize
     │
     ├─ Natural Sciences → Numeric family
     │   ├─ ACS → Customize
     │   ├─ Vancouver → Customize
     │   └─ Nature → Customize
     │
     ├─ Medicine / Clinical → Numeric or Vancouver
     │   ├─ Vancouver (default) → Customize
     │   └─ Numeric variant → Customize
     │
     └─ Other / Interdisciplinary → Open chooser (same UX for both)
         └─ Which citation style family does your work use?
             ├─ Author-Date → Customize (full options, no disciplinary filtering)
             ├─ Note → Customize (full options)
             └─ Numeric → Customize (full options)
```

### Branch Differentiation

**Author-Date Branch Preview:**
- Emphasize in-text narrative and parenthetical citations
- Show examples: "(Smith, 2020)" and "Smith (2020) argues..."
- Highlight: author name order, date format, et-al thresholds

**Note Branch Preview:**
- Emphasize footnote/endnote structure
- Show full note on first mention, shortened note on repeat
- Highlight: superscript numbers, note styling, bibliography relationship

**Numeric Branch Preview:**
- Emphasize numeric citations [1], [2], etc.
- Show how references are numbered and ordered
- Highlight: citation numbering scheme (sequential, alphabetical), reference ordering

**Legal Branch Preview:**
- Law uses **note-class** citations (footnotes), not a separate citation class
- Emphasize footnote structure: case name, reporter, jurisdiction, pinpoint
- Show full footnote on first citation; shortened form on repeat (same as humanities note class)
- Highlight: short-form citation, reporter abbreviations, legal grouping rules
- Legal styles may group references by type (cases, statutes, secondary sources) — preview should demonstrate this if the chosen style supports grouping

---

## 3. Step-by-Step Interaction Model

### Entry Step (Must Orient First)

**Step 0: Field/Discipline Selector**

- **Question:** "What is your primary academic discipline or field?"
- **Why first:** Establishes context for all downstream choices. Prevents "Which citation style?" from being asked into a vacuum.
- **UI:** Single-select radio buttons or cards, grouped by cluster (shown above). Do NOT use dropdown.
- **Preview:** NONE. Too early for citations.
- **Back button:** Disabled (entry point).
- **Next:** Auto-advance or require explicit "Next" button.

### Decision Steps (Branch-Aware)

**Steps 1–N: Style Family & Presets**

Structure varies by branch:

#### Social Sciences (Author-Date) Path
1. **Field chosen: Social Sciences** → Auto-show author-date family options
2. **Which APA variant?** (or "Would you like APA?")
   - **Choices:** Use APA 7, Use APA 6, Use APA (latest)
   - **Preview:** "Smith et al. (2020) conducted..." and "(Smith et al., 2020)"
   - **Can skip/defer:** "I'll choose later" or pre-select APA as default
3. **Contributor options** (if preset exists)
   - **Q:** How should names appear?
   - **Choices:** "All authors, All initials", "All authors, First initials", "Last name + initials", etc.
   - **Preview:** Varies by choice (e.g., "Smith, J." vs. "Smith, John")
4. **Date format**
   - **Q:** How should dates appear?
   - **Choices:** "Full (Jan 1, 2020)", "Abbreviated (1/1/2020)", "Year only (2020)"
   - **Preview:** Shows both in-text and bibliography
5. **Et-al threshold** (advanced)
   - **Q:** After how many authors use "et al"?
   - **Choices:** 2, 3, 4, or later
   - **Preview:** "Smith et al. (2020)" with chosen threshold applied

#### Humanities (Note) Path
1. **Field chosen: Humanities** → Auto-show note family options
2. **Which note style?**
   - **Choices:** Chicago Manual of Style (Notes & Bibliography), MHRA, Turabian
   - **Preview:** Full note example + shortened note on second citation
   - **Example:**
     - Full: "Jennifer L. Smith, *The Title of the Book* (Publisher, 2020), 42."
     - Short: "Smith, *Title*, 42."
3. **Bibliography alphabetization & styling**
   - **Q:** How should bibliography entries be arranged and styled?
   - **Choices:** "Alphabetical by author, hanging indent", "Chronological by year", etc.
   - **Preview:** 3–4 sample bibliography entries

#### Legal Path
Law uses the **note class** (footnotes), not a distinct citation class. The branching logic is the same as humanities, but with legal-specific presets and grouping rules.

1. **Field chosen: Law** → Auto-show legal note style options
2. **Which legal citation system?**
   - **Choices:** Bluebook, OSCOLA, jurisdiction-specific
   - **Preview:** Full footnote — case name, reporter, page, pinpoint (e.g., "*Smith v Jones* [2020] EWCA Civ 123, [45].")
3. **Short-form preferences**
   - **Q:** How should subsequent citations appear?
   - **Preview:** Full footnote (first) → shortened form (repeat)
4. **Reference grouping**
   - **Q:** Should references be grouped by type? (Cases / Statutes / Secondary sources)
   - This is a legal-specific option not shown on other note-class branches
   - **Preview:** Bibliography grouped by category if enabled

#### Natural Sciences (Numeric) Path
1. **Field chosen: Natural Sciences** → Auto-show numeric family
2. **Which numeric style?**
   - **Choices:** ACS, Vancouver, Nature, IEEE, etc.
   - **Preview:** "[1] Author et al., Journal. 2020;vol:pages." format
3. **Reference ordering**
   - **Q:** How should references be ordered?
   - **Choices:** "Sequential (as cited)", "Alphabetical", "By importance"
   - **Preview:** Numbered bibliography with chosen order applied

### Completion Step

**When all required fields are filled:**

**Step N+1: Configuration Complete**

- **State:** No question posed. Dispatch event `{ question: null }`.
- **UI Display:**
  - Green checkmark icon
  - "Style Ready!" heading
  - Confirmation text: "Your citation style has been configured."
  - **Actions:**
    - **"Download Citum Style"** (primary button) — Exports as YAML
    - **"Customize Style"** (secondary) — Enter style editor for manual tweaks (if available)
    - **"Start Over"** (tertiary) — Reset wizard to field selector

---

## 4. Navigation & State Management Rules

### Back Button Behavior

- **Available:** On all steps except entry (field selector).
- **Behavior:** Step backward in history without discarding state.
- **State retention:** All prior answers remain in place. User can re-visit, change, and move forward without re-filling.
- **No reset-to-destroy pattern:** Back button never resets the wizard. Only explicit "Start Over" button should.

### Progress Indicator

**Current Rule (AUDIT FINDING: PROBLEMATIC)**

```javascript
const totalSteps = Math.max(progressBaseline, currentDecision.missing_fields.length, 1);
const completedSteps = totalSteps - currentDecision.missing_fields.length;
const progress = Math.round((completedSteps / totalSteps) * 100);
```

**Issue:** Progress is based on `missing_fields` count, which can be misleading:
- If `missing_fields` shrinks as user adds choices, progress jumps backward (confusing).
- If a new field is added mid-wizard, baseline resets.
- Does not reflect branch depth honestly.

**Recommended Fix:**

```
Progress = (steps_completed_in_branch / expected_steps_for_branch) * 100
```

Example:
- Social Sciences + APA path: 5 expected steps (field, variant, contributors, date, et-al)
- User on step 3 of 5 → 60%
- If user backtracks, progress reflects actual position, not cumulative missing fields

### Completion Condition

- **Trigger:** `decisionPackage.question === null` (backend signals no more decisions).
- **UI transition:** Fade-in animation (already implemented with `animate-in fade-in zoom-in`).
- **Immutable at completion:** Completion UI should be non-interactive until user chooses an action (download, customize, start over).

---

## 5. Preview Strategy by Branch

### Principle

Preview content MUST match the branch's citation style family. Showing author-date citations to a humanities scholar choosing note styles is noise.

### Implementation

**DecisionWizard.svelte current behavior:**

```javascript
function shouldShowChoicePreview() {
    return !['field', 'customize_target'].includes(decisionPackage?.question?.id ?? '');
}
```

This skips previews on "field" and "customize_target" steps. **This is correct.**

**Enhancement:** Branch-aware preview selection.

| Branch | In-Text Preview | Note Preview | Bibliography | Example |
|--------|-----------------|--------------|--------------|---------|
| **Author-Date** | Show both narrative and parenthetical | Hide | Show (if complete) | "(Smith, 2020)" + "Smith, J. (2020)..." |
| **Note (Humanities)** | Hide | Show full + short form | Show | "Smith, *Title*, 42." (full) then "Smith, *Title*, 43." (short) |
| **Note (Legal)** | Hide | Show full + short form; grouped if enabled | Show, grouped by type | "*Smith v Jones* [2020] EWCA Civ 123, [45]." |
| **Numeric** | Show bracketed number | Hide | Show with numbers | "[1] Smith et al., Journal. 2020..." |

### Data Flow

- Backend's `DecisionPackage.previews[].html` should contain pre-rendered branch-appropriate citations.
- Frontend uses `choice.html` as-is (already implemented).
- Backend logic: Filter preview type based on `intent.field` or inferred style family.

---

## 6. Saving & Persistence Rules

### Critical Audit Finding: Hardcoded Title

**Current code (+page.svelte, line 43):**

```javascript
body: JSON.stringify({
    title: 'My Custom Style',  // ❌ HARDCODED
    intent: $intent,
    citum: '',
})
```

**Issue:** All auto-saved styles are named "My Custom Style". This violates UX rule #3 (user-supplied name, never hardcoded).

**Required Fix:**

1. **Add a "Name Your Style" step** at completion or before download:
   - **Q:** "What would you like to call this style?"
   - **Input:** Text field with validation (max 100 chars, alphanumeric + spaces/hyphens).
   - **Suggested default:** Auto-generated based on choices (e.g., "APA with Harvard et-al" or "Chicago Notes, ASA variant").
   - **Validation:** No empty string, no "My Custom Style" allowed.

2. **Move save step to completion** (not auto-save every 3 seconds):
   - Show "Name Your Style" input in completion UI.
   - Require user input before save.
   - Only POST to `/api/styles` after user confirms.

3. **Auth gate:** Only show save if `$auth.user` is present (current behavior is correct).

### Download Behavior

- **Format:** YAML (Citum-compatible).
- **Filename:** Use user-supplied name, sanitized (e.g., "My APA Style" → `my-apa-style.yaml`).
- **Trigger:** "Download Citum Style" button in completion UI.
- **Post-download:** User can either save to library (if authenticated) or use locally.

---

## 7. Current Implementation Audit

### What Works Well

1. **Reactive decision dispatch:** `DecisionWizard` → `+page.svelte` via event dispatch. Clean separation.
2. **Choice preview HTML:** Backend renders relevant citations; frontend displays without re-processing. Efficient.
3. **Completion detection:** `currentDecision.question === null` is unambiguous signal.
4. **Reset capability:** `doReset()` clears state and re-fetches initial decision. Safe.
5. **Error handling:** Network errors caught and displayed with retry.
6. **Download flow:** YAML generation and file download work as intended.

### What Needs Improvement

| Issue | Current Behavior | Required Fix | Severity |
|-------|-----------------|--------------|----------|
| **Entry step orientation** | Wizard jumps to first question (unclear what question is) | Add explicit "What field?" step as Step 0, disable back | **HIGH** |
| **Hardcoded save title** | All saves named "My Custom Style" | Add "Name Your Style" step before save | **HIGH** |
| **Progress bar logic** | Based on `missing_fields`, can jump backward | Redesign as `steps_completed / expected_steps_for_branch` | **MEDIUM** |
| **No branch indication** | User doesn't see they're in "author-date path" vs "note path" | Add breadcrumb or section header after field selection | **MEDIUM** |
| **Preview type mixing** | All previews shown regardless of branch | Filter by branch (hide note previews for author-date users) | **LOW** (nice-to-have) |
| **No onboarding text** | Completion message is generic | Customize message based on branch and choices | **LOW** |

---

## 8. UX Evaluation Rubric for LLM Review

Use this rubric to score wizard implementations and propose improvements confidently.

### Dimension 1: Time to First Meaningful Choice (Urgency)

| Score | Indicator |
|-------|-----------|
| **Excellent** (0–30 sec) | User chooses field/discipline in first step; no abstract setup questions |
| **Good** (30–60 sec) | One orientation step before real choices; user understands context |
| **Acceptable** (60–120 sec) | Two setup questions, but purpose is clear |
| **Poor** (>120 sec) | User confused about what they're building before first real choice; back button used early |

**Metric:** If user hits back button before step 2, time-to-choice was too long.

### Dimension 2: Cognitive Load (Field-Appropriate Choices)

| Score | Indicator |
|-------|-----------|
| **Excellent** | User sees 3–5 choices per step; all relevant to their discipline; previews match branch |
| **Good** | User sees 5–7 choices; mostly relevant; some generic options visible |
| **Acceptable** | 7–10 choices; user can filter mentally; previews sometimes mismatched |
| **Poor** | >10 choices per step; user abandons or chooses randomly; previews generic/unhelpful |

**Metric:** Option count ≤ 7 per step; preview HTML matches branch expectation.

### Dimension 3: Predictability (No Back-Button Surprises)

| Score | Indicator |
|-------|-----------|
| **Excellent** | Back button always returns to prior step; all prior answers intact; progress bar reflects actual position |
| **Good** | Back button mostly works; rare state loss; progress bar occasionally jumps |
| **Acceptable** | Back button works but progress bar misleading; user can recover |
| **Poor** | Back button resets wizard; progress bar meaningless; user loses work |

**Metric:** Trigger `back button usage` metric; if >20% of users use it before step 3, navigation is unintuitive.

### Dimension 4: Output Fidelity (Does Result Match Expectations?)

| Score | Indicator |
|-------|-----------|
| **Excellent** | Generated style matches user's expected citation format without tweaking in 95% of cases |
| **Good** | Generated style is 80% correct; users tweak minor details (et-al threshold, abbreviation) |
| **Acceptable** | Generated style is 60% correct; users need style editor to finish |
| **Poor** | Generated style doesn't match user's expectation; users abandon or feel misled |

**Metric:** Post-completion survey: "Does your generated style match what you expected?" Yes/No. Target: ≥90% yes.

### Dimension 5: Completion Rate (Friction)

| Score | Indicator |
|-------|-----------|
| **Excellent** | ≥80% of users who start complete the wizard without reset |
| **Good** | 70–80% complete without reset |
| **Acceptable** | 60–70% complete (some users restart) |
| **Poor** | <60% complete; high reset usage or abandonment |

**Metric:** Analytics: `completed_steps / started_wizards`.

---

## 9. Interaction Rules (Normative)

### Navigation

1. **Back button** is always available except on entry step.
2. **Forward/Next** is automatic (choice-triggered) or explicit (checkbox confirmation).
3. **Reset button** (Start Over) visible in completion step and (optional) sticky footer during flow. Does not reset mid-step.

### Progress

1. **Progress bar** reflects `current_step / expected_steps_for_branch`, not `missing_fields`.
2. **Breadcrumbs** (optional): Show field + inferred style family (e.g., "Social Sciences > Author-Date > APA").
3. **Step counter** (optional): "Step 2 of 5" only if wizard depth is predictable per branch.

### Previews

1. **Show preview HTML** on all steps except field selector and completion.
2. **Preview type** (in-text vs. note vs. numeric) matches branch expectation.
3. **Preview content** refreshes in real-time as user changes choices.

### Saving & Naming

1. **Name step** appears before final save or at completion.
2. **Text input** validation: required, max 100 chars, sanitized for filename.
3. **Save action** only available to authenticated users (`$auth.user`).
4. **Download** available to all (authenticated or not).

### Completion

1. **Completion UI** shown when `question === null`.
2. **No further decisions** at completion; only actions (download, customize, reset).
3. **Animate transition** with fade-in and optional success sound (if design supports).

---

## 10. Design Tokens & Styling

Per `DESIGN.md`:

- **Primary Color:** Royal Academic Blue (`#135bec`) — action buttons, active states
- **Background:** Cool Mist White (`#f6f6f8`) — app chrome, panel backgrounds
- **Surfaces:** Pure Paper White (`#ffffff`) — cards, preview area
- **Text Primary:** Ink Black (`#0d121b`)
- **Text Secondary:** Muted Steel Blue (`#4c669a`)
- **Borders:** Soft Border Gray (`#e7ebf3`)
- **Font:** Newsreader (serif) for all UI text
- **Border Radius:** Rounded-lg (8px) for buttons, Rounded-2xl (16px) for panels

**Typography:**

- **Section Headers (H2):** Bold, xl size, tracking-tight
- **Question Text (H2):** Bold, lg size
- **Choice Labels:** Medium weight, text-sm
- **Preview Text:** serif, text-xs or text-sm, gray-600

**Animation:**

- **Transitions:** fade-in, slide-in-from-bottom-4, 500ms duration (smooth but not sluggish)
- **Progress bar:** smooth width transition, 500ms
- **Error states:** shake or fade-in red background

---

## 11. Open Design Decisions

### Decision 1: "Other" and Multi-Discipline — Same UX

**Settled:** Both "Other/Interdisciplinary" and "I work across multiple disciplines" land on the same open chooser: a style family picker (Author-Date, Note, Numeric) with no disciplinary filtering. All options are available. This treats the user as expert enough to choose, rather than guessing their context.

**Open sub-question:** Should the open chooser surface a "recommended" option (e.g., Author-Date as default) or present all three equally? Recommend equal presentation — there is no safe default when discipline is unknown.

### Decision 2: Progress Bar Design

**Question:** What should the progress indicator show and how should it be calculated?

This is an open UX research question. Known constraints:
- The current `missing_fields`-based bar can move backward mid-wizard (bad).
- Branch depth varies by field (law has more steps than social sciences).
- Step counting ("Step 3 of 5") breaks if depth is dynamic.

Candidates: percentage of branch steps completed, a breadcrumb trail, a step counter with dynamic total, or no progress bar at all (research shows bars sometimes increase abandonment by setting expectations).

**Status:** Unresolved. Requires UX research or A/B testing to determine what reduces abandonment for this specific user base. Do not implement a progress bar without grounding it in a clear model.

### Decision 3: Step Count Signaling

**Question:** Should progress bar show "Step 3 of 5" or just a percentage?

- **Numeric** ("Step 3 of 5") feels more concrete but breaks if branch depth varies.
- **Percentage** is honest but less tactile.
- **No indicator** may be better than a misleading one.

**Status:** Unresolved. See Decision 2.

### Decision 4: "Customize Style" Button Scope

**Question:** What does the "Customize Style" button in the wizard completion step do, and should it navigate to a separate style editor?

In the current implementation, clicking it sets `customize_target: 'menu'` on the intent and triggers another decision round within the wizard flow. Whether a dedicated style editor exists — or should exist — as a destination after wizard completion is an open product question.

**Tradeoffs:**
- If wizard completion feeds into a style editor, the handoff UX needs design (how state is passed, what "done" means in each context).
- If the wizard is the only authoring surface, "Customize Style" should be relabeled to avoid implying navigation (e.g., "More options").
- A future style editor could serve the "Tweak" path (Find → **Tweak** → Build), making it distinct from the wizard's "Build" role.

**Status:** Unresolved. Do not assume the wizard is the only authoring surface. Confirm with product whether a style editor is planned.

---

## 12. Acceptance Criteria for Implementation

An implementation is complete when:

1. ✅ Entry step is a field/discipline selector; it appears before any citation-style questions.
2. ✅ Wizard branches by field → style family → options (not flat list of all options).
3. ✅ Back button is available on all non-entry steps; prior answers are retained.
4. ✅ Progress bar reflects `steps_completed / expected_steps_for_branch` (not `missing_fields`).
5. ✅ Preview HTML is branch-aware (author-date branch shows in-text citations; note branch shows footnotes).
6. ✅ Completion step has a "Name Your Style" input (required, validated, max 100 chars).
7. ✅ Save only occurs after user provides a name (no hardcoded "My Custom Style").
8. ✅ Download generates YAML with user-supplied filename (sanitized).
9. ✅ Reset button clears all state; back button does not reset.
10. ✅ Transitions are smooth (fade-in, 500ms) and don't cause layout shift.
11. ✅ Time from entry to first meaningful choice ≤60 seconds.
12. ✅ Option count per step is ≤7 (reduces cognitive load).
13. ✅ Error states have retry button; no dead ends.
14. ✅ Responsive on mobile: wizard stacks cleanly (no horizontal scroll).

---

## 13. References

- **STYLE_EDITOR_VISION.md** — Platform-level Find/Tweak/Build strategy
- **DESIGN.md** — Design tokens, typography, color palette
- **DecisionWizard.svelte** — Current frontend implementation
- **+page.svelte** — Current integration in create-wizard route
- **citum-hub/CLAUDE.md** — Project conventions and tech stack
