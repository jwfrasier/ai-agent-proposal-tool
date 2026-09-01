// CDC VAERS RFQ 75D301-26-Q-00146 — renders the quote package to out/.
// Vol I: cover (unnumbered) + tab body self-numbered 1..N against the 15pp cap +
// resume annex (excluded from cap, numbered separately). Companions: Vol II price PDF,
// DMP, ATCH1 AI plan, ACR. TNR 12pt, Letter, 1" margins; tables 10pt (>= RFQ floor).
// [FLAG: ...] markers render highlighted — pass-1 draft blockers, must be gone before send.
const fs = require('fs');
const path = require('path');
const { execFileSync } = require('child_process');
const SCRATCH = '/private/tmp/claude-501/-Users-joseph-govcontracts-dashboard/f0d25a34-3af3-476c-a3e1-15001c738034/scratchpad';
const { marked } = require('/Users/joseph/govcontracts-dashboard/node_modules/marked');
const puppeteer = require(path.join(SCRATCH, 'node_modules/puppeteer-core'));

const DIR = __dirname;
const OUT = path.join(DIR, 'out');
const BUILD = path.join(DIR, '.build');
const CHROME = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
const MERGE = '/Users/joseph/govcontracts-dashboard/docs/responses/2026-07-30-onc-argos/merge-pdf.swift';
const SOL = 'RFQ 75D301-26-Q-00146';

const CSS = `
  html, body { font-family: "Times New Roman", Times, serif; font-size: 12pt; line-height: 1.18; color: #000; margin: 0; padding: 0; }
  * { font-family: "Times New Roman", Times, serif !important; }
  h1 { font-size: 14pt; font-weight: bold; margin: 0 0 10pt 0; page-break-after: avoid; }
  h2 { font-size: 13pt; font-weight: bold; margin: 12pt 0 5pt 0; page-break-after: avoid; }
  h3 { font-size: 12pt; font-weight: bold; margin: 9pt 0 3pt 0; page-break-after: avoid; }
  p { margin: 0 0 6pt 0; }
  ul, ol { margin: 0 0 6pt 0; padding-left: 22pt; }
  li { margin-bottom: 3pt; }
  hr { border: none; border-top: 0.5pt solid #000; margin: 10pt 0; }
  a { color: #000; text-decoration: none; }
  strong { font-weight: bold; } em { font-style: italic; }
  table { border-collapse: collapse; width: 100%; margin: 6pt 0 10pt 0; font-size: 10pt; page-break-inside: auto; }
  th, td { border: 0.5pt solid #000; padding: 3pt 5pt; vertical-align: top; text-align: left; }
  th { background: #e8e8e8; font-weight: bold; }
  tr { page-break-inside: avoid; }
  .flag { background: #ffef9e; font-weight: bold; }
  .vol-title { font-size: 18pt; font-weight: bold; text-align: center; margin: 150pt 0 10pt 0; }
  .vol-sub { font-size: 13pt; text-align: center; margin: 0 0 6pt 0; }
  .section-break { page-break-before: always; }
`;

function prep(md) {
  return md
    // strip the leading "# Tab X — ..." draft titles' internal annotations and note paragraphs
    .replace(/^\*\((?:Draft|Companion gate|PASS\/FAIL companion)[\s\S]*?\)\*\s*$/gm, '')
    .replace(/^\*\(End [\s\S]*?\)\*\s*$/gm, '')
    .replace(/ — DRAFT v1/g, '')
    // highlight FLAG markers (pass-1 blockers)
    .replace(/\[FLAG:?([^\]]*)\]/g, '<span class="flag">[FLAG:$1]</span>');
}
function read(rel) { return fs.readFileSync(path.join(DIR, rel), 'utf8'); }
function html(inner, title) { return `<meta charset="utf-8"><title>${title}</title><style>${CSS}</style>${inner}`; }
function footer(label) {
  return `<div style="width:100%;font-family:'Times New Roman',Times,serif;font-size:9pt;color:#000;padding:0 1in;display:flex;justify-content:space-between;">
<span>Frasier Digital, LLC &middot; ${SOL} &middot; ${label}</span><span>Page <span class="pageNumber"></span> of <span class="totalPages"></span></span></div>`;
}
const BLANK = '<div></div>';
const PDF_OPTS = { format: 'Letter', printBackground: true, preferCSSPageSize: false, margin: { top: '1in', bottom: '1in', left: '1in', right: '1in' } };

