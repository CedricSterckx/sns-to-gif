import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

const backendUrl = process.env.BACKEND_URL || 'http://localhost:3001';

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      '/api': { target: backendUrl, changeOrigin: true },
      '/output': { target: backendUrl, changeOrigin: true },
    },
  },
  preview: {
    host: true,
    port: process.env.PORT ? parseInt(process.env.PORT) : 4173,
    proxy: {
      '/api': { target: backendUrl, changeOrigin: true },
      '/output': { target: backendUrl, changeOrigin: true },
    },
  },
});
