// vite.config.ts
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// Same-origin path for Aloud's stats endpoint. In production Netlify proxies
// it (see ../netlify.toml); in dev and preview, Vite does.
const aloudStats = {
  '/api/aloud-stats': {
    target: 'https://www.aloudreader.org',
    changeOrigin: true,
    rewrite: () => '/api/stats',
  },
}

export default defineConfig({
  plugins: [react()],
  server: { proxy: aloudStats },
  preview: { proxy: aloudStats },
})
