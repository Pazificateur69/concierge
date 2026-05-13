# Services — catalogue détaillé

État réel au 2026-05-13. Chaque service ci-dessous est déployé en production. Pour les URLs et l'hébergement → [`HOSTING.md`](./HOSTING.md).

Toutes les routes sont **accessibles via le gateway public** `https://concierge-gateway.onrender.com`. Les URLs `*.onrender.com` directes existent mais ne devraient pas être appelées par les frontends (le gateway gère CORS, auth fallback, et la documentation).

## Légende auth

- 🌐 **public** — aucun token requis
- 🔑 **jwt** — `Authorization: Bearer <accessToken>` requis
- 🔒 **role** — JWT + rôle spécifique (admin, staff, superadmin)

---

## 0. api-gateway

NestJS + `http-proxy-middleware`. Point d'entrée unique. Source : `apps/api-gateway/`.

### Rôles
1. Proxy HTTP vers les 4 microservices avals (`/tenants`, `/content`, `/orders`, `/surveys`)
2. Proxy WebSocket (`/socket.io`) vers `orders-service`
3. CORS uniforme (origine reflétée, credentials autorisés)
4. **Auth fallback** : `/auth/*` est servi par le gateway lui-même (et non proxifié vers `auth-service`) car `auth-service` dort sur Render free. Le gateway signe les JWT avec le **même** `JWT_SECRET`.
5. Swagger UI sur `/api/docs`
6. Logs structurés JSON par requête

### Endpoints propres au gateway

| Méthode | Path           | Auth | Description                                            |
|---------|----------------|------|--------------------------------------------------------|
| GET     | `/healthz`     | 🌐   | Liveness                                               |
| GET     | `/api/docs`    | 🌐   | Swagger UI                                             |
| POST    | `/auth/login`  | 🌐   | Connexion (comptes démo hardcodés) → `{accessToken, refreshToken}` |
| POST    | `/auth/refresh`| 🌐   | Nouveau access token depuis refresh                    |
| POST    | `/auth/logout` | 🔑   | Invalide la session (no-op : JWT stateless)            |
| GET     | `/auth/me`     | 🔑   | Profil utilisateur courant                             |

### Routes proxifiées

| Préfixe       | Upstream                                  | Réécriture                  |
|---------------|-------------------------------------------|-----------------------------|
| `/tenants/*`  | `https://concierge-tenant.onrender.com`   | préserve le préfixe         |
| `/content/*`  | `https://concierge-content.onrender.com`  | préserve le préfixe         |
| `/orders/*`   | `https://concierge-orders.onrender.com`   | préserve le préfixe         |
| `/surveys/*`  | `https://concierge-survey.onrender.com`   | préserve le préfixe         |
| `/socket.io/*`| `https://concierge-orders.onrender.com`   | préserve `/socket.io`       |

---

## 1. auth-service

> **Statut prod** : déployé mais **non sollicité**. Le gateway sert `/auth/*` lui-même via fallback. Si jamais on veut réactiver, il suffit d'ajouter `/auth` dans `setupProxies` (voir `apps/api-gateway/src/proxy.ts:38`).

Source : `services/auth-service/`. Stack : NestJS + Mongoose + Passport JWT + bcrypt.

Routes (préfixe global : aucun) :

| Méthode | Path        | Auth | Description                                 |
|---------|-------------|------|---------------------------------------------|
| POST    | `/register` | 🌐   | Création de compte (hashage bcrypt)         |
| POST    | `/login`    | 🌐   | Vérifie mot de passe → JWT access + refresh |
| POST    | `/refresh`  | 🌐   | Nouveau access depuis refresh               |
| POST    | `/logout`   | 🔑   | No-op (JWT stateless)                       |
| GET     | `/me`       | 🔑   | Profil utilisateur                          |
| GET     | `/health`   | 🌐   | Liveness                                    |

---

## 2. tenant-service

Source : `services/tenant-service/`. **Préfixe global : `/tenants`**.

| Méthode | Path                | Auth          | Description                                       |
|---------|---------------------|---------------|---------------------------------------------------|
| GET     | `/tenants/directory`| 🌐            | Liste publique (slug + name + theme + locales)    |
| GET     | `/tenants/:slug`    | 🌐            | Détail public d'un tenant par slug                |
| GET     | `/tenants`          | 🔒 superadmin | Liste complète                                    |
| POST    | `/tenants`          | 🔒 superadmin | Créer un tenant                                   |
| PATCH   | `/tenants/:id`      | 🔒 admin      | Mise à jour                                       |

Modèle : voir [`data-model.md`](./data-model.md).

---

## 3. content-service

Source : `services/content-service/`. **Préfixe global : `/content`**. Deux ressources : `pages` (CMS) et `pois` (Points of Interest).

### Pages

| Méthode | Path                          | Auth     | Description                          |
|---------|-------------------------------|----------|--------------------------------------|
| GET     | `/content/pages?tenantId=…`   | 🌐       | Lister les pages d'un tenant         |
| GET     | `/content/pages/:slug?tenantId=…` | 🌐   | Détail d'une page (par slug)         |
| POST    | `/content/pages?tenantId=…`   | 🔒 admin | Créer une page                       |
| PATCH   | `/content/pages/:id?tenantId=…` | 🔒 admin| Mise à jour                          |
| DELETE  | `/content/pages/:id?tenantId=…` | 🔒 admin| Suppression                          |

### POIs

