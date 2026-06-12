import { defineConfig } from "vitest/config";

/** Unit tests only — e2e/ belongs to Playwright (its *.spec.ts files would
 * otherwise match vitest's default glob). */
export default defineConfig({
  test: { include: ["tests/**/*.test.ts"] },
});
