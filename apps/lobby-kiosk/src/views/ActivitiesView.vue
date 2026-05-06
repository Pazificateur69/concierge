<script setup lang="ts">
import { IonPage, IonContent } from '@ionic/vue';
import KioskHeader from '../components/KioskHeader.vue';
import Icon from '../components/Icon.vue';
import { computed, onMounted, ref } from 'vue';

const activities = [
  { name: 'Visite guidée du Vieux Lyon', time: '10h00', duration: '2h30', price: 45, image: 'https://images.unsplash.com/photo-1568322445389-f64ac2515099?w=800&q=80', tag: 'Patrimoine' },
  { name: 'Croisière sur la Saône', time: '12h00', duration: '1h30', price: 32, image: 'https://images.unsplash.com/photo-1551775820-d2cb4dba2c66?w=800&q=80', tag: 'Découverte' },
  { name: 'Atelier macarons à la Bocuse', time: '14h30', duration: '3h', price: 95, image: 'https://images.unsplash.com/photo-1558326567-98ae2405596b?w=800&q=80', tag: 'Gastronomie' },
  { name: 'Dégustation de vins du Beaujolais', time: '16h00', duration: '2h', price: 65, image: 'https://images.unsplash.com/photo-1474722883778-792e7990302f?w=800&q=80', tag: 'Œnologie' },
  { name: 'Spectacle de Guignol', time: '18h00', duration: '1h', price: 18, image: 'https://images.unsplash.com/photo-1503095396549-807759245b35?w=800&q=80', tag: 'Tradition' },
  { name: 'Dîner étoilé au Pavillon', time: '19h30', duration: '3h', price: 220, image: 'https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=800&q=80', tag: 'Étoile Michelin' },
];

// Live time + weather mock
const now = ref(new Date());
const greeting = computed(() => {
  const h = now.value.getHours();
  if (h < 11) return 'Bonjour';
  if (h < 18) return 'Bel après-midi';
  return 'Bonsoir';
});

const date = computed(() => now.value.toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' }));
const temp = computed(() => {
  const m = now.value.getMonth();
  if (m >= 5 && m <= 8) return 24;
  if (m >= 9 && m <= 10) return 14;
  if (m >= 11 || m <= 1) return 6;
  return 18;
});
const condition = computed(() => {
  const m = now.value.getMonth();
  if (m >= 5 && m <= 8) return 'Ensoleillé';
  if (m >= 11 || m <= 1) return 'Frais';
  return 'Doux';
});

onMounted(() => {
  setInterval(() => now.value = new Date(), 60000);
});
</script>

<template>
  <ion-page>
    <KioskHeader title="Activités" />
    <ion-content :fullscreen="true">
      <div class="act">
        <header class="act__hero fade-up">
          <span class="eyebrow">Aujourd'hui à Lyon</span>
          <h1 class="serif">
            {{ greeting }}.<br/>
            <em>Quel programme</em> souhaitez-vous ?
          </h1>
        </header>

        <!-- WEATHER PANEL -->
        <section class="weather-panel fade-up" style="animation-delay: 100ms">
          <div class="weather-panel__col">
            <span class="eyebrow">Aujourd'hui</span>
            <span class="weather-panel__date serif italic">{{ date }}</span>
          </div>
          <div class="weather-panel__divider"></div>
          <div class="weather-panel__col">
            <span class="eyebrow">Météo Lyon centre</span>
            <div class="weather-panel__temp">
              <span class="weather-panel__num serif">{{ temp }}°</span>
              <span class="weather-panel__cond">{{ condition }}</span>
            </div>
          </div>
          <div class="weather-panel__divider"></div>
          <div class="weather-panel__col">
            <span class="eyebrow">Lever / Coucher</span>
            <span class="weather-panel__sun">07:34 / 18:42</span>
          </div>
          <div class="weather-panel__divider"></div>
          <div class="weather-panel__col">
            <span class="eyebrow">Indice UV</span>
            <span class="weather-panel__uv serif">3</span>
          </div>
        </section>

        <hr class="rule" />

        <section class="act__list">
          <header class="act__list-head">
            <span class="eyebrow">Sélection du jour</span>
            <h2 class="serif">Six expériences <em>à votre porte</em></h2>
          </header>

          <div class="acts-grid">
            <article v-for="(a, idx) in activities" :key="a.name" class="act-card" :style="{ animationDelay: `${idx * 60}ms` }">
              <div class="act-card__image">
                <img :src="a.image" :alt="a.name" loading="lazy" />
                <span class="act-card__time serif italic">{{ a.time }}</span>
              </div>
              <div class="act-card__body">
                <span class="eyebrow">{{ a.tag }}</span>
                <h3 class="serif">{{ a.name }}</h3>
                <div class="act-card__meta">
                  <span class="act-card__duration">{{ a.duration }}</span>
                  <span class="act-card__sep">·</span>
                  <span class="act-card__price serif">{{ a.price }} €</span>
                </div>
                <button class="act-card__cta">
                  Réserver <Icon name="arrow-right" :size="13" />
                </button>
              </div>
            </article>
          </div>
        </section>
      </div>
    </ion-content>
  </ion-page>
</template>

<style scoped>
.act { min-height: calc(100vh - 80px); padding: var(--s-12) var(--s-8) var(--s-20); max-width: 1320px; margin: 0 auto; }

.act__hero { text-align: center; max-width: 700px; margin: 0 auto var(--s-12); }
.act__hero h1 { font-size: clamp(36px, 5vw, 56px); line-height: 1.15; margin: var(--s-3) 0 0; font-weight: 500; }
.act__hero h1 em { color: var(--c-accent-deep); font-style: italic; }

.weather-panel {
  display: grid; grid-template-columns: 1fr auto 1fr auto 1fr auto 1fr;
  align-items: center; gap: var(--s-6);
  padding: var(--s-6) var(--s-8);
  background: var(--c-bg-card); border: 1px solid var(--c-border);
  margin: 0 auto;
  max-width: 1080px;
}
.weather-panel__col { display: flex; flex-direction: column; gap: 4px; }
.weather-panel__date { font-size: 18px; color: var(--c-ink); text-transform: capitalize; }
.weather-panel__temp { display: flex; align-items: baseline; gap: 8px; }
.weather-panel__num { font-size: 32px; line-height: 1; color: var(--c-ink); letter-spacing: -0.02em; }
.weather-panel__cond { font-size: 13px; color: var(--c-text-muted); }
.weather-panel__sun { font-family: var(--c-font-display); font-size: 18px; color: var(--c-ink); font-feature-settings: 'tnum'; }
.weather-panel__uv { font-size: 28px; color: var(--c-accent-deep); line-height: 1; }
.weather-panel__divider { width: 1px; height: 36px; background: var(--c-border); }

.rule { margin: var(--s-16) auto; max-width: 200px; }

.act__list-head { text-align: center; margin-bottom: var(--s-10); }
.act__list-head h2 { font-size: clamp(28px, 4vw, 40px); margin: var(--s-2) 0 0; font-weight: 500; line-height: 1.2; }
.act__list-head h2 em { color: var(--c-accent-deep); font-style: italic; }

.acts-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: var(--s-6); }

