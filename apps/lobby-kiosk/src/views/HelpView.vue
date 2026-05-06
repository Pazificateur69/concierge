<script setup lang="ts">
import { IonPage, IonContent } from '@ionic/vue';
import KioskHeader from '../components/KioskHeader.vue';
import Icon from '../components/Icon.vue';
import { useTenantStore } from '../stores/tenant';

const tenantStore = useTenantStore();
</script>

<template>
  <ion-page>
    <KioskHeader title="Assistance" />
    <ion-content :fullscreen="true">
      <div class="help">
        <header class="help__hero fade-up">
          <span class="eyebrow">Nous joindre</span>
          <h1 class="serif">
            <em>À votre écoute,</em><br/>
            sans interruption.
          </h1>
          <p>Notre équipe est joignable jour et nuit, en sept langues.</p>
        </header>

        <div class="help__cards">
          <a :href="`tel:${tenantStore.tenant?.contact?.phone}`" class="help-card help-card--primary fade-up" style="animation-delay: 60ms">
            <div class="help-card__icon"><Icon name="phone" :size="24" :stroke="1.2" /></div>
            <span class="help-card__eyebrow">Réception</span>
            <span class="help-card__value serif">{{ tenantStore.tenant?.contact?.phone }}</span>
            <span class="help-card__hint">24 heures sur 24, 7 jours sur 7</span>
          </a>

          <a :href="`mailto:${tenantStore.tenant?.contact?.email}`" class="help-card fade-up" style="animation-delay: 120ms">
            <div class="help-card__icon"><Icon name="mail" :size="24" :stroke="1.2" /></div>
            <span class="help-card__eyebrow">Email</span>
            <span class="help-card__value serif">{{ tenantStore.tenant?.contact?.email }}</span>
            <span class="help-card__hint">Réponse sous une heure</span>
          </a>

          <div class="help-card fade-up" style="animation-delay: 180ms">
            <div class="help-card__icon"><Icon name="pin" :size="24" :stroke="1.2" /></div>
            <span class="help-card__eyebrow">Adresse</span>
            <span class="help-card__value serif">{{ tenantStore.tenant?.contact?.address }}</span>
            <span class="help-card__hint">{{ tenantStore.tenant?.contact?.city }}, {{ tenantStore.tenant?.contact?.country }}</span>
          </div>
        </div>

        <hr class="rule" />

        <section class="faq fade-up" style="animation-delay: 240ms">
          <header class="faq__header">
            <span class="eyebrow">Questions fréquentes</span>
            <h2 class="serif">Pour les détails pratiques</h2>
          </header>

          <details class="faq__item">
            <summary>
              <span>Quels sont les horaires du restaurant ?</span>
              <Icon name="plus" :size="14" />
            </summary>
            <p>Petit-déjeuner 6h30 — 10h30, déjeuner 12h — 14h30, dîner 19h — 22h30. Service en chambre disponible 24/24.</p>
          </details>

          <details class="faq__item">
            <summary>
              <span>Y a-t-il un service de navette aéroport ?</span>
              <Icon name="plus" :size="14" />
            </summary>
            <p>Oui. Navette possible sur réservation 24 heures à l'avance. Berline ou monospace selon le nombre de passagers.</p>
          </details>

          <details class="faq__item">
            <summary>
              <span>Comment se connecter au Wi-Fi ?</span>
              <Icon name="plus" :size="14" />
            </summary>
            <p>Réseau « <strong>HOTEL-GUEST</strong> ». Identifiants imprimés sur votre carte de chambre. Connexion fibre, gratuite et illimitée.</p>
          </details>

          <details class="faq__item">
            <summary>
              <span>À quelle heure est le check-out ?</span>
              <Icon name="plus" :size="14" />
            </summary>
            <p>Check-out à 12h. Late check-out possible jusqu'à 16h sur demande, sans frais selon disponibilité.</p>
          </details>

          <details class="faq__item">
            <summary>
              <span>Acceptez-vous les animaux ?</span>
              <Icon name="plus" :size="14" />
            </summary>
            <p>Oui, nous accueillons les animaux de moins de 10 kg. Une participation de 30 € par séjour est appliquée pour le ménage.</p>
          </details>
        </section>
      </div>
    </ion-content>
  </ion-page>
</template>

<style scoped>
.help { min-height: calc(100vh - 80px); padding: var(--s-12) var(--s-8) var(--s-20); max-width: 1080px; margin: 0 auto; }

.help__hero { text-align: center; max-width: 700px; margin: 0 auto var(--s-12); }
.help__hero h1 { font-size: clamp(40px, 6vw, 64px); line-height: 1.1; margin: var(--s-3) 0 var(--s-4); font-weight: 500; }
.help__hero h1 em { color: var(--c-accent-deep); font-style: italic; }
.help__hero p { color: var(--c-text-muted); font-size: 17px; line-height: 1.6; margin: 0; }

.help__cards {
  display: grid; grid-template-columns: repeat(3, 1fr);
  gap: 0;
  margin-top: var(--s-12);
  border: 1px solid var(--c-border);
}

.help-card {
  display: flex; flex-direction: column; gap: var(--s-3);
  padding: var(--s-8);
  border-right: 1px solid var(--c-border);
  background: var(--c-bg-card);
  text-decoration: none; color: inherit;
  transition: all var(--dur-base);
}
.help-card:last-child { border-right: none; }
.help-card:hover { background: var(--c-paper); }
.help-card--primary { background: var(--c-ink); color: white; border-right-color: var(--c-primary-light); }
.help-card--primary:hover { background: var(--c-primary-light); }

.help-card__icon { width: 48px; height: 48px; background: var(--c-paper); color: var(--c-ink); display: grid; place-items: center; margin-bottom: var(--s-2); }
.help-card--primary .help-card__icon { background: rgba(245,240,232,0.15); color: var(--c-paper); }

.help-card__eyebrow { font-size: 10px; font-weight: 600; letter-spacing: 0.18em; text-transform: uppercase; opacity: 0.7; }
.help-card__value { font-size: 20px; font-weight: 500; line-height: 1.25; word-break: break-word; }
.help-card__hint { font-size: 13px; opacity: 0.7; margin-top: 2px; }

.rule { margin: var(--s-16) auto; max-width: 200px; }

.faq__header { text-align: center; margin-bottom: var(--s-10); }
.faq__header h2 { font-size: clamp(28px, 4vw, 40px); margin: var(--s-2) 0 0; font-weight: 500; line-height: 1.2; }

.faq__item { border-top: 1px solid var(--c-border); }
.faq__item:last-child { border-bottom: 1px solid var(--c-border); }
.faq__item summary {
  font-family: var(--c-font-display); font-size: 22px; font-weight: 500;
  cursor: pointer; list-style: none;
  padding: var(--s-5) 0;
  display: flex; justify-content: space-between; align-items: center; gap: var(--s-4);
  transition: color var(--dur-fast);
}
.faq__item summary::-webkit-details-marker { display: none; }
.faq__item summary :deep(svg) { transition: transform var(--dur-base); color: var(--c-text-muted); }
.faq__item:hover summary { color: var(--c-accent-deep); }
.faq__item:hover summary :deep(svg) { color: var(--c-accent-deep); }
.faq__item[open] summary :deep(svg) { transform: rotate(45deg); color: var(--c-accent); }

.faq__item p { color: var(--c-text-muted); margin: 0 0 var(--s-5); line-height: 1.7; font-size: 15px; padding-right: var(--s-12); }

@media (max-width: 900px) { .help__cards { grid-template-columns: 1fr; } .help-card { border-right: none; border-bottom: 1px solid var(--c-border); } }
</style>
