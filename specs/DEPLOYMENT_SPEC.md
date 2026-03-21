# Alpha Deployment Specification — Railway

## Decision Record: Platform Selection

### Why Railway

**Multi-step workflow deployment:** The Citum Hub `/create-wizard` is a stateful, multi-step experience that does not trivially export to static hosting (e.g., GitHub Pages). This rules out the "static site + edge function" pattern.

**Library browse UX is alpha-critical:** The style browser and search interface is a strong product hook for alpha testing and user feedback. Removing it would undermine the alpha value prop.

**Minimal hosted API must still run WASM:** Even a "lightweight API" for preview/generate requires compiling the Rust engine to WASM — the hard infrastructure work. Offloading to a separate static host just creates deployment complexity and diverging code paths.

**Railway advantages:**
- **Usage-based pricing:** $5/mo Hobby plan with $5 credit. Alpha (~50–200 MAU) costs $5–10/mo total.
- **First-class PR preview environments:** Each PR gets isolated `hub-api` + `hub-web` + Postgres with auto-teardown on close. Service references (`${{hub-api.RAILWAY_PUBLIC_DOMAIN}}`) auto-resolve per environment.
- **Native Dockerfile support:** Deploy exactly what you tested locally.
- **One-click managed Postgres:** No separate vendor lock-in.

### Alternatives Rejected

| Platform | Why Not |
|----------|---------|
| **GitHub Pages** | Multi-step wizard doesn't export to static. Browse UX would require SPA + API anyway—loses the simplicity argument. |
| **Fly.io** | Powerful, but PR preview environments require custom provisioning scripts. No native "clone production for this PR" workflow. |
| **Render** | PR previews locked to paid tiers ($12+/mo). Usage-based billing scales poorly at 0 users. |

---

## Service Topology

```
┌─ Railway Project: citum-hub ─────────────────┐
│                                               │
│  ┌─ hub-api (Bun/Hono, port 3002)          │
│  │  ├─ WASM bridge compiled in build stage  │
│  │  ├─ citum-core assets bundled:           │
│  │  │  ├─ /app/styles/                      │
│  │  │  ├─ /app/styles-legacy/               │
│  │  │  ├─ /app/registry/                    │
│  │  │  └─ /app/tests/fixtures/              │
│  │  ├─ SINGLE owner of DB migrations       │
│  │  └─ Runs: migrate → Hono server          │
│  │                                           │
│  ├─ hub-web (SvelteKit, port 3000)          │
│  │  ├─ adapter-node build                   │
│  │  ├─ Proxies /api/* to hub-api            │
│  │  ├─ Does NOT run migrations              │
│  │  └─ Serves frontend UI                   │
│  │                                           │
│  └─ Postgres (Railway managed plugin)       │
│     ├─ AUTO-INJECTED: DATABASE_URL          │
│     └─ Available to both hub-api & hub-web  │
│                                               │
└───────────────────────────────────────────────┘
```

**Port binding contract:**
- `hub-api`: Must bind to `$PORT` (default 3002)
- `hub-web`: Must bind to `$PORT` (default 3000)
- Postgres: Injected via `DATABASE_URL`

**Cross-service communication:**
- hub-web calls hub-api at `$BACKEND_URL` (Railway service reference)
- hub-api owns all DB schema and migrations

---

## Build Process

### Multi-Stage Docker Build (hub-api)

**Stage 1: Builder** (`oven/bun:1` on Debian)
1. Install Rust toolchain with `wasm32-unknown-unknown` target
2. Install wasm-pack
3. Copy `Cargo.toml` + `Cargo.lock` + `server/` → layer-cache Rust builds
4. Build WASM bridge: `cd server/crates/wasm-bridge && wasm-pack build --target nodejs --release`
5. Clone `citum-core` at pinned `$CITUM_CORE_REF` (default: `main`)
6. Copy all runtime assets:
   - `tests/fixtures/` → `/app/tests/fixtures/`
   - `styles/` → `/app/styles/`
   - `styles-legacy/` → `/app/styles-legacy/`
   - `registry/` → `/app/registry/`
7. Install Bun deps (`bun install --frozen-lockfile`)
8. Copy `client/src/` + `client/scripts/` + `client/package.json`

