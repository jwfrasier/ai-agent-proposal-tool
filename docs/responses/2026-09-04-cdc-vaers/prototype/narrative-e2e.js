// Narrative-to-form prefill regression: applied suggestions must be visibly
// confirmed (receipt + rail chips) and must actually render on their steps.
// /api/assist is mocked — no AI spend, tests the client pipeline only.
// Run: node narrative-e2e.js  (requires `vite preview --port 4823`)
import puppeteer from "puppeteer-core";

const BASE = process.env.BASE || "http://localhost:4823";
const PAYLOAD = {
  fields: {
    vaxDate: "2026-08-04",
    onsetDate: "2026-08-04",
    vaccineName: "influenza",
    manufacturer: null,
    lotNumber: null,
    doseNumber: null,
    ageAtVax: 9,
    symptoms:
      "Fever of 102 and a swollen arm the evening after a flu shot; seen by a doctor the next day; has recovered.",
    outcomes: ["doctor_visit"],
    recovered: "yes",
    facilityName: null,
    hospDays: null,
  },
};

let failures = 0;
const check = (name, ok, detail = "") => {
  console.log(`${ok ? "PASS" : "FAIL"}  ${name}${ok || !detail ? "" : ` — ${detail}`}`);
  if (!ok) failures++;
};

const browser = await puppeteer.launch({
  executablePath:
    "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
  headless: "new",
});
const page = await browser.newPage();
await page.setViewport({ width: 1280, height: 1100 });
await page.setRequestInterception(true);
page.on("request", (req) => {
  if (req.url().includes("/api/assist") && req.method() === "POST") {
    req.respond({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify(PAYLOAD),
    });
  } else req.continue();
});

await page.goto(`${BASE}/#/report`, { waitUntil: "networkidle0" });
await page.evaluate(() => localStorage.clear());
await page.reload({ waitUntil: "networkidle0" });
const wait = (ms) => new Promise((r) => setTimeout(r, ms));
await wait(900); // entrance animations

// ---- suggest ----
await page.evaluate(() => {
  document.querySelector(".narrative-start").open = true;
});
await page.type(
  ".narrative-start textarea",
  "My daughter got a flu shot on August 4th. That evening she had a fever of 102 and her arm was swollen. Our doctor saw her the next day. She is fine now. She is 9 years old."
);
await page.evaluate(() => {
  [...document.querySelectorAll(".narrative-start button")]
    .find((b) => b.textContent.includes("Suggest form answers"))
    ?.click();
});
await page.waitForSelector(".suggest-card", { timeout: 10000 });
const rowCount = await page.evaluate(
  () => document.querySelectorAll(".narrative-rows .choice").length
);
check("7 suggestions listed for review", rowCount === 7, `got ${rowCount}`);

// ---- apply → receipt ----
await page.evaluate(() => {
  [...document.querySelectorAll(".suggest-card button")]
    .find((b) => b.textContent.includes("Apply selected answers"))
    ?.click();
});
await wait(300);
const receipt = await page.evaluate(() => {
  const el = document.querySelector(".apply-receipt");
  return el ? el.textContent.replace(/\s+/g, " ") : null;
});
check("apply receipt is shown", !!receipt);
check(
  "receipt says 7 answers applied to the steps ahead",
  !!receipt && receipt.includes("7 answers applied to the steps ahead"),
  receipt || "no receipt"
);
for (const expected of [
  "Who got the vaccine (1)",
  "About the vaccine (2)",
  "What happened after the vaccine (4)",
]) {
  check(`receipt names "${expected}"`, !!receipt && receipt.includes(expected));
}

// ---- pick the public path (makes the adverse-event section visible) ----
await page.evaluate(() => {
  [...document.querySelectorAll("input[type=radio]")]
    .find((i) => i.value === "public")
    ?.click();
});
await wait(200);

// ---- rail chips ----
const chips = await page.evaluate(() =>
  [...document.querySelectorAll(".meter-sections .ai-chip")].map((c) =>
    c.textContent.trim()
  )
);
check(
  "completeness panel shows AI chips (1/2/4)",
  chips.join(",") === "1 AI,2 AI,4 AI",
  chips.join(",") || "none"
);

