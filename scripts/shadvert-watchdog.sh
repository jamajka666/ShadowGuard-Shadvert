#!/usr/bin/env bash
# Local health check: if the app on :3000 is dead, bounce app + tunnel.
set -u
LOG="${XDG_STATE_HOME:-$HOME/.local/state}/shadvert-watchdog.log"
mkdir -p "$(dirname "$LOG")"
ts() { date -Iseconds; }

HEALTH="$(curl -sf -m 8 http://127.0.0.1:3000/api/health 2>/dev/null || true)"
if echo "$HEALTH" | grep -q '"ok":true'; then
  exit 0
fi

echo "$(ts) health FAIL — restart shadvert + cloudflared" >> "$LOG"
systemctl --user restart shadvert.service
sleep 3
systemctl --user restart cloudflared-shadvert.service
sleep 4
HEALTH2="$(curl -sf -m 8 http://127.0.0.1:3000/api/health 2>/dev/null || true)"
if echo "$HEALTH2" | grep -q '"ok":true'; then
  echo "$(ts) health OK after restart" >> "$LOG"
  exit 0
fi
echo "$(ts) health still FAIL after restart" >> "$LOG"
exit 1
