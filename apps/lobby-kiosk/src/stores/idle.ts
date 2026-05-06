import { defineStore } from 'pinia';
import { ref } from 'vue';

const WARN_AFTER_MS = 45_000;
const COUNTDOWN_MS = 15_000;

export const useIdleStore = defineStore('idle', () => {
  const isWarning = ref(false);
  const countdown = ref(0);
  let warnTimer: ReturnType<typeof setTimeout> | null = null;
  let countdownInterval: ReturnType<typeof setInterval> | null = null;
  let onTimeout: (() => void) | null = null;

  function clearTimers() {
    if (warnTimer) { clearTimeout(warnTimer); warnTimer = null; }
    if (countdownInterval) { clearInterval(countdownInterval); countdownInterval = null; }
  }

  function reset() {
    isWarning.value = false;
    clearTimers();
    warnTimer = setTimeout(() => triggerWarning(), WARN_AFTER_MS);
  }

  function triggerWarning() {
    isWarning.value = true;
    countdown.value = Math.floor(COUNTDOWN_MS / 1000);
    countdownInterval = setInterval(() => {
      countdown.value -= 1;
      if (countdown.value <= 0) {
        clearTimers();
        isWarning.value = false;
        onTimeout?.();
      }
    }, 1000);
  }

  function dismiss() {
    isWarning.value = false;
    reset();
  }

  function start(cb: () => void) {
    onTimeout = cb;
    ['touchstart', 'mousedown', 'keydown'].forEach((evt) =>
      window.addEventListener(evt, () => { if (!isWarning.value) reset(); }, { passive: true }),
    );
    reset();
  }

  return { isWarning, countdown, reset, start, dismiss };
});
