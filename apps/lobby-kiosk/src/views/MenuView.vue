<script setup lang="ts">
import { IonPage, IonContent } from '@ionic/vue';
import { onMounted, ref, computed } from 'vue';
import KioskHeader from '../components/KioskHeader.vue';
import Icon from '../components/Icon.vue';
import { useTenantStore } from '../stores/tenant';
import { useCartStore } from '../stores/cart';
import { api } from '../api';
import { useI18n } from 'vue-i18n';
import { storeToRefs } from 'pinia';
import type { MenuItem, OrderCategory } from '@concierge/types';

const i18n = useI18n();
const tenantStore = useTenantStore();
const cartStore = useCartStore();
const { items: cart, room } = storeToRefs(cartStore);
const items = ref<MenuItem[]>([]);
const loading = ref(true);
const submitting = ref(false);
const sent = ref(false);
const activeCategory = ref<OrderCategory | 'all'>('all');

const FOOD_IMAGES: Record<string, string> = {
  'salade': 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=900&q=80',
  'burger': 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=900&q=80',
  'fromage': 'https://images.unsplash.com/photo-1452195100486-9cc805987862?w=900&q=80',
  'risotto': 'https://images.unsplash.com/photo-1476124369491-e7addf5db371?w=900&q=80',
  'café': 'https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?w=900&q=80',
  'champagne': 'https://images.unsplash.com/photo-1547595628-c61a29f496f0?w=900&q=80',
  'eau': 'https://images.unsplash.com/photo-1550948742-7d6816df1d31?w=900&q=80',
  'massage': 'https://images.unsplash.com/photo-1544161515-4ab6ce6db874?w=900&q=80',
  'visage': 'https://images.unsplash.com/photo-1570172619644-dfd03ed5d881?w=900&q=80',
  'taxi': 'https://images.unsplash.com/photo-1538108149393-fbbd81895907?w=900&q=80',
};

const CAT_LABELS: Record<string, string> = {
  food: 'Restauration', drink: 'Bar', spa: 'Spa', taxi: 'Voiturier', wakeup: 'Réveil', housekeeping: 'Service',
};

const categories = computed(() => {
  const cats = new Set<string>();
  for (const it of items.value) cats.add(it.category);
  return Array.from(cats);
});

const filteredItems = computed(() => {
  if (activeCategory.value === 'all') return items.value;
  return items.value.filter((it) => it.category === activeCategory.value);
});

const cartLines = computed(() =>
  Object.entries(cart.value).map(([id, qty]) => {
    const it = items.value.find((m) => m.id === id);
    return { item: it!, qty };
  }).filter((l) => l.item),
);

const cartTotal = computed(() => cartLines.value.reduce((s, l) => s + l.item.price * l.qty, 0));
const cartCount = computed(() => Object.values(cart.value).reduce((s, q) => s + q, 0));

function imageFor(it: MenuItem) {
  const fr = ((it.name as any).fr || '').toLowerCase();
  for (const key of Object.keys(FOOD_IMAGES)) {
    if (fr.includes(key)) return FOOD_IMAGES[key];
  }
  return 'https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=900&q=80';
}

function itemName(it: MenuItem) {
  return (it.name as any)[i18n.locale.value] || (it.name as any).fr || Object.values(it.name)[0];
}

function add(it: MenuItem) { cartStore.add(it.id); }
function remove(it: MenuItem) { cartStore.remove(it.id); }

onMounted(async () => {
  if (!tenantStore.tenant) return;
  try {
    const { data } = await api.get<MenuItem[]>(`/orders/menu?tenantId=${tenantStore.tenant.id}`);
    items.value = data;
  } catch (e) {
    console.error(e);
  } finally {
    loading.value = false;
  }
});

async function submit() {
  if (!tenantStore.tenant || !room.value) return;
  submitting.value = true;
  try {
    await api.post('/orders', {
      tenantId: tenantStore.tenant.id, room: room.value,
      items: Object.entries(cart.value).map(([menuItemId, quantity]) => ({ menuItemId, quantity })),
      source: 'kiosk', locale: i18n.locale.value,
    });
    sent.value = true; cartStore.clear();
  } catch (e) { console.error(e); alert('Une erreur est survenue.'); }
  finally { submitting.value = false; }
}