**Stage 2: Runtime** (`oven/bun:1-slim`)
1. Copy WASM bridge pkg from builder
2. Copy citum-core runtime assets (all paths above)
3. Copy API source + deps
4. CMD: `bun run scripts/migrate.ts && bun src/api/index.ts`
   - Migrations run **once** on startup
   - Server binds after migrations complete

**Why two stages:**
- WASM compilation + Rust toolchain are large; slim image for production
- Build cache: Cargo deps cached separately from source changes

### Multi-Stage Docker Build (hub-web)

**Stage 1: Builder** (`oven/bun:1`)
1. Copy `client/package.json` + lock files
2. `bun install --frozen-lockfile`
3. Copy full client source
4. `bun run build` (SvelteKit → `build/` directory via adapter-node)

**Stage 2: Runtime** (`node:22-alpine`)
1. Copy `build/` directory
2. Copy `package.json` (for runtime deps)
3. CMD: `node build/index.js`

---

## Environment Variables

### Shared (Both Services)

| Variable | Purpose | Source | Example |
|----------|---------|--------|---------|
| `DATABASE_URL` | Postgres connection string | Railway plugin (auto) | `postgres://user:pass@host:5432/citum` |
| `PORT` | Server listen port | Explicit in config | `3002` (hub-api), `3000` (hub-web) |
| `PUBLIC_DEMO_MODE` | Demo mode toggle (auth bypass) | Explicit in config | `true` (PR envs), `false` (production) |

### hub-api Only

| Variable | Purpose | Source | Example |
|----------|---------|--------|---------|
| `GITHUB_CLIENT_ID` | OAuth app ID | GitHub OAuth App (create once) | `Ov23liX1234abc` |
| `GITHUB_CLIENT_SECRET` | OAuth app secret | GitHub OAuth App | `secret_abc123def456` |
| `JWT_SECRET` | JWT signing key | `openssl rand -hex 32` | (random 64-char hex) |
| `FRONTEND_URL` | SvelteKit URL for redirects | Railway service reference | `${{hub-web.RAILWAY_PUBLIC_DOMAIN}}` |
| `CITUM_CORE_PATH` | Bundled core asset path | Dockerfile (fixed) | `/app` |

### hub-web Only

| Variable | Purpose | Source | Example |
|----------|---------|--------|---------|
| `BACKEND_URL` | Hub API base URL | Railway service reference | `${{hub-api.RAILWAY_PUBLIC_DOMAIN}}` |
| `ORIGIN` | SvelteKit origin (CSRF, cookies) | Railway auto-domain | `${{RAILWAY_PUBLIC_DOMAIN}}` |

**Note:** Railway service references (e.g., `${{hub-api.RAILWAY_PUBLIC_DOMAIN}}`) automatically resolve to the correct URL per environment (production vs. PR preview). No wildcard DNS needed.

---

## Migration Strategy

### Single Owner: hub-api

- **hub-api** runs all migrations on startup before binding the Hono server.
- **hub-web** has no migration logic; it serves the UI and proxies API calls.
- **Why:** Prevents race conditions when multiple services boot simultaneously in PR environments.

### Migration Execution

**File:** `client/scripts/migrate.ts`

**Execution:**
```bash
# In Dockerfile.hub-api CMD:
bun run scripts/migrate.ts && bun src/api/index.ts
```

**Process:**
1. `migrate.ts` connects to `DATABASE_URL`, runs all pending migrations
2. Migrations complete and connection closes
3. Hono server starts on port 3002
4. hub-web boots independently, waits for hub-api to be reachable

**Code change:** Remove `runMigrations()` from `client/src/hooks.server.ts` to prevent duplicate execution in hub-web.

---

## PR Preview Strategy

### Enable PR Environments in Railway

1. Log into Railway project
2. Navigate to **Project Settings** → **Environments**
3. Toggle **PR Environments: ON**

### Behavior

- Each PR trigger creates a new namespace: `citum-hub-pr-123`
- All three services boot (hub-api, hub-web, Postgres)
- Postgres is **ephemeral** — destroyed when PR closes
- Service URLs auto-update: PR preview hub-web connects to its own hub-api, never production

### Demo Mode Required

