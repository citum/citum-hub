---
# style-hub-019l
title: Rebuild browse and detail UI to mockup
status: todo
type: feature
priority: normal
tags:
    - ui
created_at: 2026-07-07T13:09:19Z
updated_at: 2026-07-07T13:09:37Z
parent: style-hub-iorv
blocked_by:
    - style-hub-lmc8
---

Fresh components on top of kept routes/stores/API — the one place
"from scratch" applies, as ordinary feature work.

- [ ] Restyle `/library/browse` per mockup: plain-language badges
      ("verified output" / "written for Citum"), origin facet,
      version-only chips
- [ ] Restyle `/style/[id]` per mockup: benefit-first "Use this
      style" panel, "Why you can trust this style", integrator
      disclosure with semver/CID/CLI/REST
- [ ] Progressive disclosure rule: identifiers and API detail never
      lead; benefits do
- [ ] Point Build entry points at the authoring skill
      (`npx skills add citum/skills`)

Reference: specs/registry-hub-mockup.html (all four screens),
citum-org DESIGN.md tokens.
