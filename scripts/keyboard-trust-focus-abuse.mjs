import { chromium } from "@playwright/test";

const base = process.env.E2E_BASE_URL || "http://127.0.0.1:3000";
const failures = [];
const passes = [];

function check(name, condition, detail = "") {
  if (condition) passes.push(name);
  else failures.push(`${name}${detail ? ` — ${detail}` : ""}`);
}

const browser = await chromium.launch({ channel: "chrome", headless: true });
const context = await browser.newContext({ viewport: { width: 375, height: 812 }, deviceScaleFactor: 1 });
const page = await context.newPage();

try {
  const response = await page.goto(`${base}/`, { waitUntil: "domcontentloaded", timeout: 45_000 });
  check("mobile document returns 200", response?.status() === 200, `status=${response?.status()}`);
  await page.locator("body").waitFor({ state: "visible", timeout: 10_000 });

  const selector = ".languageToggle a, .referenceLink, .moreContext > summary, .principlesDetails > summary, .sourceList a, .sourceOnlyList a";
  const visibleTargets = page.locator(selector).filter({ visible: true });
  const count = await visibleTargets.count();
  check("trust-critical controls exist on mobile", count > 0, `count=${count}`);

  const focusFailures = [];
  for (let index = 0; index < Math.min(count, 12); index += 1) {
    const target = visibleTargets.nth(index);
    const name = ((await target.getAttribute("aria-label")) || (await target.textContent()) || `target-${index}`)
      .replace(/\s+/g, " ")
      .trim()
      .slice(0, 70);
    await target.focus();
    const state = await target.evaluate((node) => {
      const style = getComputedStyle(node);
      const box = node.getBoundingClientRect();
      return {
        focused: document.activeElement === node,
        tabIndex: node.tabIndex,
        left: box.left,
        right: box.right,
        viewport: document.documentElement.clientWidth,
        visible: style.display !== "none" && style.visibility !== "hidden" && box.width > 0 && box.height > 0,
      };
    });
    if (!state.focused || state.tabIndex < 0 || !state.visible || state.left < -2 || state.right > state.viewport + 2) {
      focusFailures.push(`${name}: focus=${state.focused} tabIndex=${state.tabIndex} bounds=${Math.round(state.left)}..${Math.round(state.right)}/${state.viewport}`);
    }
  }
  check(
    "visible trust controls remain keyboard-focusable and inside the mobile viewport",
    focusFailures.length === 0,
    focusFailures.slice(0, 4).join(" | "),
  );

  await page.keyboard.press("Home");
  await page.locator("body").click({ position: { x: 4, y: 4 } }).catch(() => {});
  const tabOrder = [];
  for (let i = 0; i < 40; i += 1) {
    await page.keyboard.press("Tab");
    const focused = await page.evaluate(() => {
      const node = document.activeElement;
      if (!(node instanceof HTMLElement)) return null;
      return {
        tag: node.tagName,
        text: (node.getAttribute("aria-label") || node.textContent || "").replace(/\s+/g, " ").trim().slice(0, 80),
        trustCritical: node.matches(".languageToggle a, .referenceLink, .moreContext > summary, .principlesDetails > summary, .sourceList a, .sourceOnlyList a"),
      };
    });
    if (focused) tabOrder.push(focused);
  }
  check(
    "keyboard Tab traversal reaches a trust-critical control",
    tabOrder.some((item) => item.trustCritical),
    `first focuses=${tabOrder.slice(0, 8).map((item) => `${item.tag}:${item.text}`).join(" | ")}`,
  );
} catch (error) {
  failures.push(`keyboard trust-focus scenario crashed — ${error instanceof Error ? error.message : String(error)}`);
} finally {
  await context.close();
  await browser.close();
}

console.log(`Keyboard trust-focus abuse: ${passes.length} passed / ${failures.length} failed`);
passes.forEach((name) => console.log(`PASS  ${name}`));
failures.forEach((name) => console.error(`FAIL  ${name}`));
if (failures.length) process.exit(1);
