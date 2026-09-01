const TRUSTED_BRAND_TOKENS = /\b(reuters|associated press|ap news|yonhap|bbc|kbs|mbc|sbs|al jazeera|deutsche welle|dw|nhk)\b|연합뉴스/i;
const PLACEHOLDER_OUTLET = /^(?:unknown|unknown source|source unknown|unverified source|source unavailable|unavailable source|n a|na|none|null|출처 없음|출처 불명|출처 미상|알 수 없음|미상|확인 불가)(?:\s+\d+)?$/i;
const TRUSTED_CONFUSABLE_SKELETONS = new Set([
  "reuters", "reuters news",
  "ap", "ap news", "associated press", "the associated press",
  "yonhap", "yonhap news", "yonhap news agency",
  "bbc", "bbc news",
  "kbs", "kbs news", "mbc", "mbc news", "sbs", "sbs news",
  "al jazeera", "al jazeera english",
  "dw", "deutsche welle",
  "nhk", "nhk world", "nhk world-japan",
]);
const CONFUSABLE_TO_LATIN: Record<string, string> = {
  // Cyrillic characters commonly used to visually impersonate Latin outlet names.
  "А": "A", "а": "a", "В": "B", "в": "b", "Е": "E", "е": "e", "К": "K", "к": "k",
  "М": "M", "м": "m", "Н": "H", "н": "h", "О": "O", "о": "o", "Р": "P", "р": "p",
  "С": "C", "с": "c", "Т": "T", "т": "t", "Х": "X", "х": "x", "У": "Y", "у": "y",
  "І": "I", "і": "i", "Ј": "J", "ј": "j", "Ѕ": "S", "ѕ": "s", "Ԝ": "W", "ԝ": "w",
  // Greek lookalikes used in the same spoofing class.
  "Α": "A", "α": "a", "Β": "B", "Ε": "E", "ε": "e", "Ζ": "Z", "Η": "H", "Ι": "I",
  "Κ": "K", "Μ": "M", "Ν": "N", "Ο": "O", "ο": "o", "Ρ": "P", "Τ": "T", "Υ": "Y", "Χ": "X",
  // Armenian lookalikes can bypass Greek/Cyrillic-only mixed-script defenses.
  "Օ": "O", "օ": "o", "Ս": "U", "ս": "u",
};

function trustedBrandHomoglyphSpoof(value: string) {
  if (!/[\p{Script=Cyrillic}\p{Script=Greek}\p{Script=Armenian}]/u.test(value)) return false;
  const skeleton = [...value]
    .map((character) => CONFUSABLE_TO_LATIN[character] ?? character)
    .join("")
    .toLocaleLowerCase("en-US")
    .replace(/\s+/g, " ")
    .trim();
  return TRUSTED_CONFUSABLE_SKELETONS.has(skeleton);
}

function trustedBrandCombiningMarkSpoof(value: string) {
  if (!/\p{M}/u.test(value.normalize("NFD"))) return false;
  const skeleton = value
    .normalize("NFKD")
    .replace(/\p{M}+/gu, "")
    .toLocaleLowerCase("en-US")
    .replace(/\s+/g, " ")
    .trim();
  return TRUSTED_CONFUSABLE_SKELETONS.has(skeleton);
}

function trustedBrandCompatibilitySpoof(value: string) {
  // Full-width publisher labels are intentionally normalized by the existing pipeline.
  // Reject only deceptive compatibility glyph families that visually restyle letters.
  if (!/[\u2460-\u24FF\u{1D400}-\u{1D7FF}]/u.test(value)) return false;
  const folded = value.normalize("NFKC");
  const skeleton = folded
    .toLocaleLowerCase("en-US")
    .replace(/\s+/g, " ")
    .trim();
  return TRUSTED_CONFUSABLE_SKELETONS.has(skeleton);
}

