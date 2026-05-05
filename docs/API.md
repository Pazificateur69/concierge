# 🔌 API — Référence

> Toutes les routes passent par l'**API Gateway** (`http://localhost:3000` en dev).
> Documentation interactive Swagger : `/api/docs`.

---

## Conventions

- **Auth** : `Authorization: Bearer <accessToken>` sauf endpoints publics
- **Tenant** : extrait du JWT, ou via header `X-Tenant-Slug` pour les routes publiques
- **Format** : JSON UTF-8
- **Erreurs** : HTTP status + `{ statusCode, message, error }`
- **Pagination** : `?page=1&limit=20`, response `{ items, total, page, pages }`
- **Locale** : header `Accept-Language: fr` ou query `?lang=fr`

---

## 🔐 auth-service

### POST `/auth/register`
Crée un compte utilisateur (admin uniquement).

```json
// Body
{
  "tenantId": "...",
  "email": "user@hotel.fr",
  "password": "Demo2026!",
  "firstName": "Marie",
  "lastName": "Dupont",
  "role": "staff"
}

// 201
{ "id": "...", "email": "...", "role": "..." }
```

### POST `/auth/login`
```json
// Body
{ "email": "admin@royal-lyon.fr", "password": "Demo2026!" }

// 200
{
  "accessToken": "eyJ...",
  "refreshToken": "eyJ...",
  "user": { "id", "email", "role", "tenantId", "firstName" }
}
```

### POST `/auth/refresh`
```json
{ "refreshToken": "eyJ..." }
```

### POST `/auth/logout`
Invalide le refresh token.

### GET `/auth/me`
Retourne l'utilisateur courant.

---

## 🏢 tenant-service

### GET `/tenants/:slug`
Retourne les infos publiques d'un tenant (nom, theme, locales). Utilisé par les frontends pour le branding.

```json
{
  "id": "...",
  "slug": "royal-lyon",
  "name": "Le Royal Lyon",
  "theme": { "primaryColor": "#1a4d8c", "logo": "...", "font": "Playfair" },
  "locales": ["fr", "en", "de"],
  "features": ["lobby", "rooms", "smiley"]
}
```

### POST `/tenants` (superadmin)
Crée un nouvel hôtel.

### PATCH `/tenants/:id` (admin du tenant)
Met à jour le branding/locales/features.

---

## 📄 content-service (KioskInfo)

### GET `/content/pages`
Liste les pages publiées du tenant courant.

### GET `/content/pages/:slug?lang=fr`
Retourne une page avec ses blocs traduits dans la langue demandée.

```json
{
  "id": "...",
  "slug": "home",
  "title": "Bienvenue au Royal Lyon",
  "blocks": [
    { "type": "hero", "payload": { "image": "...", "headline": "..." } },
    { "type": "cards", "payload": { "items": [...] } },
    { "type": "map", "payload": { "center": [45.76, 4.83], "zoom": 14 } }
  ]
}
```

### POST `/content/pages` (admin)
Crée une page.

### PATCH `/content/pages/:id` (admin)
Met à jour une page.

### GET `/content/pois?category=restaurant&radius=2`
Retourne les points d'intérêt autour de l'hôtel.

```json
{
  "items": [
    {
      "id": "...",
      "name": "Bouchon Lyonnais",
      "category": "restaurant",
      "lat": 45.762, "lng": 4.835,
      "rating": 4.5, "distance": 0.4,
      "photo": "..."
    }
  ]
}
```

---

## 🍽️ orders-service (Delyss)

### GET `/orders` (staff/admin)
Liste des commandes du tenant, filtrable par status.

`?status=pending&room=204`

### POST `/orders` (kiosque ou tablette chambre)
Crée une commande.

```json
{
  "room": "204",
  "guestName": "M. Dupont",
  "items": [
    { "menuItemId": "...", "quantity": 2, "options": ["sans-gluten"], "notes": "" }
  ],
  "locale": "fr"
}
```

### PATCH `/orders/:id/status` (staff)
```json
{ "status": "accepted" }  // pending → accepted → preparing → delivered
```

### GET `/orders/menu`
Retourne le menu room service du tenant.

---

## 📋 survey-service (Expressyon)

### GET `/surveys/:slug?lang=fr`
Retourne une enquête publique (utilisée par la borne smiley).

```json
{
  "id": "...",
  "slug": "satisfaction-checkout",
  "title": "Votre séjour",
  "questions": [
    {
      "id": "q1",
      "type": "smiley",
      "label": "Comment évaluez-vous votre séjour ?",
      "options": [
        { "value": 1, "icon": "😡" },
        { "value": 2, "icon": "😐" },
        { "value": 3, "icon": "🙂" },
        { "value": 4, "icon": "😍" }
      ],
      "required": true
    },
    {
      "id": "q2",
      "type": "text",
      "label": "Un commentaire ?",
      "required": false,
      "showIf": { "questionId": "q1", "operator": "lte", "value": 2 }
    }
  ]
}
```

### POST `/surveys/:slug/responses`
Soumet une réponse (anonyme).

```json
{
  "answers": [
    { "questionId": "q1", "value": 4 },
    { "questionId": "q2", "value": "Super accueil" }
  ],
  "metadata": { "room": "204", "device": "kiosk-checkout" },
  "locale": "fr"
}
```

### POST `/surveys` (admin)
Crée un sondage.

### GET `/surveys/:id/responses?from=...&to=...` (admin)
Récupère les réponses pour analyse.

### GET `/surveys/:id/stats` (admin)
KPIs agrégés (NPS, distribution, série temporelle).

---

## 🔔 notification-service (WebSocket)

### Connexion
```javascript
const socket = io('ws://localhost:3005', {
  auth: { token: accessToken }
});
```

### Events serveur → client
| Event | Payload | Émis vers |
|-------|---------|-----------|
| `order:new` | `Order` | room `tenant:{id}:staff` |
| `order:updated` | `Order` | room `tenant:{id}:staff` |
| `survey:submitted` | `{ surveyId, score }` | room `tenant:{id}:admin` |

### Events client → serveur
| Event | Payload | Effet |
|-------|---------|-------|
| `order:ack` | `{ orderId }` | Marque la commande comme vue |

---

## 📊 analytics-service

### GET `/analytics/dashboard?range=7d` (admin)
KPIs globaux du tenant.

```json
{
  "orders": { "total": 142, "revenue": 3420.5, "trend": +12.4 },
  "satisfaction": { "nps": 42, "responses": 87, "average": 4.2 },
  "kiosk": { "sessions": 1532, "avgDuration": 78 },
  "topPois": [...],
  "ordersByHour": [...],
  "satisfactionByDay": [...]
}
```

### GET `/analytics/export?type=orders&format=csv&from=...`
Export CSV/Excel/PDF des données.

---

## Codes d'erreur

| Code | Signification |
|------|---------------|
| 400 | Validation échouée (DTO invalide) |
| 401 | Non authentifié |
| 403 | Authentifié mais pas autorisé (RBAC) |
| 404 | Ressource introuvable (ou sur un autre tenant) |
| 409 | Conflit (ex : email déjà pris) |
| 422 | Logique métier rejetée |
| 429 | Rate limit dépassé |
| 500 | Erreur serveur |

---

*Voir aussi le Swagger interactif sur `/api/docs`.*
