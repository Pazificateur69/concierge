<script setup lang="ts">
import { IonPage, IonContent } from '@ionic/vue';
import { onMounted, ref, computed, watch } from 'vue';
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
const loading = ref(true);
const selected = ref<Poi | null>(null);
const activeCategory = ref<PoiCategory | 'all'>('all');

const ICONS: Record<PoiCategory, string> = {
  restaurant: '🍽️', monument: '🏛️', museum: '🖼️',
  transport: '🚆', shopping: '🛍️', park: '🌳',
  bar: '🍷', pharmacy: '💊',
};

const COLORS: Record<PoiCategory, string> = {
  restaurant: '#e76f51', monument: '#264653', museum: '#9b5de5',
  transport: '#2a9d8f', shopping: '#f4a261', park: '#52b788',
  bar: '#bc6c25', pharmacy: '#06d6a0',
};

let map: L.Map | null = null;
const markerLayer = L.layerGroup();
const markerById = new Map<string, L.Marker>();

const filtered = computed(() =>
  activeCategory.value === 'all' ? pois.value : pois.value.filter((p) => p.category === activeCategory.value),
);

const counts = computed(() => {
  const out: Record<string, number> = { all: pois.value.length };
  for (const p of pois.value) out[p.category] = (out[p.category] || 0) + 1;
  return out;
});

const allCategories = computed(() =>
  (Object.keys(ICONS) as PoiCategory[]).filter((c) => (counts.value[c] || 0) > 0),
);

onMounted(async () => {
  if (!tenantStore.tenant) return;
  voice.speak(i18n.t('map.title'), i18n.locale.value === 'fr' ? 'fr-FR' : 'en-US');

  const center: [number, number] = [
    tenantStore.tenant.contact?.lat ?? 45.7578,
    tenantStore.tenant.contact?.lng ?? 4.832,
  ];

  map = L.map('lobby-map', { zoomControl: true, attributionControl: false }).setView(center, 14);
  L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png', {
    maxZoom: 19, subdomains: 'abcd',
  }).addTo(map);
  markerLayer.addTo(map);

  // Hotel marker
  L.marker(center, {
    icon: L.divIcon({
      className: 'lm-hotel',
      html: `<div class="hotel-pin"><span>🏨</span><span class="hotel-pin__name">${tenantStore.tenant?.name ?? 'Hotel'}</span></div>`,
      iconSize: [220, 48], iconAnchor: [110, 48],
    }),
  }).addTo(map);

  try {
    const { data } = await api.get<Poi[]>(`/content/pois?tenantId=${tenantStore.tenant.id}`);
    pois.value = data;
    refreshMarkers();
  } catch (e) {
    console.error(e);
  } finally {
    loading.value = false;
  }
});

function selectCategory(cat: PoiCategory | 'all') {
  activeCategory.value = cat;
  refreshMarkers();
}

function refreshMarkers() {
  if (!map) return;
  markerLayer.clearLayers();
  markerById.clear();
  for (const poi of filtered.value) {
    const color = COLORS[poi.category];
    const m = L.marker([poi.lat, poi.lng], {
      icon: L.divIcon({
        className: 'lm-poi',
        html: `<div class="poi-pin" style="--c:${color}"><span>${ICONS[poi.category]}</span></div>`,
        iconSize: [44, 44], iconAnchor: [22, 22],
      }),
    });
    m.on('click', () => selectPoi(poi));
    m.addTo(markerLayer);
    markerById.set(poi.id, m);
  }
}

function selectPoi(p: Poi) {
  selected.value = p;
  const name = (p.name as any)[i18n.locale.value] || (p.name as any).fr || Object.values(p.name)[0];
  voice.speak(name, i18n.locale.value === 'fr' ? 'fr-FR' : 'en-US');
  if (map) map.flyTo([p.lat, p.lng], 16, { duration: 0.6 });
}

function poiName(p: Poi) {
  return (p.name as any)[i18n.locale.value] || (p.name as any).fr || Object.values(p.name)[0];
}

watch(() => i18n.locale.value, refreshMarkers);
</script>

<template>
  <ion-page>
    <KioskHeader :title="$t('map.title')" />
    <ion-content :fullscreen="true">
      <div class="mapview">
        <div class="mapview__map-wrap">
          <div id="lobby-map" class="mapview__map"></div>
          <div v-if="loading" class="mapview__loading">
            <div class="spinner"></div>
            <p>Chargement de la carte…</p>
          </div>
        </div>

        <aside class="mapview__side">
          <div class="mapview__head">
            <div>
              <h2 class="font-display">{{ $t('map.title') }}</h2>
              <p>{{ $t('map.subtitle') }}</p>
            </div>
            <div class="mapview__count">{{ filtered.length }}</div>
          </div>

          <!-- Categories -->
          <div class="cat-list">
            <button class="cat-chip" :class="{ active: activeCategory === 'all' }" @click="selectCategory('all')">
              <span class="cat-chip__icon">📍</span>
              <span class="cat-chip__label">{{ $t('map.showAll') }}</span>
              <span class="cat-chip__count">{{ counts.all }}</span>
            </button>
            <button
              v-for="cat in allCategories"
              :key="cat"
              class="cat-chip"
              :class="{ active: activeCategory === cat }"
              :style="{ '--cat-color': COLORS[cat] }"
              @click="selectCategory(cat)"
            >
              <span class="cat-chip__icon">{{ ICONS[cat] }}</span>
              <span class="cat-chip__label">{{ $t(`map.categories.${cat}`) || cat }}</span>
              <span class="cat-chip__count">{{ counts[cat] || 0 }}</span>
            </button>
          </div>

          <!-- POI list -->
          <div class="poi-list">
            <button
              v-for="p in filtered"
              :key="p.id"
              class="poi-item"
              :class="{ selected: selected?.id === p.id }"
              :style="{ '--cat-color': COLORS[p.category] }"
              @click="selectPoi(p)"
            >
              <span class="poi-item__icon">{{ ICONS[p.category] }}</span>
              <span class="poi-item__body">
                <span class="poi-item__name">{{ poiName(p) }}</span>
                <span class="poi-item__meta">
                  <span v-if="p.rating">⭐ {{ p.rating }}</span>
                  <span v-if="p.distanceMeters">· {{ Math.round(p.distanceMeters) }}m</span>
                </span>
              </span>
            </button>
            <div v-if="!filtered.length && !loading" class="poi-empty">{{ $t('map.empty') }}</div>
          </div>
        </aside>
      </div>
    </ion-content>
  </ion-page>
