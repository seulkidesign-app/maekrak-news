const { __test } = await import("../lib/news.ts");
const article = (source, category, scope="world") => ({ title:`${source} update`, description:"", source, link:"https://example.com/story", publishedAt:"2026-08-28T00:00:00.000Z", category, scope, sourceType:"direct", sourceRole:"other" });
const cats = [...Array.from({length:8},()=>article("Flood News","경제")), article("Outlet B","정치"), article("Outlet C","정치")];
const scopes = [...Array.from({length:9},()=>article("Flood News","세계","domestic")), article("Outlet B","세계","world"), article("Outlet C","세계","world")];
if (__test.sourceBalancedMajority(cats,x=>x.category,"세계") !== "정치") process.exit(1);
if (__test.sourceBalancedMajority(scopes,x=>x.scope,"world") !== "world") process.exit(1);
console.log("Source flood abuse: 2 passed / 0 failed");
