<script setup lang="ts">
import { IonPage, IonContent } from '@ionic/vue';
import { onMounted, ref, computed } from 'vue';
import KioskHeader from '../components/KioskHeader.vue';
import { useTenantStore } from '../stores/tenant';
import { api } from '../api';
import { useI18n } from 'vue-i18n';
import type { MenuItem, OrderCategory } from '@concierge/types';

const i18n = useI18n();
const tenantStore = useTenantStore();
const items = ref<MenuItem[]>([]);
const loading = ref(true);
const cart = ref<Record<string, number>>({});
const room = ref('');
const submitting = ref(false);
const sent = ref(false);
const activeCategory = ref<OrderCategory | 'all'>('all');

const FOOD_IMAGES: Record<string, string> = {
  'salade': 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=400&q=80',
  'burger': 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=400&q=80',
  'fromage': 'https://images.unsplash.com/photo-1452195100486-9cc805987862?w=400&q=80',
  'risotto': 'https://images.unsplash.com/photo-1476124369491-e7addf5db371?w=400&q=80',
  'café': 'https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?w=400&q=80',
  'champagne': 'https://images.unsplash.com/photo-1547595628-c61a29f496f0?w=400&q=80',
  'eau': 'https://images.unsplash.com/photo-1550948742-7d6816df1d31?w=400&q=80',
  'massage': 'https://images.unsplash.com/photo-1544161515-4ab6ce6db874?w=400&q=80',
  'visage': 'https://images.unsplash.com/photo-1570172619644-dfd03ed5d881?w=400&q=80',
  'taxi': 'https://images.unsplash.com/photo-1538108149393-fbbd81895907?w=400&q=80',
};

const CAT_INFO: Record<string, { icon: string; label: string }> = {
  food: { icon: '🍽️', label: 'food' },
  drink: { icon: '🥂', label: 'drink' },
  spa: { icon: '🧖', label: 'spa' },
  taxi: { icon: '🚕', label: 'taxi' },
  wakeup: { icon: '⏰', label: 'wakeup' },
  housekeeping: { icon: '🛏️', label: 'housekeeping' },
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

const cartTotal = computed(() =>
  cartLines.value.reduce((s, l) => s + l.item.price * l.qty, 0),
);

const cartCount = computed(() =>
  Object.values(cart.value).reduce((s, q) => s + q, 0),
);

function imageFor(it: MenuItem) {
  const fr = ((it.name as any).fr || '').toLowerCase();
  for (const key of Object.keys(FOOD_IMAGES)) {
    if (fr.includes(key)) return FOOD_IMAGES[key];
  }
  return 'https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=400&q=80';
}

function itemName(it: MenuItem) {
  return (it.name as any)[i18n.locale.value] || (it.name as any).fr || Object.values(it.name)[0];
}

function add(it: MenuItem) {
  cart.value = { ...cart.value, [it.id]: (cart.value[it.id] ?? 0) + 1 };
}
function remove(it: MenuItem) {
  if (!cart.value[it.id]) return;
  const c = { ...cart.value };
  c[it.id]--;
  if (c[it.id] === 0) delete c[it.id];
  cart.value = c;
}

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
      tenantId: tenantStore.tenant.id,
      room: room.value,
      items: Object.entries(cart.value).map(([menuItemId, quantity]) => ({ menuItemId, quantity })),
      source: 'kiosk',
      locale: i18n.locale.value,
    });
    sent.value = true;
    cart.value = {};
  } catch (e) {
    console.error(e);
    alert('Erreur lors de l\'envoi');
  } finally {
    submitting.value = false;
  }
}

function reset() {
  sent.value = false;
  room.value = '';
}
</script>

