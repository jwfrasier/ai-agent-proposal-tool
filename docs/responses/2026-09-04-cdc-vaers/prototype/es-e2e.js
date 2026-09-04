// Spanish walk (PWS 1.13 / PRS#19): landing → public report in Spanish →
// provider error path → FAQ → survey; axe on each state; screenshots.
import puppeteer from "puppeteer-core";
import { readFileSync, mkdirSync } from "node:fs";

const axeSource = readFileSync("./node_modules/axe-core/axe.min.js", "utf8");
const BASE = process.env.BASE || "http://localhost:4823";
mkdirSync("shots/es", { recursive: true });
const browser = await puppeteer.launch({
  executablePath: "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
  headless: "new",
});
const page = await browser.newPage();
await page.setViewport({ width: 1280, height: 950 });
let violations = 0;
let shot = 0;
const wait = (ms) => new Promise((r) => setTimeout(r, ms));
async function check(name) {
  await page.evaluate(axeSource);
  const r = await page.evaluate(() =>
    axe.run(document, { runOnly: { type: "tag", values: ["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "section508"] } })
  );
  const lang = await page.evaluate(() => document.documentElement.lang);
  const english = await page.evaluate(() => {
    // crude leak detector: common English UI words in visible text outside lang="en" regions
    const skip = new Set();
    document.querySelectorAll('[lang="en"]').forEach((el) => el.querySelectorAll("*").forEach((c) => skip.add(c)));
    const words = /\b(Continue|Submit|Back|Start over|Choose files|Select one|Why we ask|Frequently asked|Download|Thank you|Send feedback|No thanks|Remove|Ask|Thinking)\b/;
    const hits = [];
    for (const el of document.querySelectorAll("button, label, legend, h1, h2, h3, p, option, summary, span")) {
      if (skip.has(el) || el.closest('[lang="en"]')) continue;
      const tx = (el.childNodes.length && [...el.childNodes].filter((n) => n.nodeType === 3).map((n) => n.textContent).join(" ")) || "";
      if (words.test(tx)) hits.push(tx.trim().slice(0, 40));
    }
    return hits.slice(0, 5);
  });
  await page.screenshot({ path: `shots/es/${String(++shot).padStart(2, "0")}-${name}.png` });
  const status = r.violations.length === 0 ? "PASS" : "FAIL";
  if (r.violations.length) violations += r.violations.length;
  console.log(`${status} ${name} lang=${lang}${english.length ? " ENGLISH-LEAK: " + english.join(" | ") : ""}`);
  for (const v of r.violations) console.log(`  [${v.impact}] ${v.id}: ${v.help} ${v.nodes[0]?.target.join(" ")}`);
}
const click = (text) =>
  page.evaluate((t) => {
    [...document.querySelectorAll("button, summary")].find((b) => b.textContent.trim().startsWith(t))?.click();
  }, text);
const choose = (labelText, optText) =>
  page.evaluate((l, o) => {
    const legend = [...document.querySelectorAll("legend")].find((x) => x.textContent.includes(l));
    const fs = legend?.closest("fieldset");
    const input = [...(fs?.querySelectorAll("label.choice") || [])].find((c) => c.textContent.includes(o))?.querySelector("input");
    input?.click();
  }, labelText, optText);
const fill = (labelText, value) =>
  page.evaluate((l, v) => {
    const label = [...document.querySelectorAll("label.field-label")].find((x) => x.textContent.includes(l));
    const el = label && document.getElementById(label.htmlFor);
    if (!el) return `MISSING ${l}`;
    const proto = el instanceof HTMLTextAreaElement ? HTMLTextAreaElement.prototype : el instanceof HTMLSelectElement ? HTMLSelectElement.prototype : HTMLInputElement.prototype;
    Object.getOwnPropertyDescriptor(proto, "value").set.call(el, v);
    el.dispatchEvent(new Event("input", { bubbles: true }));
    el.dispatchEvent(new Event("change", { bubbles: true }));
    return "ok";
  }, labelText, value);

await page.goto(`${BASE}/?lang=es#/`, { waitUntil: "networkidle0" });
await page.evaluate(() => { localStorage.removeItem("vaers-demo-answers"); localStorage.removeItem("vaers-demo-config"); });
await page.reload({ waitUntil: "networkidle0" });
await wait(600);
await check("landing");
console.log("title:", await page.title());
// toggle check: EN → ES keeps state
await page.goto(`${BASE}/?lang=es#/report`, { waitUntil: "networkidle0" });
await wait(400);
await check("report-step1");
await choose("Quién está llenando", "Paciente, padre/madre");
await click("Continuar");
await wait(500);
await check("report-patient");
// validation in Spanish
await click("Continuar");
await wait(300);
await check("report-patient-errors");
console.log(await fill("Nombre de la persona", "Prueba Sintética"));
console.log(await fill("fecha de nacimiento", "2015-03-02"));
await choose("Sexo", "Femenino");
console.log(await fill("Qué edad tenía", "10"));
console.log(await fill("dirección de residencia", "123 Calle Falsa"));
console.log(await fill("Estado", "TX"));
await click("Continuar");
await wait(500);
await check("report-vaccine");
console.log(await fill("Qué día se aplicó", "2026-08-04"));
console.log(await fill("Cuál vacuna fue", "influenza"));
console.log(await fill("Quién la fabrica", "Sanofi"));
console.log(await fill("Dónde se aplicó", "Farmacia"));
await click("Continuar");
await wait(500);
await check("report-event");
// Switch language mid-form: answers must survive
await click("EN");
await wait(300);
const enTitle = await page.evaluate(() => document.querySelector("h2")?.textContent);
await click("ES");
await wait(300);
const kept = await page.evaluate(() => JSON.parse(localStorage.getItem("vaers-demo-answers") || "{}").patientName);
console.log(`toggle mid-form: EN h2="${enTitle}" · answers kept=${kept}`);
// provider path: error with no AE in Spanish
await page.goto(`${BASE}/?lang=es#/report`, { waitUntil: "networkidle0" });
await page.evaluate(() => localStorage.removeItem("vaers-demo-answers"));
await page.reload({ waitUntil: "networkidle0" });
await wait(400);
await choose("Quién está llenando", "Profesional de la salud");
await wait(200);
await choose("Qué está reportando", "sin evento adverso");
await wait(300);
await check("provider-error-branch");
const note = await page.evaluate(() => document.querySelector(".branch-note")?.textContent);
console.log("branch note:", note);
await page.goto(`${BASE}/?lang=es#/faq`, { waitUntil: "networkidle0" });
await wait(300);
await check("faq");
await page.goto(`${BASE}/?lang=es#/downloads`, { waitUntil: "networkidle0" });
await wait(300);
await check("downloads");
await page.goto(`${BASE}/?lang=es#/admin`, { waitUntil: "networkidle0" });
await wait(300);
await check("admin");
await page.goto(`${BASE}/?lang=es#/`, { waitUntil: "networkidle0" });
await click("Cuéntenos su experiencia");
await wait(400);
await check("survey");
// mobile
await page.setViewport({ width: 390, height: 844, isMobile: true, hasTouch: true });
await page.goto(`${BASE}/?lang=es#/report`, { waitUntil: "networkidle0" });
await wait(400);
await check("mobile-report");
await browser.close();
console.log(violations ? `AXE VIOLATIONS: ${violations}` : "AXE CLEAN (Spanish)");
process.exit(violations ? 1 : 0);
