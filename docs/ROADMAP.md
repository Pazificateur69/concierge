# 🗺️ Roadmap

## Phase 1 — MVP démontrable (objectif : entretien 13 mai 2026)

### ✅ Setup
- [x] Monorepo pnpm
- [x] Documentation complète
- [x] Docker Compose (Mongo, Redis)
- [x] CI/CD GitHub Actions

### 🔨 Backend
- [ ] auth-service (JWT, refresh, multi-tenant, RBAC)
- [ ] tenant-service (CRUD, branding)
- [ ] content-service (pages CMS, POI)
- [ ] orders-service (room service, state machine)
- [ ] survey-service (Expressyon-like)
- [ ] notification-service (WebSocket)
- [ ] analytics-service (KPIs)
- [ ] API Gateway
- [ ] Swagger sur tous les services
- [ ] Tests unitaires services critiques

### 🎨 Frontends
- [ ] Lobby kiosk Vue/Ionic
  - [ ] Multi-langues (FR/EN/DE/ES/JP)
  - [ ] Carte Leaflet POI
  - [ ] Mode accessibilité vocale
  - [ ] PWA offline
  - [ ] Mode kiosque sécurisé
- [ ] Smiley Vue/Ionic
  - [ ] Survey runner dynamique
  - [ ] Logique conditionnelle (showIf)
  - [ ] PWA offline avec sync
- [ ] Admin Angular
  - [ ] Login + multi-tenant
  - [ ] CMS pages (drag-drop blocs)
  - [ ] Survey builder
  - [ ] Dashboard analytics
- [ ] Réception Angular
  - [ ] Kanban orders temps réel
  - [ ] Sons + notifications
  - [ ] Drag-drop entre statuts

### 🚢 Deploy
- [ ] MongoDB Atlas
- [ ] Render (backend)
- [ ] Vercel (frontends)
- [ ] Domaines custom

---

## Phase 2 — Si le temps le permet

- [ ] Tablette chambre (deuxième frontend Vue/Ionic)
- [ ] WebRTC visio entre tablette chambre et réception
- [ ] AI suggestions (resto local selon préférences) avec Claude API
- [ ] NFC/QR pour login chambre
- [ ] Stripe paiement room service
- [ ] Dark mode automatique selon l'heure
- [ ] Capacitor pour build natif iOS/Android

---

## Phase 3 — Si je suis pris

(à co-construire avec l'équipe Dymension)

- [ ] Intégration avec leurs vraies bornes physiques
- [ ] Migration données depuis KioskInfo/Delyss/Expressyon
- [ ] Mobile companion app (client hôtel)
- [ ] API publique pour intégrations PMS (Property Management Systems)
- [ ] Module conformité RGPD complet
- [ ] Tests d'accessibilité WCAG 2.2 AA

---

## Limites connues du MVP

- Pas de paiement réel (Stripe en test mode si bonus)
- Pas de vraie intégration PMS hôtelier (mock)
- Mode hors-ligne partiel (cache contenu, queue commandes — pas surveys complexes)
- Tests E2E uniquement sur le flow critique
- Monitoring basique (logs uniquement)

---

*Mis à jour : 2026-05-05.*
