export function acceptsMarkdown(accept: string) {
  return accept.split(",").some((entry) => {
    const [rawType, ...rawParams] = entry.split(";");
    if (rawType.trim().toLowerCase() !== "text/markdown") return false;

    const qualityParam = rawParams
      .map((param) => param.trim())
      .find((param) => /^q\s*=/i.test(param));
    if (!qualityParam) return true;

    const rawQuality = qualityParam.replace(/^q\s*=\s*/i, "").trim();
    // RFC qvalues are 0-1 with at most three fractional digits; only zeroes may follow 1.
    // Do not let JavaScript Number() coercion turn malformed values such as .5, +0.5,
    // 0.0001, or 1.0000 into an accepted representation preference.
    if (!/^(?:0(?:\.\d{0,3})?|1(?:\.0{0,3})?)$/.test(rawQuality)) return false;

    const quality = Number(rawQuality);
    return quality > 0;
  });
}
