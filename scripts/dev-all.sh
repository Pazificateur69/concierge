#!/usr/bin/env bash
# Lance tous les services backend en parallèle pour la démo locale
# Usage : ./scripts/dev-all.sh

set -e
cd "$(dirname "$0")/.."

echo "🐳 Vérification de Mongo..."
docker compose -f infra/docker/docker-compose.yml up -d mongo redis

echo "🔨 Build des services..."
pnpm -r --filter "./services/**" --filter "./apps/api-gateway" run build

echo "🌱 Seed des données (si vide)..."
MONGO_URI="mongodb://localhost:27017/concierge" pnpm --filter @concierge/seed seed || echo "(seed déjà fait)"

echo "🚀 Démarrage des services..."
pkill -9 -f "node dist/main" 2>/dev/null || true
sleep 1

(cd services/auth-service     && PORT_AUTH=3001     MONGO_URI="mongodb://localhost:27017/concierge" node dist/main.js > /tmp/auth.log 2>&1 &)
(cd services/tenant-service   && PORT_TENANT=3007   MONGO_URI="mongodb://localhost:27017/concierge" node dist/main.js > /tmp/tenant.log 2>&1 &)
(cd services/content-service  && PORT_CONTENT=3002  MONGO_URI="mongodb://localhost:27017/concierge" node dist/main.js > /tmp/content.log 2>&1 &)
(cd services/orders-service   && PORT_ORDERS=3003   MONGO_URI="mongodb://localhost:27017/concierge" node dist/main.js > /tmp/orders.log 2>&1 &)
(cd services/survey-service   && PORT_SURVEY=3004   MONGO_URI="mongodb://localhost:27017/concierge" node dist/main.js > /tmp/survey.log 2>&1 &)
(cd apps/api-gateway          && PORT_GATEWAY=4000                                                  node dist/main.js > /tmp/gw.log     2>&1 &)

sleep 6

echo ""
echo "✅ Backend lancé !"
echo ""
echo "🌐 URLs :"
echo "   API Gateway : http://localhost:4000"
echo "   Swagger     : http://localhost:4000/api/docs"
echo "   Mongo UI    : http://localhost:8081"
echo ""
echo "📝 Logs : /tmp/{auth,tenant,content,orders,survey,gw}.log"
echo ""
echo "🚪 Pour stopper : pkill -9 -f 'node dist/main'"
