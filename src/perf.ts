/** Live render-quality throttle, driven by measured FPS (see
 * BattleScene.updatePerf). `fx` scales the heavy additive explosion particle
 * counts: 1 = full quality; <1 thins them. It only drops below 1 when a device
 * is genuinely dropping frames (or reduce-motion is on), so hardware that holds
 * ~60fps is never touched. NOT persisted — purely a runtime knob. */
export const perf = { fx: 1 };
