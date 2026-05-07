import axios from 'axios';

// Order of precedence for the API URL :
//   1. ?api= query param  (live demo with a tunnel)
//   2. VITE_API_URL build-time env (set on Vercel)
//   3. http://localhost:4000  (local dev default)
function resolveApiUrl(): string {
  if (typeof window !== 'undefined') {
    const params = new URLSearchParams(window.location.search);
    const queryApi = params.get('api');
    if (queryApi) {
      // Persist between page navigations of the SPA
      sessionStorage.setItem('concierge_api', queryApi);
      return queryApi;
    }
    const sessionApi = sessionStorage.getItem('concierge_api');
    if (sessionApi) return sessionApi;
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
    console.error('[API]', error?.response?.status, error?.response?.data || error.message);
    return Promise.reject(error);
  },
);

// Warm-up ping: silently hits /healthz so cold-start latency is paid before the user clicks anything.
if (typeof window !== 'undefined') {
  setTimeout(() => {
    fetch(`${API_URL}/healthz`, { cache: 'no-store' }).catch(() => undefined);
  }, 100);
}
