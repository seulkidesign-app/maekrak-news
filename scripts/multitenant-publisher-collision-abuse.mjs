const failures = [];
const passes = [];
function check(name, condition) {
  if (condition) passes.push(name);
  else failures.push(name);
}

const { outletIdentityKey } = await import("../lib/source-normalize.ts");

const githubTenantA = outletIdentityKey("alpha-news.github.io");
const githubTenantB = outletIdentityKey("beta-news.github.io");
const githubTenantASubdomain = outletIdentityKey("desk.alpha-news.github.io");

check(
  "different github.io tenants remain distinct publisher identities",
  githubTenantA !== githubTenantB,
);
check(
  "subdomains inside one github.io tenant still collapse together",
  githubTenantA === githubTenantASubdomain,
);

const pagesTenantA = outletIdentityKey("alpha-news.pages.dev");
const pagesTenantB = outletIdentityKey("beta-news.pages.dev");
const pagesTenantASubdomain = outletIdentityKey("mobile.alpha-news.pages.dev");

check(
  "different pages.dev tenants remain distinct publisher identities",
  pagesTenantA !== pagesTenantB,
);
check(
  "subdomains inside one pages.dev tenant still collapse together",
  pagesTenantA === pagesTenantASubdomain,
);

const vercelTenantA = outletIdentityKey("alpha-news.vercel.app");
const vercelTenantB = outletIdentityKey("beta-news.vercel.app");
check(
  "different vercel.app tenants remain distinct publisher identities",
  vercelTenantA !== vercelTenantB,
);

console.log(`\nMulti-tenant publisher collision abuse: ${passes.length} passed / ${failures.length} failed`);
passes.forEach((name) => console.log(`PASS  ${name}`));
failures.forEach((name) => console.error(`FAIL  ${name}`));
if (failures.length) process.exit(1);