function reset() { sent.value = false; }

// === V4 polish: chef's signature, dietary filters, allergen tags, popularity ===
type Diet = 'all' | 'vegan' | 'vegetarian' | 'gluten-free' | 'pork-free';
const activeDiet = ref<Diet>('all');
const diets: { key: Diet; label: string; icon: string }[] = [
  { key: 'all',        label: 'Tout',           icon: '◉' },
  { key: 'vegetarian', label: 'Végétarien',     icon: 'V' },
  { key: 'vegan',      label: 'Végan',          icon: 'Vg' },
  { key: 'gluten-free',label: 'Sans gluten',    icon: 'GF' },
  { key: 'pork-free',  label: 'Sans porc',      icon: 'P' },
];

// Heuristic detection by item name (since seed doesn't always tag dietary)
function dietBadges(it: MenuItem): string[] {
  const name = ((it.name as any).fr || '').toLowerCase();
  const desc = ((it.description as any)?.fr || '').toLowerCase();
  const t = name + ' ' + desc;
  const out: string[] = [];
  if (/(salade|légume|tomate|fromage|risotto)/.test(t) && !/(boeuf|porc|saumon|poulet|jambon)/.test(t)) out.push('vegetarian');
  if (/(salade verte|légumes|fruits|smoothie)/.test(t) && !/(fromage|crème|beurre|œuf|miel)/.test(t)) out.push('vegan');
  if (/(salade|smoothie|fruits|saumon grillé|risotto sans pâte)/.test(t)) out.push('gluten-free');
  if (!/(porc|jambon|saucisson|charcuterie|lard)/.test(t)) out.push('pork-free');
  return out;
}

function allergens(it: MenuItem): string[] {
  return Array.isArray((it as any).allergens) ? (it as any).allergens : [];
}

const popularItemIds = computed(() => {
  // Top 3 most expensive used as proxy "signature"
  return [...items.value].sort((a, b) => b.price - a.price).slice(0, 3).map((m) => m.id);
});

const chefSignature = computed(() => {
  // Pick the most expensive food item as the "chef's signature"
  const food = items.value.filter((m) => m.category === 'food');
  if (!food.length) return null;
  return [...food].sort((a, b) => b.price - a.price)[0];
});

const filteredItemsV4 = computed(() => {
  let list = activeCategory.value === 'all' ? items.value : items.value.filter((it) => it.category === activeCategory.value);
  if (activeDiet.value !== 'all') {
    list = list.filter((it) => dietBadges(it).includes(activeDiet.value));
  }
  return list;
});
</script>

