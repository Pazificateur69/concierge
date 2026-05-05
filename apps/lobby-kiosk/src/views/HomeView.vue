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
  { icon: '🗺️', key: 'map', target: '/map', image: 'https://images.unsplash.com/photo-1502602898657-3e91760cbb34?w=600&q=80' },
  { icon: '🛎️', key: 'services', target: '/services', image: 'https://images.unsplash.com/photo-1582719508461-905c673771fd?w=600&q=80' },
  { icon: '🍽️', key: 'menu', target: '/menu', image: 'https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=600&q=80' },
  { icon: '🧖', key: 'spa', target: '/services', image: 'https://images.unsplash.com/photo-1540555700478-4be289fbecef?w=600&q=80' },
  { icon: '☀️', key: 'weather', target: '/services', image: 'https://images.unsplash.com/photo-1500382017468-9049fed747ef?w=600&q=80' },
  { icon: '💬', key: 'help', target: '/help', image: 'https://images.unsplash.com/photo-1521737711867-e3b97375f902?w=600&q=80' },
];

onMounted(() => {
  const welcome = `${i18n.t('home.welcome')} ${tenantStore.tenant?.name ?? ''}. ${i18n.t('home.subtitle')}`;
  setTimeout(() => voice.speak(welcome, i18n.locale.value === 'fr' ? 'fr-FR' : 'en-US'), 500);
});
</script>

<template>
  <ion-page>
    <ion-content :fullscreen="true">
      <div class="home">
        <!-- HERO with full-bleed image -->
        <section class="hero">
          <div class="hero__bg">
            <img src="https://images.unsplash.com/photo-1566073771259-6a8506099945?w=1920&q=80" alt="" />
            <div class="hero__overlay"></div>
          </div>
          <KioskHeader transparent />
          <div class="hero__content fade-in-up">
            <div class="hero__chip">⭐ Hôtel 5 étoiles</div>
            <h1 class="hero__title font-display">
              <span>{{ $t('home.welcome') }}</span>
              <span class="hero__hotel">{{ tenantStore.tenant?.name }}</span>
            </h1>
            <p class="hero__subtitle">{{ $t('home.subtitle') }}</p>
            <div class="hero__scroll">
              <span class="hero__scroll-line"></span>
              <span class="hero__scroll-text">{{ $t('home.exploreLabel') }}</span>
              <span class="hero__scroll-line"></span>
            </div>
          </div>
        </section>

        <!-- CARDS -->
        <section class="grid-section">
          <div class="grid">
            <button
              v-for="(c, idx) in cards"
              :key="c.key"
              class="card"
              :style="{ animationDelay: `${idx * 80}ms` }"
              @click="router.push(c.target)"
            >
              <div class="card__image">
                <img :src="c.image" :alt="$t(`cards.${c.key}`)" loading="lazy" />
                <span class="card__icon">{{ c.icon }}</span>
              </div>
              <div class="card__body">
                <h3 class="card__title font-display">{{ $t(`cards.${c.key}`) }}</h3>
                <p class="card__desc">{{ $t(`cards.${c.key}Desc`) }}</p>
                <span class="card__cta">
                  {{ $t('home.discover') }}
                  <span class="card__arrow">→</span>
                </span>
              </div>
            </button>
          </div>
        </section>

        <footer class="home__footer">
          <div class="footer__brand">
            <span class="font-display">Concierge</span>
            <span class="footer__sep">·</span>
            <span>{{ tenantStore.tenant?.contact?.address }}, {{ tenantStore.tenant?.contact?.city }}</span>
          </div>
          <div class="footer__powered">Powered by Dymension</div>
        </footer>
      </div>
    </ion-content>
  </ion-page>
</template>

<style scoped>
.home { min-height: 100vh; background: var(--c-bg); }

.hero {
  position: relative; min-height: 78vh;
  display: flex; flex-direction: column;
  overflow: hidden;
}
.hero__bg { position: absolute; inset: 0; }
.hero__bg img {
  width: 100%; height: 100%; object-fit: cover;
  animation: kenburns 30s ease-in-out infinite alternate;
}
@keyframes kenburns { from { transform: scale(1); } to { transform: scale(1.08); } }
.hero__overlay {
  position: absolute; inset: 0;
  background: linear-gradient(180deg, rgba(13, 39, 72, 0.25) 0%, rgba(13, 39, 72, 0.85) 100%);
}

