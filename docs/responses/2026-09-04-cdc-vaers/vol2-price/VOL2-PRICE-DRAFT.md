# Vol II — Price Quote (Draft Structure)

*(Working draft for the Excel + PDF build at render. RFQ rules: no page limit, editable
tables, itemized labor categories/hours/rates per CLIN — bottom-line-only = non-responsive;
each IT supply/service separately priced; no price info in Vol I.)*

## Recommendation standing: Scenario B — CLIN 0001 $495,000 FFP

Model (`pricing-model.py`, run 8/24): loaded cost ≈ $152k → profit ≈ $343k (69%).
Decision was parked pending Bish Q&A (AI scope pushes toward C $565k); no answers posted
as of 8/24. **If still unanswered at render: go B.**

## CLIN structure

| CLIN | Description | Type | Price |
|---|---|---|---|
| 0001 | Design, development, deployment, and compliance delivery of the Modernized VAERS Reporting Application per PWS (9-month PoP, severable, monthly arrears) | FFP | $495,000 |
| 0002 | Travel — onboarding | NTE (direct reimbursement, FTR) | $31,500 |
| 0003 | Travel — meetings | NTE (direct reimbursement, FTR) | $31,500 |
| | **Total evaluated price** | | **$558,000** |

## CLIN 0001 itemization — ✅ DECIDED (Joseph, 8/24): Option 1

Constraints satisfied: (a) hours × billing rates = $495,000; (b) hours reconcile with
Vol I Tab 3-1 staffing table (updated 8/24 to ~1.8 avg FTE, Joseph 0.55 dual-hat, Seth
committed QA line, Rida 0.12); (c) blended rate ≈ $178/hr — market-defensible for a
specialized healthcare-IT small business. Internal cost model (not for submission):
2,106 direct-build hrs; itemization adds the compliance/QA labor the cost model
under-lined (SA&A/ATD documentation, 508/QA engineering) as explicit categories:

| Labor category | Person | Hours | Rate | Extended |
|---|---|---|---|---|
| Program Manager / Lead Architect | J. Frasier | 546 | $235 | $128,310 |
| Security & Compliance Lead (SA&A/ATD/EPLC artifacts) | J. Frasier | 340 | $235 | $79,900 |
| Technical Lead — Healthcare IT | R. Daley | 390 | $205 | $79,950 |
| Integration & Data Engineer | R. Shoukoohi | 234 | $175 | $40,950 |
| Frontend Engineer / Test Automation | A. Frasier | 780 | $135 | $105,300 |
| QA & Accessibility Engineer | S. Chesky | 300 | $135 | $40,500 |
| Content & UX Research Specialist | R. Khazi | 190 | $105 | $19,950 |
| | **Total** | **2,780** | | **$494,860** |
| Rounding adjustment to FFP | | | | $140 |
| **CLIN 0001 FFP** | | | | **$495,000** |

Vol I sync ✅ DONE 8/24: Tab 3-1 staffing table and capacity paragraph updated to ~1.8
avg FTE; Joseph resume role line updated to combined 0.55 FTE dual-hat. (Option 2 —
lean hours at $235 blended — rejected for price-realism risk.)

## Other direct costs — required transparency statement

| Item | Price |
|---|---|
| Software licenses, subscriptions, and IT supplies | **$0** — all custom code delivered open source (M-16-21); development on contractor equipment; laptops and PIV are Government-furnished |
| Cloud hosting and AI services | **$0** — CDC-managed Azure environment and CDC enterprise Azure OpenAI (EDAV) are Government-furnished |
| ODCs other than travel CLINs | **$0** |

## Assembly checklist (render week)

- [ ] Build Excel workbook (editable, no screenshots): CLIN summary tab + itemization tab + ODC tab
- [ ] Export matching PDF
- [x] Sync Tab 3-1 FTE numbers to chosen option (done 8/24 — Option 1)
- [ ] Verify no price data anywhere in Vol I
- [ ] Scenario B $495k confirmed unless Bish Q&A answers move it before render