<template>
  <ion-page>
    <KioskHeader :title="$t('menu.title')" />
    <ion-content :fullscreen="true">
      <div class="menu" v-if="!sent">
        <div class="menu__main">
          <header class="menu__hero">
            <span class="eyebrow">La Carte du Salon</span>
            <h1 class="serif">
              <em>Goûts d'hier,</em> service d'aujourd'hui
            </h1>
            <p>Sélectionnez vos envies, livré en chambre sous 15 à 20 minutes.</p>
          </header>

          <!-- CHEF'S SIGNATURE -->
          <article v-if="chefSignature" class="signature fade-up" @click="add(chefSignature)">
            <div class="signature__image">
              <img :src="imageFor(chefSignature)" :alt="itemName(chefSignature)" loading="lazy" />
              <span class="signature__ribbon eyebrow">Signature du chef</span>
            </div>
            <div class="signature__body">
              <span class="eyebrow signature__eye">À ne pas manquer</span>
              <h2 class="signature__title serif italic">« {{ itemName(chefSignature) }} »</h2>
              <p class="signature__desc">Notre plat phare, sélectionné chaque saison par le chef. Servi avec soin, raconté avec passion.</p>
              <div class="signature__meta">
                <span class="signature__price serif">{{ chefSignature.price.toFixed(2) }} €</span>
                <span class="signature__sep">·</span>
                <span class="signature__pax">{{ chefSignature.preparationMinutes || 18 }} min</span>
                <span class="signature__sep">·</span>
                <span class="signature__star">★ 4,9</span>
                <button class="signature__cta" @click.stop="add(chefSignature)">Ajouter à la carte →</button>
              </div>
            </div>
          </article>

          <div class="cat-row">
            <button class="cat" :class="{ active: activeCategory === 'all' }" @click="activeCategory = 'all'">
              <span class="cat__label">Tout afficher</span>
            </button>
            <button v-for="cat in categories" :key="cat" class="cat" :class="{ active: activeCategory === cat }" @click="activeCategory = cat as any">
              <span class="cat__label">{{ CAT_LABELS[cat] || cat }}</span>
            </button>
          </div>

          <!-- DIETARY FILTERS -->
          <div class="diet-row">
            <span class="diet-row__label eyebrow">Régime</span>
            <button v-for="d in diets" :key="d.key" class="diet" :class="{ active: activeDiet === d.key }" @click="activeDiet = d.key">
              <span class="diet__icon" v-if="d.icon !== '◉'">{{ d.icon }}</span>
              {{ d.label }}
            </button>
          </div>

          <div class="items-grid">
            <!-- Skeletons while loading -->
            <article v-if="loading" v-for="n in 6" :key="`sk-${n}`" class="item item--skeleton">
              <div class="item__image skeleton-shimmer"></div>
              <div class="item__body">
                <div class="sk-line sk-line--lg"></div>
                <div class="sk-line sk-line--sm"></div>
                <div class="item__bottom">
                  <div class="sk-line sk-line--md"></div>
                  <div class="sk-pill"></div>
                </div>
              </div>
            </article>

            <article v-for="it in filteredItemsV4" :key="it.id" class="item" @click="add(it)" tabindex="0" role="button" :aria-label="`Ajouter ${itemName(it)}`" @keydown.enter.prevent="add(it)" @keydown.space.prevent="add(it)">
              <div class="item__image">
                <img :src="imageFor(it)" :alt="itemName(it)" loading="lazy" />
                <span v-if="popularItemIds.includes(it.id)" class="item__badge item__badge--popular">★ Populaire</span>
              </div>
              <div class="item__body">
                <h4 class="item__title serif">{{ itemName(it) }}</h4>
                <p class="item__cat eyebrow">{{ CAT_LABELS[it.category] || it.category }}</p>
                <div class="item__diets" v-if="dietBadges(it).length">
                  <span v-for="d in dietBadges(it).slice(0, 3)" :key="d" class="item__diet" :title="diets.find(x => x.key === d)?.label">{{ diets.find(x => x.key === d)?.icon }}</span>
                </div>
                <div class="item__bottom">
                  <span class="item__price serif">
                    {{ it.price > 0 ? `${it.price.toFixed(2)} €` : 'Inclus' }}
                  </span>
                  <div class="qty" v-if="cart[it.id]" @click.stop>
                    <button class="qty__btn" @click.stop="remove(it)" aria-label="Retirer"><Icon name="minus" :size="14" /></button>
                    <span class="qty__num">{{ cart[it.id] }}</span>
                    <button class="qty__btn" @click.stop="add(it)" aria-label="Ajouter"><Icon name="plus" :size="14" /></button>
                  </div>
                  <button v-else class="add-btn" @click.stop="add(it)">
                    Ajouter <Icon name="plus" :size="13" />
                  </button>
                </div>
              </div>
            </article>
            <div v-if="!loading && !filteredItemsV4.length" class="empty">Aucun plat ne correspond à ces filtres.</div>
          </div>
        </div>

        <aside class="cart">
          <header class="cart__head">
            <span class="eyebrow">Votre commande</span>
            <span class="cart__count" v-if="cartCount">{{ cartCount }} article{{ cartCount > 1 ? 's' : '' }}</span>
          </header>

          <div class="cart__lines" v-if="cartLines.length">
            <div v-for="line in cartLines" :key="line.item.id" class="cart__line">
              <span class="cart__line-qty">{{ line.qty }}</span>
              <div class="cart__line-body">
                <span class="cart__line-name">{{ itemName(line.item) }}</span>
                <span class="cart__line-unit">{{ line.item.price.toFixed(2) }} € l'unité</span>
              </div>
              <span class="cart__line-total">{{ (line.item.price * line.qty).toFixed(2) }} €</span>
            </div>
          </div>
          <div v-else class="cart__empty">
            <span class="eyebrow">Panier vide</span>
            <p>Ajoutez vos plats à gauche pour commencer.</p>
          </div>

          <div class="cart__total" v-if="cartLines.length">
            <span>Total</span>
            <span class="cart__total-amount serif">{{ cartTotal.toFixed(2) }} €</span>
          </div>

          <div class="cart__form">
            <label class="cart__label">
              <span>Numéro de chambre</span>
              <input v-model="room" type="tel" inputmode="numeric" placeholder="ex. 204" class="cart__input" />
            </label>
            <button class="cart__submit" :disabled="!cartLines.length || !room || submitting" @click="submit">
              <span v-if="!submitting">Confirmer la commande</span>
              <span v-else>Envoi en cours…</span>
              <Icon v-if="!submitting" name="arrow-right" :size="14" />
            </button>
            <p class="cart__notice">Service de chambre disponible 24/24. Livraison sous 15 à 20 min.</p>
          </div>
        </aside>
      </div>

      <div v-else class="success fade-up">
        <span class="eyebrow">Merci</span>
        <h2 class="success__title serif">
          Votre commande<br/>
          a été <em>transmise</em>
        </h2>
        <hr class="success__rule" />
        <p class="success__desc">
          Notre équipe prépare votre demande. Elle vous sera apportée<br/>
          en chambre <strong>{{ room || '204' }}</strong> sous 15 à 20 minutes.
        </p>
        <button class="success__cta" @click="reset">
          Nouvelle commande <Icon name="arrow-right" :size="14" />
        </button>
      </div>
    </ion-content>
  </ion-page>
