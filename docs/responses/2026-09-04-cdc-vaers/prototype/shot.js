// Screenshot harness for self-review: desktop + mobile, key flows.
import puppeteer from "puppeteer-core";

const OUT = process.env.SHOT_OUT || "./shots";
const BASE = "http://localhost:4823";

const browser = await puppeteer.launch({
  executablePath:
    "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
  headless: "new",
});
const page = await browser.newPage();

async function shot(name, { width = 1280, height = 900 } = {}) {
  await page.setViewport({ width, height });
  await new Promise((r) => setTimeout(r, 350));
  await page.screenshot({ path: `${OUT}/${name}.png`, fullPage: false });
  console.log("shot", name);
}

// 1. landing desktop + mobile
await page.goto(`${BASE}/#/`, { waitUntil: "networkidle0" });
await shot("01-landing-desktop");
await shot("02-landing-mobile", { width: 390, height: 844 });

// 2. report start (public path)
await page.setViewport({ width: 1280, height: 900 });
await page.goto(`${BASE}/#/report`, { waitUntil: "networkidle0" });
await new Promise((r) => setTimeout(r, 300));
await shot("03-report-start");

// choose public → continue
await page.evaluate(() => {
  const radios = [...document.querySelectorAll('input[type=radio]')];
  radios[0].click();
});
await new Promise((r) => setTimeout(r, 200));
await page.evaluate(() => {
  [...document.querySelectorAll("button")]
    .find((b) => b.textContent.trim() === "Continue")
    ?.click();
});
await new Promise((r) => setTimeout(r, 300));
await shot("04-patient-public-plain");

// 3. provider path with vaccine-error-no-AE (PRS#1)
await page.evaluate(() => {
  [...document.querySelectorAll("button")]
    .find((b) => b.textContent.trim() === "Start over")
    ?.click();
});
await new Promise((r) => setTimeout(r, 300));
await page.evaluate(() => {
  const provider = [...document.querySelectorAll('input[type=radio]')].find(
    (r) => r.value === "provider"
  );
  provider?.click();
});
await new Promise((r) => setTimeout(r, 300));
await page.evaluate(() => {
  const err = [...document.querySelectorAll('input[type=radio]')].find(
    (r) => r.value === "vaccine_error_no_ae"
  );
  err?.click();
});
await new Promise((r) => setTimeout(r, 200));
await page.evaluate(() => {
  [...document.querySelectorAll("button")]
    .find((b) => b.textContent.trim() === "Continue")
    ?.click();
});
await new Promise((r) => setTimeout(r, 300));
await shot("05-provider-error-branch");

// validation errors: continue with empty patient section
await page.evaluate(() => {
  [...document.querySelectorAll("button")]
    .find((b) => b.textContent.trim() === "Continue")
    ?.click();
});
await new Promise((r) => setTimeout(r, 300));
await shot("06-validation-errors");

// 4. mobile report view
await shot("07-report-mobile", { width: 390, height: 844 });

// 5. admin
await page.setViewport({ width: 1280, height: 900 });
await page.goto(`${BASE}/#/admin`, { waitUntil: "networkidle0" });
await new Promise((r) => setTimeout(r, 300));
await shot("08-admin");

// 6. faq
await page.goto(`${BASE}/#/faq`, { waitUntil: "networkidle0" });
await shot("09-faq");

await browser.close();
console.log("done");
