const failures = [];
const passes = [];
function check(name, condition) {
  if (condition) passes.push(name);
  else failures.push(name);
}

const { __test } = await import("../lib/news.ts");
const { sourceForLink, safeHttpUrl } = __test;

check("source-aware link trust helper is available", typeof sourceForLink === "function");
check("safe public URL helper is available", typeof safeHttpUrl === "function");

if (typeof sourceForLink === "function") {
  // New attack class: WHATWG URL parser differential / delimiter normalization.
  // Security checks must follow the hostname produced by the same parser the browser uses,
  // rather than visually scanning the raw URL for a trusted publisher token.
  check(
    "percent-encoded dot cannot turn Reuters prefix into a trusted suffix-trap host",
    sourceForLink("Reuters", "https://reuters%2ecom.evil.example/world/story", "direct") === "Unverified source",
  );
  check(
    "encoded dot after the trusted domain still resolves as an unrelated host",
    sourceForLink("Reuters", "https://reuters.com%2eevil.example/world/story", "direct") === "Unverified source",
  );
  check(
    "aggregator attribution rejects encoded-dot publisher suffix trap",
    sourceForLink(
      "Reuters",
      "https://news.google.com/rss/articles/example",
      "aggregated",
      "https://reuters.com%2eevil.example/story",
    ) === "Unverified source",
  );

  // Backslash is normalized to a path separator for special schemes by WHATWG URL.
  // This looks suspicious in raw text, but the browser destination remains reuters.com;
  // the regression guards against a future raw-string parser disagreeing with browser semantics.
  check(
    "backslash delimiter is evaluated using browser hostname semantics",
    sourceForLink("Reuters", "https://reuters.com\\@evil.example/world/story", "direct") === "Reuters",
  );
}

if (typeof safeHttpUrl === "function") {
  check("encoded slash in hostname is rejected", safeHttpUrl("https://reuters.com%2fevil.example/story") === "");
  check("encoded at-sign in hostname is rejected", safeHttpUrl("https://reuters.com%40evil.example/story") === "");
  check("encoded NUL in hostname is rejected", safeHttpUrl("https://reuters.com%00.evil.example/story") === "");

  const normalizedBackslash = safeHttpUrl("https://reuters.com\\@evil.example/world/story");
  let normalizedHost = "";
  try { normalizedHost = normalizedBackslash ? new URL(normalizedBackslash).hostname : ""; } catch {}
  check("backslash normalization cannot redirect hostname to attacker", normalizedHost === "reuters.com");
}

console.log(`\nURL parser differential abuse: ${passes.length} passed / ${failures.length} failed`);
passes.forEach((name) => console.log(`PASS  ${name}`));
failures.forEach((name) => console.error(`FAIL  ${name}`));
if (failures.length) process.exit(1);
