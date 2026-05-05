<script setup lang="ts">
import { IonPage, IonContent } from '@ionic/vue';
import { onMounted, ref, watch } from 'vue';
import L from 'leaflet';
import KioskHeader from '../components/KioskHeader.vue';
import { useTenantStore } from '../stores/tenant';
import { useVoiceStore } from '../stores/voice';
import { api } from '../api';
import { useI18n } from 'vue-i18n';
import type { Poi, PoiCategory } from '@concierge/types';

const i18n = useI18n();
const tenantStore = useTenantStore();
const voice = useVoiceStore();

const pois = ref<Poi[]>([]);
const selected = ref<Poi | null>(null);
const activeCategories = ref<Set<PoiCategory>>(new Set());

const allCategories: PoiCategory[] = ['restaurant', 'monument', 'museum', 'transport', 'shopping', 'park', 'bar', 'pharmacy'];
const ICONS: Record<PoiCategory, string> = {
  restaurant: '🍽️', monument: '🏛️', museum: '🖼️',
  transport: '🚆', shopping: '🛍️', park: '🌳',
  bar: '🍷', pharmacy: '💊',
};

let map: L.Map | null = null;
const markerLayer = L.layerGroup();

onMounted(async () => {
  if (!tenantStore.tenant) return;
  voice.speak(i18n.t('map.title'), i18n.locale.value === 'fr' ? 'fr-FR' : 'en-US');

  const center: [number, number] = [
    tenantStore.tenant.id === 'fallback' ? 45.7578 : 45.7578,
    4.832,
  ];

  map = L.map('lobby-map', { zoomControl: true, attributionControl: false })
    .setView(center, 14);
  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', { maxZoom: 19 }).addTo(map);
  markerLayer.addTo(map);

  L.marker(center, {
    icon: L.divIcon({
      className: 'lm-hotel',
      html: '<div style="background:var(--c-primary,#1a4d8c);color:white;padding:8px 12px;border-radius:24px;font-weight:700;box-shadow:0 4px 12px rgba(0,0,0,0.2);">🏨 ' + (tenantStore.tenant?.name ?? 'Hotel') + '</div>',
      iconSize: [200, 40], iconAnchor: [100, 20],
    }),
  }).addTo(map);

  try {
    const { data } = await api.get<Poi[]>(`/content/pois?tenantId=${tenantStore.tenant.id}`);
    pois.value = data;
    refreshMarkers();
  } catch (e) {
    console.error(e);
  }
});

function toggleCategory(c: PoiCategory) {
  if (activeCategories.value.has(c)) activeCategories.value.delete(c);
  else activeCategories.value.add(c);
  refreshMarkers();
}

function refreshMarkers() {
  if (!map) return;
  markerLayer.clearLayers();
  const filtered = activeCategories.value.size === 0
    ? pois.value
    : pois.value.filter((p) => activeCategories.value.has(p.category));
  for (const poi of filtered) {
    const m = L.marker([poi.lat, poi.lng], {
      icon: L.divIcon({
        className: 'lm-poi',
        html: `<div style="background:white;padding:8px;border-radius:50%;font-size:22px;box-shadow:0 2px 8px rgba(0,0,0,0.2);">${ICONS[poi.category]}</div>`,
        iconSize: [40, 40], iconAnchor: [20, 20],
      }),
    });
    m.on('click', () => {
      selected.value = poi;
      const name = (poi.name as any).fr || Object.values(poi.name)[0];
      voice.speak(name, i18n.locale.value === 'fr' ? 'fr-FR' : 'en-US');
    });
    m.addTo(markerLayer);
  }
}

watch(() => i18n.locale.value, refreshMarkers);
</script>

<template>
  <ion-page>
    <KioskHeader :title="$t('map.title')" />
    <ion-content :fullscreen="true">
      <div class="mapview">
        <div id="lobby-map" class="mapview__map"></div>
        <aside class="mapview__side">
          <h3>{{ $t('map.filters') }}</h3>
          <div class="mapview__filters">
            <button
              v-for="cat in allCategories"
              :key="cat"
              class="mapview__chip"
              :class="{ active: activeCategories.has(cat) }"
              @click="toggleCategory(cat)"
            >
              {{ ICONS[cat] }} {{ $t(`map.categories.${cat}`) || cat }}
            </button>
          </div>

          <div v-if="selected" class="mapview__detail">
            <h4>{{ (selected.name as any)[$i18n.locale] || (selected.name as any).fr }}</h4>
            <p v-if="selected.rating">⭐ {{ selected.rating }} / 5</p>
            <p v-if="selected.hours"><strong>🕒</strong> {{ selected.hours }}</p>
            <p v-if="selected.phone"><strong>📞</strong> {{ selected.phone }}</p>
            <button class="mapview__cta">{{ $t('map.itinerary') }} →</button>
          </div>
        </aside>
      </div>
    </ion-content>
  </ion-page>
</template>

<style scoped>
.mapview { display: grid; grid-template-columns: 1fr 360px; height: calc(100vh - 80px); }
.mapview__map { width: 100%; height: 100%; }
.mapview__side {
  background: white; padding: 24px; overflow-y: auto;
  border-left: 1px solid rgba(0,0,0,0.06); display: flex; flex-direction: column; gap: 16px;
}
.mapview__side h3, .mapview__side h4 {
  font-family: var(--c-font-display, 'Playfair Display'), serif; margin: 0;
}
.mapview__filters { display: flex; flex-wrap: wrap; gap: 8px; }
.mapview__chip {
  padding: 12px 16px; border-radius: 24px; border: 2px solid rgba(0,0,0,0.08);
  background: white; cursor: pointer; font-size: 14px; font-weight: 500;
  min-height: 48px;
}
.mapview__chip.active { background: var(--c-primary, #1a4d8c); color: white; border-color: var(--c-primary); }
.mapview__detail { background: var(--c-bg); padding: 16px; border-radius: 16px; margin-top: 16px; }
.mapview__cta {
  margin-top: 16px; width: 100%; background: var(--c-primary); color: white;
  border: none; border-radius: 12px; padding: 16px; font-size: 18px; font-weight: 600; cursor: pointer;
  min-height: 56px;
}
@media (max-width: 900px) { .mapview { grid-template-columns: 1fr; grid-template-rows: 60% 40%; } }
</style>