const fillAndDump = async () => {
  await page.evaluate(() => {
    const setNative = (el, v) => {
      const proto =
        el instanceof HTMLTextAreaElement
          ? HTMLTextAreaElement.prototype
          : el instanceof HTMLSelectElement
            ? HTMLSelectElement.prototype
            : HTMLInputElement.prototype;
      Object.getOwnPropertyDescriptor(proto, "value").set.call(el, v);
      el.dispatchEvent(new Event("input", { bubbles: true }));
      el.dispatchEvent(new Event("change", { bubbles: true }));
    };
    for (const el of document.querySelectorAll(
      "form input, form select, form textarea"
    )) {
      if (el.type === "radio") {
        const group = document.getElementsByName(el.name);
        if (![...group].some((g) => g.checked)) el.click();
      } else if (el.type === "checkbox") {
        const fs = el.closest("fieldset");
        if (fs && ![...fs.querySelectorAll("input")].some((c) => c.checked))
          el.click();
      } else if (!el.value) {
        if (el.type === "date") setNative(el, "2017-01-15");
        else if (el.type === "number") setNative(el, "9");
        else if (el.tagName === "SELECT" && el.options.length > 1)
          setNative(el, el.options[1].value);
        else if (el.type === "text" || el.tagName === "TEXTAREA")
          setNative(el, "test value");
      }
    }
  });
};
const stepState = () =>
  page.evaluate(() => {
    const h2 = document.querySelector("form h2, .page h2")?.textContent?.trim();
    const values = {};
    for (const el of document.querySelectorAll(
      "form input, form select, form textarea"
    )) {
      if (["radio", "checkbox"].includes(el.type)) {
        if (el.checked) values[el.value] = "CHECKED";
      }
    }
    const dateVals = [
      ...document.querySelectorAll("form input[type=date]"),
    ].map((d) => d.value);
    const selectVals = [...document.querySelectorAll("form select")].map(
      (s) => s.value
    );
    const textareaVals = [...document.querySelectorAll("form textarea")].map(
      (t) => t.value
    );
    const numberVals = [
      ...document.querySelectorAll("form input[type=number]"),
    ].map((n) => n.value);
    return {
      h2,
      values,
      dateVals,
      selectVals,
      textareaVals,
      numberVals,
      aiTags: document.querySelectorAll("form .ai-tag").length,
    };
  });

const seen = {};
for (let i = 0; i < 12; i++) {
  const s = await stepState();
  seen[s.h2] = s;
  await fillAndDump();
  const advanced = await page.evaluate(() => {
    const btn = [...document.querySelectorAll("button")].find(
      (b) => b.textContent.trim() === "Continue"
    );
    if (btn) btn.click();
    return !!btn;
  });
  if (!advanced) break;
  await wait(350);
}

const patient = seen["Who got the vaccine"];
check("age 9 prefilled on patient step", patient?.numberVals.includes("9"));
check("patient step shows 1 AI tag", patient?.aiTags === 1, `got ${patient?.aiTags}`);

const vaccine = seen["About the vaccine"];
check(
  "vaccination date prefilled",
  vaccine?.dateVals.includes("2026-08-04"),
  JSON.stringify(vaccine?.dateVals)
);
check(
  "vaccine type prefilled (influenza)",
  vaccine?.selectVals.includes("influenza"),
  JSON.stringify(vaccine?.selectVals)
);
check("vaccine step shows 2 AI tags", vaccine?.aiTags === 2, `got ${vaccine?.aiTags}`);

const event = seen["What happened after the vaccine"];
check(
  "symptoms narrative prefilled",
  event?.textareaVals.some((v) => v.startsWith("Fever of 102")),
  JSON.stringify(event?.textareaVals.map((v) => v.slice(0, 30)))
);
check("onset date prefilled", event?.dateVals.includes("2026-08-04"));
check("doctor-visit outcome checked", event?.values["doctor_visit"] === "CHECKED");
check("recovered=yes checked", event?.values["yes"] === "CHECKED");
check("event step shows 4 AI tags", event?.aiTags === 4, `got ${event?.aiTags}`);

await browser.close();
console.log(failures === 0 ? "\nALL PASS" : `\n${failures} FAILURE(S)`);
process.exit(failures === 0 ? 0 : 1);
