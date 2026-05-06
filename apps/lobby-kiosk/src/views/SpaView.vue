<script setup lang="ts">
import { IonPage, IonContent } from '@ionic/vue';
import KioskHeader from '../components/KioskHeader.vue';
import Icon from '../components/Icon.vue';
import { ref } from 'vue';

const treatments = [
  { name: 'Massage signature', duration: '90 min', price: 165, image: 'https://images.unsplash.com/photo-1544161515-4ab6ce6db874?w=800&q=80', desc: 'Notre rituel exclusif, mêlant pierres chaudes et huiles essentielles bio.' },
  { name: 'Massage relaxant', duration: '60 min', price: 110, image: 'https://images.unsplash.com/photo-1540555700478-4be289fbecef?w=800&q=80', desc: 'Soin Suédois traditionnel pour relâcher les tensions musculaires.' },
  { name: 'Soin du visage anti-âge', duration: '75 min', price: 145, image: 'https://images.unsplash.com/photo-1570172619644-dfd03ed5d881?w=800&q=80', desc: 'Protocole haute exigence à base d\'actifs concentrés.' },
  { name: 'Soin du visage hydratant', duration: '60 min', price: 95, image: 'https://images.unsplash.com/photo-1487412947147-5cebf100ffc2?w=800&q=80', desc: 'Pour une peau revitalisée et lumineuse.' },
  { name: 'Hammam & Gommage', duration: '45 min', price: 75, image: 'https://images.unsplash.com/photo-1583416750470-965b2707b355?w=800&q=80', desc: 'Rituel oriental traditionnel au savon noir et gants kessa.' },
  { name: 'Rituel du couple', duration: '120 min', price: 290, image: 'https://images.unsplash.com/photo-1552693673-1bf958298935?w=800&q=80', desc: 'Cabine privative, deux praticiennes, champagne offert.' },
];

const slots = ['10:00', '11:30', '14:00', '15:30', '17:00', '18:30'];
const selected = ref<typeof treatments[number] | null>(null);
const slot = ref<string | null>(null);
const room = ref('');
const sent = ref(false);

function pickTreatment(t: typeof treatments[number]) { selected.value = t; slot.value = null; }
function confirm() {
  if (!selected.value || !slot.value || !room.value) return;
  sent.value = true;
}
</script>

