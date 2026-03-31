import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';

export default defineConfig({
  plugins: [tailwindcss(), react()],
  base: '/uPlot-Plus/',
  root: import.meta.dirname,
  resolve: {
    alias: {
      '@': import.meta.dirname + '/../src',
      'uplot-plus': import.meta.dirname + '/../src',
    },
  },
});
