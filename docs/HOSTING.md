# Hosting — qui héberge quoi, où, et comment

Source de vérité unique sur l'**état réel de production** au 2026-05-13. Si la doc et la réalité divergent, mettez à jour ce fichier.

## TL;DR — la carte complète

```
        ┌──────────────────────────────────────────────────────────────────────┐
        │                              UTILISATEURS                            │
        └──────────────────────────────────────────────────────────────────────┘
                                          │
                                          │   HTTPS
                                          ▼
        ┌──────────────────────────────────────────────────────────────────────┐
        │                          VERCEL  (5 frontends statiques)             │
        │                                                                      │
        │   portal · lobby-kiosk · smiley · admin · reception                  │
        │   ── Vue 3 ────────────── ────── ── Angular 17 ──                    │
        │                                                                      │
        │   région : Global Edge Network                                       │
        │   plan   : Hobby (gratuit)                                           │
        └──────────────────────────────────────────────────────────────────────┘
                                          │
                                          │   HTTPS  +  WSS (socket.io)
                                          ▼
        ┌──────────────────────────────────────────────────────────────────────┐
        │                         RENDER  (6 services Node)                    │
        │                                                                      │
        │           ┌──────────────── api-gateway ────────────────┐            │
        │           │  proxy HTTP/WS, swagger, auth fallback      │            │
        │           └──┬────┬──────┬──────┬──────┬──────────────┬─┘            │
        │              ▼    ▼      ▼      ▼      ▼              ▼              │
        │           auth  tenant content orders survey   (concierge ns WS)     │
        │                                                                      │
        │   région : Frankfurt   plan : Free (15 min idle → sleep)             │
        └──────────────────────────────────────────────────────────────────────┘
                                          │
                                          │   mongodb+srv  TLS
                                          ▼
        ┌──────────────────────────────────────────────────────────────────────┐
        │                       MONGODB ATLAS  (M0 free, 512 Mo)               │
        │   cluster0.dhduoky.mongodb.net   ·  db = concierge                   │
        │   région : eu-west-1 (Ireland)                                       │
        └──────────────────────────────────────────────────────────────────────┘
```

## 1. Frontends — Vercel

Tous déployés via le repo GitHub `Pazificateur69/concierge`. Auto-deploy sur chaque push `main`.

| App       | Stack       | URL prod                                                | Rôle                                       | Repo path             |
|-----------|-------------|---------------------------------------------------------|--------------------------------------------|------------------------|
| portal    | HTML statique | https://concierge-mauve-nine.vercel.app               | Landing publique + diagramme archi inline  | `apps/portal`         |
| lobby-kiosk | Vue 3 + Ionic + Leaflet | https://concierge-lobby.vercel.app          | Borne tactile hall — POIs, menu, services  | `apps/lobby-kiosk`    |
| smiley    | Vue 3       | https://concierge-smiley.vercel.app                    | Borne satisfaction check-out               | `apps/smiley`         |
| admin     | Angular 17  | https://concierge-admin-gamma.vercel.app               | Backoffice directeur (KPIs, contenus, menu)| `apps/admin`          |
| reception | Angular 17  | https://concierge-reception.vercel.app                 | Kanban commandes temps réel (WebSocket)    | `apps/reception`      |

Plan : **Hobby (gratuit)**. Pas de limite de bande passante problématique pour la démo. Build = SPA statique (`outputDirectory: dist` ou `dist/browser`), routes SPA via `rewrites` sur `/index.html`.

### Sélecteur de tenant (multi-hôtel)

Le lobby et le smiley acceptent un query param `?tenant=<slug>` pour switcher d'hôtel :
- `https://concierge-lobby.vercel.app/?tenant=royal-lyon`
- `https://concierge-lobby.vercel.app/?tenant=cote-azur`

## 2. Backend — Render

Blueprint : [`render.yaml`](../render.yaml). 6 services web Node 20, plan **Free**, région **Frankfurt**.

| Service              | URL                                       | Port | Healthcheck path     | Build filter (paths)                            |
|----------------------|-------------------------------------------|------|----------------------|--------------------------------------------------|
| **api-gateway**      | https://concierge-gateway.onrender.com    | 10000| `/healthz`           | `apps/api-gateway/**`, `packages/**`, `render.yaml` |
| auth-service         | https://concierge-auth.onrender.com       | 10000| `/auth/healthz` *(†)*| `services/auth-service/**`                       |
| tenant-service       | https://concierge-tenant.onrender.com     | 10000| `/tenants/healthz` *(†)*| `services/tenant-service/**`                  |
| content-service      | https://concierge-content.onrender.com    | 10000| `/content/healthz` *(†)*| `services/content-service/**`                 |
| orders-service       | https://concierge-orders.onrender.com     | 10000| `/orders/healthz`    | `services/orders-service/**`                     |
| survey-service       | https://concierge-survey.onrender.com     | 10000| `/surveys/healthz`   | `services/survey-service/**`                     |

