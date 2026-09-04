import { canonicalSourceName } from "../lib/source-normalize.ts";

const MAX_SOURCE_LABEL_LENGTH = 256;
const expandingLigature = "ﬃ";

let failed = 0;

const oversizedAfterNormalization = expandingLigature.repeat(86); // 86 UTF-16 code units -> 258 chars after NFKC
const oversizedResult = canonicalSourceName(oversizedAfterNormalization);
if (oversizedResult !== "Unverified source") {
  failed += 1;
  console.error(`NFKC expansion bypassed source label cap: input=${oversizedAfterNormalization.length}, output=${oversizedResult.length}`);
}

const exactSafeBoundary = expandingLigature.repeat(85); // 255 chars after NFKC
const boundaryResult = canonicalSourceName(exactSafeBoundary);
if (boundaryResult === "Unverified source" || boundaryResult.length > MAX_SOURCE_LABEL_LENGTH) {
  failed += 1;
  console.error(`safe NFKC-expanded source at boundary was rejected or oversized: output=${boundaryResult.length}`);
}

const ordinary = canonicalSourceName("Example Daily");
if (ordinary !== "Example Daily") {
  failed += 1;
  console.error(`ordinary unknown outlet changed unexpectedly: ${ordinary}`);
}

if (failed) process.exit(1);
console.log("Source normalization expansion abuse: 3 passed / 0 failed");
