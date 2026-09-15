import { defineConfig } from 'vitest/config';
import { fileURLToPath } from 'node:url';

const alias = (p: string) => fileURLToPath(new URL(p, import.meta.url));

export default defineConfig({
  resolve: {
    alias: {
      '@core': alias('./src/core'),
      '@data': alias('./src/data'),
      '@game': alias('./src/game'),
    },
  },
  server: { port: 5173 },
  build: { target: 'es2020', sourcemap: false },
  test: {
    environment: 'node',
    include: ['tests/**/*.test.ts'],
    setupFiles: ['tests/setup.ts'],
  },
});
