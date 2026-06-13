/** Looping background music — a streamed HTML5 <audio> element, kept separate
 * from the synthesized SFX in audio.ts. Respects GameState.musicVolume
 * (0 = off). Browser autoplay policy: it only starts after the first user
 * gesture; raising the Settings slider (a gesture itself) also starts it. */

import { game } from "./game";

const TRACK = import.meta.env.BASE_URL + "audio/future.mp3";

let el: HTMLAudioElement | null = null;
let unlocked = false;

function ensureEl(): HTMLAudioElement {
  if (!el) {
    el = new Audio(TRACK);
    el.loop = true;
    el.preload = "auto";
    el.id = "bgm";
    document.body.appendChild(el); // in-DOM aids mobile playback reliability
  }
  return el;
}

/** Push the current musicVolume to the live element, starting or pausing as
 * needed. Playback only begins once a user gesture has unlocked audio. */
function apply(): void {
  const a = ensureEl();
  const v = Math.max(0, Math.min(1, game.gs.musicVolume));
  a.volume = v;
  if (v <= 0) {
    a.pause();
  } else if (unlocked && a.paused) {
    void a.play().catch(() => { /* still blocked; retried on next gesture/apply */ });
  }
}

/** Settings "Music" slider -> live volume (0 = off). */
export function setMusicVolume(v: number): void {
  game.gs.musicVolume = Math.max(0, Math.min(1, v));
  apply();
}

/** Wire autoplay unlock + tab-visibility handling. Call once at boot. */
export function initMusic(): void {
  const unlock = () => { unlocked = true; apply(); };
  for (const ev of ["pointerdown", "touchend", "keydown"]) {
    window.addEventListener(ev, unlock, { once: true });
  }
  // Pause when the tab is hidden; resume (if music is on) when it returns.
  document.addEventListener("visibilitychange", () => {
    if (!el) return;
    if (document.hidden) el.pause();
    else apply();
  });
}