</template>

<style scoped>
.menu {
  display: grid; grid-template-columns: 1fr 420px;
  height: calc(100vh - 80px);
  background: var(--c-bg);
}

.menu__main { overflow-y: auto; padding: var(--s-10) var(--s-12); }

.menu__hero { margin-bottom: var(--s-10); padding-bottom: var(--s-8); border-bottom: 1px solid var(--c-border); }
.menu__hero h1 { font-size: clamp(36px, 4vw, 56px); line-height: 1.1; margin: var(--s-3) 0 var(--s-3); font-weight: 500; }
.menu__hero h1 em { color: var(--c-accent-deep); font-style: italic; }
.menu__hero p { color: var(--c-text-muted); font-size: 16px; max-width: 520px; line-height: 1.6; margin: 0; }

/* CHEF'S SIGNATURE */
.signature { display: grid; grid-template-columns: 380px 1fr; gap: 0; margin-bottom: var(--s-8); background: var(--c-bg-card); border: 1px solid var(--c-accent); cursor: pointer; transition: all 0.3s; overflow: hidden; }
.signature:hover { transform: translateY(-2px); box-shadow: 0 16px 40px rgba(20,32,46,0.1); }
.signature__image { position: relative; aspect-ratio: 4 / 3; overflow: hidden; }
.signature__image img { width: 100%; height: 100%; object-fit: cover; transition: transform 0.6s var(--ease-spring); }
.signature:hover .signature__image img { transform: scale(1.04); }
.signature__ribbon { position: absolute; top: 16px; left: 16px; padding: 7px 14px; background: var(--c-accent); color: white; letter-spacing: 0.16em; font-size: 10px; }
.signature__body { padding: var(--s-8) var(--s-10); display: flex; flex-direction: column; justify-content: center; gap: var(--s-3); }
.signature__eye { color: var(--c-accent-deep); }
.signature__title { font-size: 36px; line-height: 1.15; margin: 0; color: var(--c-ink); letter-spacing: -0.02em; font-weight: 500; }
.signature__desc { color: var(--c-text-muted); font-size: 15px; line-height: 1.6; margin: 0; max-width: 540px; }
.signature__meta { display: flex; align-items: baseline; gap: 12px; flex-wrap: wrap; padding-top: var(--s-2); border-top: 1px solid var(--c-border); margin-top: 4px; }
.signature__price { font-size: 28px; color: var(--c-ink); letter-spacing: -0.01em; font-feature-settings: 'tnum'; }
.signature__sep { color: var(--c-text-soft); }
.signature__pax { font-size: 13px; color: var(--c-text-muted); }
.signature__star { color: var(--c-accent-deep); font-size: 13px; font-weight: 600; }
.signature__cta { margin-left: auto; padding: 12px 22px; background: var(--c-ink); color: white; border: none; font-size: 11px; font-weight: 600; letter-spacing: 0.16em; text-transform: uppercase; cursor: pointer; transition: all 0.2s; font-family: inherit; }
.signature__cta:hover { background: var(--c-accent); }

