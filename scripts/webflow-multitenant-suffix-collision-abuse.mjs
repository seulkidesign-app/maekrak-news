const failures = [];
const passes = [];
function check(name, condition) {
  if (condition) passes.push(name);
  else failures.push(name);
}

const { outletIdentityKey } = await import("../lib/source-normalize.ts");

const tenantA = outletIdentityKey("alpha-news.webflow.io");
const tenantB = outletIdentityKey("beta-news.webflow.io");
const tenantASubdomain = outletIdentityKey("desk.alpha-news.webflow.io");

check(
  "different webflow.io tenants remain distinct publisher identities",
  tenantA !== tenantB,
);
check(
  "subdomains inside one webflow.io tenant still collapse together",
  tenantA === tenantASubdomain,
);

console.log(`\nWebflow multi-tenant suffix collision abuse: ${passes.length} passed / ${failures.length} failed`);
console.log(`alpha identity: ${tenantA}`);
console.log(`beta identity: ${tenantB}`);
passes.forEach((name) => console.log(`PASS  ${name}`));
failures.forEach((name) => console.error(`FAIL  ${name}`));
if (failures.length) process.exit(1);
