/** Base for the screen-registered DOM panels (shop, skills, home, dead,
 * pause). Owns the root element, the Game-controller registration, and the
 * show/hide + scroll contract:
 *   - a fresh open starts any .panel-scroll region at the top;
 *   - setHtml() preserves the scroll position across re-renders, so buying
 *     mid-list never jumps the view (the bug this class was born from). */

import { game, Screen } from "../game";

export abstract class Panel {
  protected root: HTMLElement;

  constructor(parent: HTMLElement, id: string, screen: Screen, className = "panel-screen") {
    this.root = document.createElement("div");
    this.root.id = id;
    this.root.className = `${className} hidden`;
    parent.appendChild(this.root);
    game.register(screen, {
      onShow: () => {
        this.render();
        const sc = this.root.querySelector(".panel-scroll");
        if (sc) sc.scrollTop = 0;
        this.root.classList.remove("hidden");
      },
      onHide: () => this.root.classList.add("hidden"),
    });
  }

  /** innerHTML swap that keeps the .panel-scroll position (if present). */
  protected setHtml(html: string): void {
    const keep = this.root.querySelector(".panel-scroll")?.scrollTop ?? 0;
    this.root.innerHTML = html;
    const sc = this.root.querySelector(".panel-scroll");
    if (sc) sc.scrollTop = keep;
  }

  abstract render(): void;
}
