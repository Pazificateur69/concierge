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

// === V4 polish: walking distance + walk time + open in maps ===
function haversineMeters(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371000;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a = Math.sin(dLat / 2) ** 2 + Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function distanceFromHotel(p: Poi): number {
  const lat = tenantStore.tenant?.contact?.lat ?? 45.7578;
  const lng = tenantStore.tenant?.contact?.lng ?? 4.832;
  return Math.round(haversineMeters(lat, lng, p.lat, p.lng));
}

function walkMinutes(p: Poi): number {
  const meters = distanceFromHotel(p);
  // Average walking pace 80 m/min in city
  return Math.max(1, Math.round(meters / 80));
}

function transportMode(p: Poi): { label: string; icon: string } {
  const m = distanceFromHotel(p);
  if (m < 800) return { label: 'À pied', icon: 'walk' };
  if (m < 3000) return { label: 'Métro / Vélo', icon: 'bike' };
  return { label: 'Taxi recommandé', icon: 'car' };
}

function openInMaps(p: Poi) {
  const url = `https://www.openstreetmap.org/?mlat=${p.lat}&mlon=${p.lng}#map=18/${p.lat}/${p.lng}`;
  window.open(url, '_blank');
}

function callPoi(p: Poi) {
  if ((p as any).phone) window.location.href = `tel:${(p as any).phone}`;
}

function dirToHotel(p: Poi): string {
  const lat = tenantStore.tenant?.contact?.lat ?? 45.7578;
  const lng = tenantStore.tenant?.contact?.lng ?? 4.832;
  const dy = p.lat - lat;
  const dx = p.lng - lng;
  const angle = (Math.atan2(dy, dx) * 180) / Math.PI;
  const compass = ['Est', 'Nord-Est', 'Nord', 'Nord-Ouest', 'Ouest', 'Sud-Ouest', 'Sud', 'Sud-Est'];
  const idx = Math.round(((angle + 360) % 360) / 45) % 8;
  return compass[idx];
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

          <!-- POI Detail Panel — overlays the map when a POI is selected -->
          <transition name="poi-detail">
            <div v-if="selected" class="poi-detail">
              <button class="poi-detail__close" @click="selected = null" aria-label="Fermer">×</button>
              <div class="poi-detail__image" :style="{ backgroundImage: `url(${poiPhoto(selected)})` }">
                <div class="poi-detail__overlay"></div>
                <div class="poi-detail__header">
                  <span class="eyebrow poi-detail__cat">{{ CAT_LABELS[selected.category] }}</span>
                  <h3 class="serif poi-detail__name">{{ poiName(selected) }}</h3>
                </div>
              </div>
              <div class="poi-detail__body">
                <div class="poi-detail__metrics">
                  <div class="metric">
                    <span class="eyebrow">Distance</span>
                    <span class="metric__value serif">{{ distanceFromHotel(selected) }}<span class="metric__unit">m</span></span>
                  </div>
                  <div class="metric">
                    <span class="eyebrow">À pied</span>
                    <span class="metric__value serif">{{ walkMinutes(selected) }}<span class="metric__unit">min</span></span>
                  </div>
                  <div class="metric">
                    <span class="eyebrow">Direction</span>
                    <span class="metric__value serif metric__value--small">{{ dirToHotel(selected) }}</span>
                  </div>
                  <div class="metric">
                    <span class="eyebrow">Transport</span>
                    <span class="metric__value serif metric__value--small">{{ transportMode(selected).label }}</span>
                  </div>
                </div>

                <div class="poi-detail__info" v-if="selected.hours || (selected as any).phone || selected.rating">
                  <div v-if="selected.rating" class="poi-detail__row">
                    <span class="eyebrow">Note</span>
                    <span class="poi-detail__row-val">★ {{ selected.rating.toFixed(1) }}</span>
                  </div>
                  <div v-if="selected.hours" class="poi-detail__row">
                    <span class="eyebrow">Horaires</span>
                    <span class="poi-detail__row-val">{{ selected.hours }}</span>
                  </div>
                  <div v-if="(selected as any).phone" class="poi-detail__row">
                    <span class="eyebrow">Téléphone</span>
                    <a :href="`tel:${(selected as any).phone}`" class="poi-detail__row-val poi-detail__link">{{ (selected as any).phone }}</a>
                  </div>
                </div>

                <p v-if="(selected.description as any)?.fr || (selected.description as any)?.en" class="poi-detail__desc">
                  {{ (selected.description as any)[i18n.locale.value] || (selected.description as any).fr || Object.values(selected.description as any)[0] }}
                </p>

                <div class="poi-detail__actions">
                  <button class="poi-detail__btn poi-detail__btn--primary" @click="openInMaps(selected)">
                    Itinéraire <Icon name="arrow-right" :size="13" />
                  </button>
                  <button v-if="(selected as any).phone" class="poi-detail__btn" @click="callPoi(selected)">
                    Appeler
                  </button>
                </div>
              </div>
            </div>
          </transition>
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

/* POI DETAIL PANEL — overlays right side of the map */
.poi-detail {
  position: absolute; top: 16px; right: 16px;
  width: 380px; max-width: calc(100% - 32px); max-height: calc(100% - 32px);
  background: var(--c-bg-card);
  border: 1px solid var(--c-border);
  box-shadow: 0 24px 64px rgba(20,32,46,0.18);
  z-index: 500;
  display: flex; flex-direction: column;
  overflow: hidden;
}
.poi-detail__close {
  position: absolute; top: 14px; right: 14px;
  width: 36px; height: 36px;
  background: rgba(245,240,232,0.95); color: var(--c-ink);
  border: none; font-size: 22px; line-height: 1;
  cursor: pointer; display: grid; place-items: center;
  z-index: 2;
}
.poi-detail__close:hover { background: white; }

.poi-detail__image {
  position: relative;
  height: 200px;
  background-size: cover; background-position: center;
}
.poi-detail__overlay {
  position: absolute; inset: 0;
  background: linear-gradient(180deg, rgba(20,32,46,0) 30%, rgba(20,32,46,0.85) 100%);
}
.poi-detail__header {
  position: absolute; bottom: 16px; left: 18px; right: 18px;
  color: white;
}
.poi-detail__cat { color: var(--c-accent-soft); }
.poi-detail__name {
  font-size: 24px; line-height: 1.15;
  margin: 4px 0 0; font-weight: 500;
  letter-spacing: -0.01em;
}

.poi-detail__body {
  padding: 18px 20px 20px;
  overflow-y: auto;
  display: flex; flex-direction: column; gap: 14px;
}

.poi-detail__metrics {
  display: grid; grid-template-columns: 1fr 1fr; gap: 0;
  border: 1px solid var(--c-border);
}
.metric {
  padding: 10px 14px;
  border-right: 1px solid var(--c-border);
  border-bottom: 1px solid var(--c-border);
  display: flex; flex-direction: column; gap: 2px;
}
.metric:nth-child(2n) { border-right: none; }
.metric:nth-last-child(-n+2) { border-bottom: none; }
.metric__value {
  font-size: 22px; line-height: 1; color: var(--c-ink);
  font-feature-settings: 'tnum'; letter-spacing: -0.01em;
}
.metric__value--small { font-size: 16px; font-style: italic; }
.metric__unit { font-size: 12px; opacity: 0.6; margin-left: 1px; font-family: 'Cormorant Garamond', serif; }

.poi-detail__info {
  display: flex; flex-direction: column; gap: 6px;
  padding: 12px 0;
  border-top: 1px solid var(--c-border);
}
.poi-detail__row {
  display: flex; justify-content: space-between; align-items: baseline;
  font-size: 13px;
  padding: 4px 0;
}
.poi-detail__row .eyebrow { color: var(--c-text-muted); }
.poi-detail__row-val { color: var(--c-ink); font-family: 'Cormorant Garamond', serif; font-size: 16px; }
.poi-detail__link { text-decoration: none; }
.poi-detail__link:hover { color: var(--c-accent-deep); }

.poi-detail__desc {
  font-size: 13px; line-height: 1.55;
  color: var(--c-text-muted);
  margin: 0; padding-top: 4px;
  font-style: italic;
}

.poi-detail__actions {
  display: flex; gap: 8px; margin-top: 4px;
}
.poi-detail__btn {
  flex: 1; padding: 13px 16px;
  background: var(--c-bg-card);
  border: 1px solid var(--c-border-strong);
  font-family: inherit; font-size: 11px; font-weight: 600;
  letter-spacing: 0.14em; text-transform: uppercase;
  color: var(--c-ink); cursor: pointer;
  display: inline-flex; align-items: center; justify-content: center; gap: 8px;
  transition: all 0.2s;
}
.poi-detail__btn:hover { background: var(--c-paper); }
.poi-detail__btn--primary {
  background: var(--c-ink); color: white; border-color: var(--c-ink);
}
.poi-detail__btn--primary:hover {
  background: var(--c-accent); border-color: var(--c-accent);
}

.poi-detail-enter-active, .poi-detail-leave-active {
  transition: all 0.3s cubic-bezier(0.32, 0.72, 0, 1);
}
.poi-detail-enter-from, .poi-detail-leave-to {
  opacity: 0; transform: translateX(20px);
}

@media (max-width: 1000px) {
  .mapview { grid-template-columns: 1fr; grid-template-rows: 50% 50%; }
  .mapview__side { border-right: none; border-bottom: 1px solid var(--c-border); }
}
</style>
