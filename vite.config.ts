import { defineConfig } from "vite";

// GitHub Pages serves the site at /core-defender/ — the deploy workflow sets
// GH_PAGES=1 so local dev keeps serving from /.
//
// The CSP <meta> is injected at deploy build only (Pages can't send headers;
// a meta CSP still narrows the blast radius of any future XSS). Dev is left
// alone — Vite's dev tooling needs freedoms the policy would deny.
const CSP = [
  "default-src 'self'",
  "script-src 'self'",
  "style-src 'self' 'unsafe-inline'", // Phaser styles the canvas via attributes
  "img-src 'self' data: blob:",       // Phaser fallback textures are data URIs
  "font-src 'self'",
  "connect-src 'self'",
  "object-src 'none'",
  "base-uri 'self'",
].join("; ");

export default defineConfig({
  base: process.env.GH_PAGES ? "/core-defender/" : "/",
  plugins: [
    {
      name: "csp-meta",
      transformIndexHtml(html: string) {
        if (!process.env.GH_PAGES) return html;
        return html.replace(
          "<head>",
          `<head>\n  <meta http-equiv="Content-Security-Policy" content="${CSP}" />`,
        );
      },
    },
  ],
});