/* DIETARY FILTERS */
.diet-row { display: flex; gap: 8px; align-items: center; flex-wrap: wrap; padding: var(--s-3) 0 var(--s-4); border-bottom: 1px dashed var(--c-border); margin-bottom: var(--s-4); }
.diet-row__label { color: var(--c-text-muted); margin-right: 6px; }
.diet { padding: 6px 12px; background: var(--c-bg-card); border: 1px solid var(--c-border); font-family: 'Cormorant Garamond', serif; font-size: 13px; font-style: italic; color: var(--c-text-muted); cursor: pointer; display: inline-flex; align-items: center; gap: 6px; transition: all 0.2s; }
.diet:hover { color: var(--c-ink); border-color: var(--c-border-strong); }
.diet.active { background: var(--c-ink); color: white; border-color: var(--c-ink); }
.diet__icon { font-family: 'JetBrains Mono', monospace; font-size: 10px; padding: 2px 5px; background: var(--c-paper); color: var(--c-ink); font-weight: 600; font-style: normal; }
.diet.active .diet__icon { background: rgba(245,240,232,0.2); color: white; }

/* ITEM BADGES + DIETS */
.item__image { position: relative; }
.item__badge { position: absolute; top: 12px; left: 12px; padding: 4px 10px; font-size: 10px; font-weight: 600; letter-spacing: 0.12em; text-transform: uppercase; }
.item__badge--popular { background: var(--c-accent); color: white; }
.item__diets { display: flex; gap: 4px; padding: 4px 0; }
.item__diet { display: inline-grid; place-items: center; width: 22px; height: 22px; background: var(--c-paper); color: var(--c-accent-deep); font-family: 'JetBrains Mono', monospace; font-size: 9px; font-weight: 600; border: 1px solid var(--c-border); }

.cat-row {
  display: flex; gap: 0;
  margin-bottom: var(--s-8);
  border-bottom: 1px solid var(--c-border);
  overflow-x: auto;
}
.cat {
  padding: var(--s-3) 0; margin-right: var(--s-6);
  background: transparent; border: none;
  border-bottom: 2px solid transparent;
  font-size: 12px; font-weight: 600;
  letter-spacing: 0.12em; text-transform: uppercase;
  color: var(--c-text-muted);
  white-space: nowrap;
  transition: all var(--dur-fast);
}
.cat:hover { color: var(--c-ink); }
.cat.active { color: var(--c-ink); border-bottom-color: var(--c-ink); }

.items-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: var(--s-6);
}

.item {
  background: var(--c-bg-card);
  border: 1px solid var(--c-border);
  display: flex; flex-direction: column;
  transition: all var(--dur-base);
  cursor: pointer;
  user-select: none;
}
.item:hover { border-color: var(--c-ink); transform: translateY(-2px); box-shadow: 0 8px 24px rgba(20,32,46,0.08); }
.item:focus-visible { outline: 2px solid var(--c-accent); outline-offset: 2px; }
.item:active { transform: translateY(0); }

.item__image { aspect-ratio: 4 / 3; overflow: hidden; background: var(--c-paper); }
.item__image img { width: 100%; height: 100%; object-fit: cover; transition: transform var(--dur-slow); }
.item:hover .item__image img { transform: scale(1.05); }

