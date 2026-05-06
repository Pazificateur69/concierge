<script setup lang="ts">
import { IonPage, IonContent } from '@ionic/vue';
import { onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { useI18n } from 'vue-i18n';
import KioskHeader from '../components/KioskHeader.vue';
import WeatherWidget from '../components/WeatherWidget.vue';
import ReviewsCarousel from '../components/ReviewsCarousel.vue';
import ConciergeChat from '../components/ConciergeChat.vue';
import Icon from '../components/Icon.vue';
import { useTenantStore } from '../stores/tenant';
import { useVoiceStore } from '../stores/voice';

const router = useRouter();
const i18n = useI18n();
const tenantStore = useTenantStore();
const voice = useVoiceStore();

const cards = [
  { icon: 'map', key: 'map', target: '/map', image: 'https://images.unsplash.com/photo-1502602898657-3e91760cbb34?w=900&q=80', meta: 'Lyon, 2e' },
  { icon: 'restaurant', key: 'menu', target: '/menu', image: 'https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=900&q=80', meta: 'Service 24/24' },
  { icon: 'spa', key: 'spa', target: '/services', image: 'https://images.unsplash.com/photo-1540555700478-4be289fbecef?w=900&q=80', meta: 'Sur réservation' },
  { icon: 'bell', key: 'services', target: '/services', image: 'https://images.unsplash.com/photo-1582719508461-905c673771fd?w=900&q=80', meta: 'Conciergerie' },
  { icon: 'sun', key: 'weather', target: '/services', image: 'https://images.unsplash.com/photo-1500382017468-9049fed747ef?w=900&q=80', meta: 'En direct' },
  { icon: 'help', key: 'help', target: '/help', image: 'https://images.unsplash.com/photo-1521737711867-e3b97375f902?w=900&q=80', meta: 'Multilingue' },
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
        <!-- HERO -->
        <section class="hero">
          <div class="hero__bg">
            <img src="https://images.unsplash.com/photo-1564501049412-61c2a3083791?w=1920&q=85" alt="" />
            <div class="hero__overlay"></div>
          </div>
          <KioskHeader transparent />
          <div class="hero__content fade-up">
            <span class="hero__eyebrow">Maison établie · Hôtel cinq étoiles</span>
            <h1 class="hero__title serif">
              <span class="hero__welcome">{{ $t('home.welcome') }}</span>
              <em class="hero__name">{{ tenantStore.tenant?.name }}</em>
            </h1>
            <hr class="hero__rule" />
            <p class="hero__subtitle">{{ $t('home.subtitle') }}</p>
            <div class="hero__weather">
              <WeatherWidget :city="tenantStore.tenant?.contact?.city" />
            </div>
          </div>
          <div class="hero__indicator">
            <span class="hero__indicator-line"></span>
            <span class="hero__indicator-text">Explorer</span>
          </div>
        </section>

        <!-- INTRO BAND -->
        <section class="intro">
          <div class="intro__inner">
            <span class="eyebrow">À votre service</span>
            <h2 class="intro__title serif">
              Une conciergerie discrète,<br/>
              <em>sept langues</em>, sans interruption.
            </h2>
            <p class="intro__text">
              Que vous souhaitiez explorer la ville, réserver une table, ou simplement reposer,
              chaque détail de votre séjour a été pensé. Choisissez ci-dessous l'expérience qui vous attend.
            </p>
          </div>
        </section>

        <!-- EDITORIAL GRID -->
        <section class="grid-section">
          <div class="grid">
            <article
              v-for="(c, idx) in cards"
              :key="c.key"
              class="card"
              :style="{ animationDelay: `${idx * 80}ms` }"
              @click="router.push(c.target)"
              :tabindex="0"
              @keydown.enter="router.push(c.target)"
            >
              <div class="card__image">
                <img :src="c.image" :alt="$t(`cards.${c.key}`)" loading="lazy" />
                <span class="card__overlay"></span>
              </div>
              <div class="card__body">
                <div class="card__top">
                  <span class="card__num">{{ String(idx + 1).padStart(2, '0') }}</span>
                  <span class="card__meta">{{ c.meta }}</span>
                </div>
                <h3 class="card__title serif">{{ $t(`cards.${c.key}`) }}</h3>
                <p class="card__desc">{{ $t(`cards.${c.key}Desc`) }}</p>
                <span class="card__cta">
                  <span>Découvrir</span>
                  <Icon name="arrow-right" :size="14" />
                </span>
              </div>
            </article>
          </div>
        </section>

        <!-- REVIEWS BAND -->
        <section class="reviews">
          <div class="reviews__inner">
            <header class="reviews__header fade-up">
              <span class="eyebrow">Témoignages</span>
              <h2 class="serif">
                <em>L'art de l'accueil,</em> selon nos hôtes
              </h2>
            </header>
            <div class="fade-up" style="animation-delay: 200ms">
              <ReviewsCarousel />
            </div>
          </div>
        </section>

        <!-- COLOPHON / FOOTER -->
        <footer class="colophon">
          <div class="colophon__row">
            <div class="colophon__brand">
              <span class="khdr__brand-mark">C</span>
              <div>
                <span class="eyebrow">Concierge</span>
                <span class="colophon__name serif">{{ tenantStore.tenant?.name }}</span>
              </div>
            </div>
            <div class="colophon__col">
              <span class="eyebrow">Adresse</span>
              <span>{{ tenantStore.tenant?.contact?.address }}</span>
              <span>{{ tenantStore.tenant?.contact?.city }}, {{ tenantStore.tenant?.contact?.country }}</span>
            </div>
            <div class="colophon__col">
              <span class="eyebrow">Contact</span>
              <span>{{ tenantStore.tenant?.contact?.phone }}</span>
              <span>{{ tenantStore.tenant?.contact?.email }}</span>
            </div>
            <div class="colophon__col">
              <span class="eyebrow">Réception</span>
              <span>Ouverte 24/24</span>
              <span>Service voiturier</span>
            </div>
          </div>
          <hr class="rule" />
          <div class="colophon__bottom">
            <span>© {{ new Date().getFullYear() }} {{ tenantStore.tenant?.name }} · Tous droits réservés</span>
            <span class="colophon__dymension">Powered by Dymension</span>
          </div>
        </footer>

        <ConciergeChat />
      </div>
    </ion-content>
  </ion-page>
</template>

<style scoped>
.home { min-height: 100vh; background: var(--c-bg); }

/* ─── HERO ─── */
.hero { position: relative; min-height: 100vh; display: flex; flex-direction: column; overflow: hidden; }
.hero__bg { position: absolute; inset: 0; }
.hero__bg img { width: 100%; height: 100%; object-fit: cover; transform: scale(1.02); }
.hero__overlay {
  position: absolute; inset: 0;
  background:
    linear-gradient(180deg, rgba(10,14,20,0.20) 0%, rgba(10,14,20,0.65) 60%, rgba(10,14,20,0.85) 100%),
    radial-gradient(ellipse at 50% 90%, rgba(184,152,90,0.10) 0%, transparent 60%);
}

.hero__content {
  position: relative; flex: 1;
  display: flex; flex-direction: column; justify-content: center; align-items: center;
  text-align: center; padding: var(--s-12) var(--s-8);
  color: white; z-index: 1;
}

.hero__eyebrow {
  font-size: 11px; font-weight: 600;
  letter-spacing: 0.28em; text-transform: uppercase;
  color: var(--c-accent-soft);
  margin-bottom: var(--s-8);
}

.hero__title {
  font-size: clamp(48px, 9vw, 128px);
  line-height: 0.95;
  margin: 0; font-weight: 500;
  display: flex; flex-direction: column; gap: var(--s-2);
  letter-spacing: -0.025em;
}
.hero__welcome { font-style: italic; opacity: 0.9; font-size: 0.5em; font-weight: 400; }
.hero__name { font-style: italic; color: var(--c-accent-soft); font-weight: 500; }

.hero__rule {
  width: 80px; height: 1px;
  background: var(--c-accent);
  border: 0; margin: var(--s-8) auto;
}

.hero__subtitle {
  font-size: clamp(16px, 1.6vw, 18px);
  font-weight: 400; opacity: 0.82;
  max-width: 560px; margin: 0 auto var(--s-12);
  line-height: 1.55;
  letter-spacing: 0.005em;
}

.hero__weather { margin-bottom: var(--s-8); }

.hero__indicator {
  position: relative; z-index: 1;
  display: flex; align-items: center; gap: var(--s-3);
  justify-content: center; padding-bottom: var(--s-8);
  font-size: 10px; letter-spacing: 0.32em; text-transform: uppercase;
  color: rgba(255,255,255,0.7); font-weight: 600;
}
.hero__indicator-line { width: 24px; height: 1px; background: rgba(255,255,255,0.4); }

/* ─── INTRO ─── */
.intro { padding: var(--s-24) var(--s-8); border-bottom: 1px solid var(--c-border); }
.intro__inner { max-width: 880px; margin: 0 auto; text-align: center; }
.intro__title {
  font-size: clamp(32px, 5vw, 56px);
  line-height: 1.15; margin: var(--s-3) 0 var(--s-6);
  font-weight: 500; color: var(--c-ink);
  letter-spacing: -0.02em;
}
.intro__title em { color: var(--c-accent-deep); font-style: italic; }
.intro__text {
  font-size: 17px; line-height: 1.7; color: var(--c-text-muted);
  max-width: 640px; margin: 0 auto;
}

/* ─── EDITORIAL GRID ─── */
.grid-section { padding: 0 var(--s-8) var(--s-24); max-width: 1280px; margin: 0 auto; }
.grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: var(--s-6);
}

.card {
  background: var(--c-bg-card);
  border: 1px solid var(--c-border);
  cursor: pointer;
  transition: all var(--dur-base) var(--ease-soft);
  animation: fadeUp 0.7s var(--ease-soft) both;
  display: flex; flex-direction: column;
  outline: none;
  overflow: hidden;
}
.card:hover { border-color: var(--c-ink); box-shadow: var(--sh-md); transform: translateY(-3px); }
.card:focus-visible { border-color: var(--c-accent); }

.card__image {
  position: relative; aspect-ratio: 4 / 3; overflow: hidden;
  background: var(--c-paper);
}
.card__image img {
  width: 100%; height: 100%; object-fit: cover;
  transition: transform 0.7s var(--ease-soft);
  filter: brightness(0.96);
}
.card:hover .card__image img { transform: scale(1.05); }
.card__overlay {
  position: absolute; inset: 0;
  background: linear-gradient(180deg, transparent 60%, rgba(10,14,20,0.4) 100%);
  pointer-events: none;
}

.card__body { padding: var(--s-6) var(--s-6) var(--s-8); flex: 1; display: flex; flex-direction: column; gap: var(--s-3); }

.card__top { display: flex; justify-content: space-between; align-items: center; }
.card__num {
  font-family: var(--c-font-display);
  font-size: 13px; font-weight: 500;
  color: var(--c-text-soft); letter-spacing: 0.05em;
  font-feature-settings: 'tnum';
}
.card__meta {
  font-size: 10px; font-weight: 600; letter-spacing: 0.16em; text-transform: uppercase;
  color: var(--c-accent-deep);
}

.card__title {
  font-size: 28px; line-height: 1.1; margin: 0;
  color: var(--c-ink); font-weight: 500; font-style: italic;
  letter-spacing: -0.015em;
}

.card__desc {
  color: var(--c-text-muted);
  font-size: 14px; line-height: 1.55; margin: 0; flex: 1;
}

.card__cta {
  display: inline-flex; align-items: center; gap: var(--s-2);
  font-size: 12px; font-weight: 600;
  text-transform: uppercase; letter-spacing: 0.16em;
  color: var(--c-ink); margin-top: var(--s-4);
}
.card__cta :deep(svg) { transition: transform var(--dur-base); }
.card:hover .card__cta :deep(svg) { transform: translateX(4px); }

/* ─── REVIEWS ─── */
.reviews { padding: var(--s-24) var(--s-8); background: var(--c-paper); border-top: 1px solid var(--c-rule); border-bottom: 1px solid var(--c-rule); }
.reviews__inner { max-width: 1100px; margin: 0 auto; }
.reviews__header { text-align: center; margin-bottom: var(--s-12); }
.reviews__header h2 {
  font-size: clamp(28px, 4vw, 44px);
  margin: var(--s-3) 0 0; line-height: 1.2;
  color: var(--c-ink); font-weight: 500;
}
.reviews__header em { color: var(--c-accent-deep); font-style: italic; }

/* ─── COLOPHON ─── */
.colophon { padding: var(--s-16) var(--s-8) var(--s-8); background: var(--c-ink); color: var(--c-paper); }
.colophon__row {
  display: grid; grid-template-columns: 1.4fr 1fr 1fr 1fr;
  gap: var(--s-12);
  max-width: 1280px; margin: 0 auto;
}
.colophon__brand { display: flex; align-items: center; gap: var(--s-3); }
.colophon__brand .khdr__brand-mark { background: var(--c-paper); color: var(--c-ink); }
.colophon__brand .eyebrow { color: var(--c-text-soft); display: block; }
.colophon__name { font-size: 19px; color: white; display: block; margin-top: 2px; }

.colophon__col { display: flex; flex-direction: column; gap: var(--s-2); font-size: 14px; }
.colophon__col .eyebrow { color: var(--c-accent-soft); margin-bottom: var(--s-2); }
.colophon__col span { color: rgba(245,240,232,0.75); line-height: 1.55; }

.colophon .rule {
  background: linear-gradient(90deg, transparent, rgba(245,240,232,0.18), transparent);
  margin: var(--s-12) auto var(--s-4); max-width: 1280px;
}
.colophon__bottom {
  display: flex; justify-content: space-between; align-items: center;
  max-width: 1280px; margin: 0 auto;
  font-size: 12px; color: var(--c-text-soft);
  letter-spacing: 0.04em;
}
.colophon__dymension { letter-spacing: 0.16em; text-transform: uppercase; font-weight: 600; }

@media (max-width: 1000px) {
  .grid { grid-template-columns: repeat(2, 1fr); }
  .colophon__row { grid-template-columns: 1fr 1fr; }
}
@media (max-width: 700px) {
  .grid { grid-template-columns: 1fr; }
  .hero { min-height: 80vh; }
  .colophon__row { grid-template-columns: 1fr; gap: var(--s-6); }
  .colophon__bottom { flex-direction: column; gap: var(--s-3); text-align: center; }
}
</style>
