<script setup lang="ts">
import { IonPage, IonContent } from '@ionic/vue';
import KioskHeader from '../components/KioskHeader.vue';
import Icon from '../components/Icon.vue';

const services = [
  { icon: 'bell', title: 'Conciergerie', desc: 'Notre équipe est joignable jour et nuit pour orchestrer votre séjour.', tag: 'Inclus', hours: 'Sans interruption' },
  { icon: 'spa', title: 'Spa & Bien-être', desc: 'Soins, massages, hammam et sauna. Réservation directe en chambre.', tag: 'Sur réservation', hours: '9h — 21h' },
  { icon: 'restaurant', title: 'Service en chambre', desc: 'Restaurant complet livré à votre porte, à toute heure.', tag: 'Voir la carte', hours: 'Sans interruption' },
  { icon: 'pin', title: 'Voiturier', desc: 'Notre service voiturier accueille vos véhicules et ceux de vos invités.', tag: 'Inclus', hours: 'Sans interruption' },
  { icon: 'phone', title: 'Service de taxi', desc: 'Taxi, berline ou navette aéroport. Paiement à l\'arrivée.', tag: 'Sur demande', hours: 'Sans interruption' },
  { icon: 'sun', title: 'Piscine & Fitness', desc: 'Bassin chauffé et salle de sport climatisée pour les résidents.', tag: 'Inclus', hours: '6h — 23h' },
  { icon: 'mail', title: 'Pressing', desc: 'Service de blanchisserie 4 heures, ou express en 1 heure.', tag: 'À partir de 12 €', hours: '7h — 22h' },
  { icon: 'help', title: 'Garde d\'enfants', desc: 'Baby-sitting et activités encadrées par notre équipe certifiée.', tag: '20 € / heure', hours: 'Sur réservation' },
  { icon: 'wifi', title: 'Wi-Fi & Centre d\'affaires', desc: 'Connexion fibre gratuite, salles de réunion équipées.', tag: 'Inclus', hours: 'Sans interruption' },
];
</script>

<template>
  <ion-page>
    <KioskHeader title="Services" />
    <ion-content :fullscreen="true">
      <div class="services">
        <header class="services__hero fade-up">
          <span class="eyebrow">Tous nos services</span>
          <h1 class="serif">
            Une <em>attention</em> permanente,<br/>
            une discrétion absolue.
          </h1>
          <p>Chaque service de la maison est pensé pour rendre votre séjour aussi simple qu'agréable.</p>
        </header>

        <hr class="rule" />

        <div class="services__grid">
          <article
            v-for="(s, idx) in services"
            :key="s.title"
            class="srv"
            :style="{ animationDelay: `${idx * 50}ms` }"
          >
            <div class="srv__head">
              <div class="srv__icon">
                <Icon :name="s.icon" :size="22" :stroke="1.2" />
              </div>
              <span class="srv__num">{{ String(idx + 1).padStart(2, '0') }}</span>
            </div>
            <h3 class="srv__title serif">{{ s.title }}</h3>
            <p class="srv__desc">{{ s.desc }}</p>
            <hr class="srv__sep" />
            <div class="srv__meta">
              <span class="eyebrow srv__tag">{{ s.tag }}</span>
              <span class="srv__hours">{{ s.hours }}</span>
            </div>
          </article>
        </div>
      </div>
    </ion-content>
  </ion-page>
</template>

<style scoped>
.services { min-height: calc(100vh - 80px); padding: var(--s-12) var(--s-8) var(--s-20); max-width: 1280px; margin: 0 auto; }

.services__hero { text-align: center; max-width: 720px; margin: 0 auto var(--s-12); }
.services__hero h1 { font-size: clamp(36px, 5vw, 56px); line-height: 1.15; margin: var(--s-3) 0 var(--s-4); font-weight: 500; }
.services__hero h1 em { color: var(--c-accent-deep); font-style: italic; }
.services__hero p { color: var(--c-text-muted); font-size: 16px; line-height: 1.6; margin: 0; }

.rule { margin: var(--s-12) auto; max-width: 200px; }

.services__grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 0; border-top: 1px solid var(--c-border); border-left: 1px solid var(--c-border); }

.srv {
  padding: var(--s-8);
  border-right: 1px solid var(--c-border);
  border-bottom: 1px solid var(--c-border);
  display: flex; flex-direction: column; gap: var(--s-4);
  background: var(--c-bg-card);
  transition: all var(--dur-base);
  animation: fadeUp 0.6s var(--ease-soft) both;
  min-height: 280px;
}
.srv:hover { background: var(--c-paper); }

.srv__head { display: flex; justify-content: space-between; align-items: flex-start; }
.srv__icon { width: 48px; height: 48px; background: var(--c-ink); color: var(--c-paper); display: grid; place-items: center; }
.srv__num { font-family: var(--c-font-display); font-size: 14px; font-weight: 500; color: var(--c-text-soft); letter-spacing: 0.05em; font-feature-settings: 'tnum'; }

.srv__title { font-size: 26px; line-height: 1.15; margin: 0; font-weight: 500; color: var(--c-ink); letter-spacing: -0.01em; }
.srv__desc { color: var(--c-text-muted); font-size: 15px; line-height: 1.55; margin: 0; flex: 1; }

.srv__sep { width: 32px; height: 1px; background: var(--c-rule); border: 0; margin: var(--s-2) 0; }

.srv__meta { display: flex; justify-content: space-between; align-items: baseline; }
.srv__tag { color: var(--c-accent-deep); font-size: 10px; }
.srv__hours { font-size: 12px; color: var(--c-text-soft); font-feature-settings: 'tnum'; letter-spacing: 0.02em; }

@media (max-width: 900px) { .services__grid { grid-template-columns: repeat(2, 1fr); } }
@media (max-width: 600px) { .services__grid { grid-template-columns: 1fr; } }
</style>
