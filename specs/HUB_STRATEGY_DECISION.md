# Hub Strategy Decision Record

> **Status:** Accepted — 2026-07-07
> **Supersedes:** `STYLE_WIZARD_V2.md`, `WIZARD_UX_SPEC.md`, `wizard.html`
> **Refines:** `DISTRIBUTED_ECOSYSTEM_VISION.md`, `CREATE_REWRITE_ARCHITECTURE.md`

## 1. Context

Citum Hub faces a chicken-and-egg problem. Downstream tools will not adopt a
new citation-style ecosystem without corpus and infrastructure parity with
CSL, whose 10,000-style corpus and two decades of inertia explain the total
absence of uptake so far. But a hub is useless without that uptake.

Meanwhile the hub itself is mid-rewrite: the original wizard-centric vision
is in doubt (`DISTRIBUTED_ECOSYSTEM_VISION.md` §6 already argues for "the
demise of the wizard"), the Railway alpha runs but has bugs, and the vision
doc that proposes the alternative skips the practical details needed to act
on it.

This document audits what actually exists across the ecosystem, decomposes
the adoption problem, and commits to a direction for the hub.

## 2. Current state audit

The strategic error to avoid is planning against the specs instead of the
code. The audit below is what exists as of this writing.

### 2.1 citum-core (v0.72) — stronger than the vision doc assumes

The vision doc treats several of its "Phase 1" goals as future work. Most
are already built in core:

| Vision-doc goal | Reality in citum-core |
|---|---|
| Immutable versions / pinning | **Done.** CIDv1 content addressing (`citum_store`), `citum style cid` / `citum style pin`, `extends-pin: cid:…` with verify-on-resolve |
| High-signal YAML schema | **Done.** Versioned schema, published JSON Schema (`docs/schemas/style.json`), CI-verified freshness |
| CSL ingestion ("Citum-ify") | **Mature and actively developed.** `citum-migrate` with base detection, provenance, and oracle verification against citeproc-js; the full 10,831-style CSL corpus vendored as migration source; 141 native styles shipped |
| Dual-surface engine | **Done.** CLI, `citum-server` (JSON-RPC), WASM/FFI bindings |
| Registry format | **Done (v1).** IDs, aliases, base/profile kinds; `citum registry` for adding external registries |
| Agent Skill | **Done and distributable.** `citum/skills` → `npx skills add citum/skills` ships `style-authoring` with schema-first authoring, CLI validation, and CSL porting |

Remaining core gaps: remote resolution of `cid:` / `git+https:` sources is
recognized but not fetched, and the default registry is a single embedded
file — federation is prototype-only (`citum-external-registry-prototype`
demonstrates the `citum-registry.yaml` self-publishing pattern end to end,
but nothing consumes it in anger).

### 2.2 The wider ecosystem — integrations already exist first-party

- **citum-latex**: working LuaLaTeX package driving `citum-server` over
  JSON-RPC. This is a real flagship integration, not a hope.
- **citum-office**: LibreOffice integration in progress (CDIP/CIPA
  protocols).
- **citum-org**: public site at citum.org; `docs.citum.org` already serves
  the JSON Schema the authoring skill fetches.

### 2.3 citum-hub — mid-rewrite, misaligned with core's strengths

- The **wizard** is ~3.9K lines of Svelte (~a third of the frontend) still
  driven by the legacy `wizardStore` (`phase` + numeric step). The new
  `createFlowStore` exists but only backs a placeholder `/create/find` page
  and a partial `/create/tweak`. The legacy step routes were never converted
  to redirects; two route trees and two stores coexist.
- The **API** is still the single overloaded `/api/v1/preview`; none of the
  split surfaces from `CREATE_REWRITE_ARCHITECTURE.md` (`/preview/citation`,
  `/search/match`, `/validate/style`) exist.
- The hub's **registry code** (`registry.ts`, ~1,250 lines) has a real alias
  system and CSL-source plumbing, but **no CIDs, no immutable versions, no
  pinning** — the "killer value" of the vision doc has zero hub
  implementation, despite core shipping the primitives.
- There is **no LLM code** behind the "hosted style generator" (§6.3 of the
  vision doc).
- Open issues #7, #15, #28 are all wizard-scoped.

The summary version: **core built the infrastructure; the hub spent its
effort on the one component the strategy no longer needs.**

## 3. The chicken-and-egg problem, decomposed

"Adoption" is not one problem. It splits into three prerequisites, in
dependency order:

1. **Corpus parity.** A tool cannot switch backends if its users' styles
   don't exist there. This is a *batch migration* problem, and it belongs to
   `citum-migrate` in core — not to any hub UI. Every hour spent on style
   *creation* UX attacks the wrong side of the corpus gap: the world does
   not lack styles, it lacks *migrated* styles.
2. **Drop-in compatibility.** Tools that can't migrate yet need legacy
   identifiers resolved to Citum equivalents (the CSL Bridge, vision doc
   §5). This tool already exists: the `citum` CLI in core handles legacy
   conversion (`citum convert`) and resolution, with the UX to match. The
   hub's job is to link to it, not to duplicate it as a serving concern.
3. **A flagship integration.** One credible tool that depends on Citum in
   production. `citum-latex` is the nearest candidate; it is first-party,
   which is fine — Pandoc's citeproc began the same way.

The wizard contributes to none of these. That is the structural reason it
keeps feeling unviable: it is a supply-side tool in a market where
migration already supplies the corpus.

One wrinkle keeps authoring strategically relevant: **migration buys
parity, not differentiation.** Citum has features CSL cannot express, and
a migrated style is by construction only as good as its CSL source. Parity
is the floor; lifting styles to native capability — via the authoring
skill and core's upsampling/evolution tooling — is the ceiling, and it is
where Citum's advantage becomes visible. So authoring is not mere
corpus-filling; it is how the corpus stops being a CSL mirror. It just
doesn't need a wizard to do it.

## 4. Wedge analysis: who to win first

Three candidate first audiences, evaluated against the asset base above.

### Tool integrators (the "Stripe for citations" framing)

Highest strategic value, wrong first move. Integrators demand API
stability, uptime commitments, and corpus parity before they will take a
dependency — none of which a pre-1.0, single-maintainer project can promise
today. Courting them before corpus parity exists burns the one first
impression available. **Second wedge**, unlocked by migration at scale plus
a pinning-capable registry API.

### End users via hub UI (the original wizard framing)

Weakest pull. Nobody searches for a citation-style *builder* before an
ecosystem exists; they search for *their journal's style*, which is a Find
problem over a migrated corpus, not a Build problem. The evidence of three
years of CSL history is that even in a mature ecosystem, style creation is
a rare, expert activity. **Last wedge**, and only as Find/browse — a
storefront demonstrating registry quality, not a creation studio.

### AI-assisted authors (the vision doc's §6 bet)

Cheapest to serve and mostly already served: the `style-authoring` skill
ships today, validates against the real schema and CLI, and handles CSL
porting. Every style authored this way grows the corpus, which is the
precondition for the other two wedges. Its costs are marginal (docs,
distribution, examples) rather than platform-scale. **First wedge.**

### Decision on sequencing

1. **Now:** AI-assisted authoring + batch corpus migration (both mostly
   core work; the hub's role is to *publish* the results).
2. **Next:** integrators, once the hub exposes a pinning-capable registry
   API over a meaningfully migrated corpus, with `citum-latex` as the
   in-house proof.
3. **Later:** end-user Find/browse polish as the public face of registry
   quality.

## 5. Decision

**The hub pivots from "wizard product" to "registry and distribution
surface over citum-core."** Its job is to make the corpus findable,
pinnable, and trustworthy — the Find and (lightly) Tweak rows of the
original hierarchy — and to stop competing with the AI-authoring path on
Build. Visual reference: [`registry-hub-mockup.html`](registry-hub-mockup.html)
mocks the four target screens (home, browse, style detail with pinning,
tweak).

Concretely:

1. **Freeze the wizard.** No new feature work, no bug-fixing beyond
   anything actively harmful. The Railway alpha stays deployed as a demo
   at $5/month (Hobby-plan base cost); if that stops being worth it,
   taking it down is a legitimate fallback — the strategy does not depend
   on the deployment. Issues #7 and #15 are closed or re-scoped as
   superseded by this document; #28 (LLM template inference) is subsumed by
   the skill/generator path.
2. **The hub's near-term backlog becomes registry work:**
   - surface core's CIDs and version pinning in the hub API and style
     detail pages (resolve stable ID → exact CID; "latest compatible" vs
     "exact pin");
   - ingest and publish batch-migration output so the browsable corpus
     grows with `citum-migrate` progress, with provenance visible;
   - point authoring flows at the `style-authoring` skill
     (`npx skills add citum/skills`) as the documented Build path;
   - the hosted style generator (vision doc §6.3) remains the accessible
     fallback for non-CLI users, but is deferred until the registry surface
     ships (see §6 for why).
3. **Spec hygiene.** `STYLE_WIZARD_V2.md`, `WIZARD_UX_SPEC.md`, and
   `wizard.html` are marked superseded. `CREATE_REWRITE_ARCHITECTURE.md`
   survives with its Build sub-flow deprioritized: the Find/Tweak route
   shell, `createFlowStore`, and the proposed API split remain the right
   target architecture for what the hub still needs.

## 6. Practical gaps the vision doc ignored

For honesty's sake, the details `DISTRIBUTED_ECOSYSTEM_VISION.md` glosses
over, so they don't silently become blockers:

- **Remote resolution is stubbed.** Core recognizes `cid:` and
  `git+https:` style sources but does not fetch them. Until it does, "pin a
  style by CID" works locally but not across the network — the hub API can
  bridge this gap in the interim by serving styles by CID itself.
- **Federation is a prototype.** `citum-external-registry-prototype` shows
  the `citum-registry.yaml` pattern, but no client consumes external
  registries in practice. Phase 3 of the vision remains genuinely distant;
  that is fine, and this document does not depend on it.
- **The hosted generator has no cost or abuse model.** A free LLM endpoint
  on the public internet is a wallet-drain target. Before building §6.3 the
  project needs an answer to rate limiting, auth (GitHub login exists), and
  per-request budget — one more reason it is sequenced after the registry
  work.
- **The hub has no immutability plumbing.** Core's CIDs must be surfaced
  through `registry.ts` and the Postgres schema; today the hub's `version`
  is a mutable string.
- **Style search quality depends on metadata migration**, not just style
  migration — aliases, ISSNs, publisher names. The hub's alias system is
  ahead of the pack here and should be treated as a first-class asset.

## 7. Consequences and first steps

What this decision buys: hub effort stops leaking into a creation UI with
no demand, and starts compounding with core's actual momentum (migration,
CIDs, skills). What it costs: the sunk wizard investment (~4K lines) is
parked, and the hub has no "wow" interactive demo for a while — the
storefront becomes the demo.

First three concrete steps, each small and checkable:

1. **Close/re-scope issues #7 and #15** with a pointer to this document;
   add a "frozen" note to the wizard entry points in the README.
2. **Expose CIDs in the hub:** add a CID column to the styles schema,
   compute on ingest via the WASM bridge, display on `/style/[id]`, and add
   `GET /api/hub/[styleKey]/pin` returning the exact-pin resolution.
3. **Wire migration output into the registry sync** so newly migrated
   styles from citum-core land in the browsable corpus automatically, with
   provenance shown.

If, after the registry surface ships, real users still ask for a guided
builder, the frozen wizard code is a salvage yard — `WIZARD_LEGACY_NOTES.md`
already catalogs what is worth keeping. The bet this document makes is that
they will ask for their journal's style instead.
