import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// In development, proxy API + uploads to the backend so the browser stays
// same-origin (no CORS headaches). In production, nginx handles this routing.
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      '/api': 'http://localhost:4000',
      '/uploads': 'http://localhost:4000',
    },
  },
});
