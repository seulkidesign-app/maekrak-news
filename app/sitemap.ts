import type { MetadataRoute } from "next";

const base = "https://maekrak-news-rrrb-gamma.vercel.app";

export default function sitemap(): MetadataRoute.Sitemap {
  return [
    { url: `${base}/`, changeFrequency: "daily", priority: 1 },
    { url: `${base}/agent-info`, changeFrequency: "weekly", priority: 0.5 },
  ];
}
