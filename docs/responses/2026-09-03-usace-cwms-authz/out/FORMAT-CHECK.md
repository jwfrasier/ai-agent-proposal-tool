# Format Check — USACE CWMS Proposal (PANHEC-26-P-0000-026407)

Checked against Proposal Submission Instructions (8/26 revision), Amendment 003 CSS, and Q&A answers. Status as of the 8/30 render pass 1. Re-run before send.

| Requirement | Source | Status |
|---|---|---|
| Volumes I, II, III only (Vol IV deleted) | Q&A 22; instr. 1.1 | ✅ three volumes + cover letter |
| Separate native files, no zip, ≤25 MB/email | instr. 1.2; Q&A 4 | ✅ 4 PDFs + 1 xlsx; size check at send |
| Vol I ≤ 30 pp (cover, TOC, resumes, LOCs excluded; summary + org chart count) | instr. 2.1; Q&A 20 | ✅ **27 / 30** (pass 1) — re-verify after flag edits |
| Resumes ≤ 2 pp each | Q&A 20 | ⏳ four resumes — re-verify ≤2 pp after Zach dual-role edit |
| LOCs in Vol I (not elsewhere) | Q&A 21 | ✅ annex in Vol I |
| Factor 1 tabs A/B/C; Factor 2 tabs A Mgmt / B Key Personnel / C Transition | instr. 2.1.1, 2.1.2; Q&A 23 | ✅ |
| Each volume: TOC + Summary + Narrative | instr. 1.2 | ✅ Vol I (TOC page + Summary Section); Vol II/III open with a Summary |
| Header/footer: company name, date, RFP number, page numbers | instr. 1.2 | ✅ footer on every page |
| 1" margins, Letter, tables ≥ 10 pt | instr. 1.2 | ✅ 12 pt TNR body, 10 pt tables; **content-shrink bug fixed 8/30** (org chart → table) |
| No price information in Vol I or II | instr. 1.2 | ✅ grep "$" in Vol I/II md → only hours; confirm at send |
| Level of effort per task in Factor 1 | instr. 2.1.1 | ✅ Table A-2, no dollars |
| LOE reconciles: Table A-2 = F2 Table A-3 = Vol III = xlsx | house rule | ⏳ A-2 = Vol III (both 1,660 / 2,770 h); Table A-3 hrs/week is an approximation — verify sums |
| Resumes + LOCs for the 5 key roles (4 individuals, Zach dual per Q&A 9) | instr. 2.1.2; 3.2.1.2.2 | ⏳ resumes drafted with [FLAG]s; **LOCs unsigned** — due Mon 8/31 |
| "Direct use" test on each resume | Q&A 8 | ⏳ needs replies from Zach/Scott/Randy (Efrain removed 9/1) |
| Vol II ≤ 25 pp; min 1 ref; PPQ attached (excluded) | instr. 2.2; Q&A 27 | ⏳ 4 pp; **PPQ pending from Ethan** — must be completed before his Region 4 email closes 8/31 |
| PPQ figure matches SSS/NOAA PPQs ($400k, Jul 2024–Oct 2025) | consistency map | ✅ pre-filled to match |
| Vol III: per-task subtotals, grand total incl. options, rates, LOE per category per task, Excel separate | instr. 2.3.1; Q&A 5, 24 | ✅ $217,520 base / $360,140 total; xlsx formula-driven |
| Cover letter: signed, CAGE/UEI/TIN, reps & certs statement, teaming, amendments acknowledged, no exceptions | CSS Sec. V; Q&A 3 | ⏳ drafted; **Joseph signs 9/2**; confirm 90-day validity |
| SAM affirmation in technical volume | Q&A 22 | ✅ Summary Section + F2 Tab A |
| No CUI/CDI, NIST, CMMC statements consistent | Q&A 14–17 | ✅ |
| Fonts embedded, no fallback | house rule | ✅ Times New Roman + Courier New (code) only |
| No [FLAG] markers in any PDF | house rule | ❌ **29 flags open** (see `grep -o "\[FLAG:[^]]*\]" *.md`) |
| No internal routing headers in deliverables | CLAUDE.md | ✅ build strips draft notes |
| Notice watch clean before send | CLAUDE.md | ⏳ run `npm run watch` on 9/2 |
