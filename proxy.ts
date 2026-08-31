import { NextResponse, type NextRequest } from "next/server";

const ALLOWED = new Set(["GET", "HEAD"]);
const AGENT_UA = /GPTBot|ChatGPT-User|ClaudeBot|Claude-SearchBot|PerplexityBot|DeepSeekBot|Google-Extended|Applebot-Extended/i;

function acceptsMarkdown(accept: string) {
  return accept.split(",").some((entry) => {
    const [rawType, ...rawParams] = entry.split(";");
    if (rawType.trim().toLowerCase() !== "text/markdown") return false;

    const qualityParam = rawParams
      .map((param) => param.trim())
      .find((param) => /^q\s*=/i.test(param));
    if (!qualityParam) return true;

    const quality = Number(qualityParam.replace(/^q\s*=\s*/i, ""));
    return Number.isFinite(quality) && quality > 0 && quality <= 1;
  });
}

export function proxy(request: NextRequest) {
  if (!ALLOWED.has(request.method)) {
    return new NextResponse(null, {
      status: 405,
      headers: { Allow: "GET, HEAD" },
    });
  }

  if (request.nextUrl.pathname === "/") {
    const accept = request.headers.get("accept") ?? "";
    if (acceptsMarkdown(accept)) {
      const response = NextResponse.rewrite(new URL("/agent-info.md", request.url));
      response.headers.set("Vary", "Accept, Accept-Encoding");
      response.headers.set("X-Agent-Representation", "markdown");
      return response;
    }

    const userAgent = request.headers.get("user-agent") ?? "";
    if (AGENT_UA.test(userAgent)) {
      const response = NextResponse.rewrite(new URL("/agent-info", request.url));
      response.headers.set("Vary", "User-Agent, Accept-Encoding");
      response.headers.set("X-Agent-Representation", "static-html");
      return response;
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/", "/qa"],
};
