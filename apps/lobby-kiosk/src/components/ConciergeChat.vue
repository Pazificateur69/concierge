<script setup lang="ts">
import { ref, nextTick } from 'vue';

const open = ref(false);
const messages = ref<{ from: 'bot' | 'user'; text: string; time: string }[]>([
  { from: 'bot', text: 'Bonjour ! Je suis Sophie, votre concierge virtuel. Comment puis-je vous aider aujourd\'hui ?', time: '' },
]);
const input = ref('');
const typing = ref(false);

const suggestions = [
  '🍽️ Réserver une table',
  '🚕 Demander un taxi',
  '🧖 Spa disponible ?',
  '🗺️ Que visiter ?',
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
  setTimeout(() => {
    typing.value = false;
    messages.value.push({ from: 'bot', text: pickReply(t), time: now() });
    scrollToBottom();
  }, 1100);
}

function pickReply(t: string): string {
  const lc = t.toLowerCase();
  if (lc.match(/(table|réserver|restaurant|dîner|déjeuner)/)) return 'Avec plaisir ! Notre restaurant est ouvert 12h-14h30 et 19h-22h30. Souhaitez-vous une table pour ce soir ?';
  if (lc.match(/(taxi|aéroport|gare)/)) return 'Je peux vous appeler un taxi immédiatement. Pour quelle destination et à quelle heure ?';
  if (lc.match(/(spa|massage|hammam)/)) return 'Notre spa est ouvert 9h-21h. Massage 60min à 110€, soin du visage à 85€. Souhaitez-vous réserver ?';
  if (lc.match(/(visiter|voir|musée|monument|que faire)/)) return 'Le Vieux Lyon est à 5min à pied, le Musée des Confluences à 10min en métro. Voulez-vous une carte personnalisée ?';
  if (lc.match(/(wifi|internet|connexion)/)) return 'Le Wi-Fi est gratuit ! Réseau "HOTEL-GUEST", code sur votre carte de chambre.';
  if (lc.match(/(check.?out|départ|partir)/)) return 'Check-out à 12h. Late check-out possible jusqu\'à 16h sur demande.';
  if (lc.match(/(petit.?déj|breakfast)/)) return 'Petit-déjeuner buffet 6h30-10h30. En chambre dès 6h sur demande.';
  return 'Je transmets votre demande à la réception. Un agent vous répondra dans quelques instants.';
}

function scrollToBottom() {
  nextTick(() => {
    const el = document.querySelector('.chat__body');
    if (el) el.scrollTop = el.scrollHeight;
  });
}
</script>

<template>
  <!-- Floating button -->
  <button
    class="chat-fab"
    :class="{ open }"
    @click="open = !open"
    :aria-label="open ? 'Fermer le chat' : 'Ouvrir le chat'"
  >
    <span class="chat-fab__icon" v-if="!open">💬</span>
    <span class="chat-fab__icon" v-else>×</span>
    <span class="chat-fab__badge" v-if="!open">1</span>
  </button>

  <!-- Chat panel -->
  <transition name="chat-slide">
    <div v-if="open" class="chat">
      <header class="chat__head">
        <div class="chat__avatar">
          <img src="https://i.pravatar.cc/80?img=44" alt="Concierge" />
          <span class="chat__status"></span>
        </div>
        <div class="chat__title">
          <h4>Sophie · Concierge</h4>
          <p>En ligne · Réponse immédiate</p>
        </div>
        <button class="chat__close" @click="open = false">×</button>
      </header>

      <div class="chat__body">
        <div
          v-for="(m, idx) in messages"
          :key="idx"
          class="msg"
          :class="`msg--${m.from}`"
        >
          <p>{{ m.text }}</p>
          <span class="msg__time" v-if="m.time">{{ m.time }}</span>
        </div>
        <div v-if="typing" class="msg msg--bot">
          <div class="typing">
            <span></span><span></span><span></span>
          </div>
        </div>
      </div>

      <div class="chat__suggest" v-if="messages.length === 1">
        <button v-for="s in suggestions" :key="s" class="chip" @click="send(s.replace(/^[^\s]+\s/, ''))">
          {{ s }}
        </button>
      </div>

      <form class="chat__form" @submit.prevent="send()">
        <input
          v-model="input"
          type="text"
          placeholder="Posez votre question…"
          class="chat__input"
        />
        <button type="submit" class="chat__send" :disabled="!input.trim()">
          <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor">
            <path d="M2 21l21-9L2 3v7l15 2-15 2z"/>
          </svg>
        </button>
      </form>
    </div>
  </transition>
</template>

<style scoped>
.chat-fab {
  position: fixed; bottom: 32px; right: 32px;
  width: 68px; height: 68px;
  background: linear-gradient(135deg, var(--c-primary) 0%, var(--c-accent) 100%);
  color: white;
  border: none; border-radius: 50%;
  font-size: 32px;
  display: grid; place-items: center;
  box-shadow: 0 12px 32px rgba(26,77,140,0.35);
  cursor: pointer; z-index: 1000;
  transition: all var(--dur-base) var(--ease-spring);
}
.chat-fab:hover { transform: scale(1.08); box-shadow: 0 16px 40px rgba(26,77,140,0.45); }
.chat-fab.open { background: var(--c-text); }
.chat-fab__badge {
  position: absolute; top: 6px; right: 6px;
  width: 22px; height: 22px;
  background: var(--c-danger); color: white;
  border: 2px solid white; border-radius: 50%;
  font-size: 12px; font-weight: 700;
  display: grid; place-items: center;
  animation: pulse 2s ease-in-out infinite;
}

