# Architecture

Document de référence pour la stack et l'organisation logicielle de Concierge — état post-V4.

## Vue d'ensemble

Concierge est une plateforme multi-touchpoints unifiée pour l'hôtellerie. Une seule architecture sert cinq interfaces utilisateur (portal, lobby, smiley, admin, réception) connectées à six microservices Node/Nest, le tout déployé en production.

```
+-----------------------------------------------------------------------+
|                            BROWSERS / KIOSKS                          |
|  Portal landing | Lobby (Vue/Ionic) | Smiley | Admin (NG) | Réception |
+-----------------------------------------------------------------------+
                                  |
                                  v  HTTPS + WSS (Socket.io)
+-----------------------------------------------------------------------+
|                          API GATEWAY (NestJS)                          |
|  - http-proxy-middleware vers chaque microservice                      |
|  - Helmet + HSTS 1y preload, CORS dynamique, request-id correlation    |
|  - Logs JSON structurés (méthode, status, durée, tenant, ua, ip)       |
|  - Swagger UI agrégé sur /api/docs · /healthz                          |
+-----------------------------------------------------------------------+
       |          |          |          |           |             |
       v          v          v          v           v             v
+----------+ +---------+ +--------+ +--------+ +---------+ +-----------+
| auth-svc | | tenant  | | content| | orders | | survey  | | notif-svc |
| JWT 15m  | | hotels  | | POI +  | | menu + | | smiley  | | (stub)    |
| refresh  | | brand + | | search | | cart + | | nps +   | | email/SMS |
| rotation | | direc-  | | softdel| | gateway| | condit. | | webhooks  |
| Throttler| | tory    | |        | | ws +   | | + offl. | | from      |
|          | |         | |        | | webhks | | queue   | | orders    |
+----------+ +---------+ +--------+ +--------+ +---------+ +-----------+
       \         \         \         \           \             /
        \_________\_________\____ MongoDB Atlas __/_____________/
                  Multi-tenant via discriminator tenantId
```

## Stack par couche

### Frontends (5)

| App | Framework | Rôle | Build | Bundle gzip |
|-----|-----------|------|-------|-------------|
| `apps/portal` | HTML statique + JS vanilla | Landing éditoriale + live counters + multi-tenant compare | Vercel | ~4 kB |
| `apps/lobby-kiosk` | Vue 3 + Ionic + Vite + Pinia + vue-i18n | Borne tactile (carte, menu, services, spa, activités, chat, virtual tour, screensaver, night-mode, cart persistant, 7 langues + RTL) | Vercel | ~245 kB |
| `apps/smiley` | Vue 3 + Ionic + Vite | Borne satisfaction (NPS, smiley, conditional, multi-survey, modes mural/kiosque/mobile, offline queue) | Vercel | ~120 kB |
| `apps/admin` | Angular 17 standalone + Signals | Backoffice multi-tenant : Analytics (charts, heatmap, NPS, sentiment, recommendations, predictive maintenance), Settings (theme builder, A/B, audit, scheduling, templates, import CSV, PDF report) | Vercel | ~92 kB |
| `apps/reception` | Angular 17 standalone + Signals | Tableau Kanban temps réel : drag, raccourcis clavier, ticket cuisine 80mm, Gantt timeline, plan d'étage, confetti, desktop notifs, SOS, agent stats, history | Vercel | ~82 kB |

### Backend (7)

| Service | Port | Responsabilité |
|---------|------|----------------|
| `apps/api-gateway` | 3000 | Reverse-proxy + helmet/HSTS + JSON logs + Swagger agrégé + `/healthz` |
| `services/auth-service` | 3001 | Login, JWT 15min, refresh-token rotation, ThrottlerModule (100/min) |
| `services/tenant-service` | 3002 | Hôtels (slug, theme, locales) + endpoint public `/directory` |
| `services/content-service` | 3003 | POIs (CRUD + recherche `?q=` regex Mongo + soft-delete) + pages |
| `services/orders-service` | 3004 | Menu CRUD + commandes + WebSocket gateway + `/public-stats` + Webhooks (HMAC-SHA256) |
| `services/survey-service` | 3005 | Surveys, questions conditionnelles, réponses |
| `services/notification-service` | 3006 | Stub email/SMS/push — webhooks managées par orders-service en interne |

