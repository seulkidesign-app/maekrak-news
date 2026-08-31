import { NextRequest } from "next/server";
import { proxy } from "../proxy.ts";

const failures = [];
const passes = [];
function check(name, condition) {
  if (condition) passes.push(name);
  else failures.push(name);
}

function request(accept, userAgent = "Mozilla/5.0") {
  return proxy(new NextRequest("https://maekrak.example/", {
    headers: {
      accept,
      "user-agent": userAgent,
    },
  }));
}

const refused = request("text/html, text/markdown;q=0");
check("q=0 explicitly refuses markdown representation", refused.headers.get("X-Agent-Representation") !== "markdown");

const malformed = request("text/html, text/markdown;q=bogus");
check("malformed markdown quality cannot force markdown representation", malformed.headers.get("X-Agent-Representation") !== "markdown");

const invalidHigh = request("text/html, text/markdown;q=2");
check("out-of-range markdown quality cannot force markdown representation", invalidHigh.headers.get("X-Agent-Representation") !== "markdown");

const substringTrap = request("application/x-text/markdown, text/html");
check("markdown substring inside another media type does not negotiate markdown", substringTrap.headers.get("X-Agent-Representation") !== "markdown");

const accepted = request("text/markdown; q=0.5, text/html");
check("positive markdown quality still enables markdown representation", accepted.headers.get("X-Agent-Representation") === "markdown");
check("markdown response continues to vary on Accept", (accepted.headers.get("Vary") ?? "").toLowerCase().includes("accept"));

const botRefused = request("text/html, text/markdown;q=0", "GPTBot/1.0");
check("bot refusing markdown falls through to static HTML rather than markdown", botRefused.headers.get("X-Agent-Representation") === "static-html");

console.log(`\nAccept negotiation abuse: ${passes.length} passed / ${failures.length} failed`);
passes.forEach((name) => console.log(`PASS  ${name}`));
failures.forEach((name) => console.error(`FAIL  ${name}`));
if (failures.length) process.exit(1);
