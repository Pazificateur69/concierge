<script setup lang="ts">
import { IonApp } from '@ionic/vue';
import { onMounted, ref, computed, nextTick } from 'vue';
import axios from 'axios';
import type { Survey, Question, SurveyAnswer } from '@concierge/types';

const params = new URLSearchParams(window.location.search);
const queryApi = params.get('api');
if (queryApi) sessionStorage.setItem('concierge_api', queryApi);
const API_URL = queryApi || sessionStorage.getItem('concierge_api') || import.meta.env.VITE_API_URL || 'http://localhost:4000';
const tenantSlug = params.get('tenant') || 'royal-lyon';
const surveySlug = params.get('survey') || 'satisfaction-checkout';
const room = params.get('room') || '';

const survey = ref<Survey | null>(null);
const tenantId = ref('');
const tenantName = ref('');

type Step = 'loading' | 'question' | 'thanks' | 'error';
const step = ref<Step>('loading');
const currentQuestion = ref(0);
const answers = ref<SurveyAnswer[]>([]);
const lang = ref<string>('fr');
const voiceEnabled = ref(false);
const slideDirection = ref<'forward' | 'backward'>('forward');

const offlineQueue: any[] = JSON.parse(localStorage.getItem('smiley_queue') || '[]');

onMounted(async () => {
  try {
    const tenantResp = await axios.get(`${API_URL}/tenants/${tenantSlug}`);
    tenantId.value = tenantResp.data.id;
    tenantName.value = tenantResp.data.name;
    if (tenantResp.data.theme) {
      const t = tenantResp.data.theme;
      const root = document.documentElement;
      root.style.setProperty('--c-primary', t.primaryColor);
      root.style.setProperty('--c-accent', t.accentColor);
    }

    const surveyResp = await axios.get(`${API_URL}/surveys/${surveySlug}?tenantId=${tenantId.value}`);
    survey.value = surveyResp.data;
    step.value = 'question';
    flushQueue();
  } catch (e) {
    console.error(e);
    step.value = 'error';
  }
});

const visibleQuestions = computed<Question[]>(() => {
  if (!survey.value) return [];
  return survey.value.questions.filter((q) => {
    if (!q.showIf) return true;
    const dep = answers.value.find((a) => a.questionId === q.showIf!.questionId);
    if (!dep) return false;
    const v = Number(dep.value);
    const target = Number(q.showIf.value);
    switch (q.showIf.operator) {
      case 'eq': return v === target;
      case 'lte': return v <= target;
      case 'gte': return v >= target;
      case 'lt': return v < target;
      case 'gt': return v > target;
      case 'ne': return v !== target;
    }
    return true;
  });
});

const current = computed<Question | undefined>(() => visibleQuestions.value[currentQuestion.value]);
const progress = computed(() => Math.round(((currentQuestion.value + 1) / Math.max(visibleQuestions.value.length, 1)) * 100));

const surveyTitle = computed(() => {
  if (!survey.value) return '';
  return (survey.value.title as any)[lang.value] || (survey.value.title as any).fr || '';
});

function speak(text: string) {
  if (!voiceEnabled.value || typeof speechSynthesis === 'undefined') return;
  speechSynthesis.cancel();
  const u = new SpeechSynthesisUtterance(text);
  u.lang = lang.value === 'fr' ? 'fr-FR' : 'en-US';
  u.rate = 0.95;
  speechSynthesis.speak(u);
}

function answer(value: string | number) {
  if (!current.value) return;
  answers.value = answers.value.filter((a) => a.questionId !== current.value!.id);
  answers.value.push({ questionId: current.value.id, value });
  setTimeout(() => next(), 400);
}

function back() {
  if (currentQuestion.value > 0) {
    slideDirection.value = 'backward';
    currentQuestion.value--;
  }
}

function skip() {
  slideDirection.value = 'forward';
  next();
}

async function next() {
  slideDirection.value = 'forward';
  if (currentQuestion.value < visibleQuestions.value.length - 1) {
    currentQuestion.value++;
    nextTick(() => {
      if (current.value) {
        const lbl = (current.value.label as any)[lang.value] || (current.value.label as any).fr;
        speak(lbl);
      }
    });
  } else {
    await submit();
  }
}

