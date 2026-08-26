const HANGUL = /[가-힣]/;
const SOURCE_UNCERTAINTY = /\b(may|might|could|reportedly|alleged|allegedly|estimated|likely|unconfirmed|possible|possibly|appears?)\b/i;
const TARGET_UNCERTAINTY = /수 있|가능|가능성|보도|알려|의혹|혐의|추정|예상|미확인|것으로 보|듯하/;
const SOURCE_NEGATION = /\b(not|no|never|without|denies?|denied|rejects?|rejected|fails? to|failed to)\b/i;
const TARGET_NEGATION = /아니|않|없|못|부인|거부|실패|않았|않는|없는/;

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

function numberTokens(text: string) {
  return (text.match(/\d+(?:[.,]\d+)*/g) ?? []).map((value) => value.replace(/,/g, "")).sort();
}

function sameNumbers(source: string, translated: string) {
  const left = numberTokens(source);
  const right = numberTokens(translated);
  if (left.length !== right.length) return false;
  return left.every((value, index) => value === right[index]);
}

function translationPreservesMeaningSignals(source: string, translated: string) {
  if (!sameNumbers(source, translated)) return false;
  if (SOURCE_UNCERTAINTY.test(source) && !TARGET_UNCERTAINTY.test(translated)) return false;
  if (SOURCE_NEGATION.test(source) && !TARGET_NEGATION.test(translated)) return false;
  return true;
}

export function sourceTranslationRisk(text: string) {
  const risks: string[] = [];
  if (SOURCE_UNCERTAINTY.test(text)) risks.push("uncertainty");
  if (SOURCE_NEGATION.test(text)) risks.push("negation");
  if (numberTokens(text).length > 0) risks.push("numbers");
  return risks;
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
      headers: { "User-Agent": "MaekrakNews/7.0" },
      signal: controller.signal,
    });
    if (!response.ok) return null;
    const data = await response.json() as { responseData?: { translatedText?: string } };
    const translated = decodeEntities(data.responseData?.translatedText ?? "").replace(/\s+/g, " ").trim();
    if (!translated || translated.toLowerCase() === q.toLowerCase()) return null;
    if (!translationPreservesMeaningSignals(q, translated)) return null;
    return translated;
  } catch {
    return null;
  } finally {
    clearTimeout(timeout);
  }
}
