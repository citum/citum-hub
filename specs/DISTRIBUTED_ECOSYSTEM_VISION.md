# Citum Distributed Ecosystem: Protocol & Registry Specification

## 1. Introduction
This document defines the architecture for a federated citation-style ecosystem. It moves beyond the monolithic repository model of CSL while avoiding the pitfalls of centralized SaaS silos. The architecture prioritizes **reproducibility**, **cryptographic trust**, and **deterministic resolution**.

## 2. Identity and Addressing Layer
To balance human usability with technical immutability, Citum employs a three-tier identity model.

| Layer | Form | Primary Purpose | Governance |
| :--- | :--- | :--- | :--- |
| **Human-Friendly Name** | `citum:hub/apa@v7` | Discovery, authoring, and documentation. | Registry Namespace |
| **Locator (URL)** | `https://registry.example.edu/apa.yaml` | Network retrieval and physical hosting. | DNS / Web PKI |
| **Content ID (CID)** | `sha256:8a3f...` | Exact rendering and cache integrity. | Cryptographic Hash |

### 2.1 The Citum URI
All styles MUST be addressable via a Citum URI:
`citum:[<registry-alias>/]<namespace>/<style-name>[@<version-spec>]`

*   **Registry Alias:** A local shorthand for a remote registry URL (e.g., `hub` defaults to `https://hub.citum.org`).
*   **Version Spec:** Can be a SemVer range (e.g., `^1.2.0`), a tag (e.g., `latest`), or a specific CID.

## 3. Deterministic Resolution Model
The resolution engine MUST ensure that a style graph resolved today produces the same output in the future, regardless of upstream changes.

### 3.1 The Resolution Algorithm
When a client encounters an `extends` directive, it MUST follow this precedence:
1.  **Local Override:** Filesystem paths relative to the current style.
2.  **Lockfile:** If a `citum.lock` exists, the engine MUST use the CID recorded there.
3.  **Registry Resolution:** 
    *   Fetch the registry manifest.
    *   Resolve the version spec to a specific CID.
    *   Verify the CID against the downloaded artifact.

### 3.2 Lockfiles
For production rendering, implementations SHOULD generate a `citum.lock` file. This manifest maps all transitive dependencies in the `extends` chain to their specific CIDs.

```yaml
# Example citum.lock
dependencies:
  "citum:hub/apa@v7":
    cid: "sha256:e3b0c442..."
    source: "https://hub.citum.org/api/v1/styles/apa/v7.2.1.yaml"
    integrity: "sha384-..."
  "citum:univ/internal-base":
    cid: "sha256:bc892a..."
    source: "https://registry.univ.edu/base.yaml"
```

## 4. Trust and Security Model
Federation requires explicit trust anchors to prevent dependency confusion and malicious style injection.

### 4.1 Registry Signing
Every registry MUST publish a signed `metadata.json` at its root.
*   **Public Key:** The registry's Ed25519 public key.
*   **Manifest:** A list of available styles and their current CIDs, signed by the registry key.

### 4.2 Trust Policy
Clients MUST maintain a local trust policy. 
*   **Explicit Trust:** Users must manually approve a new registry before its styles are executed.
*   **The Hub Anchor:** Citum Hub is the default, pre-trusted anchor for the `hub/` namespace.
*   **Cross-Registry Inheritance:** A style from `Registry A` MAY extend a style from `Registry B` only if the client's trust policy permits `Registry B`.

## 5. Parent Drift and Immutability
"Parent Drift" occurs when a floating reference (e.g., `@v7`) points to a new CID.

*   **Authoring Phase:** Clients SHOULD allow floating references and periodically check for updates.
*   **Rendering Phase:** Clients MUST freeze the graph. If a parent has changed since the last lock, the client SHOULD warn the user but default to the locked CID.
*   **Breaking Changes:** Registries SHOULD use SemVer. Major version bumps in a parent SHOULD trigger a hard failure or require explicit user migration.

