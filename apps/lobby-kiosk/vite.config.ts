import { defineConfig } from 'vite';
import vue from '@vitejs/plugin-vue';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig({
  plugins: [
    vue(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.svg'],
      manifest: {
        name: 'Concierge — Lobby',
        short_name: 'Concierge Lobby',
        description: 'Borne tactile lobby — Concierge by Dymension',
        theme_color: '#1a4d8c',
        background_color: '#fafaf7',
        display: 'fullscreen',
        orientation: 'any',
        start_url: '/',
        icons: [
          { src: 'icon-192.png', sizes: '192x192', type: 'image/png' },
          { src: 'icon-512.png', sizes: '512x512', type: 'image/png' },
        ],
      },
      workbox: {
        runtimeCaching: [
          {
            urlPattern: /^https:\/\/.*\.unsplash\.com/,
            handler: 'CacheFirst',
            options: { cacheName: 'unsplash-images', expiration: { maxAgeSeconds: 86400 * 30 } },
          },
          {
            urlPattern: /^https:\/\/.*\/api\/content/,
            handler: 'StaleWhileRevalidate',
            options: { cacheName: 'concierge-content' },
          },
        ],
      },
    }),
  ],
  server: { port: 4100, host: true },
});