<template>
  <ion-page>
    <KioskHeader :title="$t('menu.title')" />
    <ion-content :fullscreen="true">
      <div class="menu" v-if="!sent">
        <div class="menu__main">
          <!-- Category tabs -->
          <div class="cat-tabs">
            <button class="cat-tab" :class="{ active: activeCategory === 'all' }" @click="activeCategory = 'all'">
              <span>🌟</span>
              <span>Tout</span>
            </button>
            <button
              v-for="cat in categories"
              :key="cat"
              class="cat-tab"
              :class="{ active: activeCategory === cat }"
              @click="activeCategory = cat as any"
            >
              <span>{{ CAT_INFO[cat]?.icon || '·' }}</span>
              <span>{{ $t(`menu.categories.${cat}`) || cat }}</span>
            </button>
          </div>

          <!-- Items grid -->
          <div class="items-grid">
            <article v-if="loading" class="item-card item-card--skeleton" v-for="n in 6" :key="n">
              <div class="skeleton" style="aspect-ratio: 4/3; border-radius: var(--r-md);"></div>
              <div class="skeleton" style="height: 24px; margin-top: var(--s-3); width: 70%;"></div>
              <div class="skeleton" style="height: 32px; margin-top: var(--s-2); width: 40%;"></div>
            </article>
            <article v-for="it in filteredItems" :key="it.id" class="item-card">
              <div class="item-card__image">
                <img :src="imageFor(it)" :alt="itemName(it)" loading="lazy" />
                <span class="item-card__badge">{{ CAT_INFO[it.category]?.icon || '·' }}</span>
              </div>
              <div class="item-card__body">
                <h4 class="item-card__title">{{ itemName(it) }}</h4>
                <div class="item-card__bottom">
                  <span class="item-card__price">
                    {{ it.price > 0 ? `${it.price.toFixed(2)} €` : 'Gratuit' }}
                  </span>
                  <div class="qty-control" v-if="cart[it.id]">
                    <button class="qty-btn" @click="remove(it)">−</button>
                    <span class="qty-num">{{ cart[it.id] }}</span>
                    <button class="qty-btn" @click="add(it)">+</button>
                  </div>
                  <button v-else class="add-btn" @click="add(it)">
                    <span>+</span> Ajouter
                  </button>
                </div>
              </div>
            </article>
          </div>
        </div>

        <!-- Cart sidebar -->
        <aside class="cart">
          <header class="cart__head">
            <h3 class="font-display">{{ $t('menu.orderLabel') }}</h3>
            <span class="cart__count">{{ cartCount }}</span>
          </header>

          <div class="cart__lines" v-if="cartLines.length">
            <div v-for="line in cartLines" :key="line.item.id" class="cart-line">
              <span class="cart-line__qty">{{ line.qty }}×</span>
              <span class="cart-line__name">{{ itemName(line.item) }}</span>
              <span class="cart-line__price">
                {{ (line.item.price * line.qty).toFixed(2) }} €
              </span>
            </div>
          </div>
          <div v-else class="cart__empty">
            <span>🛒</span>
            <p>{{ $t('menu.empty') }}</p>
          </div>

          <div class="cart__total" v-if="cartLines.length">
            <span>{{ $t('menu.total') }}</span>
            <span class="cart__total-amount">{{ cartTotal.toFixed(2) }} €</span>
          </div>

          <div class="cart__form">
            <label class="cart__label">{{ $t('menu.roomNumber') }}</label>
            <input
              v-model="room"
              type="tel"
              inputmode="numeric"
              placeholder="ex: 204"
              class="cart__input"
            />
            <button
              class="cart__submit"
              :disabled="!cartLines.length || !room || submitting"
              @click="submit"
            >
              <span v-if="!submitting">{{ $t('menu.submit') }} →</span>
              <span v-else>{{ $t('menu.submitting') }}</span>
            </button>
          </div>
        </aside>
      </div>

      <!-- Success state -->
      <div v-else class="success scale-in">
        <div class="success__icon">
          <svg viewBox="0 0 52 52" width="80" height="80">
            <circle cx="26" cy="26" r="24" fill="none" stroke="white" stroke-width="2"/>
            <path d="M14 27 L22 35 L38 18" fill="none" stroke="white" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/>
          </svg>
        </div>
        <h2 class="success__title font-display">{{ $t('menu.success') }}</h2>
        <p class="success__desc">{{ $t('menu.successDesc') }}</p>
        <button class="success__cta" @click="reset">{{ $t('menu.newOrder') }}</button>
      </div>
    </ion-content>
  </ion-page>
