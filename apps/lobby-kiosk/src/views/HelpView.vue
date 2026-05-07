<script setup lang="ts">
import { IonPage, IonContent } from '@ionic/vue';
import KioskHeader from '../components/KioskHeader.vue';
import Icon from '../components/Icon.vue';
import { useTenantStore } from '../stores/tenant';
import { ref, computed, onMounted, onUnmounted } from 'vue';

const tenantStore = useTenantStore();

// Live concierge presence (simulated)
const conciergeOnline = ref(true);
const responseTimeSec = ref(45 + Math.floor(Math.random() * 60));
const onlineCount = ref(3 + Math.floor(Math.random() * 3));
const concierges = [
  { name: 'Sophie', role: 'Conciergerie', avatar: 'S', langs: 'FR · EN · DE' },
  { name: 'Marc',   role: 'Réception',   avatar: 'M', langs: 'FR · EN · ES' },
  { name: 'Léa',    role: 'Conciergerie', avatar: 'L', langs: 'FR · EN · IT' },
  { name: 'Antoine',role: 'Voiturier',   avatar: 'A', langs: 'FR · EN' },
  { name: 'Yuki',   role: 'Conciergerie', avatar: 'Y', langs: 'FR · EN · JP · ZH' },
];
const liveTime = ref('');
let clockInterval: any = null;
function tickClock() { liveTime.value = new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit', second: '2-digit' }); }
onMounted(() => { tickClock(); clockInterval = setInterval(tickClock, 1000); });
onUnmounted(() => { if (clockInterval) clearInterval(clockInterval); });

const search = ref('');

interface FaqItem { id: string; cat: string; q: string; a: string; tags: string[]; }
const faqs: FaqItem[] = [
  { id: 'restau-hours', cat: 'Restauration', q: 'Quels sont les horaires du restaurant ?', tags: ['restaurant', 'manger', 'dîner', 'déjeuner'],
    a: 'Petit-déjeuner 6h30 — 10h30, déjeuner 12h — 14h30, dîner 19h — 22h30. Service en chambre disponible 24/24.' },
  { id: 'breakfast-room', cat: 'Restauration', q: 'Le petit-déjeuner peut-il être servi en chambre ?', tags: ['petit-déjeuner', 'breakfast', 'chambre'],
    a: 'Oui, dès 6h. Glissez la carte de petit-déjeuner sous votre porte avant minuit, ou commandez via la borne salon. Supplément 8 €.' },
  { id: 'shuttle', cat: 'Transport', q: 'Y a-t-il un service de navette aéroport ?', tags: ['navette', 'airport', 'aéroport', 'transfer', 'taxi'],
    a: 'Oui. Navette possible sur réservation 24 heures à l\'avance. Berline ou monospace selon le nombre de passagers. 65 € pour Lyon Saint-Exupéry.' },
  { id: 'parking', cat: 'Transport', q: 'Le parking est-il inclus ?', tags: ['parking', 'voiture', 'voiturier'],
    a: 'Voiturier inclus pour les résidents. Parking sécurisé et surveillé 24/24. Service récupération de véhicule en 5 minutes.' },
  { id: 'wifi', cat: 'Connectivité', q: 'Comment se connecter au Wi-Fi ?', tags: ['wifi', 'internet', 'connexion'],
    a: 'Réseau « HOTEL-GUEST ». Identifiants imprimés sur votre carte de chambre. Connexion fibre 1Gbps, gratuite et illimitée.' },
  { id: 'workspace', cat: 'Connectivité', q: 'Puis-je travailler depuis le hall ?', tags: ['business', 'travail', 'bureau'],
    a: 'Oui. Salon des résidents avec prises électriques à chaque table, café offert. Salles de réunion 4-12 personnes sur réservation.' },
  { id: 'checkout', cat: 'Séjour', q: 'À quelle heure est le check-out ?', tags: ['checkout', 'départ', 'partir'],
    a: 'Check-out à 12h. Late check-out possible jusqu\'à 16h sur demande, sans frais selon disponibilité. Express check-out via TV ou borne.' },
  { id: 'checkin', cat: 'Séjour', q: 'Puis-je arriver tôt et déposer mes bagages ?', tags: ['checkin', 'arrivée', 'bagages', 'consigne'],
    a: 'Bien sûr. Le check-in débute à 15h, mais nous gardons vos bagages en consigne sécurisée dès votre arrivée.' },
  { id: 'pets', cat: 'Confort', q: 'Acceptez-vous les animaux ?', tags: ['animal', 'chien', 'chat', 'pet'],
    a: 'Oui, jusqu\'à 10 kg. Participation 30 € par séjour pour le ménage. Panier, gamelles et friandises maison fournis.' },
  { id: 'kids', cat: 'Confort', q: 'Y a-t-il des services famille ?', tags: ['enfant', 'bébé', 'famille', 'kids'],
    a: 'Lit bébé, chaise haute et menu enfant offerts. Baby-sitting sur réservation 24 h à l\'avance. Cours de natation pour enfants au spa.' },
  { id: 'spa-access', cat: 'Bien-être', q: 'Le spa est-il inclus ?', tags: ['spa', 'piscine', 'hammam', 'massage'],
    a: 'Accès piscine, hammam et sauna inclus pour tous les résidents. Massages et soins du visage facturés séparément.' },
  { id: 'gift', cat: 'Bien-être', q: 'Puis-je offrir un soin spa ?', tags: ['cadeau', 'gift', 'voucher'],
    a: 'Oui, bons cadeaux disponibles à la réception ou directement en chambre. Personnalisables et envoyés par email immédiatement.' },
];

const categories = computed(() => Array.from(new Set(faqs.map((f) => f.cat))));
const activeCategory = ref<string | null>(null);

const filteredFaqs = computed(() => {
  let list = faqs;
  if (activeCategory.value) list = list.filter((f) => f.cat === activeCategory.value);
  const q = search.value.trim().toLowerCase();
  if (q) list = list.filter((f) =>
    f.q.toLowerCase().includes(q) ||
    f.a.toLowerCase().includes(q) ||
    f.tags.some((t) => t.includes(q)),
  );
  return list;
});
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

        <!-- LIVE CONCIERGE PRESENCE BAND -->
        <section class="presence fade-up" style="animation-delay: 100ms">
          <div class="presence__main">
            <div class="presence__avatars">
              <span v-for="(c, i) in concierges.slice(0, onlineCount)" :key="c.name"
                class="presence__avatar serif"
                :style="{ left: i * 28 + 'px', zIndex: onlineCount - i }"
                :title="`${c.name} · ${c.role}`">{{ c.avatar }}</span>
            </div>
            <div class="presence__text">
              <span class="presence__status">
                <span class="presence__dot"></span>
                <strong>{{ onlineCount }}</strong> {{ onlineCount > 1 ? 'concierges' : 'concierge' }} en ligne · réponse moyenne <strong>{{ responseTimeSec }}s</strong>
              </span>
              <span class="presence__sub">{{ concierges.slice(0, onlineCount).map(c => c.name).join(' · ') }}</span>
              <span class="presence__time mono">{{ liveTime }}</span>
            </div>
          </div>
          <div class="presence__action">
            <a :href="`tel:${tenantStore.tenant?.contact?.phone}`" class="presence__cta">Appeler maintenant →</a>
          </div>
        </section>

        <!-- CONTACT GRID -->
        <div class="help__cards">
          <a :href="`tel:${tenantStore.tenant?.contact?.phone}`" class="help-card help-card--primary fade-up" style="animation-delay: 60ms">
            <div class="help-card__icon"><Icon name="phone" :size="24" :stroke="1.2" /></div>
            <span class="help-card__eyebrow">Réception</span>
            <span class="help-card__value serif">{{ tenantStore.tenant?.contact?.phone }}</span>
            <span class="help-card__hint">24 heures sur 24, 7 jours sur 7</span>
            <span class="help-card__cta">Appeler →</span>
          </a>

          <a :href="`mailto:${tenantStore.tenant?.contact?.email}`" class="help-card fade-up" style="animation-delay: 120ms">
            <div class="help-card__icon"><Icon name="mail" :size="24" :stroke="1.2" /></div>
            <span class="help-card__eyebrow">Email</span>
            <span class="help-card__value serif">{{ tenantStore.tenant?.contact?.email }}</span>
            <span class="help-card__hint">Réponse sous une heure</span>
            <span class="help-card__cta">Écrire →</span>
          </a>

          <div class="help-card fade-up" style="animation-delay: 180ms">
            <div class="help-card__icon"><Icon name="pin" :size="24" :stroke="1.2" /></div>
            <span class="help-card__eyebrow">Adresse</span>
            <span class="help-card__value serif">{{ tenantStore.tenant?.contact?.address }}</span>
            <span class="help-card__hint">{{ tenantStore.tenant?.contact?.city }}, {{ tenantStore.tenant?.contact?.country }}</span>
            <a v-if="tenantStore.tenant?.contact?.lat" :href="`https://www.openstreetmap.org/?mlat=${tenantStore.tenant?.contact?.lat}&mlon=${tenantStore.tenant?.contact?.lng}#map=15/${tenantStore.tenant?.contact?.lat}/${tenantStore.tenant?.contact?.lng}`" target="_blank" class="help-card__cta">Voir sur la carte →</a>
          </div>
        </div>

        <hr class="rule" />

        <!-- FAQ SEARCH + CATEGORIES + LIST -->
        <section class="faq fade-up" style="animation-delay: 240ms">
          <header class="faq__header">
            <span class="eyebrow">Questions fréquentes</span>
            <h2 class="serif">Pour les détails <em>pratiques</em></h2>
          </header>

          <div class="faq__search">
            <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"><circle cx="11" cy="11" r="8"/><path d="M21 21l-4.35-4.35"/></svg>
            <input v-model="search" type="search" placeholder="Rechercher : wifi, navette, check-out, animal…" />
            <button v-if="search" @click="search = ''" class="faq__clear" aria-label="Effacer">×</button>
          </div>

          <div class="faq__cats">
            <button class="faq-cat" :class="{ active: !activeCategory }" @click="activeCategory = null">Toutes <span class="faq-cat__count">{{ faqs.length }}</span></button>
            <button v-for="c in categories" :key="c" class="faq-cat" :class="{ active: activeCategory === c }" @click="activeCategory = c">{{ c }} <span class="faq-cat__count">{{ faqs.filter(f => f.cat === c).length }}</span></button>
          </div>

          <div v-if="!filteredFaqs.length" class="faq__empty">
            <p>Aucune réponse ne correspond à votre recherche. Notre conciergerie répond directement :</p>
            <a :href="`tel:${tenantStore.tenant?.contact?.phone}`" class="faq__empty-cta">Appeler la réception →</a>
          </div>

          <details v-for="f in filteredFaqs" :key="f.id" class="faq__item">
            <summary>
              <div class="faq__q">
                <span class="faq__q-cat eyebrow">{{ f.cat }}</span>
                <span class="faq__q-text">{{ f.q }}</span>
              </div>
              <Icon name="plus" :size="14" />
            </summary>
            <p>{{ f.a }}</p>
          </details>
        </section>

        <!-- EMERGENCY BAR -->
        <section class="emergency fade-up" style="animation-delay: 360ms">
          <div class="emergency__icon">
            <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
              <circle cx="12" cy="12" r="10"/><path d="M12 8v4M12 16h.01"/>
            </svg>
          </div>
          <div class="emergency__body">
            <span class="eyebrow">Urgence médicale</span>
            <p>Appelez le <a href="tel:15">15 (SAMU)</a> ou notre médecin partenaire 24/24 via la réception. Pharmacie de garde à 200 m.</p>
          </div>
        </section>
      </div>
    </ion-content>
  </ion-page>
</template>

<style scoped>
.help { min-height: calc(100vh - 80px); padding: var(--s-12) var(--s-8) var(--s-20); max-width: 1120px; margin: 0 auto; }

.help__hero { text-align: center; max-width: 700px; margin: 0 auto var(--s-8); }
.help__hero h1 { font-size: clamp(40px, 6vw, 64px); line-height: 1.1; margin: var(--s-3) 0 var(--s-4); font-weight: 500; letter-spacing: -0.02em; }
.help__hero h1 em { color: var(--c-accent-deep); font-style: italic; }
.help__hero p { color: var(--c-text-muted); font-size: 17px; line-height: 1.6; margin: 0; }

/* PRESENCE BAND */
.presence { display: grid; grid-template-columns: 1fr auto; gap: 24px; align-items: center; padding: 18px 24px; background: var(--c-bg-card); border: 1px solid var(--c-border); margin: var(--s-8) 0; }
.presence__main { display: flex; align-items: center; gap: 24px; }
.presence__avatars { position: relative; height: 36px; flex-shrink: 0; }
.presence__avatars { width: calc(36px + (28px * 4)); }
.presence__avatar { position: absolute; top: 0; width: 36px; height: 36px; background: var(--c-ink); color: var(--c-paper); display: grid; place-items: center; font-size: 14px; font-weight: 600; border-radius: 50%; border: 2px solid var(--c-bg-card); }
.presence__text { display: flex; flex-direction: column; gap: 2px; line-height: 1.3; }
.presence__status { font-size: 14px; color: var(--c-ink); display: inline-flex; align-items: center; gap: 6px; }
.presence__status strong { color: var(--c-ink); font-weight: 600; }
.presence__dot { width: 7px; height: 7px; border-radius: 50%; background: #36644a; box-shadow: 0 0 8px rgba(54,100,74,0.5); animation: pulse 1.6s ease-in-out infinite; }
.presence__sub { font-size: 11px; color: var(--c-text-soft); letter-spacing: 0.04em; }
.presence__time { font-size: 11px; color: var(--c-text-muted); padding-top: 2px; font-feature-settings: 'tnum'; }
.presence__cta { padding: 12px 22px; background: var(--c-accent); color: white; font-size: 12px; font-weight: 600; letter-spacing: 0.14em; text-transform: uppercase; text-decoration: none; transition: all 0.2s; display: inline-block; }
.presence__cta:hover { background: var(--c-accent-deep); }
@keyframes pulse { 0%,100% { opacity: 1; transform: scale(1); } 50% { opacity: 0.5; transform: scale(1.4); } }

/* CONTACT CARDS */
.help__cards { display: grid; grid-template-columns: repeat(3, 1fr); gap: 0; margin-top: var(--s-6); border: 1px solid var(--c-border); }
.help-card { display: flex; flex-direction: column; gap: var(--s-3); padding: var(--s-8); border-right: 1px solid var(--c-border); background: var(--c-bg-card); text-decoration: none; color: inherit; transition: all var(--dur-base); }
.help-card:last-child { border-right: none; }
.help-card:hover { background: var(--c-paper); transform: translateY(-1px); }
.help-card--primary { background: var(--c-ink); color: white; border-right-color: rgba(245,240,232,0.15); }
.help-card--primary:hover { background: var(--c-accent); }
.help-card__icon { width: 48px; height: 48px; background: var(--c-paper); color: var(--c-ink); display: grid; place-items: center; margin-bottom: var(--s-2); }
.help-card--primary .help-card__icon { background: rgba(245,240,232,0.15); color: var(--c-paper); }
.help-card__eyebrow { font-size: 10px; font-weight: 600; letter-spacing: 0.18em; text-transform: uppercase; opacity: 0.7; }
.help-card__value { font-size: 20px; font-weight: 500; line-height: 1.25; word-break: break-word; }
.help-card__hint { font-size: 13px; opacity: 0.7; margin-top: 2px; }
.help-card__cta { font-size: 11px; font-weight: 600; letter-spacing: 0.14em; text-transform: uppercase; margin-top: 8px; padding-top: 12px; border-top: 1px solid currentColor; opacity: 0.8; align-self: flex-start; text-decoration: none; color: inherit; }
.help-card:hover .help-card__cta { opacity: 1; }

.rule { margin: var(--s-12) auto; max-width: 200px; }

/* FAQ */
.faq__header { text-align: center; margin-bottom: var(--s-6); }
.faq__header h2 { font-size: clamp(28px, 4vw, 42px); margin: var(--s-2) 0 0; font-weight: 500; line-height: 1.2; letter-spacing: -0.01em; }
.faq__header h2 em { color: var(--c-accent-deep); font-style: italic; }

.faq__search { display: flex; align-items: center; gap: 10px; padding: 14px 18px; background: var(--c-bg-card); border: 1px solid var(--c-border-strong); margin: 0 auto var(--s-4); max-width: 640px; transition: all 0.2s; }
.faq__search:focus-within { border-color: var(--c-ink); box-shadow: 0 0 0 3px rgba(20,32,46,0.06); }
.faq__search svg { color: var(--c-text-muted); flex-shrink: 0; }
.faq__search input { flex: 1; border: none; background: transparent; font-size: 15px; font-family: inherit; color: var(--c-ink); outline: none; padding: 0; }
.faq__search input::placeholder { color: var(--c-text-soft); }
.faq__clear { width: 24px; height: 24px; background: var(--c-paper); border: none; font-size: 18px; color: var(--c-text-muted); cursor: pointer; line-height: 1; display: grid; place-items: center; }

.faq__cats { display: flex; flex-wrap: wrap; gap: 8px; justify-content: center; margin: 0 auto var(--s-6); max-width: 720px; }
.faq-cat { padding: 8px 14px; background: transparent; border: 1px solid var(--c-border-strong); font-family: inherit; font-size: 12px; font-weight: 500; color: var(--c-text-muted); cursor: pointer; display: inline-flex; align-items: center; gap: 6px; transition: all 0.2s; }
.faq-cat:hover { color: var(--c-ink); border-color: var(--c-ink); }
.faq-cat.active { background: var(--c-ink); color: white; border-color: var(--c-ink); }
.faq-cat__count { font-family: 'JetBrains Mono', monospace; font-size: 10px; color: inherit; opacity: 0.7; }

.faq__empty { text-align: center; padding: var(--s-12) var(--s-6); color: var(--c-text-muted); border: 1px dashed var(--c-border-strong); }
.faq__empty-cta { display: inline-block; margin-top: 12px; padding: 10px 18px; background: var(--c-ink); color: white; text-decoration: none; font-size: 11px; font-weight: 600; letter-spacing: 0.14em; text-transform: uppercase; }

.faq__item { border-top: 1px solid var(--c-border); transition: all 0.2s; }
.faq__item:last-child { border-bottom: 1px solid var(--c-border); }
.faq__item summary { font-family: var(--c-font-display); font-size: 22px; font-weight: 500; cursor: pointer; list-style: none; padding: var(--s-5) 0; display: flex; justify-content: space-between; align-items: center; gap: var(--s-4); transition: color var(--dur-fast); }
.faq__item summary::-webkit-details-marker { display: none; }
.faq__q { display: flex; flex-direction: column; gap: 2px; }
.faq__q-cat { color: var(--c-accent-deep); font-size: 9px; }
.faq__q-text { color: var(--c-ink); }
.faq__item summary :deep(svg) { transition: transform var(--dur-base); color: var(--c-text-muted); flex-shrink: 0; }
.faq__item:hover summary { color: var(--c-accent-deep); }
.faq__item:hover summary :deep(svg) { color: var(--c-accent-deep); }
.faq__item[open] summary :deep(svg) { transform: rotate(45deg); color: var(--c-accent); }
.faq__item p { color: var(--c-text-muted); margin: 0 0 var(--s-5); line-height: 1.7; font-size: 15px; padding-right: var(--s-12); }

/* EMERGENCY */
.emergency { display: grid; grid-template-columns: 56px 1fr; gap: 16px; align-items: center; margin-top: var(--s-12); padding: 18px 22px; background: rgba(145,53,40,0.04); border-left: 3px solid var(--c-danger); }
.emergency__icon { width: 48px; height: 48px; background: var(--c-danger); color: white; display: grid; place-items: center; }
.emergency__body p { font-size: 13px; line-height: 1.5; color: var(--c-text-muted); margin: 4px 0 0; }
.emergency__body a { color: var(--c-danger); font-weight: 600; text-decoration: none; }
.emergency .eyebrow { color: var(--c-danger); }

@media (max-width: 900px) {
  .help__cards { grid-template-columns: 1fr; }
  .help-card { border-right: none; border-bottom: 1px solid var(--c-border); }
  .help-card:last-child { border-bottom: none; }
  .presence { grid-template-columns: 1fr; }
  .presence__main { flex-direction: column; align-items: flex-start; gap: 14px; }
  .presence__action { width: 100%; }
  .presence__cta { display: block; text-align: center; }
}
</style>
