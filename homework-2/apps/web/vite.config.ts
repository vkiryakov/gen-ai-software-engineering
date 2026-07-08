import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';

// The dev server proxies `/api` to the NestJS backend so the browser makes
// same-origin requests (no CORS dance during development).
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      '/api': {
        target: process.env.API_PROXY_TARGET ?? 'http://localhost:3001',
        changeOrigin: true,
      },
    },
  },
});
