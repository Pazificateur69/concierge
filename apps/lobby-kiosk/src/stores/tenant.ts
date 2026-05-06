import { defineStore } from 'pinia';
import { ref } from 'vue';
import { api } from '../api';
import type { PublicTenant } from '@concierge/types';

export const useTenantStore = defineStore('tenant', () => {
  const tenant = ref<PublicTenant | null>(null);
  const loading = ref(false);
  const error = ref<string | null>(null);

  async function load(slug: string) {
    loading.value = true;
    error.value = null;
    try {
      const { data } = await api.get<PublicTenant>(`/tenants/${slug}`);
      tenant.value = data;
    } catch (e: any) {
      // Pas de fallback factice : on garde tenant=null + error
      error.value = e?.response?.data?.message || e?.message || 'Impossible de joindre le serveur';
      tenant.value = null;
    } finally {
      loading.value = false;
    }
  }

  return { tenant, loading, error, load };
});
