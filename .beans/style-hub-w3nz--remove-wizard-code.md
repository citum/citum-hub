---
# style-hub-w3nz
title: Remove wizard code
status: todo
type: task
priority: normal
tags:
    - cleanup
created_at: 2026-07-07T13:09:19Z
updated_at: 2026-07-07T13:09:19Z
parent: style-hub-iorv
---

Delete, don't freeze in-tree: ~4.5K lines of wizard code taxes every
future refactor and type-check. Blocked on PR #62 (strategy decision
record) merging.

- [ ] Tag the pre-deletion commit so the Railway alpha can keep
      running the wizard demo if desired
- [ ] Salvage anything still listed in specs/WIZARD_LEGACY_NOTES.md
- [ ] Delete `client/src/lib/components/wizard/` (20 files)
- [ ] Delete `wizard.svelte.ts` store + wizard utils/tests
- [ ] Delete legacy `/create/{family,field,style,preset,customize,
      refine,review}` step routes and `/create/build/*` internals
- [ ] Keep `/create`, `/create/find`, `/create/tweak` on
      `createFlowStore`
- [ ] Close or re-scope GitHub issues #7 and #15 as superseded;
      note #28 is subsumed by the skill/generator path

Reference: specs/HUB_STRATEGY_DECISION.md §5/§7.
