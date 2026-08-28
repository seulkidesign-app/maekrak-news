import { NextResponse, type NextRequest } from "next/server";

const ALLOWED = new Set(["GET", "HEAD"]);

export function proxy(request: NextRequest) {
  if (!ALLOWED.has(request.method)) {
    return new NextResponse(null, {
      status: 405,
      headers: { Allow: "GET, HEAD" },
    });
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/", "/qa"],
};
