<script setup lang="ts">
import { IonPage, IonContent } from '@ionic/vue';
import KioskHeader from '../components/KioskHeader.vue';
import Icon from '../components/Icon.vue';
import { computed, onMounted, onUnmounted, ref } from 'vue';
import { useTenantStore } from '../stores/tenant';
import { api } from '../api';
import { useI18n } from 'vue-i18n';

const tenantStore = useTenantStore();
const i18n = useI18n();

type Category = 'all' | 'concierge' | 'transport' | 'wellness' | 'family' | 'connect' | 'laundry';

interface Service {
  id: string;
  category: Exclude<Category, 'all'>;
  icon: string;
  title: string;
  desc: string;
  hero: string;          // Unsplash URL
  hours: string;         // human-readable
  available: () => boolean;
  tag: string;           // "Inclus", "20 € / heure", etc.
  fields: { key: string; label: string; type: 'text' | 'time' | 'date' | 'number' | 'select'; options?: string[]; placeholder?: string; required?: boolean }[];
  defaultNotes?: (form: Record<string, string>) => string;
}

function inHours(open: number, close: number): boolean {
  const h = new Date().getHours();
  return h >= open && h < close;
}

const services: Service[] = [
  {
    id: 'concierge', category: 'concierge', icon: 'bell',
    title: 'Conciergerie 24/24',
    desc: 'Une équipe entièrement dédiée à orchestrer chaque détail de votre séjour, jour et nuit.',
    hero: 'https://images.unsplash.com/photo-1564501049412-61c2a3083791?w=900&q=85',
    hours: 'Sans interruption · 24/24', available: () => true, tag: 'Inclus',
    fields: [
      { key: 'subject', label: 'Sujet de votre demande', type: 'text', placeholder: 'Réservation table chez Bocuse, ce soir 20h…', required: true },
      { key: 'urgency', label: 'Urgence', type: 'select', options: ['Standard', 'Urgent', 'Pas urgent — quand vous pouvez'] },
    ],
    defaultNotes: (f) => `Conciergerie · ${f.urgency || 'Standard'} · ${f.subject || ''}`,
  },
  {
    id: 'taxi', category: 'transport', icon: 'phone',
    title: 'Taxi & Berline',
    desc: 'Taxi standard, berline avec chauffeur ou navette aéroport — votre voiturier s\'en occupe.',
    hero: 'https://images.unsplash.com/photo-1538108149393-fbbd81895907?w=900&q=85',
    hours: 'Sans interruption', available: () => true, tag: 'Sur demande',
    fields: [
      { key: 'destination', label: 'Destination', type: 'text', placeholder: 'Aéroport Lyon Saint-Exupéry', required: true },
      { key: 'when', label: 'Heure souhaitée', type: 'time', required: true },
      { key: 'category', label: 'Type', type: 'select', options: ['Taxi standard', 'Berline avec chauffeur', 'Navette aéroport'] },
      { key: 'pax', label: 'Nombre de passagers', type: 'number', placeholder: '2' },
    ],
    defaultNotes: (f) => `Taxi · ${f.category || 'Standard'} · ${f.pax || 1} pax · ${f.when || '—'} → ${f.destination}`,
  },
  {
    id: 'voiturier', category: 'transport', icon: 'pin',
    title: 'Voiturier',
    desc: 'Service voiturier inclus pour les résidents et leurs invités. Récupération immédiate de votre véhicule.',
    hero: 'https://images.unsplash.com/photo-1502877338535-766e1452684a?w=900&q=85',
    hours: 'Sans interruption', available: () => true, tag: 'Inclus',
    fields: [
      { key: 'action', label: 'Action', type: 'select', options: ['Récupérer mon véhicule', 'Déposer un véhicule', 'Récupérer un invité'], required: true },
      { key: 'when', label: 'Dans combien de temps', type: 'select', options: ['Maintenant', 'Dans 15 min', 'Dans 30 min', 'Dans 1h'] },
      { key: 'plate', label: 'Plaque (si récupération)', type: 'text', placeholder: 'AA-123-BB' },
    ],
    defaultNotes: (f) => `Voiturier · ${f.action || ''} · ${f.when || ''} · ${f.plate || ''}`.trim(),
  },
  {
    id: 'spa', category: 'wellness', icon: 'spa',
    title: 'Spa Sothys',
    desc: 'Massages, soins du visage, rituels énergétiques — réservation directe sans passer par la réception.',
    hero: 'https://images.unsplash.com/photo-1540555700478-4be289fbecef?w=900&q=85',
    hours: '9h — 21h', available: () => inHours(9, 21), tag: 'Sur réservation',
    fields: [
      { key: 'treatment', label: 'Soin', type: 'select', options: ['Massage signature 60min · 110 €', 'Massage profond 90min · 160 €', 'Rituel visage Lift Express · 85 €', 'Hammam + sauna (accès résidents)'] , required: true },
      { key: 'when', label: 'Heure souhaitée', type: 'time', required: true },
      { key: 'pax', label: 'Personnes', type: 'number', placeholder: '1' },
    ],
    defaultNotes: (f) => `Spa · ${f.treatment || ''} · ${f.when || ''} · ${f.pax || 1} pax`,
  },
  {
    id: 'fitness', category: 'wellness', icon: 'sun',
    title: 'Piscine & Fitness',
    desc: 'Bassin chauffé 18m et salle de sport climatisée. Ouverture 24/24 sur carte de chambre.',
    hero: 'https://images.unsplash.com/photo-1571902943202-507ec2618e8f?w=900&q=85',
    hours: '6h — 23h', available: () => inHours(6, 23), tag: 'Inclus',
    fields: [
      { key: 'equipment', label: 'Demande', type: 'select', options: ['Coach personnel sur séance', 'Réserver un cours collectif', 'Demander une serviette propre', 'Question à un coach'] },
    ],
    defaultNotes: (f) => `Fitness · ${f.equipment || 'Demande générale'}`,
  },
  {
    id: 'wakeup', category: 'concierge', icon: 'bell',
    title: 'Réveil personnalisé',
    desc: 'Réveil avec petit-déjeuner livré, jus pressé du matin, ou musique au choix. À l\'heure exacte.',
    hero: 'https://images.unsplash.com/photo-1519214605650-76a613ee3245?w=900&q=85',
    hours: 'Sans interruption', available: () => true, tag: 'Inclus',
    fields: [
      { key: 'when', label: 'Heure de réveil', type: 'time', required: true },
      { key: 'style', label: 'Style', type: 'select', options: ['Téléphone uniquement', 'Téléphone + lumières', 'Téléphone + petit-déjeuner livré 5 min après'] },
      { key: 'date', label: 'Jour', type: 'date' },
    ],
    defaultNotes: (f) => `Réveil · ${f.when || ''} le ${f.date || 'demain'} · ${f.style || ''}`,
  },
  {
    id: 'laundry', category: 'laundry', icon: 'mail',
    title: 'Pressing & Blanchisserie',
    desc: 'Service standard 4 heures ou express 1 heure. Repassage, lavage, nettoyage à sec.',
    hero: 'https://images.unsplash.com/photo-1545173168-9f1947eebb7f?w=900&q=85',
    hours: '7h — 22h', available: () => inHours(7, 22), tag: 'À partir de 12 €',
    fields: [
      { key: 'speed', label: 'Délai', type: 'select', options: ['Standard 4h · tarif normal', 'Express 1h · supplément 50 %', 'Le lendemain matin'], required: true },
      { key: 'items', label: 'Articles', type: 'text', placeholder: '2 chemises, 1 costume, 3 t-shirts…', required: true },
    ],
    defaultNotes: (f) => `Pressing · ${f.speed || ''} · ${f.items || ''}`,
  },
  {
    id: 'babysit', category: 'family', icon: 'help',
    title: 'Garde d\'enfants',
    desc: 'Baby-sitters certifiées, jeux et activités encadrées — soir, journée ou réservation hebdomadaire.',
    hero: 'https://images.unsplash.com/photo-1503454537195-1dcabb73ffb9?w=900&q=85',
    hours: 'Sur réservation', available: () => true, tag: '20 € / heure',
    fields: [
      { key: 'age', label: 'Âge des enfants', type: 'text', placeholder: '3 et 6 ans', required: true },
      { key: 'when_start', label: 'Début', type: 'time', required: true },
      { key: 'duration', label: 'Durée', type: 'select', options: ['1h', '2h', '3h', '4h', 'Soirée complète'] },
      { key: 'lang', label: 'Langue préférée du baby-sitter', type: 'select', options: ['Français', 'English', 'Deutsch', 'Español', 'Italiano'] },
    ],
    defaultNotes: (f) => `Baby-sitting · ${f.age || ''} · ${f.when_start || ''} · ${f.duration || ''} · ${f.lang || 'FR'}`,
  },
  {
    id: 'wifi', category: 'connect', icon: 'wifi',
    title: 'Wi-Fi & Centre d\'affaires',
    desc: 'Fibre dédiée 1Gbps gratuite. Salles de réunion équipées, secrétariat, impression.',
    hero: 'https://images.unsplash.com/photo-1497366216548-37526070297c?w=900&q=85',
    hours: 'Sans interruption', available: () => true, tag: 'Inclus',
    fields: [
      { key: 'need', label: 'Besoin', type: 'select', options: ['Code Wi-Fi oublié', 'Réserver une salle de réunion', 'Demander une impression', 'Aide IT'], required: true },
      { key: 'when', label: 'Quand', type: 'select', options: ['Maintenant', 'Dans 1h', 'Plus tard'] },
      { key: 'pax', label: 'Nombre de personnes (si salle)', type: 'number' },
    ],
    defaultNotes: (f) => `Connectivité · ${f.need || ''} · ${f.when || ''} · ${f.pax || ''}`,
  },
];

