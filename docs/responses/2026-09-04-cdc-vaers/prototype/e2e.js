// End-to-end: complete a public-path report and verify the structured output.
import puppeteer from "puppeteer-core";

const BASE = "http://localhost:4823";
const browser = await puppeteer.launch({
  executablePath:
    "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
  headless: "new",
});
const page = await browser.newPage();
await page.setViewport({ width: 1280, height: 950 });
await page.goto(`${BASE}/#/report`, { waitUntil: "networkidle0" });
await page.evaluate(() => localStorage.clear());
await page.reload({ waitUntil: "networkidle0" });

const clickContinue = () =>
  page.evaluate(() => {
    [...document.querySelectorAll("button")]
      .find((b) => b.textContent.trim() === "Continue")
      ?.click();
  });
const wait = (ms) => new Promise((r) => setTimeout(r, ms));

async function fillVisible(values) {
  await page.evaluate((vals) => {
    const setNative = (el, v) => {
      const proto =
        el instanceof HTMLTextAreaElement
          ? HTMLTextAreaElement.prototype
          : el instanceof HTMLSelectElement
            ? HTMLSelectElement.prototype
            : HTMLInputElement.prototype;
      const setter = Object.getOwnPropertyDescriptor(proto, "value").set;
      setter.call(el, v);
      el.dispatchEvent(new Event("input", { bubbles: true }));
      el.dispatchEvent(new Event("change", { bubbles: true }));
    };
    for (const [labelText, value] of vals) {
      // find by label text
      const labels = [...document.querySelectorAll("label.field-label, legend")];
      const label = labels.find((l) => l.textContent.includes(labelText));
      if (!label) {
        console.log("MISSING LABEL:", labelText);
        continue;
      }
      if (label.tagName === "LEGEND") {
        const fs = label.closest("fieldset");
        const input = [...fs.querySelectorAll("input")].find(
          (i) => i.value === value || i.closest("label")?.textContent.includes(value)
        );
        input?.click();
      } else {
        const el = document.getElementById(label.htmlFor);
        if (el) setNative(el, value);
      }
    }
  }, values);
}

// Step 1: who
await fillVisible([["Who is filling out this report?", "public"]]);
await clickContinue();
await wait(250);

// Step 2: patient
await fillVisible([
  ["Name of the person who got the vaccine", "Doe, Jordan"],
  ["Their date of birth", "1988-04-12"],
  ["How old were they when they got the vaccine?", "38"],
  ["Sex", "female"],
  ["Was she pregnant", "no"],
  ["Their home address", "123 Demo St, Atlanta"],
  ["State", "GA"],
]);
await clickContinue();
await wait(250);

// Step 3: vaccine
await fillVisible([
  ["What day was the vaccine given?", "2026-08-01"],
  ["Which vaccine was it?", "influenza"],
  ["Who makes it?", "Demo Pharma"],
  ["Where was the vaccine given?", "Neighborhood Pharmacy #12"],
]);
await clickContinue();
await wait(250);

// Step 4: what happened (AE path)
await fillVisible([
  ["Tell us what happened", "Arm swelling and fever starting the evening after the shot; resolved after three days."],
  ["What day did the symptoms start?", "2026-08-01"],
  ["Did any of these happen?", "doctor_visit"],
  ["Have they gotten better?", "yes"],
]);
await clickContinue();
await wait(250);

// Step 5: health background (all optional)
await clickContinue();
await wait(250);

// Step 6: docs (optional)
await clickContinue();
await wait(250);

// Step 7: about you
await fillVisible([
  ["Your name", "Doe, Jordan"],
  ["Who are you to the person", "self"],
  ["Phone number", "555-0100"],
  ["Email address", "jordan@example.com"],
  ["Before you send", "true_correct"],
]);
await clickContinue();
await wait(300);

// Review → submit
await page.screenshot({ path: "shots/10-review.png" });
await page.evaluate(() => {
  [...document.querySelectorAll("button")]
    .find((b) => b.textContent.includes("Submit report"))
    ?.click();
});
await wait(500);
await page.screenshot({ path: "shots/11-submitted.png" });

const json = await page.evaluate(
  () => document.querySelector(".output-json")?.textContent || "NO OUTPUT"
);
console.log(json.slice(0, 1600));
await browser.close();