*(†)* Le `render.yaml` déclare ces paths mais les controllers exposent en réalité `/health`. Render ne sait donc pas que le service est sain (le mismatch n'empêche pas le service de fonctionner). À corriger un jour : voir `RUNBOOK.md`.

### Plan free : conséquences

- **Sleep après 15 min sans trafic** → premier appel = 30 à 90 s de cold start (build du conteneur).
- **0,5 GB RAM / 0,1 CPU** par service.
- **Réseau interne fermé** : un service Render free n'a pas accès aux autres via hostname privé. Le gateway parle aux microservices via leur **URL publique HTTPS** (`process.env.SERVICE_*_URL`).

Pour pré-chauffer tous les services avant une démo : voir [`RUNBOOK.md`](./RUNBOOK.md#réveiller-tout).

### Variables d'environnement partagées

`envVarGroups: concierge-shared` (déclaré dans `render.yaml`) :

| Clé                  | Valeur                                                            |
|----------------------|-------------------------------------------------------------------|
| `NODE_ENV`           | `production`                                                      |
| `NODE_VERSION`       | `20.18.0`                                                         |
| `MONGO_URI`          | `mongodb+srv://…@cluster0.dhduoky.mongodb.net/concierge`          |
| `JWT_SECRET`         | généré par Render (`generateValue: true`) — partagé par tous      |
| `JWT_REFRESH_SECRET` | généré par Render — partagé par tous                              |

Le gateway a 5 vars supplémentaires `SERVICE_*_URL` pointant vers les autres services publics.

> ⚠ La `MONGO_URI` est commitée en clair dans `render.yaml`. C'est un compromis assumé pour la démo. À sortir dans un secret store avant tout usage réel.

## 3. Base de données — MongoDB Atlas

- **Cluster** : `cluster0.dhduoky.mongodb.net`
- **DB** : `concierge`
- **Plan** : M0 free (512 Mo, partagé)
- **Région** : eu-west-1 (Ireland)
- **User app** : `alessandronetstrategy_db_user`
- **Network Access** : `0.0.0.0/0` (toutes IPs autorisées — simplifie le free tier Render dont les IPs sortantes changent)

Collections : voir [`docs/data-model.md`](./data-model.md).

## 4. Code mort à connaître

Présents dans le repo mais **non déployés** :

| Chose                          | Statut                                     |
|--------------------------------|--------------------------------------------|
| `services/notification-service/`| Code TS, pas dans `render.yaml`           |
| `services/analytics-service/`  | Dossier vide                               |
| Redis / Upstash                | Mentionné dans la doc historique uniquement|
| RabbitMQ / CloudAMQP           | Mentionné dans la doc historique uniquement|
| Docker Compose (`infra/compose`)| Pour dev local seulement                   |

## 5. Repo GitHub

- Repo : **public** — `https://github.com/Pazificateur69/concierge`
- Branche prod : `main`
- Workflow : push direct sur `main` → auto-deploy Render (build filter par service) + Vercel (par projet).

## 6. Identifiants démo

Mot de passe : `Demo2026!`

| Email                  | Rôle  | Tenant            |
|------------------------|-------|-------------------|
| `admin@royal-lyon.fr`  | admin | Le Royal Lyon     |
| `staff@royal-lyon.fr`  | staff | Le Royal Lyon     |
| `admin@cote-azur.fr`   | admin | Côte d'Azur Resort|

Authentification gérée par le **gateway** lui-même via `AuthFallbackController` (signe les JWT avec `JWT_SECRET`). L'`auth-service` dédié existe mais sleep sur free tier, donc le fallback prend le relais. Tous les microservices valident les JWT avec le **même** secret.

## Voir aussi

- [`SERVICES.md`](./SERVICES.md) — catalogue détaillé des endpoints par service
- [`RUNBOOK.md`](./RUNBOOK.md) — opérations courantes (réveil, redeploy, debug)
- [`ARCHITECTURE.md`](./ARCHITECTURE.md) — vue conceptuelle de l'architecture
- [`DEPLOYMENT.md`](./DEPLOYMENT.md) — guide de premier déploiement (création des comptes Render/Vercel/Atlas depuis zéro)
