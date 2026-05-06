import { defineConfig } from 'vite';
import vue from '@vitejs/plugin-vue';
import { VitePWA } from 'vite-plugin-pwa';

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
        name: 'Concierge Satisfaction',
        short_name: 'Smiley',
        theme_color: '#14202e',
        background_color: '#f5f0e8',
        display: 'fullscreen',
        start_url: '/',
        icons: [
          { src: ICON_SVG_DATAURI, sizes: '192x192', type: 'image/svg+xml', purpose: 'any maskable' },
          { src: ICON_SVG_DATAURI, sizes: '512x512', type: 'image/svg+xml', purpose: 'any maskable' },
        ],
      },
    }),
  ],
  server: { port: 4200, host: true },
});
