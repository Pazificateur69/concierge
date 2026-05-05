import { defineStore } from 'pinia';
import { ref } from 'vue';

const TIMEOUT_MS = 60_000;

export const useIdleStore = defineStore('idle', () => {
  const isIdle = ref(false);
  let timer: ReturnType<typeof setTimeout> | null = null;
  let onIdle: (() => void) | null = null;

  function reset() {
    isIdle.value = false;
    if (timer) clearTimeout(timer);
    timer = setTimeout(() => {
      isIdle.value = true;
      onIdle?.();
    }, TIMEOUT_MS);
  }

  function start(cb: () => void) {
    onIdle = cb;
    ['touchstart', 'mousedown', 'keydown', 'scroll'].forEach((evt) =>
      window.addEventListener(evt, reset, { passive: true }),
    );
    reset();
  }

  return { isIdle, reset, start };
});
