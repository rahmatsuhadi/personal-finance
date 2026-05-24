import path from "path"
import tailwindcss from "@tailwindcss/vite"
import react from "@vitejs/plugin-react"
import { defineConfig } from "vite"
import { VitePWA } from 'vite-plugin-pwa'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss(),
  VitePWA({
    registerType: 'autoUpdate', // Otomatis update aplikasi jika ada kode baru
    injectRegister: 'auto',
    workbox: {
      clientsClaim: true,
      globPatterns: ['**/*.{js,css,html,ico,png,svg}'],
      skipWaiting: true
    },
    devOptions: {
      enabled: true
    },
    includeAssets: ['logo.png', 'vite.svg'],
    manifest: {
      name: 'Kanti Arta',
      short_name: 'Kanti Arta',
      description: 'Finance App dengan Penyimpanan Lokal',
      theme_color: '#0a0a0a',     // Sesuai --brutal-black
      background_color: '#f5f0e8', // Sesuai --brutal-bg
      display: 'standalone',
      orientation: 'portrait',
      icons: [
        {
          src: 'pwa-192x192.png',
          sizes: '192x192',
          type: 'image/png'
        },
        {
          src: 'pwa-512x512.png',
          sizes: '512x512',
          type: 'image/png'
        },
        {
          src: 'pwa-512x512.png',
          sizes: '512x512',
          type: 'image/png',
          purpose: 'any maskable' // Agar ikon berbentuk kotak/bulat rapi di Android
        }
      ]
    }
  })

  ],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
})
