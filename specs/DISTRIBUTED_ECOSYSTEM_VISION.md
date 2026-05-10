# Citum: The Citation Infrastructure for Integrators

## 1. Introduction
Citum is the style registry and rendering backend that reference managers and
writing tools embed instead of maintaining their own style-processing stack.
While the underlying engine supports decentralized resolution, the Hub's primary
mission is to provide a dependable, "Stripe-like" infrastructure for citation
styles.

Our goal is to make Citum the default backend for citation-capable software by
prioritizing **dependable resolution**, **version safety**, and **predictable
rendering**.

## 2. Product Positioning: Infrastructure over Platform
Citum is not just a repository; it is a critical piece of infrastructure for
integrators. We solve the "CSL problem"—brittle XML, fragmented repositories,
and inconsistent rendering—by offering a modern, Rust-backed stack.

- **Primary User**: Maintainers of reference managers (Zotero, Mendeley), 
  writing tools (Overleaf, Obsidian), and LLM-assisted editor integrations.
- **Killer Value**: Version pinning, 100% rendering parity between local/remote,
  and a high-signal YAML schema that AI assistants can actually understand.

## 3. Scope and Phasing: The Road to Dependability

### Phase 1: Canonical Infrastructure (v1)
- **Goal**: Be the most dependable way to fetch and render a style.
- **Focus**: A canonical public style registry with IDs, metadata, and 
  immutable versions.
- **Components**: 
  - **The CSL Bridge**: A compatibility layer to ensure zero-friction 
    migration for existing CSL-based tools.
  - **Dual-Surface Engine**: A rendering API and an embeddable library 
    (Rust/WASM) that behave identically.

### Phase 2: Quality & Provenance (v2)
- **Goal**: Establish the Hub as the trusted source for scholarly output.
- **Focus**: Formal review workflows, style provenance (signed releases), and 
  organizational collections (e.g., official publisher-approved variants).

### Phase 3: Ecosystem Expansion (v3)
- **Goal**: Long-term resilience through federation.
- **Focus**: Multi-hub synchronization and discovery, but only after a 
  critical mass of clients depend on the v1/v2 infrastructure model.

## 4. API & Integration Surface
Integrators require a "boring," predictable API. Citum provides two identical
surfaces: a hosted REST API and an embeddable local engine.
| Need | Capability |
| :--- | :--- |
| **Find** | Search by name, alias, jurisdiction, or publisher. |
| **Pin** | Resolve a stable ID to an exact, immutable CIDv1. |
| **Update** | Separate "latest compatible" (semver) from "exact pins". |
| **Render** | Identical output between local library call and hosted API. |
| **Trust** | Access machine-readable changelogs and provenance badges. |

## 5. Migration: The CSL Compatibility Bridge
The biggest risk to adoption is the inertia of the existing CSL ecosystem. To
mitigate this, Citum will provide:
- **Style Ingestion**: Automated tools to "Citum-ify" existing CSL 1.0.1 
  styles into base parents and child variants.
- **Fallback Logic**: Resolvers that can consume legacy identifiers while 
  pointing to modern, version-pinned Citum equivalents.

## 6. AI-Driven Authoring: The Demise of the Wizard
### 6.1 Do we need a GUI wizard? No.
By using a clean, semantic YAML schema, we make style authoring a first-class
citizen for LLM assistants. This approach allows the Citum registry to scale
rapidly without the overhead of maintaining complex visual builders.

### 6.2 The Pro Path: Citum Authoring Skill
To facilitate authoring outside of the `citum-core` development context, Citum
will provide a portable **Agent Skill**. This machine-readable specification can
be loaded into AI assistants (Cursor, Gemini, Claude, ChatGPT) to provide:
- **Schema Enforcement**: Instant knowledge of Citum's YAML structure.
- **Validation Workflows**: Instructions for the agent to use the Citum CLI for
  real-time syntax and logic checking.
- **Best Practices**: Context on modular style composition and parent-style
  inheritance patterns.

### 6.3 The Accessible Path: Hosted Style Generator
For users who do not use AI-integrated IDEs or local CLI tools (e.g., librarians,
journal editors), the Citum Hub will provide a simplified, web-based **Style
Generator**. This is a thin frontend wrapped around an LLM API, pre-loaded with
the Citum schema and authoring context.

Users can interact with the generator by:
- Answering guiding questions about the style's requirements.
- Pasting text from a journal's author guidelines.
- Providing example citation and bibliography output.

The generator then produces the Citum YAML, which the user can download and test
immediately.

### 6.4 Local-First Workflow: Creation and Storage
Style authoring is a local-first, iterative process:
- **Creation**: A user prompts an AI assistant, uses the Hosted Style Generator,
  or writes YAML directly.
- **Storage**: New styles are saved to the user's local machine—either within
  a specific project directory or the global user style store (e.g.,
  `~/.local/share/citum/styles/`).
- **Testing**: The user employs the Citum CLI (`citum render`) to verify the
  style against local bibliographic data. This provides a tight feedback loop
  independent of any network registry.

### 6.5 Distribution Pathways
Once verified locally, a style follows one of two paths:
- **Hub Submission**: For broadly applicable styles, authors submit a Pull
  Request to the Hub's canonical community registry.
- **Self-Publishing**: Organizations can simply serve their local YAML files
  via a static host (GitHub Pages, Netlify) and publish a `citum-registry.yaml`
  index, allowing users to add them as a trusted registry.

## 7. Operational Model
- **Consistency**: High-availability registry mirrors for tools that need 
  offline/local caches.
- **Reproducibility**: Marquee feature for scholars; pinning a style 
  guarantees the same bibliography output in five years as it does today.
- **Governance**: The Hub registry is governed via a community-led PR process,
  ensuring that integrators can trust the quality of what enters the catalog.
