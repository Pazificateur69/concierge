<script setup lang="ts">
import { IonPage, IonContent } from '@ionic/vue';
import { onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { useI18n } from 'vue-i18n';
import KioskHeader from '../components/KioskHeader.vue';
import { useTenantStore } from '../stores/tenant';
import { useVoiceStore } from '../stores/voice';

const router = useRouter();
const i18n = useI18n();
const tenantStore = useTenantStore();
const voice = useVoiceStore();

const cards = [
  { icon: '🗺️', key: 'map', target: '/map' },
  { icon: '🛎️', key: 'services', target: '/services' },
  { icon: '🍽️', key: 'menu', target: '/menu' },
  { icon: '🧖', key: 'spa', target: '/services' },
  { icon: '☀️', key: 'weather', target: '/services' },
  { icon: '💬', key: 'help', target: '/help' },
];

onMounted(() => {
  const welcome = `${i18n.t('home.welcome')} ${tenantStore.tenant?.name ?? ''}. ${i18n.t('home.subtitle')}`;
  setTimeout(() => voice.speak(welcome, i18n.locale.value === 'fr' ? 'fr-FR' : 'en-US'), 500);
});
</script>

<template>
  <ion-page>
    <KioskHeader />
    <ion-content :fullscreen="true">
      <div class="home">
        <div class="home__hero">
          <h1 class="home__welcome">
            <span>{{ $t('home.welcome') }}</span>
            <span class="home__hotel">{{ tenantStore.tenant?.name }}</span>
          </h1>
          <p class="home__subtitle">{{ $t('home.subtitle') }}</p>
        </div>

        <div class="home__grid">
          <button
            v-for="c in cards"
            :key="c.key"
            class="home__card"
            @click="router.push(c.target)"
          >
            <span class="home__card-icon">{{ c.icon }}</span>
            <span class="home__card-label">{{ $t(`cards.${c.key}`) }}</span>
          </button>
        </div>

        <footer class="home__footer">
          <small>Powered by <strong>Concierge</strong> · {{ tenantStore.tenant?.contact?.address }}</small>
        </footer>
      </div>
    </ion-content>
  </ion-page>
</template>

<style scoped>
.home {
  min-height: 100%; padding: 32px 48px;
  background: linear-gradient(135deg, var(--c-bg) 0%, #ffffff 100%);
  display: flex; flex-direction: column; gap: 32px;
}
.home__hero { text-align: center; padding: 32px 0 16px; }
.home__welcome {
  font-family: var(--c-font-display, 'Playfair Display'), serif;
  font-size: 64px; font-weight: 700; line-height: 1.1;
  color: var(--c-text); margin: 0;
  display: flex; flex-direction: column; gap: 8px;
}
.home__hotel { color: var(--c-primary); }
.home__subtitle { font-size: 24px; color: rgba(0,0,0,0.6); margin-top: 16px; }
.home__grid {
  flex: 1;
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 24px;
  max-width: 1200px;
  margin: 0 auto;
  width: 100%;
}
.home__card {
  background: white;
  border: none;
  border-radius: 24px;
  padding: 48px 24px;
  cursor: pointer;
  display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 16px;
  box-shadow: 0 4px 24px rgba(0,0,0,0.06);
  transition: all 0.2s ease;
  min-height: 220px;
}
.home__card:active {
  transform: scale(0.97);
  box-shadow: 0 2px 12px rgba(0,0,0,0.1);
  background: var(--c-accent, #d4a85a);
}
.home__card-icon { font-size: 80px; }
.home__card-label {
  font-size: 28px; font-weight: 600; color: var(--c-text);
}
.home__footer { text-align: center; padding: 16px; opacity: 0.5; }
@media (max-width: 900px) {
  .home__grid { grid-template-columns: repeat(2, 1fr); }
  .home__welcome { font-size: 44px; }
  .home__card-icon { font-size: 56px; }
  .home__card-label { font-size: 20px; }
}
</style>
