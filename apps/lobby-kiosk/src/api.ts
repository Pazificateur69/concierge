import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

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
