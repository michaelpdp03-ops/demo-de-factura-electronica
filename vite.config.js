import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    open: true,
    proxy: {
      // Proxy para esquivar CORS contra la API de MSeller en desarrollo.
      // Las llamadas a /mseller/* desde el frontend se reenvían a ecf.api.mseller.app
      '/mseller': {
        target: 'https://ecf.api.mseller.app',
        changeOrigin: true,
        secure: true,
        rewrite: (path) => path.replace(/^\/mseller/, '')
      }
    }
  }
})
