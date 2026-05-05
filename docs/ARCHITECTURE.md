# 🏛️ Architecture — Concierge

## Vue d'ensemble

Concierge suit une architecture **microservices event-driven multi-tenant** :

```
┌─────────────────────────────────────────────────────────────┐
│                       UTILISATEURS                           │
│  Client hôtel │ Personnel │ Réception │ Directeur │ Super-admin│
└──────┬──────────────┬─────────┬─────────────┬──────────┬─────┘
       ▼              ▼         ▼             ▼          ▼
┌─────────────────────────────────────────────────────────────┐
│                    COUCHE PRESENTATION                       │
│  ┌─────────┐ ┌────────┐ ┌────────┐ ┌──────────┐ ┌────────┐ │
│  │ Lobby   │ │Chambre │ │Smiley  │ │Réception │ │ Admin  │ │
│  │Vue+Ionic│ │Vue+Ion.│ │Vue+Ion.│ │ Angular  │ │Angular │ │
│  └────┬────┘ └────┬───┘ └───┬────┘ └─────┬────┘ └───┬────┘ │
│       │PWA        │PWA      │PWA         │WS         │     │
└───────┼───────────┼─────────┼────────────┼───────────┼─────┘
        └───────────┴─────────┴────────────┴───────────┘
                              │ HTTPS + JWT
                  ┌───────────▼───────────┐
                  │    API GATEWAY        │  ← rate limit, JWT, CORS, swagger
                  │    (NestJS)           │
                  └───────────┬───────────┘
                              │
┌─────────────────────────────┼─────────────────────────────────┐
│                  COUCHE MICROSERVICES                          │
│  ┌──────┐ ┌──────┐ ┌──────┐ ┌──────┐ ┌──────┐ ┌──────┐ ┌────┐│
│  │auth  │ │tenant│ │contn.│ │order │ │survey│ │notif │ │anal││
│  │  svc │ │ svc  │ │ svc  │ │ svc  │ │ svc  │ │ svc  │ │svc ││
│  └───┬──┘ └───┬──┘ └───┬──┘ └───┬──┘ └───┬──┘ └───┬──┘ └─┬──┘│
└──────┼────────┼────────┼────────┼────────┼────────┼──────┼───┘
       │        │        │        │        │        │      │
       └────────┴────────┴────────┴────────┴────────┴──────┘
                              │
       ┌──────────────────────┼──────────────────────┐
       ▼                      ▼                      ▼
   ┌────────┐            ┌────────┐             ┌─────────┐
   │MongoDB │            │ Redis  │             │RabbitMQ │
   │7 (rep.)│            │(cache+ │             │ (events)│
   │        │            │sessions│             │         │
   └────────┘            └────────┘             └─────────┘
```

---

## Multi-tenant

### Stratégie : **discriminateur Mongo + JWT claim**

Chaque document Mongo embarque un champ `tenantId`. Toutes les requêtes Mongoose sont filtrées automatiquement via un **middleware de scope tenant**.

```typescript
// Exemple de middleware Mongoose
schema.pre(/^find/, function(next) {
  const tenantId = AsyncLocalStorage.get('tenantId');
  if (tenantId) {
    this.where({ tenantId });
  }
  next();
});
```

Le `tenantId` est :
1. Mis dans le JWT lors du login
2. Extrait par un middleware NestJS (`TenantInterceptor`)
3. Propagé via `AsyncLocalStorage` (équiv. à un `RequestContext`)
4. Appliqué automatiquement par les modèles Mongoose

### Avantages
- **Isolation forte** : impossible pour un hôtel A de voir les données de B
- **Mono-déploiement** : un seul cluster, N tenants
- **Branding par tenant** : `Tenant.theme` (couleurs, logo, polices)

---

## Authentification & Autorisation

### Flux JWT
```
Client                  API Gateway              auth-service
  │                          │                       │
  │ POST /auth/login         │                       │
  ├─────────────────────────>│                       │
  │                          │ POST /login           │
  │                          ├──────────────────────>│
  │                          │                       │ vérifie hash
  │                          │ {access, refresh}     │ génère JWT
  │                          │<──────────────────────│
  │ {accessToken, refresh}   │                       │
  │<─────────────────────────│                       │
  │                          │                       │
  │ GET /content/pages       │                       │
  │ Authorization: Bearer .. │                       │
  ├─────────────────────────>│ valide JWT            │
  │                          │ extrait tenantId+role │
  │                          │ inject AsyncLS        │
  │                          │ proxy vers content-svc│
  │                          ├──────────────────────>│ content-svc
  │                          │                       │
```