</template>

<style>
/* Map markers — global because Leaflet renders outside Vue scope */
.hotel-pin {
  display: flex; align-items: center; gap: 6px;
  background: var(--c-primary, #1a4d8c); color: white;
  padding: 8px 14px; border-radius: 999px;
  font-weight: 700; font-size: 14px;
  box-shadow: 0 6px 16px rgba(13, 39, 72, 0.35);
  white-space: nowrap;
}
.hotel-pin__name { font-family: 'Playfair Display', serif; }
.poi-pin {
  width: 44px; height: 44px;
  background: white; border: 3px solid var(--c, #1a4d8c);
  border-radius: 50%;
  display: grid; place-items: center;
  font-size: 20px;
  box-shadow: 0 4px 10px rgba(0,0,0,0.18);
  transition: transform 0.2s ease;
}
.poi-pin:hover { transform: scale(1.15); }
</style>

<style scoped>
.mapview {
  display: grid; grid-template-columns: 1fr 400px;
  height: calc(100vh - 80px);
  background: var(--c-bg);
}
.mapview__map-wrap { position: relative; }
.mapview__map { width: 100%; height: 100%; background: var(--c-bg-soft); }

.mapview__loading {
  position: absolute; inset: 0;
  display: flex; flex-direction: column; align-items: center; justify-content: center;
  gap: var(--s-4); background: rgba(255,255,255,0.9);
  color: var(--c-text-muted);
}
.spinner {
  width: 40px; height: 40px;
  border: 3px solid var(--c-border-strong); border-top-color: var(--c-primary);
  border-radius: 50%; animation: spin 0.8s linear infinite;
}
@keyframes spin { to { transform: rotate(360deg); } }

.mapview__side {
  background: var(--c-bg-card);
  border-left: 1px solid var(--c-border);
  display: flex; flex-direction: column;
  overflow: hidden;
}

.mapview__head {
  padding: var(--s-6); border-bottom: 1px solid var(--c-border);
  display: flex; justify-content: space-between; align-items: flex-start; gap: var(--s-4);
}
.mapview__head h2 { margin: 0 0 4px; font-size: 22px; }
.mapview__head p { margin: 0; color: var(--c-text-muted); font-size: 14px; }
.mapview__count {
  background: var(--c-primary); color: white;
  font-weight: 700; font-size: 18px;
  width: 48px; height: 48px;
  border-radius: var(--r-md);
  display: grid; place-items: center;
  font-feature-settings: 'tnum';
}

.cat-list {
  display: flex; flex-wrap: wrap; gap: var(--s-2);
  padding: var(--s-4) var(--s-6);
  border-bottom: 1px solid var(--c-border);
}
.cat-chip {
  display: inline-flex; align-items: center; gap: 6px;
  padding: 8px 14px;
  background: var(--c-bg-soft); border: 2px solid transparent;
  border-radius: var(--r-full);
  font-size: 14px; font-weight: 600; color: var(--c-text-muted);
  transition: all var(--dur-fast);
}
.cat-chip__icon { font-size: 16px; }
.cat-chip__count {
  background: rgba(0,0,0,0.06); color: var(--c-text-muted);
  padding: 0 8px; min-width: 22px; text-align: center;
  border-radius: 999px; font-size: 12px;
}
.cat-chip.active {
  background: var(--cat-color, var(--c-primary));
  color: white; border-color: transparent;
  box-shadow: var(--sh-sm);
}
.cat-chip.active .cat-chip__count { background: rgba(255,255,255,0.25); color: white; }

.poi-list {
  flex: 1; overflow-y: auto;
  padding: var(--s-3) var(--s-3);
  display: flex; flex-direction: column; gap: 2px;
}
.poi-item {
  display: flex; align-items: center; gap: var(--s-3);
  padding: var(--s-3) var(--s-4);
  background: transparent; border: 2px solid transparent;
  border-radius: var(--r-md);
  text-align: left;
  transition: all var(--dur-fast);
}
.poi-item:hover { background: var(--c-bg-soft); }
.poi-item.selected {
  background: var(--c-bg-soft); border-color: var(--cat-color, var(--c-primary));
}
.poi-item__icon {
  width: 44px; height: 44px;
  background: white; border: 2px solid var(--cat-color, var(--c-border));
  border-radius: var(--r-md);
  display: grid; place-items: center;
  font-size: 22px; flex-shrink: 0;
}
.poi-item__body { display: flex; flex-direction: column; gap: 2px; }
.poi-item__name { font-weight: 600; color: var(--c-text); font-size: 16px; }
.poi-item__meta { color: var(--c-text-muted); font-size: 13px; display: flex; gap: 4px; }

.poi-empty { text-align: center; padding: var(--s-8) var(--s-4); color: var(--c-text-soft); font-size: 14px; }

@media (max-width: 900px) {
  .mapview { grid-template-columns: 1fr; grid-template-rows: 50% 50%; }
  .mapview__side { border-left: none; border-top: 1px solid var(--c-border); }
}
</style>
