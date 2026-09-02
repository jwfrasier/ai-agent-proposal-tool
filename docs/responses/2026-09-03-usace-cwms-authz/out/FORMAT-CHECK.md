# Format Check — USACE CWMS Proposal (PANHEC-26-P-0000-026407)

Verified 9/2 (send-day render) against Proposal Submission Instructions (8/26 revision), Amendment 003 CSS, and Q&A.

| Requirement | Source | Status |
|---|---|---|
| Volumes I, II, III only (Vol IV deleted) | Q&A 22; instr. 1.1 | ✅ three volumes + cover letter |
| Separate native files, no zip, ≤25 MB/email | instr. 1.2; Q&A 4 | ✅ 4 PDFs + 1 xlsx, ~3 MB total |
| Vol I ≤ 30 pp (cover, TOC, resumes, LOCs excluded) | instr. 2.1; Q&A 20 | ✅ **26 / 30** (verified 9/2) |
| Resumes ≤ 2 pp each | Q&A 20 | ✅ four resumes, 2 pp each (build asserts) |
| LOCs in Vol I only | Q&A 21 | ✅ annex uses **all 4 SIGNED letters** (flattened via `flatten-pdf.swift` so Preview-signature annotations survive the CGContext merge; verified visually in built Vol I pp. 35–38) |
| Factor tabs per Q&A 23 | instr. 2.1.1/2.1.2 | ✅ F1 A/B/C + F2 A Mgmt / B Key Personnel / C Transition |
| Each volume: TOC + Summary + Narrative | instr. 1.2 | ✅ |
| Header/footer: company, date, RFP no., page X of Y | instr. 1.2 | ✅ every page; date = September 2, 2026 |
| 12 pt TNR, 1" margins, Letter, tables ≥10 pt | instr. 1.2 | ✅ fonts verified: Times New Roman + Courier (code); the Arial in Vol II is inside USACE's own PPQ form pages; GreatVibes (Ryan's e-signature) and Helvetica (Scott's typed date) are subset-embedded and confined to the signed-LOC exhibit pages |
| No price info in Vol I or II | instr. 1.2 | ✅ grep verified. Vol II's "$400,000" is the past-performance contract value **required** by instr. 2.2.1.1 — not proposal pricing |
| LOE per task in Factor 1, no dollars | instr. 2.1.1 | ✅ Table A-2 |
| LOE reconciles: A-2 = F2 A-3 = Vol III = xlsx | house rule | ✅ 1,660 base / 2,770 all-options everywhere |
| 5 key roles: 4 resumes + 4 LOCs (Randy dual per Q&A 9) | instr. 2.1.2 | ✅ resumes final (card-verified facts only); ✅ **all 4 signed LOCs collected 9/2 and in the build** |
| Vol II ≤ 25 pp; min 1 ref; PPQ | instr. 2.2; Q&A 27 | ✅ 3 pp + PPQ reference copy; completed PPQ sent direct to CO/CS by client (2.2.1.2.5) and Vol II says so |
| PPQ figures match SSS/NOAA ($400k, Jul 2024–Oct 2025) | consistency map | ✅ |
| Vol III complete + Excel separate, all 8 CLINs | instr. 2.3.1; Q&A 5 | ✅ $217,520 / $360,140; xlsx formula-driven |
| Cover letter: signed, entity block, reps/certs, amendments 001+003 acked, no exceptions, 90-day validity | CSS Sec. V; Q&A 3 | ⏳ final text done, dated 9/2 — **Joseph signs** |
| SAM affirmation in technical volume | Q&A 22 | ✅ |
| No [FLAG] markers anywhere | house rule | ✅ **ZERO** (verified 9/2) |
| No internal routing headers in deliverables | CLAUDE.md | ✅ |
| Notice watch clean before send | CLAUDE.md | ✅ run 9/2 morning — no Amendment 004; **re-run immediately before sending** |

## Known accepted deviations (signed exhibits)
- Signed LOC pages carry no proposal header/footer — same treatment as USACE's own PPQ form pages in Vol II; they are annexes excluded from the page limitation.
- Scott's LOC date line reads "9/1/2016" (his typo for 2026) — signature and letter text valid; ⏳ Joseph deciding: quick re-sign vs send as-is.
- Joseph's LOC date line blank; "Acknowledged for Frasier Digital" countersign lines blank on Randy/Ryan/Scott letters (optional).

## Send sequence (Wed 9/2)
1. ✅ All 4 signed LOCs → `to-sign/signed/` → `node build-cwms.js` (done 9/2 ~15:15)
2. Joseph signs `out/Frasier-Digital-CWMS-Cover-Letter.pdf` (Preview)
3. `npm run watch` — must be clean
4. Email per `out/EMAIL-DRAFT.md` → Quan.Nguyen@usace.army.mil, cc David.A.Kaplan@usace.army.mil
5. Confirm the Government's email acknowledgment of receipt (CSS Sec. II); follow up by email if none within ~2 h
