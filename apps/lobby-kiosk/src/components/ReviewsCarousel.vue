<script setup lang="ts">
import { onMounted, onUnmounted, ref } from 'vue';

const reviews = [
  { name: 'Marie L.', avatar: 'https://i.pravatar.cc/100?img=47', stars: 5, text: 'Service impeccable, équipe aux petits soins. Spa exceptionnel.', from: '🇫🇷 France' },
  { name: 'James R.', avatar: 'https://i.pravatar.cc/100?img=12', stars: 5, text: 'Best stay in Lyon. The concierge anticipated every need.', from: '🇬🇧 UK' },
  { name: 'Yuki T.', avatar: 'https://i.pravatar.cc/100?img=23', stars: 4, text: '素晴らしい体験でした。ロビーが美しい。', from: '🇯🇵 Japan' },
  { name: 'Stefan K.', avatar: 'https://i.pravatar.cc/100?img=33', stars: 5, text: 'Perfekter Service, traumhaftes Ambiente. Sehr empfehlenswert.', from: '🇩🇪 Germany' },
  { name: 'Carla M.', avatar: 'https://i.pravatar.cc/100?img=49', stars: 5, text: 'Atmósfera única, atención al detalle remarkable.', from: '🇪🇸 Spain' },
];

const current = ref(0);
let timer: number | null = null;

onMounted(() => {
  timer = window.setInterval(() => (current.value = (current.value + 1) % reviews.length), 5000);
});
onUnmounted(() => { if (timer) clearInterval(timer); });
</script>

<template>
  <div class="rev">
    <div class="rev__head">
      <div class="rev__rating">
        <span class="rev__num">4.9</span>
        <div>
          <div class="rev__stars">★★★★★</div>
          <div class="rev__count">487 avis vérifiés</div>
        </div>
      </div>
      <div class="rev__platforms">
        <span class="rev__plat">🅖 Google</span>
        <span class="rev__plat">▲ TripAdvisor</span>
        <span class="rev__plat">B Booking</span>
      </div>
    </div>

    <transition name="rev-fade" mode="out-in">
      <div class="rev__card" :key="current">
        <div class="rev__quote">"</div>
        <p class="rev__text">{{ reviews[current].text }}</p>
        <div class="rev__author">
          <img :src="reviews[current].avatar" :alt="reviews[current].name" />
          <div>
            <div class="rev__name">{{ reviews[current].name }}</div>
            <div class="rev__from">{{ reviews[current].from }} · {{ '★'.repeat(reviews[current].stars) }}</div>
          </div>
        </div>
      </div>
    </transition>

    <div class="rev__dots">
      <button
        v-for="(_, idx) in reviews"
        :key="idx"
        class="rev__dot"
        :class="{ active: idx === current }"
        @click="current = idx"
      ></button>
    </div>
  </div>
</template>

<style scoped>
.rev {
  background: var(--c-bg-card);
  border: 1px solid var(--c-border);
  border-radius: var(--r-xl);
  padding: var(--s-8);
  box-shadow: var(--sh-md);
  display: flex; flex-direction: column; gap: var(--s-5);
}

.rev__head { display: flex; justify-content: space-between; align-items: flex-start; gap: var(--s-4); flex-wrap: wrap; }

.rev__rating { display: flex; align-items: center; gap: var(--s-3); }
.rev__num {
  font-family: var(--c-font-display); font-size: 56px; font-weight: 700;
  color: var(--c-text); line-height: 0.85;
}
.rev__stars { color: var(--c-accent); font-size: 20px; letter-spacing: 2px; }
.rev__count { color: var(--c-text-muted); font-size: 13px; margin-top: 2px; }

.rev__platforms { display: flex; gap: var(--s-2); flex-wrap: wrap; }
.rev__plat { padding: 4px 10px; background: var(--c-bg-soft); color: var(--c-text-muted); border-radius: var(--r-full); font-size: 12px; font-weight: 600; }

.rev__card {
  background: var(--c-bg-soft);
  border-radius: var(--r-lg);
  padding: var(--s-6);
  position: relative;
  min-height: 180px;
}
.rev__quote {
  position: absolute; top: -20px; left: var(--s-5);
  font-family: var(--c-font-display);
  font-size: 96px; font-weight: 700;
  color: var(--c-accent); opacity: 0.3;
  line-height: 1;
}
.rev__text { font-size: 19px; line-height: 1.5; color: var(--c-text); margin: var(--s-4) 0; font-style: italic; }
.rev__author { display: flex; align-items: center; gap: var(--s-3); margin-top: var(--s-4); }
.rev__author img { width: 48px; height: 48px; border-radius: 50%; object-fit: cover; border: 2px solid var(--c-bg-card); }
.rev__name { font-weight: 700; color: var(--c-text); }
.rev__from { font-size: 13px; color: var(--c-text-muted); margin-top: 2px; }

.rev__dots { display: flex; gap: 6px; justify-content: center; }
.rev__dot {
  width: 8px; height: 8px;
  border-radius: 50%;
  background: var(--c-border-strong);
  border: none; padding: 0;
  cursor: pointer;
  transition: all var(--dur-fast);
}
.rev__dot.active { width: 24px; border-radius: 4px; background: var(--c-primary); }

.rev-fade-enter-active, .rev-fade-leave-active { transition: all 0.5s var(--ease-smooth); }
.rev-fade-enter-from { opacity: 0; transform: translateX(20px); }
.rev-fade-leave-to { opacity: 0; transform: translateX(-20px); }
</style>