.item__body { padding: var(--s-5) var(--s-5) var(--s-6); flex: 1; display: flex; flex-direction: column; gap: var(--s-2); }
.item__title { font-size: 22px; line-height: 1.15; margin: 0; font-weight: 500; color: var(--c-ink); letter-spacing: -0.01em; }
.item__cat { color: var(--c-text-soft); font-size: 9px; }

.item__bottom { display: flex; justify-content: space-between; align-items: center; margin-top: auto; padding-top: var(--s-3); border-top: 1px solid var(--c-border); }
.item__price { font-size: 20px; font-weight: 500; color: var(--c-ink); letter-spacing: -0.01em; font-feature-settings: 'tnum'; }

.add-btn {
  display: inline-flex; align-items: center; gap: 6px;
  padding: 8px 14px; min-height: 36px;
  background: var(--c-ink); color: white; border: none;
  font-size: 12px; font-weight: 600; letter-spacing: 0.08em; text-transform: uppercase;
  transition: all var(--dur-fast);
}
.add-btn:hover { background: var(--c-accent); }

.qty {
  display: inline-flex; align-items: center;
  border: 1px solid var(--c-border-strong);
}
.qty__btn {
  width: 32px; height: 32px;
  border: none; background: var(--c-bg-card);
  display: grid; place-items: center;
  color: var(--c-ink);
}
.qty__btn:hover { background: var(--c-paper); }
.qty__num { font-weight: 600; min-width: 28px; text-align: center; font-size: 13px; font-feature-settings: 'tnum'; }

/* SKELETONS */
.item--skeleton { pointer-events: none; }
.skeleton-shimmer {
  background: linear-gradient(90deg, var(--c-paper-soft) 0%, var(--c-paper-deep) 50%, var(--c-paper-soft) 100%);
  background-size: 200% 100%;
  animation: shimmer 1.6s linear infinite;
}
.sk-line {
  height: 14px; background: var(--c-paper-soft);
  background: linear-gradient(90deg, var(--c-paper-soft) 0%, var(--c-paper-deep) 50%, var(--c-paper-soft) 100%);
  background-size: 200% 100%;
  animation: shimmer 1.6s linear infinite;
  margin: 8px 0;
}
.sk-line--sm { width: 30%; height: 10px; }
.sk-line--md { width: 40%; }
.sk-line--lg { width: 70%; height: 18px; }
.sk-pill {
  width: 80px; height: 32px; background: var(--c-paper-soft);
  background: linear-gradient(90deg, var(--c-paper-soft) 0%, var(--c-paper-deep) 50%, var(--c-paper-soft) 100%);
  background-size: 200% 100%;
  animation: shimmer 1.6s linear infinite;
}
@keyframes shimmer { 0% { background-position: -200% 0; } 100% { background-position: 200% 0; } }

/* CART SIDE */
.cart { background: var(--c-paper); border-left: 1px solid var(--c-border); display: flex; flex-direction: column; }
.cart__head { padding: var(--s-8) var(--s-6) var(--s-3); display: flex; justify-content: space-between; align-items: baseline; border-bottom: 1px solid var(--c-border); }
.cart__count { font-size: 12px; color: var(--c-text-muted); font-feature-settings: 'tnum'; }

.cart__lines { flex: 1; overflow-y: auto; padding: var(--s-2) 0; }
.cart__line {
  display: grid; grid-template-columns: 32px 1fr auto;
  gap: var(--s-3);
  padding: var(--s-4) var(--s-6);
  border-bottom: 1px solid var(--c-border);
}
.cart__line-qty {
  font-family: var(--c-font-display); font-size: 20px; font-weight: 500;
  color: var(--c-accent-deep); line-height: 1;
}
.cart__line-body { display: flex; flex-direction: column; gap: 2px; min-width: 0; }
.cart__line-name { font-size: 14px; font-weight: 500; color: var(--c-ink); }
.cart__line-unit { font-size: 11px; color: var(--c-text-soft); }
.cart__line-total { font-family: var(--c-font-display); font-size: 16px; font-weight: 500; color: var(--c-ink); font-feature-settings: 'tnum'; }

