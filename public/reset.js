// Escape hatch: /?reset wipes the save BEFORE any game module loads
// (modules read the save at import time; this classic script runs first —
// external rather than inline so the production CSP can be script-src 'self').
if (new URLSearchParams(location.search).has("reset")) {
  localStorage.removeItem("rts2_save");
  history.replaceState(null, "", location.pathname);
}
