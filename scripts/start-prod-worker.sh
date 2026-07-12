#!/usr/bin/env bash
# Run the BullMQ worker against production Redis/DB (from .env.local).
# Use until Render worker is deployed.
set -euo pipefail
cd "$(dirname "$0")/.."

if [[ ! -f .env.local ]]; then
  echo "Missing .env.local"
  exit 1
fi

if ! grep -qE '^ANTHROPIC_API_KEY=sk-ant-' .env.local; then
  echo "ANTHROPIC_API_KEY is not set in .env.local — BOQ jobs will fail."
  echo "Add it at https://platform.claude.com/settings/keys (requires payment method)."
  exit 1
fi

set -a
# shellcheck disable=SC1091
source .env.local
set +a

echo "Starting BOQNOW worker (Ctrl+C to stop)..."
exec npm run worker