function genericMixedScriptIdentitySkeleton(value: string) {
  if (!/\p{Script=Latin}/u.test(value) || !/[\p{Script=Cyrillic}\p{Script=Greek}\p{Script=Armenian}]/u.test(value)) return value;
  let sawMappedConfusable = false;
  let hasUnmappedNonLatinLetter = false;
  const skeleton = [...value].map((character) => {
    const mapped = CONFUSABLE_TO_LATIN[character];
    if (mapped) {
      sawMappedConfusable = true;
      return mapped;
    }
    if (/\p{L}/u.test(character) && !/\p{Script=Latin}/u.test(character)) hasUnmappedNonLatinLetter = true;
    return character;
  }).join("");
  // Collapse only Latin-looking mixed-script variants whose non-Latin letters are all known visual confusables.
  // Genuine multilingual names such as "Meduza Россия" retain their distinct identity.
  return sawMappedConfusable && !hasUnmappedNonLatinLetter ? skeleton : value;
}

function canonicalUnknownOutletCase(value: string) {
  if (!/[A-Za-z]/.test(value)) return value;
  return value
    .toLocaleLowerCase("en-US")
    .replace(/(^|[\s/._&()'\-])([a-z])/g, (_, prefix: string, letter: string) => `${prefix}${letter.toUpperCase()}`);
}

function placeholderOutletKey(value: string) {
  return value
    .toLocaleLowerCase("en-US")
    .replace(/^[^\p{L}\p{N}]+|[^\p{L}\p{N}]+$/gu, "")
    // Placeholder labels are often machine-generated with arbitrary separators.
    // Normalize separators only for placeholder detection so real outlet names keep their punctuation.
    .replace(/[\p{P}\p{S}_]+/gu, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function normalizeUnicodeDecimalDigits(value: string) {
  return value.replace(/\p{Nd}/gu, (digit) => {
    const codePoint = digit.codePointAt(0)!;
    let runStart = codePoint;
    while (runStart > 0 && /\p{Nd}/u.test(String.fromCodePoint(runStart - 1))) runStart -= 1;
    return String((codePoint - runStart) % 10);
  });
}

function normalizeArabicScriptNumericGlyphs(value: string) {
  return normalizeUnicodeDecimalDigits(value)
    .replace(/٪/g, "%")
    .replace(/٫/g, ".")
    .replace(/٬/g, ",");
}

export function normalizeExternalText(value: unknown) {
  return normalizeArabicScriptNumericGlyphs(String(value ?? "").normalize("NFKC"))
    .replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F-\u009F]/g, "")
    .replace(/\p{Default_Ignorable_Code_Point}+/gu, "")
    .replace(/\s+/g, " ")
    .trim();
}

export function canonicalSourceName(value: string) {
  const original = String(value ?? "").trim();
  const compatibilitySpoof = trustedBrandCompatibilitySpoof(original);
  const raw = normalizeExternalText(original);
  const lower = raw.toLowerCase();
  const placeholderKey = placeholderOutletKey(raw);
  if (!raw || !placeholderKey || PLACEHOLDER_OUTLET.test(placeholderKey)) return "Unverified source";
  if (compatibilitySpoof) return "Unverified source";
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
  // Reject strings that resolve to a trusted-brand homoglyph, combining-mark, or compatibility spoof,
  // but do not reject benign multilingual or accented outlet names in general.
  if (trustedBrandHomoglyphSpoof(raw) || trustedBrandCombiningMarkSpoof(raw) || TRUSTED_BRAND_TOKENS.test(raw)) return "Unverified source";
  return canonicalUnknownOutletCase(raw);
}

export function outletIdentityKey(value: string) {
  return normalizeExternalText(genericMixedScriptIdentitySkeleton(canonicalSourceName(value)))
    // Overlay marks can make the same visible outlet look like a distinct publisher identity.
    // Remove only visual overlay marks here; keep ordinary accents and the displayed source name intact.
    .replace(/[\u0334-\u0338\u20D2\u20D3\u20E5\u20E6]+/g, "")
    .toLocaleLowerCase("en-US")
    // Feed/source labels commonly alternate punctuation separators while naming the same publisher.
    // Collapse low-semantic separators and Unicode slash lookalikes here so they cannot inflate independent-outlet counts.
    .replace(/[._\p{Pd}/:|\u2044\u2215]+/gu, " ")
    .replace(/[’‘ʼ']/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

export function canonicalOutletCount(articles: Array<{ source: string }>) {
  return new Set(articles.map((article) => outletIdentityKey(article.source))).size;
}