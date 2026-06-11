/** Synthesized SFX — a Web Audio port of the original audio.py. No audio
 * files; every sound is generated at runtime from the same recipes
 * (square/sine, linear decay, optional pitch sweep + noise).
 *
 * Respects GameState.muted/volume. The AudioContext unlocks on the first
 * user gesture (browser autoplay policy).
 */

import { game } from "./game";

interface ToneSpec {
  freq: number; dur: number; vol: number;
  wave: "square" | "sine";
  sweep?: number;   // Hz/sec added to freq over time
  noise?: number;   // 0..1 noise mix
}

// Same recipes as the original audio.py (+ "shield" from v0.5.1).
const SPECS: Record<string, ToneSpec> = {
  shoot: { freq: 660, dur: 0.06, vol: 0.20, wave: "square", sweep: -3000 },
  kill: { freq: 200, dur: 0.12, vol: 0.30, wave: "square", sweep: -600, noise: 0.6 },
  hit: { freq: 150, dur: 0.10, vol: 0.30, wave: "square", noise: 0.8 },
  shield: { freq: 520, dur: 0.16, vol: 0.32, wave: "sine", sweep: -900, noise: 0.15 },
  laser: { freq: 130, dur: 0.30, vol: 0.30, wave: "square", noise: 0.35 },
  boom: { freq: 80, dur: 0.40, vol: 0.50, wave: "sine", sweep: -120, noise: 0.7 },
  buy: { freq: 880, dur: 0.10, vol: 0.30, wave: "square", sweep: 700 },
};

let ctx: AudioContext | null = null;
const buffers = new Map<string, AudioBuffer>();

function ensureContext(): AudioContext | null {
  if (ctx) return ctx;
  try {
    ctx = new AudioContext();
  } catch {
    return null; // no audio -> silent, never crash
  }
  for (const [name, t] of Object.entries(SPECS)) {
    const rate = ctx.sampleRate;
    const n = Math.max(1, Math.floor(rate * t.dur));
    const buf = ctx.createBuffer(1, n, rate);
    const data = buf.getChannelData(0);
    for (let i = 0; i < n; i++) {
      const time = i / rate;
      const env = 1 - i / n;
      const f = t.freq + (t.sweep ?? 0) * time;
      let s = Math.sin(2 * Math.PI * f * time);
      if (t.wave === "square") s = s >= 0 ? 1 : -1;
      if (t.noise) s = (1 - t.noise) * s + t.noise * (Math.random() * 2 - 1);
      data[i] = Math.max(-1, Math.min(1, s * env * t.vol));
    }
    buffers.set(name, buf);
  }
  return ctx;
}

// iOS: route audio as "playback" so the physical ring/silent switch doesn't
// mute the game (Web Audio is treated as ambient by default and silenced).
try {
  const session = (navigator as unknown as { audioSession?: { type: string } }).audioSession;
  if (session) session.type = "playback";
} catch { /* older iOS / non-iOS */ }

// Unlock on the first user gesture (required by autoplay policies). iOS
// historically prefers touchend; listen broadly and self-heal on visibility.
for (const ev of ["pointerdown", "touchend", "keydown"]) {
  window.addEventListener(ev, () => { void ensureContext()?.resume(); }, { once: true });
}
document.addEventListener("visibilitychange", () => {
  if (!document.hidden && ctx?.state === "suspended") void ctx.resume();
});

export function play(name: keyof typeof SPECS): void {
  const gs = game.gs;
  if (gs.muted || gs.volume <= 0) return;
  const c = ensureContext();
  const buf = buffers.get(name);
  if (!c || !buf) return;
  if (c.state === "suspended") void c.resume(); // self-heal; this sound is dropped
  if (c.state !== "running") return;
  try {
    const src = c.createBufferSource();
    src.buffer = buf;
    const gain = c.createGain();
    gain.gain.value = gs.volume;
    src.connect(gain).connect(c.destination);
    src.start();
  } catch { /* never crash over audio */ }
}
