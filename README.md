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

## ✨ Fonctionnalités clés

- 🎙️ **Mode accessibilité vocale** (Web Speech API) — lit le contenu à voix haute
- 🌍 **Multi-langues** dynamique (FR/EN/DE/ES/JP)
- 📡 **PWA offline-first** — les commandes passent même sans wifi
- 🗺️ **Carte interactive Leaflet** des points d'intérêt autour de l'hôtel
- ⚡ **WebSocket temps réel** entre tablette client → réception
- 🏢 **Multi-tenant** — un seul déploiement, N hôtels, branding par hôtel
- 🎨 **CMS sans-code** pour le directeur (édition WYSIWYG)
- 📋 **Survey builder dynamique** (smiley/NPS/QCM/texte)
- 📲 **QR code chambre** → personnalisation auto
- 🔒 **Mode kiosque sécurisé** (plein écran, gestes désactivés)

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

- 📖 [WHY.md](docs/WHY.md) — Pourquoi ce projet (analyse Dymension)
- 🏛️ [ARCHITECTURE.md](docs/ARCHITECTURE.md) — Architecture détaillée
- 🔌 [API.md](docs/API.md) — Référence API
- 🚢 [DEPLOYMENT.md](docs/DEPLOYMENT.md) — Déploiement Vercel + Render
- 🤝 [CONTRIBUTING.md](docs/CONTRIBUTING.md) — Conventions de code
- 🗺️ [ROADMAP.md](docs/ROADMAP.md) — Évolutions prévues
- 🎨 [DESIGN.md](docs/DESIGN.md) — Choix UI/UX

---

## 🌐 Déploiement live

| Service | URL | Hébergeur |
|---------|-----|-----------|
| API Gateway | `https://concierge-api.onrender.com` | Render |
| Borne Lobby (Royal Lyon) | `https://concierge-lobby.vercel.app/?tenant=royal-lyon` | Vercel |
| Borne Lobby (Côte d'Azur) | `https://concierge-lobby.vercel.app/?tenant=cote-azur` | Vercel |
| Smiley | `https://concierge-smiley.vercel.app` | Vercel |
| Admin | `https://concierge-admin.vercel.app` | Vercel |
| Réception | `https://concierge-reception.vercel.app` | Vercel |

---

## 🧪 Tests

```bash
pnpm test              # Tous les tests
pnpm --filter auth-service test     # Tests d'un service
pnpm --filter lobby-kiosk test:e2e  # E2E Cypress
```

---

## 🛠️ Stack technique

**Backend** : NestJS 10 · MongoDB 7 (Mongoose) · Redis · RabbitMQ · Socket.io · JWT · Swagger
**Frontends mobile/tactile** : Vue 3 · Ionic 7 · Vite · vue-i18n · Leaflet · PWA Workbox
**Backoffice & Réception** : Angular 17 · Angular Material · ngx-charts · Socket.io-client
**Infra** : Docker · docker-compose · GitHub Actions · pnpm workspaces
**Déploiement** : Vercel (frontends) · Render (backend) · MongoDB Atlas

---

## 📄 Licence

Projet personnel à but de candidature. Code libre de réutilisation pour Dymension.

---

## 👤 Auteur

Réalisé pour candidater en **alternance Développeur Full Stack** chez Dymension.
Entretien : mercredi 13 mai 2026.
