# 🌐 Concierge — URLs LIVE

Déployé en production le 2026-05-05.

## 🎨 Frontends (Vercel)

| App | URL | Usage |
|-----|-----|-------|
| **Lobby Royal Lyon** | https://concierge-lobby.vercel.app/?tenant=royal-lyon | Borne tactile lobby — Lyon |
| **Lobby Côte d'Azur** | https://concierge-lobby.vercel.app/?tenant=cote-azur | Borne tactile lobby — Nice |
| **Smiley check-out** | https://concierge-smiley.vercel.app/?tenant=royal-lyon | Sondage satisfaction |
| **Admin Backoffice** | https://concierge-admin-gamma.vercel.app | Dashboard directeur |
| **Réception temps réel** | https://concierge-reception.vercel.app | Kanban orders WebSocket |

## ⚙️ Backend (Render)

| Service | URL |
|---------|-----|
| API Gateway | https://concierge-gateway.onrender.com |
| Swagger Docs | https://concierge-gateway.onrender.com/api/docs |
| auth-service | https://concierge-auth.onrender.com |
| tenant-service | https://concierge-tenant.onrender.com |
| content-service | https://concierge-content.onrender.com |
| orders-service | https://concierge-orders.onrender.com |
| survey-service | https://concierge-survey.onrender.com |

## 🗄️ Database

MongoDB Atlas M0 Free · `cluster0.dhduoky.mongodb.net` · 2 hôtels seedés

## 🔑 Comptes démo

Tous le mot de passe : `Demo2026!`

| Email | Rôle | Hôtel |
|-------|------|-------|
| `admin@royal-lyon.fr` | admin | Le Royal Lyon |
| `staff@royal-lyon.fr` | staff | Le Royal Lyon |
| `admin@cote-azur.fr` | admin | Côte d'Azur Resort |

## ⚠️ Notes free tier

Les services Render free **dorment après 15 min d'inactivité**. Le premier appel après sommeil prend ~50 sec. Avant l'entretien, pré-chauffe :
```
curl https://concierge-gateway.onrender.com/health
curl https://concierge-content.onrender.com
curl https://concierge-orders.onrender.com
```

## 🎯 Pour la démo Dymension

Ordre suggéré :
1. **Lobby Royal Lyon** → multi-langues, voix, carte Leaflet
2. **Switch tenant** → Côte d'Azur, branding différent (multi-tenant)
3. **Commander un café** depuis le menu
4. **Réception** (autre onglet) → la commande apparaît en temps réel via WebSocket
5. **Smiley** → vote 4/4 + commentaire
6. **Admin** → KPIs, distribution smiley, liste commandes
7. **Code GitHub** → archi, microservices, patterns

## 🔄 Si quelque chose plante

Toutes les services sont redéployables en 1 commande :
```bash
export RENDER_API_KEY="rnd_eRFpvd48fVGQGzRe1BmQMhYgchR7"
render deploys create srv-d7t55eu7r5hc738rln7g --confirm
```
