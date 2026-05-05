<script setup lang="ts">
import { IonApp } from '@ionic/vue';
import { onMounted, ref, computed } from 'vue';
import axios from 'axios';
import type { Survey, Question, SurveyAnswer } from '@concierge/types';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';
const params = new URLSearchParams(window.location.search);
const tenantSlug = params.get('tenant') || 'royal-lyon';
const surveySlug = params.get('survey') || 'satisfaction-checkout';
const room = params.get('room') || '';

const survey = ref<Survey | null>(null);
const tenantId = ref('');
const tenantName = ref('');
const tenantTheme = ref<any>(null);

type Step = 'loading' | 'question' | 'thanks' | 'error';
const step = ref<Step>('loading');
const currentQuestion = ref(0);
const answers = ref<SurveyAnswer[]>([]);
const lang = ref<string>('fr');
const voiceEnabled = ref(false);

const offlineQueue: any[] = JSON.parse(localStorage.getItem('smiley_queue') || '[]');

onMounted(async () => {
  try {
    const tenantResp = await axios.get(`${API_URL}/tenants/${tenantSlug}`);
    tenantId.value = tenantResp.data.id;
    tenantName.value = tenantResp.data.name;
    tenantTheme.value = tenantResp.data.theme;
    if (tenantTheme.value) applyTheme(tenantTheme.value);

    const surveyResp = await axios.get(`${API_URL}/surveys/${surveySlug}?tenantId=${tenantId.value}`);
    survey.value = surveyResp.data;
    step.value = 'question';
    flushQueue();
  } catch (e) {
    console.error(e);
    step.value = 'error';
  }
});

function applyTheme(theme: any) {
  const root = document.documentElement;
  root.style.setProperty('--c-primary', theme.primaryColor);
  root.style.setProperty('--c-accent', theme.accentColor);
}

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
  setTimeout(() => next(), 350);
}

function skip() { next(); }

