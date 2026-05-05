<script setup lang="ts">
import { IonApp, IonRouterOutlet } from '@ionic/vue';
import { onMounted, watch } from 'vue';
import { useTenantStore } from './stores/tenant';
import { useIdleStore } from './stores/idle';
import { useRouter } from 'vue-router';

const tenantStore = useTenantStore();
const idleStore = useIdleStore();
const router = useRouter();

onMounted(async () => {
  const params = new URLSearchParams(window.location.search);
  const slug = params.get('tenant') || import.meta.env.VITE_DEFAULT_TENANT || 'royal-lyon';
  await tenantStore.load(slug);

  idleStore.start(() => router.push('/'));

  if (params.get('kiosk') === '1') {
    document.documentElement.requestFullscreen?.().catch(() => undefined);
  }
});

watch(
  () => tenantStore.tenant?.theme,
  (theme) => {
    if (!theme) return;
    const root = document.documentElement;
    root.style.setProperty('--c-primary', theme.primaryColor);
    root.style.setProperty('--c-accent', theme.accentColor);
    root.style.setProperty('--c-bg', theme.bgColor);
    root.style.setProperty('--c-text', theme.textColor);
    root.style.setProperty('--c-font-display', theme.font);
  },
  { immediate: true },
);
</script>

<template>
  <ion-app>
    <ion-router-outlet />
  </ion-app>
</template>
