<script setup lang="ts">
import { computed, onMounted, ref, onUnmounted } from 'vue';

const props = defineProps<{ city?: string }>();

const time = ref(new Date());
const date = computed(() => time.value.toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' }));
const hour = computed(() => time.value.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }));

let timer: number | null = null;
onMounted(() => { timer = window.setInterval(() => (time.value = new Date()), 30000); });
onUnmounted(() => { if (timer) clearInterval(timer); });

// Mock weather (could be wired to a real API)
const weather = computed(() => {
  const month = time.value.getMonth();
  if (month >= 5 && month <= 8) return { icon: '☀️', temp: '24', label: 'Ensoleillé' };
  if (month >= 9 && month <= 10) return { icon: '🍂', temp: '14', label: 'Doux' };
  if (month >= 11 || month <= 1) return { icon: '❄️', temp: '6', label: 'Frais' };
  return { icon: '🌤️', temp: '18', label: 'Agréable' };
});
</script>

<template>
  <div class="weather">
    <div class="weather__time">
      <span class="weather__hour">{{ hour }}</span>
      <span class="weather__date">{{ date }}</span>
    </div>
    <div class="weather__divider"></div>
    <div class="weather__current">
      <span class="weather__icon">{{ weather.icon }}</span>
      <div>
        <span class="weather__temp">{{ weather.temp }}°</span>
        <span class="weather__label">{{ weather.label }}</span>
      </div>
    </div>
    <div class="weather__divider"></div>
    <div class="weather__city">
      <span>📍</span>
      <span>{{ city || 'Lyon' }}</span>
    </div>
  </div>
</template>

<style scoped>
.weather {
  display: inline-flex; align-items: center; gap: var(--s-5);
  padding: var(--s-4) var(--s-6);
  background: rgba(255, 255, 255, 0.12);
  backdrop-filter: blur(20px) saturate(180%);
  -webkit-backdrop-filter: blur(20px) saturate(180%);
  border: 1px solid rgba(255, 255, 255, 0.18);
  border-radius: var(--r-xl);
  color: white;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.18);
}
.weather__divider { width: 1px; height: 36px; background: rgba(255,255,255,0.2); }

.weather__time { display: flex; flex-direction: column; }
.weather__hour {
  font-family: var(--c-font-display, 'Playfair Display', serif);
  font-size: 28px; font-weight: 700; line-height: 1;
  font-feature-settings: 'tnum';
}
.weather__date { font-size: 13px; opacity: 0.85; text-transform: capitalize; margin-top: 4px; }

.weather__current { display: flex; align-items: center; gap: var(--s-3); }
.weather__icon { font-size: 36px; }
.weather__temp {
  font-family: var(--c-font-display, 'Playfair Display', serif);
  font-size: 28px; font-weight: 700; line-height: 1;
  display: block;
}
.weather__label { font-size: 13px; opacity: 0.85; }

.weather__city { display: inline-flex; align-items: center; gap: 6px; font-size: 14px; font-weight: 600; opacity: 0.9; }
</style>