## 6. The Role of Citum Hub
To prevent "centralization in practice," the Hub's roles are strictly defined:
1.  **Host:** Provides a default storage layer for open-source styles.
2.  **Index/Aggregator:** Mirrors and indexes metadata from trusted institutional registries.
3.  **Trust Authority:** Validates that styles in the `hub/` namespace meet community standards.
4.  **Mirroring:** Provides a high-availability CDN for federated styles that opt-in to mirroring.

## 7. Governance and Moderation
*   **Namespace Ownership:** Registries govern their own internal namespaces. The Hub manages the global `hub/` namespace via a community-led PR process.
*   **Moderation:** The Hub indexer MAY de-list registries that host malware or violate terms of service, though the styles remain accessible via direct URL for those who trust the registry.

## 8. Operational Model
### 8.1 Caching and Offline Behavior
Clients MUST implement a content-addressable cache. Once a style and its parents are resolved to CIDs and downloaded, the client MUST be capable of rendering without network access.

### 8.2 Performance
Transitive inheritance graphs SHOULD be flattened at "publish time" by the registry into a resolution-optimized manifest to minimize network round-trips for clients.

## 9. Decision Log (ADR)
### 9.1 ADR-001: CID over URL for Identity
*   **Decision:** Use Content IDs (CIDs) as the primary key for rendering.
*   **Rationale:** URL-based identity is brittle. Domains expire; servers go down. CID ensures that if the bytes are found anywhere (local cache, IPFS, mirror), the style is valid.

### 9.2 ADR-002: Explicit Registry Aliasing
*   **Decision:** Require `citum:hub/...` or `citum:registry-alias/...` rather than raw URLs in style files.
*   **Rationale:** Decouples the style definition from the physical hosting location. Allows institutions to move their registry without rewriting every style file.

---

# Major Changes Made
1.  **Cryptographic Identity:** Shifted from "Human names" to a multi-layered identity model where CIDs govern reproducibility.
2.  **Lockfile Requirement:** Added a mandatory (for production) lockfile concept to solve the "Parent Drift" problem definitively.
3.  **Explicit Trust Model:** Introduced Ed25519 signing for registry metadata, moving federation from "open but risky" to "explicit and secure."
4.  **Resolution Logic:** Defined a clear precedence (Local > Lock > Remote) to prevent dependency confusion attacks.
5.  **Hub De-escalation:** Explicitly defined the Hub as an *indexer* and *trust anchor* rather than the sole database, mitigating recentralization risk.
6.  **Governance Section:** Added specific policies for namespace ownership and moderation.

# Open Questions
1.  **Key Rotation:** How do we handle registry key compromise? Is there a need for a global Revocation List or a transparency log?
2.  **Circular Inheritance:** What is the specific cost-limit for resolving deep inheritance graphs (e.g., max depth of 10)?
3.  **Discovery Protocol:** Should registries support a standardized search API (e.g., OAI-PMH or a modern JSON API) to facilitate indexing by the Hub?

# MVP Recommendation: Phase 1 (The Trust-First Foundation)

### Goal
Establish the core `citum-core` resolution logic and the Hub as a signed registry.

### Scope
1.  **Citum-Core Resolver:** 
    *   Support `extends: "citum:hub/..."`.
    *   Implementation of the local CID cache.
    *   Basic lockfile generation (`citum.lock`).
2.  **Hub MVP:**
    *   The Hub generates a signed `metadata.json` for all hosted styles.
    *   A simple UI for users to "Claim a Namespace" (e.g., `citum:github-user/...`).
3.  **Migration Path:**
    *   A CLI tool to "Citum-ify" existing CSL styles by extracting them into a base parent and a metadata-only child.

### Why this first?
By starting with the Hub as a **signed registry**, we build the security infrastructure before we open the floodgates to federation. It allows us to battle-test the CID and lockfile logic in a controlled environment before managing the complexity of multi-registry trust policies.
