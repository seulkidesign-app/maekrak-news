const { __test } = await import("../lib/news.ts");
const { clean } = __test;

const cases = [
  {
    name: "astral emoji at truncation boundary",
    input: `${"A".repeat(319)}😀tail`,
    maxLength: 320,
    expected: "A".repeat(319),
  },
  {
    name: "supplementary-plane letter at truncation boundary",
    input: `${"가".repeat(319)}𐐀tail`,
    maxLength: 320,
    expected: "가".repeat(319),
  },
];

function hasLoneSurrogate(value) {
  for (let index = 0; index < value.length; index += 1) {
    const code = value.charCodeAt(index);
    if (code >= 0xd800 && code <= 0xdbff) {
      const next = value.charCodeAt(index + 1);
      if (!(next >= 0xdc00 && next <= 0xdfff)) return true;
      index += 1;
    } else if (code >= 0xdc00 && code <= 0xdfff) {
      return true;
    }
  }
  return false;
}

let failed = 0;
for (const testCase of cases) {
  const output = clean(testCase.input, testCase.maxLength);
  if (output !== testCase.expected || hasLoneSurrogate(output) || output.length > testCase.maxLength) {
    failed += 1;
    console.error(`${testCase.name}: truncation split a Unicode scalar value`);
  }
}

const exactBoundary = clean(`${"A".repeat(318)}😀tail`, 320);
if (exactBoundary !== `${"A".repeat(318)}😀` || hasLoneSurrogate(exactBoundary)) {
  failed += 1;
  console.error("complete astral character fitting the boundary was not preserved");
}

const normal = clean("정상 제목", 320);
if (normal !== "정상 제목") {
  failed += 1;
  console.error("normal short text changed unexpectedly");
}

if (failed) process.exit(1);
console.log("Unicode truncation boundary abuse: 4 passed / 0 failed");
