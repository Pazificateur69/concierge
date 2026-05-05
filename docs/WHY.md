# 🎯 WHY — Pourquoi ce projet ?

## La démarche

Avant de coder quoi que ce soit, j'ai pris le temps d'**analyser le site de Dymension** ([dymension.fr](https://www.dymension.fr/)) pour comprendre :

1. Quels sont leurs produits réels
2. Qui sont leurs clients
3. Quelles contraintes techniques imposent leur métier (tactile, kiosque, offline…)

L'objectif n'est pas de refaire un de leurs produits, mais de proposer une **vision d'intégration cohérente** qui démontre que je comprends leur activité.

---

## Ce que fait Dymension (analyse)

### Mobilier interactif
- Tables tactiles (standard, basses, restaurant, gaming, enfant, inclinées)
- Pupitres et lutrins
- Bornes et écrans tactiles
- Terminaux de commande

### Applications phares étudiées

#### 🍽️ Delyss
- Application de commande en restauration sur tablette/table
- Gestion des menus, plats à composer, suggestions
- Cible : restaurants, brasseries, hôtels (room service)

#### 😊 Expressyon
- Solution d'enquête de satisfaction
- Types de questions : smiley, NPS, QCM visuel/texte, texte libre, numérique, date, LiveSearch
- **Mode accessibilité vocale** (lit les questions à voix haute)
- **Mode hors-ligne** avec sync différée
- **Multi-langues**
- Backoffice web : création de surveys, programmation, génération de liens, export PDF/Excel
- Filtrage par profil démographique

#### 🗺️ KioskInfo
- Agrégation d'applications informationnelles tactiles
- Cartes interactives, catalogues, galeries, lecteur PDF, météo, navigation web sécurisée
- Cas d'usage : hôtels, mairies, gares, aéroports, centres commerciaux

### Clients identifiés
SNCF · Futuroscope · ERDF · Thales · Métros · Groupama · Caisse d'épargne · Mairies

**Conclusion** : grands comptes → exigences fortes en termes de **fiabilité, multi-tenant, accessibilité, mode hors-ligne**.

---

## Le constat

Quand un hôtel veut équiper son établissement avec Dymension, il a besoin de :
- Une borne **KioskInfo** dans le lobby
- Une tablette **Delyss** en chambre pour le room service
- Une borne **Expressyon** au check-out pour la satisfaction

→ **3 produits, 3 backoffices potentiels, 3 univers visuels**.

## La proposition Concierge

Une plateforme unifiée qui couvre les **5 touchpoints du parcours client hôtelier** :

```
Arrivée  →  Séjour  →  Repas  →  Activités  →  Départ
   │          │         │           │            │
   ▼          ▼         ▼           ▼            ▼
 Lobby   Tablette    Room       Carte         Smiley
KioskInfo chambre   service    interactive   satisfaction
                    (Delyss)   (KioskInfo)  (Expressyon)
```

Avec :
- **1 seul backoffice** pour le directeur
- **1 seule architecture multi-tenant** pour vendre aux chaînes hôtelières
- **1 seule UX cohérente** sur toute la chaîne client

---

## Pourquoi le secteur hôtel ?

1. **Cible explicite de Dymension** — mentionnée sur leur site
2. **Cas d'usage parfait pour combiner les 3 produits**
3. **Justifie naturellement** :
   - Le multi-langues (clientèle internationale)
   - L'accessibilité (clientèle senior, PMR)
   - Le mode offline (wifi de chambre instable)
   - Le multi-tenant (chaînes hôtelières)
4. **Fort potentiel commercial** pour un upsell client existant

---

## Pourquoi cette stack ?

Chaque choix technique correspond **explicitement à la fiche de poste** :

| Demandé sur l'offre | Utilisé dans Concierge |
|---------------------|------------------------|
| HTML5, TypeScript, JavaScript | Tout le projet |
| Node.js / NestJS | Backend microservices |
| Angular | Admin + Réception |
| Vue.js | Lobby + Chambre + Smiley |
| Ionic | Tous les frontends tactiles |
| MongoDB | Persistence |
| Docker | Containerisation |
| Microservices | 7 services découplés |

---

## Ce que ce projet démontre

Au-delà du code, ce projet montre que je sais :

1. ✅ **Étudier un client avant de répondre** — analyse produit, pas juste tech
2. ✅ **Concevoir une architecture** — pas juste exécuter des tutos
3. ✅ **Penser produit** — UX, accessibilité, parcours client
4. ✅ **Penser ops** — Docker, CI/CD, déploiement, monitoring
5. ✅ **Documenter** — README, ADR, schémas
6. ✅ **Travailler proprement** — tests, lint, conventions, monorepo

---

## Ce que je veux apprendre chez Dymension

- Les **vraies contraintes du tactile pro** que je n'ai pas pu simuler (calibrage, écrans 4K, gestes spécifiques, gestion des bornes physiques)
- Le **déploiement et la maintenance** d'applications kiosque sur le terrain
- Les **patterns industriels** sur 8+ ans de produit (architecture, choix techniques retours d'expérience)
- Le **rapport client** sur des grands comptes (SNCF, Caisse d'épargne…)

---

*Document rédigé avant l'entretien du 13 mai 2026.*