(async () => {
  fs.mkdirSync(OUT, { recursive: true });
  fs.mkdirSync(BUILD, { recursive: true });
  const browser = await puppeteer.launch({ executablePath: CHROME, headless: 'new', args: ['--no-sandbox', '--font-render-hinting=none'] });

  async function render(name, inner, outFile, label) {
    const page = await browser.newPage();
    const h = html(inner, name);
    fs.writeFileSync(path.join(BUILD, `${name}.html`), h);
    await page.setContent(h, { waitUntil: 'load' });
    await page.pdf({ ...PDF_OPTS, path: outFile, displayHeaderFooter: !!label, headerTemplate: BLANK, footerTemplate: label ? footer(label) : BLANK });
    await page.close();
    console.log('rendered', name, '->', path.basename(outFile));
  }

  // ---- Vol I cover (unnumbered, excluded from cap) ----
  const cover = `<div class="vol-title">VOLUME I — TECHNICAL</div>
<div class="vol-sub">Frasier Digital, LLC</div>
<div class="vol-sub">${SOL} &middot; Modernized VAERS Reporting Application</div>
<div class="vol-sub" style="margin-top:24pt;">Submitted to: H. Dale Bish, Contracting Officer &middot; uwo8@cdc.gov</div>
<div class="vol-sub">Prototype for evaluation: https://vaers-demo.frasierdigital.com</div>
<div class="vol-sub" style="margin-top:24pt;">Tab 1 &middot; Executive Summary &nbsp;&nbsp; Tab 2-1 &middot; Technical Plan &nbsp;&nbsp; Tab 2-2 &middot; Prototype<br/>Tab 3-1 &middot; Management Plan &nbsp;&nbsp; Tab 3-2 &middot; Key Personnel Resumes &nbsp;&nbsp; Tab 4 &middot; Similar Experience</div>`;

  // ---- Vol I body: tabs vs the 15-page cap ----
  const tabs = [
    prep(read('tab1-exec-summary.md')),
    prep(read('tab2-1-technical-plan.md')),
    prep(read('tab2-2-prototype.md')),
    prep(read('tab3-1-management-plan.md')),
    prep(read('tab4-similar-experience.md')),
  ];
  const body = tabs.map((s, i) => (i === 0 ? '' : '<div class="section-break"></div>\n\n') + s).join('\n\n');
  const cPdf = path.join(BUILD, 'vol1-cover.pdf');
  const bPdf = path.join(BUILD, 'vol1-body.pdf');
  const rPdf = path.join(BUILD, 'vol1-resumes.pdf');
  await render('vol1-cover', cover, cPdf, null);
  await render('vol1-body', marked.parse(body), bPdf, 'Volume I — Technical');
  // ---- Resume annex (Tab 3-2, excluded from cap, separately numbered) ----
  const resumes = [prep(read('resume-joseph-frasier.md')), prep(read('resume-ryan-daley.md'))]
    .map((s, i) => (i === 0 ? '' : '<div class="section-break"></div>\n\n') + s).join('\n\n');
  await render('vol1-resumes', marked.parse('# Tab 3-2 — Key Personnel Resumes\n\n' + resumes), rPdf, 'Volume I Tab 3-2 — Resumes (excluded from page limitation)');
  console.log(execFileSync('swift', [MERGE, path.join(OUT, 'Frasier-Digital-Vol-I-Technical.pdf'), cPdf, bPdf, rPdf], { encoding: 'utf8' }).trim());

  // ---- Companion gate documents ----
  await render('dmp', marked.parse(prep(read('dmp.md'))), path.join(OUT, 'Frasier-Digital-Data-Management-Plan.pdf'), 'Data Management Plan');
  await render('atch1', marked.parse(prep(read('atch1-ai-use-plan.md'))), path.join(OUT, 'Frasier-Digital-ATCH1-AI-Use-Plan.pdf'), 'Attachment 1 — AI Use Compliance and Risk Management Plan');
  await render('acr', marked.parse(prep(read('acr-draft.md'))), path.join(OUT, 'Frasier-Digital-ACR.pdf'), 'Accessibility Conformance Report');
  await render('hhs508', marked.parse(prep(read('hhs-508-checklist.md'))), path.join(OUT, 'Frasier-Digital-HHS-508-Checklist.pdf'), 'HHS Section 508 Accessibility Conformance Checklist');
  await render('irp', marked.parse(prep(read('incident-response-plan.md'))), path.join(OUT, 'Frasier-Digital-Incident-Response-Plan.pdf'), 'Incident Response Plan');

  // ---- Vol II price PDF (mirrors the Excel workbook) ----
  const lines = [
    ['Program Manager / Lead Architect', 'Key Personnel', 546, 235],
    ['Security & Compliance Lead (SA&A / ATD / EPLC artifacts)', 'Key Personnel (dual role)', 340, 235],
    ['Technical Lead — Healthcare IT', 'Key Personnel', 390, 205],
    ['Integration & Data Engineer', '', 234, 175],
    ['Frontend Engineer / Test Automation', '', 780, 135],
    ['QA & Accessibility Engineer', '', 300, 135],
    ['Content & UX Research Specialist', '', 190, 105],
  ];
  const money = n => '$' + n.toLocaleString('en-US');
  let sumH = 0, sumE = 0;
  const rows = lines.map(([cat, d, h, r]) => { sumH += h; sumE += h * r; return `<tr><td>${cat}</td><td>${d}</td><td style="text-align:right">${h}</td><td style="text-align:right">${money(r)}.00</td><td style="text-align:right">${money(h * r)}</td></tr>`; }).join('');
  const vol2 = `# Volume II — Price Quote

Frasier Digital, LLC · ${SOL} — Modernized VAERS Reporting Application
Firm-Fixed-Price · PoP 9/28/2026–6/27/2027 (9 months) · Payment monthly in arrears per accepted deliverables (Amendment 0001 Q&A 89)
This PDF mirrors the editable Excel workbook (Vol-II-Price-Quote-FrasierDigital.xlsx) submitted with it.

## CLIN Summary

<table><tr><th>CLIN</th><th>Description</th><th>Type</th><th style="text-align:right">Price</th></tr>
<tr><td>0001</td><td>Design, development, deployment, and compliance delivery of the Modernized VAERS Reporting Application per the PWS (nonseverable services per Amendment 0001)</td><td>FFP</td><td style="text-align:right">${money(495000)}</td></tr>
<tr><td>0002</td><td>Travel — onboarding (direct reimbursement per FTR, no fee)</td><td>NTE</td><td style="text-align:right">${money(31500)}</td></tr>
<tr><td>0003</td><td>Travel — meetings (direct reimbursement per FTR, no fee)</td><td>NTE</td><td style="text-align:right">${money(31500)}</td></tr>
<tr><td></td><td><strong>Total (CLIN 0001 + travel NTE ceilings)</strong></td><td></td><td style="text-align:right"><strong>${money(558000)}</strong></td></tr></table>

## CLIN 0001 — Labor Itemization

Fully burdened firm-fixed billing rates; hours reconcile with the staffing commitments in Volume I, Tab 3-1.

<table><tr><th>Labor Category</th><th>Designation</th><th style="text-align:right">Hours</th><th style="text-align:right">Rate ($/hr)</th><th style="text-align:right">Extended</th></tr>
${rows}
<tr><td><strong>Subtotal</strong></td><td></td><td style="text-align:right"><strong>${sumH}</strong></td><td></td><td style="text-align:right"><strong>${money(sumE)}</strong></td></tr>
<tr><td>Firm-fixed-price adjustment (rounding to CLIN price)</td><td></td><td></td><td></td><td style="text-align:right">${money(495000 - sumE)}</td></tr>
<tr><td><strong>CLIN 0001 FIRM FIXED PRICE</strong></td><td></td><td></td><td></td><td style="text-align:right"><strong>${money(495000)}</strong></td></tr></table>

## Other Direct Costs and Separately Priced IT Supplies / Services

<table><tr><th>Item</th><th>Basis</th><th style="text-align:right">Price</th></tr>
<tr><td>Software licenses, subscriptions, IT supplies</td><td>None required — all custom code delivered with Government rights per FAR 52.227-17 (Amendment 0001 Q&A 91); development on contractor equipment; laptops and PIV cards are Government-furnished</td><td style="text-align:right">$0</td></tr>
<tr><td>Cloud hosting and AI services</td><td>None required — CDC-managed Azure environment and CDC enterprise Azure OpenAI (EDAV) are Government-furnished</td><td style="text-align:right">$0</td></tr>
<tr><td>Other direct costs (excluding travel CLINs 0002/0003)</td><td>None</td><td style="text-align:right">$0</td></tr>
<tr><td><strong>Total ODCs</strong></td><td></td><td style="text-align:right"><strong>$0</strong></td></tr></table>`;
  await render('vol2-price', marked.parse(vol2), path.join(OUT, 'Frasier-Digital-Vol-II-Price.pdf'), 'Volume II — Price');

  await browser.close();
})();