</template>

<style scoped>
.menu {
  display: grid; grid-template-columns: 1fr 400px;
  height: calc(100vh - 80px);
  background: var(--c-bg);
}

.menu__main { overflow-y: auto; padding: var(--s-6) var(--s-8); }

.cat-tabs {
  display: flex; gap: var(--s-2); flex-wrap: wrap;
  margin-bottom: var(--s-6);
  padding: 6px; background: var(--c-bg-card);
  border-radius: var(--r-lg); border: 1px solid var(--c-border);
  width: fit-content; box-shadow: var(--sh-sm);
}
.cat-tab {
  display: inline-flex; align-items: center; gap: var(--s-2);
  padding: var(--s-3) var(--s-5);
  border: none; background: transparent;
  border-radius: var(--r-md);
  font-size: 16px; font-weight: 600; color: var(--c-text-muted);
  transition: all var(--dur-fast);
}
.cat-tab.active { background: var(--c-primary); color: white; box-shadow: var(--sh-sm); }
.cat-tab span:first-child { font-size: 20px; }

.items-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(260px, 1fr));
  gap: var(--s-5);
}

.item-card {
  background: var(--c-bg-card);
  border: 1px solid var(--c-border);
  border-radius: var(--r-lg);
  overflow: hidden;
  display: flex; flex-direction: column;
  transition: all var(--dur-base);
  box-shadow: var(--sh-xs);
}
.item-card:hover { transform: translateY(-2px); box-shadow: var(--sh-md); }

.item-card__image {
  position: relative; aspect-ratio: 4 / 3;
  overflow: hidden; background: var(--c-bg-soft);
}
.item-card__image img { width: 100%; height: 100%; object-fit: cover; }
.item-card__badge {
  position: absolute; top: var(--s-3); left: var(--s-3);
  background: rgba(255,255,255,0.95); backdrop-filter: blur(8px);
  width: 38px; height: 38px;
  display: grid; place-items: center;
  border-radius: var(--r-sm);
  font-size: 18px;
}

.item-card__body { padding: var(--s-4) var(--s-5) var(--s-5); flex: 1; display: flex; flex-direction: column; gap: var(--s-3); }
.item-card__title { font-size: 17px; font-weight: 600; margin: 0; color: var(--c-text); line-height: 1.3; }

.item-card__bottom { display: flex; justify-content: space-between; align-items: center; margin-top: auto; }
.item-card__price { font-family: var(--c-font-display); font-size: 22px; font-weight: 700; color: var(--c-primary); }

.add-btn {
  display: inline-flex; align-items: center; gap: 4px;
  padding: var(--s-2) var(--s-4); min-height: 40px;
  background: var(--c-primary); color: white; border: none;
  border-radius: var(--r-md);
  font-size: 14px; font-weight: 700;
  transition: all var(--dur-fast);
}
.add-btn:active { transform: scale(0.96); }
.add-btn span:first-child { font-size: 18px; }

.qty-control {
  display: flex; align-items: center; gap: var(--s-2);
  background: var(--c-bg-soft); border-radius: var(--r-md);
  padding: 4px;
}
.qty-btn {
  width: 36px; height: 36px;
  border: none; background: var(--c-bg-card);
  border-radius: var(--r-sm);
  font-size: 22px; font-weight: 700; color: var(--c-primary);
  box-shadow: var(--sh-xs);
}
.qty-num { font-weight: 700; min-width: 24px; text-align: center; font-size: 16px; }

.cart {
  background: var(--c-bg-card);
  border-left: 1px solid var(--c-border);
  display: flex; flex-direction: column;
}
.cart__head {
  padding: var(--s-6); border-bottom: 1px solid var(--c-border);
  display: flex; justify-content: space-between; align-items: center;
}
.cart__head h3 { margin: 0; font-size: 22px; }
.cart__count {
  background: var(--c-primary); color: white;
  width: 36px; height: 36px;
  display: grid; place-items: center;
  border-radius: var(--r-full);
  font-weight: 700;
}

