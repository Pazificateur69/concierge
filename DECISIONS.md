# Architecture Decision Records (ADR)

Ce document recense les décisions techniques structurantes prises au cours du développement. Format inspiré de Michael Nygard.

---

## ADR-001 — Monorepo pnpm avec workspaces

**Contexte.** 5 services backend + 5 frontends + packages partagés (types, nest-common). Besoin de partager les DTOs TypeScript et de versionner ensemble.

**Décision.** pnpm workspaces. Pas de Nx/Turborepo : la complexité ajoutée n'est pas justifiée à cette échelle.

**Conséquences.**
- Build par projet : `pnpm --filter <name> build`
- Build all : `pnpm -r run build`
- Hot link entre packages via `workspace:*`
- Render et Vercel supportent pnpm nativement

---

## ADR-002 — Multi-tenant par discriminator vs database-per-tenant

**Contexte.** Le projet doit servir plusieurs hôtels (Royal Lyon, Negresco) avec leurs propres données.

**Décision.** Champ `tenantId` discriminant sur toutes les collections, pas de DB par hôtel.

**Conséquences.**
- + Onboarding nouveau tenant : 0 ops
- + Code et infra simples
- + Index Mongo composites `{ tenantId, ... }` performants
- − Risque fuite cross-tenant si on oublie le filtre — mitigé par TenantMiddleware obligatoire
- − Pas d'isolation forte au niveau DB (acceptable pour notre cas, pas pour banque/santé)

---

## ADR-003 — Reverse-proxy Nest plutôt qu'API Gateway managé

**Contexte.** Besoin d'un point d'entrée unique, CORS centralisé, Swagger agrégé.

**Décision.** apps/api-gateway en NestJS + http-proxy-middleware.

**Conséquences.**
- + Déployable comme un service Render normal, pas de surcoût
- + Middlewares Express/Nest custom (logging, helmet, healthz)
- − Pas de WAF managé, pas de rate-limit avancé par tenant — à porter sur Kong/Apigee si scale

---

## ADR-004 — Angular pour dashboards, Vue+Ionic pour bornes

**Contexte.** La fiche de poste Dymension liste les deux. Différencier les choix permet de démontrer la maîtrise des deux.

**Décision.**
- Admin + Réception : Angular 17 standalone + Signals (form-heavy, beaucoup de tables et de computed)
- Lobby + Smiley : Vue 3 + Ionic + Pinia (touch-first, animations, multi-langues)
- Portal : HTML statique + JS vanilla (landing éditoriale, zéro framework)

**Conséquences.**
- + Démontre aisance sur les deux écosystèmes
- + Outils adaptés à chaque cas
- − Code partagé limité (UI components dupliqués entre frameworks)

---

## ADR-005 — JWT 15 min + refresh tokens

**Contexte.** Sessions longues sur tablettes en chambre (auth admin/réception). Pas de session côté serveur.

**Décision.** Access token JWT 15 min + refresh token 30 jours stocké en DB avec rotation.

**Conséquences.**
- + Pas de session-store distribué
- + Refresh token révocable côté DB
- − Légère complexité côté front pour le retry transparent

---

## ADR-006 — Charts inline-SVG plutôt que Recharts/Chart.js

**Contexte.** Besoin de graphes dans l'admin (revenue line, donut, heatmap, NPS sparkline, funnel).

**Décision.** SVG inline dans templates Angular avec computed signals.

**Conséquences.**
- + Zéro dépendance ajoutée (~ 50 kB gzip économisés)
- + Performance native, pas de Canvas reflow
- + Style cohérent avec le design éditorial
- − Code custom à maintenir (mais cas simples)

---

## ADR-007 — Mode sombre + mode nuit auto + RTL natifs

**Contexte.** Bornes en lobby actives 24/7. Hôtels accueillant des clients arabophones.

**Décision.**
- Mode sombre : opt-in admin/réception via toggle (CSS class + localStorage)
- Mode nuit lobby : auto 22h-7h (luminosité réduite, contraste doux)
- Screensaver lobby : 0h-6h (carrousel photos + citations Bocuse)
- RTL : `dir="rtl"` sur `<html>` quand locale = `ar`

**Conséquences.**
- + Aucune dépendance, juste des CSS variables et class-toggles
- + Démontre la sensibilité UX 24/7

---

## ADR-008 — Confetti, animations, et "wow" demo

**Contexte.** Pour un entretien, le projet doit produire une émotion en 3 minutes.

**Décision.** Confetti canvas pur (gold particles) au "delivered". Live activity ticker. Compteurs portal animés. Pas de bibliothèque (canvas-confetti), juste du Canvas 2D natif.

**Conséquences.**
- + Effet Wow contrôlé, palette assortie au design
- + Code court (~ 60 lignes)
- − À tester sur iPad bas de gamme (probable OK, particles léger)

---

## ADR-009 — Pas d'IA générative dans le projet

**Contexte.** L'IA marketing est tendance mais le projet doit montrer du fundamentals : architecture, multi-tenant, temps réel, multi-front.

**Décision.** Le concierge chat utilise un knowledge base à mots-clés, pas Claude/GPT. Le sentiment analysis utilise une liste de mots positifs/négatifs, pas un classifier ML. La traduction du menu n'est pas implémentée.

**Conséquences.**
- + Démo déterministe, pas de quota API à gérer
- + Coût zéro
- + Démontre que la valeur du projet vient de l'archi, pas du buzz IA
- − Réponses chat moins riches que GPT-4o
- + Si l'entretien glisse vers l'IA, possibilité d'expliquer comment on plug Claude (system prompt, streaming, function calling)

---

## ADR-010 — Render free tier + cold-starts acceptables

**Contexte.** Démo + free tier = trade-off financier.

**Décision.** Backend sur Render free, frontends sur Vercel. Cold-start ~5s sur free tier après 15min d'inactivité.

**Conséquences.**
- + Coût total : 0 €
- − Cold-start visible — on warm-up le gateway en pingant `/healthz` toutes les 14 minutes via cron Vercel
- − En production pour un client réel : starter plan ($7/mois/service)

---

## ADR-011 — Seed dataset éditorial vs random faker

**Contexte.** Besoin de données qui paraissent crédibles en démo.

**Décision.** Seed manuel curaté : 31 POIs Lyon réels + 15 Nice, 60 plats avec prix réalistes par tier (entrée, plat, dessert), 440 réponses survey avec skew réaliste vers le positif (NPS ≈ +60), 160 commandes avec distribution status réaliste.

**Conséquences.**
- + Démo paraît production
- + Lieux réels reconnus → connexion émotionnelle
- − Effort initial (~ 4h)
- − Pas de chaos engineering possible (mais pas pertinent à ce stade)
