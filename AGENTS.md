# Citum Hub

Citation style platform — Find / Tweak / Build workflows for CSL-based citation styles.

## Tech Stack

- **Frontend**: SvelteKit 5, Svelte 5 (Runes), TypeScript (strict), Tailwind CSS 4, Bun
- **Backend API**: Bun, Hono, `Bun.sql` (Direct Postgres)
- **Core Engine**: Rust (`citum-engine`), integrated via WASM
- **Database**: PostgreSQL
- **Auth**: GitHub OAuth + JWT

## Monorepo Structure

```
client/     # Full-stack SvelteKit app + Bun/Hono API routes
server/     # Rust backend crates (wasm-bridge, intent-engine)
specs/      # Product vision and user stories
docker-compose.yml  # PostgreSQL
```

## Dev Setup

Docker is required for the DB:

```bash
docker compose up -d
# Build WASM core if changed
cd server/crates/wasm-bridge && wasm-pack build --target nodejs
# Start API (port 3002)
cd client && bun run dev:api
# Start Frontend (port 3000)
cd client && bun run dev
```

Env vars live in `client/.env`.

## Key Routes

| Route | Purpose |
|-------|---------|
| `create-wizard/` | Step-by-step style creation wizard |
| `library/` | Browse and search citation styles |
| `style/` | Style editor / detail view |

## Conventions

- **Svelte 5 runes**: Use `$state`, `$derived`, `$effect` — not legacy `writable`/`readable` stores
- **Tailwind**: Utility classes only, no inline styles
- **TypeScript**: Strict mode, no `any`
- **Components**: One component per file, max 300 lines
- **API Proxy**: Frontend calls relative paths (`/api/*`) which SvelteKit proxies to the Bun API on port 3002.

## Release And Commit Hygiene

- Final ready-to-merge PRs must not contain internal debugging or iteration commits.
- Rewrite release branches into a small intentional history before merge.
- Default target for final release PRs is **2 commits**, unless the user explicitly asks for a different shape.
- Use **conventional commits** for final PR history.
- Follow standard **50/72** commit formatting:
  - subject line at or under 50 characters when possible
  - body lines wrapped at 72 characters
- Final commit messages must include useful bodies that explain both **what** changed and **why**.
- Review fixups must be folded back into the intended final commits before merge.
- Recovery or scratch branches are not merged directly; create a clean release branch first.
- Default merge method is **rebase merge** unless the user says otherwise.

## Specs

Product vision and user stories live in `specs/`. Start there for feature context:
- `specs/STYLE_EDITOR_VISION.md` — Style editor and wizard vision
- `specs/BUN_ADOPTION_PLAN.md` — Roadmap for Bun-native migration

## Verification

```bash
bun run check  # Lint, type-check, and format
```
