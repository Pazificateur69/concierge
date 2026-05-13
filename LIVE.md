# Concierge — URLs LIVE

Référence rapide. Pour la doc complète : [`docs/HOSTING.md`](./docs/HOSTING.md), [`docs/SERVICES.md`](./docs/SERVICES.md), [`docs/RUNBOOK.md`](./docs/RUNBOOK.md).

## Frontends (Vercel · Hobby gratuit)

| App                  | URL                                                                       | Stack       |
|----------------------|---------------------------------------------------------------------------|-------------|
| Landing publique     | https://concierge-mauve-nine.vercel.app                                   | HTML statique |
| Lobby Royal Lyon     | https://concierge-lobby.vercel.app/?tenant=royal-lyon                     | Vue 3 + Ionic + Leaflet |
| Lobby Côte d'Azur    | https://concierge-lobby.vercel.app/?tenant=cote-azur                      | Vue 3 + Ionic + Leaflet |
| Smiley check-out     | https://concierge-smiley.vercel.app/?tenant=royal-lyon                    | Vue 3       |
| Smiley breakfast     | https://concierge-smiley.vercel.app/?tenant=royal-lyon&survey=satisfaction-breakfast | Vue 3 |
| Smiley spa           | https://concierge-smiley.vercel.app/?tenant=royal-lyon&survey=satisfaction-spa | Vue 3 |
| Admin Backoffice     | https://concierge-admin-gamma.vercel.app                                  | Angular 17  |
| Réception temps réel | https://concierge-reception.vercel.app                                    | Angular 17 + socket.io |

## Backend (Render · Free, Frankfurt)

| Service        | URL                                          | Path public via gateway |
|----------------|----------------------------------------------|-------------------------|
| API Gateway    | https://concierge-gateway.onrender.com       | `/` (point d'entrée)    |
| Swagger Docs   | https://concierge-gateway.onrender.com/api/docs | `/api/docs`          |
| auth-service   | https://concierge-auth.onrender.com          | (servi par gateway fallback) |
| tenant-service | https://concierge-tenant.onrender.com        | `/tenants/*`            |
| content-service| https://concierge-content.onrender.com       | `/content/*`            |
| orders-service | https://concierge-orders.onrender.com        | `/orders/*` + `/socket.io/*` |
| survey-service | https://concierge-survey.onrender.com        | `/surveys/*`            |

## Database

**MongoDB Atlas M0 free** · `cluster0.dhduoky.mongodb.net/concierge` · région eu-west-1 · 2 tenants seedés.

## Comptes démo (mot de passe : `Demo2026!`)

| Email                  | Rôle  | Hôtel             |
|------------------------|-------|-------------------|
| `admin@royal-lyon.fr`  | admin | Le Royal Lyon     |
| `staff@royal-lyon.fr`  | staff | Le Royal Lyon     |
| `admin@cote-azur.fr`   | admin | Côte d'Azur Resort|

## Pré-démo — réveiller le free tier

Les services Render free **dorment après 15 min**. Premier appel ~30-90 s. À lancer 2 min avant une démo :

```bash
for url in \
  https://concierge-gateway.onrender.com/healthz \
  https://concierge-auth.onrender.com/health \
  https://concierge-tenant.onrender.com/health \
  https://concierge-content.onrender.com/health \
  https://concierge-orders.onrender.com/orders/healthz \
  https://concierge-survey.onrender.com/surveys/healthz ; do
  curl -m 120 -o /dev/null -s -w "$url → %{http_code} in %{time_total}s\n" "$url" &
done; wait
```

Détails et troubleshooting : [`docs/RUNBOOK.md`](./docs/RUNBOOK.md).

## Démo — ordre suggéré

1. **Lobby Royal Lyon** → multi-langues, voix, carte Leaflet, POIs
2. **Switch tenant** → Côte d'Azur, branding différent (multi-tenant)
3. **Commander un café** depuis le menu
4. **Réception** (autre onglet) → la commande apparaît en temps réel via WebSocket
5. **Smiley** → vote 4/4 + commentaire (3 surveys disponibles : checkout, breakfast, spa)
6. **Admin** → KPIs, distribution smiley, liste commandes
7. **Code GitHub** → archi, microservices, patterns

## Si quelque chose plante

Voir [`docs/RUNBOOK.md`](./docs/RUNBOOK.md) (troubleshooting des erreurs courantes : 502, 500 jwt strategy, 401, WS sans events…).

Redeploy manuel via Render CLI :
```bash
export RENDER_API_KEY="rnd_eRFpvd48fVGQGzRe1BmQMhYgchR7"
render deploys create <service-id> --confirm
```