async function next() {
  if (currentQuestion.value < visibleQuestions.value.length - 1) {
    currentQuestion.value++;
    if (current.value) {
      const lbl = (current.value.label as any)[lang.value] || (current.value.label as any).fr;
      speak(lbl);
    }
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
      await axios.post(
        `${API_URL}/surveys/${next.surveySlug}/responses?tenantId=${next.tenantId}`,
        next.payload,
      );
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

function reload() {
  window.location.reload();
}
</script>

<template>
  <ion-app>
    <div class="smiley">
      <header class="smiley__header">
        <div class="smiley__brand">{{ tenantName }}</div>
        <div class="smiley__controls">
          <button :class="{ on: voiceEnabled }" @click="voiceEnabled = !voiceEnabled">🔊</button>
          <select v-model="lang" class="smiley__lang">
            <option value="fr">🇫🇷 FR</option>
            <option value="en">🇬🇧 EN</option>
            <option value="de">🇩🇪 DE</option>
          </select>
        </div>
      </header>

      <main class="smiley__main">
        <div v-if="step === 'loading'" class="smiley__center">Chargement…</div>

        <div v-else-if="step === 'question' && current" class="smiley__question">
          <p class="smiley__progress">
            {{ currentQuestion + 1 }} / {{ visibleQuestions.length }}
          </p>
          <h1 class="smiley__label">
            {{ (current.label as any)[lang] || (current.label as any).fr }}
          </h1>

          <div v-if="current.type === 'smiley'" class="smiley__options smiley__options--smiley">
            <button
              v-for="opt in current.options"
              :key="String(opt.value)"
              class="smiley__option"
              @click="answer(opt.value)"
            >
              <span class="smiley__icon">{{ opt.icon }}</span>
              <span class="smiley__opt-label">{{ (opt.label as any)[lang] || (opt.label as any).fr }}</span>
            </button>
          </div>

          <div v-else-if="current.type === 'nps'" class="smiley__options smiley__options--nps">
            <button v-for="n in 11" :key="n - 1" class="smiley__nps" @click="answer(n - 1)">
              {{ n - 1 }}
            </button>
          </div>

          <div v-else-if="current.type === 'text'" class="smiley__text">
            <textarea ref="textRef" placeholder="Votre commentaire..." class="smiley__textarea"></textarea>
            <button class="smiley__send" @click="answer(($refs.textRef as HTMLTextAreaElement)?.value || '')">
              Envoyer
            </button>
          </div>

          <button v-if="!current.required" class="smiley__skip" @click="skip">Passer</button>
        </div>

        <div v-else-if="step === 'thanks'" class="smiley__thanks">
          <span class="smiley__check">✓</span>
          <h2>Merci !</h2>
          <p>Votre avis nous est précieux.</p>
          <button @click="reset">Nouvelle évaluation</button>
        </div>

        <div v-else class="smiley__center">
          Erreur de chargement. <button @click="reload">Recharger</button>
        </div>
      </main>
    </div>
  </ion-app>
</template>

<style scoped>
.smiley { min-height: 100vh; display: flex; flex-direction: column; background: linear-gradient(180deg, #fafaf7 0%, #fff 100%); }
.smiley__header { display: flex; justify-content: space-between; padding: 24px 48px; align-items: center; }
.smiley__brand { font-family: 'Playfair Display', serif; font-size: 22px; font-weight: 700; color: var(--c-primary, #1a4d8c); }
.smiley__controls { display: flex; gap: 12px; }
.smiley__controls button { width: 56px; height: 56px; border-radius: 12px; border: 2px solid rgba(0,0,0,0.1); background: white; font-size: 24px; cursor: pointer; }
.smiley__controls button.on { background: var(--c-accent, #d4a85a); }
.smiley__lang { padding: 12px; font-size: 18px; border-radius: 12px; border: 2px solid rgba(0,0,0,0.1); }
.smiley__main { flex: 1; display: flex; align-items: center; justify-content: center; padding: 32px; }
.smiley__center { font-size: 28px; }
.smiley__question { text-align: center; max-width: 1200px; }
.smiley__progress { font-size: 18px; color: rgba(0,0,0,0.5); }
.smiley__label { font-family: 'Playfair Display', serif; font-size: 56px; line-height: 1.2; margin: 16px 0 64px; }
.smiley__options--smiley { display: grid; grid-template-columns: repeat(4, 1fr); gap: 32px; max-width: 1100px; margin: 0 auto; }
.smiley__option { background: white; border: none; border-radius: 24px; padding: 40px 16px; cursor: pointer; box-shadow: 0 4px 16px rgba(0,0,0,0.06); transition: transform .15s; }
.smiley__option:active { transform: scale(0.95); background: var(--c-accent, #d4a85a); }
.smiley__icon { font-size: 96px; display: block; }
.smiley__opt-label { font-size: 18px; font-weight: 600; }
.smiley__options--nps { display: flex; flex-wrap: wrap; gap: 8px; justify-content: center; }
.smiley__nps { width: 72px; height: 72px; border-radius: 50%; border: 2px solid var(--c-primary); background: white; font-size: 22px; font-weight: 700; cursor: pointer; }
.smiley__nps:active { background: var(--c-primary); color: white; }
.smiley__text { display: flex; flex-direction: column; gap: 16px; max-width: 600px; margin: 0 auto; }
.smiley__textarea { padding: 16px; font-size: 18px; border-radius: 12px; border: 2px solid rgba(0,0,0,0.1); min-height: 120px; }
.smiley__send { background: var(--c-primary); color: white; padding: 18px; font-size: 18px; font-weight: 700; border: none; border-radius: 12px; cursor: pointer; }
.smiley__skip { margin-top: 32px; background: transparent; border: none; font-size: 16px; color: rgba(0,0,0,0.5); cursor: pointer; padding: 12px 24px; }
.smiley__thanks { text-align: center; }
.smiley__check { display: inline-block; width: 140px; height: 140px; line-height: 140px; border-radius: 50%; background: #2d7a4b; color: white; font-size: 80px; }
.smiley__thanks h2 { font-family: 'Playfair Display', serif; font-size: 56px; margin: 32px 0 8px; }
.smiley__thanks button { margin-top: 24px; padding: 18px 32px; font-size: 18px; background: var(--c-primary); color: white; border: none; border-radius: 12px; cursor: pointer; }
@media (max-width: 800px) {
  .smiley__options--smiley { grid-template-columns: repeat(2, 1fr); gap: 16px; }
  .smiley__icon { font-size: 64px; }
  .smiley__label { font-size: 32px; }
}
</style>
