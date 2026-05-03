# Citum Distributed Ecosystem Vision

## The Challenge: From Monolithic Repos to SaaS Silos
In 2005, the Citation Style Language (CSL) was envisioned as a distributed standard. In practice, however, the community coalesced around a single GitHub repository. While this provided a "global commons" for over 10,000 styles, it created a massive bottleneck: any change required a Pull Request to a single point of authority. This "Monolithic Repo" model is difficult for non-developers to navigate and offers no clear path for private or institutional style management.

Citum Hub addresses the usability problem with a modern web platform. However, if we simply move styles from a single Git repo to a single centralized database, we haven't solved the underlying architectural problem—we've just traded a Monolith for a Silo. The million-plus users who rely on these styles deserve a model that is as resilient as the web itself: where the "global commons" is maintained, but where individuals and organizations are free to publish and manage their own styles independently.

## The Vision: A Federated Registry Model
We envision a **federated registry model**, heavily inspired by how modern package managers (like Cargo or npm) and decentralized social protocols (like AT Protocol) operate. 

The goal is to provide the "best of both worlds": a rock-solid, zero-config central index for the masses, combined with absolute freedom for institutions and individuals to self-host, distribute, and version-control their own styles.

### 1. The Primary Hub (The Global Index)
To maintain the immense advantage of a shared library for all users:
* **Zero-Config Default:** Citum Hub serves as the primary registry. In this model, standard users and tools (such as Zotero or Pandoc) **could** pull from here by default, ensuring immediate access to a high-quality, curated library.
* **The Hub as an Indexer:** Instead of being the *only* place a style can live, the Hub acts as a global indexer. It can host styles natively, but it can also syndicate and "watch" external registries—like a university's official style repository—bringing those styles into the global search while leaving the control in the hands of the publisher.

### 2. Distributed and Institutional Registries
* **Self-Hosting for Institutions:** A university or journal can host their own Citum registry (as a static site or a Git repo). This allows them to maintain "official" versions of their internal styles without waiting for a third-party approval process.
* **GitOps and Developer Workflows:** Authors can manage styles directly in their project repositories. A style is no longer a static artifact trapped in a database; it is a version-controlled file that lives where the work is being done.
* **Content Addressing (The Tangled/jj Model):** Taking cues from tools like `jj` and the Tangled forge, we aim for a model where style versions are immutable. Referencing a style by its unique **content identifier** (CID) ensures that a document's citations will never break just because an upstream parent was updated.

### 3. Deep Inheritance & Delta Styles
Citum's unique technical advantage is its support for deep inheritance. Unlike CSL, where forking meant duplicating thousands of lines of XML, a Citum style can be a tiny "delta" that simply references an upstream parent:

```yaml
# Illustrative proposed future schema: 
# An institutional style that just tweaks the standard APA style
extends: "@hub/apa@v7"
options:
  contributors:
    name-form: given-first
```

### 4. Required Core Architecture Tweaks
To support this model, `citum-core` must evolve its resolution logic:
* **Universal Resolvers:** The engine must be able to resolve parent references (via the `extends` key) across network boundaries (e.g., `@hub/apa`, `https://registry.univ.edu/styles`, or local relative paths).
* **Caching & Stability:** Remote styles must be cached locally to ensure documents can be rendered offline. We must ensure that "Parent Drift" is handled gracefully so that users are notified when an upstream change affects their output.