const categories: { key: Category; label: string }[] = [
  { key: 'all',       label: 'Tous nos services' },
  { key: 'concierge', label: 'Conciergerie' },
  { key: 'transport', label: 'Transport' },
  { key: 'wellness',  label: 'Bien-être' },
  { key: 'family',    label: 'Famille' },
  { key: 'laundry',   label: 'Pressing' },
  { key: 'connect',   label: 'Connectivité' },
];

const activeCategory = ref<Category>('all');
const filteredServices = computed(() =>
  activeCategory.value === 'all'
    ? services
    : services.filter((s) => s.category === activeCategory.value),
);

// Live tick — re-evaluate availability every minute
const tick = ref(0);
let tickInterval: any = null;
onMounted(() => { tickInterval = setInterval(() => (tick.value++), 60000); });
onUnmounted(() => { if (tickInterval) clearInterval(tickInterval); });

// Mocked staff online presence (simulates Socket.io presence channel)
const staffOnline = ref(4);
const staffNames = ['Sophie', 'Marc', 'Léa', 'Antoine', 'Marie'];

// Request modal
const selected = ref<Service | null>(null);
const room = ref('');
const formValues = ref<Record<string, string>>({});
const submitting = ref(false);
const sent = ref(false);
const error = ref<string | null>(null);

