import { defineConfig } from "vite";

// GitHub Pages serves the site at /robot-tower-2/ — the deploy workflow sets
// GH_PAGES=1 so local dev keeps serving from /.
export default defineConfig({
  base: process.env.GH_PAGES ? "/robot-tower-2/" : "/",
});
