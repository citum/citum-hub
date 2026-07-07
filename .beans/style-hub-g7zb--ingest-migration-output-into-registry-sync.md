---
# style-hub-g7zb
title: Ingest migration output into registry sync
status: todo
type: feature
priority: high
tags:
    - registry
created_at: 2026-07-07T13:08:59Z
updated_at: 2026-07-07T13:08:59Z
parent: style-hub-iorv
---

Grow the browsable corpus automatically as citum-core's
`citum-migrate` batch output lands, with provenance visible.

- [ ] Extend `sync_styles.ts` / registry sync to consume migrated
      styles from the pinned citum-core ref
- [ ] Carry provenance (source `.csl`, verification status) into the
      registry document and DB
- [ ] Display plain-language provenance badges in browse/detail
      ("verified output"), per the mockup
- [ ] Keep alias records (ISSNs, publisher names) flowing from
      migration metadata — search quality depends on this

Reference: specs/HUB_STRATEGY_DECISION.md §5/§7.