<template>
  <ion-page>
    <KioskHeader title="Spa & Bien-être" />
    <ion-content :fullscreen="true">
      <div class="spa">
        <header class="spa__hero fade-up">
          <span class="eyebrow">Maison de soins</span>
          <h1 class="serif">
            <em>L'art de la pause,</em><br/>
            au cœur de l'hôtel.
          </h1>
          <p>Cabines privatives, hammam, sauna et bassin de relaxation. Réservation directe en chambre.</p>
        </header>

        <hr class="rule" />

        <div class="spa__layout">
          <section class="spa__list">
            <span class="eyebrow">La carte des soins</span>
            <div class="treatments">
              <article
                v-for="(t, idx) in treatments"
                :key="t.name"
                class="treatment"
                :class="{ active: selected?.name === t.name }"
                :style="{ animationDelay: `${idx * 60}ms` }"
                @click="pickTreatment(t)"
              >
                <div class="treatment__image">
                  <img :src="t.image" :alt="t.name" loading="lazy" />
                </div>
                <div class="treatment__body">
                  <span class="treatment__num">{{ String(idx + 1).padStart(2, '0') }}</span>
                  <h3 class="serif">{{ t.name }}</h3>
                  <p>{{ t.desc }}</p>
                  <div class="treatment__meta">
                    <span class="treatment__duration">{{ t.duration }}</span>
                    <span class="treatment__sep">·</span>
                    <span class="treatment__price serif">{{ t.price }} €</span>
                  </div>
                </div>
              </article>
            </div>
          </section>

          <aside class="spa__booking">
            <div class="booking" v-if="!sent">
              <span class="eyebrow">Réservation</span>

              <div v-if="!selected" class="booking__empty">
                <p>Sélectionnez un soin pour voir les disponibilités.</p>
              </div>

              <div v-else>
                <h3 class="serif booking__name">{{ selected.name }}</h3>
                <p class="booking__sub">{{ selected.duration }} · {{ selected.price }} €</p>

                <hr class="booking__rule" />

                <span class="eyebrow booking__label">Aujourd'hui</span>
                <div class="slots">
                  <button v-for="s in slots" :key="s" class="slot" :class="{ active: slot === s }" @click="slot = s">
                    {{ s }}
                  </button>
                </div>

                <span class="eyebrow booking__label">Numéro de chambre</span>
                <input v-model="room" type="tel" inputmode="numeric" placeholder="ex. 204" class="booking__input" />

                <button class="booking__confirm" :disabled="!slot || !room" @click="confirm">
                  Confirmer la réservation
                </button>
              </div>
            </div>

            <div v-else class="booking booking--success">
              <span class="eyebrow">Confirmé</span>
              <h3 class="serif">Votre soin est réservé.</h3>
              <hr class="booking__rule" />
              <dl class="booking__summary">
                <div><dt>Soin</dt><dd>{{ selected?.name }}</dd></div>
                <div><dt>Heure</dt><dd>{{ slot }}</dd></div>
                <div><dt>Chambre</dt><dd>{{ room }}</dd></div>
              </dl>
              <p class="booking__detail">Notre équipe viendra vous chercher 5 minutes avant le rendez-vous.</p>
              <button class="booking__confirm" @click="sent = false; selected = null; slot = null; room = ''">Nouvelle réservation</button>
            </div>
          </aside>
        </div>
      </div>
    </ion-content>
  </ion-page>
</template>

<style scoped>
.spa { min-height: calc(100vh - 80px); padding: var(--s-12) var(--s-8) var(--s-20); max-width: 1320px; margin: 0 auto; }

.spa__hero { text-align: center; max-width: 760px; margin: 0 auto var(--s-12); }
.spa__hero h1 { font-size: clamp(40px, 6vw, 64px); line-height: 1.1; margin: var(--s-3) 0 var(--s-4); font-weight: 500; }
.spa__hero h1 em { color: var(--c-accent-deep); font-style: italic; }
.spa__hero p { color: var(--c-text-muted); font-size: 17px; line-height: 1.6; margin: 0; }

.rule { margin: var(--s-12) auto; max-width: 200px; }

.spa__layout { display: grid; grid-template-columns: 1fr 380px; gap: var(--s-12); }

.spa__list .eyebrow { display: block; margin-bottom: var(--s-4); }

.treatments { display: grid; gap: var(--s-4); }
.treatment {
  display: grid; grid-template-columns: 200px 1fr; gap: var(--s-5);
  background: var(--c-bg-card); border: 1px solid var(--c-border);
  cursor: pointer; transition: all var(--dur-base);
  animation: fadeUp 0.6s var(--ease-soft) both;
  overflow: hidden;
}
.treatment:hover { border-color: var(--c-ink); transform: translateX(4px); }
.treatment.active { border-color: var(--c-accent); background: var(--c-paper-soft); }

.treatment__image { aspect-ratio: 4 / 3; overflow: hidden; background: var(--c-paper); }
.treatment__image img { width: 100%; height: 100%; object-fit: cover; transition: transform var(--dur-slow); }
.treatment:hover .treatment__image img { transform: scale(1.05); }

.treatment__body { padding: var(--s-5) var(--s-5) var(--s-5) 0; display: flex; flex-direction: column; gap: 6px; }
.treatment__num { font-family: var(--c-font-display); font-size: 13px; color: var(--c-text-soft); font-feature-settings: 'tnum'; letter-spacing: 0.04em; }
.treatment h3 { font-size: 22px; line-height: 1.15; margin: 0; font-weight: 500; color: var(--c-ink); letter-spacing: -0.01em; }
.treatment p { color: var(--c-text-muted); font-size: 14px; line-height: 1.5; margin: 0; }