function open(s: Service) {
  selected.value = s; sent.value = false; error.value = null;
  formValues.value = {};
  setTimeout(() => document.querySelector('.req-modal__form input, .req-modal__form select')?.dispatchEvent(new Event('focus')), 100);
}
function close() { selected.value = null; }

async function submit() {
  if (!selected.value || !tenantStore.tenant || !room.value.trim()) {
    error.value = 'Merci d\'indiquer votre numéro de chambre.'; return;
  }
  // Required field check
  const missing = selected.value.fields.filter((f) => f.required && !formValues.value[f.key]?.trim()).map((f) => f.label);
  if (missing.length) { error.value = `Champ requis : ${missing.join(', ')}`; return; }
  submitting.value = true; error.value = null;
  try {
    // Carrier menu item — first available "housekeeping" or fallback to any
    const { data: menu } = await api.get<any[]>(`/orders/menu?tenantId=${tenantStore.tenant.id}`);
    const carrier = menu.find((m) => m.category === 'housekeeping') || menu.find((m) => m.category === 'taxi') || menu[0];
    if (!carrier) throw new Error('Pas de support de commande disponible.');
    const notes = selected.value.defaultNotes ? selected.value.defaultNotes(formValues.value) : selected.value.title;
    await api.post('/orders', {
      tenantId: tenantStore.tenant.id, room: room.value.trim(),
      items: [{ menuItemId: carrier.id, quantity: 1, notes }],
      source: 'kiosk', locale: i18n.locale.value,
      notes: `${selected.value.title} · ${notes}`,
    });
    sent.value = true;
  } catch (e: any) {
    error.value = e?.response?.data?.message || e?.message || 'La demande n\'a pas pu être envoyée.';
  } finally {
    submitting.value = false;
  }
}

