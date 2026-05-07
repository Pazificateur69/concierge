import { createApp } from 'vue';
import { IonicVue } from '@ionic/vue';
import { createPinia } from 'pinia';
import App from './App.vue';
import { router } from './router';
import { i18n } from './i18n';

import '@ionic/vue/css/core.css';
import '@ionic/vue/css/normalize.css';
import '@ionic/vue/css/structure.css';
import '@ionic/vue/css/typography.css';
import '@ionic/vue/css/padding.css';
import './styles/global.css';

// === Build version for cache-busting ===
// Bump this when you ship a breaking client change so old PWA instances
// detect the mismatch and self-clear.
const BUILD_VERSION = 'v4-2026-05-07.4';
const STORED_VERSION = localStorage.getItem('concierge_build_version');

async function ensureFreshClient() {
  // 1. If the stored version doesn't match, nuke caches + SW and reload
  if (STORED_VERSION && STORED_VERSION !== BUILD_VERSION) {
    try {
      if ('caches' in window) {
        const names = await caches.keys();
        await Promise.all(names.map((n) => caches.delete(n)));
      }
      if ('serviceWorker' in navigator) {
        const regs = await navigator.serviceWorker.getRegistrations();
        await Promise.all(regs.map((r) => r.unregister()));
      }
      localStorage.setItem('concierge_build_version', BUILD_VERSION);
      console.info('[Concierge] Build mismatch — cleared caches, reloading…');
      location.reload();
      return false;
    } catch (e) {
      console.warn('[Concierge] cache cleanup failed', e);
    }
  }
  localStorage.setItem('concierge_build_version', BUILD_VERSION);

  // 2. When a new SW gets installed later, reload to pick it up
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.addEventListener('controllerchange', () => {
      console.info('[Concierge] New service worker took over — reloading');
      location.reload();
    });
  }
  return true;
}

ensureFreshClient().then((ok) => {
  if (!ok) return;
  const app = createApp(App)
    .use(IonicVue, { mode: 'md', animated: true })
    .use(createPinia())
    .use(router)
    .use(i18n);
  router.isReady().then(() => app.mount('#app'));
});