async function submit() {
  if (!survey.value) return;
  const payload = {
    answers: answers.value,
    locale: lang.value,
    metadata: { device: 'kiosk-checkout', room },
  };
  try {
    await axios.post(`${API_URL}/surveys/${surveySlug}/responses?tenantId=${tenantId.value}`, payload);
    step.value = 'thanks';
  } catch (e) {
    console.warn('Submit failed, queuing offline', e);
    offlineQueue.push({ tenantId: tenantId.value, surveySlug, payload });
    localStorage.setItem('smiley_queue', JSON.stringify(offlineQueue));
    step.value = 'thanks';
  }
}

async function flushQueue() {
  while (offlineQueue.length) {
    const next = offlineQueue.shift()!;
    try {
      await axios.post(`${API_URL}/surveys/${next.surveySlug}/responses?tenantId=${next.tenantId}`, next.payload);
    } catch {
      offlineQueue.unshift(next);
      break;
    }
  }
  localStorage.setItem('smiley_queue', JSON.stringify(offlineQueue));
}

function reset() {
  currentQuestion.value = 0;
  answers.value = [];
  step.value = 'question';
}

function reload() { window.location.reload(); }
</script>

<template>
  <ion-app>
    <div class="smiley">
      <!-- Header -->
      <header class="hdr">
        <div class="hdr__brand font-display">{{ tenantName }}</div>
        <div class="hdr__controls">
          <button
            class="hdr__btn"
            :class="{ on: voiceEnabled }"
            @click="voiceEnabled = !voiceEnabled"
            aria-label="Voix"
          >
            <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor">
              <path d="M3 10v4a1 1 0 0 0 1 1h3l4 4V5L7 9H4a1 1 0 0 0-1 1zm13.5 2a4.5 4.5 0 0 0-2.5-4v8a4.5 4.5 0 0 0 2.5-4z"/>
            </svg>
          </button>
          <select v-model="lang" class="hdr__lang">
            <option value="fr">🇫🇷 Français</option>
            <option value="en">🇬🇧 English</option>
            <option value="de">🇩🇪 Deutsch</option>
          </select>
        </div>
      </header>

      <!-- Progress -->
      <div class="progress" v-if="step === 'question'">
        <div class="progress__bar" :style="{ width: progress + '%' }"></div>
        <div class="progress__label">
          {{ currentQuestion + 1 }} / {{ visibleQuestions.length }}
        </div>
      </div>

      <main class="main">
        <!-- Loading -->
        <div v-if="step === 'loading'" class="loading">
          <div class="loading__spinner"></div>
          <p>Chargement…</p>
        </div>

        <!-- Question -->
        <transition :name="slideDirection === 'forward' ? 'slide-fwd' : 'slide-bwd'" mode="out-in">
          <div
            v-if="step === 'question' && current"
            :key="current.id"
            class="question"
          >
            <div v-if="surveyTitle" class="question__category">{{ surveyTitle }}</div>
            <h1 class="question__label font-display">
              {{ (current.label as any)[lang] || (current.label as any).fr }}
            </h1>

            <!-- Smiley type -->
            <div v-if="current.type === 'smiley'" class="smileys">
              <button
                v-for="(opt, idx) in current.options"
                :key="String(opt.value)"
                class="smiley-btn"
                :style="{ animationDelay: `${idx * 80}ms` }"
                @click="answer(opt.value)"
              >
                <span class="smiley-btn__icon">{{ opt.icon }}</span>
                <span class="smiley-btn__label">
                  {{ (opt.label as any)[lang] || (opt.label as any).fr }}
                </span>
              </button>
            </div>

            <!-- NPS type -->
            <div v-else-if="current.type === 'nps'" class="nps">
              <div class="nps__hint">
                <span>Pas du tout</span>
                <span>Tout à fait</span>
              </div>
              <div class="nps__row">
                <button v-for="n in 11" :key="n - 1" class="nps-btn" :data-score="n - 1" @click="answer(n - 1)">
                  {{ n - 1 }}
                </button>
              </div>
            </div>

            <!-- Text type -->
            <div v-else-if="current.type === 'text'" class="text-q">
              <textarea
                ref="textRef"
                placeholder="Partagez vos commentaires (optionnel)…"
                class="text-q__input"
                rows="4"
              ></textarea>
              <button class="text-q__send" @click="answer(($refs.textRef as HTMLTextAreaElement)?.value || '')">
                Envoyer →
              </button>
            </div>

            <!-- Footer actions -->
            <div class="question__actions">
              <button v-if="currentQuestion > 0" class="btn-ghost" @click="back">← Retour</button>
              <span v-else></span>
              <button v-if="!current.required" class="btn-ghost" @click="skip">Passer →</button>
            </div>
          </div>
        </transition>

        <!-- Thanks -->
        <div v-if="step === 'thanks'" class="thanks scale-in">
          <div class="thanks__check">
            <svg viewBox="0 0 60 60" width="80" height="80">
              <circle cx="30" cy="30" r="28" fill="none" stroke="currentColor" stroke-width="2" opacity="0.3"/>
              <path d="M18 31 L26 39 L43 21" fill="none" stroke="currentColor" stroke-width="3.5" stroke-linecap="round" stroke-linejoin="round" />
            </svg>
          </div>
          <h2 class="thanks__title font-display">Merci !</h2>
          <p class="thanks__desc">Votre avis nous est précieux.<br />Bon voyage et à bientôt 👋</p>
          <button class="thanks__cta" @click="reset">Nouvelle évaluation</button>
        </div>

        <!-- Error -->
        <div v-if="step === 'error'" class="error">
          <span>⚠️</span>
          <p>Erreur de chargement.</p>
          <button @click="reload">Réessayer</button>
        </div>
      </main>
    </div>
  </ion-app>
