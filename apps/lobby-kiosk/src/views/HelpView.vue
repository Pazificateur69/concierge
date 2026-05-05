<script setup lang="ts">
import { IonPage, IonContent } from '@ionic/vue';
import KioskHeader from '../components/KioskHeader.vue';
import { useTenantStore } from '../stores/tenant';

const tenantStore = useTenantStore();
</script>

<template>
  <ion-page>
    <KioskHeader title="Besoin d'aide ?" />
    <ion-content :fullscreen="true">
      <div class="help">
        <div class="help__card">
          <span>📞</span>
          <h3>Réception</h3>
          <p class="help__phone">{{ tenantStore.tenant?.contact?.phone }}</p>
          <small>24h/24</small>
        </div>
        <div class="help__card">
          <span>📧</span>
          <h3>Email</h3>
          <p>{{ tenantStore.tenant?.contact?.email }}</p>
        </div>
        <div class="help__card">
          <span>📍</span>
          <h3>Adresse</h3>
          <p>{{ tenantStore.tenant?.contact?.address }}<br>{{ tenantStore.tenant?.contact?.city }}</p>
        </div>
      </div>
    </ion-content>
  </ion-page>
</template>

<style scoped>
.help { display: grid; grid-template-columns: repeat(3, 1fr); gap: 24px; padding: 48px; max-width: 1200px; margin: 0 auto; }
.help__card { background: white; border-radius: 20px; padding: 32px; text-align: center; box-shadow: 0 2px 12px rgba(0,0,0,0.05); }
.help__card span { font-size: 64px; }
.help__card h3 { font-family: var(--c-font-display); margin: 16px 0 8px; }
.help__phone { font-size: 24px; font-weight: 700; color: var(--c-primary); }
@media (max-width: 900px) { .help { grid-template-columns: 1fr; } }
</style>
