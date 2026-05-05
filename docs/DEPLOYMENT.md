# 🚢 Déploiement

## Stratégie globale

| Composant | Hébergeur | Free tier ? |
|-----------|-----------|-------------|
| Frontends (Vue, Angular) | **Vercel** | ✅ Oui |
| API Gateway + microservices NestJS | **Render** | ✅ Oui (cold start) |
| MongoDB | **MongoDB Atlas** | ✅ 512 Mo |
| Redis | **Upstash** | ✅ 10k commandes/jour |
| RabbitMQ | **CloudAMQP Lemur** | ✅ 1M messages/mois |

> **Pourquoi Vercel ne fait que les fronts ?**
> Vercel = serverless functions (timeout 10s), pas adapté aux WebSockets ni au long-running NestJS. Render gère bien les services Node.js stateful.

---

## 1. MongoDB Atlas (DB)

1. Créer compte sur [mongodb.com/atlas](https://www.mongodb.com/atlas)
2. Créer un cluster `M0` (free) en région **eu-west-1**
3. Sécurité : créer un user `concierge-app` avec mot de passe
4. Network Access → autoriser `0.0.0.0/0` (ou les IPs Render)
5. Récupérer la `MONGO_URI` :
   ```
   mongodb+srv://concierge-app:<password>@cluster0.xxx.mongodb.net/concierge
   ```

---

## 2. Upstash (Redis)

1. Créer compte sur [upstash.com](https://upstash.com)
2. Créer une DB Redis en région `eu-west-1`
3. Récupérer la `REDIS_URL`

---

## 3. Render (Backend)

### Option A : `render.yaml` (Infrastructure as Code)

Le repo contient un `render.yaml` à la racine. Sur Render :

1. **New +** → **Blueprint** → connecter le repo GitHub
2. Render détecte `render.yaml` et crée tous les services en 1 clic
3. Renseigner les variables d'env (MONGO_URI, REDIS_URL, JWT_SECRET, etc.)

### Option B : services manuels

Pour chaque microservice :

1. **New +** → **Web Service**
2. Repo → branche `main`
3. **Root directory** : `services/auth-service` (par exemple)
4. **Build command** : `pnpm install --frozen-lockfile && pnpm build`
5. **Start command** : `pnpm start:prod`
6. **Plan** : Free
7. Variables d'env : voir `.env.example`

> **Astuce free tier** : les services dorment après 15 min sans trafic.
> Solution : un cron `cron-job.org` qui ping `/health` toutes les 10 min.

---

## 4. Vercel (Frontends)

### Déploiement par CLI

```bash
# Installer la CLI
pnpm add -g vercel

# Login
vercel login

# Pour chaque frontend
cd apps/lobby-kiosk
vercel --prod

# Ou via interface graphique en important le repo
```

### Configuration

Chaque app a un `vercel.json` :

```json
{
  "buildCommand": "pnpm --filter lobby-kiosk... install && pnpm --filter lobby-kiosk build",
  "outputDirectory": "dist",
  "framework": "vite",
  "rewrites": [
    { "source": "/(.*)", "destination": "/index.html" }
  ]
}
```

Variables d'env Vercel (Settings → Environment Variables) :
- `VITE_API_URL=https://concierge-gateway.onrender.com`
- `VITE_WS_URL=wss://concierge-notification.onrender.com`

### Domaines custom (optionnel)

Sur Vercel → Settings → Domains :
- `concierge-lobby.tondomaine.fr`
- etc.

---

## 5. CI/CD GitHub Actions

`.github/workflows/ci.yml` :
- Lint sur chaque PR
- Tests unitaires sur chaque PR
- Build Docker des microservices sur `main`

`.github/workflows/deploy-frontends.yml` :
- À chaque push `main`, redéploie les frontends sur Vercel via leur GitHub integration (auto)

---

## 6. Seed des données de démo

Une fois Mongo accessible :

```bash
MONGO_URI="<atlas-uri>" pnpm seed
```

Crée :
- 2 hôtels : Royal Lyon + Côte d'Azur Resort
- 3 utilisateurs par hôtel (admin, staff, staff)
- ~40 plats par hôtel (room service)
- ~15 POI par hôtel (carte locale)
- 2 surveys par hôtel
- ~30 commandes historiques
- ~50 réponses survey historiques

---

## 7. Vérification post-deploy

```bash
# Health checks
curl https://concierge-gateway.onrender.com/health
curl https://concierge-auth.onrender.com/health

# Login
curl -X POST https://concierge-gateway.onrender.com/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@royal-lyon.fr","password":"Demo2026!"}'
```

Frontends :
- Ouvrir https://concierge-lobby.vercel.app et tester
- Mode kiosque : ajouter `?kiosk=1` à l'URL

---

## 8. Monitoring (bonus)

- **Render** : logs intégrés + métriques CPU/RAM
- **Sentry** (free tier) : tracking erreurs frontend + backend
- **Better Stack** ou **UptimeRobot** : alertes si site down
- **Vercel Analytics** : trafic frontends

---

## Coûts estimés

| Service | Coût mensuel |
|---------|--------------|
| Vercel (5 frontends, free tier) | 0 € |
| Render (7 services, free tier) | 0 € |
| MongoDB Atlas M0 | 0 € |
| Upstash | 0 € |
| CloudAMQP Lemur | 0 € |
| **TOTAL** | **0 €** |

> Pour passer en production réelle : compter ~50€/mois (Render Starter + Atlas M2 + Vercel Pro).

---

## Troubleshooting

### "Service Render dort, premier appel lent (15s)"
Normal sur free tier. Solution : cron-job.org ping `/health` toutes les 10min.

### "CORS error"
Vérifier `CORS_ORIGINS` sur l'API Gateway, doit inclure les URLs Vercel.

### "WebSocket ne se connecte pas"
Render free tier supporte les WS, mais pas Vercel. Le `notification-service` doit être sur Render.

### "Mongo connection refused"
Atlas → Network Access → vérifier `0.0.0.0/0` ou IP Render.
