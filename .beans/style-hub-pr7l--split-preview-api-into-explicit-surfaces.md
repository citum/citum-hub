---
# style-hub-pr7l
title: Split preview API into explicit surfaces
status: todo
type: task
priority: low
tags:
    - api
created_at: 2026-07-07T13:09:19Z
updated_at: 2026-07-07T13:09:19Z
parent: style-hub-iorv
---

Incremental refactor of the existing Hono app — endpoint by
endpoint, not a new server. The CREATE_REWRITE_ARCHITECTURE.md split
remains the right target:

- [ ] `POST /preview/citation`
- [ ] `POST /preview/bibliography`
- [ ] `POST /validate/style`
- [ ] `GET /examples/:field`
- [ ] Deprecate the overloaded `/api/v1/preview` once callers move

`POST /search/match` from the original spec stays deferred until the
Find wedge is active (matchScore already exists in registry.ts).
