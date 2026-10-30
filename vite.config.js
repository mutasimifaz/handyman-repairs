import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['brand-mark.svg'],
      manifest: {
        name: 'HandyMan Tools',
        short_name: 'HandyMan',
        description: 'Tools for the work that matters.',
        theme_color: '#f5f4ef',
        background_color: '#f5f4ef',
        display: 'standalone',
        start_url: '/',
        icons: [
          { src: '/pwa-192.svg', sizes: '192x192', type: 'image/svg+xml', purpose: 'any' },
          { src: '/pwa-512.svg', sizes: '512x512', type: 'image/svg+xml', purpose: 'any' }
        ]
      },
      workbox: { navigateFallback: '/index.html', globPatterns: ['**/*.{js,css,html,svg,png,webp,ico}'] }
    })
  ]
})