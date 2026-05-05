<script setup lang="ts">
import { IonPage, IonContent } from '@ionic/vue';
import { onMounted, ref, computed } from 'vue';
import KioskHeader from '../components/KioskHeader.vue';
import { useTenantStore } from '../stores/tenant';
import { api } from '../api';
import type { MenuItem, OrderCategory } from '@concierge/types';

const tenantStore = useTenantStore();
const items = ref<MenuItem[]>([]);
const cart = ref<Record<string, number>>({});
const room = ref('');
const submitting = ref(false);
const sent = ref(false);

const grouped = computed(() => {
  const out: Record<string, MenuItem[]> = {};
  for (const it of items.value) {
    if (it.category === 'wakeup' || it.category === 'housekeeping') continue;
    out[it.category] = out[it.category] ?? [];
    out[it.category].push(it);
  }
  return out;
});

const total = computed(() =>
  Object.entries(cart.value).reduce((s, [id, qty]) => {
    const it = items.value.find((m) => m.id === id);
    return s + (it ? it.price * qty : 0);
  }, 0),
);

onMounted(async () => {
  if (!tenantStore.tenant) return;
  try {
    const { data } = await api.get<MenuItem[]>(`/orders/menu?tenantId=${tenantStore.tenant.id}`);
    items.value = data;
  } catch (e) {
    console.error(e);
  }
});

function add(it: MenuItem) {
  cart.value[it.id] = (cart.value[it.id] ?? 0) + 1;
}
function remove(it: MenuItem) {
  if (!cart.value[it.id]) return;
  cart.value[it.id]--;
  if (cart.value[it.id] === 0) delete cart.value[it.id];
}

async function submit() {
  if (!tenantStore.tenant || !room.value) return;
  submitting.value = true;
  try {
    await api.post('/orders', {
      tenantId: tenantStore.tenant.id,
      room: room.value,
      items: Object.entries(cart.value).map(([menuItemId, quantity]) => ({ menuItemId, quantity })),
      source: 'kiosk',
      locale: 'fr',
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
</script>

<template>
  <ion-page>
    <KioskHeader title="Restaurant & Room Service" />
    <ion-content :fullscreen="true">
      <div class="menu" v-if="!sent">
        <div class="menu__items">
          <div v-for="(group, cat) in grouped" :key="cat" class="menu__group">
            <h3>{{ cat }}</h3>
            <div class="menu__cards">
              <div v-for="it in group" :key="it.id" class="menu__card">
                <h4>{{ (it.name as any).fr }}</h4>
                <p class="menu__price">{{ it.price.toFixed(2) }} €</p>
                <div class="menu__qty">
                  <button @click="remove(it)">−</button>
                  <span>{{ cart[it.id] ?? 0 }}</span>
                  <button @click="add(it)">+</button>
                </div>
              </div>
            </div>
          </div>
        </div>

        <aside class="menu__cart">
          <h3>Votre commande</h3>
          <div class="menu__total">{{ total.toFixed(2) }} €</div>
          <input v-model="room" placeholder="Numéro de chambre (ex: 204)" class="menu__room" />
          <button class="menu__submit" :disabled="!Object.keys(cart).length || !room || submitting" @click="submit">
            {{ submitting ? 'Envoi...' : 'Commander' }}
          </button>
        </aside>
      </div>
      <div v-else class="menu__success">
        <span class="menu__success-icon">✓</span>
        <h2>Commande envoyée !</h2>
        <p>Votre commande arrivera en chambre dans 15-20 min.</p>
        <button @click="sent = false">Nouvelle commande</button>
      </div>
    </ion-content>
  </ion-page>
</template>

<style scoped>
.menu { display: grid; grid-template-columns: 1fr 360px; gap: 24px; padding: 24px; height: calc(100vh - 80px); }
.menu__items { overflow-y: auto; padding-right: 12px; }
.menu__group { margin-bottom: 32px; }
.menu__group h3 { font-family: var(--c-font-display); text-transform: capitalize; font-size: 28px; }
.menu__cards { display: grid; grid-template-columns: repeat(2, 1fr); gap: 16px; }
.menu__card { background: white; border-radius: 16px; padding: 20px; box-shadow: 0 2px 8px rgba(0,0,0,0.05); }
.menu__card h4 { margin: 0 0 8px; font-size: 18px; }
.menu__price { font-size: 22px; font-weight: 700; color: var(--c-primary); margin: 0 0 16px; }
.menu__qty { display: flex; align-items: center; gap: 16px; }
.menu__qty button { width: 48px; height: 48px; border-radius: 50%; border: 2px solid var(--c-primary); background: white; color: var(--c-primary); font-size: 24px; cursor: pointer; }
.menu__qty span { flex: 1; text-align: center; font-size: 20px; font-weight: 700; }
.menu__cart { background: white; border-radius: 20px; padding: 24px; height: fit-content; box-shadow: 0 4px 16px rgba(0,0,0,0.05); }
.menu__total { font-size: 36px; font-weight: 700; color: var(--c-primary); margin: 16px 0; }
.menu__room { width: 100%; padding: 16px; font-size: 18px; border-radius: 12px; border: 2px solid rgba(0,0,0,0.1); margin-bottom: 16px; }
.menu__submit { width: 100%; padding: 18px; font-size: 18px; font-weight: 700; background: var(--c-primary); color: white; border: none; border-radius: 12px; cursor: pointer; min-height: 64px; }
.menu__submit:disabled { opacity: 0.4; }
.menu__success { text-align: center; padding: 80px 32px; }
.menu__success-icon { display: inline-block; width: 100px; height: 100px; line-height: 100px; border-radius: 50%; background: #2d7a4b; color: white; font-size: 60px; }
.menu__success h2 { font-family: var(--c-font-display); font-size: 36px; margin: 24px 0 8px; }
</style>
