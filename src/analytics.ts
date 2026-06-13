/** Anonymous product analytics (PostHog) — playtime + progression for the
 * friend test and beyond.
 *
 * Privacy: NO PII. PostHog assigns an anonymous per-browser id; we never set a
 * name. It's OFF in dev and whenever POSTHOG_KEY is blank, and every call fails
 * silently (ad blockers, offline, init errors) so analytics can never affect
 * gameplay. The SDK is dynamically imported only when enabled, so it adds
 * nothing to the bundle until a key is set.
 *
 * Same code runs in the Capacitor (App Store) build's webview and queues events
 * offline — see docs/TODO.md (analytics) and the App Privacy nutrition label. */

import { GAME_VERSION } from "./version";

// Public client key — safe to embed in the client. Paste the PostHog PROJECT
// key here to turn analytics on; leave blank to keep it fully off. This game can
// share ONE project with other games: every event is tagged `app` (below), so
// you filter PostHog insights/dashboards by `app = mech-tide` to separate them.
const POSTHOG_KEY = "phc_CuTrrwvvBx54Wm2pxor6hDm2Xy3bdakZnFm95cUHgvsV"; // public client key (safe to embed)
const POSTHOG_HOST = "https://us.i.posthog.com"; // US Cloud
const APP = "mech-tide"; // event tag so multiple games can live in one project
// Session replay: ON for the Callum-friends test ONLY. TURN OFF before the
// public launch (see docs/TODO.md launch checklist). Also requires enabling
// Session + Canvas recording in the PostHog project settings (canvas capture is
// a dashboard toggle — without it the Phaser battle records blank).
const SESSION_REPLAY = true;

type PH = { capture: (event: string, props?: Record<string, unknown>) => void };
let ph: PH | null = null;
let playedMs = 0; // accumulated ACTIVE play time, flushed in chunks

export async function initAnalytics(): Promise<void> {
  if (!POSTHOG_KEY || import.meta.env.DEV) return; // off when unconfigured / in dev
  // Never send from localhost / preview builds (the Claude Code preview, local
  // `vite preview`, etc.) so test traffic never reaches the data — no per-
  // browser opt-out flag to remember.
  const host = location.hostname;
  if (host === "localhost" || host === "127.0.0.1" || host === "0.0.0.0" || host.endsWith(".local")) return;
  // Self-exclude your own sessions: load the game once with ?notrack=1 on each
  // of your browsers (persisted); ?notrack=0 undoes it. Keeps your events AND
  // replays out of the data entirely — PostHog never even loads on opted-out
  // devices.
  try {
    const nt = new URLSearchParams(location.search).get("notrack");
    if (nt === "1") localStorage.setItem("mt_notrack", "1");
    else if (nt === "0") localStorage.removeItem("mt_notrack");
    if (localStorage.getItem("mt_notrack") === "1") return;
  } catch { /* storage blocked — fall through and track normally */ }
  try {
    const { default: posthog } = await import("posthog-js");
    posthog.init(POSTHOG_KEY, {
      api_host: POSTHOG_HOST,
      autocapture: false,     // canvas game — we send explicit events, not DOM clicks
      capture_pageview: true,
      persistence: "localStorage",
      disable_session_recording: !SESSION_REPLAY, // replay for the friend test; off before launch
    });
    posthog.register({ app: APP }); // tag every event so games can share a project
    ph = posthog as unknown as PH;
    track("app_open", { version: GAME_VERSION });
    // Capture time even if the player just closes the tab.
    document.addEventListener("visibilitychange", () => { if (document.hidden) flushPlaytime(); });
    window.addEventListener("pagehide", flushPlaytime);
  } catch { /* blocked / failed — analytics is best-effort, never fatal */ }
}

export function track(event: string, props?: Record<string, unknown>): void {
  if (!ph) return;
  try { ph.capture(event, props); } catch { /* ignore */ }
}

/** Add active play time (called each frame while a wave is live, in seconds). */
export function addPlaytime(seconds: number): void { playedMs += seconds * 1000; }

/** Send accumulated active time as a chunk; PostHog sums `seconds` per person. */
export function flushPlaytime(): void {
  const sec = Math.round(playedMs / 1000);
  playedMs = 0;
  if (sec > 0) track("playtime", { seconds: sec });
}
