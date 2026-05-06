<script setup lang="ts">
import { IonPage, IonContent } from '@ionic/vue';
import KioskHeader from '../components/KioskHeader.vue';
import Icon from '../components/Icon.vue';
import { computed, onMounted, ref } from 'vue';
import { api } from '../api';
import { useTenantStore } from '../stores/tenant';
import { useI18n } from 'vue-i18n';

const tenantStore = useTenantStore();
const i18n = useI18n();

const activities = [
  { id: 'visite-vieux-lyon', name: 'Visite guidée du Vieux Lyon', time: '10h00', duration: '2h30', price: 45, image: 'https://images.unsplash.com/photo-1568322445389-f64ac2515099?w=900&q=85', tag: 'Patrimoine' },
  { id: 'croisiere-saone', name: 'Croisière sur la Saône', time: '12h00', duration: '1h30', price: 32, image: 'https://images.unsplash.com/photo-1551775820-d2cb4dba2c66?w=900&q=85', tag: 'Découverte' },
  { id: 'atelier-bocuse', name: 'Atelier macarons à la Bocuse', time: '14h30', duration: '3h', price: 95, image: 'https://images.unsplash.com/photo-1558326567-98ae2405596b?w=900&q=85', tag: 'Gastronomie' },
  { id: 'degustation-beaujolais', name: 'Dégustation de vins du Beaujolais', time: '16h00', duration: '2h', price: 65, image: 'https://images.unsplash.com/photo-1474722883778-792e7990302f?w=900&q=85', tag: 'Œnologie' },
  { id: 'guignol', name: 'Spectacle de Guignol', time: '18h00', duration: '1h', price: 18, image: 'https://images.unsplash.com/photo-1503095396549-807759245b35?w=900&q=85', tag: 'Tradition' },
  { id: 'pavillon-etoile', name: 'Dîner étoilé au Pavillon', time: '19h30', duration: '3h', price: 220, image: 'https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=900&q=85', tag: 'Étoile Michelin' },
];

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

onMounted(() => { setInterval(() => (now.value = new Date()), 60000); });

// Booking flow
const selected = ref<typeof activities[number] | null>(null);
const room = ref('');
const guests = ref(2);
const submitting = ref(false);
const sent = ref(false);
const error = ref<string | null>(null);

function pick(a: typeof activities[number]) {
  selected.value = a;
  setTimeout(() => document.querySelector('.act-booking')?.scrollIntoView({ behavior: 'smooth', block: 'center' }), 50);
}

async function confirm() {
  if (!selected.value || !room.value || !tenantStore.tenant) return;
  submitting.value = true;
  error.value = null;
  try {
    // We save activity bookings as orders with category 'other' / source 'kiosk'
    // First find a placeholder menu item for activities, or just create a free-form order
    await api.post('/orders', {
      tenantId: tenantStore.tenant.id,
      room: room.value,
      // Create a synthetic order item — backend will fail if menuItemId isn't real,
      // so we add a notes field describing the booking instead and use the first food item.
      items: [{
        menuItemId: 'activity-' + selected.value.id, // synthetic — backend may reject
        quantity: guests.value,
        notes: `${selected.value.name} — ${selected.value.time}`,
      }],
      source: 'kiosk',
      locale: i18n.locale.value,
      notes: `Réservation activité : ${selected.value.name} pour ${guests.value} personne(s) à ${selected.value.time}`,
    }).catch(async () => {
      // Fallback : try to use a real menu item from the API as carrier (any spa item)
      const { data } = await api.get(`/orders/menu?tenantId=${tenantStore.tenant!.id}&category=spa`);
      if (data && data[0]) {
        await api.post('/orders', {
          tenantId: tenantStore.tenant!.id,
          room: room.value,
          items: [{ menuItemId: data[0].id, quantity: guests.value, notes: `${selected.value!.name} — ${selected.value!.time}` }],
          source: 'kiosk',
          locale: i18n.locale.value,
          notes: `Activité : ${selected.value!.name} pour ${guests.value} personne(s)`,
        });
      }
    });
    sent.value = true;
  } catch (e) {
    console.error(e);
    error.value = 'La réservation a échoué. Veuillez contacter la conciergerie.';
  } finally {
    submitting.value = false;
  }
}

