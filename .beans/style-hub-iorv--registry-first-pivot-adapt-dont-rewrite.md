---
# style-hub-iorv
title: Registry-first pivot (adapt, don't rewrite)
status: todo
type: epic
priority: high
tags:
    - strategy
created_at: 2026-07-07T13:08:44Z
updated_at: 2026-07-07T13:08:44Z
---

Tracking epic for the pivot decided in specs/HUB_STRATEGY_DECISION.md
(PR #62): the hub becomes a registry + distribution surface over
citum-core; the wizard is frozen and later removed.

## Decision: adapt the existing code, do not rewrite

The misalignment with the new strategy is concentrated in the wizard
third of the frontend, not the platform. The stack (SvelteKit 5 runes,
Bun, Tailwind 4) is current, so there is no legacy-platform argument
for a rewrite.

**Keep and build on:**
- `client/src/lib/server/registry.ts` (~1,250 lines) — the alias
  system (ISSNs, publisher names, tool aliases, match scoring) is the
  most registry-shaped asset in the repo
- Hono API, GitHub OAuth, Postgres persistence, registry
  sync/import/export, `/api/hub/*` endpoints
- WASM bridge + preview path (needed for live rendering on detail)
- Browse/library/style-detail routes and `createFlowStore`

**Delete outright (don't leave frozen in-tree):**
- `lib/components/wizard/`, `wizardStore`, legacy `/create/*` step
  routes — after PR #62 merges, as a separate PR

**Build new (ordinary feature work, not architecture):**
- CID/pinning surface, migration ingest with provenance, detail/browse
  UI per `specs/registry-hub-mockup.html`, incremental API split

The only scenario that reopens the rewrite question is abandoning the
database-backed app entirely (e.g. static site over a git registry) —
a different product, out of scope here.
