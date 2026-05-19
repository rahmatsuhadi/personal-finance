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
      skipWaiting: true
    },
    devOptions: {
      enabled: true
    },
    // includeAssets: ['favicon.ico', 'apple-touch-icon.png', 'mask-icon.svg'],
    manifest: {
      name: 'Kanti Arta',
      short_name: 'Kanti Arta',
      description: 'Finance App dengan Penyimpanan Lokal ',
      theme_color: '#000000',     // Sesuai warna aksen brutalism Anda
      background_color: '#F4F2EC', // Sesuai warna background abu-abu/krem brutalism Anda
      display: 'standalone',       // Membuka aplikasi tanpa bar navigasi browser (seperti native app)
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