.hero__content {
  position: relative; flex: 1;
  display: flex; flex-direction: column; justify-content: center; align-items: center;
  text-align: center;
  padding: var(--s-12) var(--s-8);
  color: white;
  z-index: 1;
}

.hero__chip {
  display: inline-block;
  padding: var(--s-2) var(--s-5);
  background: rgba(255,255,255,0.15);
  border: 1px solid rgba(255,255,255,0.25);
  border-radius: var(--r-full);
  font-size: 14px; font-weight: 600;
  letter-spacing: 0.05em;
  margin-bottom: var(--s-6);
  backdrop-filter: blur(8px);
}

.hero__title {
  font-size: clamp(40px, 7vw, 88px);
  line-height: 1.05;
  margin: 0 0 var(--s-5);
  display: flex; flex-direction: column; gap: var(--s-2);
}
.hero__hotel { color: var(--c-accent); font-style: italic; }

.hero__subtitle {
  font-size: clamp(18px, 2.4vw, 26px);
  font-weight: 300; opacity: 0.92;
  max-width: 640px; margin: 0 auto var(--s-12);
}

.hero__scroll {
  display: flex; align-items: center; gap: var(--s-4);
  font-size: 13px; letter-spacing: 0.16em; text-transform: uppercase;
  color: rgba(255,255,255,0.75);
  font-weight: 600;
}
.hero__scroll-line { width: 32px; height: 1px; background: rgba(255,255,255,0.4); }
.hero__scroll-text { animation: pulse 2.4s ease-in-out infinite; }

.grid-section { padding: var(--s-16) var(--s-8); max-width: 1320px; margin: 0 auto; }

.grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(320px, 1fr));
  gap: var(--s-6);
}

.card {
  background: var(--c-bg-card);
  border-radius: var(--r-xl);
  border: 1px solid var(--c-border);
  overflow: hidden;
  cursor: pointer; text-align: left; padding: 0;
  transition: all var(--dur-base) var(--ease-smooth);
  box-shadow: var(--sh-sm);
  animation: fadeInUp 0.6s var(--ease-smooth) both;
  display: flex; flex-direction: column;
}
.card:active { transform: translateY(2px) scale(0.99); box-shadow: var(--sh-xs); }
.card:hover { box-shadow: var(--sh-lg); transform: translateY(-4px); }

.card__image {
  position: relative; aspect-ratio: 16 / 10; overflow: hidden;
  background: var(--c-bg-soft);
}
.card__image img { width: 100%; height: 100%; object-fit: cover; transition: transform var(--dur-slow); }
.card:hover .card__image img { transform: scale(1.06); }
.card__icon {
  position: absolute; top: var(--s-4); right: var(--s-4);
  width: 56px; height: 56px;
  font-size: 30px;
  background: rgba(255,255,255,0.95);
  backdrop-filter: blur(12px);
  border-radius: var(--r-md);
  display: grid; place-items: center;
  box-shadow: var(--sh-sm);
}

.card__body { padding: var(--s-6); flex: 1; display: flex; flex-direction: column; }
.card__title { font-size: 26px; margin: 0 0 var(--s-2); color: var(--c-text); }
.card__desc { color: var(--c-text-muted); font-size: 15px; line-height: 1.5; margin: 0 0 var(--s-5); flex: 1; }

.card__cta {
  display: inline-flex; align-items: center; gap: var(--s-2);
  font-weight: 700; color: var(--c-primary); font-size: 16px;
}
.card__arrow { transition: transform var(--dur-fast); }
.card:hover .card__arrow { transform: translateX(6px); }

.home__footer {
  padding: var(--s-8) var(--s-8) var(--s-12);
  text-align: center;
  border-top: 1px solid var(--c-border);
  background: var(--c-bg-card);
  color: var(--c-text-soft); font-size: 14px;
}
.footer__brand { display: flex; justify-content: center; gap: var(--s-3); align-items: center; flex-wrap: wrap; }
.footer__brand .font-display { color: var(--c-primary); font-size: 18px; }
.footer__sep { color: var(--c-text-soft); }
.footer__powered { margin-top: var(--s-2); opacity: 0.6; font-size: 12px; letter-spacing: 0.1em; text-transform: uppercase; }

@media (max-width: 700px) {
  .grid { grid-template-columns: 1fr; }
  .hero { min-height: 60vh; }
}
</style>
