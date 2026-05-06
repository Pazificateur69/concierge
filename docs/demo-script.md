# Demo script — entretien Dymension (13 mai 2026)

Ce document décrit un parcours de démo en 3 minutes pour l'entretien.

## Setup avant l'appel

1. Ouvrir 5 onglets dans cet ordre :
   - `https://concierge-portal.vercel.app` (landing)
   - `https://concierge-lobby.vercel.app/?tenant=royal-lyon` (borne)
   - `https://concierge-smiley.vercel.app/?tenant=royal-lyon&survey=satisfaction-checkout` (smiley)
   - `https://concierge-admin-gamma.vercel.app` — login `admin@royal-lyon.fr` / `Demo2026!`
   - `https://concierge-reception.vercel.app` — login `staff@royal-lyon.fr` / `Demo2026!`
2. Ping `https://concierge-api-gateway.onrender.com/healthz` pour réveiller le backend.
3. Avoir le READMEs ouvert dans VSCode comme support visuel.

## Parcours suggéré (3 min 30)

### 0:00 — Portal (15s)
> "J'ai unifié les trois produits Dymension — KioskInfo, Delyss et Expressyon — dans une seule plateforme, déployée en production sur Vercel et Render."

- Scroll lent vers le bas, montrer les compteurs live.
- Pointer multi-tenant compare : Royal Lyon + Negresco partagent le même code, données isolées par discriminator MongoDB.

### 0:30 — Lobby kiosk (45s)
> "Côté client, voici la borne tactile installée dans le lobby. Vue 3 + Ionic, sept langues dont l'arabe en RTL, mode nuit auto, économiseur d'écran."

- Cliquer Restaurant → ajouter un plat → montrer panier persistant
- Retourner Home → cliquer la visite virtuelle 360°
- Switcher en arabe pour montrer le RTL
- Cliquer concierge chat → poser une question (ex. "spa") → montrer les chips de navigation

### 1:15 — Smiley (20s)
> "À la sortie, le client laisse un retour sur cette borne. Logique conditionnelle : si la note est faible, on lui demande pourquoi."

- Cliquer face 4 → NPS → texte → soumettre
- Sur l'écran de remerciement, montrer le multi-survey switcher

### 1:35 — Reception (45s)
> "Côté staff, le tableau Kanban temps réel — Angular signals + Socket.io. Drag-and-drop entre colonnes, raccourcis clavier, ticket cuisine imprimable."

- Si possible, depuis le lobby ouvrir une commande pour qu'elle apparaisse en live (confettis quand livrée)
- Cliquer une commande → montrer Gantt timeline + plan d'étage avec position chambre
- Appuyer `?` pour montrer raccourcis

### 2:20 — Admin (60s)
> "Côté gestion, le backoffice multi-tenant. Analytics complet, recommandation engine, predictive maintenance."

- Ouvrir Analytics : revenue 30j, donut catégories, heatmap heure×jour, sentiment word-cloud, funnel
- Scroller vers reco engine + chambres à risque
- Aller dans Settings → Theme builder : changer la couleur or live → voir l'aperçu réagir
- Settings → A/B tests : montrer expérience "cta-color" en cours

### 3:20 — Architecture (10s)
> "Le tout sur 5 microservices NestJS derrière un API gateway, multi-tenant via discriminator MongoDB, avec health checks, OpenAPI sur tous les services. Le détail est dans ARCHITECTURE.md et DECISIONS.md (11 ADRs) sur le repo GitHub."

## Questions probables — réponses préparées

**"Pourquoi Angular ET Vue ?"**
La fiche de poste liste les deux. Différencier permet de démontrer la maîtrise. Angular signals sont parfaits pour des dashboards form-heavy, Vue+Ionic excelle sur des bornes touch-first avec animations. ADR-004.

**"Pourquoi pas de cloud-managed gateway (Kong, Apigee) ?"**
Cost & overhead à ce stade. http-proxy-middleware dans NestJS me permet d'injecter des middlewares Express custom (logs JSON, helmet, CORS, healthz) sans tax. Si on scale, Kong devient la cible. ADR-003.

**"Comment vous isolez les tenants ?"**
Discriminator `tenantId` sur toutes les collections + `TenantMiddleware` qui injecte le contexte dans chaque requête authentifiée. Chaque service ajoute systématiquement `{ tenantId }` au filtre Mongo. ADR-002.

**"Sécurité ?"**
Helmet + HSTS preload, CORS dynamique (origin renvoyé), JWT 15 min + refresh rotation, ThrottlerModule sur auth, validation pipe global. RGPD : endpoint d'anonymisation et export CSV depuis admin.

**"Où est l'IA ?"**
Pas encore — j'ai préféré démontrer les fundamentals d'archi. Mais le concierge chat, le sentiment et le scoring sont prêts à être branchés sur Claude (system prompt + streaming + tool use). Je pourrais le présenter en détail si vous voulez.

**"Qu'est-ce que vous referiez différemment ?"**
- Coder-split le bundle lobby plus tôt (245 kB gzip avec Leaflet, lourd)
- Storybook pour les composants partagés entre Vue et Angular (tokens partagés via `packages/design-tokens` mais composants dupliqués)
- Mettre Sentry en place dès le début, pas en stub

## Liens à mentionner

- **Repo** : `https://github.com/Pazificateur69/concierge`
- **README** : pitch + features
- **ARCHITECTURE.md** : diagramme stack + responsabilités
- **DECISIONS.md** : 11 ADRs justifiant les choix techniques
- **Postman collection** : `docs/postman.json`
- **Data model** : `docs/data-model.md` (DBML pour dbdiagram.io)
