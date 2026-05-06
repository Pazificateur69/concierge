<script setup lang="ts">
import { IonPage, IonContent } from '@ionic/vue';
import { onMounted, ref, computed, watch } from 'vue';
import L from 'leaflet';
import KioskHeader from '../components/KioskHeader.vue';
import Icon from '../components/Icon.vue';
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

const CAT_LABELS: Record<PoiCategory, string> = {
  restaurant: 'Restaurants', monument: 'Monuments', museum: 'Musées',
  transport: 'Transports', shopping: 'Boutiques', park: 'Parcs',
  bar: 'Bars', pharmacy: 'Pharmacies',
};

const POI_PHOTOS: Record<string, string> = {
  restaurant: 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=600&q=80',
  monument: 'https://images.unsplash.com/photo-1568322445389-f64ac2515099?w=600&q=80',
  museum: 'https://images.unsplash.com/photo-1565060169187-5284465b7af2?w=600&q=80',
  transport: 'https://images.unsplash.com/photo-1581547869738-c6cc9d35a4d7?w=600&q=80',
  shopping: 'https://images.unsplash.com/photo-1481437156560-3205f6a55735?w=600&q=80',
  park: 'https://images.unsplash.com/photo-1588668214407-6ea9a6d8c272?w=600&q=80',
  bar: 'https://images.unsplash.com/photo-1514933651103-005eec06c04b?w=600&q=80',
  pharmacy: 'https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=600&q=80',
};

let map: L.Map | null = null;
const markerLayer = L.layerGroup();
const markerById = new Map<string, L.Marker>();

const filtered = computed(() => activeCategory.value === 'all' ? pois.value : pois.value.filter((p) => p.category === activeCategory.value));

const counts = computed(() => {
  const out: Record<string, number> = { all: pois.value.length };
  for (const p of pois.value) out[p.category] = (out[p.category] || 0) + 1;
  return out;
});

const allCategories = computed(() => (Object.keys(CAT_LABELS) as PoiCategory[]).filter((c) => (counts.value[c] || 0) > 0));

