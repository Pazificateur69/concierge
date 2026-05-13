# 🏨 Concierge — Plateforme tactile hôtelière unifiée

> Projet réalisé dans le cadre d'une candidature en alternance chez **Dymension** (Lyon, 2026).
> Inspiré directement de leur écosystème : **KioskInfo**, **Delyss**, **Expressyon**.

[![Node](https://img.shields.io/badge/node-%E2%89%A520-brightgreen)](https://nodejs.org/)
[![NestJS](https://img.shields.io/badge/NestJS-10-red)](https://nestjs.com/)
[![Vue](https://img.shields.io/badge/Vue-3-42b883)](https://vuejs.org/)
[![Angular](https://img.shields.io/badge/Angular-17-dd0031)](https://angular.io/)
[![Ionic](https://img.shields.io/badge/Ionic-7-blue)](https://ionicframework.com/)
[![MongoDB](https://img.shields.io/badge/MongoDB-7-green)](https://www.mongodb.com/)
[![Docker](https://img.shields.io/badge/Docker-ready-blue)](https://www.docker.com/)

---

## 🎯 Le pitch

**Concierge** est une plateforme tactile multi-touchpoints pour hôtels qui **unifie en une seule architecture** ce que Dymension propose actuellement avec trois produits séparés :

| Produit Dymension | Touchpoint Concierge | Tech |
|-------------------|---------------------|------|
| **KioskInfo** (info hôtel, carte) | Borne lobby (table interactive) | Vue 3 + Ionic + Leaflet |
| **Delyss** (commande resto/room service) | Tablette en chambre | Vue 3 + Ionic |
| **Expressyon** (satisfaction) | Borne smiley check-out | Vue 3 + Ionic + Web Speech |
| (nouveau) | Écran réception temps réel | Angular + WebSocket |
| (nouveau) | Backoffice multi-hôtel | Angular |

**Toute la stack matche la fiche de poste** : TypeScript, Node.js, NestJS, Angular, Vue, Ionic, MongoDB, Docker, microservices.

---

## ✨ Fonctionnalités clés (V4)

### Côté client (lobby & smiley)
- **7 langues** dynamiques (FR/EN/DE/ES/IT/ZH/AR) avec **RTL natif** pour l'arabe
- **PWA offline-first** — les commandes passent même sans wifi (queue localStorage + replay)
- **Cart store persistant** Pinia + localStorage, survit aux navigations
- **Mode nuit auto** 22h-7h (luminosité réduite, contraste doux)
- **Screensaver** 0h-6h (carrousel photos + citations Bocuse)
- **Idle warning modal** 15s countdown avant retour accueil
- **404 page** éditoriale
- **Concierge chat** Sophie : knowledge base FR, time-aware greeting, chips de navigation
- **Visite virtuelle 360°** Matterport-style (4 scènes, HUD glass-blur)
- **Météo 7 jours** + suggestions contextuelles d'activités
- **Carte interactive Leaflet** 31 POIs Lyon (+ 15 Nice via tenant Negresco)
- **Smiley** : faces SVG animées (bob, blink, smile-grow), conditional logic, multi-survey switcher, modes mural/kiosque/mobile

### Côté staff (réception)
- **Kanban temps réel** Socket.io (drag-drop entre 4 colonnes)
- **Confetti** au "delivered" (canvas natif)
- **Desktop notifications** API + son + bouton SOS (3-beep)
- **Raccourcis clavier** (1-4 status, /search, p print, ?)
- **Ticket cuisine 80mm** imprimable
- **Gantt timeline** par commande avec durée par segment
- **Plan d'étage SVG** dérivant la position de chaque chambre
- **Agent stats** persistées (commandes traitées, min moyennes)
- **Historique 30j** + export CSV

### Côté gestion (admin)
- **Analytics** 7/30/90j : revenue line chart, donut catégories, top plats, NPS sparkline + bands, **heatmap heure×jour**, sentiment + word cloud, funnel
- **Recommendation engine** co-occurrence dans le panier
- **Predictive maintenance** chambres à signaux multiples
- **Theme builder** live preview (couleurs, logo)
- **A/B tests** tracker avec variants + significativité
- **Audit log** typé (auth/mutation/config)
- **Email templates** éditables avec variables
- **Push scheduling** cron-style
- **Import CSV** menu + POIs en masse
- **PDF report** weekly (CA, NPS, top, alertes)
- **CRUD POI/menu** + drawer responses analytics
- **CSV exports** orders/surveys/POIs
- **Tenant switcher** dropdown topbar
- **Mode sombre** opt-in

### Côté backend
- **API Gateway** NestJS + http-proxy-middleware + Helmet + HSTS 1y preload + CORS dynamique + logs JSON
- **Multi-tenant** par discriminator MongoDB
- **JWT** 15 min + refresh-token rotation + Throttler 100/min
- **Webhooks** sortants HMAC-SHA256 sur events order.*
- **Search** regex Mongo sur POIs (`?q=`)
- **Soft-delete** sur POIs/menu
- **Healthz + readyz** sur chaque service
- **OpenAPI 3.0** Swagger UI agrégé sur `/api/docs`

---

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────────────┐
│                    5 INTERFACES TACTILES                 │
├──────────┬──────────┬──────────┬──────────┬─────────────┤
│  Lobby   │ Chambre  │  Smiley  │Réception │   Admin     │
│ Vue/Ion. │ Vue/Ion. │ Vue/Ion. │ Angular  │  Angular    │
└────┬─────┴────┬─────┴────┬─────┴────┬─────┴──────┬──────┘
     └──────────┴──────────┴──────────┴────────────┘
                          │
              ┌───────────▼───────────┐
              │   API Gateway (Nest)  │
              └───────────┬───────────┘
                          │
   ┌────────┬────────┬────┴───┬─────────┬──────────┬───────────┐
   ▼        ▼        ▼        ▼         ▼          ▼           ▼
 auth    tenant   content  orders    survey      notif      analytics
                          │                          │
                  ┌───────┴───────┬──────────────────┘
                  ▼               ▼
              MongoDB         Redis      RabbitMQ
```

Voir [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) pour le détail.

---

## 🚀 Démarrage rapide

### Prérequis
- Node.js ≥ 20
- pnpm ≥ 9 (`npm i -g pnpm`)
- Docker + Docker Compose

### Lancement local

```bash
# 1. Cloner & installer
git clone <repo>
cd concierge
pnpm install

# 2. Lancer Mongo + Redis
pnpm docker:up

# 3. Variables d'environnement
cp .env.example .env

# 4. Seed (données de démo : 2 hôtels, menus, surveys)
pnpm seed

# 5. Lancer tout en dev
pnpm dev
```

### URLs locales

| App | URL | Description |
|-----|-----|-------------|
| API Gateway | http://localhost:3000 | Toutes les API |
| Swagger Docs | http://localhost:3000/api/docs | Documentation OpenAPI |
| Borne Lobby | http://localhost:4100 | Table interactive lobby |
| Borne Smiley | http://localhost:4200 | Satisfaction check-out |
| Admin | http://localhost:4300 | Backoffice directeur |
| Réception | http://localhost:4400 | Écran temps réel |

### Comptes de démo

| Email | Mot de passe | Rôle | Hôtel |
|-------|--------------|------|-------|
| `admin@royal-lyon.fr` | `Demo2026!` | admin | Le Royal Lyon |
| `staff@royal-lyon.fr` | `Demo2026!` | staff | Le Royal Lyon |
| `admin@cote-azur.fr` | `Demo2026!` | admin | Côte d'Azur Resort |

---

## 📚 Documentation

**Production / hébergement** :
- [LIVE.md](./LIVE.md) — Index rapide de toutes les URLs prod
- [docs/HOSTING.md](./docs/HOSTING.md) — Carte complète de l'hébergement (Render, Vercel, Atlas, env vars, secrets)
- [docs/SERVICES.md](./docs/SERVICES.md) — Catalogue détaillé de chaque service et tous ses endpoints
- [docs/RUNBOOK.md](./docs/RUNBOOK.md) — Opérations courantes (réveil, redeploy, rotation secrets, troubleshooting)

**Conception** :
- [ARCHITECTURE.md](./ARCHITECTURE.md) — Stack complète + diagramme ASCII + responsabilités par couche
- [DECISIONS.md](./DECISIONS.md) — 17 ADRs (monorepo, multi-tenant, gateway, JWT, charts, no-AI, webhooks, design tokens, healthz partagé…)
- [docs/data-model.md](./docs/data-model.md) — Schémas collections MongoDB + DBML pour [dbdiagram.io](https://dbdiagram.io)
- [docs/postman.json](./docs/postman.json) — Collection Postman complète (health, public, auth, orders, surveys)
- [docs/demo-script.md](./docs/demo-script.md) — Parcours de démo 3:30 + réponses aux questions probables

---

## 🌐 Déploiement live

Référence à jour dans [LIVE.md](./LIVE.md). Résumé :

| Service                | URL                                                       | Hébergeur |
|------------------------|-----------------------------------------------------------|-----------|
| API Gateway            | https://concierge-gateway.onrender.com                    | Render    |
| Swagger Docs           | https://concierge-gateway.onrender.com/api/docs           | Render    |
| Landing publique       | https://concierge-mauve-nine.vercel.app                   | Vercel    |
| Lobby (Royal Lyon)     | https://concierge-lobby.vercel.app/?tenant=royal-lyon     | Vercel    |
| Lobby (Côte d'Azur)    | https://concierge-lobby.vercel.app/?tenant=cote-azur      | Vercel    |
| Smiley                 | https://concierge-smiley.vercel.app                       | Vercel    |
| Admin                  | https://concierge-admin-gamma.vercel.app                  | Vercel    |
| Réception              | https://concierge-reception.vercel.app                    | Vercel    |

---

## 🧪 Tests & qualité

```bash
pnpm test              # Tous les tests unitaires
pnpm --filter auth-service test     # Tests d'un service
cd e2e && pnpm test    # E2E Playwright (chromium + iPhone 13)
```

CI/CD via GitHub Actions :
- `.github/workflows/ci.yml` — lint + build + docker matrix sur chaque PR
- `.github/workflows/e2e.yml` — Playwright sur staging URLs
- `.github/workflows/lighthouse.yml` — perf/a11y/SEO budgets ≥ 0.8/0.9
- `.github/workflows/codeql.yml` — scan sécurité weekly + on-PR
- `.github/dependabot.yml` — bumps groupés (nest, angular, vue, types, eslint)
- `.husky/pre-commit` — prettier via lint-staged + type-check shared packages

---

## 🛠️ Stack technique

**Backend** : NestJS 10 · MongoDB 7 (Mongoose) · Socket.io · JWT + refresh rotation · Helmet + HSTS · Swagger 3.0 · Throttler · Webhooks HMAC-SHA256
**Frontends mobile/tactile** : Vue 3 · Ionic 7 · Vite · Pinia · vue-i18n (7 langues + RTL) · Leaflet · PWA Workbox
**Backoffice & Réception** : Angular 17 standalone · Signals · inline-SVG charts · Socket.io-client
**Packages partagés** : `@concierge/types` · `@concierge/nest-common` (HealthController, guards, middleware) · `@concierge/design-tokens` (couleurs, fonts, spacing)
**Infra** : Docker · docker-compose · pnpm workspaces · Render (backend) · Vercel (frontends) · MongoDB Atlas
**DX** : Playwright e2e · GitHub Actions (CI/E2E/Lighthouse/CodeQL/Dependabot) · Husky · lint-staged · Prettier

---

## 📄 Licence

Projet personnel à but de candidature. Code libre de réutilisation pour Dymension.

---

## 👤 Auteur

Réalisé pour candidater en **alternance Développeur Full Stack** chez Dymension.
Entretien : mercredi 13 mai 2026.
