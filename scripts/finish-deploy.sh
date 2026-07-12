#!/usr/bin/env bash
# Push any newly-filled secrets from .env.local to Vercel and redeploy.
# Run after adding ANTHROPIC_API_KEY (and optionally Stripe vars).
set -euo pipefail
cd "$(dirname "$0")/.."

if [[ ! -f .env.local ]]; then
  echo "Missing .env.local"
  exit 1
fi

get_env() {
  local key="$1"
  grep -E "^${key}=" .env.local | head -1 | cut -d= -f2- | sed 's/^"//;s/"$//'
}

push_if_set() {
  local key="$1"
  local val
  val="$(get_env "$key")"
  if [[ -n "$val" ]]; then
    printf '%s' "$val" | vercel env add "$key" production --force
    echo "✓ $key → Vercel production"
  else
    echo "○ $key empty — skipped"
  fi
}

echo "=== Pushing secrets to Vercel ==="
push_if_set ANTHROPIC_API_KEY
push_if_set STRIPE_SECRET_KEY
push_if_set STRIPE_WEBHOOK_SECRET
push_if_set NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY
push_if_set NEXT_PUBLIC_STRIPE_STARTER_PRICE_ID
push_if_set NEXT_PUBLIC_STRIPE_PRO_PRICE_ID
push_if_set NEXT_PUBLIC_STRIPE_AGENCY_PRICE_ID

echo ""
echo "=== Redeploying production ==="
vercel --prod --yes

echo ""
echo "=== Health check ==="
curl -s "https://boqnow.vercel.app/api/health" | python3 -m json.tool

echo ""
echo "=== Render worker (manual) ==="
echo "1. https://dashboard.render.com/blueprint/new"
echo "2. Repo: https://github.com/yiangosOSM/boqnow"
echo "3. Add card → deploy → paste env vars from .env.local"
echo "   Required: DATABASE_URL, DIRECT_URL, ANTHROPIC_API_KEY,"
echo "   UPSTASH_REDIS_URL, UPSTASH_REDIS_TOKEN, SUPABASE_SERVICE_ROLE_KEY,"
echo "   NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_APP_URL, RESEND_API_KEY"
echo ""
echo "Interim: run the worker locally until Render is live:"
echo "  ./scripts/start-prod-worker.sh"
