import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: { 
    host: '0.0.0.0',
    port: 5173,
    proxy: { 
      '/api': {
        target: 'http://api:8000',
        changeOrigin: true,
        secure: false
      }, 
      '/outputs': {
        target: 'http://api:8000',
        changeOrigin: true,
        secure: false
      },
      '/ws': {
        target: 'ws://api:8000',
        ws: true,
        changeOrigin: true,
        secure: false
      }
    } 
  }
});