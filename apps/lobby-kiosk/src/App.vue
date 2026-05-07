<script setup lang="ts">
import { IonApp, IonRouterOutlet } from '@ionic/vue';
import { onMounted, computed, ref, onUnmounted } from 'vue';
import { useTenantStore } from './stores/tenant';
import { useIdleStore } from './stores/idle';
import { useCartStore } from './stores/cart';
import { useRouter } from 'vue-router';
import { storeToRefs } from 'pinia';
import { i18n, RTL_LANGS } from './i18n';

const tenantStore = useTenantStore();
const idleStore = useIdleStore();
const cartStore = useCartStore();
const router = useRouter();

const { isWarning, countdown } = storeToRefs(idleStore);

const showError = computed(() => !tenantStore.loading && !tenantStore.tenant && !!tenantStore.error);
const showLoading = computed(() => tenantStore.loading || (!tenantStore.tenant && !tenantStore.error));
const slowBoot = ref(false);
let slowBootTimer: any = null;

const nightMode = ref(false);
const screensaverActive = ref(false);
const screensaverIdx = ref(0);
const screensaverPhotos = [
  'https://images.unsplash.com/photo-1551882547-ff40c63fe5fa?w=2000&q=85',
  'https://images.unsplash.com/photo-1582719508461-905c673771fd?w=2000&q=85',
  'https://images.unsplash.com/photo-1564501049412-61c2a3083791?w=2000&q=85',
  'https://images.unsplash.com/photo-1455587734955-081b22074882?w=2000&q=85',
];
const quotes = [
  '« La cuisine, c\'est l\'envoi de l\'amour à travers la nourriture. » — Paul Bocuse',
  '« Lyon est la ville où je peux le mieux respirer. » — Édouard Herriot',
  '« Bien manger, c\'est aimer la vie. »',
];

let nightCheckInterval: any = null;
let screensaverInterval: any = null;

function applyNightMode() {
  const h = new Date().getHours();
  const isNight = h >= 22 || h < 7;
  nightMode.value = isNight;
  document.documentElement.classList.toggle('night', isNight);
}

function applyScreensaver() {
  const h = new Date().getHours();
  const m = new Date().getMinutes();
  const dueScreensaver = (h >= 0 && h < 6) && idleStore.isWarning === false;
  // additional rule: only show after 60s without activity in those hours
  if (dueScreensaver && !screensaverActive.value) {
    screensaverActive.value = true;
    screensaverInterval = setInterval(() => {
      screensaverIdx.value = (screensaverIdx.value + 1) % screensaverPhotos.length;
    }, 8000);
  } else if (!dueScreensaver && screensaverActive.value) {
    screensaverActive.value = false;
    if (screensaverInterval) clearInterval(screensaverInterval);
  }
}

function applyDirection(locale: string) {
  document.documentElement.dir = RTL_LANGS.includes(locale) ? 'rtl' : 'ltr';
  document.documentElement.lang = locale;
}

onMounted(async () => {
  const params = new URLSearchParams(window.location.search);
  const slug = params.get('tenant') || import.meta.env.VITE_DEFAULT_TENANT || 'royal-lyon';
  slowBootTimer = setTimeout(() => { slowBoot.value = true; }, 6000);
  await tenantStore.load(slug);
  if (slowBootTimer) clearTimeout(slowBootTimer);
  slowBoot.value = false;

  idleStore.start(() => {
    cartStore.clear();
    router.push('/');
  });

  applyNightMode(); applyScreensaver(); applyDirection(i18n.global.locale.value);
  nightCheckInterval = setInterval(() => { applyNightMode(); applyScreensaver(); }, 60000);

  if (params.get('kiosk') === '1') {
    document.documentElement.requestFullscreen?.().catch(() => undefined);
  }
});

onUnmounted(() => {
  if (nightCheckInterval) clearInterval(nightCheckInterval);
  if (screensaverInterval) clearInterval(screensaverInterval);
});

function retry() { window.location.reload(); }
function stayHere() { idleStore.dismiss(); }
function dismissScreensaver() {
  screensaverActive.value = false;
  idleStore.reset();
}
</script>

<template>
  <ion-app>
    <!-- Boot loading -->
    <div v-if="showLoading" class="boot">
      <div class="boot__mark">C</div>
      <span class="boot__brand serif italic">Concierge</span>
      <div class="boot__spinner"></div>
      <span class="boot__hint">{{ slowBoot ? 'Réveil du serveur en cours, quelques instants…' : 'Préparation de votre expérience…' }}</span>
      <span v-if="slowBoot" class="boot__detail">Premier accès depuis un moment — Render rallume l'instance.</span>
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

    <!-- Night-mode + screensaver -->
    <Transition name="screensaver-fade">
      <div v-if="screensaverActive" class="screensaver" @click="dismissScreensaver" @touchstart="dismissScreensaver">
        <div v-for="(p, i) in screensaverPhotos" :key="i" class="screensaver__bg" :class="{ active: screensaverIdx === i }" :style="{ backgroundImage: 'url(' + p + ')' }"></div>
        <div class="screensaver__overlay"></div>
        <div class="screensaver__content">
          <div class="screensaver__mark">C</div>
          <span class="screensaver__brand serif italic">Concierge</span>
          <p class="screensaver__quote serif italic">{{ quotes[screensaverIdx % quotes.length] }}</p>
          <span class="screensaver__hint">Touchez pour réveiller</span>
        </div>
      </div>
    </Transition>

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

/* Screensaver */
.screensaver {
  position: fixed; inset: 0; z-index: 8000; cursor: pointer; overflow: hidden;
}
.screensaver__bg {
  position: absolute; inset: 0; background-size: cover; background-position: center;
  opacity: 0; transition: opacity 1.6s ease;
  filter: brightness(0.6) saturate(0.85);
}
.screensaver__bg.active { opacity: 1; }
.screensaver__overlay { position: absolute; inset: 0; background: linear-gradient(180deg, rgba(20,32,46,0.4) 0%, rgba(20,32,46,0.85) 100%); }
.screensaver__content {
  position: relative; z-index: 1; height: 100%;
  display: flex; flex-direction: column; align-items: center; justify-content: center;
  gap: 24px; padding: 40px; text-align: center; color: white;
}
.screensaver__mark { width: 64px; height: 64px; background: rgba(245,240,232,0.95); color: var(--c-ink); display: grid; place-items: center; font-family: 'Cormorant Garamond', serif; font-size: 32px; font-weight: 600; }
.screensaver__brand { font-size: 32px; color: white; margin-top: -8px; }
.screensaver__quote { font-size: 22px; max-width: 580px; line-height: 1.5; color: rgba(255,255,255,0.9); animation: quoteIn 1.5s ease; }
.screensaver__hint { font-size: 11px; letter-spacing: 0.2em; text-transform: uppercase; color: rgba(255,255,255,0.6); margin-top: 32px; }
@keyframes quoteIn { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: translateY(0); } }
.screensaver-fade-enter-active, .screensaver-fade-leave-active { transition: opacity 0.6s ease; }
.screensaver-fade-enter-from, .screensaver-fade-leave-to { opacity: 0; }
</style>
