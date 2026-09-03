const { truncateExternalText } = await import("../lib/source-normalize.ts");

const cases = [
  {
    name: "astral emoji at truncation boundary",
    input: `${"A".repeat(319)}😀tail`,
    maxLength: 320,
    expected: `${"A".repeat(319)}😀`,
  },
  {
    name: "supplementary-plane letter at truncation boundary",
    input: `${"가".repeat(319)}𐐀tail`,
    maxLength: 320,
    expected: `${"가".repeat(319)}𐐀`,
  },
];

let failed = 0;
for (const testCase of cases) {
  const output = truncateExternalText(testCase.input, testCase.maxLength);
  const hasLoneSurrogate = /[\uD800-\uDFFF]/u.test(output.replace(/[\uD800-\uDBFF][\uDC00-\uDFFF]/g, ""));
  if (output !== testCase.expected || hasLoneSurrogate) {
    failed += 1;
    console.error(`${testCase.name}: truncation split a Unicode scalar value`);
  }
}

const normal = truncateExternalText("정상 제목", 320);
if (normal !== "정상 제목") {
  failed += 1;
  console.error("normal short text changed unexpectedly");
}

if (failed) process.exit(1);
console.log("Unicode truncation boundary abuse: 3 passed / 0 failed");
