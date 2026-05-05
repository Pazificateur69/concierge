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
      error.value = e?.message ?? 'Failed to load tenant';
      tenant.value = {
        id: 'fallback',
        slug,
        name: 'Demo Hotel',
        theme: {
          primaryColor: '#1a4d8c',
          accentColor: '#d4a85a',
          bgColor: '#fafaf7',
          textColor: '#1a1d24',
          logoUrl: 'https://placehold.co/200x80/1a4d8c/d4a85a?text=DEMO',
          font: 'Playfair Display',
        },
        locales: ['fr', 'en', 'de', 'es', 'jp'],
        defaultLocale: 'fr',
        features: ['lobby', 'rooms', 'smiley'],
      };
    } finally {
      loading.value = false;
    }
  }

  return { tenant, loading, error, load };
});