function reset() { sent.value = false; selected.value = null; room.value = ''; formValues.value = {}; }
</script>

<template>
  <ion-page>
    <KioskHeader title="Services" />
    <ion-content :fullscreen="true">
      <div class="services">
        <!-- HERO -->
        <header class="services__hero fade-up">
          <span class="eyebrow">À votre service</span>
          <h1 class="serif">
            Une <em>attention</em> permanente,<br/>
            une <em>discrétion</em> absolue.
          </h1>
          <p>Chaque service de la maison est pensé pour rendre votre séjour aussi simple qu'agréable. Sélectionnez ci-dessous, nous nous chargeons du reste.</p>

          <!-- Live staff presence -->
          <div class="presence fade-up" style="animation-delay: 200ms">
            <div class="presence__avatars">
              <span v-for="(name, i) in staffNames.slice(0, staffOnline)" :key="name" class="presence__avatar serif" :style="{ left: i * 22 + 'px', zIndex: staffOnline - i }">{{ name.charAt(0) }}</span>
            </div>
            <div class="presence__text">
              <span class="presence__dot"></span>
              <span class="presence__count"><strong>{{ staffOnline }}</strong> {{ staffOnline > 1 ? 'concierges' : 'concierge' }} en ligne</span>
              <span class="presence__sub">{{ staffNames.slice(0, staffOnline).join(' · ') }} · réponse en moyenne sous 90 sec</span>
            </div>
          </div>
        </header>

        <!-- Category filter -->
        <nav class="cats fade-up" style="animation-delay: 300ms">
          <button
            v-for="c in categories" :key="c.key"
            class="cat" :class="{ active: activeCategory === c.key }"
            @click="activeCategory = c.key"
          >{{ c.label }}<span class="cat__count" v-if="c.key !== 'all'">{{ services.filter(s => s.category === c.key).length }}</span></button>
        </nav>

        <!-- Service grid -->
        <div class="services__grid">
          <article
            v-for="(s, idx) in filteredServices"
            :key="s.id"
            class="srv"
            :style="{ animationDelay: `${idx * 60}ms` }"
            @click="open(s)"
            @keydown.enter="open(s)"
            tabindex="0"
            role="button"
          >
            <div class="srv__image">
              <img :src="s.hero" :alt="s.title" loading="lazy" />
              <span class="srv__status" :class="{ 'srv__status--open': s.available(), 'srv__status--closed': !s.available() }">
                <span class="srv__status-dot"></span>
                {{ s.available() ? 'Disponible' : 'Fermé' }}
              </span>
            </div>
            <div class="srv__body">
              <div class="srv__head">
                <span class="eyebrow">{{ categories.find(c => c.key === s.category)?.label }}</span>
                <span class="srv__num mono">{{ String(idx + 1).padStart(2, '0') }}</span>
              </div>
              <h3 class="srv__title serif">{{ s.title }}</h3>
              <p class="srv__desc">{{ s.desc }}</p>
              <div class="srv__meta">
                <span class="srv__hours">{{ s.hours }}</span>
                <span class="srv__sep">·</span>
                <span class="srv__tag">{{ s.tag }}</span>
              </div>
              <span class="srv__cta">Demander <Icon name="arrow-right" :size="13" /></span>
            </div>
          </article>
          <div v-if="!filteredServices.length" class="empty">Aucun service dans cette catégorie.</div>
        </div>
      </div>

      <!-- REQUEST MODAL -->
      <transition name="req-fade">
        <div v-if="selected" class="req-overlay" @click.self="close">
          <div class="req-modal">
            <header class="req-modal__head" :style="{ backgroundImage: 'linear-gradient(rgba(20,32,46,0.55), rgba(20,32,46,0.85)), url(' + (selected!.hero) + ')' }">
              <span class="eyebrow" style="color: var(--c-accent-soft)">{{ categories.find(c => c.key === selected!.category)?.label }}</span>
              <h2 class="serif">{{ selected!.title }}</h2>
              <p>{{ selected!.desc }}</p>
              <button class="req-modal__close" @click="close" aria-label="Fermer">×</button>
            </header>

            <div class="req-modal__body" v-if="!sent">
              <form class="req-modal__form" @submit.prevent="submit">
                <label class="req-field">
                  <span class="eyebrow">Numéro de chambre</span>
                  <input v-model="room" type="tel" inputmode="numeric" placeholder="ex. 204" required />
                </label>

                <label v-for="f in selected!.fields" :key="f.key" class="req-field">
                  <span class="eyebrow">{{ f.label }}<span v-if="f.required" class="req-required"> · requis</span></span>
                  <input v-if="f.type === 'text'" v-model="formValues[f.key]" type="text" :placeholder="f.placeholder || ''" :required="f.required" />
                  <input v-else-if="f.type === 'time'" v-model="formValues[f.key]" type="time" :required="f.required" />
                  <input v-else-if="f.type === 'date'" v-model="formValues[f.key]" type="date" :required="f.required" />
                  <input v-else-if="f.type === 'number'" v-model="formValues[f.key]" type="number" min="1" :placeholder="f.placeholder || ''" :required="f.required" />
                  <select v-else-if="f.type === 'select'" v-model="formValues[f.key]" :required="f.required">
                    <option value="" disabled>Sélectionner…</option>
                    <option v-for="opt in f.options" :key="opt" :value="opt">{{ opt }}</option>
                  </select>
                </label>

                <p v-if="error" class="req-error">{{ error }}</p>

                <div class="req-actions">
                  <button type="button" class="btn-secondary" @click="close">Annuler</button>
                  <button type="submit" class="btn-primary" :disabled="submitting">
                    <span v-if="!submitting">Envoyer la demande</span>
                    <span v-else>Envoi en cours…</span>
                  </button>
                </div>
              </form>
            </div>

            <div v-else class="req-modal__success">
              <svg viewBox="0 0 80 80" width="56" height="56" fill="none" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round">
                <circle cx="40" cy="40" r="36"/>
                <path d="M26 42 L36 52 L56 30"/>
              </svg>
              <span class="eyebrow">Demande reçue</span>
              <h3 class="serif">Notre équipe s'en occupe.</h3>
              <p>Vous recevrez une confirmation en chambre dans quelques instants. Merci pour votre confiance.</p>
              <div class="req-actions">
                <button class="btn-secondary" @click="reset">Nouvelle demande</button>
                <button class="btn-primary" @click="close">Retour à l'accueil</button>
              </div>
            </div>
          </div>
        </div>
      </transition>
    </ion-content>
  </ion-page>
