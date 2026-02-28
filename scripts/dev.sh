#!/usr/bin/env bash
# Unified dev startup: Postgres + Rust backend + SvelteKit
set -e

ROOT_DIR="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT_DIR"

cleanup() {
    echo ""
    echo "Shutting down..."
    kill $RUST_PID 2>/dev/null || true
    kill $VITE_PID 2>/dev/null || true
    exit 0
}
trap cleanup SIGINT SIGTERM

# 1. Ensure Postgres is running
echo "==> Starting Postgres..."
docker compose up -d db
sleep 1

# 2. Kill any stale process on port 3000
if lsof -ti:3000 > /dev/null 2>&1; then
    echo "==> Killing stale process on :3000..."
    lsof -ti:3000 | xargs kill -9 2>/dev/null || true
    sleep 1
fi

# 3. Build & start Rust backend
echo "==> Building Rust backend..."
(cd server && cargo run) &
RUST_PID=$!

# Wait for Rust server to be ready
echo "==> Waiting for Rust backend on :3000..."
for i in $(seq 1 30); do
    if curl -s http://localhost:3000/ > /dev/null 2>&1; then
        echo "==> Rust backend ready."
        break
    fi
    if ! kill -0 $RUST_PID 2>/dev/null; then
        echo "ERROR: Rust backend failed to start. Check build errors above."
        exit 1
    fi
    sleep 2
done

# 4. Start SvelteKit dev server
echo "==> Starting SvelteKit dev server..."
(cd client && bun run dev) &
VITE_PID=$!

echo ""
echo "=========================================="
echo "  Citum Hub dev environment running"
echo "  Frontend: http://localhost:5173"
echo "  Backend:  http://localhost:3000"
echo "  Ctrl+C to stop all services"
echo "=========================================="
echo ""

wait
