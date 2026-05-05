<script setup lang="ts">
import { computed } from 'vue';
import { useI18n } from 'vue-i18n';
import { useRouter, useRoute } from 'vue-router';
import { useTenantStore } from '../stores/tenant';
import { useVoiceStore } from '../stores/voice';
import { SUPPORTED_LANGS } from '../i18n';

const props = defineProps<{ showBack?: boolean; title?: string }>();

const router = useRouter();
const route = useRoute();
const i18n = useI18n();
const tenantStore = useTenantStore();
const voice = useVoiceStore();

const isHome = computed(() => route.path === '/');

function setLang(code: string) {
  i18n.locale.value = code;
  localStorage.setItem('lang', code);
}
</script>

<template>
  <header class="khdr">
    <div class="khdr__left">
      <button v-if="!isHome && (showBack ?? true)" class="khdr__btn" @click="router.back()">← {{ $t('nav.back') }}</button>
      <button v-if="!isHome" class="khdr__btn" @click="router.push('/')">⌂ {{ $t('nav.home') }}</button>
    </div>
    <div v-if="title" class="khdr__title">{{ title }}</div>
    <div v-else-if="tenantStore.tenant" class="khdr__brand">
      <img :src="tenantStore.tenant.theme.logoUrl" :alt="tenantStore.tenant.name" />
    </div>

    <div class="khdr__right">
      <button class="khdr__voice" :class="{ on: voice.enabled }" @click="voice.toggle()" :aria-label="voice.enabled ? $t('voice.off') : $t('voice.on')">
        🔊
      </button>
      <div class="khdr__langs">
        <button
          v-for="lang in SUPPORTED_LANGS.filter((l) => tenantStore.tenant?.locales.includes(l.code as any))"
          :key="lang.code"
          class="khdr__lang"
          :class="{ active: i18n.locale.value === lang.code }"
          @click="setLang(lang.code)"
        >
          {{ lang.label }}
        </button>
      </div>
    </div>
  </header>
</template>

<style scoped>
.khdr {
  display: flex; align-items: center; justify-content: space-between;
  padding: 16px 24px; gap: 16px;
  background: rgba(255,255,255,0.95);
  backdrop-filter: blur(8px);
  border-bottom: 1px solid rgba(0,0,0,0.06);
  min-height: 80px;
}
.khdr__left, .khdr__right { display: flex; align-items: center; gap: 12px; }
.khdr__btn {
  background: var(--c-primary, #1a4d8c); color: white;
  border: none; border-radius: 12px; padding: 14px 20px;
  font-size: 16px; font-weight: 600; cursor: pointer;
  min-height: 56px;
}
.khdr__btn:active { transform: scale(0.97); }
.khdr__brand img { max-height: 56px; max-width: 200px; object-fit: contain; }
.khdr__title { font-family: var(--c-font-display, 'Playfair Display'), serif; font-size: 28px; font-weight: 700; color: var(--c-text); }
.khdr__voice {
  width: 56px; height: 56px; border-radius: 12px; border: 2px solid rgba(0,0,0,0.12);
  background: white; font-size: 24px; cursor: pointer;
}
.khdr__voice.on { background: var(--c-accent, #d4a85a); border-color: var(--c-accent); }
.khdr__langs { display: flex; gap: 6px; }
.khdr__lang {
  padding: 12px 16px; border-radius: 10px; border: 2px solid transparent;
  background: rgba(0,0,0,0.05); cursor: pointer; font-size: 16px; font-weight: 600;
  min-height: 56px;
}
.khdr__lang.active { background: var(--c-primary, #1a4d8c); color: white; }
</style>
