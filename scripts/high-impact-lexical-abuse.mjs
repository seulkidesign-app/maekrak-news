const failures = [];
const passes = [];
const { __test } = await import("../lib/news.ts");
function check(name, condition) { if (condition) passes.push(name); else failures.push(name); }
check("war memorial exhibition is not treated as a live high-impact conflict", !__test.isHighImpact("City opens a new war memorial exhibition downtown"));
check("war museum opening is not treated as a live high-impact conflict", !__test.isHighImpact("New war museum opens with historical archives"));
check("War and Peace performance is not treated as a live high-impact conflict", !__test.isHighImpact("Students perform War and Peace at school festival"));
check("Korean war memorial exhibition is not treated as a live conflict", !__test.isHighImpact("전쟁기념관 특별전 개막"));
check("real war reporting remains high impact", __test.isHighImpact("Ukraine war enters a new phase after overnight fighting"));
check("attack on a war memorial remains high impact through the actual attack signal", __test.isHighImpact("War memorial hit by missile during overnight attack"));
check("Korean attack near a war memorial remains high impact", __test.isHighImpact("전쟁기념관 인근 미사일 공격 발생"));
console.log("High-impact lexical false-positive abuse: " + passes.length + " passed / " + failures.length + " failed");
passes.forEach((name) => console.log("PASS  " + name));
failures.forEach((name) => console.error("FAIL  " + name));
if (failures.length) process.exit(1);
