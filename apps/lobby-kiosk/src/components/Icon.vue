<script setup lang="ts">
const props = defineProps<{ name: string; size?: number; stroke?: number }>();
const size = props.size ?? 20;
const sw = props.stroke ?? 1.5;
</script>

<template>
  <svg
    :width="size" :height="size" viewBox="0 0 24 24"
    fill="none" :stroke="'currentColor'" :stroke-width="sw"
    stroke-linecap="round" stroke-linejoin="round"
    class="icon"
  >
    <!-- Map -->
    <template v-if="name === 'map'">
      <path d="M9 4l-6 2v14l6-2 6 2 6-2V4l-6 2-6-2z"/>
      <path d="M9 4v14M15 6v14"/>
    </template>
    <!-- Concierge bell -->
    <template v-else-if="name === 'bell'">
      <path d="M3 17h18M5 17a7 7 0 1 1 14 0M12 4v3M10 4h4"/>
    </template>
    <!-- Restaurant -->
    <template v-else-if="name === 'restaurant'">
      <path d="M7 2v20M3 2v6a4 4 0 0 0 4 4M21 2l-4 6v14M17 8h4"/>
    </template>
    <!-- Spa -->
    <template v-else-if="name === 'spa'">
      <path d="M12 2c2 4 0 8 0 8s-2-4 0-8z"/>
      <path d="M4 12c4 0 8 4 8 8 0 0-4-4-8-4-1 0-2 0-2 0 .5-2 2-4 2-4z"/>
      <path d="M20 12c-4 0-8 4-8 8 0 0 4-4 8-4 1 0 2 0 2 0-.5-2-2-4-2-4z"/>
    </template>
    <!-- Sun (weather) -->
    <template v-else-if="name === 'sun'">
      <circle cx="12" cy="12" r="4"/>
      <path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M6.34 17.66l-1.41 1.41M19.07 4.93l-1.41 1.41"/>
    </template>
    <!-- Help -->
    <template v-else-if="name === 'help'">
      <circle cx="12" cy="12" r="9"/>
      <path d="M9.09 9a3 3 0 1 1 5.83 1c0 2-3 3-3 3M12 17h.01"/>
    </template>
    <!-- Phone -->
    <template v-else-if="name === 'phone'">
      <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.13.96.36 1.91.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.9.34 1.85.57 2.81.7A2 2 0 0 1 22 16.92z"/>
    </template>
    <!-- Mail -->
    <template v-else-if="name === 'mail'">
      <rect x="2" y="4" width="20" height="16" rx="2"/>
      <path d="M22 7L12 13 2 7"/>
    </template>
    <!-- MapPin -->
    <template v-else-if="name === 'pin'">
      <path d="M21 10c0 7-9 13-9 13S3 17 3 10a9 9 0 0 1 18 0z"/>
      <circle cx="12" cy="10" r="3"/>
    </template>
    <!-- Star -->
    <template v-else-if="name === 'star'">
      <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" fill="currentColor"/>
    </template>
    <!-- Arrow right -->
    <template v-else-if="name === 'arrow-right'">
      <path d="M5 12h14M12 5l7 7-7 7"/>
    </template>
    <!-- Arrow left -->
    <template v-else-if="name === 'arrow-left'">
      <path d="M19 12H5M12 19l-7-7 7-7"/>
    </template>
    <!-- Home -->
    <template v-else-if="name === 'home'">
      <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
      <path d="M9 22V12h6v10"/>
    </template>
    <!-- Plus -->
    <template v-else-if="name === 'plus'">
      <path d="M12 5v14M5 12h14"/>
    </template>
    <!-- Minus -->
    <template v-else-if="name === 'minus'">
      <path d="M5 12h14"/>
    </template>
    <!-- Check -->
    <template v-else-if="name === 'check'">
      <path d="M20 6L9 17l-5-5"/>
    </template>
    <!-- Voice / speaker -->
    <template v-else-if="name === 'voice'">
      <path d="M11 5L6 9H2v6h4l5 4V5z"/>
      <path d="M19.07 4.93a10 10 0 0 1 0 14.14M15.54 8.46a5 5 0 0 1 0 7.07"/>
    </template>
    <!-- Globe -->
    <template v-else-if="name === 'globe'">
      <circle cx="12" cy="12" r="10"/>
      <path d="M2 12h20M12 2a15 15 0 0 1 0 20 15 15 0 0 1 0-20z"/>
    </template>
    <!-- Clock -->
    <template v-else-if="name === 'clock'">
      <circle cx="12" cy="12" r="10"/>
      <path d="M12 6v6l4 2"/>
    </template>
    <!-- Close -->
    <template v-else-if="name === 'close'">
      <path d="M18 6L6 18M6 6l12 12"/>
    </template>
    <!-- Send -->
    <template v-else-if="name === 'send'">
      <path d="M22 2L11 13M22 2l-7 20-4-9-9-4 20-7z"/>
    </template>
    <!-- Trash -->
    <template v-else-if="name === 'trash'">
      <path d="M3 6h18M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/>
    </template>
    <!-- Wifi -->
    <template v-else-if="name === 'wifi'">
      <path d="M5 12.55a11 11 0 0 1 14 0M1.42 9a16 16 0 0 1 21.16 0M8.53 16.11a6 6 0 0 1 6.95 0"/>
      <circle cx="12" cy="20" r="0.5" fill="currentColor"/>
    </template>
    <!-- Default fallback -->
    <template v-else>
      <circle cx="12" cy="12" r="9"/>
    </template>
  </svg>
</template>

<style scoped>
.icon { display: inline-block; vertical-align: middle; flex-shrink: 0; }
</style>
