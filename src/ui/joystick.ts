/** Touch aim joystick — the styled puck in index.html. A relative analog stick:
 * the angle from its centre to the thumb sets the gun heading, and holding it
 * also fires (BattleScene reads `joystick.active`). DOM-rendered so it can use
 * the handoff's gradients/shadows; the battlefield itself still handles
 * tap/hold-to-aim via Phaser pointers. Desktop never shows it (CSS) so it never
 * goes active there. Positioned in a bottom corner by handedness (CSS). */

export const joystick = { active: false, angle: 0 }; // angle in radians (screen == world heading)

export function initJoystick(): void {
  const el = document.getElementById("joystick");
  const knob = el?.querySelector<HTMLElement>(".joy-knob");
  if (!el || !knob) return;

  const update = (e: PointerEvent): void => {
    const r = el.getBoundingClientRect();
    const dx = e.clientX - (r.left + r.width / 2);
    const dy = e.clientY - (r.top + r.height / 2);
    const d = Math.hypot(dx, dy) || 1;
    joystick.angle = Math.atan2(dy, dx);
    const cl = Math.min(d, r.width * 0.3); // clamp knob travel to ~30% of the puck
    knob.style.transform = `translate(calc(-50% + ${(dx / d) * cl}px), calc(-50% + ${(dy / d) * cl}px))`;
  };
  const release = (e: PointerEvent): void => {
    if (!joystick.active) return;
    joystick.active = false;
    el.classList.remove("active");
    knob.style.transform = "translate(-50%, -50%)";
    try { el.releasePointerCapture(e.pointerId); } catch { /* ignore */ }
  };

  el.addEventListener("pointerdown", (e) => {
    e.preventDefault();
    joystick.active = true;
    el.classList.add("active");
    try { el.setPointerCapture(e.pointerId); } catch { /* ignore */ }
    update(e);
  });
  el.addEventListener("pointermove", (e) => { if (joystick.active) update(e); });
  el.addEventListener("pointerup", release);
  el.addEventListener("pointercancel", release);
}
