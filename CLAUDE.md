# citum-hub

Citation style platform — Find / Tweak / Build workflows for CSL-based citation styles.

## Tech Stack

- **Frontend**: SvelteKit 5, Svelte 5 (runes), TypeScript (strict), Tailwind CSS 4, Bun
- **Backend**: Rust (Cargo workspace), Axum
- **Database**: PostgreSQL
- **Auth**: GitHub OAuth + JWT

## Monorepo Structure

```
client/     # Full-stack SvelteKit app (frontend + API routes)
server/     # Rust backend (Axum)
specs/      # Product vision and user stories
docker-compose.yml  # PostgreSQL + citum-server
```

## Dev Setup

Docker is required for the DB and citum-server:

```bash
docker compose up -d
cd client && bun dev
```

Env vars live in `client/.env`. See `client/.env.example` if present.

## Key Routes

| Route | Purpose |
|-------|---------|
| `create-wizard/` | Step-by-step style creation wizard |
| `library/` | Browse and search citation styles |
| `preview/` | Live citation preview |
| `style/` | Style editor / detail view |

## Conventions

- **Svelte 5 runes**: Use `$state`, `$derived`, `$effect` — not legacy `writable`/`readable` stores
- **Tailwind**: Utility classes only, no inline styles
- **TypeScript**: Strict mode, no `any`
- **Components**: One component per file, max 300 lines

## Specs

Product vision and user stories live in `specs/`. Start there for feature context:
- `specs/STYLE_EDITOR_VISION.md` — Style editor and wizard vision

## Verification

```bash
~/.claude/scripts/verify.sh
```
