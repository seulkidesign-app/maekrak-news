from pathlib import Path

news_path = Path("lib/news.ts")
news = news_path.read_text()
if "function sourceForLink(" in news:
    raise SystemExit("sourceForLink already present")

parser_needle = 'const parser = new XMLParser({ ignoreAttributes: false, processEntities: false });'
trust_block = '''const trustedSourceDomains: Record<string, string[]> = {
  Reuters: ["reuters.com"],
  AP: ["apnews.com"],
  연합뉴스: ["yna.co.kr"],
  BBC: ["bbc.com", "bbc.co.uk"],
  KBS: ["kbs.co.kr"],
  SBS: ["sbs.co.kr"],
  MBC: ["imbc.com"],
  CNN: ["cnn.com"],
  "Al Jazeera": ["aljazeera.com"],
  DW: ["dw.com"],
  NHK: ["nhk.or.jp"],
};
const allowedAggregatorDomains = ["news.google.com"];
'''
if parser_needle not in news:
    raise SystemExit("parser insertion point not found")
news = news.replace(parser_needle, trust_block + parser_needle, 1)

time_needle = 'function safePublishedAt(value: unknown, now = Date.now()) {'
link_helpers = '''function hostMatches(hostname: string, domain: string) {
  const host = hostname.toLowerCase().replace(/\\.$/, "");
  const normalizedDomain = domain.toLowerCase().replace(/\\.$/, "");
  return host === normalizedDomain || host.endsWith(`.${normalizedDomain}`);
}

function sourceForLink(source: string, link: string, sourceType: Feed["sourceType"]) {
  const trustedDomains = trustedSourceDomains[source];
  if (!trustedDomains) return source;
  try {
    const hostname = new URL(link).hostname;
    const official = trustedDomains.some((domain) => hostMatches(hostname, domain));
    const allowedAggregator = sourceType === "aggregated" && allowedAggregatorDomains.some((domain) => hostMatches(hostname, domain));
    return official || allowedAggregator ? source : "Unverified source";
  } catch {
    return "Unverified source";
  }
}

'''
if time_needle not in news:
    raise SystemExit("safePublishedAt insertion point not found")
news = news.replace(time_needle, link_helpers + time_needle, 1)

old = '''      const sourceRaw = item?.source?.["#text"] ?? item?.source;
      const source = sourceForFeed(sourceRaw, feed);
      const rawTitle = clean(item?.title, 320);
      const title = stripSourceSuffix(rawTitle, source, feed.name);
      const rawLink = typeof item?.link === "string" ? item.link : item?.link?.["@_href"] ?? item?.guid ?? "";
      const link = safeHttpUrl(rawLink);'''
new = '''      const sourceRaw = item?.source?.["#text"] ?? item?.source;
      const claimedSource = sourceForFeed(sourceRaw, feed);
      const rawTitle = clean(item?.title, 320);
      const title = stripSourceSuffix(rawTitle, claimedSource, feed.name);
      const rawLink = typeof item?.link === "string" ? item.link : item?.link?.["@_href"] ?? item?.guid ?? "";
      const link = safeHttpUrl(rawLink);
      const source = link ? sourceForLink(claimedSource, link, feed.sourceType) : claimedSource;'''
if old not in news:
    raise SystemExit("loadFeed source/link segment not found")
news = news.replace(old, new, 1)

export_needle = "  sourceForFeed,\n  inferCategory,"
if export_needle not in news:
    raise SystemExit("__test export insertion point not found")
news = news.replace(export_needle, "  sourceForFeed,\n  sourceForLink,\n  inferCategory,", 1)
news_path.write_text(news)

test_path = Path("scripts/source-link-abuse.mjs")
test_path.write_text('''const failures = [];
const passes = [];
function check(name, condition) {
  if (condition) passes.push(name);
  else failures.push(name);
}

const { __test } = await import("../lib/news.ts");
const { sourceForLink } = __test;

check("Reuters on official root domain stays trusted", sourceForLink("Reuters", "https://reuters.com/world/story", "direct") === "Reuters");
check("Reuters on official subdomain stays trusted", sourceForLink("Reuters", "https://www.reuters.com/world/story", "direct") === "Reuters");
check("trusted Reuters label on unrelated domain is downgraded", sourceForLink("Reuters", "https://evil.example/reuters/story", "direct") === "Unverified source");
check("suffix trap reuters.com.evil.example is downgraded", sourceForLink("Reuters", "https://reuters.com.evil.example/story", "direct") === "Unverified source");
check("Google News wrapper is allowed for aggregated trusted sources", sourceForLink("Reuters", "https://news.google.com/rss/articles/example", "aggregated") === "Reuters");
check("Google News wrapper is not accepted for a direct-feed claim", sourceForLink("Reuters", "https://news.google.com/rss/articles/example", "direct") === "Unverified source");
check("BBC official UK domain stays trusted", sourceForLink("BBC", "https://www.bbc.co.uk/news/world-1", "direct") === "BBC");
check("unknown outlets keep safe public links without invented authority", sourceForLink("Example News", "https://example.com/story", "aggregated") === "Example News");

console.log(`\\nSource-link trust abuse: ${passes.length} passed / ${failures.length} failed`);
passes.forEach((name) => console.log(`PASS  ${name}`));
failures.forEach((name) => console.error(`FAIL  ${name}`));
if (failures.length) process.exit(1);
''')

workflow_path = Path(".github/workflows/adversarial-e2e.yml")
workflow = workflow_path.read_text()
patch_step = '''      - name: Apply tested source-link trust patch
        run: python scripts/apply-source-link-hotfix.py
'''
commit_step = '''      - name: Commit source-link trust hardening after full CI
        run: |
          git config user.name "seulkidesign-app"
          git config user.email "seulki.design@gmail.com"
          git add -A
          git commit -m "Harden trusted source labels against link-domain spoofing"
          git push origin HEAD:main
'''
workflow = workflow.replace(patch_step, "", 1)
workflow = workflow.replace(commit_step, "", 1)
workflow_path.write_text(workflow)

Path(__file__).unlink()
