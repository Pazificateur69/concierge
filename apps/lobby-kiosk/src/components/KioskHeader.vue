<script setup lang="ts">
import { computed, onMounted, ref, onUnmounted } from 'vue';
import { useI18n } from 'vue-i18n';
import { useRouter, useRoute } from 'vue-router';
import { useTenantStore } from '../stores/tenant';
import { useVoiceStore } from '../stores/voice';
import { SUPPORTED_LANGS } from '../i18n';

const props = defineProps<{ showBack?: boolean; title?: string; transparent?: boolean }>();

const router = useRouter();
const route = useRoute();
const i18n = useI18n();
const tenantStore = useTenantStore();
const voice = useVoiceStore();

const isHome = computed(() => route.path === '/');
const time = ref('');
let timer: number | null = null;

onMounted(() => {
  const tick = () => {
    time.value = new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
  };
  tick();
  timer = window.setInterval(tick, 1000 * 30);
});
onUnmounted(() => { if (timer) clearInterval(timer); });

function setLang(code: string) {
  i18n.locale.value = code;
  localStorage.setItem('lang', code);
}
</script>

<template>
  <header class="khdr" :class="{ 'khdr--transparent': transparent, 'khdr--solid': !transparent }">
    <div class="khdr__left">
      <button v-if="!isHome" class="khdr__icon-btn" @click="router.back()" aria-label="Retour">
        <span>←</span>
      </button>
      <button v-if="!isHome" class="khdr__icon-btn" @click="router.push('/')" aria-label="Accueil">
        <span>⌂</span>
      </button>
      <div v-if="title" class="khdr__title font-display">{{ title }}</div>
      <div v-else-if="isHome && tenantStore.tenant" class="khdr__brand">
        <span class="font-display">{{ tenantStore.tenant.name }}</span>
      </div>
    </div>

    <div class="khdr__right">
      <div class="khdr__time">{{ time }}</div>
      <button
        class="khdr__icon-btn khdr__voice"
        :class="{ on: voice.enabled }"
        @click="voice.toggle()"
        :aria-label="voice.enabled ? 'Désactiver la voix' : 'Activer la voix'"
      >
        <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor">
          <path d="M3 10v4a1 1 0 0 0 1 1h3l4 4V5L7 9H4a1 1 0 0 0-1 1zm13.5 2a4.5 4.5 0 0 0-2.5-4v8a4.5 4.5 0 0 0 2.5-4zM14 4.45v2.06a7 7 0 0 1 0 11v2.06a9 9 0 0 0 0-15.12z"/>
        </svg>
      </button>
      <div class="khdr__langs">
        <button
          v-for="lang in SUPPORTED_LANGS.filter((l) => tenantStore.tenant?.locales.includes(l.code as any))"
          :key="lang.code"
          class="khdr__lang"
          :class="{ active: i18n.locale.value === lang.code }"
          @click="setLang(lang.code)"
        >{{ lang.label }}</button>
      </div>
    </div>
  </header>
</template>

<style scoped>
.khdr {
  position: sticky; top: 0; z-index: 100;
  display: flex; align-items: center; justify-content: space-between;
  padding: var(--s-4) var(--s-6); gap: var(--s-4);
  min-height: 80px;
  transition: background var(--dur-base);
}
.khdr--solid { background: rgba(255, 255, 255, 0.95); backdrop-filter: blur(20px); border-bottom: 1px solid var(--c-border); }
.khdr--transparent { background: rgba(13, 39, 72, 0.25); backdrop-filter: blur(12px); border-bottom: 1px solid rgba(255,255,255,0.1); }
.khdr--transparent .khdr__title, .khdr--transparent .khdr__brand span { color: white; }
.khdr--transparent .khdr__time { background: rgba(255,255,255,0.15); color: white; }
.khdr--transparent .khdr__icon-btn { background: rgba(255,255,255,0.15); color: white; border-color: rgba(255,255,255,0.2); }
.khdr--transparent .khdr__langs { background: rgba(255,255,255,0.15); }
.khdr--transparent .khdr__lang { color: white; }
.khdr--transparent .khdr__lang.active { background: white; color: var(--c-primary); }

.khdr__left, .khdr__right { display: flex; align-items: center; gap: var(--s-3); }

.khdr__icon-btn {
  width: 52px; height: 52px;
  background: var(--c-bg-card); color: var(--c-primary);
  border: 1px solid var(--c-border); border-radius: var(--r-md);
  font-size: 22px; font-weight: 600;
  display: grid; place-items: center;
  transition: all var(--dur-fast) var(--ease-smooth);
}
.khdr__icon-btn:active { transform: scale(0.94); }

.khdr__title { font-size: 26px; color: var(--c-text); margin-left: var(--s-2); }
.khdr__brand span { font-size: 22px; color: var(--c-primary); }

.khdr__time {
  font-feature-settings: 'tnum'; font-size: 17px; font-weight: 600;
  color: var(--c-text-muted);
  padding: var(--s-2) var(--s-4);
  background: var(--c-bg-soft); border-radius: var(--r-md);
}

.khdr__voice.on {
  background: var(--c-accent); color: white;
  border-color: var(--c-accent); box-shadow: var(--sh-glow);
  animation: pulse 1.6s ease-in-out infinite;
}

.khdr__langs { display: flex; gap: 2px; padding: 4px; background: var(--c-bg-soft); border-radius: var(--r-md); }
.khdr__lang {
  padding: var(--s-2); border-radius: var(--r-sm); border: none;
  background: transparent; font-size: 18px; min-height: 40px; min-width: 40px;
  transition: all var(--dur-fast); color: var(--c-text-muted);
}
.khdr__lang.active { background: var(--c-bg-card); color: var(--c-primary); box-shadow: var(--sh-xs); }
</style>
