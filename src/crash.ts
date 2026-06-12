/** Crash safety net (the v1 game had one; this is the v2 port).
 * Uncaught errors and unhandled rejections show a friendly reload banner
 * instead of a silently frozen game. Deliberately framework-free and
 * inline-styled: it must work even when the game's own CSS/JS is the
 * thing that broke. Imported FIRST in main.ts so module-init crashes in
 * everything after it are caught too. */

import { GAME_VERSION } from "./version";

let shown = false;

function showBanner(detail: string): void {
  if (shown) return; // one banner is plenty; later errors are symptoms
  shown = true;
  try {
    const bar = document.createElement("div");
    bar.style.cssText = [
      "position:fixed", "left:0", "right:0", "bottom:0", "z-index:2147483647",
      "background:#2a0e12", "color:#ffd9d4", "border-top:2px solid #ff5238",
      "font:14px/1.45 'Chakra Petch',system-ui,sans-serif",
      "padding:12px 16px", "display:flex", "gap:14px", "align-items:center",
      "flex-wrap:wrap",
    ].join(";");
    const msg = document.createElement("div");
    msg.style.cssText = "flex:1 1 240px;min-width:200px";
    msg.innerHTML = `<b>Something broke.</b> Reloading usually fixes it — your progress is saved.` +
      `<div style="opacity:.65;font-size:11px;margin-top:3px">v${GAME_VERSION} · ${detail.slice(0, 140).replace(/</g, "&lt;")}</div>`;
    const btn = document.createElement("button");
    btn.textContent = "RELOAD";
    btn.style.cssText = "padding:9px 22px;border-radius:9px;border:1px solid #ff8a76;" +
      "background:#ff5238;color:#fff;font:700 13px 'Chakra Petch',system-ui,sans-serif;cursor:pointer";
    btn.addEventListener("click", () => location.reload());
    bar.append(msg, btn);
    document.body.appendChild(bar);
  } catch { /* the net must never throw */ }
}

window.addEventListener("error", (ev) => {
  showBanner(ev.message || "unknown error");
});
window.addEventListener("unhandledrejection", (ev) => {
  const r = ev.reason;
  showBanner(r instanceof Error ? r.message : String(r ?? "unhandled rejection"));
});
