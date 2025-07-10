import { defineConfig } from 'vitest/config';
import path from 'path';

export default defineConfig({
  test: {
    include: ['__tests__/**/*.test.ts'],
    globals: true,
    environment: 'node',
    isolate: true,
    // Le package prompt-factory dépend de core, il a donc aussi besoin du setup.
    // Le chemin est relatif à ce fichier de config.
    setupFiles: ['../core/__tests__/setup.ts'],
  },
  resolve: {
    alias: {
      '@jabbarroot/core': path.resolve(__dirname, '../core/src'),
      '@jabbarroot/types': path.resolve(__dirname, '../types/src'),
    },
  },
});