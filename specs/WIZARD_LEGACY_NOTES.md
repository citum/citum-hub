# Wizard Legacy Notes

**Status:** Salvage notes from the abandoned `codex/wizard-style-branches`
work (last commit 2026-04-06). **Delete this file once the items below
are either ported into the active flow or explicitly rejected.**

## Why this file exists

The branch was started before `feat(create): rewrite flow around build modes`
(`855f332`) restructured `/create` into Find / Tweak / Build. The branch's
spec and implementation work were aimed at the *step-based wizard* that
the rewrite then demoted to "a temporary implementation detail for Build
only" (see `CREATE_REWRITE_ARCHITECTURE.md`). Most of the branch's UI
code is no longer salvageable, but a few ideas survive the change of
architecture and should not be lost.

## Branch commits, for `git show` reference

| SHA | Subject | Salvage status |
|-----|---------|----------------|
| `bb73d28` | feat(wizard): align spec and implement Phase 1 refinement screen | **Spec changes salvageable** (see §1). Code is for the old step routes — superseded by `/create/build/refine`. |
| `eafa0cd` | fix(wizard): finalize UX navigation and schema alignment | UX nav fixes are scoped to the dead step flow. **Schema-alignment fixes** in `wizard-style-updates`-style code are worth re-checking against current main. |
| `bb35025` | fix(wizard): split customization by style class | Concept salvageable (see §2); code lives in `VisualCustomizer`, which the rewrite plans to demote to "advanced-only or remove." |
| `3b03e65` | chore(agent): link knowledge base in CLAUDE.md and ignore build artifacts | Already on main equivalently. Skip. |

## §1 — Schema-alignment items still worth porting

The branch's spec edits to `STYLE_WIZARD_V2.md` are mostly whitespace
re-flowing, but a handful are real corrections to match the Citum v2
schema. These should be applied to the *current* spec on main, regardless
of UI shape:

- **Names section, style-path table** (branch §4 "Refine Your Style →
  Section: Names"). Replace:
  - `options.contributors.form` (`short`/`long`) → `options.contributors.name-form` (`family-first`/`given-first`/`full`)
  - `shorten.min` range `1-20` → `1-50` with note that presets may use values such as `21`
  - Add the qualifier "may be overridden in `citation.options` or `bibliography.options`."
- **Schema note added before Names section:** explains that Quick Start
  targets the *global* `options` block and relies on Citum's inheritance
  to flow into `citation.options` / `bibliography.options`. This framing
  should survive into whatever spec governs `/create/build/refine`.
- **Note-family axes count: 4 → 5.** The branch added a leading axis
  *"Where should citations appear? (Footnotes / Endnotes)"* at position 1,
  pushing the existing four down. Verify this is captured in the rewrite's
  Build flow for humanities styles; if not, port it into the build/refine
  spec.

To diff the spec changes directly:
```
git show bb73d28 -- specs/STYLE_WIZARD_V2.md
```

## §2 — "Split customization by style class" — salvageable concept

`bb35025` drove preset rendering, preview composition, and refinement
controls from explicit branch types (author-date, numeric, humanities
notes, legal notes), removing cross-family controls and restoring
repeat-note previews. The implementation lives in `RefinementControls`,
`VisualCustomizer`, `PresetGallery`, `StyleNavigator`, and
`InteractivePreview` — components either rewritten on main or marked for
demotion.

**The principle to preserve:** refinement and preview controls should
never show options that are meaningless for the current style class. A
note-family humanities style should not surface ampersand-vs-and
controls; an author-date style should not surface
ibid./short-title/full-repeat controls. Whatever component(s) live at
`/create/build/refine` and `/create/build/customize` after the rewrite
should enforce this discipline.

To inspect the original branch-aware composition logic:
```
git show bb35025 -- client/src/lib/components/wizard/RefinementControls.svelte
git show bb35025 -- client/src/lib/components/wizard/PresetGallery.svelte
```

## §3 — Explicitly NOT salvaging

- The branch's `wizardStore` `phase + numeric step` ergonomics — the
  rewrite explicitly replaces this with `create-flow.svelte.ts`.
- The branch's investments in `VisualCustomizer` internals — the rewrite
  plans to demote this component.
- "Start Over" buttons across all wizard screens (`eafa0cd`) — flow
  shape is changing; this UX needs to be re-decided in the new shell.
- Session restoration with manual recovery (`eafa0cd`) — same reason.
- Component-level editors (Contributor/Date/Title/Number/Variable
  editors and the v2 `group` schema concept). The rewrite treats
  component-level editors as "advanced-only or remove" territory; the
  spec sections describing them are kept on main but should not drive
  near-term work.

## When to delete this file

Delete once:
1. §1 items have been merged into the spec(s) governing
   `/create/build/refine` and `/create/build/customize`, **and**
2. §2 discipline is enforced in whatever components replace
   `RefinementControls` / `VisualCustomizer` in the build flow.
