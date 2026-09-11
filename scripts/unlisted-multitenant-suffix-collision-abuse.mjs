const failures = [];
const passes = [];
function check(name, condition) {
  if (condition) passes.push(name);
  else failures.push(name);
}

const { outletIdentityKey } = await import("../lib/source-normalize.ts");

const workerTenantA = outletIdentityKey("alpha-news.workers.dev");
const workerTenantB = outletIdentityKey("beta-news.workers.dev");
const workerTenantASubdomain = outletIdentityKey("desk.alpha-news.workers.dev");

check(
  "different workers.dev tenants remain distinct publisher identities",
  workerTenantA !== workerTenantB,
);
check(
  "subdomains inside one workers.dev tenant still collapse together",
  workerTenantA === workerTenantASubdomain,
);

console.log(`\nUnlisted multi-tenant suffix collision abuse: ${passes.length} passed / ${failures.length} failed`);
console.log(`alpha identity: ${workerTenantA}`);
console.log(`beta identity: ${workerTenantB}`);
passes.forEach((name) => console.log(`PASS  ${name}`));
failures.forEach((name) => console.error(`FAIL  ${name}`));
if (failures.length) process.exit(1);
