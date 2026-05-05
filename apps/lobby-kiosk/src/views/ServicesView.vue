<script setup lang="ts">
import { IonPage, IonContent } from '@ionic/vue';
import KioskHeader from '../components/KioskHeader.vue';

const services = [
  { icon: '🛎️', title: 'Conciergerie 24/7', description: 'Notre équipe est à votre disposition à toute heure.' },
  { icon: '🧖', title: 'Spa & Bien-être', description: 'Soins, massages, hammam — réservation depuis votre chambre.' },
  { icon: '🚕', title: 'Service de taxi', description: 'Réservation immédiate, paiement à l\'arrivée.' },
  { icon: '👔', title: 'Pressing', description: 'Service de blanchisserie 4h ou express 1h.' },
  { icon: '🍷', title: 'Room service', description: 'Restaurant 24h/24 directement en chambre.' },
  { icon: '🏊', title: 'Piscine & Fitness', description: 'Accès libre 6h-23h pour les résidents.' },
];
</script>

<template>
  <ion-page>
    <KioskHeader title="Services de l'hôtel" />
    <ion-content :fullscreen="true">
      <div class="services">
        <div v-for="s in services" :key="s.title" class="services__card">
          <span class="services__icon">{{ s.icon }}</span>
          <div class="services__content">
            <h3>{{ s.title }}</h3>
            <p>{{ s.description }}</p>
          </div>
        </div>
      </div>
    </ion-content>
  </ion-page>
</template>

<style scoped>
.services { padding: 32px; display: grid; grid-template-columns: repeat(2, 1fr); gap: 24px; max-width: 1200px; margin: 0 auto; }
.services__card { background: white; border-radius: 20px; padding: 24px; display: flex; gap: 20px; align-items: center; box-shadow: 0 2px 12px rgba(0,0,0,0.05); }
.services__icon { font-size: 56px; }
.services__content h3 { margin: 0 0 4px; font-family: var(--c-font-display); font-size: 22px; }
.services__content p { margin: 0; color: rgba(0,0,0,0.6); }
</style>
