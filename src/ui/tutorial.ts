/** One-time tutorial coach-marks. A dark scrim with soft-edged "spotlight" holes
 * cut over target elements (each ringed in cyan and kept bright), a bouncing
 * double-chevron pointer aimed at each hole, and a glassy coach-mark bubble with
 * HUD corner-brackets, a "TIP n of N" counter, and a caret notch that points at
 * the target. Each runs once (gs.markTutSeen) and is remembered across runs.
 * Targets are resolved lazily (after the screen lays out) and addressed in
 * viewport coordinates; the overlay blocks interaction until dismissed, so the
 * spotlight can't drift. Visual spec: docs/design / tutorial-handoff. */

import { game } from "../game";

interface TutOpts {
  key: string;                                   // persisted seen-flag
  text: string;                                  // inner HTML (our own copy — safe)
  step?: number;                                 // tip counter: "TIP {step} of {total}"
  total?: number;
  targets?: () => Array<HTMLElement | null>;     // elements to spotlight (optional)
}

type Dir = "up" | "down" | "left" | "right";        // chevron / bounce direction
type Side = "top" | "bottom" | "left" | "right" | "center"; // bubble placement / caret edge

const PAD = 12;     // grow each hole past its element so bleeding art isn't clipped
const GAP = 14;     // breathing room between hole, pointer, and bubble
const PTR = 46;     // pointer box size (matches the design's 48-unit grid)

interface Hole { x: number; y: number; w: number; h: number; cx: number; cy: number; }

export function maybeTutorial(o: TutOpts): void {
  const gs = game.gs;
  if (gs.hasSeenTut(o.key)) return;
  gs.markTutSeen(o.key); // mark now so a re-render can't double-fire it
  // Let the screen finish laying out (panel show + any fade) before measuring.
  setTimeout(() => {
    const targets = (o.targets?.() ?? []).filter((t): t is HTMLElement => !!t);
    show(o, targets);
  }, 160);
}

/** Bouncing double-chevron, centred on (cx,cy), pointing `dir`. */
function chevron(dir: Dir, cx: number, cy: number, still: boolean): string {
  const rot = { down: 0, up: 180, left: 90, right: -90 }[dir];
  const bob = still ? "" : `animation:tut-bounce-${dir} 1s ease-in-out infinite;`;
  return `<div class="tut-ptr" style="left:${cx}px;top:${cy}px;">
    <div class="tut-ptr-bob" style="${bob}">
      <svg viewBox="0 0 48 48" style="transform:rotate(${rot}deg)">
        <path class="tut-chev tut-chev-bg" d="M12 13 L24 24 L36 13"/>
        <path class="tut-chev tut-chev-fg" d="M12 24 L24 35 L36 24"/>
      </svg></div></div>`;
}

function show(o: TutOpts, targets: HTMLElement[]): void {
  document.getElementById("tut-overlay")?.remove();
  const W = window.innerWidth, H = window.innerHeight;
  const still = game.gs.reduceMotion;

  const holes: Hole[] = targets
    .map((t) => {
      const r = t.getBoundingClientRect();
      return { x: r.left - PAD, y: r.top - PAD, w: r.width + 2 * PAD, h: r.height + 2 * PAD,
               cx: (r.left + r.right) / 2, cy: (r.top + r.bottom) / 2 };
    })
    .filter((h) => h.w > 4 && h.h > 4);

  // Dim with soft-blurred holes punched out, plus a crisp cyan ring per hole.
  const holeRects = holes.map((h) =>
    `<rect x="${h.x}" y="${h.y}" width="${h.w}" height="${h.h}" rx="16" fill="black"
       filter="url(#tut-blur)"/>`).join("");
  const rings = holes.map((h) =>
    `<div class="tut-ring" style="left:${h.x}px;top:${h.y}px;width:${h.w}px;height:${h.h}px;"></div>`)
    .join("");

  const counter = o.step
    ? `<div class="tut-tip">Tip ${o.step}${o.total ? ` of ${o.total}` : ""}</div>` : "";
  const card = `<div class="tut-card">
      <span class="tut-bk tl"></span><span class="tut-bk tr"></span>
      <span class="tut-bk bl"></span><span class="tut-bk br"></span>
      ${counter}<div class="tut-body">${o.text}</div>
      <span class="tut-caret"></span>
    </div>`;

  const ov = document.createElement("div");
  ov.id = "tut-overlay";
  ov.className = "tut-overlay";
  ov.innerHTML = `
    <svg class="tut-mask" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}" preserveAspectRatio="none">
      <defs>
        <filter id="tut-blur" x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur stdDeviation="9"/></filter>
        <mask id="tut-holes"><rect width="${W}" height="${H}" fill="white"/>${holeRects}</mask>
      </defs>
      <rect width="${W}" height="${H}" fill="rgba(3,7,14,0.66)" mask="url(#tut-holes)"/>
    </svg>
    ${rings}
    ${card}
    <button class="tut-x" aria-label="Close tutorial">✕</button>`;
  document.body.appendChild(ov);

  layout(ov, holes, W, H, still);

  const close = () => ov.remove();
  ov.querySelector(".tut-x")!.addEventListener("click", close);
  ov.querySelector(".tut-mask")!.addEventListener("click", close);
  ov.querySelector(".tut-card")!.addEventListener("click", (e) => e.stopPropagation());
}