| Méthode | Path                                        | Auth     | Description                                 |
|---------|---------------------------------------------|----------|---------------------------------------------|
| GET     | `/content/pois?tenantId=…&category=…&q=…`   | 🌐       | Liste avec filtres + recherche full-text    |
| POST    | `/content/pois?tenantId=…`                  | 🔒 admin | Créer                                       |
| PATCH   | `/content/pois/:id?tenantId=…`              | 🔒 admin | Mise à jour                                 |
| DELETE  | `/content/pois/:id?tenantId=…`              | 🔒 admin | Suppression                                 |

Catégories de POI : `restaurant`, `bar`, `monument`, `shopping`, `transport`, `service`, `entertainment` (cf. `@concierge/types`).

---

## 4. orders-service

Source : `services/orders-service/`. **Préfixe global : `/orders`**. Deux ressources : `orders` (commandes) et `menu` (items disponibles). **Héberge aussi la WebSocket Gateway** (namespace `/concierge`, transport `/socket.io`).

### Orders

| Méthode | Path                          | Auth         | Description                                  |
|---------|-------------------------------|--------------|----------------------------------------------|
| POST    | `/orders`                     | 🌐           | Créer (client lobby/chambre). Champ `source` requis (`kiosk`, `tablet`, `reception`) |
| GET     | `/orders?status=…&room=…`     | 🔑 staff/admin | Liste filtrée (tenant scoped par JWT)      |
| GET     | `/orders/:id`                 | 🔑           | Détail                                       |
| PATCH   | `/orders/:id/status`          | 🔑 staff/admin | Changement de statut : `pending` → `accepted` → `preparing` → `delivered` (ou `cancelled`) |
| GET     | `/orders/public-stats?tenantId=…`| 🌐         | Compteur pour affichage public               |

### Menu

| Méthode | Path                                                       | Auth     | Description           |
|---------|------------------------------------------------------------|----------|-----------------------|
| GET     | `/orders/menu?tenantId=…&category=…&available=all`         | 🌐       | Liste items du menu   |
| POST    | `/orders/menu?tenantId=…`                                  | 🔒 admin | Créer un item         |
| PATCH   | `/orders/menu/:id?tenantId=…`                              | 🔒 admin | Mise à jour           |
| DELETE  | `/orders/menu/:id?tenantId=…`                              | 🔒 admin | Suppression           |

Catégories menu : `food`, `drink`, `spa`, `housekeeping`, `taxi`, `wakeup`.

### WebSocket — namespace `/concierge`

Auth handshake : `auth: { token: <accessToken> }` ou header `Authorization: Bearer …`.

Le serveur fait rejoindre 2 rooms automatiques :
- `tenant:<tenantId>` — pour tous les clients du tenant
- `tenant:<tenantId>:staff` — uniquement pour les rôles `staff`/`admin`

| Évènement      | Payload          | Émis quand                                |
|----------------|------------------|-------------------------------------------|
| `connected`    | `{tenantId, rooms}` | Handshake JWT validé                   |
| `order:new`    | `Order`          | Une nouvelle commande est créée            |
| `order:updated`| `Order`          | Le statut d'une commande change            |

Réception (Angular) connecte à `${gateway}/concierge` qui est en fait l'URL gateway + le namespace `/concierge`. Le gateway proxifie `/socket.io/*` vers `orders-service` qui héberge le `WebSocketGateway`.

---

## 5. survey-service

Source : `services/survey-service/`. **Préfixe global : `/surveys`**. Deux ressources : `surveys` (définitions) et `responses` (réponses agrégées + stats).

### Surveys

| Méthode | Path                                | Auth     | Description                                    |
|---------|-------------------------------------|----------|------------------------------------------------|
| GET     | `/surveys/:slug?tenantId=…`         | 🌐       | Récupérer pour affichage borne smiley          |
| GET     | `/surveys`                          | 🔒 admin | Liste tenant scoped par JWT                    |
| POST    | `/surveys`                          | 🔒 admin | Créer (tenantId injecté depuis JWT)            |
| PATCH   | `/surveys/:id`                      | 🔒 admin | Mise à jour                                    |

Slugs actuellement seedés (chaque tenant) :
- `satisfaction-checkout`
- `satisfaction-breakfast`
- `satisfaction-spa`

### Responses

| Méthode | Path                                        | Auth     | Description                                       |
|---------|---------------------------------------------|----------|---------------------------------------------------|
| POST    | `/surveys/:slug/responses?tenantId=…`       | 🌐       | Soumettre une réponse smiley/NPS/text             |
| GET     | `/surveys/:surveyId/responses`              | 🔒 admin | Liste des réponses brutes                         |
| GET     | `/surveys/:surveyId/stats`                  | 🔒 admin | Aggregats : `total`, `bySmiley[]`, `averageScore`, `byDay[]`, NPS |

---

## Patterns transverses

### Multi-tenancy
- **Frontends** : passent le `tenantId` en query param sur les routes publiques (`?tenantId=…`).
- **Routes JWT** : le `tenantId` est extrait du payload JWT côté service, pas du query param. Empêche un admin de scanner un autre tenant.
- **WS** : le `tenantId` est extrait du JWT au handshake, le client rejoint des rooms scoped tenant.

### CORS
Géré au niveau gateway (origine reflétée). Les microservices upstream peuvent renvoyer leurs propres headers — le gateway les écrase pour garantir cohérence.

### Validation
Tous les services utilisent `ValidationPipe({ transform: true })` côté Nest. Les DTOs sont décorés avec `class-validator`.

### Healthcheck
Chaque service expose `/health` (controller `HealthController` partagé via `@concierge/nest-common`). Le gateway expose `/healthz`. Le `render.yaml` déclare des paths plus précis qui ne matchent pas toujours — sans impact fonctionnel (voir `HOSTING.md`).
