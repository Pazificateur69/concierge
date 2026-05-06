# Architecture

Document de référence pour la stack et l'organisation logicielle de Concierge.

## Vue d'ensemble

Concierge est une plateforme multi-touchpoints unifiée pour l'hôtellerie. Une seule architecture sert quatre interfaces utilisateur (lobby, smiley, admin, réception) connectées à une couche de microservices Node/Nest, le tout déployé en production.

```
+-----------------------------------------------------------------------+
|                            BROWSERS / KIOSKS                          |
|  Lobby (Vue/Ionic) | Smiley (Vue) | Admin (Angular) | Réception (NG)  |
+-----------------------------------------------------------------------+
                                  |
                                  v  HTTPS + WSS (Socket.io)
+-----------------------------------------------------------------------+
|                          API GATEWAY (NestJS)                          |
|  - http-proxy-middleware vers chaque microservice                      |
|  - Helmet, HSTS, CORS, request logging structuré                       |
|  - Swagger UI agrégé sur /api/docs                                     |
+-----------------------------------------------------------------------+
       |          |          |          |           |             |
       v          v          v          v           v             v
+----------+ +---------+ +--------+ +--------+ +---------+ +-----------+
| auth-svc | | tenant  | | content| | orders | | survey  | | analytics |
| JWT      | | hotels  | | POI    | | menu+  | | smiley  | | Pino logs |
| refresh  | | brand   | | pages  | | cart   | | nps     | | metrics   |
+----------+ +---------+ +--------+ +--------+ +---------+ +-----------+
       \         \         \         \           \             /
        \_________\_________\____ MongoDB Atlas __/_____________/
                  Multi-tenant via discriminator tenantId
```

## Stack par couche

### Frontends

| App | Framework | Rôle | Build |
|-----|-----------|------|-------|
| `apps/lobby-kiosk` | Vue 3 + Ionic + Vite + Pinia + vue-i18n | Borne tactile lobby (carte, menu, services, spa, activités, chat concierge) | Vercel |
| `apps/smiley` | Vue 3 + Ionic + Vite | Borne satisfaction multi-questions (NPS, smiley, texte, conditional logic) | Vercel |
| `apps/admin` | Angular 17 standalone + Signals | Backoffice multi-tenant : analytics, CRUD POI/menu, surveys viewer | Vercel |
| `apps/reception` | Angular 17 standalone + Signals | Tableau Kanban temps réel : drag, raccourcis clavier, ticket cuisine, SOS | Vercel |
| `apps/portal` | HTML/CSS statique + JS poll | Landing éditoriale + live counters + multi-tenant compare | Vercel |

### Backend

| Service | Port | Responsabilité |
|---------|------|----------------|
| `apps/api-gateway` | 3000 | Reverse-proxy unique, helmet, logging, Swagger agrégé |
| `services/auth-service` | 3001 | Login, JWT, refresh-token rotation, ThrottlerModule |
| `services/tenant-service` | 3002 | Hôtels (slug, theme, locales) + endpoint public `/directory` |
| `services/content-service` | 3003 | POIs (lat/lng, catégorie, photo, horaires, rating) + pages |
| `services/orders-service` | 3004 | Menu + commandes + WebSocket gateway temps réel |
| `services/survey-service` | 3005 | Surveys, questions conditionnelles, réponses |
| `services/notification-service` | 3006 | (placeholder) emails, SMS, push |
| `services/analytics-service` | 3007 | (placeholder) agrégats, NPS, séries temporelles |

### Packages partagés

- `packages/types` — DTO TypeScript partagés entre back et fronts (Order, Survey, MenuItem, Poi, JwtPayload…)
- `packages/nest-common` — guards, decorators, middleware tenant, HealthController générique, exception filter

## Choix techniques structurants

### Multi-tenant par discriminator

Chaque collection MongoDB porte un champ `tenantId`. Toutes les requêtes Nest passent par `TenantMiddleware` qui injecte `req.tenantId`, et chaque service ajoute systématiquement `{ tenantId }` dans le filtre Mongo. Avantage : pas de provisioning par hôtel, scaling horizontal trivial, isolation logique forte.

### Temps réel via Socket.io

Les commandes émises par le lobby/smiley sont propagées en push à la réception via une room `tenant-{id}`. Le gateway Nest expose un namespace `/concierge` avec auth JWT.

### Gateway en HTTP-proxy plutôt qu'API Gateway managé

Choix volontaire pour rester frugal et garder la portabilité. http-proxy-middleware est mince, transparent et permet d'injecter des middlewares Express/Nest custom (CORS, helmet, logging). En production on basculerait vers Kong ou un gateway managé.

### Angular signals pour les dashboards

Admin et réception utilisent les signals Angular 17 pour la réactivité. Plus performant et plus lisible que RxJS pour des UIs de tableau de bord avec beaucoup de computed dérivés (KPIs, filtres, charts inline-SVG).

### Pinia + vue-i18n côté lobby

Cart store persistant en localStorage. 7 langues incluant RTL (arabe).

### CSS-in-component avec design tokens

Tokens centralisés (couleurs, espaces, ombres). Mode sombre `:host(.dark)` via class-toggle. Mode nuit auto sur lobby (22h-7h) via class HTML.

## Sécurité

- **JWT 15 min** + refresh-token rotation (auth-service)
- **Helmet** sur gateway + tous services (HSTS 1 an, referrer policy strict-origin)
- **Throttler** rate-limit sur auth (100 req/min)
- **CORS whitelist** (pas de wildcard en prod, origin renvoyé dynamiquement)
- **Validation pipe** sur tous endpoints (whitelist + transform)
- **RGPD** endpoint d'anonymisation client + export complet CSV depuis admin

## Observabilité

- `/healthz` et `/readyz` sur chaque microservice (uptime, mémoire heap)
- `/orders/public-stats` exposé pour le portal (counters non-PII)
- Logs structurés JSON sur le gateway (méthode, path, status, duration, correlation-id, tenant-id)
- Render dashboards par service

## Déploiement

| Couche | Plateforme | Notes |
|--------|-----------|-------|
| Frontends | Vercel | Déploiement automatique sur push `main` |
| Microservices | Render (free tier) | `buildFilter` pour ne redéployer que les services modifiés |
| Database | MongoDB Atlas | Cluster M0 free, IP whitelist `0.0.0.0/0` pour Render |

## Performance

- Bundle lobby : ~245 kB gzip (Leaflet + Ionic + Vue)
- Bundle admin : ~74 kB gzip (Angular signals + inline SVG charts)
- TTI < 1.5s sur réseau 4G (Vercel CDN)
- WebSocket reconnection automatique via Socket.io transports

## Tests

- Type-checking strict TS partout
- (à venir) Playwright e2e sur 3 flows critiques
- (à venir) Jest unit sur services Nest (≥ 60% coverage cible)

## Évolutions envisagées

Voir [DECISIONS.md](./DECISIONS.md) pour les ADRs.
