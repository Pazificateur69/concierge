# Data model

Schéma logique des collections MongoDB. Pour générer un diagramme visuel, copier le bloc DBML ci-dessous dans [dbdiagram.io](https://dbdiagram.io).

## Collections principales

### `tenants`
- `_id` (ObjectId)
- `slug` (string, unique) — identifiant URL
- `name` (string)
- `theme` (object) — `{ ink, accent, paper, logoUrl }`
- `locales` (string[])
- `contact` (object) — `{ city, phone, email, address }`
- `createdAt`, `updatedAt`

### `users`
- `_id`
- `tenantId` (ref → tenants)
- `email` (string, unique-per-tenant)
- `passwordHash` (string)
- `firstName`, `lastName`
- `role` (`admin` | `manager` | `staff` | `housekeeping`)
- `active` (boolean)
- `lastLoginAt`

### `pois`
- `_id`
- `tenantId` (ref)
- `name` (i18n object — `{ fr, en, … }`)
- `category` (string)
- `lat`, `lng` (number)
- `description` (i18n object)
- `photo` (string url)
- `rating` (number 0-5, nullable)
- `hours`, `phone`, `website` (strings)
- `deletedAt` (Date, nullable — soft delete)

### `menu_items`
- `_id`
- `tenantId` (ref)
- `category` (`food` | `drink` | `spa` | `taxi` | `wakeup` | `housekeeping` | `other`)
- `name` (i18n)
- `description` (i18n)
- `price` (number, EUR)
- `currency` (string, default `EUR`)
- `image`, `options` (string[])
- `allergens` (string[])
- `available` (boolean)
- `preparationMinutes` (number)
- `deletedAt`

### `orders`
- `_id`
- `tenantId` (ref)
- `room` (string)
- `guestName` (string, nullable)
- `items` (embedded array)
- `subtotal`, `total`, `currency`
- `status` (`pending` | `accepted` | `preparing` | `delivered` | `cancelled`)
- `statusHistory` (`[{ status, at, by? }]`)
- `locale`, `notes`, `source`
- `createdAt`, `updatedAt`

### `surveys`
- `_id`
- `tenantId`
- `slug`
- `title` (i18n)
- `questions` (embedded array of `{ id, type, label, options?, showIf? }`)
- `locales`
- `publishedAt`

### `survey_responses`
- `_id`
- `tenantId`, `surveyId`
- `room` (nullable)
- `answers` (`[{ questionId, value }]`)
- `locale`
- `metadata` (object)
- `submittedAt`

## DBML — copier dans dbdiagram.io

```dbml
Table tenants {
  id ObjectId [pk]
  slug string [unique, not null]
  name string [not null]
  theme json
  locales string[]
}

Table users {
  id ObjectId [pk]
  tenantId ObjectId [ref: > tenants.id, not null]
  email string [unique, not null]
  passwordHash string
  firstName string
  lastName string
  role string
  active bool
  lastLoginAt datetime
}

Table pois {
  id ObjectId [pk]
  tenantId ObjectId [ref: > tenants.id]
  name json
  category string
  lat float
  lng float
  description json
  photo string
  rating float
  hours string
  phone string
  website string
  deletedAt datetime
}

Table menu_items {
  id ObjectId [pk]
  tenantId ObjectId [ref: > tenants.id]
  category string
  name json
  description json
  price float
  currency string
  image string
  available bool
  preparationMinutes int
  deletedAt datetime
}

Table orders {
  id ObjectId [pk]
  tenantId ObjectId [ref: > tenants.id]
  room string
  guestName string
  items json
  subtotal float
  total float
  currency string
  status string
  statusHistory json
  source string
  createdAt datetime
  updatedAt datetime
}

Table surveys {
  id ObjectId [pk]
  tenantId ObjectId [ref: > tenants.id]
  slug string
  title json
  questions json
  locales string[]
  publishedAt datetime
}

Table survey_responses {
  id ObjectId [pk]
  tenantId ObjectId [ref: > tenants.id]
  surveyId ObjectId [ref: > surveys.id]
  room string
  answers json
  locale string
  submittedAt datetime
}

Table audit_log {
  id ObjectId [pk]
  tenantId ObjectId [ref: > tenants.id]
  actor ObjectId [ref: > users.id]
  action string
  kind string
  target string
  ip string
  at datetime
}

Table webhook_endpoints {
  id ObjectId [pk]
  tenantId ObjectId [ref: > tenants.id]
  url string
  events string[]
  active bool
  secret string
}
```

## Index recommandés

| Collection | Index |
|------------|-------|
| `tenants` | `{ slug: 1 }` unique |
| `users` | `{ tenantId: 1, email: 1 }` unique |
| `pois` | `{ tenantId: 1, category: 1 }` · `{ tenantId: 1, name.fr: 'text' }` |
| `menu_items` | `{ tenantId: 1, category: 1, available: 1 }` · `{ tenantId: 1, name.fr: 'text' }` |
| `orders` | `{ tenantId: 1, status: 1, createdAt: -1 }` · `{ tenantId: 1, room: 1 }` |
| `surveys` | `{ tenantId: 1, slug: 1 }` unique |
| `survey_responses` | `{ tenantId: 1, surveyId: 1, submittedAt: -1 }` |
| `audit_log` | `{ tenantId: 1, at: -1 }` (TTL 90 jours) |

## Relations

```
tenants (1) ──── (N) users
       (1) ──── (N) pois
       (1) ──── (N) menu_items
       (1) ──── (N) orders
       (1) ──── (N) surveys ──── (N) survey_responses
       (1) ──── (N) audit_log
       (1) ──── (N) webhook_endpoints
```
