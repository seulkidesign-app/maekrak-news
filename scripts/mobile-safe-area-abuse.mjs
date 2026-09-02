import { readFile } from "node:fs/promises";

const css = await readFile(new URL("../app/mobile-safe-area.css", import.meta.url), "utf8");
const layout = await readFile(new URL("../app/layout.tsx", import.meta.url), "utf8");
const failures = [];
const passes = [];

function check(name, condition) {
  if (condition) passes.push(name);
  else failures.push(name);
}

check("safe-area stylesheet is loaded", layout.includes('import "./mobile-safe-area.css"'));
check("topbar reserves iOS top safe area", css.includes("env(safe-area-inset-top)"));
check("topbar height adds safe area instead of shrinking content", /height\s*:\s*calc\(68px\s*\+\s*env\(safe-area-inset-top\)\)/.test(css));
check("topbar protects left cutout area", css.includes("env(safe-area-inset-left)"));
check("topbar protects right cutout area", css.includes("env(safe-area-inset-right)"));

// New attack class: bottom safe-area trust UX overlap. On gesture-navigation iPhones,
// the final footer/disclosure text must retain its ordinary padding *plus* the home-indicator inset.
// Replacing the normal padding with only env(...) can collapse spacing to zero on ordinary devices.
check(
  "footer reserves iOS bottom safe area without sacrificing normal spacing",
  /footer\s*\{[^}]*padding-bottom\s*:\s*calc\(40px\s*\+\s*env\(safe-area-inset-bottom\)\)/s.test(css),
);

console.log(`Mobile safe-area abuse: ${passes.length} passed / ${failures.length} failed`);
passes.forEach((name) => console.log(`PASS  ${name}`));
failures.forEach((name) => console.error(`FAIL  ${name}`));
if (failures.length) process.exit(1);
