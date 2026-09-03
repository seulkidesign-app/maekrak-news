const { canonicalSourceName, outletIdentityKey } = await import("../lib/source-normalize.ts");

const hugeAscii = `Outlet ${"A".repeat(250_000)}`;
const hugeCombining = `Outlet ${"A\u0301".repeat(125_000)}`;
const atLimit = "A".repeat(256);
const overLimit = "A".repeat(257);
const normal = "Associated Local Pressroom";

const cases = [
  ["huge ASCII source label", hugeAscii],
  ["huge combining-mark source label", hugeCombining],
  ["one-character-over-limit source label", overLimit],
];

let failed = 0;
for (const [name, value] of cases) {
  const canonical = canonicalSourceName(value);
  const identity = outletIdentityKey(value);
  const safe = canonical === "Unverified source" && identity === "unverified source";
  if (!safe) {
    failed += 1;
    console.error(`${name}: oversized source survived normalization (${canonical.length} canonical chars, ${identity.length} identity chars)`);
  }
}

if (canonicalSourceName(atLimit) === "Unverified source") {
  failed += 1;
  console.error("source label at the 256-character boundary was incorrectly rejected");
}

if (canonicalSourceName(normal) !== normal || outletIdentityKey(normal) !== "associated local pressroom") {
  failed += 1;
  console.error("normal source label was incorrectly rejected");
}

if (failed) process.exit(1);
console.log("Oversized source-label abuse: 5 passed / 0 failed");
