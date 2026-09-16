import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: './e2e',
  timeout: 90_000,
  retries: 0,
  // one worker: the perf spec measures fps and several specs time real movement; a second worker on the
  // same CPU halves both and makes them flake
  workers: 1,
  reporter: 'list',
  webServer: {
    command: 'npm run preview',
    port: 4173,
    reuseExistingServer: true,
    timeout: 60_000,
  },
  use: {
    baseURL: 'http://localhost:4173',
    headless: true,
    viewport: { width: 1280, height: 720 },
    launchOptions: {
      // Chromium's default software WebGL. Forcing ANGLE+SwiftShader (the old flags) made the runner
      // freeze for 15-20s once per page after texture generation (a floating shader/JIT stall), which
      // broke every short wait that landed inside it.
      args: ['--enable-unsafe-swiftshader', '--no-sandbox'],
    },
  },
  projects: [{ name: 'chromium', use: { browserName: 'chromium' } }],
});
