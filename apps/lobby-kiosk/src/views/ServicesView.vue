<script setup lang="ts">
import { IonPage, IonContent } from '@ionic/vue';
import KioskHeader from '../components/KioskHeader.vue';

const services = [
  { icon: '🛎️', title: 'Conciergerie 24/7', desc: 'Notre équipe est à votre disposition à toute heure pour toute demande.', tag: 'Inclus' },
  { icon: '🧖‍♀️', title: 'Spa & Bien-être', desc: 'Soins, massages, hammam et sauna. Réservation depuis votre chambre ou la borne.', tag: '110 € / soin' },
  { icon: '🏊', title: 'Piscine & Fitness', desc: 'Accès libre 6h–23h pour les résidents. Salle de sport climatisée.', tag: 'Inclus' },
  { icon: '🚕', title: 'Service Taxi', desc: 'Réservation immédiate, paiement à l\'arrivée. Navette aéroport possible.', tag: 'Sur demande' },
  { icon: '👔', title: 'Pressing & Blanchisserie', desc: 'Service 4h ou express 1h. Dépôt à la réception ou en chambre.', tag: 'À partir de 12 €' },
  { icon: '🍷', title: 'Room Service 24/7', desc: 'Restaurant complet directement en chambre, à toute heure.', tag: 'Voir menu' },
  { icon: '🚗', title: 'Voiturier', desc: 'Service de voiturier 24h/24 pour vous et vos invités.', tag: 'Inclus' },
  { icon: '👶', title: 'Service de garde', desc: 'Baby-sitting et activités enfants sur réservation.', tag: '20 € / heure' },
  { icon: '💼', title: 'Centre d\'affaires', desc: 'Salle de réunion, imprimante, scan, secrétariat trilingue.', tag: 'Sur réservation' },
];
</script>

<template>
  <ion-page>
    <KioskHeader :title="$t('services.title')" />
    <ion-content :fullscreen="true">
      <div class="services">
        <div class="services__hero fade-in-up">
          <span class="services__chip">⭐ Tous nos services</span>
          <h1 class="font-display">{{ $t('services.title') }}</h1>
          <p>{{ $t('services.subtitle') }}</p>
        </div>

        <div class="services__grid">
          <div
            v-for="(s, idx) in services"
            :key="s.title"
            class="service-card"
            :style="{ animationDelay: `${idx * 60}ms` }"
          >
            <div class="service-card__top">
              <span class="service-card__icon">{{ s.icon }}</span>
              <span class="service-card__tag">{{ s.tag }}</span>
            </div>
            <h3 class="service-card__title font-display">{{ s.title }}</h3>
            <p class="service-card__desc">{{ s.desc }}</p>
          </div>
        </div>
      </div>
    </ion-content>
  </ion-page>
</template>

<style scoped>
.services { min-height: calc(100vh - 80px); padding: var(--s-12) var(--s-8) var(--s-16); max-width: 1280px; margin: 0 auto; }

.services__hero { text-align: center; margin-bottom: var(--s-12); }
.services__chip {
  display: inline-block; padding: var(--s-2) var(--s-4);
  background: var(--c-accent); color: white;
  border-radius: var(--r-full);
  font-size: 13px; font-weight: 700;
  letter-spacing: 0.05em; margin-bottom: var(--s-4);
}
.services__hero h1 { font-size: clamp(36px, 5vw, 56px); margin: 0 0 var(--s-3); color: var(--c-text); }
.services__hero p { color: var(--c-text-muted); font-size: 20px; margin: 0; }

.services__grid {
  display: grid; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: var(--s-5);
}

.service-card {
  background: var(--c-bg-card);
  border: 1px solid var(--c-border);
  border-radius: var(--r-xl);
  padding: var(--s-6);
  display: flex; flex-direction: column; gap: var(--s-3);
  transition: all var(--dur-base);
  box-shadow: var(--sh-xs);
  animation: fadeInUp 0.5s var(--ease-smooth) both;
}
.service-card:hover { transform: translateY(-3px); box-shadow: var(--sh-md); border-color: var(--c-primary-100); }

.service-card__top { display: flex; justify-content: space-between; align-items: flex-start; }
.service-card__icon {
  width: 64px; height: 64px;
  background: var(--c-bg-soft);
  border-radius: var(--r-md);
  display: grid; place-items: center;
  font-size: 36px;
}
.service-card__tag {
  background: var(--c-primary-50); color: var(--c-primary);
  padding: 4px 12px; border-radius: var(--r-full);
  font-size: 12px; font-weight: 700;
  letter-spacing: 0.04em; text-transform: uppercase;
}

.service-card__title { font-size: 22px; margin: var(--s-2) 0 0; color: var(--c-text); }
.service-card__desc { color: var(--c-text-muted); font-size: 15px; line-height: 1.5; margin: 0; }
</style>
