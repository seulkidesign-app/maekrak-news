import { chromium } from "@playwright/test";

const base = process.env.E2E_BASE_URL || "http://127.0.0.1:3000";
const failures = [];
const passes = [];

function check(name, condition, detail = "") {
  if (condition) passes.push(name);
  else failures.push(`${name}${detail ? ` — ${detail}` : ""}`);
}

const browser = await chromium.launch({ channel: "chrome", headless: true });

async function runViewport(label, width, height, path = "/") {
  const context = await browser.newContext({ viewport: { width, height }, deviceScaleFactor: 1 });
  const page = await context.newPage();
  const consoleErrors = [];
  const pageErrors = [];
  page.on("console", (message) => { if (message.type() === "error") consoleErrors.push(message.text()); });
  page.on("pageerror", (error) => pageErrors.push(error.message));

  try {
    const response = await page.goto(`${base}${path}`, { waitUntil: "domcontentloaded", timeout: 45_000 });
    check(`${label}: document returns 200`, response?.status() === 200, `status=${response?.status()}`);
    await page.locator("body").waitFor({ state: "visible", timeout: 10_000 });

    const metrics = await page.evaluate(() => ({
      viewport: document.documentElement.clientWidth,
      scrollWidth: document.documentElement.scrollWidth,
      bodyWidth: document.body.getBoundingClientRect().width,
      main: document.querySelector("main")?.getBoundingClientRect().toJSON?.() ?? null,
    }));
    check(`${label}: no horizontal page overflow`, metrics.scrollWidth <= metrics.viewport + 2, `${metrics.scrollWidth}px > ${metrics.viewport}px`);
    check(`${label}: body fits viewport`, metrics.bodyWidth <= metrics.viewport + 2, `${metrics.bodyWidth}px > ${metrics.viewport}px`);

    const h1 = page.locator("h1").first();
    check(`${label}: primary heading is visible`, await h1.isVisible().catch(() => false));

    const cardOverflow = await page.locator(".eventCard").evaluateAll((cards) => {
      const viewport = document.documentElement.clientWidth;
      return cards.filter((card) => {
        const box = card.getBoundingClientRect();
        return box.width > 0 && (box.left < -2 || box.right > viewport + 2);
      }).length;
    }).catch(() => 0);
    check(`${label}: event cards stay inside viewport`, cardOverflow === 0, `${cardOverflow} overflowing cards`);

    const brokenText = await page.evaluate(() => /(^|>)(undefined|NaN|Invalid Date)(<|$)/i.test(document.body.innerHTML));
    check(`${label}: no obvious broken values`, !brokenText);

    const emptyInteractive = await page.locator("a,button,summary").evaluateAll((nodes) => nodes.filter((node) => {
      const style = getComputedStyle(node);
      const box = node.getBoundingClientRect();
      const visible = style.display !== "none" && style.visibility !== "hidden" && box.width > 0 && box.height > 0;
      if (!visible) return false;
      const name = (node.getAttribute("aria-label") || node.getAttribute("title") || node.textContent || "").replace(/\s+/g, " ").trim();
      return !name;
    }).length);
    check(`${label}: visible interactive controls have names`, emptyInteractive === 0, `${emptyInteractive} unnamed controls`);

    const summary = page.locator("details > summary").first();
    if (await summary.count()) {
      await summary.click();
      const opened = await summary.evaluate((node) => node.parentElement?.hasAttribute("open") ?? false);
      check(`${label}: disclosure control opens`, opened);
    }

    check(`${label}: no browser page errors`, pageErrors.length === 0, pageErrors.slice(0, 2).join(" | "));
    check(`${label}: no console errors`, consoleErrors.length === 0, consoleErrors.slice(0, 2).join(" | "));
  } catch (error) {
    failures.push(`${label}: browser scenario crashed — ${error instanceof Error ? error.message : String(error)}`);
  } finally {
    await context.close();
  }
}

await runViewport("320px Korean", 320, 700, "/");
await runViewport("375px Korean", 375, 812, "/");
await runViewport("768px Korean", 768, 900, "/");
await runViewport("1440px Korean", 1440, 1000, "/");
await runViewport("375px English", 375, 812, "/?lang=en");

await browser.close();

console.log(`\nVisual adversarial E2E: ${passes.length} passed / ${failures.length} failed`);
passes.forEach((name) => console.log(`PASS  ${name}`));
failures.forEach((name) => console.error(`FAIL  ${name}`));
if (failures.length) process.exit(1);