.cart__lines { flex: 1; overflow-y: auto; padding: var(--s-3) var(--s-4); display: flex; flex-direction: column; gap: 6px; }
.cart-line {
  display: grid; grid-template-columns: auto 1fr auto;
  gap: var(--s-3); align-items: center;
  padding: var(--s-2) var(--s-3);
  border-radius: var(--r-sm);
}
.cart-line__qty { color: var(--c-primary); font-weight: 700; font-size: 14px; }
.cart-line__name { font-size: 14px; color: var(--c-text); }
.cart-line__price { font-weight: 700; color: var(--c-text); font-size: 15px; }

.cart__empty {
  flex: 1;
  display: flex; flex-direction: column; align-items: center; justify-content: center;
  gap: var(--s-3); color: var(--c-text-soft);
  padding: var(--s-8);
  text-align: center;
}
.cart__empty span:first-child { font-size: 64px; opacity: 0.5; }
.cart__empty p { margin: 0; font-size: 14px; max-width: 240px; }

.cart__total {
  display: flex; justify-content: space-between; align-items: baseline;
  padding: var(--s-5) var(--s-6);
  border-top: 1px solid var(--c-border);
  font-weight: 600;
  background: var(--c-bg-soft);
}
.cart__total-amount {
  font-family: var(--c-font-display); font-size: 32px;
  font-weight: 700; color: var(--c-primary);
}

.cart__form { padding: var(--s-5) var(--s-6) var(--s-6); display: flex; flex-direction: column; gap: var(--s-3); }
.cart__label { font-size: 13px; font-weight: 600; color: var(--c-text-muted); text-transform: uppercase; letter-spacing: 0.05em; }
.cart__input {
  padding: var(--s-4); font-size: 18px; font-weight: 600;
  border: 2px solid var(--c-border); border-radius: var(--r-md);
  background: var(--c-bg-card); color: var(--c-text);
  text-align: center; min-height: 56px;
  transition: border-color var(--dur-fast);
}
.cart__input:focus { outline: none; border-color: var(--c-primary); }
.cart__submit {
  margin-top: var(--s-2);
  padding: var(--s-4); font-size: 18px; font-weight: 700;
  background: var(--c-primary); color: white;
  border: none; border-radius: var(--r-md);
  min-height: 60px;
  transition: all var(--dur-fast);
}
.cart__submit:disabled { opacity: 0.4; }
.cart__submit:not(:disabled):active { transform: scale(0.98); }

/* Success state */
.success {
  min-height: calc(100vh - 80px);
  display: flex; flex-direction: column; align-items: center; justify-content: center;
  text-align: center; padding: var(--s-12);
  background: linear-gradient(135deg, var(--c-primary) 0%, var(--c-primary-800) 100%);
  color: white;
}
.success__icon {
  width: 140px; height: 140px;
  background: rgba(255,255,255,0.15);
  border: 2px solid rgba(255,255,255,0.3);
  border-radius: 50%;
  display: grid; place-items: center;
  margin-bottom: var(--s-8);
  animation: scaleIn 0.6s var(--ease-spring);
}
.success__title { font-size: clamp(36px, 5vw, 56px); margin: 0 0 var(--s-4); }
.success__desc { font-size: 20px; opacity: 0.9; max-width: 480px; margin: 0 0 var(--s-12); }
.success__cta {
  padding: var(--s-4) var(--s-10); font-size: 18px; font-weight: 700;
  background: white; color: var(--c-primary);
  border: none; border-radius: var(--r-md);
  min-height: 60px;
}

@media (max-width: 900px) {
  .menu { grid-template-columns: 1fr; grid-template-rows: 1fr auto; }
  .cart { border-left: none; border-top: 1px solid var(--c-border); }
}
</style>
