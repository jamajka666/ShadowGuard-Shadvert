#!/usr/bin/env bash
# Temporary HTTPS tunnel for voice testing (random *.trycloudflare.com URL)
set -euo pipefail
export PATH="$HOME/.local/bin:$PATH"
PORT="${PORT:-3000}"

if ! curl -sf "http://127.0.0.1:${PORT}/api/health" >/dev/null; then
  echo "App not running on :${PORT}. Start with: cd ~/projekty/moje-app && npm run dev"
  exit 1
fi

# Stop previous quick tunnels only
if pgrep -x cloudflared >/dev/null 2>&1; then
  echo "Stopping existing cloudflared..."
  pgrep -x cloudflared | xargs -r kill
  sleep 1
fi

echo "Starting quick tunnel → http://127.0.0.1:${PORT}"
exec cloudflared tunnel --url "http://127.0.0.1:${PORT}" --no-autoupdate
