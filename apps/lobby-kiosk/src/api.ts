import axios from 'axios';

const PROD_GATEWAY = 'https://concierge-gateway.onrender.com';

// Order of precedence for the API URL :
//   1. ?api= query param  (live demo with a tunnel)
//   2. sessionStorage carry-over from a previous ?api=
//   3. VITE_API_URL build-time env (set on Vercel)
//   4. Auto-detect : *.vercel.app or *.onrender.com → PROD_GATEWAY
//   5. http://localhost:4000  (local dev default)
function resolveApiUrl(): string {
  if (typeof window !== 'undefined') {
    const params = new URLSearchParams(window.location.search);
    const queryApi = params.get('api');
    if (queryApi) {
      sessionStorage.setItem('concierge_api', queryApi);
      return queryApi;
    }
    const sessionApi = sessionStorage.getItem('concierge_api');
    if (sessionApi) return sessionApi;

    const envUrl = import.meta.env.VITE_API_URL;
    // If env var is missing OR points to a *.onrender.com URL that's NOT the live gateway
    // (typo in Vercel env left over), fall back to the canonical production URL.
    const onProdHost = /\.(vercel|onrender)\.app|netlify\.app/.test(location.hostname);
    if (envUrl && (!onProdHost || envUrl.includes('concierge-gateway.onrender.com'))) {
      return envUrl;
    }
    if (onProdHost) return PROD_GATEWAY;
  }
  return import.meta.env.VITE_API_URL || 'http://localhost:4000';
}

export const API_URL = resolveApiUrl();

export const api = axios.create({
  baseURL: API_URL,
  // Render free tier cold-start can take 30-60s. We allow up to 60s.
  timeout: 60000,
});

api.interceptors.response.use(
  (r) => r,
  async (error) => {
    const cfg: any = error.config || {};
    cfg.__retryCount = cfg.__retryCount || 0;
    const isTimeout = error.code === 'ECONNABORTED' || /timeout/i.test(error.message ?? '');
    const isNetwork = !error.response;
    if ((isTimeout || isNetwork) && cfg.__retryCount < 2) {
      cfg.__retryCount += 1;
      // Backoff: 800ms, 2s
      await new Promise((r) => setTimeout(r, cfg.__retryCount === 1 ? 800 : 2000));
      return api.request(cfg);
    }
    // Verbose error log so we can diagnose CORS / network / cold-start issues from devtools
    console.error('[API]', {
      method: cfg.method,
      url: (cfg.baseURL ?? '') + (cfg.url ?? ''),
      status: error?.response?.status,
      code: error?.code,
      message: error?.message,
      data: error?.response?.data,
    });
    return Promise.reject(error);
  },
);

// Warm-up ping: silently hits /healthz so cold-start latency is paid before the user clicks anything.
if (typeof window !== 'undefined') {
  setTimeout(() => {
    fetch(`${API_URL}/healthz`, { cache: 'no-store' }).catch(() => undefined);
  }, 100);
  // eslint-disable-next-line no-console
  console.info('[Concierge] API base URL =', API_URL);
}
