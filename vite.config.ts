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
  // build stamp shown on the title screen so a phone screenshot tells which deploy is running (GITHUB_SHA in Actions)
  define: { __COMMIT__: JSON.stringify((process.env.GITHUB_SHA ?? 'dev').slice(0, 7)) },
  base: './', // relative asset URLs: works at / (preview, e2e), under /eternal-city/ (GitHub Pages) and inside the artifact
  build: { target: 'es2020', sourcemap: false },
  test: {
    environment: 'node',
    include: ['tests/**/*.test.ts'],
    setupFiles: ['tests/setup.ts'],
  },
});