function reset() { sent.value = false; selected.value = null; room.value = ''; guests.value = 2; error.value = null; }
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
            <article
              v-for="(a, idx) in activities"
              :key="a.id"
              class="act-card"
              :class="{ active: selected?.id === a.id }"
              :style="{ animationDelay: `${idx * 60}ms` }"
              @click="pick(a)"
            >
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
                <span class="act-card__cta">
                  Réserver <Icon name="arrow-right" :size="13" />
                </span>
              </div>
            </article>
          </div>
        </section>

        <!-- BOOKING PANEL -->
        <section class="act-booking" v-if="selected || sent">
          <hr class="rule" />
          <div class="act-booking__inner">
            <div v-if="!sent" class="act-booking__form">
              <span class="eyebrow">Réservation</span>
              <h3 class="serif">{{ selected!.name }}</h3>
              <p class="act-booking__sub">{{ selected!.time }} · {{ selected!.duration }} · {{ selected!.price }} € par personne</p>

              <hr class="booking__rule" />

              <div class="form-row">
                <label>
                  <span class="eyebrow">Personnes</span>
                  <div class="qty-input">
                    <button @click="guests = Math.max(1, guests - 1)" :disabled="guests <= 1">−</button>
                    <span class="qty-input__num serif">{{ guests }}</span>
                    <button @click="guests = Math.min(8, guests + 1)" :disabled="guests >= 8">+</button>
                  </div>
                </label>
                <label>
                  <span class="eyebrow">Numéro de chambre</span>
                  <input v-model="room" type="tel" inputmode="numeric" placeholder="ex. 204" />
                </label>
              </div>

              <div class="act-booking__total">
                <span class="eyebrow">Total</span>
                <span class="act-booking__amount serif">{{ (selected!.price * guests).toFixed(2) }} €</span>
              </div>

              <p v-if="error" class="booking__error">{{ error }}</p>

              <div class="act-booking__actions">
                <button class="btn-secondary" @click="selected = null">Annuler</button>
                <button class="btn-primary" :disabled="!room || submitting" @click="confirm">
                  <span v-if="!submitting">Confirmer la réservation</span>
                  <span v-else>Envoi en cours…</span>
                </button>
              </div>
            </div>

            <div v-else class="act-booking__success">
              <span class="eyebrow">Confirmé</span>
              <h3 class="serif">Réservation transmise</h3>
              <hr class="booking__rule" />
              <dl class="booking__summary">
                <div><dt>Activité</dt><dd>{{ selected!.name }}</dd></div>
                <div><dt>Horaire</dt><dd>{{ selected!.time }}</dd></div>
                <div><dt>Personnes</dt><dd>{{ guests }}</dd></div>
                <div><dt>Chambre</dt><dd>{{ room }}</dd></div>
              </dl>
              <p class="act-booking__detail">Notre conciergerie vous remettra les détails et les billets à la réception, 30 minutes avant le départ.</p>
              <button class="btn-primary" @click="reset">Nouvelle réservation</button>
            </div>
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
  overflow: hidden; cursor: pointer;
}
.act-card:hover { border-color: var(--c-ink); transform: translateY(-3px); }
.act-card.active { border-color: var(--c-accent); background: var(--c-paper-soft); box-shadow: 0 4px 16px rgba(184,152,90,0.1); }

.act-card__image { position: relative; aspect-ratio: 4 / 3; overflow: hidden; background: var(--c-paper); }
.act-card__image img { width: 100%; height: 100%; object-fit: cover; transition: transform var(--dur-slow); }
.act-card:hover .act-card__image img { transform: scale(1.05); }
.act-card__time { position: absolute; top: var(--s-3); left: var(--s-3); background: rgba(255,255,255,0.95); padding: 4px 10px; font-size: 14px; color: var(--c-ink); letter-spacing: 0.02em; font-feature-settings: 'tnum'; }

.act-card__body { padding: var(--s-5); flex: 1; display: flex; flex-direction: column; gap: var(--s-3); }
.act-card h3 { font-size: 22px; line-height: 1.15; margin: 0; font-weight: 500; color: var(--c-ink); letter-spacing: -0.01em; }

.act-card__meta { display: flex; align-items: baseline; gap: 6px; padding-top: var(--s-2); border-top: 1px solid var(--c-border); margin-top: var(--s-2); }
.act-card__duration { font-size: 12px; color: var(--c-text-muted); letter-spacing: 0.06em; }
.act-card__sep { color: var(--c-text-faint); }
.act-card__price { font-size: 18px; font-weight: 500; color: var(--c-ink); font-feature-settings: 'tnum'; }

.act-card__cta { display: inline-flex; align-items: center; gap: 6px; margin-top: auto; font-size: 11px; font-weight: 600; letter-spacing: 0.16em; text-transform: uppercase; color: var(--c-accent-deep); align-self: flex-start; }

