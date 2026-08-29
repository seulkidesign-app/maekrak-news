import { readFile, writeFile } from "node:fs/promises";

function replaceOnce(text, pattern, replacement, label) {
  const next = text.replace(pattern, replacement);
  if (next === text) throw new Error(`patch anchor missing: ${label}`);
  return next;
}

let news = await readFile("lib/news.ts", "utf8");

news = replaceOnce(
  news,
  /function importanceFor\(articles: NewsItem\[\]\) \{[\s\S]*?function briefWhyFor\(category: NewsCategory, articles: NewsItem\[\]\): BriefWhyCode \{\n  const text = articles\.map\(\(article\) => `\$\{article\.title\} \$\{article\.description\}`\)\.join\(" "\);/,
  `function verifiedSourceArticles(articles: NewsItem[]) {\n  return articles.filter((article) => canonicalSourceName(article.source) !== "Unverified source");\n}\n\nfunction rankingSignalArticles(articles: NewsItem[]) {\n  const verified = verifiedSourceArticles(articles);\n  return verified.length ? verified : articles;\n}\n\nfunction verifiedSourceCount(articles: NewsItem[]) {\n  return new Set(verifiedSourceArticles(articles).map((article) => canonicalSourceName(article.source))).size;\n}\n\nfunction importanceFor(articles: NewsItem[]) {\n  const now = Date.now();\n  const verified = verifiedSourceArticles(articles);\n  const signalArticles = verified.length ? verified : articles;\n  const sources = new Set(verified.map((article) => canonicalSourceName(article.source)));\n  const roles = new Set(verified.map((article) => article.sourceRole));\n  const validTimes = signalArticles.map((article) => new Date(article.publishedAt).getTime()).filter(Number.isFinite);\n  const newest = validTimes.length ? Math.max(...validTimes) : now - 86_400_000;\n  const ageHours = Math.max(0, (now - newest) / 3_600_000);\n  const recency = Math.max(0, 2.4 - ageHours / 12);\n  const diversity = Math.min(4, sources.size) * 1.05;\n  const roleDiversity = Math.min(3, roles.size) * 0.6;\n  const sourceAuthority = verified.length ? Math.max(...verified.map(sourceAuthorityWeight)) : 0.45;\n  const text = signalArticles.map((article) => \`${'${article.title} ${article.description}'}\`).join(" ");\n  const impact = isHighImpact(text) ? 2.0 : structuralImpactPattern.test(text) ? 1.25 : 0;\n  const softNewsPenalty = softNewsPattern.test(text) && !structuralImpactPattern.test(text) && !isHighImpact(text) ? 1.8 : 0;\n  const crossScope = new Set(signalArticles.map((article) => article.scope)).size > 1 ? 0.65 : 0;\n  const directSignal = verified.some((article) => article.sourceType === "direct") ? 0.45 : 0;\n  const singleSourcePenalty = sources.size <= 1 ? 1.6 : 0;\n  const aggregatedOnlyPenalty = sources.size <= 1 && signalArticles.every((article) => article.sourceType === "aggregated") ? 0.45 : 0;\n  const score = diversity + roleDiversity + sourceAuthority + recency + impact + crossScope + directSignal - singleSourcePenalty - aggregatedOnlyPenalty - softNewsPenalty;\n  return Math.round(Math.max(0, score) * 100) / 100;\n}\n\nfunction selectionReasons(articles: NewsItem[], score: number) {\n  const reasons: string[] = [];\n  const verified = verifiedSourceArticles(articles);\n  const signalArticles = verified.length ? verified : articles;\n  const sources = new Set(verified.map((article) => canonicalSourceName(article.source)));\n  const roles = new Set(verified.map((article) => article.sourceRole));\n  const text = signalArticles.map((article) => \`${'${article.title} ${article.description}'}\`).join(" ");\n  if (sources.size >= 3) reasons.push("여러 매체에서 동시 보도");\n  if (roles.has("wire")) reasons.push("통신사 보도 포함");\n  if (roles.size >= 2) reasons.push("서로 다른 유형의 출처");\n  if (isHighImpact(text)) reasons.push("정책·안보·재난 등 영향도가 큰 주제");\n  else if (structuralImpactPattern.test(text)) reasons.push("제도·생활에 이어질 구조적 이슈");\n  if (score >= 7 && reasons.length === 0 && sources.size > 0) reasons.push("최신성과 보도량을 함께 반영");\n  return reasons.slice(0, 3);\n}\n\nfunction briefWhyFor(category: NewsCategory, articles: NewsItem[]): BriefWhyCode {\n  const text = rankingSignalArticles(articles).map((article) => \`${'${article.title} ${article.description}'}\`).join(" ");`,
  "importance/selection"
);

news = replaceOnce(
  news,
  /function briefWatchFor\(articles: NewsItem\[\]\): BriefWatchCode \{\n  const text = articles\.map\(\(article\) => `\$\{article\.title\} \$\{article\.description\}`\)\.join\(" "\);\n  const sources = new Set\(articles\.map\(\(article\) => canonicalSourceName\(article\.source\)\)\);\n  if \(sources\.size <= 1\) return "single-source";/,
  `function briefWatchFor(articles: NewsItem[]): BriefWatchCode {\n  const verified = verifiedSourceArticles(articles);\n  const text = rankingSignalArticles(articles).map((article) => \`${'${article.title} ${article.description}'}\`).join(" ");\n  const sources = new Set(verified.map((article) => canonicalSourceName(article.source)));\n  if (sources.size <= 1) return "single-source";`,
  "briefWatch"
);

news = replaceOnce(
  news,
  /function sourceBalancedMajority<T extends string>\(articles: NewsItem\[\], select: \(article: NewsItem\) => T, fallback: T\): T \{\n  const bySource = new Map<string, T\[\]>\(\);\n  for \(const article of articles\) \{/,
  `function sourceBalancedMajority<T extends string>(articles: NewsItem[], select: (article: NewsItem) => T, fallback: T): T {\n  const bySource = new Map<string, T[]>();\n  const verified = verifiedSourceArticles(articles);\n  const votingArticles = verified.length ? verified : articles;\n  for (const article of votingArticles) {`,
  "sourceBalancedMajority"
);

news = replaceOnce(
  news,
  /    const primary = sorted\.find\(\(article\) => article\.sourceRole === "wire"\)\n      \?\? sorted\.find\(\(article\) => article\.sourceType === "direct"\)\n      \?\? sorted\[0\];\n    const sources = new Set\(sorted\.map\(\(article\) => canonicalSourceName\(article\.source\)\)\);/,
  `    const signalPool = rankingSignalArticles(sorted);\n    const primary = signalPool.find((article) => article.sourceRole === "wire")\n      ?? signalPool.find((article) => article.sourceType === "direct")\n      ?? signalPool[0]\n      ?? sorted[0];\n    const sourceCount = verifiedSourceCount(sorted);`,
  "event primary"
);

news = replaceOnce(news, /      sourceCount: sources\.size,/, "      sourceCount,", "sourceCount");
news = replaceOnce(
  news,
  /  sourceBalancedMajority,\n\};/,
  `  sourceBalancedMajority,\n  verifiedSourceArticles,\n  verifiedSourceCount,\n  importanceFor,\n  selectionReasons,\n  briefWatchFor,\n};`,
  "__test exports"
);
await writeFile("lib/news.ts", news);

let page = await readFile("app/page.tsx", "utf8");
page = replaceOnce(
  page,
  /function coverageLabel\(event: NewsEvent, lang: Language\) \{\n  if \(lang === "ko"\) return event\.sourceCount >= 3 \? `\$\{event\.sourceCount\}개 매체 보도` : event\.sourceCount === 2 \? "2개 매체 보도" : "단일 매체 보도";\n  return event\.sourceCount >= 3 \? `\$\{event\.sourceCount\} outlets` : event\.sourceCount === 2 \? "2 outlets" : "Single outlet";\n\}/,
  `function coverageLabel(event: NewsEvent, lang: Language) {\n  if (event.sourceCount === 0) return lang === "ko" ? "출처 확인 필요" : "Source identity unverified";\n  if (lang === "ko") return event.sourceCount >= 3 ? \`${'${event.sourceCount}'}개 매체 보도\` : event.sourceCount === 2 ? "2개 매체 보도" : "단일 매체 보도";\n  return event.sourceCount >= 3 ? \`${'${event.sourceCount}'} outlets\` : event.sourceCount === 2 ? "2 outlets" : "Single outlet";\n}`,
  "coverageLabel"
);
await writeFile("app/page.tsx", page);

await writeFile("scripts/unverified-trust-signal-laundering-abuse.mjs", `import { readFile } from "node:fs/promises";\n\nconst failures = [];\nconst passes = [];\nconst { __test } = await import("../lib/news.ts");\n\nfunction check(name, condition, detail = "") {\n  if (condition) passes.push(name);\n  else failures.push(\`${'${name}${detail ? ` — ${detail}` : ""}'}\`);\n}\n\nconst now = new Date().toISOString();\nfunction article(source, title, { category = "정치", scope = "world", sourceRole = "other", sourceType = "aggregated" } = {}) {\n  return { title, description: title, source, link: "https://example.com/story", publishedAt: now, category, scope, sourceRole, sourceType };\n}\n\nconst reuters = article("Reuters", "Government committee meets on budget proposal", { sourceRole: "wire" });\nconst poison = article("Unverified source", "Nuclear war attack triggers emergency sanctions", { category: "재난", scope: "domestic" });\nconst unknown = article("Unknown source", "Nuclear war attack triggers emergency sanctions", { category: "재난", scope: "domestic" });\n\ncheck("unverified aliases do not increase verified source count", __test.verifiedSourceCount([reuters, poison, unknown]) === 1, \`count=\${__test.verifiedSourceCount([reuters, poison, unknown])}\`);\ncheck("unverified article cannot upgrade single-source watch status", __test.briefWatchFor([reuters, poison]) === "single-source", \`watch=\${__test.briefWatchFor([reuters, poison])}\`);\ncheck("unverified high-impact text cannot inflate a verified event importance score", __test.importanceFor([reuters, poison]) === __test.importanceFor([reuters]), \`\${__test.importanceFor([reuters, poison])} vs \${__test.importanceFor([reuters])}\`);\n\nconst bbc = article("BBC", "Government committee meets on budget proposal", { sourceRole: "international" });\nconst reasons = __test.selectionReasons([reuters, bbc, poison], 6);\ncheck("unverified third source cannot manufacture a three-outlet selection reason", !reasons.includes("여러 매체에서 동시 보도"), reasons.join(" | "));\n\nconst verifiedOther = article("Example News", "City council approves transit plan", { category: "정치", scope: "world" });\nconst unverifiedNewest = article("Unverified source", "City council approves transit plan", { category: "경제", scope: "domestic" });\ncheck("unverified source cannot win a source-balanced category tie via fallback", __test.sourceBalancedMajority([verifiedOther, unverifiedNewest], (item) => item.category, "경제") === "정치");\ncheck("unverified source cannot win a source-balanced scope tie via fallback", __test.sourceBalancedMajority([verifiedOther, unverifiedNewest], (item) => item.scope, "domestic") === "world");\n\nconst pageSource = await readFile(new URL("../app/page.tsx", import.meta.url), "utf8");\ncheck("zero verified-source events are labeled as needing source verification", pageSource.includes("event.sourceCount === 0") && pageSource.includes("출처 확인 필요") && pageSource.includes("Source identity unverified"));\n\nconsole.log(\`Unverified trust-signal laundering abuse: \${passes.length} passed / \${failures.length} failed\`);\npasses.forEach((name) => console.log(\`PASS  \${name}\`));\nfailures.forEach((name) => console.error(\`FAIL  \${name}\`));\nif (failures.length) process.exit(1);\n`);

let workflow = await readFile(".github/workflows/adversarial-e2e.yml", "utf8");
workflow = replaceOnce(
  workflow,
  /      - name: Unverified accuracy laundering abuse\n        run: node scripts\/unverified-accuracy-laundering-abuse\.mjs\n/,
  `      - name: Unverified accuracy laundering abuse\n        run: node scripts/unverified-accuracy-laundering-abuse.mjs\n      - name: Unverified trust-signal laundering abuse\n        run: node scripts/unverified-trust-signal-laundering-abuse.mjs\n`,
  "workflow step"
);
await writeFile(".github/workflows/adversarial-e2e.yml", workflow);
