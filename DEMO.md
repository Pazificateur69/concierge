# 🎬 Guide de démo — Entretien Dymension (13 mai 2026)

## ⚡ Démarrage en 3 commandes

```bash
# 1. Mongo + Redis dans Docker
pnpm docker:up

# 2. Build & seed
pnpm -r --filter "./services/**" --filter "./apps/api-gateway" run build
MONGO_URI="mongodb://localhost:27017/concierge" pnpm --filter @concierge/seed seed

# 3. Tout lancer
./scripts/dev-all.sh
```

Puis dans **5 terminaux séparés** (un par frontend) :
```bash
pnpm --filter lobby-kiosk dev   # http://localhost:4100
pnpm --filter smiley dev        # http://localhost:4200
pnpm --filter admin dev         # http://localhost:4300
pnpm --filter reception dev     # http://localhost:4400
```

## 🎯 Scénario de démo (15 minutes)

### 1. Le pitch (1 min)

> *"Avant de coder, j'ai analysé votre site. J'ai vu KioskInfo, Delyss, Expressyon — trois produits qui s'adressent souvent au même client (un hôtel, par exemple). J'ai voulu prototyper ce que pourrait être leur intégration unifiée. C'est devenu Concierge."*

Montre le **schéma d'archi** imprimé en A4.

### 2. La borne lobby (3 min) — http://localhost:4100/?tenant=royal-lyon

- **Pleine page d'accueil tactile** : *"Voilà la borne du lobby — pensée pour une table interactive comme vous en faites."*
- **Switch de langue** 🇫🇷 → 🇬🇧 → 🇩🇪 : *"Multilingue à chaud comme votre site mentionne pour l'hôtellerie."*
- **Activation vocale** 🔊 : *"L'accessibilité vocale, je l'ai inspirée directement d'Expressyon."*
- **Carte interactive** : *"Données POI live depuis content-service. Le directeur peut les éditer dans l'admin."*
- **Menu/Room service** : *"Inspiré de Delyss. Je commande 2 cafés en chambre 204..."*
  - *Soumet la commande*
- **Switch tenant** : visite `/?tenant=cote-azur` → *"Multi-tenant complet, branding différent : c'est important si vous adressez des chaînes hôtelières."*

### 3. La réception en temps réel (2 min) — http://localhost:4400

- *"Pendant que je cliquais, regardez la réception..."*
- Login `staff@royal-lyon.fr` / `Demo2026!`
- **La commande apparaît instantanément** via WebSocket
- *"Socket.io, JWT-authentifié sur les rooms `tenant:{id}:staff`. Une commande chez Royal Lyon ne fuite jamais vers Côte d'Azur."*
- Drag les colonnes : `Reçue → Acceptée → En préparation → Livrée`

### 4. La borne smiley (2 min) — http://localhost:4200

- *"Inspiré d'Expressyon, mais reconfiguré dynamiquement depuis l'admin."*
- Vote sur 4 smileys
- **Logique conditionnelle** : si tu votes 1 ou 2, la question texte apparaît
- *"Mode offline : si le wifi saute, les votes sont en queue dans le localStorage et synchronisés au retour réseau."*

### 5. L'admin (3 min) — http://localhost:4300

- Login `admin@royal-lyon.fr` / `Demo2026!`
- **Dashboard KPI** : commandes 24h, NPS, distribution smiley
- **Liste commandes** : voit la commande qu'on vient de créer
- **Surveys** : *"Le directeur configure ses propres questionnaires sans dev."*

### 6. Le code (2 min)

Ouvre VS Code, montre :
- `docs/ARCHITECTURE.md` — schéma + ADR
- `services/orders-service/src/orders/orders.gateway.ts` — *"WebSocket avec rooms par tenant"*
- `packages/nest-common/src/tenant-context.ts` — *"AsyncLocalStorage pour le scope tenant"*
- `apps/lobby-kiosk/src/views/MapView.vue` — *"Leaflet, voix Web Speech, multi-langues"*

### 7. La conclusion (2 min)

> *"Côté tech, j'ai utilisé exactement votre stack : NestJS + Angular + Vue + Ionic + MongoDB + Docker. Côté produit, j'ai essayé de penser comme vous : multi-tenant, mode offline, accessibilité, parcours client unifié. Je serais curieux de voir comment vous gérez ces problèmes-là sur les vrais déploiements de bornes."*

---

## 🔥 Phrases qui font la différence

| Moment | À dire |
|--------|--------|
| Multi-tenant | *"Un seul déploiement = N hôtels. Critique pour vendre à des chaînes."* |
| Voice | *"Direct copié de votre Expressyon — vos clients Caisse d'épargne en ont besoin."* |
| Offline PWA | *"Évident en hôtel — le wifi des chambres saute, mais la commande doit passer."* |
| WebSocket rooms | *"Isolation tenant côté WS aussi — pas que côté DB."* |
| MongoDB index | *"Compound index `tenant + status + date` — sans ça, le dashboard saute à 100K commandes."* |
| Choix archi | *"J'aurais pu mettre du Kafka, mais pour 7 microservices RabbitMQ suffit largement."* |

---

## 🆘 Si ça plante en démo

1. **Backend qui plante** : `./scripts/dev-all.sh` redémarre tout
2. **Mongo offline** : `pnpm docker:up`
3. **Plan B** : la **vidéo YouTube non listée** que tu as enregistrée — montre-la
4. **Plan C** : le **slide A4 imprimé** — explique avec ça

---

## 📋 Checklist avant l'entretien

- [ ] J-2 : Git push, Vercel + Render déployés, URL live testée
- [ ] J-2 : Vidéo YouTube enregistrée (2 min, non listée)
- [ ] J-1 : Slide architecture imprimée A4
- [ ] J-1 : README ouvert sur l'écran (au cas où)
- [ ] J-1 : Test sur ton tél du lien live
- [ ] H-1 : `./scripts/dev-all.sh` testé
- [ ] H-1 : Comptes démo notés
- [ ] H-0 : Sourire 😊
