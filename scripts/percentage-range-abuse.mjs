const failures = [];
const passes = [];
const { auditEventAccuracy } = await import('../lib/accuracy.ts');
function check(name, condition) { if (condition) passes.push(name); else failures.push(name); }
const article = (title, source) => ({
  title, description: title, source, link: 'https://example.com/story',
  publishedAt: '2026-08-31T02:00:00Z', category: '경제', scope: 'world',
  sourceType: 'aggregated', sourceRole: source === 'Reuters' ? 'wire' : 'international',
});
const event = (a, b) => ({
  id: 'range', title: a.title, category: '경제', scope: 'world', summary: '',
  publishedAt: '2026-08-31T02:00:00Z', dayStatus: 'today', articles: [a, b],
  sourceCount: 2, importanceScore: 8, whySelected: [], briefWhy: 'economy', briefWatch: 'follow-up',
});
const audit = (left, right) => auditEventAccuracy(event(article(left, 'Reuters'), article(right, 'BBC')));
check('hyphen range equals explicit between range', !audit('Inflation expected at 3-4%', 'Inflation expected between 3% and 4%').headlineNumberDifference);
check('en-dash range equals explicit endpoints', !audit('Inflation expected at 3–4%', 'Inflation expected at 3% to 4%').headlineNumberDifference);
check('tilde range equals explicit endpoints', !audit('물가 상승률 3~4% 전망', '물가 상승률 3%~4% 전망').headlineNumberDifference);
check('range endpoints remain visible as percentages', audit('Inflation expected at 3-4%', 'Inflation expected between 3% and 4%').numberExamples.every((item) => item.values.includes('3%') && item.values.includes('4%')));
check('different ranges still trigger disagreement', audit('Inflation expected at 3-4%', 'Inflation expected between 4% and 5%').headlineNumberDifference);
check('single signed percentage semantics remain intact', audit('Inflation falls -3%', 'Inflation falls 3%').headlineNumberDifference);
console.log(`Percentage range abuse: ${passes.length} passed / ${failures.length} failed`);
passes.forEach((name) => console.log(`PASS  ${name}`));
failures.forEach((name) => console.error(`FAIL  ${name}`));
if (failures.length) process.exit(1);
