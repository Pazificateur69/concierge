<script setup lang="ts">
import { IonPage, IonContent } from '@ionic/vue';
import { useRouter } from 'vue-router';

const router = useRouter();
</script>

<template>
  <ion-page>
    <ion-content :fullscreen="true">
      <div class="nf">
        <span class="nf__mark">C</span>
        <span class="eyebrow">Erreur 404</span>
        <h1 class="serif">Cette page s'est égarée</h1>
        <p>Le chemin que vous suivez n'existe pas — ou plus. Revenons à l'accueil ensemble.</p>
        <div class="nf__actions">
          <button class="nf__btn nf__btn--primary" @click="router.push('/')">Retour à l'accueil</button>
          <button class="nf__btn" @click="router.back()">Page précédente</button>
        </div>
      </div>
    </ion-content>
  </ion-page>
</template>

<style scoped>
.nf { min-height: 100vh; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 16px; padding: 32px; text-align: center; background: var(--c-bg, #faf7f2); font-family: 'Inter', sans-serif; }
.nf__mark { width: 64px; height: 64px; background: var(--c-ink, #14202e); color: var(--c-paper, #f5f0e8); display: grid; place-items: center; font-family: 'Cormorant Garamond', serif; font-size: 30px; font-weight: 600; }
.eyebrow { font-size: 11px; font-weight: 600; letter-spacing: 0.18em; text-transform: uppercase; color: var(--c-accent-deep, #8e7138); margin-top: 12px; }
.serif { font-family: 'Cormorant Garamond', serif; font-weight: 500; }
.nf h1 { font-size: 44px; line-height: 1.1; margin: 0; max-width: 560px; color: var(--c-ink, #14202e); letter-spacing: -0.02em; }
.nf p { color: var(--c-text-muted, #5a6675); max-width: 460px; line-height: 1.6; font-size: 15px; margin: 0; }
.nf__actions { display: flex; gap: 10px; margin-top: 16px; flex-wrap: wrap; justify-content: center; }
.nf__btn { padding: 14px 24px; background: transparent; color: var(--c-ink, #14202e); border: 1px solid var(--c-border-strong, rgba(20,32,46,0.18)); font-size: 12px; font-weight: 600; letter-spacing: 0.14em; text-transform: uppercase; cursor: pointer; font-family: inherit; transition: all 0.2s; }
.nf__btn:hover { background: var(--c-paper, #f5f0e8); }
.nf__btn--primary { background: var(--c-ink, #14202e); color: white; border-color: var(--c-ink, #14202e); }
.nf__btn--primary:hover { background: var(--c-accent, #b8985a); border-color: var(--c-accent, #b8985a); }
</style>
