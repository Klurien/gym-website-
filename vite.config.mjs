import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

export default defineConfig({
  plugins: [react(), tailwindcss()],
  define: {
    // Vercel exposes NEXT_PUBLIC_ vars to the build process (Next.js convention).
    // Expose it to the Vite client so a missing VITE_ var doesn't break the popup.
    'import.meta.env.NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY': JSON.stringify(process.env.NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY || ''),
  },
  server: {
    proxy: {
      '/api': {
        target: 'http://localhost:3000',
        changeOrigin: true
      }
    }
  },
  build: {
    chunkSizeWarningLimit: 1000
  }
});
