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
  timeout: 10000,
});

api.interceptors.response.use(
  (r) => r,
  (e) => {
    console.error('[API]', e?.response?.status, e?.response?.data);
    return Promise.reject(e);
  },
);
