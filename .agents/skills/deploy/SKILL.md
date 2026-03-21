# deploy

Deployment guide for citum-hub: SvelteKit frontend + Rust backend + PostgreSQL.

## Stack

- **SvelteKit** (Bun, Node adapter or static adapter)
- **Rust** binary (`server/`) built with Cargo
- **PostgreSQL** (Docker or managed)
- **GitHub OAuth** — redirect URIs must match deployment domain

## Deployment Options

### Option A: Railway

1. Create two services: one for `client/` (SvelteKit), one for `server/` (Rust)
2. Add a PostgreSQL plugin
3. Set env vars (see below)
4. SvelteKit: set `adapter-node`, build with `bun run build`, start with `node build`
5. Rust: Railway auto-detects Cargo; set `CARGO_MANIFEST_DIR=server`

### Option B: Fly.io

1. `fly launch` in `client/` and `server/` separately
2. Use `fly postgres create` for the DB
3. Link via `DATABASE_URL` secret

### Option C: VPS (Docker Compose)

1. Push image: `docker build -t citum-hub .`
2. `docker compose -f docker-compose.prod.yml up -d`
3. Use Nginx as reverse proxy for SvelteKit (port 3000) and Rust API

## Required Env Vars (client/.env)

```
DATABASE_URL=postgres://...
GITHUB_CLIENT_ID=...
GITHUB_CLIENT_SECRET=...
JWT_SECRET=...
PUBLIC_API_URL=https://api.yourdomain.com
```

## GitHub OAuth Setup

- Go to GitHub → Settings → OAuth Apps
- Set **Homepage URL** and **Authorization callback URL** to your deployment domain
- Update `GITHUB_CLIENT_ID` / `GITHUB_CLIENT_SECRET`

## Trigger

Use this skill when the user says `/deploy` or asks how to deploy citum-hub.
