# Bun-Native Adoption Plan for Citum Hub

## **Context**
Citum Hub currently utilizes a polyglot architecture:
- **Backend:** Rust (Axum, SQLx, Postgres)
- **Frontend:** SvelteKit (Svelte 5, Vite, Node/Bun)
- **Tooling:** Mixture of Bun and standard Node.js APIs (e.g., `pg`, `fs`, `dotenv`).

With Bun's evolving native capabilities (Direct Postgres, S3, Websockets, HTML Imports), we have an opportunity to significantly simplify the project's codebase, reduce dependencies, and improve developer experience (DX) and performance.

---

## **Key Objectives**
1.  **Reduce Infrastructure Friction:** Replace redundant Node.js/Rust glue code with Bun's high-performance native APIs.
2.  **Unified TypeScript Stack:** Move high-level orchestration (Auth, Library, API) into a unified Bun-based environment while keeping the core CSL engine in Rust (via WASM/FFI).
3.  **Performance Optimization:** Leverage Bun's native `Bun.sql` (up to 4x faster than `pg`) and `Bun.file` for I/O heavy operations.

---

## **Feature Adoption Strategy**

### **1. Database: Move to `Bun.sql`**
- **Current State:** Rust uses `sqlx`; TS scripts use `pg`.
- **Action:** 
  - Refactor all TypeScript scripts (migrations, sync) to use `Bun.sql`.
  - Evaluate moving the Hub's CRUD API from Rust to a Bun-based server (e.g., Elysia or Hono) that connects directly to Postgres via `Bun.sql`.
  - **Benefit:** Dramatically simplifies the backend logic and allows sharing types between the DB schema and the frontend.

### **2. Storage: Native S3 & File System**
- **Current State:** Using standard `fs` for local style syncing and potential future AWS SDK for S3.
- **Action:** 
  - Use `Bun.file` for all style reading/writing operations.
  - Implement the "Style Persistence" layer using `Bun.s3` for scalable asset storage without adding heavy SDK dependencies.
  - **Benefit:** Faster I/O and zero-dependency cloud storage integration.

### **3. Websockets: Real-time Wizard & Collaboration**
- **Current State:** No current websocket implementation.
- **Action:** 
  - Use Bun's native `Bun.serve` with `websocket` handlers to implement live style previews in the Wizard.
  - Enable collaborative style editing ("Google Docs for Citations") using Bun's built-in pub/sub capabilities.
  - **Benefit:** Low-latency feedback for users during complex style configuration.

### **4. HTML Imports: Stitch Mockup Integration**
- **Current State:** Manual shell scripts (`fetch-stitch.sh`) and raw HTML files in `stitch_mockups`.
- **Action:** 
  - Use Bun's experimental HTML imports to directly reference "Stitch" designs as components.
  - Simplify the "Preview" system to serve raw HTML mockups directly through the Bun server.

---

## **Phased Implementation Path**

### **Phase 1: Tooling Optimization (Immediate)**
- [x] Refactor `sync-local.ts` to use `Bun.sql` and `Bun.file`.
- [x] Implement a Bun-based migration runner to replace raw SQL scripts or manual CLI usage.

### **Phase 2: The "Hybrid" Hub (Short Term)**
- [x] Build a prototype Bun API for "Bookmarks" and "User Library."
- [x] Compile `citum-engine` (Rust) to WASM and expose it as a Bun plugin/module.
- [x] Move GitHub OAuth logic from Rust to a Bun server to unify authentication.
- [x] Connect SvelteKit frontend to the Bun API (port 3002).

### **Phase 3: Real-time Refinement (Long Term)**
- [x] Add Websocket-based live previews to the Wizard.
- [ ] Transition the primary style repository to an S3-backed storage using `Bun.s3`.

---

## **Risk & Mitigation**
- **Rust Engine Coupling:** The core CSL logic is complex and best maintained in Rust. **Mitigation:** Maintain a clear boundary between the "Hub" (Orchestration/Auth/DB) and the "Engine" (Processing/Logic). Use WASM for integration.
- **Bun Maturity:** Some features (like HTML imports) are experimental. **Mitigation:** Use stable `Bun.sql` and `Bun.serve` for production paths; keep experimental features for internal prototyping.
