#!/usr/bin/env bash
# Smoke test E2E sur l'API
set -e
GW="${1:-http://localhost:4000}"

echo "🧪 Smoke test : $GW"

echo "→ /health"
curl -fs $GW/health | python3 -m json.tool

echo
echo "→ /tenants/royal-lyon"
TENANT=$(curl -fs $GW/tenants/royal-lyon)
echo "$TENANT" | python3 -m json.tool | head -10
TID=$(echo "$TENANT" | python3 -c "import json,sys; print(json.load(sys.stdin)['id'])")

echo
echo "→ POST /auth/login"
LOGIN=$(curl -fs -X POST $GW/auth/login -H "Content-Type: application/json" -d '{"email":"admin@royal-lyon.fr","password":"Demo2026!"}')
TOKEN=$(echo "$LOGIN" | python3 -c "import json,sys; print(json.load(sys.stdin)['accessToken'])")
echo "Token reçu : ${TOKEN:0:30}..."

echo
echo "→ /content/pois?tenantId=$TID"
curl -fs "$GW/content/pois?tenantId=$TID" | python3 -m json.tool | head -20

echo
echo "→ /orders/menu?tenantId=$TID"
MENU=$(curl -fs "$GW/orders/menu?tenantId=$TID")
echo "$MENU" | python3 -m json.tool | head -10
MID=$(echo "$MENU" | python3 -c "import json,sys;d=json.load(sys.stdin);print(d[0]['id'])")

echo
echo "→ POST /orders (kiosk anonyme)"
curl -fs -X POST $GW/orders \
  -H "Content-Type: application/json" \
  -d "{\"tenantId\":\"$TID\",\"room\":\"204\",\"items\":[{\"menuItemId\":\"$MID\",\"quantity\":2}],\"source\":\"kiosk\"}" \
  | python3 -m json.tool | head -15

echo
echo "→ /surveys/satisfaction-checkout?tenantId=$TID"
curl -fs "$GW/surveys/satisfaction-checkout?tenantId=$TID" | python3 -m json.tool | head -15

echo
echo "→ POST /surveys/satisfaction-checkout/responses"
curl -fs -X POST "$GW/surveys/satisfaction-checkout/responses?tenantId=$TID" \
  -H "Content-Type: application/json" \
  -d '{"answers":[{"questionId":"q1","value":4},{"questionId":"q2","value":9}],"locale":"fr"}' \
  | python3 -m json.tool

echo
echo "✅ Tous les endpoints répondent."
