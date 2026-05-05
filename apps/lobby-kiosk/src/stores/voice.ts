import { defineStore } from 'pinia';
import { ref } from 'vue';

export const useVoiceStore = defineStore('voice', () => {
  const enabled = ref(localStorage.getItem('voice') === '1');

  function toggle() {
    enabled.value = !enabled.value;
    localStorage.setItem('voice', enabled.value ? '1' : '0');
    if (!enabled.value) speechSynthesis.cancel();
  }

  function speak(text: string, lang = 'fr-FR') {
    if (!enabled.value) return;
    if (typeof speechSynthesis === 'undefined') return;
    speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = lang;
    utterance.rate = 0.95;
    speechSynthesis.speak(utterance);
  }

  return { enabled, toggle, speak };
});
