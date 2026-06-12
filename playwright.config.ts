import { defineConfig } from "@playwright/test";

/** E2E harness — drives the DEV build's QA handles (window.rt2/rt2scene,
 * which exist only under `import.meta.env.DEV`). The recipes live in
 * e2e/game.spec.ts; the hard-won rules are documented there. */
export default defineConfig({
  testDir: "e2e",
  timeout: 120_000, // first test eats Vite's cold transform of Phaser
  retries: process.env.CI ? 1 : 0,
  use: {
    baseURL: "http://localhost:5173",
    viewport: { width: 1280, height: 900 },
  },
  webServer: {
    command: "npm run dev",
    port: 5173,
    reuseExistingServer: !process.env.CI,
  },
});
