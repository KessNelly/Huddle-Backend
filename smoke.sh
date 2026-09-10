#!/usr/bin/env bash
set -uo pipefail
API="${1:?Usage: ./smoke.sh https://your-backend.onrender.com/api}"
EMAIL="smoke-$(date +%s)@huddle.dev"
PASS="smoketest123"
PASSED=0; FAILED=0

check() {
  if [ "$2" = "$3" ]; then
    echo "PASS $1 ($2)"; PASSED=$((PASSED+1))
  else
    echo "FAIL $1 (got $2, expected $3)"; FAILED=$((FAILED+1))
  fi
}

CODE=$(curl -s -o /tmp/h.json -w '%{http_code}' "$API/health")
check "health" "$CODE" "200"

CODE=$(curl -s -o /tmp/r.json -w '%{http_code}' -X POST "$API/auth/register" \
  -H 'Content-Type: application/json' \
  -d "{\"email\":\"$EMAIL\",\"password\":\"$PASS\",\"name\":\"Smoke Test\"}")
check "register" "$CODE" "201"

CODE=$(curl -s -o /tmp/l.json -w '%{http_code}' -X POST "$API/auth/login" \
  -H 'Content-Type: application/json' \
  -d "{\"email\":\"$EMAIL\",\"password\":\"$PASS\"}")
check "login" "$CODE" "200"

echo "$PASSED passed, $FAILED failed"
[ "$FAILED" -eq 0 ] || exit 1
