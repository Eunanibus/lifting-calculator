/// <reference types="vitest/config" />
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// A relative base lets the same build serve from https://<user>.github.io/<repo>/
// and from any other path without a rebuild.
export default defineConfig({
  base: './',
  plugins: [react()],
  test: {
    environment: 'jsdom',
    setupFiles: './src/test-setup.ts',
    css: false,
  },
});
