// Renders rate-sheet.md → out/Frasier-Digital-Rate-Sheet.pdf
// Times New Roman, Letter, 1in margins, ≤2 pages. Deps from the repo's node_modules only.
const fs = require('fs');
const path = require('path');
const { marked } = require('marked');
const puppeteer = require('puppeteer-core');
const HERE = __dirname;
const OUT = path.join(HERE, 'out', 'Frasier-Digital-Rate-Sheet.pdf');
const CHROME = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
const CSS = `
  html, body { font-family: "Times New Roman", Times, serif; font-size: 10.5pt; line-height: 1.15; color: #000; margin: 0; }
  * { font-family: "Times New Roman", Times, serif !important; }
  h1 { font-size: 18pt; text-align: center; margin: 0 0 4pt 0; letter-spacing: 1pt; }
  h2 { font-size: 11.5pt; margin: 7pt 0 3pt 0; border-bottom: 0.6pt solid #000; padding-bottom: 2pt; }
  p { margin: 0 0 5pt 0; }
  ul { margin: 0 0 4pt 0; padding-left: 18pt; } li { margin-bottom: 2.5pt; }
  table { border-collapse: collapse; width: 100%; margin: 4pt 0 6pt 0; font-size: 10.5pt; }
  td { border: 0.5pt solid #000; padding: 2.5pt 5pt; vertical-align: top; } td:first-child { width: 22%; }
  thead { display: none; }
  em { font-style: italic; } strong { font-weight: bold; }
`;
const md = fs.readFileSync(path.join(HERE, 'rate-sheet.md'), 'utf8');
const html = `<meta charset="utf-8"><title>Frasier Digital Rate Sheet</title><style>${CSS}</style>${marked.parse(md)}`;
(async () => {
  const browser = await puppeteer.launch({ executablePath: CHROME, headless: true });
  const page = await browser.newPage();
  await page.setContent(html, { waitUntil: 'load' });
  await page.pdf({ path: OUT, format: 'Letter', printBackground: true, displayHeaderFooter: true,
    headerTemplate: '<div></div>',
    footerTemplate: `<div style="width:100%;font-family:'Times New Roman',serif;font-size:8.5pt;padding:0 1in;display:flex;justify-content:space-between;"><span>Frasier Digital LLC · Rate Sheet · September 2026</span><span>Page <span class="pageNumber"></span> of <span class="totalPages"></span></span></div>`,
    margin: { top: '1in', right: '1in', bottom: '1in', left: '1in' } });
  await browser.close();
  console.log('wrote', OUT);
})();
