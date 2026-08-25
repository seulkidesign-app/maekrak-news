import { ImageResponse } from "next/og";
import { SocialImage } from "../social-image";

export const runtime = "edge";

export async function GET() {
  return new ImageResponse(<SocialImage />, {
    width: 1200,
    height: 630,
    headers: {
      "Cache-Control": "public, max-age=86400, s-maxage=86400",
    },
  });
}