.act-card {
  background: var(--c-bg-card); border: 1px solid var(--c-border);
  display: flex; flex-direction: column;
  transition: all var(--dur-base); animation: fadeUp 0.6s var(--ease-soft) both;
  overflow: hidden;
}
.act-card:hover { border-color: var(--c-ink); transform: translateY(-3px); }

.act-card__image { position: relative; aspect-ratio: 4 / 3; overflow: hidden; background: var(--c-paper); }
.act-card__image img { width: 100%; height: 100%; object-fit: cover; transition: transform var(--dur-slow); }
.act-card:hover .act-card__image img { transform: scale(1.05); }
.act-card__time {
  position: absolute; top: var(--s-3); left: var(--s-3);
  background: rgba(255,255,255,0.95);
  padding: 4px 10px;
  font-size: 14px; color: var(--c-ink);
  letter-spacing: 0.02em;
  font-feature-settings: 'tnum';
}

.act-card__body { padding: var(--s-5); flex: 1; display: flex; flex-direction: column; gap: var(--s-3); }
.act-card h3 { font-size: 22px; line-height: 1.15; margin: 0; font-weight: 500; color: var(--c-ink); letter-spacing: -0.01em; }

.act-card__meta { display: flex; align-items: baseline; gap: 6px; padding-top: var(--s-2); border-top: 1px solid var(--c-border); margin-top: var(--s-2); }
.act-card__duration { font-size: 12px; color: var(--c-text-muted); letter-spacing: 0.06em; }
.act-card__sep { color: var(--c-text-faint); }
.act-card__price { font-size: 18px; font-weight: 500; color: var(--c-ink); font-feature-settings: 'tnum'; }

.act-card__cta {
  display: inline-flex; align-items: center; gap: 6px;
  padding: var(--s-3) var(--s-4); margin-top: auto;
  background: var(--c-ink); color: white; border: none;
  font-size: 11px; font-weight: 600; letter-spacing: 0.16em; text-transform: uppercase;
  align-self: flex-start;
  transition: background var(--dur-fast); cursor: pointer;
}
.act-card__cta:hover { background: var(--c-accent); }
.act-card__cta :deep(svg) { transition: transform var(--dur-fast); }
.act-card__cta:hover :deep(svg) { transform: translateX(3px); }

@media (max-width: 1000px) {
  .weather-panel { grid-template-columns: 1fr 1fr; gap: var(--s-4); }
  .weather-panel__divider { display: none; }
  .acts-grid { grid-template-columns: repeat(2, 1fr); }
}
@media (max-width: 700px) {
  .weather-panel { grid-template-columns: 1fr; }
  .acts-grid { grid-template-columns: 1fr; }
}
</style>
