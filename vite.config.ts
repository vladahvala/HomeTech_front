import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5501,
    // Запити на /api Vite передає бекенду. Так фронт і бекенд для браузера
    // на одному домені, і cookie сесії працює без налаштувань CORS.
    // Порт бекенду уточніть у розробника бекенду.
    proxy: {
      '/api': {
        target: 'http://localhost:3000',
        changeOrigin: true,
      },
    },
  },
});