onMounted(async () => {
  if (!tenantStore.tenant) return;
  voice.speak(i18n.t('map.title'), i18n.locale.value === 'fr' ? 'fr-FR' : 'en-US');

  const center: [number, number] = [
    tenantStore.tenant.contact?.lat ?? 45.7578,
    tenantStore.tenant.contact?.lng ?? 4.832,
  ];

  map = L.map('lobby-map', { zoomControl: true, attributionControl: false }).setView(center, 14);

  // Cleaner Stadia Stamen Toner Light tiles for editorial feel
  L.tileLayer('https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png', {
    maxZoom: 19, subdomains: 'abcd',
  }).addTo(map);
  markerLayer.addTo(map);

  L.marker(center, {
    icon: L.divIcon({
      className: 'lm-hotel',
      html: `<div class="hotel-pin"><span class="hotel-pin__core"></span><span class="hotel-pin__name">${tenantStore.tenant?.name ?? ''}</span></div>`,
      iconSize: [240, 36], iconAnchor: [120, 18],
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
    const num = filtered.value.indexOf(poi) + 1;
    const m = L.marker([poi.lat, poi.lng], {
      icon: L.divIcon({
        className: 'lm-poi',
        html: `<div class="poi-pin"><span class="poi-pin__num">${num}</span></div>`,
        iconSize: [32, 32], iconAnchor: [16, 16],
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

function poiPhoto(p: Poi) {
  return p.photo || POI_PHOTOS[p.category] || POI_PHOTOS.monument;
}

watch(() => i18n.locale.value, refreshMarkers);
</script>

<template>
  <ion-page>
    <KioskHeader :title="$t('map.title')" />
    <ion-content :fullscreen="true">
      <div class="mapview">
        <aside class="mapview__side">
          <div class="mapview__intro">
            <span class="eyebrow">Explorez le quartier</span>
            <h2 class="serif">À deux pas d'<em>ici</em></h2>
            <p class="mapview__count-line">{{ pois.length }} adresses sélectionnées par notre conciergerie</p>
          </div>

          <div class="cat-row">
            <button class="cat" :class="{ active: activeCategory === 'all' }" @click="selectCategory('all')">
              <span class="cat__label">Tout</span>
              <span class="cat__count">{{ counts.all }}</span>
            </button>
            <button v-for="cat in allCategories" :key="cat" class="cat" :class="{ active: activeCategory === cat }" @click="selectCategory(cat)">
              <span class="cat__label">{{ CAT_LABELS[cat] }}</span>
              <span class="cat__count">{{ counts[cat] || 0 }}</span>
            </button>
          </div>

          <div class="poi-list">
            <article
              v-for="(p, idx) in filtered"
              :key="p.id"
              class="poi"
              :class="{ active: selected?.id === p.id }"
              @click="selectPoi(p)"
            >
              <div class="poi__image">
                <img :src="poiPhoto(p)" :alt="poiName(p)" loading="lazy" />
                <span class="poi__num">{{ String(idx + 1).padStart(2, '0') }}</span>
              </div>
              <div class="poi__body">
                <span class="poi__cat eyebrow">{{ CAT_LABELS[p.category] }}</span>
                <h4 class="poi__name serif">{{ poiName(p) }}</h4>
                <div class="poi__meta">
                  <span v-if="p.rating" class="poi__rating">
                    <Icon name="star" :size="12" />
                    {{ p.rating.toFixed(1) }}
                  </span>
                  <span v-if="p.distanceMeters" class="poi__sep">·</span>
                  <span v-if="p.distanceMeters">{{ Math.round(p.distanceMeters) }} m</span>
                  <span v-if="p.hours" class="poi__sep">·</span>
                  <span v-if="p.hours">{{ p.hours }}</span>
                </div>
              </div>
            </article>
            <div v-if="!filtered.length && !loading" class="poi-empty">Aucune adresse dans cette catégorie.</div>
            <div v-if="loading" class="poi-empty">Chargement de la sélection…</div>
          </div>
        </aside>

        <div class="mapview__map-wrap">
          <div id="lobby-map" class="mapview__map"></div>
          <div v-if="loading" class="map-loading">
            <div class="map-loading__spinner"></div>
            <span class="eyebrow">Chargement de la carte</span>
          </div>
        </div>
      </div>
    </ion-content>
  </ion-page>
</template>

<style>
/* Global — Leaflet renders outside Vue scope */
.hotel-pin { display: flex; flex-direction: column; align-items: center; gap: 6px; pointer-events: none; }
.hotel-pin__core {
  width: 16px; height: 16px;
  background: var(--c-ink, #14202e);
  border: 3px solid white;
  border-radius: 50%;
  box-shadow: 0 0 0 1px rgba(0,0,0,0.1), 0 0 0 12px rgba(20,32,46,0.06);
  animation: pulse-pin 3s ease-in-out infinite;
}
@keyframes pulse-pin {
  0%, 100% { box-shadow: 0 0 0 1px rgba(0,0,0,0.1), 0 0 0 8px rgba(20,32,46,0.10); }
  50% { box-shadow: 0 0 0 1px rgba(0,0,0,0.1), 0 0 0 18px rgba(20,32,46,0); }
}
.hotel-pin__name {
  font-family: 'Cormorant Garamond', serif;
  font-style: italic; font-size: 13px; font-weight: 600;
  background: var(--c-ink, #14202e); color: white;
  padding: 4px 10px;
  white-space: nowrap;
  letter-spacing: 0.02em;
}
.poi-pin {
  width: 32px; height: 32px;
  background: white;
  border: 1.5px solid var(--c-ink, #14202e);
  border-radius: 50%;
  display: grid; place-items: center;
  font-family: 'Cormorant Garamond', serif;
  font-size: 14px; font-weight: 600;
  color: var(--c-ink, #14202e);
  box-shadow: 0 4px 8px rgba(0,0,0,0.10);
  transition: all 0.2s ease;
  cursor: pointer;
}
.poi-pin:hover { transform: scale(1.18); background: var(--c-accent, #b8985a); color: white; border-color: var(--c-accent, #b8985a); }
</style>

<style scoped>
.mapview {
  display: grid; grid-template-columns: 460px 1fr;
  height: calc(100vh - 80px);
  background: var(--c-bg);
}
.mapview__side {
  background: var(--c-bg-card);
  border-right: 1px solid var(--c-border);
  display: flex; flex-direction: column;
  overflow: hidden;
}

.mapview__intro { padding: var(--s-8) var(--s-6) var(--s-5); border-bottom: 1px solid var(--c-border); }
.mapview__intro h2 { font-size: 36px; line-height: 1.1; margin: var(--s-2) 0; font-weight: 500; }
.mapview__intro h2 em { color: var(--c-accent-deep); font-style: italic; }
.mapview__count-line { font-size: 13px; color: var(--c-text-muted); margin: 0; }

.cat-row {
  display: flex; gap: 0;
  padding: var(--s-3) var(--s-6);
  overflow-x: auto;
  border-bottom: 1px solid var(--c-border);
}
.cat {
  display: inline-flex; align-items: center; gap: 6px;
  padding: var(--s-3) var(--s-3);
  background: transparent; border: none;
  border-bottom: 2px solid transparent;
  font-size: 12px; font-weight: 600; letter-spacing: 0.06em; text-transform: uppercase;
  color: var(--c-text-muted);
  white-space: nowrap;
  transition: all var(--dur-fast);
}
.cat__count { font-size: 10px; color: var(--c-text-faint); font-weight: 500; }
.cat:hover { color: var(--c-ink); }
.cat.active { color: var(--c-ink); border-bottom-color: var(--c-ink); }
.cat.active .cat__count { color: var(--c-accent-deep); }

.poi-list { flex: 1; overflow-y: auto; padding: var(--s-3) var(--s-3) var(--s-8); display: flex; flex-direction: column; }

.poi {
  display: flex; gap: var(--s-4);
  padding: var(--s-4) var(--s-3);
  border-bottom: 1px solid var(--c-border);
  cursor: pointer;
  transition: background var(--dur-fast);
}
.poi:hover { background: var(--c-paper); }
.poi.active { background: var(--c-paper-soft); }
.poi:last-child { border-bottom: none; }

.poi__image {
  position: relative;
  width: 96px; height: 96px;
  flex-shrink: 0; overflow: hidden;
  background: var(--c-paper);
}
.poi__image img { width: 100%; height: 100%; object-fit: cover; transition: transform var(--dur-base); }
.poi:hover .poi__image img { transform: scale(1.05); }
.poi__num {
  position: absolute; top: 6px; left: 6px;
  background: white; color: var(--c-ink);
  padding: 2px 6px;
  font-family: var(--c-font-display); font-size: 12px; font-weight: 600;
  letter-spacing: 0.04em;
}

.poi__body { flex: 1; min-width: 0; display: flex; flex-direction: column; gap: 4px; padding-top: 2px; }
.poi__cat { font-size: 9px; }
.poi__name {
  font-size: 19px; line-height: 1.2; font-weight: 500;
  color: var(--c-ink); margin: 0;
  letter-spacing: -0.01em;
  overflow: hidden;
  text-overflow: ellipsis;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
}
.poi__meta {
  display: flex; align-items: center; gap: 4px;
  font-size: 12px; color: var(--c-text-muted);
  font-feature-settings: 'tnum';
  margin-top: 2px;
}
.poi__rating { display: inline-flex; align-items: center; gap: 4px; color: var(--c-accent-deep); }
.poi__sep { color: var(--c-text-faint); }

.poi-empty { text-align: center; padding: var(--s-12) var(--s-4); color: var(--c-text-soft); font-size: 13px; }

.mapview__map-wrap { position: relative; }
.mapview__map { width: 100%; height: 100%; background: var(--c-paper); }

.map-loading {
  position: absolute; inset: 0;
  display: flex; flex-direction: column; align-items: center; justify-content: center;
  gap: var(--s-4); background: rgba(250,247,242,0.92);
  color: var(--c-text-muted);
}
.map-loading__spinner {
  width: 32px; height: 32px;
  border: 1.5px solid var(--c-border-strong); border-top-color: var(--c-ink);
  border-radius: 50%; animation: spin 1s linear infinite;
}
@keyframes spin { to { transform: rotate(360deg); } }

@media (max-width: 1000px) {
  .mapview { grid-template-columns: 1fr; grid-template-rows: 50% 50%; }
  .mapview__side { border-right: none; border-bottom: 1px solid var(--c-border); }
}
</style>