All PR environments **must run** `PUBLIC_DEMO_MODE=true`:
- Disables real GitHub OAuth
- Uses in-memory session bookmarks (no DB persistence)
- Demo banner visible to reviewers
- Safe to share URLs without auth concerns

**Production** runs `PUBLIC_DEMO_MODE=false` with real OAuth.

---

## GitHub OAuth Setup

### Single OAuth App (Production Only)

Create **one** GitHub OAuth App:
- **Application name:** Citum Hub (Alpha)
- **Homepage URL:** `https://<hub-api-production-domain>`
- **Authorization callback URL:** `https://<hub-api-production-domain>/api/auth/github/callback`

**Why one app?**
- PR previews use demo mode, no OAuth needed
- Production is the only environment with real OAuth
- Single callback URL is simpler and more secure

### Environment Injection

**Production:**
```
GITHUB_CLIENT_ID=<real app ID>
GITHUB_CLIENT_SECRET=<real app secret>
```

**PR Previews:**
```
PUBLIC_DEMO_MODE=true
(GitHub OAuth vars can be empty or absent)
```

---

## Cost Model

### Baseline: Hobby Plan ($5/mo)

- **Hobby Discount:** $5/mo base + $5 credit = $0 effective cost (first few months)
- **Usage overage:** `$0.10 / GB compute-hour`

### Alpha Scale (~50–200 MAU)

**Typical monthly consumption:**
- **hub-api:** ~2–5 GB compute-hours (WASM preview + DB queries)
- **hub-web:** ~0.5–2 GB compute-hours (static asset serving + SPA logic)
- **Postgres:** ~0.5 GB compute-hours (managed plugin)
- **Total:** ~3–9 GB compute-hours ≈ $0.30–0.90/mo

**With Hobby credit:** Effectively free for 6+ months.

### Scaling Triggers

| Metric | Action |
|--------|--------|
| **p95 response time > 1s** | Add replicas (2×) |
| **Memory pressure > 80%** | Increase CPU/RAM sliders |
| **Compute overages > $20/mo** | Upgrade to Standard plan |

---

## Scale Path: Hobby → Standard → Pro

### Hobby Plan (Current)
- **Cost:** $5/mo + overages
- **Replicas:** 1 per service
- **Scaling:** CPU/memory sliders only
- **Use:** Alpha, early beta

### Standard Plan ($20/mo base)
- **Cost:** $20/mo + overages
- **Replicas:** Up to 3 per service
- **Scaling:** CPU/memory + auto-scale by metrics
- **Use:** Closed beta, soft launch

### Pro Plan (Custom)
- **Cost:** Custom
- **Replicas:** Unlimited
- **Scaling:** Full autoscale, CDN, monitoring
- **Use:** Open launch, high-traffic

**Decision point:** Upgrade to Standard when Hobby overages exceed $10/mo (signals 50–100 MAU approaching limits).

---

## Prerequisites for Deployment

### Before Going Live

1. **Demo Mode PR Merged**
   - Implement `PUBLIC_DEMO_MODE` store
   - Add DemoBanner component
   - Session-local bookmarks (no DB writes in demo mode)
   - Wizard save gate (disable "save to library" in demo mode)
   - Without this, alpha users see broken OAuth errors

2. **Docker Builds Verified Locally**
   ```bash
   docker build -f Dockerfile.hub-api .
   docker build -f Dockerfile.hub-web .
   ```

3. **Postgres Migrations Idempotent**
   - All migrations must be idempotent (safe to run twice)
   - Test: `bun run scripts/migrate.ts` twice locally, both succeed

4. **GitHub OAuth App Created**
   - Callback URL configured exactly
   - Secrets stored securely in Railway (not in git)

---

## Verification Checklist

- [ ] `docker build -f Dockerfile.hub-api .` succeeds (WASM compiles, citum-core assets found)
- [ ] `docker build -f Dockerfile.hub-web .` succeeds (SvelteKit build via adapter-node)
- [ ] Railway deploy: hub-api logs show migration run → server bind
- [ ] Railway deploy: hub-web serves, `/api/browse` returns styles
- [ ] Production URL: login flow works, library browsing works
- [ ] PR preview: `PUBLIC_DEMO_MODE=true` visible, no OAuth errors, demo UX works
- [ ] PR close: Railway auto-tears down PR environment
