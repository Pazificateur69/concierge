<script setup lang="ts">
import { IonPage, IonContent } from '@ionic/vue';
import KioskHeader from '../components/KioskHeader.vue';
import { useTenantStore } from '../stores/tenant';

const tenantStore = useTenantStore();
</script>

<template>
  <ion-page>
    <KioskHeader :title="$t('help.title')" />
    <ion-content :fullscreen="true">
      <div class="help">
        <div class="help__hero fade-in-up">
          <h1 class="font-display">{{ $t('help.title') }}</h1>
          <p>{{ $t('help.subtitle') }}</p>
        </div>

        <div class="help__cards">
          <a :href="`tel:${tenantStore.tenant?.contact?.phone}`" class="help-card help-card--primary fade-in-up" style="animation-delay: 80ms">
            <div class="help-card__icon">
              <svg viewBox="0 0 24 24" width="32" height="32" fill="currentColor">
                <path d="M20 15.5a17.5 17.5 0 0 1-5.5-.9 1.5 1.5 0 0 0-1.5.4l-2.2 2.2a16 16 0 0 1-7-7l2.2-2.2a1.5 1.5 0 0 0 .4-1.5A17.5 17.5 0 0 1 5.5 1H3a1.5 1.5 0 0 0-1.5 1.5A18.5 18.5 0 0 0 20 21a1.5 1.5 0 0 0 1.5-1.5V17a1.5 1.5 0 0 0-1.5-1.5z"/>
              </svg>
            </div>
            <span class="help-card__label">{{ $t('help.reception') }}</span>
            <span class="help-card__value">{{ tenantStore.tenant?.contact?.phone }}</span>
            <span class="help-card__hint">{{ $t('help.open24') }}</span>
          </a>

          <a :href="`mailto:${tenantStore.tenant?.contact?.email}`" class="help-card fade-in-up" style="animation-delay: 160ms">
            <div class="help-card__icon">
              <svg viewBox="0 0 24 24" width="32" height="32" fill="currentColor">
                <path d="M20 4H4a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V6a2 2 0 0 0-2-2zm0 4-8 5-8-5V6l8 5 8-5v2z"/>
              </svg>
            </div>
            <span class="help-card__label">{{ $t('help.email') }}</span>
            <span class="help-card__value">{{ tenantStore.tenant?.contact?.email }}</span>
            <span class="help-card__hint">Réponse sous 1 heure</span>
          </a>

          <div class="help-card fade-in-up" style="animation-delay: 240ms">
            <div class="help-card__icon">
              <svg viewBox="0 0 24 24" width="32" height="32" fill="currentColor">
                <path d="M12 2C8 2 5 5 5 9c0 5.3 7 13 7 13s7-7.7 7-13c0-4-3-7-7-7zm0 9.5a2.5 2.5 0 1 1 0-5 2.5 2.5 0 0 1 0 5z"/>
              </svg>
            </div>
            <span class="help-card__label">{{ $t('help.address') }}</span>
            <span class="help-card__value">{{ tenantStore.tenant?.contact?.address }}</span>
            <span class="help-card__hint">{{ tenantStore.tenant?.contact?.city }}, {{ tenantStore.tenant?.contact?.country }}</span>
          </div>
        </div>

        <div class="help__quick fade-in-up" style="animation-delay: 320ms">
          <h3 class="font-display">Questions fréquentes</h3>
          <details class="faq">
            <summary>Quels sont les horaires du restaurant ?</summary>
            <p>Petit-déjeuner 6h30–10h30, déjeuner 12h–14h30, dîner 19h–22h30. Room service 24h/24.</p>
          </details>
          <details class="faq">
            <summary>Y a-t-il un service de navette aéroport ?</summary>
            <p>Oui, navette possible sur réservation. Contactez la réception 24h à l'avance.</p>
          </details>
          <details class="faq">
            <summary>Comment fonctionne la connexion Wi-Fi ?</summary>
            <p>Réseau « <strong>HOTEL-GUEST</strong> », identifiants sur votre carte de chambre. Gratuit et illimité.</p>
          </details>
          <details class="faq">
            <summary>Le check-out est à quelle heure ?</summary>
            <p>Check-out à 12h. Late check-out possible jusqu'à 16h sur demande (selon disponibilité).</p>
          </details>
        </div>
      </div>
    </ion-content>
  </ion-page>
</template>

<style scoped>
.help {
  min-height: calc(100vh - 80px);
  padding: var(--s-12) var(--s-8) var(--s-16);
  max-width: 1200px; margin: 0 auto;
}

.help__hero { text-align: center; margin-bottom: var(--s-12); }
.help__hero h1 { font-size: clamp(36px, 5vw, 56px); margin: 0 0 var(--s-3); color: var(--c-text); }
.help__hero p { color: var(--c-text-muted); font-size: 20px; margin: 0; }

.help__cards {
  display: grid; grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
  gap: var(--s-5); margin-bottom: var(--s-16);
}

.help-card {
  display: flex; flex-direction: column; gap: var(--s-2);
  padding: var(--s-8) var(--s-6);
  background: var(--c-bg-card);
  border: 1px solid var(--c-border);
  border-radius: var(--r-xl);
  text-decoration: none; color: inherit;
  transition: all var(--dur-base);
  box-shadow: var(--sh-xs);
}
.help-card:hover { transform: translateY(-3px); box-shadow: var(--sh-md); }

.help-card__icon {
  width: 64px; height: 64px;
  background: var(--c-primary-50);
  color: var(--c-primary);
  border-radius: var(--r-md);
  display: grid; place-items: center;
  margin-bottom: var(--s-3);
}
.help-card--primary { background: linear-gradient(135deg, var(--c-primary) 0%, var(--c-primary-800) 100%); color: white; border: none; }
.help-card--primary .help-card__icon { background: rgba(255,255,255,0.18); color: white; }

.help-card__label { font-size: 13px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.06em; opacity: 0.7; }
.help-card__value {
  font-family: var(--c-font-display); font-size: 28px; font-weight: 700;
  word-break: break-word;
}
.help-card__hint { font-size: 14px; opacity: 0.7; margin-top: var(--s-1); }

.help__quick { background: var(--c-bg-card); border: 1px solid var(--c-border); border-radius: var(--r-xl); padding: var(--s-8); }
.help__quick h3 { font-size: 28px; margin: 0 0 var(--s-6); }

.faq {
  border-top: 1px solid var(--c-border); padding: var(--s-4) 0;
}
.faq:first-of-type { border-top: none; padding-top: 0; }
.faq summary {
  font-weight: 600; font-size: 17px; cursor: pointer;
  list-style: none; padding-right: var(--s-4);
  position: relative;
}
.faq summary::-webkit-details-marker { display: none; }
.faq summary::after {
  content: '+'; position: absolute; right: 0; top: 0;
  width: 28px; height: 28px;
  background: var(--c-bg-soft); border-radius: var(--r-sm);
  display: grid; place-items: center;
  font-size: 20px; font-weight: 400;
  transition: transform var(--dur-fast);
}
.faq[open] summary::after { content: '−'; }
.faq p { color: var(--c-text-muted); margin: var(--s-3) 0 0; line-height: 1.6; padding-right: var(--s-12); }
</style>