</template>

<style scoped>
.services { min-height: calc(100vh - 80px); padding: var(--s-12) var(--s-8) var(--s-16); max-width: 1320px; margin: 0 auto; }

/* HERO */
.services__hero { text-align: center; max-width: 760px; margin: 0 auto var(--s-8); }
.services__hero h1 { font-size: clamp(36px, 5vw, 56px); line-height: 1.1; margin: var(--s-3) 0 var(--s-4); font-weight: 500; letter-spacing: -0.02em; }
.services__hero h1 em { color: var(--c-accent-deep); font-style: italic; }
.services__hero p { color: var(--c-text-muted); font-size: 16px; line-height: 1.6; margin: 0; }

/* PRESENCE BAND */
.presence { display: inline-flex; align-items: center; gap: 16px; padding: 10px 18px 10px 14px; background: var(--c-bg-card); border: 1px solid var(--c-border); margin-top: var(--s-6); }
.presence__avatars { position: relative; width: 80px; height: 32px; }
.presence__avatar { position: absolute; top: 0; width: 32px; height: 32px; background: var(--c-ink); color: var(--c-paper); display: grid; place-items: center; font-size: 12px; font-weight: 600; border: 2px solid var(--c-bg-card); border-radius: 50%; }
.presence__text { display: flex; flex-direction: column; align-items: flex-start; gap: 2px; line-height: 1.15; }
.presence__count { font-size: 13px; color: var(--c-ink); display: inline-flex; align-items: center; gap: 6px; }
.presence__count strong { font-weight: 600; }
.presence__dot { width: 6px; height: 6px; border-radius: 50%; background: #36644a; box-shadow: 0 0 8px rgba(54,100,74,0.5); animation: pulse 1.6s ease-in-out infinite; }
.presence__sub { font-size: 11px; color: var(--c-text-soft); letter-spacing: 0.04em; }
@keyframes pulse { 0%,100% { opacity: 1; transform: scale(1); } 50% { opacity: 0.5; transform: scale(1.4); } }

/* CATEGORY FILTER */
.cats { display: flex; gap: 6px; flex-wrap: wrap; justify-content: center; margin: var(--s-8) 0 var(--s-8); padding: var(--s-3) 0; border-top: 1px solid var(--c-border); border-bottom: 1px solid var(--c-border); }
.cat { padding: 10px 18px; background: transparent; border: 1px solid transparent; cursor: pointer; font-family: 'Cormorant Garamond', serif; font-size: 16px; color: var(--c-text-muted); transition: all 0.2s; display: inline-flex; align-items: center; gap: 8px; }
.cat:hover { color: var(--c-ink); }
.cat.active { color: var(--c-ink); border-color: var(--c-accent); background: var(--c-paper); }
.cat__count { font-family: 'JetBrains Mono', monospace; font-size: 10px; color: var(--c-text-soft); padding: 2px 6px; background: var(--c-bg-card); }
.cat.active .cat__count { background: var(--c-accent); color: white; }

/* SERVICE GRID */
.services__grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 24px; }
.srv {
  background: var(--c-bg-card); border: 1px solid var(--c-border);
  display: flex; flex-direction: column; cursor: pointer;
  transition: all 0.3s var(--ease-spring);
  animation: fadeUp 0.6s var(--ease-soft) both;
  overflow: hidden;
}
.srv:hover { transform: translateY(-3px); border-color: var(--c-border-strong); box-shadow: 0 16px 40px rgba(20,32,46,0.08); }

