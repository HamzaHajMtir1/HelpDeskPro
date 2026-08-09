/* global process */
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],

  // The app calls the API with relative paths ("/api/...", "/ai/..."), which in
  // production are resolved by the Nginx container. `npm run dev` serves on
  // :5173 and would otherwise resolve them against the dev server itself, so
  // proxy them to the services running on the host.
  //
  //   VITE_DEV_API_TARGET / VITE_DEV_AI_TARGET override the targets when the
  //   backend is reachable somewhere else (e.g. the Docker stack on :8080).
  server: {
    proxy: {
      '/api': {
        target: process.env.VITE_DEV_API_TARGET || 'http://localhost:8080',
        changeOrigin: true,
      },
      // External Flask "agent2" service (not part of this repository).
      // Nginx strips the /ai prefix in production, so mirror that here.
      '/ai': {
        target: process.env.VITE_DEV_AI_TARGET || 'http://localhost:5002',
        changeOrigin: true,
        rewrite: (p) => p.replace(/^\/ai/, ''),
      },
    },
  },
})