Chaque microservice expose `/healthz` (uptime, mémoire heap) et `/readyz` via le `HealthController` partagé.

### Packages partagés

- `packages/types` — DTOs TypeScript partagés (Order, Survey, MenuItem, Poi, JwtPayload…)
- `packages/nest-common` — guards, decorators, middleware tenant, **HealthController**, exception filter
- `packages/design-tokens` — single source of truth tokens (couleurs, fonts, spacing, breakpoints) + `tokens.css` + dark mode

## Fonctionnalités V4 détaillées

### Admin

- **Dashboard** : KPIs (CA 24h, satisfaction, en cours, hôtels), distribution smiley, sparkline 7j, dernières commandes, **live activity ticker** auto-refresh 30s
- **Analytics** (range 7/30/90j) : revenue line chart inline-SVG, donut catégories, top 5 plats, **NPS sparkline + bands**, **heatmap heure×jour**, **sentiment analysis** keyword-based, **word cloud**, **funnel** complétion enquêtes, **recommendation engine** co-occurrence panier, **predictive maintenance** chambres à signaux multiples, mentions positives/négatives extraites
- **Surveys, POIs, Menu** : CRUD complet + drawer responses avec analytics par question
- **Settings** (8 sub-tabs) : Général (dark mode, notifs, RGPD), **Theme builder** live preview, **Audit log** typé, **Équipe** + invite, **A/B tests** variants/significativité, **Scheduling** push cron, **Email templates** éditables, **Import CSV** menu/POI + **PDF report** weekly
- **Tenant switcher** dropdown topbar
- **CSV exports** orders/surveys/POIs/all-in-one

### Reception

- **Kanban temps réel** Socket.io 4 colonnes (pending/accepted/preparing/delivered)
- **Drag-and-drop** valid transitions
- **Raccourcis clavier** : 1-4 status, /search, p print, ? help, esc, ↑↓
- **Ticket cuisine** 80mm imprimable
- **Gantt timeline** par commande avec durée par segment
- **Plan d'étage SVG** dérivant position chambre + autres pins actifs
- **Confetti** canvas natif au "delivered"
- **Desktop notifications** + **SOS** 3-beep
- **Agent stats** persistées (handled count + min moyennes)
- **Historique 30 jours** + export CSV
- **Toggle annulées** topbar

### Lobby kiosk

- **Multi-touchpoint** : Home, Map (Leaflet 31 POIs Lyon), Menu (cart Pinia persistant), Services, Spa, Activities, Help, 404
- **Concierge chat** Sophie : sans emojis, time-aware greeting, knowledge base étendue, chips de navigation
- **Virtual tour Matterport-style** 4 scènes (lobby/suite/spa/restaurant) avec HUD glass + compass
- **Weather 7d forecast** + suggestion contextuelle activité
- **Cart store** Pinia persistant localStorage avec replay offline
- **Idle warning** 15s countdown avec progress bar
- **Night mode** auto 22h-7h (CSS class `html.night`)
- **Screensaver** 0h-6h carrousel 4 photos + citations Bocuse
- **7 langues** : fr, en, de, es, it, zh, ar
- **RTL natif** pour l'arabe (`dir="rtl"`)
- **PWA installable** + service worker

### Smiley

- **Multi-mode** via `?mode=mural|kiosque|mobile`
- **Multi-survey switcher** sur écran de remerciement (checkout/breakfast/spa)
- **Faces SVG animées** au hover (bob, blink, smile-grow)
- **Conditional logic** complète sur questions (lte/gte/eq/lt/gt/ne)
- **Offline queue** localStorage avec replay
- **Voice TTS** opt-in (Web Speech API)

### Portal landing

- **Live counters** API polling 30s (totalOrders, 24h, revenue, surveys) avec animation count-up
- **Multi-tenant compare** Royal Lyon vs Negresco
- **Apps grid** liens directs vers les 4 touchpoints
- **Responsive** breakpoints 900/540

