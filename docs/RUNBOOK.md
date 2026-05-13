# Runbook — opérations courantes

Tout ce qu'il faut faire pour gérer Concierge en prod. Conçu pour répondre rapidement à : *« quelque chose ne marche pas, je fais quoi ? »*.

## Réveiller tout

Render free tier endort les services après **15 min** sans trafic. Premier appel = 30-90s. Avant chaque démo, lancer le pré-chauffage en parallèle :

```bash
for url in \
  https://concierge-gateway.onrender.com/healthz \
  https://concierge-auth.onrender.com/health \
  https://concierge-tenant.onrender.com/health \
  https://concierge-content.onrender.com/health \
  https://concierge-orders.onrender.com/orders/healthz \
  https://concierge-survey.onrender.com/surveys/healthz ; do
  curl -sS -o /dev/null -w "$url → %{http_code} in %{time_total}s\n" --max-time 120 "$url" &
done
wait
```

> Les codes 200 et 404 sont tous deux des signes de vie. Un timeout (000) signale un problème.

## Vérifier l'état complet en 30 secondes

```bash
TOKEN=$(curl -sS -m 30 -X POST https://concierge-gateway.onrender.com/auth/login \
  -H 'Content-Type: application/json' \
  -d '{"email":"admin@royal-lyon.fr","password":"Demo2026!"}' \
  | python3 -c "import sys,json;print(json.load(sys.stdin)['accessToken'])")

ok() { printf "%-45s " "$1"; shift; curl -sS -o /dev/null -w "HTTP %{http_code}\n" --max-time 30 "$@"; }
TENANT=69fb2eb1e95cf9145870dbff
ok "/tenants/directory"     https://concierge-gateway.onrender.com/tenants/directory
ok "/tenants/royal-lyon"    https://concierge-gateway.onrender.com/tenants/royal-lyon
ok "/auth/me"               -H "Authorization: Bearer $TOKEN" https://concierge-gateway.onrender.com/auth/me
ok "/content/pois"          "https://concierge-gateway.onrender.com/content/pois?tenantId=$TENANT"
ok "/orders/menu"           "https://concierge-gateway.onrender.com/orders/menu?tenantId=$TENANT"
ok "/orders (staff list)"   -H "Authorization: Bearer $TOKEN" https://concierge-gateway.onrender.com/orders
ok "/surveys/satisfaction-checkout"   "https://concierge-gateway.onrender.com/surveys/satisfaction-checkout?tenantId=$TENANT"
ok "/socket.io handshake"   "https://concierge-gateway.onrender.com/socket.io/?EIO=4&transport=polling"
```