.chat {
  position: fixed; bottom: 116px; right: 32px;
  width: 380px; max-width: calc(100vw - 64px);
  max-height: 70vh; height: 600px;
  background: var(--c-bg-card);
  border-radius: var(--r-xl);
  box-shadow: 0 24px 64px rgba(0,0,0,0.2);
  display: flex; flex-direction: column;
  overflow: hidden;
  z-index: 999;
  border: 1px solid var(--c-border);
}

.chat__head {
  display: flex; align-items: center; gap: var(--s-3);
  padding: var(--s-4) var(--s-5);
  background: linear-gradient(135deg, var(--c-primary), var(--c-primary-700, #143a6a));
  color: white;
}
.chat__avatar { position: relative; }
.chat__avatar img { width: 44px; height: 44px; border-radius: 50%; border: 2px solid rgba(255,255,255,0.3); object-fit: cover; }
.chat__status {
  position: absolute; bottom: 2px; right: 2px;
  width: 12px; height: 12px;
  background: #2d7a4b; border: 2px solid var(--c-primary);
  border-radius: 50%;
}
.chat__title { flex: 1; }
.chat__title h4 { margin: 0; font-size: 16px; font-weight: 700; }
.chat__title p { margin: 2px 0 0; font-size: 12px; opacity: 0.85; }
.chat__close {
  width: 32px; height: 32px;
  background: rgba(255,255,255,0.15); color: white;
  border: none; border-radius: 8px;
  font-size: 22px; line-height: 1;
}

.chat__body {
  flex: 1; overflow-y: auto;
  padding: var(--s-4) var(--s-5);
  display: flex; flex-direction: column; gap: var(--s-3);
  background: var(--c-bg-soft);
}

.msg { max-width: 80%; }
.msg p {
  padding: var(--s-3) var(--s-4);
  border-radius: var(--r-lg);
  margin: 0;
  font-size: 14px; line-height: 1.45;
  white-space: pre-wrap;
}
.msg__time { display: block; font-size: 11px; color: var(--c-text-soft); margin-top: 2px; padding: 0 8px; }

.msg--bot { align-self: flex-start; }
.msg--bot p { background: var(--c-bg-card); color: var(--c-text); border-bottom-left-radius: 4px; box-shadow: var(--sh-xs); }

.msg--user { align-self: flex-end; }
.msg--user p { background: var(--c-primary); color: white; border-bottom-right-radius: 4px; }
.msg--user .msg__time { text-align: right; }

.typing { display: flex; gap: 4px; padding: var(--s-3) var(--s-4); background: var(--c-bg-card); border-radius: var(--r-lg); border-bottom-left-radius: 4px; }
.typing span {
  width: 8px; height: 8px;
  background: var(--c-text-soft); border-radius: 50%;
  animation: typing-bounce 1.2s ease-in-out infinite;
}
.typing span:nth-child(2) { animation-delay: 0.15s; }
.typing span:nth-child(3) { animation-delay: 0.3s; }
@keyframes typing-bounce {
  0%, 60%, 100% { transform: translateY(0); opacity: 0.4; }
  30% { transform: translateY(-6px); opacity: 1; }
}

.chat__suggest {
  padding: var(--s-3) var(--s-5);
  display: flex; flex-wrap: wrap; gap: var(--s-2);
  border-top: 1px solid var(--c-border);
  background: var(--c-bg-soft);
}
.chip {
  padding: 6px 12px;
  background: var(--c-bg-card);
  border: 1px solid var(--c-border);
  border-radius: var(--r-full);
  font-size: 12px; font-weight: 600; color: var(--c-text);
  transition: all var(--dur-fast);
}
.chip:hover { background: var(--c-primary); color: white; border-color: var(--c-primary); }

.chat__form { display: flex; gap: var(--s-2); padding: var(--s-3); border-top: 1px solid var(--c-border); background: var(--c-bg-card); }
.chat__input {
  flex: 1; padding: var(--s-3) var(--s-4);
  background: var(--c-bg-soft);
  border: 1px solid transparent; border-radius: var(--r-md);
  font-size: 14px;
  transition: border-color var(--dur-fast);
}
.chat__input:focus { outline: none; border-color: var(--c-primary); background: var(--c-bg-card); }
.chat__send {
  width: 44px; height: 44px;
  background: var(--c-primary); color: white;
  border: none; border-radius: var(--r-md);
  display: grid; place-items: center;
  cursor: pointer;
  transition: all var(--dur-fast);
}
.chat__send:disabled { opacity: 0.4; }
.chat__send:not(:disabled):hover { background: var(--c-primary-700, #143a6a); }

.chat-slide-enter-active, .chat-slide-leave-active { transition: all 0.3s var(--ease-spring); }
.chat-slide-enter-from { opacity: 0; transform: translateY(20px) scale(0.95); }
.chat-slide-leave-to { opacity: 0; transform: translateY(20px) scale(0.95); }
</style>
