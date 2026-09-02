// USACE CWMS PANHEC-26-P-0000-026407 — renders the proposal package to out/.
// Vol I: cover + TOC (unnumbered, excluded) + body self-numbered 1..N against the 30-page cap +
// annex (resumes ≤2pp each, letters of commitment; excluded, numbered separately).
// Vol II: past performance (+ PPQ PDF appended when present). Vol III: price narrative. Cover letter.
// TNR 12pt, Letter, 1in margins, tables 10pt. Header/footer carry company name, date, RFP number
// (instr. 1.2). [FLAG: ...] markers render highlighted — must be gone before send.
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
const SOL = 'PANHEC-26-P-0000-026407';
const DATE = process.env.PROPOSAL_DATE || 'September 2, 2026';

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
  code { font-family: "Courier New", Courier, monospace !important; font-size: 10pt; }
  pre { font-family: "Courier New", Courier, monospace !important; font-size: 9pt; line-height: 1.15; margin: 6pt 0 10pt 0; white-space: pre-wrap; overflow-wrap: anywhere; max-width: 100%; }
  pre code { font-size: 9pt; }
  code { overflow-wrap: anywhere; }
  table { border-collapse: collapse; width: 100%; max-width: 100%; margin: 6pt 0 10pt 0; font-size: 10pt; page-break-inside: auto; }
  th, td { border: 0.5pt solid #000; padding: 3pt 5pt; vertical-align: top; text-align: left; overflow-wrap: anywhere; }
  th { background: #e8e8e8; font-weight: bold; white-space: nowrap; }
  tr { page-break-inside: avoid; }
  .flag { background: #ffef9e; font-weight: bold; }
  .vol-title { font-size: 18pt; font-weight: bold; text-align: center; margin: 150pt 0 10pt 0; }
  .vol-sub { font-size: 13pt; text-align: center; margin: 0 0 6pt 0; }
  .section-break { page-break-before: always; }
  .toc td { border: none; padding: 2pt 4pt; font-size: 12pt; }
  .toc { margin-top: 10pt; }
`;

function prep(md) {
  return md
    .replace(/^\*\((?:Working outline|Draft|Instr\.|Rendered one per page)[\s\S]*?\)\*\s*$/gm, '')
    .replace(/^\*\(Annex follows[\s\S]*?\)\*\s*$/gm, '')
    .replace(/\[FLAG:?([^\]]*)\]/g, '<span class="flag">[FLAG:$1]</span>');
}
const read = rel => fs.readFileSync(path.join(DIR, rel), 'utf8');
const html = (inner, title) => `<meta charset="utf-8"><title>${title}</title><style>${CSS}</style>${inner}`;
function footer(label) {
  return `<div style="width:100%;font-family:'Times New Roman',Times,serif;font-size:9pt;color:#000;padding:0 1in;display:flex;justify-content:space-between;">
<span>Frasier Digital, LLC &middot; ${DATE} &middot; Solicitation ${SOL} &middot; ${label}</span><span>Page <span class="pageNumber"></span> of <span class="totalPages"></span></span></div>`;
}
const BLANK = '<div></div>';
const PDF_OPTS = { format: 'Letter', printBackground: true, preferCSSPageSize: false, margin: { top: '1in', bottom: '1in', left: '1in', right: '1in' } };
const pageCount = pdf => (fs.readFileSync(pdf).toString('latin1').match(/\/Type\s*\/Page[^s]/g) || []).length;

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
    console.log('rendered', name, '->', path.basename(outFile), `(${pageCount(outFile)} pp)`);
  }
  const brk = (s, i) => (i === 0 ? '' : '<div class="section-break"></div>\n\n') + s;

  // ---------- Vol I ----------
  const sections = [
    ['Summary Section', 'vol1-summary.md'],
    ['Factor 1, Tab A — Technical Approach', 'f1-tabA-technical-approach.md'],
    ['Factor 1, Tab B — UI Improvements', 'f1-tabB-ui-improvements.md'],
    ['Factor 1, Tab C — Load Testing', 'f1-tabC-load-testing.md'],
    ['Factor 2, Tab A — Management Approach', 'f2-tabA-management-approach.md'],
    ['Factor 2, Tab B — Key Personnel Resumes and Experience', 'f2-tabB-key-personnel.md'],
    ['Factor 2, Tab C — Transition Plan', 'f2-tabC-transition-plan.md'],
  ];
  // pass 1: count pages per section (each starts on a new page in the body, so counts are exact)
  const starts = []; let cursor = 1;
  for (const [title, file] of sections) {
    const tmp = path.join(BUILD, `count-${path.basename(file, '.md')}.pdf`);
    await render(`count-${path.basename(file, '.md')}`, marked.parse(prep(read(file))), tmp, 'x');
    starts.push([title, cursor]); cursor += pageCount(tmp);
  }
  const bodyPages = cursor - 1;
  const body = sections.map(([, f], i) => brk(prep(read(f)), i)).join('\n\n');

  const cover = `<div class="vol-title">VOLUME I — TECHNICAL</div>
<div class="vol-sub">Factor 1 — Response to Project Technical Approach &nbsp;&middot;&nbsp; Factor 2 — Management Approach, Key Personnel, and Transition Plan</div>
<div class="vol-sub" style="margin-top:18pt;">Frasier Digital, LLC</div>
<div class="vol-sub">20915 Mystic Stone Dr, Tomball, TX 77375 &middot; UEI PY8MJ4JPHJ45 &middot; CAGE 213L8</div>
<div class="vol-sub" style="margin-top:18pt;">Solicitation ${SOL}</div>
<div class="vol-sub">CWMS Database Authorization Maintenance and Improvements</div>
<div class="vol-sub">U.S. Army Corps of Engineers &middot; Institute for Water Resources &middot; Hydrologic Engineering Center</div>
<div class="vol-sub" style="margin-top:18pt;">Submitted to: Quan Nguyen, Contract Specialist &middot; David A. Kaplan, Contracting Officer &middot; CEHEC-CT</div>
<div class="vol-sub">${DATE}</div>`;
  const toc = `<h1>Table of Contents — Volume I</h1>
<table class="toc">${starts.map(([t, p]) => `<tr><td>${t}</td><td style="text-align:right">${p}</td></tr>`).join('')}
<tr><td>Annex — Key Personnel Resumes (four, two pages each; excluded from page limitation)</td><td style="text-align:right">A-1</td></tr>
<tr><td>Annex — Letters of Commitment (four, covering the five key roles; excluded from page limitation)</td><td style="text-align:right">A-9</td></tr></table>
<p style="margin-top:14pt;font-size:10pt;">Volume I body: ${bodyPages} pages against the 30-page limit (instr. 2.1). Cover, this table of contents, resumes, and letters of commitment are excluded from the page count per the Government's answer to question 20.</p>`;

  const cPdf = path.join(BUILD, 'vol1-cover.pdf'), tPdf = path.join(BUILD, 'vol1-toc.pdf');
  const bPdf = path.join(BUILD, 'vol1-body.pdf'), rPdf = path.join(BUILD, 'vol1-resumes.pdf'), lPdf = path.join(BUILD, 'vol1-locs.pdf');
  await render('vol1-cover', cover, cPdf, null);
  await render('vol1-toc', toc, tPdf, null);
  await render('vol1-body', marked.parse(body), bPdf, 'Volume I — Technical');
  const resumeFiles = ['resume-joseph-frasier.md', 'resume-scott-carpenter.md', 'resume-ryan-daley.md', 'resume-randy-chong.md'];
  for (const f of resumeFiles) { // per-resume ≤2pp check
    const tmp = path.join(BUILD, `count-${f}.pdf`);
    await render(`count-${f}`, marked.parse(prep(read(f))), tmp, 'x');
    if (pageCount(tmp) > 2) console.log(`!! ${f} is ${pageCount(tmp)} pages (limit 2)`);
  }
  const resumes = resumeFiles.map((f, i) => brk(prep(read(f)), i)).join('\n\n');
  await render('vol1-resumes', marked.parse('# Annex — Key Personnel Resumes\n\n' + resumes), rPdf, 'Volume I Annex — Resumes (excluded from page limitation)');
  // Signed LOCs: drop signed PDFs into to-sign/signed/ and they replace the rendered (unsigned) annex.
  const signedDir = path.join(DIR, 'to-sign', 'signed');
  const signed = fs.existsSync(signedDir) ? fs.readdirSync(signedDir).filter(f => f.toLowerCase().endsWith('.pdf')).sort().map(f => path.join(signedDir, f)) : [];
  let locInputs;
  if (signed.length >= 4) {
    console.log('LOC annex: using SIGNED letters ->', signed.map(f => path.basename(f)).join(', '));
    locInputs = signed;
  } else {
    if (signed.length > 0) console.log(`!! only ${signed.length}/4 signed LOCs in to-sign/signed/ — annex still uses UNSIGNED renders (need all 4)`);
    else console.log('!! no signed LOCs in to-sign/signed/ — annex uses UNSIGNED renders (not sendable)');
    const locs = prep(read('letters-of-commitment.md')).split(/\n---\n/).map((s, i) => brk(s, i)).join('\n\n');
    await render('vol1-locs', marked.parse(locs), lPdf, 'Volume I Annex — Letters of Commitment (excluded from page limitation)');
    locInputs = [lPdf];
  }
  console.log(execFileSync('swift', [MERGE, path.join(OUT, 'Frasier-Digital-CWMS-Vol-I-Technical.pdf'), cPdf, tPdf, bPdf, rPdf].concat(locInputs), { encoding: 'utf8' }).trim());
  console.log(`VOL I BODY: ${bodyPages} / 30 pages`);

  // ---------- Vol II ----------
  const v2 = path.join(BUILD, 'vol2.pdf');
  await render('vol2', marked.parse(prep(read('vol2-past-performance.md'))), v2, 'Volume II — Past Performance');
  // Ethan submitted the completed PPQ directly to Kaplan/Nguyen (instr. 2.2.1.2.5, confirmed 9/1);
  // Vol II carries our pre-filled Blocks 1-4 as the reference copy (page 1 only would suffice, full copy attached).
  const ppqCompleted = path.join(OUT, 'PPQ-USACE-FrasierDigital-Region4-COMPLETED.pdf');
  const ppq = fs.existsSync(ppqCompleted) ? ppqCompleted : path.join(OUT, 'PPQ-USACE-FrasierDigital-Region4-PREFILLED.pdf');
  const v2inputs = [v2, ppq];
  console.log('Vol II PPQ copy:', path.basename(ppq));
  console.log(execFileSync('swift', [MERGE, path.join(OUT, 'Frasier-Digital-CWMS-Vol-II-Past-Performance.pdf')].concat(v2inputs), { encoding: 'utf8' }).trim());
  console.log(`VOL II: ${pageCount(v2)} / 25 pages (PPQ excluded)`);

  // ---------- Vol III ----------
  await render('vol3', marked.parse(prep(read('vol3-price-narrative.md'))), path.join(OUT, 'Frasier-Digital-CWMS-Vol-III-Price.pdf'), 'Volume III — Price');

  // ---------- Cover letter ----------
  await render('cover-letter', marked.parse(prep(read('cover-letter.md'))), path.join(OUT, 'Frasier-Digital-CWMS-Cover-Letter.pdf'), 'Cover Letter');

  await browser.close();
})();