/** Position the bubble (and its pointers/caret) now that the card is measured. */
function layout(ov: HTMLElement, holes: Hole[], W: number, H: number, still: boolean): void {
  const card = ov.querySelector<HTMLElement>(".tut-card")!;
  const caret = card.querySelector<HTMLElement>(".tut-caret")!;
  const cr = card.getBoundingClientRect();
  const bw = cr.width, bh = cr.height;
  const clamp = (v: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, v));
  const M = 8; // viewport margin
  const ptrs: string[] = [];

  if (holes.length === 0) {
    // Nothing to point at: centre the bubble, no caret, no pointer.
    place(card, (W - bw) / 2, (H - bh) / 2);
    caret.style.display = "none";
  } else if (holes.length === 1) {
    // Single target: drop the bubble on whichever side has the most room.
    const h = holes[0];
    const need = PTR + 2 * GAP;                      // pointer + both gaps
    const gaps: Record<Side, number> = {
      right: W - (h.x + h.w), left: h.x, top: h.y, bottom: H - (h.y + h.h), center: -1,
    };
    const fits: Record<string, boolean> = {
      right: gaps.right >= need + bw + M, left: gaps.left >= need + bw + M,
      top: gaps.top >= need + bh + M, bottom: gaps.bottom >= need + bh + M,
    };
    const order: Side[] = (["right", "left", "top", "bottom"] as Side[])
      .sort((a, b) => gaps[b] - gaps[a]);
    const side = order.find((s) => fits[s]) ?? order[0];

    if (side === "right" || side === "left") {
      const dir: Dir = side === "right" ? "left" : "right";
      const px = side === "right" ? h.x + h.w + GAP + PTR / 2 : h.x - GAP - PTR / 2;
      ptrs.push(chevron(dir, px, h.cy, still));
      const bx = side === "right" ? px + PTR / 2 + GAP : px - PTR / 2 - GAP - bw;
      const by = clamp(h.cy - bh / 2, M, H - bh - M);
      place(card, bx, by);
      setCaret(caret, side === "right" ? "left" : "right", clamp((h.cy - by) / bh * 100, 12, 88));
    } else {
      const dir: Dir = side === "top" ? "down" : "up";
      const py = side === "top" ? h.y - GAP - PTR / 2 : h.y + h.h + GAP + PTR / 2;
      ptrs.push(chevron(dir, h.cx, py, still));
      const by = side === "top" ? py - PTR / 2 - GAP - bh : py + PTR / 2 + GAP;
      const bx = clamp(h.cx - bw / 2, M, W - bw - M);
      place(card, bx, by);
      setCaret(caret, side === "top" ? "bottom" : "top", clamp((h.cx - bx) / bw * 100, 12, 88));
    }
  } else {
    // Multiple targets: a chevron points at each hole; the bubble sits beside
    // their bounding box, no caret. Prefer above/below (the on-brand top-centred
    // look) when it fits; on a short/landscape screen where it doesn't, drop it
    // into the roomier side column with a capped width so it clears every hole.
    caret.style.display = "none";
    const bx0 = Math.min(...holes.map((h) => h.x));
    const by0 = Math.min(...holes.map((h) => h.y));
    const bx1 = Math.max(...holes.map((h) => h.x + h.w));
    const by1 = Math.max(...holes.map((h) => h.y + h.h));
    const lane = PTR + 2 * GAP;                       // room a pointer + gaps needs
    const gTop = by0 - lane, gBot = H - by1 - lane, gLeft = bx0 - lane, gRight = W - bx1 - lane;

    let side: Side;
    if (gTop >= bh + M || gBot >= bh + M) side = gTop >= gBot ? "top" : "bottom";
    else side = gLeft >= gRight ? "left" : "right";

    for (const h of holes) {
      if (side === "top") ptrs.push(chevron("down", h.cx, h.y - GAP - PTR / 2, still));
      else if (side === "bottom") ptrs.push(chevron("up", h.cx, h.y + h.h + GAP + PTR / 2, still));
      else if (side === "left") ptrs.push(chevron("right", h.x - GAP - PTR / 2, h.cy, still));
      else ptrs.push(chevron("left", h.x + h.w + GAP + PTR / 2, h.cy, still));
    }

    // Re-measure if a side column forces a narrower bubble.
    let w = bw, hgt = bh;
    if (side === "left" || side === "right") {
      const room = (side === "left" ? bx0 : W - bx1) - lane - 2 * M;
      card.style.maxWidth = `${Math.max(200, Math.min(440, room))}px`;
      const r2 = card.getBoundingClientRect(); w = r2.width; hgt = r2.height;
    }
    const cx = (bx0 + bx1) / 2, cy = (by0 + by1) / 2;
    const ci = (lo: number, hi: number, size: number) =>
      clamp((lo + hi) / 2 - size / 2, lo, Math.max(lo, hi - size));
    let bx: number, by: number;
    if (side === "top")         { bx = clamp(cx - w / 2, M, W - w - M); by = ci(M, by0 - lane, hgt); }
    else if (side === "bottom") { bx = clamp(cx - w / 2, M, W - w - M); by = ci(by1 + lane, H - M, hgt); }
    else if (side === "left")   { bx = ci(M, bx0 - lane, w); by = clamp(cy - hgt / 2, M, H - hgt - M); }
    else                        { bx = ci(bx1 + lane, W - M, w); by = clamp(cy - hgt / 2, M, H - hgt - M); }
    place(card, bx, by);
  }

  if (ptrs.length) card.insertAdjacentHTML("beforebegin", ptrs.join(""));
}

function place(el: HTMLElement, left: number, top: number): void {
  el.style.left = `${Math.round(left)}px`;
  el.style.top = `${Math.round(top)}px`;
}

function setCaret(caret: HTMLElement, edge: Exclude<Side, "center">, offsetPct: number): void {
  caret.classList.add(`tut-caret-${edge}`);
  if (edge === "left" || edge === "right") caret.style.top = `${offsetPct}%`;
  else caret.style.left = `${offsetPct}%`;
}
