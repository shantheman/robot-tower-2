/** Category iconography — the five SVG glyphs from docs/design/panels.jsx v3
 * (CatIcon). stroke/fill use currentColor so CSS decides the tint. */

export type Category = "CANNON" | "DEFENSE" | "DRONE" | "ECONOMY" | "ULTIMATES";

const ATTRS = `width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"`;

export const CAT_ICONS: Record<Category, string> = {
  CANNON: `<svg ${ATTRS}><circle cx="12" cy="12" r="7"/><path d="M12 2v3M12 19v3M2 12h3M19 12h3"/></svg>`,
  DEFENSE: `<svg ${ATTRS}><path d="M12 3l7 3v5c0 4-3 7-7 9-4-2-7-5-7-9V6z"/></svg>`,
  DRONE: `<svg ${ATTRS}><circle cx="6" cy="6" r="2.4"/><circle cx="18" cy="6" r="2.4"/><circle cx="6" cy="18" r="2.4"/><circle cx="18" cy="18" r="2.4"/><path d="M8 8l3 3M16 8l-3 3M8 16l3-3M16 16l-3-3"/></svg>`,
  ECONOMY: `<svg ${ATTRS}><circle cx="12" cy="12" r="8"/><path d="M12 8v8M9.6 9.6h3.4a2 2 0 010 4H9.6"/></svg>`,
  ULTIMATES: `<svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor" stroke="none"><path d="M13 2L4.5 13.5H11l-1 8.5L19.5 10H13z"/></svg>`,
};

export function catIcon(cat: Category): string {
  return `<span class="cat-icon">${CAT_ICONS[cat]}</span>`;
}
