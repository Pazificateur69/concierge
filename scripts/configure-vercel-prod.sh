#!/usr/bin/env bash
# Met à jour les env vars Vercel pour que les frontends pointent vers le backend Render
set -e
VT="${VERCEL_TOKEN:-vcp_5tB5aEwsTtL9p549G2AnYH4t3WC1CCe9fzxZ19pfJx9GB8Ujlx1U5LUQ}"
SC="pazificateur69s-projects"
GW="${GATEWAY_URL:-https://concierge-gateway.onrender.com}"

for proj in concierge-lobby concierge-smiley concierge-admin concierge-reception; do
  echo "→ $proj : VITE_API_URL=$GW"
  vercel env rm VITE_API_URL production --yes --token="$VT" --scope="$SC" 2>/dev/null || true
  echo "$GW" | vercel env add VITE_API_URL production --token="$VT" --scope="$SC" --cwd "$(dirname "$0")/../apps/${proj#concierge-}" 2>/dev/null || \
    echo "$GW" | vercel env add VITE_API_URL production --token="$VT" --scope="$SC"
done

# Re-deploy each frontend so the new env var takes effect
for app in lobby-kiosk:concierge-lobby smiley:concierge-smiley admin:concierge-admin reception:concierge-reception; do
  src="${app%%:*}"
  proj="${app##*:}"
  case "$src" in
    lobby-kiosk|smiley) dist_dir="apps/$src/dist" ;;
    admin|reception) dist_dir="apps/$src/dist/browser" ;;
  esac
  echo "→ Redeploy $proj from $dist_dir"
  (cd "$(dirname "$0")/../$dist_dir" && vercel deploy --prod --yes --token="$VT" --scope="$SC")
done
