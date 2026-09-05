export function acceptsMarkdown(accept: string) {
  const entries = accept.split(",");
  const markdownEntries = entries.filter((entry) => {
    const [rawType] = entry.split(";");
    return rawType.trim().toLowerCase() === "text/markdown";
  });

  // Repeated media ranges with different (or even identical) qvalues can be
  // interpreted inconsistently by intermediaries. For the alternate markdown
  // representation, fail closed rather than risk representation/cache confusion.
  if (markdownEntries.length > 1) return false;

  return entries.some((entry) => {
    const [rawType, ...rawParams] = entry.split(";");
    if (rawType.trim().toLowerCase() !== "text/markdown") return false;

    const qualityParams = rawParams
      .map((param) => param.trim())
      .filter((param) => /^q\s*=/i.test(param));

    // Duplicate q parameters are malformed and can be interpreted differently by
    // intermediaries. Fail closed instead of letting parameter order select a representation.
    if (qualityParams.length > 1) return false;
    if (qualityParams.length === 0) return true;

    const rawQuality = qualityParams[0].replace(/^q\s*=\s*/i, "").trim();
    // RFC qvalues are 0-1 with at most three fractional digits; only zeroes may follow 1.
    // Do not let JavaScript Number() coercion turn malformed values such as .5, +0.5,
    // 0.0001, or 1.0000 into an accepted representation preference.
    if (!/^(?:0(?:\.\d{0,3})?|1(?:\.0{0,3})?)$/.test(rawQuality)) return false;

    const quality = Number(rawQuality);
    return quality > 0;
  });
}
