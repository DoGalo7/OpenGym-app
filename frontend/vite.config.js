import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.svg', 'apple-touch-icon.png'],
      manifest: {
        name: 'Open Gym-app',
        short_name: 'Open Gym',
        description: 'Stel zelf je WOD samen',
        lang: 'nl',
        start_url: '/',
        display: 'standalone',
        background_color: '#f5f5f0',
        theme_color: '#1c1c1e',
        icons: [
          { src: '/icon-192.png', sizes: '192x192', type: 'image/png' },
          { src: '/icon-512.png', sizes: '512x512', type: 'image/png' },
          { src: '/maskable-icon-192.png', sizes: '192x192', type: 'image/png', purpose: 'maskable' },
          { src: '/maskable-icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
        ],
      },
      workbox: {
        // Cache the app shell so the app still opens (offline shell) without
        // a network round-trip; API calls to the backend are left untouched
        // since workouts always need fresh data.
        navigateFallbackDenylist: [/^\/api\//],
      },
    }),
  ],
  server: {
    // Allows quick phone/tablet testing via a localtunnel (https://*.loca.lt) tunnel
    // without disabling Vite's host check entirely.
    allowedHosts: ['.loca.lt'],
  },
})
