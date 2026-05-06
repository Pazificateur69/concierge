<script setup lang="ts">
import { ref, nextTick, computed } from 'vue';
import { useRouter } from 'vue-router';
import { useTenantStore } from '../stores/tenant';

type QuickAction = { label: string; route?: string; query?: string };
type Msg = { from: 'bot' | 'user'; text: string; time: string; actions?: QuickAction[] };

const router = useRouter();
const tenantStore = useTenantStore();

const open = ref(false);
const unread = ref(1);
const input = ref('');
const typing = ref(false);

const greeting = computed(() => {
  const h = new Date().getHours();
  if (h < 11) return 'Bonjour';
  if (h < 18) return 'Bon après-midi';
  return 'Bonsoir';
});

const messages = ref<Msg[]>([
  {
    from: 'bot',
    text: `${greeting.value}. Je suis Sophie, votre concierge virtuel. En quoi puis-je vous être utile ?`,
    time: '',
    actions: [
      { label: 'Voir la carte', route: '/menu' },
      { label: 'Réserver un soin spa', route: '/spa' },
      { label: 'Activités à Lyon', route: '/activities' },
      { label: 'Découvrir les environs', route: '/map' },
    ],
  },
]);

const suggestions = [
  'Je voudrais réserver une table',
  'Un taxi pour la gare',
  'Que faire ce soir à Lyon ?',
  'Service en chambre',
];

function now() {
  return new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
}

function send(text?: string) {
  const t = (text ?? input.value).trim();
  if (!t) return;
  messages.value.push({ from: 'user', text: t, time: now() });
  input.value = '';
  scrollToBottom();
  typing.value = true;
  const replyMs = 700 + Math.min(t.length * 20, 1400);
  setTimeout(() => {
    typing.value = false;
    const reply = pickReply(t);
    messages.value.push({ from: 'bot', ...reply, time: now() });
    scrollToBottom();
  }, replyMs);
}

