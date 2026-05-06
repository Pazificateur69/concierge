<script setup lang="ts">
import { IonApp, IonRouterOutlet } from '@ionic/vue';
import { onMounted, computed } from 'vue';
import { useTenantStore } from './stores/tenant';
import { useIdleStore } from './stores/idle';
import { useRouter } from 'vue-router';

const tenantStore = useTenantStore();
const idleStore = useIdleStore();
const router = useRouter();

const showError = computed(() => !tenantStore.loading && !tenantStore.tenant && !!tenantStore.error);
const showLoading = computed(() => tenantStore.loading || (!tenantStore.tenant && !tenantStore.error));

onMounted(async () => {
  const params = new URLSearchParams(window.location.search);
  const slug = params.get('tenant') || import.meta.env.VITE_DEFAULT_TENANT || 'royal-lyon';
  await tenantStore.load(slug);

  idleStore.start(() => router.push('/'));

  if (params.get('kiosk') === '1') {
    document.documentElement.requestFullscreen?.().catch(() => undefined);
  }
});

function retry() { window.location.reload(); }
</script>

<template>
  <ion-app>
    <!-- Boot loading -->
    <div v-if="showLoading" class="boot">
      <div class="boot__mark">C</div>
      <span class="boot__brand serif italic">Concierge</span>
      <div class="boot__spinner"></div>
      <span class="boot__hint">Préparation de votre expérience…</span>
    </div>

    <!-- Boot error -->
    <div v-else-if="showError" class="boot boot--error">
      <div class="boot__mark">C</div>
      <span class="boot__brand serif italic">Concierge</span>
      <h1 class="serif">Service momentanément indisponible</h1>
      <p>Notre équipe est avertie. Merci de réessayer dans un instant ou de joindre la réception.</p>
      <button class="boot__cta" @click="retry">Réessayer</button>
      <small class="boot__detail">{{ tenantStore.error }}</small>
    </div>

    <ion-router-outlet v-else />
  </ion-app>
</template>

<style scoped>
.boot {
  position: fixed; inset: 0;
  display: flex; flex-direction: column; align-items: center; justify-content: center;
  gap: 24px; padding: 32px;
  background:
    radial-gradient(ellipse at top, var(--c-paper-soft) 0%, var(--c-paper) 60%),
    var(--c-paper);
  text-align: center;
  font-family: 'Inter', sans-serif;
}
.boot__mark {
  width: 72px; height: 72px;
  background: var(--c-ink); color: var(--c-paper);
  display: grid; place-items: center;
  font-family: 'Cormorant Garamond', serif;
  font-size: 36px; font-weight: 600;
}
.boot__brand {
  font-size: 32px; color: var(--c-ink);
  margin-top: -8px;
}
.boot__spinner {
  width: 24px; height: 24px;
  border: 1.5px solid var(--c-border-strong);
  border-top-color: var(--c-ink);
  border-radius: 50%;
  animation: spin 0.9s linear infinite;
}
@keyframes spin { to { transform: rotate(360deg); } }
.boot__hint { font-size: 12px; color: var(--c-text-muted); letter-spacing: 0.16em; text-transform: uppercase; }
.boot--error h1 { font-size: 32px; margin: 0; max-width: 480px; line-height: 1.2; color: var(--c-ink); font-weight: 500; }
.boot--error p { color: var(--c-text-muted); max-width: 460px; line-height: 1.6; margin: 0; }
.boot__cta { padding: 14px 28px; background: var(--c-ink); color: white; border: none; font-size: 12px; font-weight: 600; letter-spacing: 0.16em; text-transform: uppercase; cursor: pointer; }
.boot__cta:hover { background: var(--c-accent); }
.boot__detail { color: var(--c-text-soft); font-size: 11px; font-family: 'JetBrains Mono', monospace; max-width: 480px; word-break: break-word; opacity: 0.7; }
</style>
