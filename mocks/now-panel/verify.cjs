/* eslint-disable @typescript-eslint/no-require-imports */
const fs = require("node:fs");
const path = require("node:path");
const { chromium } = require("playwright");

const base = process.env.MOCK_BASE || "http://127.0.0.1:4173/mocks/now-panel";
const output = path.join(__dirname, "screenshots");
const chrome = "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome";
const pages = [
  "01-live-ledger",
  "02-workstreams",
  "03-day-score",
  "04-herdr-map",
];

fs.mkdirSync(output, { recursive: true });

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

(async () => {
  const browser = await chromium.launch({ headless: true, executablePath: chrome });
  const failures = [];

  for (const name of pages) {
    const context = await browser.newContext({
      viewport: { width: 1440, height: 900 },
      colorScheme: "light",
      reducedMotion: "reduce",
    });
    const page = await context.newPage();
    const errors = [];
    page.on("console", (message) => {
      if (message.type() === "error") errors.push(`console: ${message.text()}`);
    });
    page.on("pageerror", (error) => errors.push(`page: ${error.message}`));

    try {
      await page.goto(`${base}/${name}.html`, { waitUntil: "networkidle" });
      await page.locator("#concept-root").waitFor({ state: "visible" });

      const duplicateIds = await page.evaluate(() => {
        const ids = [...document.querySelectorAll("[id]")].map((element) => element.id);
        return ids.filter((id, index) => ids.indexOf(id) !== index);
      });
      assert(duplicateIds.length === 0, `${name}: duplicate ids ${duplicateIds.join(", ")}`);

      const unnamed = await page.evaluate(() =>
        [...document.querySelectorAll("button, a")]
          .filter((element) => {
            const style = getComputedStyle(element);
            const visible = style.display !== "none" && style.visibility !== "hidden";
            const name = element.getAttribute("aria-label") || element.textContent.trim();
            return visible && !name;
          })
          .map((element) => element.outerHTML.slice(0, 120)),
      );
      assert(unnamed.length === 0, `${name}: unnamed controls ${unnamed.join(" | ")}`);

      const overflow = await page.evaluate(() => ({
        body: document.documentElement.scrollWidth - document.documentElement.clientWidth,
        concept: document.querySelector("#concept-root").scrollWidth - document.querySelector("#concept-root").clientWidth,
      }));
      assert(overflow.body <= 1, `${name}: desktop body overflow ${overflow.body}px`);
      assert(overflow.concept <= 1, `${name}: desktop concept overflow ${overflow.concept}px`);

      await page.locator(".now-pane").screenshot({ path: path.join(output, `${name}.png`) });

      const themeButton = page.locator(".prototype-switch [data-theme-toggle]");
      assert((await themeButton.count()) === 1, `${name}: theme toggle is not unique`);
      await themeButton.click();
      assert((await page.locator("html[data-theme=dark]").count()) === 1, `${name}: dark theme did not apply`);
      await page.locator(".now-pane").screenshot({ path: path.join(output, `${name}-dark.png`) });

      const zoom = page.locator(".pane-zoom");
      await zoom.click();
      assert((await page.locator(".now-pane.is-zoomed").count()) === 1, `${name}: zoom did not open`);
      await page.keyboard.press("Escape");
      assert((await page.locator(".now-pane.is-zoomed").count()) === 0, `${name}: Escape did not restore pane`);

      const interactive = page.locator("#concept-root button");
      const interactiveCount = await interactive.count();
      if (interactiveCount > 0) {
        const firstControl = interactive.nth(0);
        await firstControl.focus();
        await page.keyboard.press("Enter");
      }

      assert(errors.length === 0, `${name}: ${errors.join("; ")}`);
    } catch (error) {
      failures.push(error.message);
    }

    await context.close();

    const mobile = await browser.newContext({
      viewport: { width: 390, height: 844 },
      colorScheme: "light",
      reducedMotion: "reduce",
      isMobile: true,
    });
    const mobilePage = await mobile.newPage();
    const mobileErrors = [];
    mobilePage.on("console", (message) => {
      if (message.type() === "error") mobileErrors.push(message.text());
    });
    mobilePage.on("pageerror", (error) => mobileErrors.push(error.message));

    try {
      await mobilePage.goto(`${base}/${name}.html`, { waitUntil: "networkidle" });
      await mobilePage.locator("#concept-root").waitFor({ state: "visible" });
      const overflow = await mobilePage.evaluate(() => ({
        body: document.documentElement.scrollWidth - document.documentElement.clientWidth,
        concept: document.querySelector("#concept-root").scrollWidth - document.querySelector("#concept-root").clientWidth,
      }));
      assert(overflow.body <= 1, `${name}: mobile body overflow ${overflow.body}px`);
      assert(overflow.concept <= 1, `${name}: mobile concept overflow ${overflow.concept}px`);
      assert(mobileErrors.length === 0, `${name}: mobile errors ${mobileErrors.join("; ")}`);
      await mobilePage.locator(".now-pane").screenshot({ path: path.join(output, `${name}-mobile.png`) });
    } catch (error) {
      failures.push(error.message);
    }

    await mobile.close();
  }

  const indexContext = await browser.newContext({ viewport: { width: 1440, height: 900 }, colorScheme: "light" });
  const indexPage = await indexContext.newPage();
  const indexErrors = [];
  indexPage.on("console", (message) => {
    if (message.type() === "error") indexErrors.push(message.text());
  });
  indexPage.on("pageerror", (error) => indexErrors.push(error.message));
  try {
    await indexPage.goto(`${base}/index.html`, { waitUntil: "networkidle" });
    const mockLinks = indexPage.locator('a.open-link[href$=".html"]');
    assert((await mockLinks.count()) === 4, "index: expected four concept links");
    const indexOverflow = await indexPage.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
    assert(indexOverflow <= 1, `index: desktop overflow ${indexOverflow}px`);
    assert(indexErrors.length === 0, `index: ${indexErrors.join("; ")}`);
    await indexPage.screenshot({ path: path.join(output, "index.png"), fullPage: true });
    await indexPage.goto(`${base}/research.html`, { waitUntil: "networkidle" });
    assert((await indexPage.locator(".research-table").count()) === 1, "research: field table missing");
    const researchOverflow = await indexPage.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
    assert(researchOverflow <= 1, `research: desktop overflow ${researchOverflow}px`);
    await indexPage.screenshot({ path: path.join(output, "research.png"), fullPage: true });
  } catch (error) {
    failures.push(error.message);
  }
  await indexContext.close();

  const stateContext = await browser.newContext({ viewport: { width: 900, height: 700 }, colorScheme: "light" });
  const statePage = await stateContext.newPage();
  try {
    await statePage.goto(`${base}/01-live-ledger.html?state=loading`, { waitUntil: "networkidle" });
    assert((await statePage.locator(".mock-loading").count()) === 1, "state: loading view missing");
    await statePage.goto(`${base}/01-live-ledger.html?state=empty`, { waitUntil: "networkidle" });
    assert((await statePage.getByText("the desk is quiet", { exact: true }).count()) === 1, "state: empty view missing");
    await statePage.goto(`${base}/01-live-ledger.html?state=error`, { waitUntil: "networkidle" });
    const retry = statePage.getByRole("button", { name: "retry", exact: true });
    assert((await retry.count()) === 1, "state: retry control missing");
    await retry.click();
    assert((await statePage.locator(".ledger").count()) === 1, "state: retry did not recover");
  } catch (error) {
    failures.push(error.message);
  }
  await stateContext.close();

  await browser.close();
  if (failures.length) {
    console.error(failures.join("\n"));
    process.exitCode = 1;
  } else {
    console.log(`Verified ${pages.length} concepts, index, and loading/empty/error states.`);
  }
})();
