# 🚀 Déploiement live — étapes manuelles

Le projet est **prêt à déployer**. Toi tu dois juste suivre ces étapes (15 min).

## 1️⃣ MongoDB Atlas (5 min)

1. Va sur [mongodb.com/atlas](https://www.mongodb.com/atlas) → Sign up
2. Create cluster **M0 Free** en région `eu-west-1` (Frankfurt ou Paris)
3. **Database Access** → Add user `concierge-app` + mot de passe (note-le !)
4. **Network Access** → Add IP → `0.0.0.0/0` (allow from anywhere)
5. **Connect** → Drivers → copie l'URI (format `mongodb+srv://concierge-app:<password>@cluster0.xxx.mongodb.net/concierge`)

Garde l'URI sous le coude.

## 2️⃣ Push le code sur GitHub (3 min)

```bash
cd /Users/pazent/Desktop/Dymension
git init
git add .
git commit -m "feat: initial commit — Concierge platform for Dymension"
gh repo create concierge --public --source=. --remote=origin --push
```

(ou via interface graphique GitHub : new repo, drag des fichiers)

## 3️⃣ Render — Backend (5 min)

1. Va sur [render.com](https://render.com) → Sign up avec GitHub
2. **New +** → **Blueprint**
3. Connecte ton repo `concierge`
4. Render détecte `render.yaml` → **Apply**
5. Pour chaque service, renseigne **MONGO_URI** = ton URI Atlas
6. Clique **Deploy** sur le `concierge-gateway`

Note l'URL générée, ex : `https://concierge-gateway.onrender.com`

## 4️⃣ Vercel — Frontends (3 min × 4)

```bash
# Login (ouvre ton navigateur)
vercel login

# Lobby
cd apps/lobby-kiosk
vercel --prod
# À la question "What's your project name" : concierge-lobby
# À la question "Override settings?" : N
# Settings env vars : VITE_API_URL=https://concierge-gateway.onrender.com

# Smiley
cd ../smiley
vercel --prod   # → concierge-smiley

# Admin
cd ../admin
vercel --prod   # → concierge-admin

# Reception
cd ../reception
vercel --prod   # → concierge-reception
```

Pour chaque frontend, va sur Vercel → Settings → Environment Variables et ajoute :
- `VITE_API_URL=https://concierge-gateway.onrender.com` (Vue apps)
- Pour Reception/Admin (Angular) : pas besoin si tu hard-codes via `window.__API__`

## 5️⃣ Seed la prod (2 min)

```bash
MONGO_URI="<atlas-uri>" pnpm --filter @concierge/seed seed
```

Ça crée les 2 hôtels, les comptes démo, etc.

## 6️⃣ Vérifier

```bash
./scripts/test-e2e.sh https://concierge-gateway.onrender.com
```

Si tout passe ✅ → tu as une démo live partageable !

---

## 🎯 URLs finales attendues

| App | URL |
|-----|-----|
| API | `https://concierge-gateway.onrender.com` |
| Lobby Royal Lyon | `https://concierge-lobby.vercel.app/?tenant=royal-lyon` |
| Lobby Côte d'Azur | `https://concierge-lobby.vercel.app/?tenant=cote-azur` |
| Smiley | `https://concierge-smiley.vercel.app/?tenant=royal-lyon&survey=satisfaction-checkout` |
| Admin | `https://concierge-admin.vercel.app` |
| Réception | `https://concierge-reception.vercel.app` |
| Swagger | `https://concierge-gateway.onrender.com/api/docs` |

---

## ⚠️ Important — free tier Render

Les services Render free tier dorment après 15 min sans trafic.

**Solution** : crée un cron sur [cron-job.org](https://cron-job.org) qui ping `https://concierge-gateway.onrender.com/health` toutes les 10 min.

Ou en démo, pré-chauffe en cliquant 30s avant l'entretien.
