# Create Flow Rewrite Architecture

## Summary

This document defines the target rewrite for the `/create` experience after the
wizard stabilization work. The goal is to replace the current step-based wizard
with a spec-aligned `Find / Tweak / Build` flow while keeping `/create` as the
canonical entry.

## Product Model

- `Find`: browse or search for an existing style and export or open it.
- `Tweak`: start from an existing style and apply minimal overrides.
- `Build`: create a new style through progressive refinement.

The current step-based wizard remains a temporary implementation detail for
`Build` only. It should not drive top-level routing or product framing.

## Route Model

- `/create`: mode hub for `Find`, `Tweak`, and `Build`
- `/create/find`: discovery entry point
- `/create/tweak`: modification entry point
- `/create/build`: build entry point and resume screen
- `/create/build/*`: guided build flow

Legacy routes under `/create/{field,family,style,preset,refine,review,customize}`
should be compatibility redirects into `/create/build/*` during the rewrite.

## State Model

The replacement flow should move away from the current `phase + numeric step`
contract in `wizardStore`.

Target state shape:

- top-level create mode: `find | tweak | build`
- build session:
  - citation family
  - field / discipline
  - selected base preset or source style
  - refinement stage: citation or bibliography
  - candidate set and chosen candidate
  - generated style artifact
- tweak session:
  - source style id
  - override set
  - generated style artifact

Generated YAML is an output artifact, not the primary UI state.

## API Split

The current `/api/v1/preview` endpoint is overloaded. The rewrite should split
preview concerns into explicit surfaces:

- `POST /preview/citation`
- `POST /preview/bibliography`
- `POST /validate/style`
- `GET /examples/:field`
- `POST /search/match`

The current `/v1/decide` endpoint can remain as an internal stepping stone for
progressive refinement, but the client-facing contract should be explicit about
which render job is being requested.

## Reuse And Deletion

Keep and adapt:

- fixture/example loading logic as seed data for field-specific examples
- preview normalization utilities
- YAML generation and bibliography rendering integration
- existing style library and browse routes

Isolate, then replace:

- `wizardStore` as the monolithic source of route, editor, preview, and YAML state
- step-based routing under `/create/*`
- direct option-editing as the primary creation workflow

Treat as advanced-only or remove:

- visual customizer
- component-level editors
- in-place YAML mutation as a core flow primitive

## Delivery Sequence

1. Introduce the new `/create` shell and `/create/build/*` namespace.
2. Move the current guided flow behind the build namespace as a compatibility layer.
3. Replace the build namespace internals with progressive citation refinement.
4. Add separate bibliography refinement.
5. Introduce `Tweak` minimal overrides over a source style.
6. Expand `Find` with discovery and reverse-match.
