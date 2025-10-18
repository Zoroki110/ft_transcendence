// vite.config.ts
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    host: true,          // listen on 0.0.0.0
    port: 5173,
    strictPort: true,
    cors: true,
    hmr: {
      protocol: 'ws',
      host: 'localhost', // what the BROWSER can reach (not container hostname)
      port: 5173,
      // clientPort: 5173, // uncomment if browser hits a different port than server
    },
    watch: {
      usePolling: true,  // reliable in Docker/WSL
      interval: 300,
    },
  },
});