.treatment__meta { display: flex; align-items: baseline; gap: 8px; margin-top: var(--s-2); padding-top: var(--s-2); border-top: 1px solid var(--c-border); }
.treatment__duration { font-size: 11px; color: var(--c-accent-deep); font-weight: 600; letter-spacing: 0.12em; text-transform: uppercase; }
.treatment__sep { color: var(--c-text-faint); }
.treatment__price { font-size: 20px; font-weight: 500; color: var(--c-ink); font-feature-settings: 'tnum'; }

/* BOOKING */
.spa__booking { position: sticky; top: var(--s-12); align-self: start; }
.booking { background: var(--c-bg-card); border: 1px solid var(--c-border); padding: var(--s-8); display: flex; flex-direction: column; gap: var(--s-3); }
.booking__name { font-size: 26px; margin: var(--s-2) 0 var(--s-1); font-weight: 500; line-height: 1.15; }
.booking__sub { color: var(--c-text-muted); font-size: 14px; margin: 0; }
.booking__rule { width: 32px; height: 1px; background: var(--c-rule); border: 0; margin: var(--s-4) 0; }
.booking__label { display: block; margin: var(--s-3) 0 var(--s-3); }

.booking__empty { padding: var(--s-12) 0; text-align: center; }
.booking__empty p { color: var(--c-text-muted); margin: 0; font-size: 14px; }

.slots { display: grid; grid-template-columns: repeat(3, 1fr); gap: var(--s-2); margin-bottom: var(--s-2); }
.slot { padding: var(--s-3); background: var(--c-bg-card); border: 1px solid var(--c-border-strong); font-size: 14px; font-weight: 500; font-feature-settings: 'tnum'; transition: all var(--dur-fast); cursor: pointer; color: var(--c-ink); }
.slot:hover { background: var(--c-paper); }
.slot.active { background: var(--c-ink); color: white; border-color: var(--c-ink); }

.booking__input { padding: var(--s-3) var(--s-4); font-size: 16px; border: 1px solid var(--c-border-strong); background: var(--c-bg-card); transition: border-color var(--dur-fast); margin-bottom: var(--s-4); font-family: inherit; font-feature-settings: 'tnum'; }
.booking__input:focus { outline: none; border-color: var(--c-ink); }

.booking__confirm {
  padding: var(--s-4); margin-top: var(--s-3);
  background: var(--c-ink); color: white; border: none;
  font-size: 12px; font-weight: 600; letter-spacing: 0.16em; text-transform: uppercase;
  cursor: pointer; transition: background var(--dur-fast);
}
.booking__confirm:disabled { opacity: 0.3; cursor: not-allowed; }
.booking__confirm:not(:disabled):hover { background: var(--c-accent); }

.booking--success h3 { font-size: 26px; margin: var(--s-2) 0 0; font-weight: 500; line-height: 1.15; color: var(--c-success); }
.booking__summary { display: flex; flex-direction: column; gap: var(--s-3); margin: 0 0 var(--s-4); }
.booking__summary > div { display: flex; justify-content: space-between; gap: var(--s-3); padding-bottom: var(--s-2); border-bottom: 1px solid var(--c-border); }
.booking__summary dt { font-size: 11px; color: var(--c-text-muted); letter-spacing: 0.12em; text-transform: uppercase; font-weight: 600; }
.booking__summary dd { margin: 0; font-family: var(--c-font-display); font-size: 17px; color: var(--c-ink); font-style: italic; }
.booking__detail { color: var(--c-text-muted); font-size: 13px; line-height: 1.55; margin: 0 0 var(--s-4); }

@media (max-width: 1000px) {
  .spa__layout { grid-template-columns: 1fr; }
  .spa__booking { position: static; }
  .treatment { grid-template-columns: 1fr; }
  .treatment__image { aspect-ratio: 16 / 7; }
  .treatment__body { padding: var(--s-5); }
}
</style>
