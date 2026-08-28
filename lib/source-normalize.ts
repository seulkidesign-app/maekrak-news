const TRUSTED_BRAND_TOKENS = /\b(reuters|associated press|ap news|yonhap|bbc|kbs|mbc|sbs|al jazeera|deutsche welle|dw|nhk)\b|연합뉴스/i;
const PLACEHOLDER_OUTLET = /^(?:unknown|unknown source|source unknown|unverified source|source unavailable|unavailable source|n\/?a|na|none|null|-)$/i;

function hasSuspiciousMixedScripts(value: string) {
  const hasLatin = /\p{Script=Latin}/u.test(value);
  const hasCyrillicOrGreek = /[\p{Script=Cyrillic}\p{Script=Greek}]/u.test(value);
  return hasLatin && hasCyrillicOrGreek;
}

function canonicalUnknownOutletCase(value: string) {
  if (!/[A-Za-z]/.test(value)) return value;
  return value
    .toLocaleLowerCase("en-US")
    .replace(/(^|[\s/._&()'\-])([a-z])/g, (_, prefix: string, letter: string) => `${prefix}${letter.toUpperCase()}`);
}

export function normalizeExternalText(value: unknown) {
  return String(value ?? "")
    .normalize("NFKC")
    .replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F-\u009F]/g, "")
    .replace(/[\u200B-\u200F\u202A-\u202E\u2060-\u206F\uFEFF]/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

export function canonicalSourceName(value: string) {
  const raw = normalizeExternalText(value);
  const lower = raw.toLowerCase();
  if (!raw || PLACEHOLDER_OUTLET.test(raw)) return "Unverified source";
  if (/^(reuters|reuters news)$/.test(lower)) return "Reuters";
  if (/^(ap|ap news|associated press|the associated press)$/.test(lower)) return "AP";
  if (/^(연합뉴스|yonhap|yonhap news|yonhap news agency)$/.test(lower)) return "연합뉴스";
  if (/^(bbc|bbc news)$/.test(lower)) return "BBC";
  if (/^kbs(?: news)?$/.test(lower)) return "KBS";
  if (/^mbc(?: news)?$/.test(lower)) return "MBC";
  if (/^sbs(?: news)?$/.test(lower)) return "SBS";
  if (/^(al jazeera|al jazeera english)$/.test(lower)) return "Al Jazeera";
  if (/^(dw|deutsche welle)$/.test(lower)) return "DW";
  if (/^(nhk|nhk world|nhk world-japan)$/.test(lower)) return "NHK";
  if (hasSuspiciousMixedScripts(raw) || TRUSTED_BRAND_TOKENS.test(raw)) return "Unverified source";
  return canonicalUnknownOutletCase(raw);
}

export function canonicalOutletCount(articles: Array<{ source: string }>) {
  return new Set(articles.map((article) => canonicalSourceName(article.source))).size;
}
