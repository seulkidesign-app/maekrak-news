const failures = [];
const passes = [];
function check(name, condition) {
  if (condition) passes.push(name);
  else failures.push(name);
}

const { outletIdentityKey } = await import("../lib/source-normalize.ts");

const alpha = outletIdentityKey("alpha-news.substack.com");
const beta = outletIdentityKey("beta-news.substack.com");
const alphaDesk = outletIdentityKey("desk.alpha-news.substack.com");

check(
  "different substack.com publications remain distinct publisher identities",
  alpha !== beta,
);
check(
  "subdomains inside one substack publication collapse together",
  alpha === alphaDesk,
);

const wordpressA = outletIdentityKey("alpha-news.wordpress.com");
const wordpressB = outletIdentityKey("beta-news.wordpress.com");
check(
  "different wordpress.com publications remain distinct publisher identities",
  wordpressA !== wordpressB,
);

console.log(`\nHosted publication tenant collision abuse: ${passes.length} passed / ${failures.length} failed`);
passes.forEach((name) => console.log(`PASS  ${name}`));
failures.forEach((name) => console.error(`FAIL  ${name}`));
if (failures.length) process.exit(1);
