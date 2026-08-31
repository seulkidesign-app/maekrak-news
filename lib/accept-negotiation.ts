export function acceptsMarkdown(accept: string) {
  return accept.split(",").some((entry) => {
    const [rawType, ...rawParams] = entry.split(";");
    if (rawType.trim().toLowerCase() !== "text/markdown") return false;

    const qualityParam = rawParams
      .map((param) => param.trim())
      .find((param) => /^q\s*=/i.test(param));
    if (!qualityParam) return true;

    const quality = Number(qualityParam.replace(/^q\s*=\s*/i, ""));
    return Number.isFinite(quality) && quality > 0 && quality <= 1;
  });
}
