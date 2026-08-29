import assert from "node:assert/strict";
import { canonicalSourceName, canonicalOutletCount } from "../lib/source-normalize.ts";

// Pure Cyrillic lookalikes evade a mixed-script-only detector while rendering close to trusted brands.
assert.equal(canonicalSourceName("ВВС"), "Unverified source", "Cyrillic BBC lookalike must not become an independent outlet");
assert.equal(canonicalSourceName("АР"), "Unverified source", "Cyrillic AP lookalike must not become an independent outlet");
assert.equal(canonicalSourceName("ЅВЅ"), "Unverified source", "Cyrillic SBS lookalike must not become an independent outlet");

// Existing mixed-script defense should remain intact.
assert.equal(canonicalSourceName("Rеuters"), "Unverified source", "mixed Latin/Cyrillic Reuters spoof must remain blocked");

// Legitimate trusted names and unrelated non-Latin publishers must not be damaged.
assert.equal(canonicalSourceName("BBC"), "BBC");
assert.equal(canonicalSourceName("AP"), "AP");
assert.equal(canonicalSourceName("Новости"), "Новости", "ordinary Cyrillic outlet names should remain representable");

const count = canonicalOutletCount([
  { source: "BBC" },
  { source: "ВВС" },
  { source: "АР" },
  { source: "ЅВЅ" },
]);
assert.equal(count, 2, "trusted brand spoofs must collapse to Unverified source rather than inflate outlet diversity");

console.log("trusted-brand homoglyph abuse: PASS");
