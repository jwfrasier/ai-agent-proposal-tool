// Section 508 / WCAG 2.1 AA audit via axe-core on every page and key form
// states. Fails (exit 1) on any violation.
import puppeteer from "puppeteer-core";
import { readFileSync } from "node:fs";

const axeSource = readFileSync("./node_modules/axe-core/axe.min.js", "utf8");
const BASE = "http://localhost:4823";

const browser = await puppeteer.launch({
  executablePath:
    "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
  headless: "new",
});
const page = await browser.newPage();
await page.setViewport({ width: 1280, height: 950 });

let totalViolations = 0;

async function audit(name) {
  await page.evaluate(axeSource);
  const results = await page.evaluate(() =>
    axe.run(document, {
      runOnly: { type: "tag", values: ["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "section508"] },
    })
  );
  if (results.violations.length === 0) {
    console.log(`PASS ${name}`);
  } else {
    totalViolations += results.violations.length;
    console.log(`FAIL ${name}`);
    for (const v of results.violations) {
      console.log(`  [${v.impact}] ${v.id}: ${v.help}`);
      for (const n of v.nodes.slice(0, 3)) {
        console.log(`    ${n.target.join(" ")}`);
      }
    }
  }
}

const wait = (ms) => new Promise((r) => setTimeout(r, ms));

await page.goto(`${BASE}/#/`, { waitUntil: "networkidle0" });
await wait(1200); // entrance animations settle
await audit("landing");

await page.goto(`${BASE}/#/report`, { waitUntil: "networkidle0" });
await page.evaluate(() => localStorage.clear());
await page.reload({ waitUntil: "networkidle0" });
await wait(300);
await audit("report:start");

// public path → patient step with validation errors visible
await page.evaluate(() => {
  [...document.querySelectorAll('input[type=radio]')][0].click();
});
await wait(200);
await page.evaluate(() => {
  [...document.querySelectorAll("button")].find((b) => b.textContent.trim() === "Continue")?.click();
});
await wait(300);
await page.evaluate(() => {
  [...document.querySelectorAll("button")].find((b) => b.textContent.trim() === "Continue")?.click();
});
await wait(300);
await audit("report:patient+errors");

// tooltip open state
await page.evaluate(() => {
  [...document.querySelectorAll("button.tooltip-btn")][0]?.click();
});
await wait(200);
await audit("report:tooltip-open");

// mobile viewport report
await page.setViewport({ width: 390, height: 844 });
await wait(300);
await audit("report:mobile");
await page.setViewport({ width: 1280, height: 950 });

// narrative prefill panel expanded — fresh report load: the panel only exists
// on step 0, and the audits above have navigated past it
await page.goto(`${BASE}/#/report`, { waitUntil: "networkidle0" });
await page.evaluate(() => localStorage.clear());
await page.reload({ waitUntil: "networkidle0" });
await wait(300);
await page.evaluate(() => {
  document.querySelector(".narrative-start")?.setAttribute("open", "");
});
await wait(200);
await audit("report:narrative-open");

// narrative applied state: mocked suggestion payload → apply receipt + AI
// tags/chips visible (the state a user lands in after "Apply selected answers")
await page.setRequestInterception(true);
const mockAssist = (req) => {
  if (req.url().includes("/api/assist") && req.method() === "POST") {
    req.respond({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({
        fields: {
          vaxDate: "2026-08-04", onsetDate: "2026-08-04",
          vaccineName: "influenza", manufacturer: null, lotNumber: null,
          doseNumber: null, ageAtVax: 9,
          symptoms: "Fever and swollen arm after a flu shot; recovered.",
          outcomes: ["doctor_visit"], recovered: "yes",
          facilityName: null, hospDays: null,
        },
      }),
    });
  } else req.continue();
};
page.on("request", mockAssist);
await page.type(
  ".narrative-start textarea",
  "My daughter got a flu shot on August 4th and had a fever that evening. She is fine now."
);
await page.evaluate(() => {
  [...document.querySelectorAll(".narrative-start button")]
    .find((b) => b.textContent.includes("Suggest form answers"))
    ?.click();
});
await page.waitForSelector(".suggest-card", { timeout: 10000 });
await page.evaluate(() => {
  [...document.querySelectorAll(".suggest-card button")]
    .find((b) => b.textContent.includes("Apply selected answers"))
    ?.click();
});
await page.evaluate(() => {
  [...document.querySelectorAll("input[type=radio]")]
    .find((i) => i.value === "public")
    ?.click();
});
await wait(300);
await audit("report:narrative-applied");
page.off("request", mockAssist);
await page.setRequestInterception(false);

await page.goto(`${BASE}/#/evaluator`, { waitUntil: "networkidle0" });
await wait(1200); // let entrance animations settle (clearProps restores styles)
await audit("evaluator");

await page.goto(`${BASE}/#/faq`, { waitUntil: "networkidle0" });
await audit("faq");

await page.goto(`${BASE}/#/downloads`, { waitUntil: "networkidle0" });
await audit("downloads");

await page.goto(`${BASE}/#/admin`, { waitUntil: "networkidle0" });
await audit("admin");

// nav survey modal open
await page.evaluate(() => {
  [...document.querySelectorAll("footer button")]
    .find((b) => b.textContent.includes("experience"))
    ?.click();
});
await wait(300);
await audit("survey-modal");

await browser.close();
if (totalViolations > 0) {
  console.log(`\n${totalViolations} violation groups — fix before deploy.`);
  process.exit(1);
}
console.log("\nAll audits passed.");
