<script setup lang="ts">
import { IonApp, IonRouterOutlet } from '@ionic/vue';
import { onMounted, computed } from 'vue';
import { useTenantStore } from './stores/tenant';
import { useIdleStore } from './stores/idle';
import { useCartStore } from './stores/cart';
import { useRouter } from 'vue-router';
import { storeToRefs } from 'pinia';

const tenantStore = useTenantStore();
const idleStore = useIdleStore();
const cartStore = useCartStore();
const router = useRouter();

const { isWarning, countdown } = storeToRefs(idleStore);

const showError = computed(() => !tenantStore.loading && !tenantStore.tenant && !!tenantStore.error);
const showLoading = computed(() => tenantStore.loading || (!tenantStore.tenant && !tenantStore.error));

onMounted(async () => {
  const params = new URLSearchParams(window.location.search);
  const slug = params.get('tenant') || import.meta.env.VITE_DEFAULT_TENANT || 'royal-lyon';
  await tenantStore.load(slug);

  idleStore.start(() => {
    cartStore.clear();
    router.push('/');
  });

  if (params.get('kiosk') === '1') {
    document.documentElement.requestFullscreen?.().catch(() => undefined);
  }
});

function retry() { window.location.reload(); }
function stayHere() { idleStore.dismiss(); }
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

    <!-- Idle warning modal -->
    <Transition name="idle-fade">
      <div v-if="isWarning" class="idle-modal" @click.self="stayHere">
        <div class="idle-card">
          <div class="idle-mark">C</div>
          <span class="eyebrow">Inactivité détectée</span>
          <h2 class="serif">Toujours là ?</h2>
          <p>Sans réponse, nous retournerons à l'accueil dans <b class="serif">{{ countdown }}</b> seconde<span v-if="countdown > 1">s</span>.</p>
          <div class="idle-progress"><div class="idle-progress__bar" :style="{ width: (countdown / 15) * 100 + '%' }"></div></div>
          <div class="idle-actions">
            <button class="idle-btn idle-btn--ghost" @click="stayHere">Rester ici</button>
            <button class="idle-btn idle-btn--primary" @click="$router.push('/'); stayHere()">Retour à l'accueil</button>
          </div>
        </div>
      </div>
    </Transition>
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

/* Idle warning */
.idle-modal {
  position: fixed; inset: 0; z-index: 9999;
  background: rgba(20,32,46,0.55); backdrop-filter: blur(8px);
  display: grid; place-items: center; padding: 24px;
}
.idle-card {
  background: var(--c-bg-card); padding: 40px 36px; max-width: 440px; width: 100%;
  text-align: center; display: flex; flex-direction: column; align-items: center; gap: 12px;
  box-shadow: 0 32px 64px rgba(20,32,46,0.32);
}
.idle-mark { width: 56px; height: 56px; background: var(--c-ink); color: var(--c-paper); display: grid; place-items: center; font-family: 'Cormorant Garamond', serif; font-size: 28px; font-weight: 600; }
.idle-card .eyebrow { font-size: 10px; font-weight: 600; letter-spacing: 0.18em; text-transform: uppercase; color: var(--c-accent-deep); margin-top: 4px; }
.idle-card h2 { font-family: 'Cormorant Garamond', serif; font-size: 32px; font-weight: 500; margin: 0; color: var(--c-ink); letter-spacing: -0.01em; }
.idle-card p { color: var(--c-text-muted); font-size: 14px; line-height: 1.6; margin: 0 0 8px; }
.idle-card p b { color: var(--c-ink); font-size: 18px; font-feature-settings: 'tnum'; }
.idle-progress { width: 100%; height: 2px; background: var(--c-border); overflow: hidden; margin-bottom: 8px; }
.idle-progress__bar { height: 100%; background: var(--c-accent); transition: width 1s linear; }
.idle-actions { display: flex; gap: 10px; width: 100%; }
.idle-btn { flex: 1; padding: 14px 16px; font-size: 12px; font-weight: 600; letter-spacing: 0.14em; text-transform: uppercase; border: 1px solid var(--c-border-strong); cursor: pointer; font-family: inherit; transition: all 0.2s; }
.idle-btn--ghost { background: transparent; color: var(--c-ink); }
.idle-btn--ghost:hover { background: var(--c-paper); }
.idle-btn--primary { background: var(--c-ink); color: white; border-color: var(--c-ink); }
.idle-btn--primary:hover { background: var(--c-accent); border-color: var(--c-accent); }

.idle-fade-enter-active, .idle-fade-leave-active { transition: opacity 0.25s ease, transform 0.25s ease; }
.idle-fade-enter-from, .idle-fade-leave-to { opacity: 0; }
.idle-fade-enter-from .idle-card, .idle-fade-leave-to .idle-card { transform: translateY(8px) scale(0.98); }
</style>
