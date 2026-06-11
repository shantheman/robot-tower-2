import { defineConfig } from "vite";

// GitHub Pages serves the site at /core-defender/ — the deploy workflow sets
// GH_PAGES=1 so local dev keeps serving from /.
export default defineConfig({
  base: process.env.GH_PAGES ? "/core-defender/" : "/",
});