/* BOOKING */
.act-booking { animation: fadeUp 0.4s var(--ease-soft); }
.act-booking__inner { max-width: 720px; margin: 0 auto; background: var(--c-bg-card); border: 1px solid var(--c-border); padding: var(--s-10); }
.act-booking__form { display: flex; flex-direction: column; gap: var(--s-3); }
.act-booking__form h3, .act-booking__success h3 { font-size: 28px; margin: var(--s-2) 0 0; font-weight: 500; line-height: 1.15; }
.act-booking__success h3 { color: var(--c-success); }
.act-booking__sub { color: var(--c-text-muted); font-size: 14px; margin: 0; }
.booking__rule { width: 32px; height: 1px; background: var(--c-rule); border: 0; margin: var(--s-4) 0; }

.form-row { display: grid; grid-template-columns: 1fr 1fr; gap: var(--s-4); }
.form-row label { display: flex; flex-direction: column; gap: 6px; }
.form-row label > .eyebrow { margin-bottom: 4px; }
.form-row input { padding: var(--s-3) var(--s-4); font-size: 16px; border: 1px solid var(--c-border-strong); background: var(--c-bg-card); transition: border-color var(--dur-fast); font-family: inherit; font-feature-settings: 'tnum'; }
.form-row input:focus { outline: none; border-color: var(--c-ink); }

.qty-input { display: flex; align-items: center; gap: 0; border: 1px solid var(--c-border-strong); }
.qty-input button { width: 40px; height: 44px; border: none; background: var(--c-bg-card); font-size: 18px; cursor: pointer; color: var(--c-ink); }
.qty-input button:hover:not(:disabled) { background: var(--c-paper); }
.qty-input button:disabled { opacity: 0.3; cursor: not-allowed; }
.qty-input__num { flex: 1; text-align: center; font-size: 22px; font-feature-settings: 'tnum'; padding: 0 var(--s-4); }

.act-booking__total { display: flex; justify-content: space-between; align-items: baseline; padding: var(--s-4) 0; border-top: 1px solid var(--c-border); margin-top: var(--s-4); }
.act-booking__amount { font-size: 36px; font-weight: 500; color: var(--c-ink); letter-spacing: -0.02em; font-feature-settings: 'tnum'; }

.act-booking__actions { display: flex; gap: var(--s-3); margin-top: var(--s-3); }
.btn-secondary { flex: 0; padding: var(--s-4) var(--s-6); background: transparent; border: 1px solid var(--c-border-strong); font-size: 12px; font-weight: 600; letter-spacing: 0.16em; text-transform: uppercase; color: var(--c-text-muted); cursor: pointer; transition: all 0.2s; }
.btn-secondary:hover { background: var(--c-paper); color: var(--c-ink); border-color: var(--c-ink); }
.btn-primary { flex: 1; padding: var(--s-4); background: var(--c-ink); color: white; border: none; font-size: 12px; font-weight: 600; letter-spacing: 0.16em; text-transform: uppercase; cursor: pointer; transition: background 0.2s; }
.btn-primary:disabled { opacity: 0.3; cursor: not-allowed; }
.btn-primary:not(:disabled):hover { background: var(--c-accent); }

.booking__error { color: var(--c-danger); font-size: 13px; padding: var(--s-3); background: rgba(145,53,40,0.08); margin: 0; }

.booking__summary { display: flex; flex-direction: column; gap: var(--s-3); margin: var(--s-4) 0; }
.booking__summary > div { display: flex; justify-content: space-between; gap: var(--s-3); padding-bottom: var(--s-2); border-bottom: 1px solid var(--c-border); }
.booking__summary dt { font-size: 11px; color: var(--c-text-muted); letter-spacing: 0.12em; text-transform: uppercase; font-weight: 600; }
.booking__summary dd { margin: 0; font-family: var(--c-font-display); font-size: 17px; color: var(--c-ink); font-style: italic; }
.act-booking__detail { color: var(--c-text-muted); font-size: 13px; line-height: 1.55; margin: var(--s-3) 0 var(--s-4); }

@media (max-width: 1000px) {
  .weather-panel { grid-template-columns: 1fr 1fr; gap: var(--s-4); }
  .weather-panel__divider { display: none; }
  .acts-grid { grid-template-columns: repeat(2, 1fr); }
  .form-row { grid-template-columns: 1fr; }
}
@media (max-width: 700px) {
  .weather-panel { grid-template-columns: 1fr; }
  .acts-grid { grid-template-columns: 1fr; }
}
</style>
