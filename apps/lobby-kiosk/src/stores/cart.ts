import { defineStore } from 'pinia';
import { computed, ref, watch } from 'vue';

const STORAGE_KEY = 'concierge_cart';

export const useCartStore = defineStore('cart', () => {
  const items = ref<Record<string, number>>(load());
  const room = ref<string>(localStorage.getItem('concierge_cart_room') ?? '');
  const notes = ref<string>('');

  watch(items, (v) => localStorage.setItem(STORAGE_KEY, JSON.stringify(v)), { deep: true });
  watch(room, (v) => localStorage.setItem('concierge_cart_room', v));

  const count = computed(() => Object.values(items.value).reduce((s, q) => s + q, 0));
  const isEmpty = computed(() => count.value === 0);

  function add(id: string) { items.value = { ...items.value, [id]: (items.value[id] ?? 0) + 1 }; }
  function remove(id: string) {
    const c = { ...items.value };
    if (!c[id]) return;
    if (c[id] === 1) delete c[id]; else c[id] = c[id] - 1;
    items.value = c;
  }
  function setQty(id: string, qty: number) {
    const c = { ...items.value };
    if (qty <= 0) delete c[id]; else c[id] = qty;
    items.value = c;
  }
  function clear() { items.value = {}; notes.value = ''; }

  function load(): Record<string, number> {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return {};
      const parsed = JSON.parse(raw);
      return typeof parsed === 'object' && parsed ? parsed : {};
    } catch {
      return {};
    }
  }

  return { items, room, notes, count, isEmpty, add, remove, setQty, clear };
});