function pickReply(t: string): { text: string; actions?: QuickAction[] } {
  const lc = t.toLowerCase();
  const tenantName = tenantStore.tenant?.name ?? 'notre maison';

  if (lc.match(/(bonjour|salut|hello|bonsoir|coucou)/)) {
    return { text: `${greeting.value} et bienvenue ${tenantName ? 'à ' + tenantName : ''}. Souhaitez-vous des suggestions pour votre séjour ?` };
  }
  if (lc.match(/(merci|thanks|super|parfait|génial)/)) {
    return { text: 'Avec plaisir. N\'hésitez pas si vous avez d\'autres questions — je reste à votre disposition.' };
  }
  if (lc.match(/(table|réserver|restaurant|dîner|déjeuner|menu|carte)/)) {
    return {
      text: 'Notre restaurant gastronomique est ouvert de 12h à 14h30 et de 19h à 22h30, chef étoilé en cuisine. Vous pouvez consulter la carte directement depuis la borne. Pour réserver, indiquez-moi simplement la date, l\'heure et le nombre de couverts.',
      actions: [{ label: 'Voir la carte', route: '/menu' }, { label: 'Réservation', route: '/menu' }],
    };
  }
  if (lc.match(/(taxi|aéroport|gare|transport|navette|chauffeur)/)) {
    return {
      text: 'Notre voiturier peut commander un taxi ou une berline avec chauffeur. Comptez environ 30 minutes pour l\'aéroport Saint-Exupéry, 10 minutes pour la gare Part-Dieu. Souhaitez-vous une commande immédiate ou une réservation ?',
      actions: [{ label: 'Demander à la réception', route: '/help' }],
    };
  }
  if (lc.match(/(spa|massage|hammam|soin|détente|relax|piscine)/)) {
    return {
      text: 'Notre spa Sothys est ouvert de 9h à 21h. Massage signature 60 min · 110€, rituel visage Lift Express · 85€, accès hammam et sauna inclus pour les résidents. Disponibilités sur la borne.',
      actions: [{ label: 'Réserver un soin', route: '/spa' }],
    };
  }
  if (lc.match(/(visiter|voir|musée|monument|que faire|sortir|excursion|culture|tourisme|activité|activités)/)) {
    return {
      text: 'Quelques incontournables : le Vieux Lyon (UNESCO) à 5 minutes à pied, le Musée des Confluences à 10 minutes, la basilique de Fourvière en funiculaire. Le soir, dîner aux Halles Bocuse ou flânerie sur les quais de Saône.',
      actions: [
        { label: 'Carte des environs', route: '/map' },
        { label: 'Activités proposées', route: '/activities' },
      ],
    };
  }
  if (lc.match(/(wifi|internet|connexion|réseau)/)) {
    return { text: 'Le Wi-Fi haut débit est gratuit et illimité. Réseau « HOTEL-GUEST », identifiants au dos de votre carte de chambre.' };
  }
  if (lc.match(/(check.?out|départ|partir|note|facture|caisse)/)) {
    return { text: 'Le check-out s\'effectue jusqu\'à 12h. Late check-out possible jusqu\'à 16h sur demande, et express check-out depuis votre chambre par la TV.' };
  }
  if (lc.match(/(check.?in|arrivée|chambre|clé)/)) {
    return { text: 'Le check-in débute à 15h. Si vous arrivez plus tôt, nous pouvons garder vos bagages en consigne — un agent de la réception viendra vous chercher dès que votre chambre sera prête.' };
  }
  if (lc.match(/(petit.?déj|breakfast|brunch)/)) {
    return {
      text: 'Le petit-déjeuner buffet est servi de 6h30 à 10h30 dans la salle Voltaire. Service en chambre à partir de 6h sur la carte room service.',
      actions: [{ label: 'Commander en chambre', route: '/menu' }],
    };
  }
  if (lc.match(/(parking|voiture|garer|stationnement|valet)/)) {
    return { text: 'Notre voiturier prend en charge votre véhicule — service inclus pour les résidents. Parking sécurisé sur place, accès direct à l\'hôtel.' };
  }
  if (lc.match(/(piscine|sport|fitness|gym|salle)/)) {
    return { text: 'Salle de fitness ouverte 24h/24 (carte de chambre) au 4ème étage. Piscine intérieure de 18m, 7h-22h, avec service serviette.' };
  }
  if (lc.match(/(enfant|bébé|baby|famille|kids)/)) {
    return { text: 'Nous accueillons les familles avec lit bébé, chaise haute et menu enfant offerts. Service de baby-sitting sur réservation 24h à l\'avance.' };
  }
  if (lc.match(/(animal|chien|chat|pet)/)) {
    return { text: 'Nos amis à quatre pattes sont les bienvenus (jusqu\'à 10kg). Panier, gamelles et friandises maison fournis sur demande.' };
  }
  if (lc.match(/(météo|temps|pluie|soleil|froid|chaud)/)) {
    return { text: 'Vous trouverez la météo en direct sur la page Activités. Lyon profite généralement d\'un printemps doux et d\'étés ensoleillés.', actions: [{ label: 'Météo & activités', route: '/activities' }] };
  }
  if (lc.match(/(urgence|médecin|docteur|malade|hôpital|pharmacie)/)) {
    return { text: 'Pour toute urgence médicale, composez le 15 ou demandez-nous : nous avons un médecin partenaire disponible 24h/24, et la pharmacie de garde est à 200m.' };
  }
  if (lc.match(/(merci|c'est tout|au revoir|bye|à plus)/)) {
    return { text: 'À très vite, et excellente journée à vous.' };
  }

  return {
    text: 'Je transmets votre demande à un membre de notre équipe — ils vous répondront sous quelques instants. En attendant, puis-je vous proposer autre chose ?',
    actions: [
      { label: 'Voir la carte', route: '/menu' },
      { label: 'Que visiter', route: '/map' },
      { label: 'Joindre la réception', route: '/help' },
    ],
  };
}

function navigate(action: QuickAction) {
  if (action.route) {
    open.value = false;
    router.push(action.route);
  }
}

function scrollToBottom() {
  nextTick(() => {
    const el = document.querySelector('.chat__body');
    if (el) el.scrollTop = el.scrollHeight;
  });
}

function toggleChat() {
  open.value = !open.value;
  if (open.value) unread.value = 0;
}
</script>

<template>
  <!-- Floating button -->
  <button class="chat-fab" :class="{ open }" @click="toggleChat" :aria-label="open ? 'Fermer la conversation' : 'Parler au concierge'">
    <svg v-if="!open" viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
      <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"/>
    </svg>
    <span v-else class="chat-fab__close">×</span>
    <span class="chat-fab__badge" v-if="!open && unread > 0">{{ unread }}</span>
  </button>

  <!-- Chat panel -->
  <transition name="chat-slide">
    <aside v-if="open" class="chat" role="dialog" aria-label="Concierge virtuel">
      <header class="chat__head">
        <div class="chat__avatar">S</div>
        <div class="chat__title">
          <span class="eyebrow">Concierge virtuel</span>
          <h4 class="serif">Sophie</h4>
          <p><span class="dot"></span> En ligne · réponse immédiate</p>
        </div>
        <button class="chat__close" @click="open = false" aria-label="Fermer">×</button>
      </header>

      <div class="chat__body">
        <div v-for="(m, idx) in messages" :key="idx" class="msg" :class="`msg--${m.from}`">
          <p>{{ m.text }}</p>
          <div v-if="m.actions?.length" class="msg__actions">
            <button v-for="a in m.actions" :key="a.label" class="msg__chip" @click="navigate(a)">{{ a.label }} →</button>
          </div>
          <span class="msg__time" v-if="m.time">{{ m.time }}</span>
        </div>
        <div v-if="typing" class="msg msg--bot">
          <div class="typing"><span></span><span></span><span></span></div>
        </div>
      </div>

      <div class="chat__suggest" v-if="messages.length === 1">
        <button v-for="s in suggestions" :key="s" class="chip" @click="send(s)">{{ s }}</button>
      </div>

      <form class="chat__form" @submit.prevent="send()">
        <input v-model="input" type="text" placeholder="Écrivez votre message…" class="chat__input" autocomplete="off" />
        <button type="submit" class="chat__send" :disabled="!input.trim()" aria-label="Envoyer">
          <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
            <path d="M22 2L11 13"/><path d="M22 2L15 22 11 13 2 9 22 2z"/>
          </svg>
        </button>
      </form>
    </aside>
  </transition>
</template>

<style scoped>
.eyebrow { font-size: 9px; font-weight: 600; letter-spacing: 0.18em; text-transform: uppercase; color: rgba(255,255,255,0.7); }
.serif { font-family: 'Cormorant Garamond', serif; font-weight: 500; }

.chat-fab {
  position: fixed; bottom: 28px; right: 28px;
  width: 56px; height: 56px;
  background: var(--c-ink, #14202e); color: var(--c-paper, #f5f0e8);
  border: 1px solid var(--c-ink, #14202e);
  display: grid; place-items: center;
  box-shadow: 0 12px 32px rgba(20,32,46,0.28);
  cursor: pointer; z-index: 1000;
  transition: all 0.25s ease;
}
.chat-fab:hover { background: var(--c-accent, #b8985a); border-color: var(--c-accent, #b8985a); transform: translateY(-2px); }
.chat-fab.open { background: var(--c-bg-card, #fff); color: var(--c-ink, #14202e); border-color: var(--c-border-strong, rgba(20,32,46,0.18)); }
.chat-fab__close { font-size: 28px; line-height: 1; font-weight: 300; }
.chat-fab__badge {
  position: absolute; top: -4px; right: -4px;
  min-width: 20px; height: 20px; padding: 0 6px;
  background: var(--c-accent, #b8985a); color: white;
  font-family: 'Cormorant Garamond', serif; font-size: 13px; font-weight: 600;
  display: grid; place-items: center;
  border: 2px solid white;
}

.chat {
  position: fixed; bottom: 100px; right: 28px;
  width: 380px; max-width: calc(100vw - 56px);
  max-height: 70vh; height: 600px;
  background: var(--c-bg-card, #fff);
  display: flex; flex-direction: column;
  overflow: hidden; z-index: 999;
  border: 1px solid var(--c-border, rgba(20,32,46,0.08));
  box-shadow: 0 24px 64px rgba(20,32,46,0.18);
  font-family: 'Inter', sans-serif;
}

.chat__head {
  display: flex; align-items: center; gap: 12px;
  padding: 18px 20px;
  background: var(--c-ink, #14202e); color: white;
  border-bottom: 1px solid var(--c-ink, #14202e);
}
.chat__avatar {
  width: 44px; height: 44px;
  background: var(--c-paper, #f5f0e8); color: var(--c-ink, #14202e);
  display: grid; place-items: center;
  font-family: 'Cormorant Garamond', serif; font-size: 22px; font-weight: 600;
}
.chat__title { flex: 1; line-height: 1.2; }
.chat__title h4 { margin: 2px 0; font-size: 18px; font-weight: 500; color: white; letter-spacing: -0.01em; }
.chat__title p { margin: 0; font-size: 11px; color: rgba(255,255,255,0.7); display: flex; align-items: center; gap: 6px; }
.dot { width: 6px; height: 6px; border-radius: 50%; background: #4ade80; box-shadow: 0 0 8px rgba(74,222,128,0.6); }
.chat__close {
  width: 32px; height: 32px;
  background: transparent; color: rgba(255,255,255,0.6);
  border: none; font-size: 22px; line-height: 1; cursor: pointer;
}
.chat__close:hover { color: white; }

.chat__body {
  flex: 1; overflow-y: auto;
  padding: 20px;
  display: flex; flex-direction: column; gap: 14px;
  background: var(--c-bg, #faf7f2);
}

.msg { max-width: 85%; display: flex; flex-direction: column; gap: 6px; }
.msg p {
  padding: 12px 16px;
  margin: 0;
  font-size: 14px; line-height: 1.55;
  white-space: pre-wrap;
}
.msg__time { font-size: 10px; color: var(--c-text-soft, #97a0ad); padding: 0 4px; letter-spacing: 0.04em; font-feature-settings: 'tnum'; }
.msg--bot { align-self: flex-start; }
.msg--bot p { background: var(--c-bg-card, #fff); color: var(--c-ink, #14202e); border: 1px solid var(--c-border, rgba(20,32,46,0.08)); border-bottom-left-radius: 0; }
.msg--user { align-self: flex-end; }
.msg--user p { background: var(--c-ink, #14202e); color: white; border-bottom-right-radius: 0; }
.msg--user .msg__time { text-align: right; }

.msg__actions { display: flex; flex-wrap: wrap; gap: 6px; padding: 0 4px; }
.msg__chip { padding: 6px 12px; background: var(--c-bg-card, #fff); border: 1px solid var(--c-border-strong, rgba(20,32,46,0.18)); font-size: 11px; font-weight: 600; letter-spacing: 0.06em; text-transform: uppercase; color: var(--c-ink, #14202e); cursor: pointer; transition: all 0.2s; font-family: inherit; }
.msg__chip:hover { background: var(--c-ink, #14202e); color: white; border-color: var(--c-ink, #14202e); }

.typing { display: flex; gap: 4px; padding: 12px 16px; background: var(--c-bg-card, #fff); border: 1px solid var(--c-border, rgba(20,32,46,0.08)); border-bottom-left-radius: 0; }
.typing span { width: 6px; height: 6px; background: var(--c-text-soft, #97a0ad); border-radius: 50%; animation: typing-bounce 1.2s ease-in-out infinite; }
.typing span:nth-child(2) { animation-delay: 0.15s; }
.typing span:nth-child(3) { animation-delay: 0.3s; }
@keyframes typing-bounce { 0%, 60%, 100% { transform: translateY(0); opacity: 0.4; } 30% { transform: translateY(-4px); opacity: 1; } }

.chat__suggest {
  padding: 10px 16px 14px;
  display: flex; flex-wrap: wrap; gap: 6px;
  border-top: 1px solid var(--c-border, rgba(20,32,46,0.08));
  background: var(--c-bg-card, #fff);
}
.chip { padding: 7px 12px; background: var(--c-paper, #f5f0e8); border: 1px solid var(--c-border, rgba(20,32,46,0.08)); font-size: 12px; font-weight: 500; color: var(--c-ink, #14202e); cursor: pointer; font-family: inherit; transition: all 0.15s; }
.chip:hover { background: var(--c-ink, #14202e); color: white; border-color: var(--c-ink, #14202e); }

.chat__form { display: flex; gap: 8px; padding: 12px 16px; border-top: 1px solid var(--c-border, rgba(20,32,46,0.08)); background: var(--c-bg-card, #fff); }
.chat__input { flex: 1; padding: 11px 14px; background: var(--c-paper, #f5f0e8); border: 1px solid transparent; font-size: 13px; font-family: inherit; color: var(--c-ink, #14202e); transition: all 0.2s; }
.chat__input:focus { outline: none; border-color: var(--c-ink, #14202e); background: white; }
.chat__send { width: 40px; height: 40px; background: var(--c-ink, #14202e); color: white; border: none; display: grid; place-items: center; cursor: pointer; transition: all 0.2s; }
.chat__send:disabled { opacity: 0.3; cursor: not-allowed; }
.chat__send:not(:disabled):hover { background: var(--c-accent, #b8985a); }

.chat-slide-enter-active, .chat-slide-leave-active { transition: all 0.3s cubic-bezier(0.32, 0.72, 0, 1); }
.chat-slide-enter-from { opacity: 0; transform: translateY(20px) scale(0.96); }
.chat-slide-leave-to { opacity: 0; transform: translateY(20px) scale(0.96); }

@media (max-width: 540px) {
  .chat { right: 12px; left: 12px; bottom: 84px; width: auto; max-width: none; height: 70vh; }
  .chat-fab { bottom: 16px; right: 16px; }
}
</style>
