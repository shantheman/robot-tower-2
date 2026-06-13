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

// Public client key — safe to embed in the client. Paste the Mech Tide PostHog
// PROJECT key here to turn analytics on; leave blank to keep it fully off.
const POSTHOG_KEY = "";
const POSTHOG_HOST = "https://us.i.posthog.com"; // EU region: https://eu.i.posthog.com

type PH = { capture: (event: string, props?: Record<string, unknown>) => void };
let ph: PH | null = null;
let playedMs = 0; // accumulated ACTIVE play time, flushed in chunks

export async function initAnalytics(): Promise<void> {
  if (!POSTHOG_KEY || import.meta.env.DEV) return; // off when unconfigured / in dev
  try {
    const { default: posthog } = await import("posthog-js");
    posthog.init(POSTHOG_KEY, {
      api_host: POSTHOG_HOST,
      autocapture: false,     // canvas game — we send explicit events, not DOM clicks
      capture_pageview: true,
      persistence: "localStorage",
    });
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
