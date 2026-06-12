/** Save codes round-trip and reject garbage — the codec carries player
 * progress across origins (the custom-domain move) and devices. */

import { describe, expect, it } from "vitest";
import { decodeSave, encodeSave, SAVE_CODE_PREFIX } from "../src/sim/savecode";

describe("save codes", () => {
  it("round-trips a real save shape (unicode included)", () => {
    const json = JSON.stringify({
      save_version: 1, cores: 1234, tower_level: 7, level: 9, best_wave: 88,
      skills: ["multi", "pierce"], achievements: ["boss"], volume: 0.55,
      reduce_motion: false, note: "héllo 🤖",
    });
    const code = encodeSave(json);
    expect(code.startsWith(SAVE_CODE_PREFIX)).toBe(true);
    expect(code).not.toMatch(/[+/=]/); // base64url: paste-safe everywhere
    expect(decodeSave(code)).toBe(json);
    expect(decodeSave(`  ${code}\n`)).toBe(json); // tolerate sloppy pastes
  });

  it("rejects garbage in all the obvious ways", () => {
    expect(decodeSave("")).toBeNull();
    expect(decodeSave("not a code")).toBeNull();
    expect(decodeSave("CD1.!!!not-base64!!!")).toBeNull();
    expect(decodeSave(encodeSave("[1,2,3]"))).toBeNull();   // array, not object
    expect(decodeSave(encodeSave("\"str\""))).toBeNull();   // not an object
    expect(decodeSave(encodeSave("{broken"))).toBeNull();   // invalid JSON
    expect(decodeSave("XX9." + encodeSave("{}").slice(4))).toBeNull(); // wrong prefix
  });
});