## Choix techniques structurants

### Multi-tenant par discriminator

Chaque collection MongoDB porte `tenantId`. `TenantMiddleware` injecte `req.tenantId`, chaque service ajoute `{ tenantId }` au filtre. Multi-tenant trivialement scalable, isolation logique forte.

### Temps réel via Socket.io

Lobby/smiley créent une commande → orders-service émet `order:new` sur la room `tenant-{id}` → reception reçoit + son + notification + confetti à la livraison.

### Gateway en HTTP-proxy plutôt qu'API Gateway managé

http-proxy-middleware mince + middlewares Express custom (logs JSON, helmet, CORS dynamique, healthz). Voir ADR-003.

### Webhooks pour intégrations PMS/Slack/Stripe

`WebhooksService` dans orders-service avec signature HMAC-SHA256. Events : `order.created`, `order.updated`, `order.delivered`, `order.cancelled`. Endpoint configurable via `WEBHOOK_DEFAULT_URL`. Voir ADR-012.

### Charts inline-SVG, pas Recharts/Chart.js

Zéro dépendance, performance native, style cohérent éditorial. Voir ADR-006.

### Pas d'IA générative

Concierge chat = knowledge base à mots-clés. Sentiment = listes de mots positifs/négatifs. Recommendation = co-occurrence dans le panier. Predictive maintenance = agrégation de signaux (cancelled/late/low). Démo déterministe, coût zéro, valeur sur l'archi pas le buzz IA. Voir ADR-009.

## Sécurité

- **JWT 15 min** + refresh-token rotation (auth-service)
- **Helmet** sur gateway + tous services
- **HSTS** 1 an + preload + includeSubDomains
- **Throttler** 100 req/min sur auth
- **CORS dynamique** (origin renvoyé, pas de wildcard)
- **Validation pipe** sur tous endpoints
- **RGPD** endpoint anonymisation + export CSV depuis admin
- **CSP** prévue (désactivée en dev pour faciliter le proxy)
- **Audit log** avec acteur/IP/cible

## Observabilité

- `/healthz` et `/readyz` sur chaque microservice (uptime, mémoire heap, version)
- `/orders/public-stats` (no PII) pour le portal
- Logs JSON structurés au gateway : `{ method, path, status, durationMs, ua, ip, correlationId, tenantId }`
- Render dashboards par service
- GitHub Actions Lighthouse CI sur PR

## Déploiement

| Couche | Plateforme | Notes |
|--------|-----------|-------|
| Frontends | Vercel | Auto-deploy sur push `main` |
| Microservices | Render (free tier) | `buildFilter` par service · `healthCheckPath` configuré |
| Database | MongoDB Atlas M0 free | IP whitelist `0.0.0.0/0` pour Render |

## Testing

- **Type-checking** strict TS partout
- **Playwright e2e** sur portal + lobby (`e2e/`)
- **GitHub Actions CI** : lint, build per app, docker build matrix
- **Lighthouse CI** : performance/a11y/best-practices/seo budgets ≥ 0.8/0.9
- **CodeQL** weekly + on-PR
- **Dependabot** weekly groups (nest, angular, vue, types, eslint)
- **Husky pre-commit** : lint-staged + type-check shared packages

## Performance

- Bundle lobby : ~245 kB gzip (Leaflet est gros, accepté)
- Bundle admin : ~92 kB gzip (signals + inline SVG charts)
- TTI < 1.5s sur réseau 4G via Vercel CDN
- WebSocket reconnection auto (transports: websocket → polling)
- Auto-refresh admin orders 30s (live ticker feel)

## CI/CD pipeline

```
push main
  ├─ Vercel deploy frontends (parallèle)
  ├─ Render redéploie services modifiés (buildFilter)
  └─ GitHub Actions
       ├─ CI: lint + build + docker matrix
       ├─ E2E: Playwright (chromium) sur staging URLs
       ├─ Lighthouse: 4 URLs auditées
       └─ CodeQL: scan TS/JS
```

## Évolutions envisagées

Voir [DECISIONS.md](./DECISIONS.md) pour les ADRs (15 décisions documentées).
