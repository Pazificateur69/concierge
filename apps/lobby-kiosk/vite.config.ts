import { defineConfig } from 'vite';
import vue from '@vitejs/plugin-vue';
import { VitePWA } from 'vite-plugin-pwa';

// SVG icon used as inline data URI for the PWA manifest (no extra files needed)
const ICON_SVG_DATAURI = 'data:image/svg+xml;base64,' + Buffer.from(`<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512">
  <rect width="512" height="512" fill="#14202e"/>
  <text x="256" y="320" font-family="Cormorant Garamond, Georgia, serif" font-size="320" font-weight="600" text-anchor="middle" fill="#f5f0e8">C</text>
</svg>`).toString('base64');

export default defineConfig({
  plugins: [
    vue(),
    VitePWA({
      registerType: 'autoUpdate',
      manifest: {
        name: 'Concierge',
        short_name: 'Concierge',
        description: 'Concierge — Hôtel cinq étoiles',
        theme_color: '#14202e',
        background_color: '#f5f0e8',
        display: 'fullscreen',
        orientation: 'any',
        start_url: '/',
        icons: [
          { src: ICON_SVG_DATAURI, sizes: '192x192', type: 'image/svg+xml', purpose: 'any maskable' },
          { src: ICON_SVG_DATAURI, sizes: '512x512', type: 'image/svg+xml', purpose: 'any maskable' },
        ],
      },
      workbox: {
        runtimeCaching: [
          {
            urlPattern: /^https:\/\/.*\.unsplash\.com/,
            handler: 'CacheFirst',
            options: { cacheName: 'unsplash-images', expiration: { maxAgeSeconds: 86400 * 30 } },
          },
        ],
      },
    }),
  ],
  server: { port: 4100, host: true },
});
