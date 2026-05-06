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
const hovering = ref<number | null>(null);

const textValue = ref('');

function submitText() {
  if (!current.value) return;
  const v = textValue.value.trim();
  if (current.value.required && !v) return;
  answer(v);
  textValue.value = '';
}

const offlineQueue: any[] = JSON.parse(localStorage.getItem('smiley_queue') || '[]');

onMounted(async () => {
  try {
    const tenantResp = await axios.get(`${API_URL}/tenants/${tenantSlug}`);
    tenantId.value = tenantResp.data.id;
    tenantName.value = tenantResp.data.name;
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
  setTimeout(() => next(), 380);
}

function back() { if (currentQuestion.value > 0) currentQuestion.value--; }
function skip() { next(); }

async function next() {
  if (currentQuestion.value < visibleQuestions.value.length - 1) {
    currentQuestion.value++;
    nextTick(() => {
      if (current.value) speak((current.value.label as any)[lang.value] || (current.value.label as any).fr);
    });
  } else {
    await submit();
  }
}

async function submit() {
  if (!survey.value) return;
  const payload = { answers: answers.value, locale: lang.value, metadata: { device: 'kiosk-checkout', room } };
  try {
    await axios.post(`${API_URL}/surveys/${surveySlug}/responses?tenantId=${tenantId.value}`, payload);
    step.value = 'thanks';
  } catch (e) {
    offlineQueue.push({ tenantId: tenantId.value, surveySlug, payload });
    localStorage.setItem('smiley_queue', JSON.stringify(offlineQueue));
    step.value = 'thanks';
  }
}

async function flushQueue() {
  while (offlineQueue.length) {
    const next = offlineQueue.shift()!;
    try { await axios.post(`${API_URL}/surveys/${next.surveySlug}/responses?tenantId=${next.tenantId}`, next.payload); }
    catch { offlineQueue.unshift(next); break; }
  }
  localStorage.setItem('smiley_queue', JSON.stringify(offlineQueue));
}

function reset() { currentQuestion.value = 0; answers.value = []; step.value = 'question'; }
function reload() { window.location.reload(); }

// Score config — refined editorial
const SCORES = [
  { value: 1, label: { fr: 'Très décevant', en: 'Very disappointing', de: 'Sehr enttäuschend' }, color: '#913528', tone: -1 },
  { value: 2, label: { fr: 'Décevant', en: 'Disappointing', de: 'Enttäuschend' }, color: '#95701a', tone: 0 },
  { value: 3, label: { fr: 'Bien', en: 'Good', de: 'Gut' }, color: '#5a6675', tone: 1 },
  { value: 4, label: { fr: 'Excellent', en: 'Excellent', de: 'Hervorragend' }, color: '#36644a', tone: 2 },
];

function getOptionLabel(value: number) {
  const s = SCORES.find((s) => s.value === value);
  if (!s) return '';
  return (s.label as any)[lang.value] || s.label.fr;
}
function getOptionColor(value: number) {
  return SCORES.find((s) => s.value === value)?.color ?? '#14202e';
}
</script>

<template>
  <ion-app>
    <div class="smiley">
      <!-- Subtle texture overlay -->
      <div class="smiley__texture"></div>

      <!-- HEADER -->
      <header class="hdr">
        <div class="hdr__brand">
          <span class="hdr__mark">C</span>
          <div class="hdr__brand-text">
            <span class="hdr__eyebrow">Avant de partir</span>
            <span class="hdr__hotel serif italic">{{ tenantName }}</span>
          </div>
        </div>
        <div class="hdr__controls">
          <button class="hdr__btn" :class="{ active: voiceEnabled }" @click="voiceEnabled = !voiceEnabled" aria-label="Voix">
            <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
              <path d="M11 5L6 9H2v6h4l5 4V5z"/>
              <path d="M19.07 4.93a10 10 0 0 1 0 14.14M15.54 8.46a5 5 0 0 1 0 7.07"/>
            </svg>
          </button>
          <select v-model="lang" class="hdr__lang">
            <option value="fr">Français</option>
            <option value="en">English</option>
            <option value="de">Deutsch</option>
          </select>
        </div>
      </header>

      <!-- PROGRESS -->
      <div v-if="step === 'question'" class="progress">
        <div class="progress__steps">
          <span class="progress__num serif">{{ String(currentQuestion + 1).padStart(2, '0') }}</span>
          <span class="progress__sep">／</span>
          <span class="progress__total serif">{{ String(visibleQuestions.length).padStart(2, '0') }}</span>
        </div>
        <div class="progress__bar"><div class="progress__fill" :style="{ width: progress + '%' }"></div></div>
      </div>

      <main class="main">
        <!-- LOADING -->
        <div v-if="step === 'loading'" class="state">
          <div class="state__spinner"></div>
          <span class="eyebrow">Chargement</span>
        </div>

        <!-- QUESTION -->
        <transition name="q" mode="out-in">
          <div v-if="step === 'question' && current" :key="current.id" class="q">
            <span class="eyebrow q__eyebrow">{{ tenantName }} · Évaluation</span>
            <h1 class="q__label serif">
              {{ (current.label as any)[lang] || (current.label as any).fr }}
            </h1>
            <p v-if="(current.description as any)?.[lang] || (current.description as any)?.fr" class="q__desc">
              {{ (current.description as any)[lang] || (current.description as any).fr }}
            </p>

            <!-- SMILEY -->
            <div v-if="current.type === 'smiley'" class="smileys">
              <button
                v-for="(opt, idx) in current.options"
                :key="String(opt.value)"
                class="smiley-card"
                :style="{ animationDelay: `${idx * 100}ms`, '--accent': getOptionColor(Number(opt.value)) }"
                @mouseenter="hovering = Number(opt.value)"
                @mouseleave="hovering = null"
                @click="answer(opt.value)"
              >
                <span class="smiley-card__num eyebrow">{{ String(idx + 1).padStart(2, '0') }}</span>

                <!-- Refined SVG face per score -->
                <svg viewBox="0 0 120 120" class="face" fill="none" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round">
                  <circle cx="60" cy="60" r="54" />
                  <!-- Eyes vary by score -->
                  <template v-if="opt.value === 1">
                    <!-- Sad : closed-ish drooping eyes + downward mouth -->
                    <path d="M40 50 L48 54 M50 54 L42 50" />
                    <path d="M70 54 L78 50 M80 50 L72 54" />
                    <path d="M40 84 Q60 70, 80 84" />
                  </template>
                  <template v-else-if="opt.value === 2">
                    <!-- Disappointed : flat eyes + flat mouth -->
                    <path d="M40 50 L52 50" />
                    <path d="M68 50 L80 50" />
                    <path d="M42 78 L78 78" />
                  </template>
                  <template v-else-if="opt.value === 3">
                    <!-- Good : dot eyes + gentle smile -->
                    <circle cx="46" cy="50" r="2" fill="currentColor" />
                    <circle cx="74" cy="50" r="2" fill="currentColor" />
                    <path d="M40 70 Q60 84, 80 70" />
                  </template>
                  <template v-else-if="opt.value === 4">
                    <!-- Excellent : crescent eyes + big smile + cheeks -->
                    <path d="M40 50 Q46 44, 52 50" />
                    <path d="M68 50 Q74 44, 80 50" />
                    <path d="M36 66 Q60 92, 84 66" />
                    <circle cx="32" cy="72" r="2.5" stroke-width="0" fill="currentColor" opacity="0.25" />
                    <circle cx="88" cy="72" r="2.5" stroke-width="0" fill="currentColor" opacity="0.25" />
                  </template>
                </svg>

                <div class="smiley-card__bottom">
                  <span class="smiley-card__label serif italic">
                    {{ (opt.label as any)[lang] || (opt.label as any).fr || getOptionLabel(Number(opt.value)) }}
                  </span>
                  <span class="smiley-card__rule"></span>
                </div>
              </button>
            </div>

            <!-- NPS -->
            <div v-else-if="current.type === 'nps'" class="nps">
              <div class="nps__legend">
                <span class="serif italic">Pas du tout</span>
                <span class="serif italic">Tout à fait</span>
              </div>
              <div class="nps__row">
                <button v-for="n in 11" :key="n - 1" class="nps-btn" :data-score="n - 1" @click="answer(n - 1)">
                  {{ n - 1 }}
                </button>
              </div>
              <div class="nps__scale">
                <span class="nps__band nps__band--bad">Détracteurs</span>
                <span class="nps__band nps__band--mid">Neutres</span>
                <span class="nps__band nps__band--good">Promoteurs</span>
              </div>
            </div>

            <!-- TEXT -->
            <div v-else-if="current.type === 'text'" class="text-q">
              <textarea
                v-model="textValue"
                :placeholder="current.required ? 'Vos commentaires…' : 'Vos commentaires (optionnel)…'"
                class="text-q__input"
                rows="5"
              ></textarea>
              <div class="text-q__bar">
                <span class="text-q__count" :class="{ ok: textValue.trim().length > 0 }">
                  {{ textValue.length }} caractère{{ textValue.length > 1 ? 's' : '' }}
                </span>
                <button
                  class="text-q__send"
                  :disabled="current.required && !textValue.trim()"
                  @click="submitText"
                >
                  {{ current.required && !textValue.trim() ? 'Saisissez un message' : 'Envoyer' }}
                </button>
              </div>
            </div>

            <div class="q__actions">
              <button v-if="currentQuestion > 0" class="btn-ghost" @click="back">← Retour</button>
              <span v-else></span>
              <button v-if="!current.required" class="btn-ghost" @click="skip">Passer →</button>
            </div>
          </div>
        </transition>

        <!-- THANKS -->
        <div v-if="step === 'thanks'" class="thanks">
          <span class="eyebrow">Merci</span>
          <svg viewBox="0 0 80 80" width="64" height="64" class="thanks__check" fill="none" stroke="currentColor" stroke-width="1.2" stroke-linecap="round" stroke-linejoin="round">
            <circle cx="40" cy="40" r="38" stroke-dasharray="240" stroke-dashoffset="0" />
            <path d="M24 42 L34 52 L56 28" />
          </svg>
          <h2 class="thanks__title serif">
            <em>Vos retours</em><br/>
            façonnent notre maison.
          </h2>
          <hr class="thanks__rule" />
          <p class="thanks__desc">Bon voyage, et au plaisir de vous accueillir à nouveau.</p>
          <button class="thanks__cta" @click="reset">Nouvelle évaluation</button>
        </div>

        <!-- ERROR -->
        <div v-if="step === 'error'" class="state state--error">
          <span class="eyebrow">Service momentanément indisponible</span>
          <h2 class="serif">Veuillez réessayer dans un instant</h2>
          <button @click="reload" class="thanks__cta">Réessayer</button>
        </div>
      </main>

      <footer class="foot">
        <span class="eyebrow">Concierge · Dymension</span>
      </footer>
    </div>
  </ion-app>
</template>

<style scoped>
@import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,400;0,500;0,600;0,700;1,400;1,500&family=Inter:wght@400;500;600;700&display=swap');

.smiley {
  --c-primary: #14202e;
  --c-accent: #b8985a;
  --c-accent-soft: #d6bd87;
  --c-accent-deep: #8e7138;
  --c-paper: #f5f0e8;
  --c-paper-soft: #ede5d6;
  --c-bg-card: #ffffff;
  --c-ink: #14202e;
  --c-text: #14202e;
  --c-text-muted: #5a6675;
  --c-text-soft: #97a0ad;
  --c-text-faint: #b9c0c9;
  --c-border: rgba(20,32,46,0.08);
  --c-border-strong: rgba(20,32,46,0.18);
  --c-rule: #d8cfbe;
  --c-success: #36644a;
  --c-danger: #913528;

  font-family: 'Inter', -apple-system, system-ui, sans-serif;
  font-feature-settings: 'ss01';
  min-height: 100vh; display: flex; flex-direction: column;
  background: var(--c-paper);
  position: relative; overflow: hidden;
  color: var(--c-text);
}

.smiley__texture {
  position: absolute; inset: 0; pointer-events: none;
  background-image:
    radial-gradient(ellipse at top right, rgba(184,152,90,0.10) 0%, transparent 45%),
    radial-gradient(ellipse at bottom left, rgba(20,32,46,0.04) 0%, transparent 50%),
    repeating-linear-gradient(0deg, transparent 0, transparent 39px, rgba(20,32,46,0.015) 39px, rgba(20,32,46,0.015) 40px);
}

.serif { font-family: 'Cormorant Garamond', serif; font-weight: 500; }
.italic { font-style: italic; }
.eyebrow { font-size: 11px; font-weight: 600; letter-spacing: 0.18em; text-transform: uppercase; color: var(--c-accent-deep); }

/* HEADER */
.hdr { position: relative; z-index: 1; display: flex; justify-content: space-between; align-items: center; padding: 24px 48px; }
.hdr__brand { display: flex; align-items: center; gap: 14px; }
.hdr__mark { width: 44px; height: 44px; background: var(--c-ink); color: var(--c-paper); display: grid; place-items: center; font-family: 'Cormorant Garamond', serif; font-size: 24px; font-weight: 600; }
.hdr__brand-text { display: flex; flex-direction: column; line-height: 1.1; }
.hdr__eyebrow { font-size: 9px; font-weight: 600; letter-spacing: 0.22em; text-transform: uppercase; color: var(--c-text-soft); }
.hdr__hotel { font-size: 19px; color: var(--c-ink); margin-top: 3px; }

.hdr__controls { display: flex; gap: 8px; align-items: center; }
.hdr__btn { width: 40px; height: 40px; background: var(--c-bg-card); border: 1px solid var(--c-border-strong); color: var(--c-text-muted); display: grid; place-items: center; cursor: pointer; transition: all 0.2s; }
.hdr__btn:hover { background: var(--c-paper-soft); }
.hdr__btn.active { background: var(--c-accent); border-color: var(--c-accent); color: white; }
.hdr__lang { padding: 8px 12px; background: var(--c-bg-card); border: 1px solid var(--c-border-strong); font-size: 14px; color: var(--c-ink); font-family: inherit; min-height: 40px; }

/* PROGRESS */
.progress { position: relative; z-index: 1; padding: 0 96px; max-width: 1100px; margin: 0 auto; width: 100%; display: flex; flex-direction: column; gap: 12px; }
.progress__steps { display: flex; align-items: baseline; gap: 6px; font-size: 14px; color: var(--c-text-muted); letter-spacing: 0.04em; }
.progress__num { color: var(--c-ink); font-weight: 600; font-feature-settings: 'tnum'; }
.progress__sep { color: var(--c-text-faint); font-size: 18px; }
.progress__total { color: var(--c-text-muted); font-feature-settings: 'tnum'; }
.progress__bar { height: 1px; background: var(--c-border-strong); position: relative; }
.progress__fill { position: absolute; left: 0; top: -1px; height: 3px; background: linear-gradient(90deg, var(--c-ink), var(--c-accent-deep)); transition: width 0.6s cubic-bezier(0.4,0,0.2,1); }

/* MAIN */
.main { position: relative; z-index: 1; flex: 1; display: flex; align-items: center; justify-content: center; padding: 60px 48px; }

.state { display: flex; flex-direction: column; align-items: center; gap: 16px; color: var(--c-text-muted); }
.state__spinner { width: 32px; height: 32px; border: 1.5px solid var(--c-border-strong); border-top-color: var(--c-ink); border-radius: 50%; animation: spin 1s linear infinite; }
.state--error { gap: 24px; text-align: center; }
.state--error h2 { font-size: 28px; margin: 0; color: var(--c-ink); font-weight: 500; }
@keyframes spin { to { transform: rotate(360deg); } }

/* QUESTION */
.q { text-align: center; max-width: 1200px; width: 100%; display: flex; flex-direction: column; align-items: center; gap: 16px; }
.q__eyebrow { color: var(--c-accent-deep); font-size: 10px; }
.q__label { font-size: clamp(32px, 5.5vw, 64px); line-height: 1.1; margin: 8px 0 0; color: var(--c-ink); max-width: 1000px; font-weight: 500; letter-spacing: -0.02em; }
.q__desc { font-size: 17px; color: var(--c-text-muted); margin: 0; max-width: 640px; line-height: 1.55; }

.q__actions { display: flex; justify-content: space-between; width: 100%; max-width: 900px; margin-top: 32px; }
.btn-ghost { padding: 10px 18px; background: transparent; border: 1px solid transparent; color: var(--c-text-muted); font-size: 12px; font-weight: 600; letter-spacing: 0.16em; text-transform: uppercase; transition: all 0.2s; cursor: pointer; }
.btn-ghost:hover { color: var(--c-ink); border-color: var(--c-border-strong); }

/* SMILEYS — Editorial cards */
.smileys {
  display: grid; grid-template-columns: repeat(4, 1fr); gap: 0;
  width: 100%; max-width: 1100px; margin-top: 40px;
  border-top: 1px solid var(--c-border);
  border-left: 1px solid var(--c-border);
}
.smiley-card {
  position: relative;
  background: var(--c-bg-card);
  border: 1px solid var(--c-border);
  border-top: none; border-left: none;
  padding: 32px 20px 28px;
  display: flex; flex-direction: column; align-items: center; gap: 20px;
  transition: all 0.4s cubic-bezier(0.32,0.72,0,1);
  animation: fadeUp 0.6s cubic-bezier(0.32,0.72,0,1) both;
  cursor: pointer;
  color: var(--c-ink);
  overflow: hidden;
}
.smiley-card::after {
  content: '';
  position: absolute; left: 0; right: 0; bottom: 0;
  height: 2px; background: var(--accent);
  transform: scaleX(0); transform-origin: left;
  transition: transform 0.4s cubic-bezier(0.32,0.72,0,1);
}
.smiley-card:hover { background: var(--c-paper-soft); transform: translateY(-4px); }
.smiley-card:hover::after { transform: scaleX(1); }
.smiley-card:hover .face { color: var(--accent); transform: scale(1.05); }
.smiley-card:hover .smiley-card__rule { width: 48px; background: var(--accent); }
.smiley-card:active { transform: translateY(-1px) scale(0.98); }

.smiley-card__num { color: var(--c-text-soft); font-size: 9px; align-self: flex-start; }
.face { color: var(--c-ink); transition: all 0.4s cubic-bezier(0.32,0.72,0,1); width: 96px; height: 96px; }

.smiley-card__bottom { display: flex; flex-direction: column; align-items: center; gap: 12px; }
.smiley-card__label { font-size: 19px; color: var(--c-ink); line-height: 1.2; }
.smiley-card__rule { width: 24px; height: 1px; background: var(--c-rule); transition: all 0.4s; }

@keyframes fadeUp { from { opacity: 0; transform: translateY(16px); } to { opacity: 1; transform: translateY(0); } }

/* NPS */
.nps { display: flex; flex-direction: column; gap: 14px; width: 100%; max-width: 900px; margin-top: 40px; }
.nps__legend { display: flex; justify-content: space-between; color: var(--c-text-muted); font-size: 15px; padding: 0 8px; }
.nps__row { display: grid; grid-template-columns: repeat(11, 1fr); gap: 6px; }
.nps-btn {
  aspect-ratio: 1; min-height: 60px;
  background: var(--c-bg-card); border: 1px solid var(--c-border-strong);
  font-family: 'Cormorant Garamond', serif;
  font-size: 24px; font-weight: 500; color: var(--c-ink);
  transition: all 0.2s; cursor: pointer;
  font-feature-settings: 'tnum';
}
.nps-btn:hover { background: var(--c-ink); color: white; border-color: var(--c-ink); transform: translateY(-2px); }
.nps__scale { display: grid; grid-template-columns: 7fr 2fr 2fr; gap: 6px; }
.nps__band { font-size: 9px; font-weight: 600; letter-spacing: 0.16em; text-transform: uppercase; padding: 4px 0; text-align: center; }
.nps__band--bad { color: var(--c-danger); border-top: 2px solid currentColor; }
.nps__band--mid { color: var(--c-warning, #95701a); border-top: 2px solid currentColor; }
.nps__band--good { color: var(--c-success); border-top: 2px solid currentColor; }

/* TEXT */
.text-q { display: flex; flex-direction: column; gap: 12px; max-width: 640px; width: 100%; margin-top: 32px; }
.text-q__input { padding: 18px; font-size: 17px; background: var(--c-bg-card); border: 1px solid var(--c-border-strong); resize: none; min-height: 160px; font-family: inherit; transition: border-color 0.2s; color: var(--c-ink); line-height: 1.55; }
.text-q__input:focus { outline: none; border-color: var(--c-ink); }
.text-q__bar { display: flex; justify-content: space-between; align-items: center; gap: var(--s-3); padding-top: 4px; }
.text-q__count { font-size: 11px; color: var(--c-text-soft); letter-spacing: 0.06em; font-feature-settings: 'tnum'; }
.text-q__count.ok { color: var(--c-accent-deep); font-weight: 600; }
.text-q__send { padding: 14px 32px; font-size: 12px; font-weight: 600; letter-spacing: 0.16em; text-transform: uppercase; background: var(--c-ink); color: white; border: none; cursor: pointer; transition: all 0.2s; }
.text-q__send:disabled { opacity: 0.3; cursor: not-allowed; }
.text-q__send:not(:disabled):hover { background: var(--c-accent-deep); }

/* THANKS */
.thanks { text-align: center; max-width: 700px; display: flex; flex-direction: column; align-items: center; gap: 20px; }
.thanks__check { color: var(--c-success); margin: 8px 0; }
.thanks__check circle { animation: drawCircle 0.8s ease-out forwards; transform-origin: center; }
.thanks__check path { stroke-dasharray: 60; stroke-dashoffset: 60; animation: drawCheck 0.5s ease-out 0.5s forwards; }
@keyframes drawCircle { from { transform: scale(0.6); opacity: 0; } to { transform: scale(1); opacity: 1; } }
@keyframes drawCheck { to { stroke-dashoffset: 0; } }

.thanks__title { font-size: clamp(40px, 6vw, 72px); margin: 0; line-height: 1.1; color: var(--c-ink); font-weight: 500; }
.thanks__title em { color: var(--c-accent-deep); font-style: italic; }
.thanks__rule { width: 56px; height: 1px; background: var(--c-accent); border: 0; margin: 24px auto; }
.thanks__desc { font-size: 17px; line-height: 1.6; color: var(--c-text-muted); margin: 0 0 24px; }
.thanks__cta { padding: 16px 40px; font-size: 12px; font-weight: 600; letter-spacing: 0.16em; text-transform: uppercase; background: var(--c-ink); color: white; border: none; cursor: pointer; transition: all 0.2s; }
.thanks__cta:hover { background: var(--c-accent-deep); transform: translateY(-1px); }

/* FOOTER */
.foot { padding: 24px 48px; text-align: center; border-top: 1px solid var(--c-border); }

/* TRANSITIONS */
.q-enter-active, .q-leave-active { transition: all 0.45s cubic-bezier(0.32,0.72,0,1); }
.q-enter-from { opacity: 0; transform: translateY(20px); }
.q-leave-to { opacity: 0; transform: translateY(-20px); }

@media (max-width: 1000px) {
  .smileys { grid-template-columns: repeat(2, 1fr); }
}
@media (max-width: 700px) {
  .nps__row { grid-template-columns: repeat(6, 1fr); }
  .progress { padding: 0 24px; }
}
</style>
