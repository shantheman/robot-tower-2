/** Save codes — a portable text form of the localStorage save:
 * "CD1." + base64url(JSON). Built ahead of the custom-domain move
 * (saves are per-origin; codes let players carry progress across), and
 * doubles as phone->desktop transfer. Pure module: unit-tested. */

export const SAVE_CODE_PREFIX = "CD1.";

export function encodeSave(json: string): string {
  const b64 = btoa(String.fromCharCode(...new TextEncoder().encode(json)))
    .replaceAll("+", "-").replaceAll("/", "_").replace(/=+$/, "");
  return SAVE_CODE_PREFIX + b64;
}

/** Returns the save JSON, or null for anything malformed (wrong prefix,
 * bad base64, non-object JSON). The GameState loader stays the second
 * line of defense — it type-coerces every field it reads. */
export function decodeSave(code: string): string | null {
  const t = code.trim();
  if (!t.startsWith(SAVE_CODE_PREFIX)) return null;
  try {
    let b64 = t.slice(SAVE_CODE_PREFIX.length).replaceAll("-", "+").replaceAll("_", "/");
    while (b64.length % 4) b64 += "=";
    const bytes = Uint8Array.from(atob(b64), (c) => c.charCodeAt(0));
    const json = new TextDecoder().decode(bytes);
    const d: unknown = JSON.parse(json);
    if (typeof d !== "object" || d === null || Array.isArray(d)) return null;
    return json;
  } catch {
    return null;
  }
}
