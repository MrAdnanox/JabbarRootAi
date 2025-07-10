import { defineConfig } from 'vitest/config';
import path from 'path';

export default defineConfig({
  test: {
    include: ['__tests__/**/*.test.ts'],
    globals: true,
    environment: 'node',
    isolate: true,
    // On dit à Vitest de charger notre fichier de setup avant les tests.
    setupFiles: ['./__tests__/setup.ts'],
  },
  resolve: {
    alias: {
      '@jabbarroot/types': path.resolve(__dirname, '../types/src'),
    },
  },
});