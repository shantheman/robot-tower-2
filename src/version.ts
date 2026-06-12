/** package.json is the single source of the version (sync'd 2026-06-12).
 * Bump it alongside a CHANGELOG entry whenever a meaningful change ships,
 * then tag — see CLAUDE.md "Versioning". */
import pkg from "../package.json";

export const GAME_VERSION: string = pkg.version;