.srv__image { position: relative; aspect-ratio: 16 / 9; overflow: hidden; background: var(--c-paper); }
.srv__image img { width: 100%; height: 100%; object-fit: cover; transition: transform 0.6s var(--ease-spring); }
.srv:hover .srv__image img { transform: scale(1.05); }
.srv__status { position: absolute; top: 12px; right: 12px; display: inline-flex; align-items: center; gap: 6px; padding: 5px 12px 5px 10px; background: rgba(255,255,255,0.94); backdrop-filter: blur(6px); -webkit-backdrop-filter: blur(6px); font-size: 10px; font-weight: 600; letter-spacing: 0.1em; text-transform: uppercase; }
.srv__status-dot { width: 6px; height: 6px; border-radius: 50%; }
.srv__status--open { color: #36644a; }
.srv__status--open .srv__status-dot { background: #36644a; box-shadow: 0 0 6px rgba(54,100,74,0.6); }
.srv__status--closed { color: var(--c-text-soft); }
.srv__status--closed .srv__status-dot { background: var(--c-text-soft); }

.srv__body { padding: var(--s-6); display: flex; flex-direction: column; gap: var(--s-3); flex: 1; }
.srv__head { display: flex; justify-content: space-between; align-items: center; }
.srv__num { font-size: 11px; color: var(--c-text-soft); }
.srv__title { font-size: 24px; line-height: 1.15; margin: 0; font-weight: 500; color: var(--c-ink); letter-spacing: -0.01em; }
.srv__desc { color: var(--c-text-muted); font-size: 14px; line-height: 1.55; margin: 0; flex: 1; }
.srv__meta { display: flex; gap: 8px; font-size: 12px; color: var(--c-text-muted); align-items: center; padding-top: var(--s-2); border-top: 1px solid var(--c-border); }
.srv__hours { font-feature-settings: 'tnum'; }
.srv__sep { color: var(--c-text-soft); }
.srv__tag { color: var(--c-accent-deep); font-weight: 500; }
.srv__cta { display: inline-flex; align-items: center; gap: 8px; font-size: 11px; font-weight: 600; letter-spacing: 0.16em; text-transform: uppercase; color: var(--c-accent-deep); transition: gap 0.2s; }
.srv:hover .srv__cta { gap: 14px; color: var(--c-ink); }

.empty { grid-column: 1 / -1; padding: var(--s-12); text-align: center; color: var(--c-text-soft); font-size: 14px; }

/* REQUEST MODAL */
.req-overlay {
  position: fixed; inset: 0; z-index: 90;
  background: rgba(20,32,46,0.55); backdrop-filter: blur(8px); -webkit-backdrop-filter: blur(8px);
  display: grid; place-items: center; padding: 24px;
}
.req-modal { width: 100%; max-width: 560px; max-height: 92vh; overflow: hidden; background: var(--c-bg-card); display: flex; flex-direction: column; box-shadow: 0 32px 80px rgba(20,32,46,0.32); }
.req-modal__head { position: relative; padding: 36px 28px 24px; background-size: cover; background-position: center; color: white; }
.req-modal__head h2 { font-size: 32px; line-height: 1.1; margin: 8px 0 12px; font-weight: 500; letter-spacing: -0.02em; }
.req-modal__head p { font-size: 14px; line-height: 1.55; color: rgba(255,255,255,0.85); margin: 0; max-width: 420px; }
.req-modal__close { position: absolute; top: 16px; right: 16px; width: 36px; height: 36px; background: rgba(245,240,232,0.95); color: var(--c-ink); border: none; font-size: 22px; line-height: 1; cursor: pointer; display: grid; place-items: center; }
.req-modal__close:hover { background: white; }

.req-modal__body { padding: 24px 28px 28px; overflow-y: auto; }
.req-modal__form { display: flex; flex-direction: column; gap: 14px; }
.req-field { display: flex; flex-direction: column; gap: 6px; }
.req-field input, .req-field select { padding: 12px 14px; border: 1px solid var(--c-border-strong); background: var(--c-bg-card); font-family: inherit; font-size: 14px; color: var(--c-ink); transition: all 0.2s; }
.req-field input:focus, .req-field select:focus { outline: none; border-color: var(--c-ink); box-shadow: 0 0 0 3px rgba(20,32,46,0.06); }
.req-required { color: var(--c-accent-deep); font-weight: 600; }
.req-error { color: var(--c-danger); background: rgba(145,53,40,0.08); padding: 10px 14px; font-size: 13px; margin: 0; border-left: 2px solid var(--c-danger); }
.req-actions { display: flex; gap: 10px; margin-top: 8px; }
.req-actions button { flex: 1; padding: 14px; font-size: 12px; font-weight: 600; letter-spacing: 0.14em; text-transform: uppercase; border: 1px solid var(--c-border-strong); background: var(--c-bg-card); color: var(--c-ink); cursor: pointer; font-family: inherit; transition: all 0.2s; }
.req-actions .btn-secondary:hover { background: var(--c-paper); }
.req-actions .btn-primary { background: var(--c-ink); color: white; border-color: var(--c-ink); }
.req-actions .btn-primary:hover:not(:disabled) { background: var(--c-accent); border-color: var(--c-accent); }
.req-actions .btn-primary:disabled { opacity: 0.6; cursor: not-allowed; }

.req-modal__success { padding: 36px 28px; text-align: center; display: flex; flex-direction: column; align-items: center; gap: 12px; color: var(--c-success); }
.req-modal__success h3 { font-size: 28px; margin: 4px 0 8px; color: var(--c-ink); font-weight: 500; line-height: 1.2; }
.req-modal__success p { color: var(--c-text-muted); font-size: 14px; line-height: 1.55; max-width: 380px; margin: 0 0 16px; }
.req-modal__success .eyebrow { color: var(--c-success); }

.req-fade-enter-active, .req-fade-leave-active { transition: opacity 0.25s ease; }
.req-fade-enter-from, .req-fade-leave-to { opacity: 0; }
.req-fade-enter-from .req-modal, .req-fade-leave-to .req-modal { transform: translateY(8px) scale(0.98); }
.req-modal { transition: transform 0.3s var(--ease-spring); }

@keyframes fadeUp { from { opacity: 0; transform: translateY(16px); } to { opacity: 1; transform: translateY(0); } }
.fade-up { animation: fadeUp 0.5s var(--ease-soft) both; }

@media (max-width: 1100px) { .services__grid { grid-template-columns: repeat(2, 1fr); } }
@media (max-width: 700px) {
  .services__grid { grid-template-columns: 1fr; }
  .services__hero h1 { font-size: 32px; }
  .req-modal__head { padding: 24px 20px 20px; }
  .req-modal__head h2 { font-size: 26px; }
  .req-modal__body { padding: 20px; }
}
</style>
