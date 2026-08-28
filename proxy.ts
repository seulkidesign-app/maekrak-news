import { NextResponse, type NextRequest } from "next/server";

const READ_METHODS = new Set(["GET", "HEAD"]);

export function proxy(request: NextRequest) {
  if (request.method === "OPTIONS") {
    return new NextResponse(null, {
      status: 204,
      headers: {
        Allow: "GET, HEAD, OPTIONS",
        "Access-Control-Allow-Methods": "GET, HEAD, OPTIONS",
      },
    });
  }

  if (!READ_METHODS.has(request.method)) {
    return new NextResponse(null, {
      status: 405,
      headers: { Allow: "GET, HEAD, OPTIONS" },
    });
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/", "/qa"],
};
