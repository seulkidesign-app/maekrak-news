const base = process.env.E2E_BASE_URL || "http://127.0.0.1:3000";

const failures = [];
const passes = [];

function ok(name, condition, detail = "") {
  if (condition) passes.push(name);
  else failures.push(`${name}${detail ? ` — ${detail}` : ""}`);
}

async function request(path, init = {}) {
  try {
    return await fetch(`${base}${path}`, {
      redirect: "follow",
      signal: AbortSignal.timeout(30000),
      ...init,
    });
  } catch (error) {
    failures.push(`request ${path} — ${error instanceof Error ? error.message : String(error)}`);
    return null;
  }
}

async function textOf(response) {
  return response ? await response.text() : "";
}

async function run() {
  const home = await request("/");
  const homeText = await textOf(home);
  ok("home returns 200", home?.status === 200, `status=${home?.status}`);
  ok("home renders brand", homeText.includes("맥락"));
  ok("no javascript href in home", !/href=["']\s*javascript:/i.test(homeText));
  ok("no data html href in home", !/href=["']\s*data:text\/html/i.test(homeText));
  ok("no double-escaped numeric entity leaks", !/&amp;#(?:x?[0-9a-f]+);/i.test(homeText));
  ok("no unfinished reviewed-history placeholder", !homeText.includes("검수 후 추가 예정"));
  ok("no obvious invalid rendered values", !/>\s*(?:undefined|NaN|Invalid Date)\s*</i.test(homeText));

  const blankLinks = homeText.match(/<a\b[^>]*target=["']_blank["'][^>]*>/gi) ?? [];
  ok("blank links use noreferrer", blankLinks.every((tag) => /rel=["'][^"']*noreferrer/i.test(tag)), `${blankLinks.length} target=_blank links checked`);

  const headers = home?.headers;
  ok("nosniff header present", headers?.get("x-content-type-options") === "nosniff");
  ok("frame protection present", headers?.get("x-frame-options") === "DENY");
  ok("referrer policy present", headers?.get("referrer-policy") === "strict-origin-when-cross-origin");
  ok("permissions policy present", (headers?.get("permissions-policy") ?? "").includes("camera=()"));
  const csp = headers?.get("content-security-policy") ?? "";
  ok("CSP blocks objects", csp.includes("object-src 'none'"));
  ok("CSP blocks framing", csp.includes("frame-ancestors 'none'"));

  const en = await request("/?lang=en");
  const enText = await textOf(en);
  ok("english route returns 200", en?.status === 200, `status=${en?.status}`);
  ok("english route renders english brand", enText.includes("Context"));

  const invalidLang = await request("/?lang=xx");
  const invalidLangText = await textOf(invalidLang);
  ok("invalid lang does not 5xx", Boolean(invalidLang && invalidLang.status < 500), `status=${invalidLang?.status}`);
  ok("invalid lang safely falls back", invalidLangText.includes("맥락"));

  const xss = `<script>alert("maekrak-xss")</script>`;
  const xssResponse = await request(`/?lang=${encodeURIComponent(xss)}`);
  const xssText = await textOf(xssResponse);
  ok("XSS query does not 5xx", Boolean(xssResponse && xssResponse.status < 500), `status=${xssResponse?.status}`);
  ok("XSS payload is not reflected as executable markup", !xssText.includes(xss));

  const svgXss = `<svg/onload=alert('maekrak')>`;
  const svgResponse = await request(`/?v=${encodeURIComponent(svgXss)}`);
  const svgText = await textOf(svgResponse);
  ok("SVG-style XSS query does not 5xx", Boolean(svgResponse && svgResponse.status < 500), `status=${svgResponse?.status}`);
  ok("SVG payload is not reflected as executable markup", !svgText.includes(svgXss));

  const crlf = await request("/?lang=%0D%0ASet-Cookie%3A%20maekrak_evil%3D1");
  ok("CRLF query does not 5xx", Boolean(crlf && crlf.status < 500), `status=${crlf?.status}`);
  ok("CRLF does not inject cookie", !(crlf?.headers.get("set-cookie") ?? "").includes("maekrak_evil"));

  const repeatedLang = await request("/?lang=en&lang=ko&lang=%3Csvg%20onload%3Dalert(1)%3E");
  ok("repeated query keys do not 5xx", Boolean(repeatedLang && repeatedLang.status < 500), `status=${repeatedLang?.status}`);

  const malformed = await request("/?lang=%E0%A4%A");
  ok("malformed encoding never becomes 5xx", Boolean(malformed && malformed.status < 500), `status=${malformed?.status}`);

  const huge = "a".repeat(4096);
  const hugeResponse = await request(`/?lang=${huge}`);
  ok("large query is rejected or handled without 5xx", Boolean(hugeResponse && (hugeResponse.status < 500 || [414, 431].includes(hugeResponse.status))), `status=${hugeResponse?.status}`);

  const traversal = await request("/%2e%2e/%2e%2e/etc/passwd");
  const traversalText = await textOf(traversal);
  ok("path traversal does not 5xx", Boolean(traversal && traversal.status < 500), `status=${traversal?.status}`);
  ok("path traversal never exposes passwd", !traversalText.includes("root:x:"));

  for (const method of ["POST", "PUT", "DELETE"]) {
    const response = await request("/", { method, body: method === "DELETE" ? undefined : "malicious=1", headers: { "content-type": "application/x-www-form-urlencoded" } });
    ok(`${method} on page never 5xx`, Boolean(response && response.status < 500), `status=${response?.status}`);
    ok(`${method} on page is not accepted as normal page`, response?.status !== 200, `status=${response?.status}`);
  }

  const qa = await request("/qa");
  const qaText = await textOf(qa);
  ok("QA route returns 200", qa?.status === 200, `status=${qa?.status}`);
  ok("QA route is noindex", /name=["']robots["'][^>]*content=["'][^"']*noindex/i.test(qaText) || /content=["'][^"']*noindex[^"']*["'][^>]*name=["']robots/i.test(qaText));

  const og = await request("/og-image?v=e2e");
  const ogType = og?.headers.get("content-type") ?? "";
  const ogBytes = og ? (await og.arrayBuffer()).byteLength : 0;
  ok("OG route returns 200", og?.status === 200, `status=${og?.status}`);
  ok("OG route returns image", ogType.startsWith("image/png"), `content-type=${ogType}`);
  ok("OG image is non-trivial", ogBytes > 5000, `bytes=${ogBytes}`);

  const missing = await request("/this-route-must-not-exist-e2e");
  ok("unknown route is 404", missing?.status === 404, `status=${missing?.status}`);

  const burst = await Promise.all([request("/?e2e=1"), request("/?e2e=2"), request("/?e2e=3"), request("/?e2e=4"), request("/?e2e=5")]);
  ok("small concurrent burst stays healthy", burst.every((response) => response?.status === 200), burst.map((response) => response?.status).join(","));

  console.log(`\nAdversarial E2E: ${passes.length} passed / ${failures.length} failed`);
  passes.forEach((name) => console.log(`PASS  ${name}`));
  failures.forEach((name) => console.error(`FAIL  ${name}`));

  if (failures.length) process.exit(1);
}

run().catch((error) => {
  console.error(error);
  process.exit(1);
});