Tout doit répondre `200` ou `403` (le `403` sur `/tenants` est attendu pour un admin non-superadmin → c'est le signe que la stratégie JWT est en place).

## Redéployer un service Render

### Méthode A — push GitHub (recommandée)
Les `buildFilter` du `render.yaml` ne redéploient un service que si **son code** ou les **packages partagés** changent. Pour forcer un redeploy alors qu'on n'a rien touché :

```bash
git commit --allow-empty -m "chore: trigger redeploy"
git push origin main
```

→ Render rebuild **tous** les services concernés (ici aucun car le commit est vide). En pratique, faire un changement minime dans le bon fichier.

### Méthode B — Render CLI
```bash
export RENDER_API_KEY="rnd_eRFpvd48fVGQGzRe1BmQMhYgchR7"
render deploys create <service-id> --confirm
```

IDs des services : voir le dashboard Render (URL : `https://dashboard.render.com/web/<service-id>`). Récupération via API :
```bash
render services --output json | jq -r '.[] | "\(.service.id)\t\(.service.name)"'
```

### Méthode C — bouton "Manual Deploy"
Sur le dashboard Render → service → "Manual Deploy" → "Deploy latest commit".

## Redéployer un front Vercel

Auto-deploy sur push. Sinon depuis le dashboard Vercel : projet → Deployments → bouton "Redeploy" sur le dernier déploiement.

## Voir les logs

### Render
Dashboard → service → onglet **Logs**. Streaming temps réel. Filtres par niveau.

Le gateway logue en JSON une ligne par requête HTTP — pratique pour `jq` côté local :
```bash
# (Si on récupère un dump via copy-paste depuis le dashboard)
cat dump.log | grep '"path"' | jq -r '"\(.status) \(.method) \(.path) (\(.durationMs)ms)"' | sort -u
```

### Vercel
Dashboard → projet → Deployments → click sur un déploiement → onglet **Logs**. Les SPA statiques ne logguent pas — seuls les builds.

## Rotation des secrets

Tous les services partagent `concierge-shared` (cf `render.yaml`).

### Changer JWT_SECRET
1. Dashboard Render → Env Groups → `concierge-shared` → Edit
2. Régénérer `JWT_SECRET` (ou mettre une valeur custom)
3. Redéployer **tous** les services qui consomment ce groupe (sinon désynchro entre gateway qui signe et services qui valident)
4. Tous les tokens existants sont invalidés → les utilisateurs doivent se reconnecter

### Changer MONGO_URI
1. Idem dashboard Render
2. Déconnecter Atlas de l'ancien user / activer le nouveau

## Reseeder la base

⚠ Le script `infra/seed/seed.ts` **drop les collections** avant insertion. À ne PAS lancer sur la prod sauf si on accepte de tout perdre.

Procédure « safe » pour ajouter du contenu sans wipe :
```bash
# 1. Récupérer un JWT admin
TOKEN=$(curl -sS -X POST https://concierge-gateway.onrender.com/auth/login \
  -H 'Content-Type: application/json' \
  -d '{"email":"admin@royal-lyon.fr","password":"Demo2026!"}' \
  | python3 -c "import sys,json;print(json.load(sys.stdin)['accessToken'])")

# 2. POST sur l'endpoint admin du contenu visé (POI, menu, survey…)
curl -X POST "https://concierge-gateway.onrender.com/content/pois?tenantId=…" \
  -H "Authorization: Bearer $TOKEN" \
  -H 'Content-Type: application/json' \
  -d '{ … }'
```

Pour les surveys : `POST /surveys` (tenantId injecté depuis JWT).

## Troubleshooting

### Symptôme — Tout est lent au premier clic (50s+)
Render cold start. Normal sur free tier. Pré-chauffer (voir haut de page). Pour éliminer définitivement : passer en plan **Starter** ($7/service/mois).

### Symptôme — `502 Upstream error` sur le gateway
Un microservice avale a timeout. Causes possibles :
- Service endormi et le timeout proxy (90s) a expiré. Réveiller manuellement le service ciblé.
- Service crashé. Vérifier les logs Render.

### Symptôme — `500 "Unknown authentication strategy jwt"`
Un service utilise `AuthGuard('jwt')` mais n'enregistre pas `JwtStrategy` dans son module. Fix : ajouter `JwtStrategy` aux `providers` du module concerné (cf. les autres services pour le pattern).

### Symptôme — `401 Unauthorized` sur une route censée être publique
Vérifier que le controller n'a pas un `@UseGuards(AuthGuard('jwt'))` au niveau de la classe (qui s'applique à toutes les méthodes). Si oui, utiliser le décorateur `@Public()` sur les méthodes individuelles **ou** mettre le guard uniquement sur les méthodes protégées.

### Symptôme — Réception ne reçoit pas les commandes en temps réel
1. Vérifier que `/socket.io/?EIO=4&transport=polling` répond 200 sur le gateway
2. Si 404 : le proxy `/socket.io` n'est pas en place ou le `pathRewrite` est cassé. Voir `apps/api-gateway/src/proxy.ts`.
3. Vérifier la console navigateur — un échec d'auth WS apparaît avec `WebSocket connection closed` après le handshake.

### Symptôme — Healthcheck Render rouge mais service répond
Le `render.yaml` déclare `healthCheckPath: /auth/healthz` mais le service expose `/health`. Mismatch documenté, sans impact fonctionnel. Fix futur : aligner les paths.

### Symptôme — MongoDB Atlas plein (512 Mo)
Vérifier `survey_responses` qui croît avec le trafic démo. Purge :
```js
db.survey_responses.deleteMany({ completedAt: { $lt: new Date(Date.now() - 30*24*3600*1000) } })
```

## Commandes utiles

### Dev local (Docker Compose)
```bash
cd infra/compose && docker compose up
```
Lance Mongo + tous les services en local. Pas utilisé en prod.

### E2E test
```bash
pnpm exec playwright test
```

### Build single service
```bash
pnpm --filter <service-name> build
```
Ex : `pnpm --filter api-gateway build`, `pnpm --filter lobby-kiosk build`.

## Contacts d'urgence

- Render dashboard : https://dashboard.render.com
- Vercel dashboard : https://vercel.com/dashboard
- MongoDB Atlas : https://cloud.mongodb.com
- GitHub repo : https://github.com/Pazificateur69/concierge
