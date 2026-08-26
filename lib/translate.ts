const HANGUL = /[가-힣]/;

function decodeEntities(text: string) {
  return text
    .replace(/&#(\d+);/g, (_, code) => String.fromCodePoint(Number(code)))
    .replace(/&#x([0-9a-f]+);/gi, (_, code) => String.fromCodePoint(parseInt(code, 16)))
    .replace(/&quot;/g, '"')
    .replace(/&#39;|&apos;/g, "'")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">");
}

function utf8SafeSlice(text: string, maxBytes = 460) {
  let result = "";
  for (const char of text) {
    if (Buffer.byteLength(result + char, "utf8") > maxBytes) break;
    result += char;
  }
  return result.trim();
}

export async function translateToKorean(text: string): Promise<string | null> {
  const input = decodeEntities(String(text ?? "").replace(/\s+/g, " ").trim());
  if (!input || HANGUL.test(input)) return input || null;

  const q = utf8SafeSlice(input);
  if (!q) return null;

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 3500);
  try {
    const url = `https://api.mymemory.translated.net/get?q=${encodeURIComponent(q)}&langpair=en%7Cko&mt=1`;
    const response = await fetch(url, {
      next: { revalidate: 86400 },
      headers: { "User-Agent": "MaekrakNews/6.0" },
      signal: controller.signal,
    });
    if (!response.ok) return null;
    const data = await response.json() as { responseData?: { translatedText?: string } };
    const translated = decodeEntities(data.responseData?.translatedText ?? "").replace(/\s+/g, " ").trim();
    if (!translated || translated.toLowerCase() === q.toLowerCase()) return null;
    return translated;
  } catch {
    return null;
  } finally {
    clearTimeout(timeout);
  }
}
