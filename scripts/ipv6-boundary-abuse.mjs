const failures = [];
const passes = [];
const { __test } = await import("../lib/news.ts");

function check(name, condition) {
  if (condition) passes.push(name);
  else failures.push(name);
}

check("public IPv6 article URL remains allowed", Boolean(__test.safeHttpUrl("https://[2606:4700:4700::1111]/story")));
check("IPv6 loopback is rejected", __test.safeHttpUrl("http://[::1]/admin") === "");
check("IPv4-mapped IPv6 loopback is rejected", __test.safeHttpUrl("http://[::ffff:127.0.0.1]/admin") === "");
check("IPv4-mapped IPv6 RFC1918 address is rejected", __test.safeHttpUrl("http://[::ffff:10.0.0.1]/admin") === "");
check("hex IPv4-mapped loopback is rejected", __test.safeHttpUrl("http://[::ffff:7f00:1]/admin") === "");

// Distinct attack class: non-loopback IPv6 ranges that are still non-public.
// A malicious feed must not turn source links into requests to unspecified,
// unique-local (ULA), or link-local infrastructure.
check("IPv6 unspecified address is rejected", __test.safeHttpUrl("http://[::]/admin") === "");
check("IPv6 unique-local fc00::/7 address is rejected", __test.safeHttpUrl("http://[fc00::1]/admin") === "");
check("IPv6 unique-local fd00::/8 address is rejected", __test.safeHttpUrl("http://[fd12:3456:789a::1]/admin") === "");
check("IPv6 link-local fe80::/10 address is rejected", __test.safeHttpUrl("http://[fe80::1]/admin") === "");

// New attack class: special-use IPv6 ranges that are neither ULA nor link-local.
// Deprecated site-local and multicast literals are not public article destinations and
// must not cross the URL trust boundary, while a known global-unicast literal should remain valid.
check("IPv6 deprecated site-local fec0::/10 address is rejected", __test.safeHttpUrl("http://[fec0::1]/admin") === "");
check("IPv6 multicast ff00::/8 address is rejected", __test.safeHttpUrl("http://[ff02::1]/admin") === "");
check("IPv6 global-unicast address remains allowed", Boolean(__test.safeHttpUrl("https://[2001:4860:4860::8888]/story")));

console.log(`IPv6 boundary abuse: ${passes.length} passed / ${failures.length} failed`);
passes.forEach((name) => console.log(`PASS  ${name}`));
failures.forEach((name) => console.error(`FAIL  ${name}`));
if (failures.length) process.exit(1);
