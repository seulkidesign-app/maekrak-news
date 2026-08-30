const failures = [];
const passes = [];
function check(name, condition) {
  if (condition) passes.push(name);
  else failures.push(name);
}

const { canonicalSourceName, canonicalOutletCount } = await import("../lib/source-normalize.ts");

const greekAlphaAlJazeera = "Αl Jazeera"; // Greek Alpha U+0391
const cyrillicWDeutscheWelle = "Deutsche Ԝelle"; // Cyrillic Komi Zje U+051C, visually W-like
const greekOmicronYonhap = "Yοnhap"; // Greek omicron U+03BF
const greekAlphaAssociatedPress = "Αssociated Press"; // Greek Alpha U+0391

check("Greek-alpha Al Jazeera spoof is downgraded", canonicalSourceName(greekAlphaAlJazeera) === "Unverified source");
check("Cyrillic-W Deutsche Welle spoof is downgraded", canonicalSourceName(cyrillicWDeutscheWelle) === "Unverified source");
check("Greek-omicron Yonhap spoof is downgraded", canonicalSourceName(greekOmicronYonhap) === "Unverified source");
check("Greek-alpha Associated Press spoof is downgraded", canonicalSourceName(greekAlphaAssociatedPress) === "Unverified source");
check("extended homoglyph aliases cannot inflate outlet diversity", canonicalOutletCount([
  { source: "Al Jazeera" },
  { source: greekAlphaAlJazeera },
  { source: "DW" },
  { source: cyrillicWDeutscheWelle },
]) === 3);
check("benign multilingual outlet remains preserved", canonicalSourceName("Meduza Россия") === "Meduza Россия");

console.log(`Extended trusted-brand homoglyph abuse: ${passes.length} passed / ${failures.length} failed`);
passes.forEach((name) => console.log(`PASS  ${name}`));
failures.forEach((name) => console.error(`FAIL  ${name}`));
if (failures.length) process.exit(1);
