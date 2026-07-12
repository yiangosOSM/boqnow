#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

echo "🐳 Starting Postgres + Redis (Docker)..."
if docker info >/dev/null 2>&1; then
  docker compose up -d
  echo "⏳ Waiting for Postgres..."
  until docker compose exec -T postgres pg_isready -U boqnow >/dev/null 2>&1; do sleep 1; done
else
  echo "⚠️  Docker unavailable — using local Postgres + Redis on localhost"
fi

echo "📋 Using mock env..."
cp .env.mock .env.local
set -a && source .env.local && set +a

echo "🗄️  Pushing schema + seeding..."
npx prisma generate
npx prisma db push
npx prisma db seed

echo "🚀 Starting app + worker..."
set -a && source .env.local && set +a
npm run dev &
DEV_PID=$!
npm run worker &
WORKER_PID=$!

cleanup() {
  kill "$DEV_PID" "$WORKER_PID" 2>/dev/null || true
}
trap cleanup EXIT INT TERM

echo ""
echo "✅ Mock dev ready:"
echo "   App:    http://localhost:3000"
echo "   Dashboard (auto-auth): http://localhost:3000/dashboard"
echo ""

wait
