const failures = [];
const passes = [];
const { __test } = await import("../lib/news.ts");

function check(name, condition) {
  if (condition) passes.push(name);
  else failures.push(name);
}

// New attack class: special-use IPv4 literals that are syntactically valid but
// are not legitimate public article destinations. Accepting them can launder
// broken/internal-looking links through the same trust boundary as public URLs.
check("TEST-NET-1 documentation address is rejected", __test.safeHttpUrl("https://192.0.2.1/story") === "");
check("benchmark network is rejected", __test.safeHttpUrl("https://198.18.0.1/story") === "");
check("TEST-NET-2 documentation address is rejected", __test.safeHttpUrl("https://198.51.100.7/story") === "");
check("TEST-NET-3 documentation address is rejected", __test.safeHttpUrl("https://203.0.113.9/story") === "");
check("IETF protocol-assignment block is rejected", __test.safeHttpUrl("https://192.0.0.170/story") === "");

// Guard against over-blocking ordinary globally routable IPv4 literals.
check("public IPv4 address remains allowed", Boolean(__test.safeHttpUrl("https://8.8.8.8/story")));

console.log(`Special-use IPv4 abuse: ${passes.length} passed / ${failures.length} failed`);
passes.forEach((name) => console.log(`PASS  ${name}`));
failures.forEach((name) => console.error(`FAIL  ${name}`));
if (failures.length) process.exit(1);
