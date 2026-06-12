/** Escape a value for interpolation into the panels' innerHTML templates.
 *
 * The rule (see CLAUDE.md "Conventions"): numbers and string literals from
 * config tables may interpolate bare; ANY string that has ever passed
 * through storage, a URL, or user input goes through esc(). Today the
 * config-table names/descriptions are wrapped too — cheap insurance that
 * keeps the habit visible at every interpolation site. */
export function esc(v: string | number): string {
  return String(v)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}
