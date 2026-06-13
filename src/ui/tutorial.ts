/** Lightweight one-time tutorial overlays: a dark full-screen scrim with
 * optional "spotlight" holes cut over target elements, a bouncing arrow at each
 * hole, a text card, and a big close X. Each runs once (gs.markTutSeen) and is
 * remembered across runs. Targets are resolved lazily (after the screen lays
 * out) and addressed in viewport coordinates; the overlay blocks interaction
 * until dismissed, so the spotlight can't drift. */

import { game } from "../game";

interface TutOpts {
  key: string;                                   // persisted seen-flag
  text: string;                                  // inner HTML (our own copy — safe)
  targets?: () => Array<HTMLElement | null>;     // elements to spotlight (optional)
}

export function maybeTutorial(o: TutOpts): void {
  const gs = game.gs;
  if (gs.hasSeenTut(o.key)) return;
  gs.markTutSeen(o.key); // mark now so a re-render can't double-fire it
  // Let the screen finish laying out (panel show + any fade) before measuring.
  setTimeout(() => {
    const targets = (o.targets?.() ?? []).filter((t): t is HTMLElement => !!t);
    show(o.text, targets);
  }, 160);
}

function show(text: string, targets: HTMLElement[]): void {
  document.getElementById("tut-overlay")?.remove();
  const W = window.innerWidth, H = window.innerHeight, pad = 10;
  const holes = targets
    .map((t) => {
      const r = t.getBoundingClientRect();
      return { x: r.left - pad, y: r.top - pad, w: r.width + 2 * pad, h: r.height + 2 * pad,
               cx: (r.left + r.right) / 2, top: r.top, bottom: r.bottom };
    })
    .filter((h) => h.w > 4 && h.h > 4);

  // Put the text card on the side away from the spotlights; arrows point in.
  const midY = holes.length ? holes.reduce((s, h) => s + (h.top + h.bottom) / 2, 0) / holes.length : H / 2;
  const cardHigh = holes.length > 0 && midY >= H * 0.5; // holes low → card up top
  const still = game.gs.reduceMotion;

  const arrows = holes.map((h) => cardHigh
    ? `<div class="tut-arrow ${still ? "" : "bounce-down"}" style="left:${h.cx}px;top:${Math.max(6, h.top - 46)}px;">▼</div>`
    : `<div class="tut-arrow ${still ? "" : "bounce-up"}" style="left:${h.cx}px;top:${h.bottom + 8}px;">▲</div>`,
  ).join("");
  const cardStyle = holes.length === 0 ? "top:50%;transform:translate(-50%,-50%);"
    : cardHigh ? "top:8vh;" : "bottom:8vh;";
  const holeRects = holes.map((h) =>
    `<rect x="${h.x}" y="${h.y}" width="${h.w}" height="${h.h}" rx="14" fill="black"/>`).join("");

  const ov = document.createElement("div");
  ov.id = "tut-overlay";
  ov.className = "tut-overlay";
  ov.innerHTML = `
    <svg class="tut-mask" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}" preserveAspectRatio="none">
      <defs><mask id="tut-holes"><rect width="${W}" height="${H}" fill="white"/>${holeRects}</mask></defs>
      <rect width="${W}" height="${H}" fill="rgba(4,8,15,0.8)" mask="url(#tut-holes)"/>
    </svg>
    ${arrows}
    <div class="tut-card" style="${cardStyle}">${text}</div>
    <button class="tut-x" aria-label="Close tutorial">✕</button>`;
  document.body.appendChild(ov);

  const close = () => ov.remove();
  ov.querySelector(".tut-x")!.addEventListener("click", close);
  ov.querySelector(".tut-mask")!.addEventListener("click", close);
  ov.querySelector(".tut-card")!.addEventListener("click", (e) => e.stopPropagation());
}
