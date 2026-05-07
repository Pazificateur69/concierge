<script setup lang="ts">
import { computed, onMounted, ref, onUnmounted } from 'vue';

defineProps<{ city?: string }>();

const time = ref(new Date());
const date = computed(() => time.value.toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' }));
const hour = computed(() => time.value.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }));

let timer: number | null = null;
onMounted(() => { timer = window.setInterval(() => (time.value = new Date()), 30000); });
onUnmounted(() => { if (timer) clearInterval(timer); });

type WeatherIcon = 'sunny' | 'cloudy' | 'rainy' | 'snowy' | 'partly';
interface Weather { icon: WeatherIcon; temp: number; label: string; hint: string; }

const weather = computed<Weather>(() => {
  const month = time.value.getMonth();
  if (month >= 5 && month <= 8) return { icon: 'sunny',  temp: 24, label: 'Ensoleillé',  hint: 'Profitez des terrasses' };
  if (month >= 9 && month <= 10) return { icon: 'partly', temp: 14, label: 'Automne doux', hint: 'Lumière dorée sur les quais' };
  if (month >= 11 || month <= 1) return { icon: 'snowy',  temp: 6,  label: 'Frais',        hint: 'Idéal pour le spa' };
  return { icon: 'partly', temp: 18, label: 'Printemps', hint: 'Saison parfaite' };
});

const iconPath: Record<WeatherIcon, string> = {
  sunny:  'M12 4v2m0 12v2M4.93 4.93l1.41 1.41m11.32 11.32 1.41 1.41M2 12h2m16 0h2M4.93 19.07l1.41-1.41M17.66 6.34l1.41-1.41M12 8a4 4 0 1 0 0 8 4 4 0 0 0 0-8z',
  cloudy: 'M17.5 19a4.5 4.5 0 0 0 0-9 6 6 0 0 0-11.6 1.5A4 4 0 0 0 6 19h11.5z',
  rainy:  'M16 13v8m-4-6v8m-4-6v8M20 16.58A5 5 0 0 0 18 7h-1.26A8 8 0 1 0 4 15.25',
  snowy:  'M2 12h20M12 2v20M19.07 4.93 4.93 19.07M19.07 19.07 4.93 4.93',
  partly: 'M12 4v2m0 12v2M4.93 4.93l1.41 1.41M16 8a4 4 0 1 0 0 8M19 14a4.5 4.5 0 0 0 0-9 6 6 0 0 0-11.6 1.5A4 4 0 0 0 7.5 14H19z',
};
</script>

<template>
  <div class="weather">
    <div class="weather__time">
      <span class="weather__hour">{{ hour }}</span>
      <span class="weather__date">{{ date }}</span>
    </div>
    <div class="weather__divider"></div>
    <div class="weather__current">
      <svg viewBox="0 0 24 24" width="36" height="36" fill="none" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round" class="weather__icon">
        <path :d="iconPath[weather.icon]"/>
      </svg>
      <div class="weather__temp-block">
        <span class="weather__temp">{{ weather.temp }}°</span>
        <span class="weather__label">{{ weather.label }}</span>
      </div>
    </div>
    <div class="weather__divider"></div>
    <div class="weather__city">
      <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
        <path d="M21 10c0 7-9 13-9 13S3 17 3 10a9 9 0 0 1 18 0z"/>
        <circle cx="12" cy="10" r="3"/>
      </svg>
      <div class="weather__city-text">
        <span class="weather__city-name">{{ city || 'Lyon' }}</span>
        <span class="weather__city-hint">{{ weather.hint }}</span>
      </div>
    </div>
  </div>
</template>

<style scoped>
.weather {
  display: inline-flex; align-items: center; gap: 24px;
  padding: 16px 28px;
  background: rgba(255, 255, 255, 0.12);
  backdrop-filter: blur(20px) saturate(180%);
  -webkit-backdrop-filter: blur(20px) saturate(180%);
  border: 1px solid rgba(255, 255, 255, 0.18);
  color: white;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.18);
}
.weather__divider { width: 1px; height: 40px; background: rgba(255,255,255,0.2); }

.weather__time { display: flex; flex-direction: column; gap: 2px; }
.weather__hour {
  font-family: 'Cormorant Garamond', serif;
  font-size: 30px; font-weight: 500; line-height: 1;
  font-feature-settings: 'tnum'; letter-spacing: -0.01em;
}
.weather__date {
  font-size: 11px;
  letter-spacing: 0.12em; text-transform: uppercase;
  opacity: 0.78; font-weight: 600;
}

.weather__current { display: flex; align-items: center; gap: 14px; }
.weather__icon { color: rgba(255,255,255,0.92); }
.weather__temp-block { display: flex; flex-direction: column; gap: 2px; }
.weather__temp {
  font-family: 'Cormorant Garamond', serif;
  font-size: 30px; font-weight: 500; line-height: 1;
  letter-spacing: -0.02em; font-feature-settings: 'tnum';
}
.weather__label { font-size: 11px; opacity: 0.78; letter-spacing: 0.06em; font-style: italic; }

.weather__city { display: inline-flex; align-items: center; gap: 10px; }
.weather__city-text { display: flex; flex-direction: column; gap: 2px; }
.weather__city-name { font-family: 'Cormorant Garamond', serif; font-size: 18px; font-style: italic; line-height: 1; }
.weather__city-hint { font-size: 10px; letter-spacing: 0.08em; opacity: 0.7; font-style: italic; }

@media (max-width: 700px) {
  .weather { gap: 14px; padding: 12px 18px; flex-wrap: wrap; }
  .weather__divider { display: none; }
  .weather__city-hint { display: none; }
}
</style>
