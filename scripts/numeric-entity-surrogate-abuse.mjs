const { __test } = await import("../lib/news.ts");
const { clean, decodeEntities } = __test;

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

const attacks = [
  ["decimal high surrogate", "Headline &#55296; injected"],
  ["decimal low surrogate", "Headline &#56320; injected"],
  ["hex high surrogate", "Headline &#xD800; injected"],
  ["hex low surrogate", "Headline &#xDC00; injected"],
];

let failed = 0;
for (const [name, input] of attacks) {
  const decoded = decodeEntities(input);
  const output = clean(input, 320);
  if (hasLoneSurrogate(decoded) || hasLoneSurrogate(output)) {
    failed += 1;
    console.error(`${name}: numeric entity produced a lone UTF-16 surrogate`);
  }
}

const validAstral = clean("Valid &#128512; emoji", 320);
if (validAstral !== "Valid 😀 emoji" || hasLoneSurrogate(validAstral)) {
  failed += 1;
  console.error("valid supplementary-plane numeric entity was not preserved");
}

const outOfRange = clean("Bad &#1114112; scalar", 320);
if (outOfRange !== "Bad � scalar" || hasLoneSurrogate(outOfRange)) {
  failed += 1;
  console.error("out-of-range numeric entity did not fail closed");
}

if (failed) process.exit(1);
console.log("Numeric entity surrogate abuse: 6 passed / 0 failed");