.cart__empty { flex: 1; padding: var(--s-12) var(--s-6); text-align: center; color: var(--c-text-muted); }
.cart__empty p { margin: var(--s-2) 0 0; font-size: 14px; }

.cart__total { display: flex; justify-content: space-between; align-items: baseline; padding: var(--s-5) var(--s-6); border-top: 1px solid var(--c-border); border-bottom: 1px solid var(--c-border); background: var(--c-bg-card); }
.cart__total > span:first-child { font-size: 12px; letter-spacing: 0.16em; text-transform: uppercase; color: var(--c-text-muted); font-weight: 600; }
.cart__total-amount { font-size: 32px; font-weight: 500; color: var(--c-ink); letter-spacing: -0.02em; }

.cart__form { padding: var(--s-6); display: flex; flex-direction: column; gap: var(--s-4); background: var(--c-bg-card); }
.cart__label { display: flex; flex-direction: column; gap: 6px; }
.cart__label > span { font-size: 11px; letter-spacing: 0.16em; text-transform: uppercase; color: var(--c-text-muted); font-weight: 600; }
.cart__input { padding: var(--s-3) var(--s-4); font-size: 16px; font-feature-settings: 'tnum'; border: 1px solid var(--c-border-strong); background: var(--c-bg-card); transition: border-color var(--dur-fast); }
.cart__input:focus { outline: none; border-color: var(--c-ink); }

.cart__submit {
  display: inline-flex; align-items: center; justify-content: center; gap: var(--s-2);
  padding: var(--s-4); min-height: 56px;
  background: var(--c-ink); color: white; border: none;
  font-size: 13px; font-weight: 600; letter-spacing: 0.16em; text-transform: uppercase;
  transition: all var(--dur-fast);
}
.cart__submit:disabled { opacity: 0.3; cursor: not-allowed; }
.cart__submit:not(:disabled):hover { background: var(--c-accent); }

.cart__notice { font-size: 11px; color: var(--c-text-soft); text-align: center; line-height: 1.5; margin: 0; }

/* SUCCESS */
.success {
  min-height: calc(100vh - 80px);
  display: flex; flex-direction: column; align-items: center; justify-content: center;
  text-align: center; padding: var(--s-12);
  background:
    radial-gradient(ellipse at top, var(--c-paper-soft) 0%, var(--c-paper) 60%),
    var(--c-paper);
}
.success__title {
  font-size: clamp(40px, 6vw, 72px);
  line-height: 1.1; margin: var(--s-3) 0;
  font-weight: 500; color: var(--c-ink);
}
.success__title em { color: var(--c-accent-deep); font-style: italic; }
.success__rule { width: 64px; height: 1px; background: var(--c-accent); border: 0; margin: var(--s-6) auto var(--s-8); }
.success__desc { color: var(--c-text-muted); font-size: 16px; line-height: 1.7; margin: 0 0 var(--s-10); max-width: 520px; }
.success__desc strong { color: var(--c-ink); font-weight: 600; }
.success__cta {
  display: inline-flex; align-items: center; gap: var(--s-2);
  padding: var(--s-4) var(--s-8); min-height: 56px;
  background: var(--c-ink); color: white; border: none;
  font-size: 13px; font-weight: 600; letter-spacing: 0.16em; text-transform: uppercase;
}
.success__cta:hover { background: var(--c-accent); }

.empty { text-align: center; color: var(--c-text-soft); padding: var(--s-12); grid-column: 1 / -1; }

@media (max-width: 1000px) {
  .signature { grid-template-columns: 1fr; }
  .signature__image { aspect-ratio: 16 / 9; }
  .signature__body { padding: var(--s-6); }
  .signature__title { font-size: 28px; }
  .signature__cta { margin-left: 0; }
}

@media (max-width: 1000px) {
  .menu { grid-template-columns: 1fr; grid-template-rows: 1fr auto; }
  .cart { border-left: none; border-top: 1px solid var(--c-border); }
}
</style>