</template>

<style scoped>
.smiley {
  min-height: 100vh;
  display: flex; flex-direction: column;
  background: linear-gradient(135deg, #f8f7f1 0%, #ffffff 50%, #faf6ee 100%);
  position: relative;
  overflow: hidden;
}
.smiley::before {
  content: ''; position: absolute; inset: 0;
  background-image:
    radial-gradient(circle at 10% 0%, rgba(212, 168, 90, 0.15) 0%, transparent 40%),
    radial-gradient(circle at 90% 100%, rgba(26, 77, 140, 0.08) 0%, transparent 50%);
  pointer-events: none;
}

.hdr {
  position: relative; z-index: 1;
  display: flex; justify-content: space-between; align-items: center;
  padding: var(--s-5) var(--s-8);
}
.hdr__brand { font-size: 24px; color: var(--c-primary, #1a4d8c); }
.hdr__controls { display: flex; gap: var(--s-3); }
.hdr__btn {
  width: 52px; height: 52px;
  background: rgba(255,255,255,0.8); backdrop-filter: blur(8px);
  border: 1px solid rgba(0,0,0,0.08); border-radius: var(--r-md);
  display: grid; place-items: center;
  color: var(--c-text-muted, #5e6470);
}
.hdr__btn.on {
  background: var(--c-accent, #d4a85a); color: white;
  border-color: var(--c-accent, #d4a85a);
}
.hdr__lang {
  padding: var(--s-3) var(--s-4);
  background: rgba(255,255,255,0.8);
  border: 1px solid rgba(0,0,0,0.08); border-radius: var(--r-md);
  font-size: 16px; font-weight: 600; color: var(--c-text, #1a1d24);
  min-height: 52px;
}

.progress {
  position: relative; z-index: 1;
  padding: 0 var(--s-8);
  display: flex; align-items: center; gap: var(--s-4);
}
.progress__bar {
  position: relative; flex: 1; height: 6px;
  background: rgba(26,77,140,0.1);
  border-radius: var(--r-full);
  overflow: hidden;
  transition: none;
}
.progress__bar::before {
  content: ''; position: absolute; inset: 0; right: auto;
  width: 100%; background: linear-gradient(90deg, var(--c-primary, #1a4d8c), var(--c-accent, #d4a85a));
  border-radius: inherit;
  transition: width 0.5s var(--ease-smooth);
}
.progress { gap: var(--s-4); }
.progress__bar { height: 6px; background: rgba(26,77,140,0.12); border-radius: 999px; }
.progress__bar { background: var(--c-bg-soft); }
.progress__bar { transition: width 0.5s ease; }
.progress__bar { width: var(--w, 0%); }
.progress__bar { background: linear-gradient(90deg, var(--c-primary, #1a4d8c), var(--c-accent, #d4a85a)); }
.progress__label { font-size: 14px; font-weight: 600; color: var(--c-text-muted, #5e6470); font-feature-settings: 'tnum'; min-width: 60px; }

.main {
  position: relative; z-index: 1;
  flex: 1;
  display: flex; align-items: center; justify-content: center;
  padding: var(--s-12) var(--s-8);
}

.loading { display: flex; flex-direction: column; align-items: center; gap: var(--s-4); color: var(--c-text-muted, #5e6470); }
.loading__spinner {
  width: 56px; height: 56px;
  border: 4px solid rgba(26,77,140,0.15);
  border-top-color: var(--c-primary, #1a4d8c);
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}
@keyframes spin { to { transform: rotate(360deg); } }

.question {
  text-align: center; max-width: 1100px; width: 100%;
  display: flex; flex-direction: column; align-items: center; gap: var(--s-6);
}
.question__category {
  display: inline-block; padding: var(--s-2) var(--s-4);
  background: rgba(212,168,90,0.15); color: var(--c-accent-dark, #a8843f);
  border-radius: var(--r-full);
  font-size: 13px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.06em;
}
.question__label {
  font-size: clamp(28px, 4.5vw, 56px);
  line-height: 1.15; margin: 0;
  color: var(--c-text, #1a1d24);
  max-width: 900px;
}
.question__actions {
  display: flex; justify-content: space-between; width: 100%; max-width: 900px;
  margin-top: var(--s-8);
}
.btn-ghost {
  padding: var(--s-3) var(--s-5);
  background: transparent; border: none; color: var(--c-text-muted, #5e6470);
  font-size: 16px; font-weight: 600;
  border-radius: var(--r-md);
  transition: all var(--dur-fast);
}
.btn-ghost:hover { background: rgba(0,0,0,0.04); color: var(--c-text, #1a1d24); }

/* Smileys */
.smileys {
  display: grid; grid-template-columns: repeat(4, 1fr);
  gap: var(--s-5); width: 100%; max-width: 1000px;
  margin-top: var(--s-6);
}
.smiley-btn {
  background: white; border: 2px solid transparent;
  border-radius: var(--r-xl); padding: var(--s-8) var(--s-4);
  display: flex; flex-direction: column; align-items: center; gap: var(--s-3);
  box-shadow: 0 4px 16px rgba(20,30,50,0.06);
  transition: all 0.25s var(--ease-smooth);
  animation: fadeInUp 0.5s var(--ease-smooth) both;
  cursor: pointer;
}
.smiley-btn:hover { transform: translateY(-6px); box-shadow: 0 14px 32px rgba(20,30,50,0.12); border-color: var(--c-accent, #d4a85a); }
.smiley-btn:active { transform: translateY(-2px) scale(0.98); }
.smiley-btn__icon { font-size: 96px; line-height: 1; transition: transform 0.3s ease; }
.smiley-btn:hover .smiley-btn__icon { transform: scale(1.1); }
.smiley-btn__label { font-size: 17px; font-weight: 600; color: var(--c-text, #1a1d24); }

/* NPS */
.nps { display: flex; flex-direction: column; gap: var(--s-4); width: 100%; max-width: 900px; margin-top: var(--s-6); }
.nps__hint { display: flex; justify-content: space-between; color: var(--c-text-muted, #5e6470); font-size: 14px; padding: 0 var(--s-3); }
.nps__row { display: grid; grid-template-columns: repeat(11, 1fr); gap: var(--s-2); }
.nps-btn {
  aspect-ratio: 1; min-height: 64px;
  background: white; border: 2px solid var(--c-border-strong, rgba(0,0,0,0.15));
  border-radius: var(--r-md);
  font-size: 22px; font-weight: 700; color: var(--c-text, #1a1d24);
  transition: all var(--dur-fast);
  cursor: pointer;
}
.nps-btn[data-score="0"], .nps-btn[data-score="1"], .nps-btn[data-score="2"], .nps-btn[data-score="3"], .nps-btn[data-score="4"], .nps-btn[data-score="5"], .nps-btn[data-score="6"] { color: #c44b3f; border-color: rgba(196,75,63,0.3); }
.nps-btn[data-score="7"], .nps-btn[data-score="8"] { color: #c4861d; border-color: rgba(196,134,29,0.3); }
.nps-btn[data-score="9"], .nps-btn[data-score="10"] { color: #2d7a4b; border-color: rgba(45,122,75,0.3); }
.nps-btn:hover { background: var(--c-primary, #1a4d8c); color: white !important; border-color: var(--c-primary, #1a4d8c); transform: scale(1.06); }

/* Text */
.text-q { display: flex; flex-direction: column; gap: var(--s-4); max-width: 720px; width: 100%; margin: 0 auto; margin-top: var(--s-6); }
.text-q__input {
  padding: var(--s-5); font-size: 18px;
  background: white; border: 2px solid var(--c-border-strong, rgba(0,0,0,0.15));
  border-radius: var(--r-md);
  resize: none; min-height: 140px;
  font-family: inherit;
  transition: border-color var(--dur-fast);
}
.text-q__input:focus { outline: none; border-color: var(--c-primary, #1a4d8c); }
.text-q__send {
  align-self: flex-end;
  padding: var(--s-4) var(--s-8); font-size: 17px; font-weight: 700;
  background: var(--c-primary, #1a4d8c); color: white;
  border: none; border-radius: var(--r-md);
  min-height: 56px;
  cursor: pointer;
}

/* Thanks */
.thanks {
  text-align: center; max-width: 700px;
  display: flex; flex-direction: column; align-items: center; gap: var(--s-5);
  color: var(--c-text, #1a1d24);
}
.thanks__check {
  width: 160px; height: 160px;
  background: linear-gradient(135deg, var(--c-primary, #1a4d8c), var(--c-accent, #d4a85a));
  color: white;
  border-radius: 50%;
  display: grid; place-items: center;
  margin-bottom: var(--s-3);
  box-shadow: 0 16px 40px rgba(26,77,140,0.3);
  animation: pulse 2s ease-in-out infinite;
}
.thanks__title { font-size: clamp(48px, 7vw, 80px); margin: 0; line-height: 1; }
.thanks__desc { font-size: 22px; line-height: 1.5; color: var(--c-text-muted, #5e6470); margin: 0; }
.thanks__cta {
  margin-top: var(--s-6);
  padding: var(--s-4) var(--s-12); font-size: 17px; font-weight: 700;
  background: var(--c-primary, #1a4d8c); color: white;
  border: none; border-radius: var(--r-md);
  cursor: pointer;
  transition: all var(--dur-fast);
}
.thanks__cta:hover { transform: translateY(-2px); box-shadow: 0 8px 24px rgba(26,77,140,0.3); }

/* Error */
.error { display: flex; flex-direction: column; align-items: center; gap: var(--s-4); }
.error span { font-size: 64px; }
.error button {
  padding: var(--s-3) var(--s-6);
  background: var(--c-primary, #1a4d8c); color: white;
  border: none; border-radius: var(--r-md);
  font-weight: 700; cursor: pointer;
}

/* Slide animations */
.slide-fwd-enter-active, .slide-fwd-leave-active,
.slide-bwd-enter-active, .slide-bwd-leave-active {
  transition: all 0.4s var(--ease-smooth);
}
.slide-fwd-enter-from { opacity: 0; transform: translateX(40px); }
.slide-fwd-leave-to { opacity: 0; transform: translateX(-40px); }
.slide-bwd-enter-from { opacity: 0; transform: translateX(-40px); }
.slide-bwd-leave-to { opacity: 0; transform: translateX(40px); }

@media (max-width: 800px) {
  .smileys { grid-template-columns: repeat(2, 1fr); }
  .smiley-btn__icon { font-size: 64px; }
  .nps__row { grid-template-columns: repeat(6, 1fr); }
}

/* Set CSS var for progress bar width via inline style */
.progress__bar { width: 100%; }
</style>