### Rôles (RBAC)
- `superadmin` — gère tous les tenants
- `admin` — gère son hôtel (CRUD complet)
- `staff` — voit les commandes, change leur état
- `guest` — utilisateur kiosque (pas d'auth, JWT court anonyme par tenant)

---

## Communication inter-services

### Synchrone (HTTP REST)
- API Gateway → microservices : pour les flux applicatifs (CRUD)
- Auth via header `X-Internal-Key` (machine-to-machine)

### Asynchrone (RabbitMQ)
Les événements métier circulent via une fanout exchange :

| Event | Émis par | Consommé par |
|-------|----------|--------------|
| `order.created` | orders-svc | notification-svc, analytics-svc |
| `order.statusChanged` | orders-svc | notification-svc |
| `survey.submitted` | survey-svc | notification-svc, analytics-svc |
| `tenant.created` | tenant-svc | content-svc (création contenu de base) |

---

## Real-time (WebSocket)

Le `notification-service` expose un endpoint Socket.io. Les écrans Réception et Admin se connectent et rejoignent la room `tenant:{id}` :

```typescript
// Côté serveur
socket.on('connection', (s) => {
  const { tenantId, role } = verifyJWT(s.handshake.auth.token);
  s.join(`tenant:${tenantId}`);
  if (role === 'staff') s.join(`tenant:${tenantId}:staff`);
});

// À chaque event RabbitMQ
io.to(`tenant:${tenantId}:staff`).emit('order:new', order);
```

---

## Data Model (Mongo)

### Collections principales

```typescript
// Tenant
{
  _id: ObjectId,
  slug: 'royal-lyon',
  name: 'Le Royal Lyon',
  theme: { primaryColor, logo, font },
  locales: ['fr', 'en'],
  contact: { phone, email, address },
  features: ['lobby', 'rooms', 'smiley'],
  createdAt
}

// User
{
  tenantId, email, passwordHash, role,
  firstName, lastName, locale,
  refreshTokens: [{ token, expiresAt, deviceId }],
}

// ContentPage (KioskInfo)
{
  tenantId, slug, type: 'home'|'services'|'map'|'menu',
  title: { fr, en, de },
  blocks: [
    { type: 'hero', payload: {...} },
    { type: 'cards', payload: {...} },
    { type: 'map', payload: { pois: [...] } },
  ],
  order, published, version,
}

// POI (point d'intérêt sur la carte)
{
  tenantId, name: { fr, en }, category, lat, lng,
  description, photo, distance, rating, hours,
}

// Order (room service / spa / taxi)
{
  tenantId, room, items: [{...}],
  total, status: 'pending'|'accepted'|'preparing'|'delivered'|'cancelled',
  guestName, locale, createdAt, statusHistory: [...],
}

// Survey
{
  tenantId, slug, title, locale,
  questions: [
    { id, type: 'smiley'|'nps'|'mcq'|'text'|'date',
      label: { fr, en }, required, options }
  ],
  publishedAt, expiresAt, branding,
}

// SurveyResponse
{
  tenantId, surveyId, locale, completedAt,
  answers: [{ questionId, value }],
  metadata: { device, room, orderId },
}
```

### Indexes critiques
```js
db.users.createIndex({ tenantId: 1, email: 1 }, { unique: true });
db.orders.createIndex({ tenantId: 1, status: 1, createdAt: -1 });
db.surveyResponses.createIndex({ tenantId: 1, surveyId: 1, completedAt: -1 });
db.contentPages.createIndex({ tenantId: 1, slug: 1 }, { unique: true });
```

---

## Sécurité

| Couche | Mesure |
|--------|--------|
| Transport | HTTPS partout (TLS 1.3) |
| Auth | JWT access (15min) + refresh (7j, rotation) |
| Mot de passe | bcrypt cost 12 |
| Headers | helmet (CSP, HSTS, X-Frame-Options) |
| CORS | whitelist stricte |
| Rate limit | `@nestjs/throttler` (100 req/min/IP) |
| Input | class-validator + DTOs stricts |
| Secrets | `.env` + Render secret manager |
| Internal | header `X-Internal-Key` entre services |
| MongoDB | filtrage tenant systématique (impossible à bypass) |

---

## Performance & Scalabilité

- **Cache Redis** sur les routes lecture (content, POI, surveys publiés)
- **Aggregation pipelines** Mongo pour les KPIs (pas de N+1)
- **CDN Vercel** pour les frontends (cache statique global)
- **Code splitting** Vite/Angular (lazy routes)
- **Service workers** pour les PWA (cache stratégies)
- **Compression Brotli** sur les API responses

---

## Observabilité

- **Logs structurés JSON** (pino)
- **Health endpoints** `/health` sur chaque service
- **Métriques Prometheus** (compteurs requêtes, latence p95)
- **Tracing** : header `X-Request-Id` propagé entre services
- **Dashboard Grafana** (en bonus si temps)

---

## Décisions d'architecture (ADR rapides)

### ADR-001 : pnpm workspaces plutôt que Nx
**Pourquoi** : moins de complexité pour un projet de 7 jours, suffisant pour partager les types et orchestrer.

### ADR-002 : MongoDB plutôt que PostgreSQL
**Pourquoi** : la fiche de poste mentionne explicitement MongoDB. Aussi adapté au schéma flexible des `ContentPage`.

### ADR-003 : Vue/Ionic pour les bornes, Angular pour le back-office
**Pourquoi** : la fiche de poste sépare ces deux usages dans le même sens.

### ADR-004 : RabbitMQ plutôt que Kafka
**Pourquoi** : volumes faibles, RabbitMQ est plus simple à déployer en docker-compose. Kafka serait overkill.

### ADR-005 : JWT plutôt que sessions cookies
**Pourquoi** : permet l'usage cross-domain (Vercel frontend ↔ Render backend) sans pénibilité CORS.

---

*Document vivant — mis à jour à chaque décision technique.*
