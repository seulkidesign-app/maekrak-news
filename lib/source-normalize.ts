const TRUSTED_BRAND_TOKENS = /\b(reuters|associated press|ap news|yonhap|bbc|kbs|mbc|sbs|al jazeera|deutsche welle|dw|nhk)\b|연합뉴스/i;
const PLACEHOLDER_OUTLET = /^(?:unknown|unknown source|source unknown|unverified source|source unavailable|unavailable source|n a|na|none|null|출처 없음|출처 불명|출처 미상|알 수 없음|미상|확인 불가)(?:\s*(?:\d+|\p{L}|(?=[\p{L}\p{N}]*\p{L})(?=[\p{L}\p{N}]*\p{N})[\p{L}\p{N}]+))?$/iu;
const UNBOUND_AUTHORITY_LABEL = /^(?:afp|agence france-presse)$/i;
const MAX_SOURCE_LABEL_LENGTH = 256;
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
const TRUSTED_INITIALISM_IDENTITIES = new Set(["ap", "bbc", "kbs", "mbc", "sbs", "dw", "nhk"]);
const CONFUSABLE_TO_LATIN: Record<string, string> = {
  "А": "A", "а": "a", "В": "B", "в": "b", "Е": "E", "е": "e", "К": "K", "к": "k",
  "М": "M", "м": "m", "Н": "H", "н": "h", "О": "O", "о": "o", "Р": "P", "р": "p",
  "С": "C", "с": "c", "Т": "T", "т": "t", "Х": "X", "х": "x", "У": "Y", "у": "y",
  "І": "I", "і": "i", "Ј": "J", "ј": "j", "Ѕ": "S", "ѕ": "s", "Ԝ": "W", "ԝ": "w",
  "Α": "A", "α": "a", "Β": "B", "Ε": "E", "ε": "e", "Ζ": "Z", "Η": "H", "Ι": "I",
  "Κ": "K", "Μ": "M", "Ν": "N", "Ο": "O", "ο": "o", "Ρ": "P", "Τ": "T", "Υ": "Y", "Χ": "X",
  "Օ": "O", "օ": "o", "Ս": "U", "ս": "u",
};

const OUTER_IDENTITY_WRAPPERS: Array<[string, string]> = [
  ["(", ")"], ["[", "]"], ["{", "}"], ["【", "】"], ["《", "》"], ["〈", "〉"],
  ["「", "」"], ["『", "』"], ["“", "”"], ["\"", "\""],
];

function stripDecorativeOuterWrappers(value: string) {
  let result = value.trim();
  for (let depth = 0; depth < 4; depth += 1) {
    const pair = OUTER_IDENTITY_WRAPPERS.find(([open, close]) => (
      result.startsWith(open) && result.endsWith(close) && result.length > open.length + close.length
    ));
    if (!pair) break;
    result = result.slice(pair[0].length, result.length - pair[1].length).trim();
  }
  return result;
}

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
  const folded = value.normalize("NFKC");
  if (folded === value) return false;
  const hasSuspiciousCompatibilityCharacter = [...value].some((character) => (
    character.normalize("NFKC") !== character
    && !/[\u3000\uFF01-\uFF5E]/u.test(character)
  ));
  if (!hasSuspiciousCompatibilityCharacter) return false;
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
    .normalize("NFD")
    .replace(/\p{M}+/gu, "")
    .normalize("NFC")
    .replace(/^[^\p{L}\p{N}]+|[^\p{L}\p{N}]+$/gu, "")
    .replace(/[\p{P}\p{S}_]+/gu, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function placeholderWithRomanNumeralSuffix(value: string) {
  if (!/[\u2160-\u2188]/u.test(value)) return false;
  const base = value
    .replace(/(?:[\s\p{P}\p{S}]*)[\u2160-\u2188]+(?:[\s\p{P}\p{S}]*)$/u, "")
    .trim();
  if (!base || base === value.trim()) return false;
  return PLACEHOLDER_OUTLET.test(placeholderOutletKey(normalizeExternalText(base)));
}

function compatibilityAsciiLetter(character: string) {
  const folded = character.normalize("NFKC");
  return folded !== character && /^[A-Za-z]+$/.test(folded);
}

function placeholderWithCompatibilityLetterSuffix(value: string) {
  const characters = [...value.trim()];
  if (!characters.some(compatibilityAsciiLetter)) return false;
  let index = characters.length;
  while (
    index > 0
    && /[\s\p{P}\p{S}]/u.test(characters[index - 1])
    && !compatibilityAsciiLetter(characters[index - 1])
  ) index -= 1;
  let suffixStart = index;
  while (suffixStart > 0 && compatibilityAsciiLetter(characters[suffixStart - 1])) suffixStart -= 1;
  if (suffixStart === index) return false;
  const base = characters.slice(0, suffixStart).join("").replace(/[\s\p{P}\p{S}]+$/u, "").trim();
  if (!base) return false;
  return PLACEHOLDER_OUTLET.test(placeholderOutletKey(normalizeExternalText(base)));
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
  const input = String(value ?? "");
  if (input.length > MAX_SOURCE_LABEL_LENGTH) return "Unverified source";
  const original = input.trim();
  const compatibilitySpoof = trustedBrandCompatibilitySpoof(original);
  const raw = normalizeExternalText(original);
  if (raw.length > MAX_SOURCE_LABEL_LENGTH) return "Unverified source";
  const lower = raw.toLowerCase();
  const placeholderKey = placeholderOutletKey(raw);
  if (!raw || !placeholderKey || PLACEHOLDER_OUTLET.test(placeholderKey) || placeholderWithRomanNumeralSuffix(original) || placeholderWithCompatibilityLetterSuffix(original)) return "Unverified source";
  if (UNBOUND_AUTHORITY_LABEL.test(raw)) return "Unverified source";
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
  if (trustedBrandHomoglyphSpoof(raw) || trustedBrandCombiningMarkSpoof(raw) || TRUSTED_BRAND_TOKENS.test(raw)) return "Unverified source";
  return canonicalUnknownOutletCase(raw);
}

export function outletIdentityKey(value: string) {
  const normalized = normalizeExternalText(genericMixedScriptIdentitySkeleton(stripDecorativeOuterWrappers(canonicalSourceName(value))));
  const compactInitialism = normalized
    .toLocaleLowerCase("en-US")
    .replace(/[\p{P}\p{S}\s]+/gu, "");
  if (TRUSTED_INITIALISM_IDENTITIES.has(compactInitialism)) return compactInitialism;
  return normalized
    .replace(/[\u0334-\u0338\u20D2\u20D3\u20E5\u20E6]+/g, "")
    .toLocaleLowerCase("en-US")
    .replace(/[._\p{Pd}/:|\u00B7\u2022\u2027\u2044\u2215\u2219\u22C5]+/gu, " ")
    .replace(/[’‘ʼ']/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

export function canonicalOutletCount(articles: Array<{ source: string }>) {
  return new Set(articles.map((article) => outletIdentityKey(article.source))).size;
}
