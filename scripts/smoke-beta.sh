#!/usr/bin/env bash
# Dad-path / closed-beta smoke (SGW-005 D-P1-3).
# Usage:
#   BASE_URL=https://shadowguard-shadvert.site ./scripts/smoke-beta.sh
#   BASE_URL=http://127.0.0.1:3000 ./scripts/smoke-beta.sh
set -euo pipefail

BASE_URL="${BASE_URL:-https://shadowguard-shadvert.site}"
BASE_URL="${BASE_URL%/}"
FAIL=0

ok() { echo "  OK  $1"; }
bad() { echo "  FAIL $1"; FAIL=1; }

echo "ShadowGuard smoke → $BASE_URL"
echo

# 1) Health
HEALTH=$(curl -sS -m 15 "$BASE_URL/api/health" || true)
if echo "$HEALTH" | grep -q '"ok":true'; then
  ok "GET /api/health"
else
  bad "GET /api/health → $HEALTH"
fi

# 2) HTML shell
CODE=$(curl -sS -m 15 -o /dev/null -w "%{http_code}" "$BASE_URL/" || echo "000")
if [ "$CODE" = "200" ]; then
  ok "GET / → $CODE"
else
  bad "GET / → $CODE"
fi

# 3) Empty analyze → 400
CODE=$(curl -sS -m 20 -o /tmp/sg-smoke-analyze.json -w "%{http_code}" \
  -X POST "$BASE_URL/api/analyze-ad" \
  -H 'Content-Type: application/json' \
  -d '{}' || echo "000")
if [ "$CODE" = "400" ]; then
  ok "POST /api/analyze-ad {} → 400"
else
  bad "POST /api/analyze-ad {} → $CODE (expected 400)"
fi

# 4) Heartbeat without family code → 403 (or 503 if not configured)
CODE=$(curl -sS -m 15 -o /tmp/sg-smoke-hb.json -w "%{http_code}" \
  -X POST "$BASE_URL/api/family/heartbeat" \
  -H 'Content-Type: application/json' \
  -d '{"deviceId":"smoke-probe"}' || echo "000")
if [ "$CODE" = "403" ] || [ "$CODE" = "503" ]; then
  ok "POST /api/family/heartbeat without code → $CODE"
else
  bad "POST /api/family/heartbeat without code → $CODE (expected 403/503)"
fi

# 5) Security headers on HTML (best-effort)
HDRS=$(curl -sSI -m 15 "$BASE_URL/" || true)
if echo "$HDRS" | grep -qi 'content-security-policy'; then
  ok "CSP header present"
else
  bad "CSP header missing"
fi
if echo "$HDRS" | grep -qi 'strict-transport-security\|x-content-type-options'; then
  ok "HSTS or X-Content-Type-Options present"
else
  bad "Expected security headers missing"
fi

echo
if [ "$FAIL" -eq 0 ]; then
  echo "Smoke PASSED"
  exit 0
fi
echo "Smoke FAILED ($FAIL checks)"
exit 1
