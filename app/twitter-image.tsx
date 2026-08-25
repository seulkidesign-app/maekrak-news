import { ImageResponse } from "next/og";
import { SocialImage } from "./social-image";

export const alt = "맥락 — 오늘의 한국과 세계를, 하나의 흐름으로";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function TwitterImage() {
  return new ImageResponse(<SocialImage />, size);
}
