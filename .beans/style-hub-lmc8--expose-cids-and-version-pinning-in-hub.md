---
# style-hub-lmc8
title: Expose CIDs and version pinning in hub
status: todo
type: feature
priority: high
tags:
    - registry
created_at: 2026-07-07T13:08:59Z
updated_at: 2026-07-07T13:08:59Z
parent: style-hub-iorv
---

Surface citum-core's content addressing in the hub — the "killer
value" (pinning/reproducibility) currently has zero hub
implementation despite core shipping the primitives.

- [ ] Add CID column to the styles schema (migration)
- [ ] Compute CIDv1 on ingest via the WASM bridge (core: `citum_store`)
- [ ] `GET /api/hub/[styleKey]/pin` → `{ id, version, cid }`
- [ ] Show version + locked ID on `/style/[id]` per the mockup's
      "Use this style" panel (benefit-first; CID under the
      integrator disclosure)

Reference: specs/HUB_STRATEGY_DECISION.md §5/§7,
specs/registry-hub-mockup.html (#detail).
