# Bid Plan — CDC VAERS Reporting Modernization, RFQ 75D301-26-Q-00146

**DUE: Thursday, September 4, 2026, 10:00 AM ET** — email to H. Dale Bish, uwo8@cdc.gov
(only authorized contact; ≤12MB per email; label multi-emails "Email 1 of N").
**Target send: Tuesday, September 2** (two days early, the house rule).
GO decision: Joseph, 2026-08-17. Intel: `BID-INTEL.md`. RFQ: `solicitation/`.

## Win strategy

1. **The prototype IS the bid.** Tab 2-2 is evaluated on understanding, soundness,
   innovation, risk, alignment, scalability — and most SB competitors will submit static
   mockups. We submit a WORKING clickable app at a live URL: branching VAERS form (public
   vs provider; provider vaccine-error-no-AE path suppressing AE fields — PRS#1 exactly),
   plain-language toggle, intelligent field validation + contextual help, mobile-first
   responsive, a low-code admin peek (edit a tooltip live), synthetic data only,
   WCAG-conformant. Build with the modern open-source stack we're proposing (React +
   Node/FastAPI), hosted on our infra. Accompanying half-page in Tab 2-2 maps each
   prototype feature to PWS tasks + PRS rows.
2. **AI-assist, disciplined.** Propose intelligent completion assistance implemented
   against CDC's own FedRAMP Azure OpenAI (EDAV) — no new AI services, Government
   environment only — wrapped in the CDCH.10 plan. Differentiator + risk story in one.
   (Pending Bish answer on chatbot-vs-validation scope; prototype shows smart validation
   + optional assistant panel so either answer is covered.)
3. **Healthcare-IT credibility through named people** (team-experience framing): Ryan
   (Optum/UnitedHealth; Shuttle Health), Rahmin (HolonHealth 60k-user platform,
   audit-grade ledger); PHI/PII discipline narrative. Region 4 (~$2M engagement — pending
   Ethan verification) as the prime-delivered anchor: public-facing forms, validation,
   completion tracking, thousands of users, education-privacy context.
4. **508 as engineering, not paperwork** — WCAG 2.0 A/AA built into CI, ACR submitted
   with the proposal (gate), chatbot/upload/low-code UI explicitly in ACR scope.
5. **Price-credible, not price-desperate**: ~$495k CLIN 0001 + travel at CDC's own NTEs.
   Eval puts price above past performance — visible economy matters.

## Volumes & gates

**Vol I — Technical, 15pp cap** (TNR 12, 1" margins; tables ≥10pt; cover/ToC/resumes
excluded; resumes ≤2pp each):
| Tab | Content | Page budget |
|---|---|---|
| 1 | Executive Summary (not evaluated — keep to ½p) | 0.5 |
| 2-1 | Technical Plan: understanding, approach per PWS task, milestone/phasing chart vs DOA+21/45/90/150 clocks, project plan + challenges/solutions | 7 |
| 2-2 | Prototype: link + feature→PWS/PRS map + architecture sketch + scalability/Phase-2 extensibility | 1.5 |
| 3-1 | Management Plan: org/PM authority, rapid staffing + 3-yr turnover table (honest: zero turnover, named-team model), metrics (mirror PRS), QA/risk/comms, "no subcontracting opportunities exist" statement | 4 |
| 4 | Similar Experience: Region 4 deep-dive + team healthcare-IT matrix + documented evidence | 2 |
| — | Key personnel resumes (excluded from cap): Joseph + Ryan (2pp each) | — |

**Companion documents (with proposal):**
- **DMP** (CDCL.10 — PASS/FAIL): public-health data collected = VAERS report submissions;
  data standards, access/sharing (CDC-owned, VAERS-compatible outputs), privacy
  protections, archiving via CDC. `dmp.md`
- **AI Compliance & Risk Management Plan** (CDCL.03/CDCH.10 — PASS/FAIL, 11 required
  elements captured in `ai-plan.md`). Includes high-impact determination per OMB M-25-21
  Appendix A (our position: NOT high-impact — assistive form completion, no
  rights/safety-impacting automated decisions; human submits, CDC adjudicates).
- **508 ACR/VPAT** for the proposed application + deliverables (HHSAR 352.239-78).
- **CPARS representative block** (CDCL.09): Joseph Frasier, joseph@frasierdigital.com, (850) 356-2382.
- Signed cover page/SF18 blocks 13-16 (authorized signature).

**Vol II — Price, no limit, Excel + PDF, itemized** (labor cats/hours/rates per CLIN;
bottom-line-only = non-responsive). Each IT supply/service separately priced (ours: none —
open source, CDC-furnished cloud → state $0 line explicitly).

## Staffing (draft — confirm vs award stacking)

| Person | Role | ~Level | Notes |
|---|---|---|---|
| Joseph Frasier | PM / Lead Architect (KEY) | 0.35 FTE | CDCH.04 key personnel table |
| Ryan Daley | Technical Lead — healthcare IT (KEY) | 0.25 FTE | Optum/Shuttle Health cred |
| Rahmin Shoukoohi | Integration/data engineer (VAERS-compatible outputs) | 0.15 FTE | HolonHealth cred |
| Andrew Frasier | Frontend build + test automation + 508 testing | 0.5 FTE | |
| Rida Khazi | Plain-language content, UX research support, satisfaction surveys | 0.1 FTE | |
| Seth Chesky (bench) | Frontend surge | as needed | if RS+DoWEA also land |

Tier 2 MRPT investigations for all; NDAs (Exhibits I/II) at award; roster 30d before
effective date; capacity honesty paragraph in Management tab (FFP deliverable-based,
mirrors NOAA disclosure pattern).

## Price scenarios (`vol2-price/pricing-model.py` — build)

- A $445k · **B $495k (baseline rec)** · C $565k + CLINs 0002/0003 at $31,500 each (NTE).
- Modeled cost ≈ $180–200k loaded (team above, 9 mo, incl. SA&A package hours) → B profit
  ≈ $300k. Decide after Bish Q&A answers (AI scope pushes toward C).
- Itemization: labor category table w/ hours/rates per CLIN + ODCs ($0 — GFE laptops,
  CDC cloud, open-source stack; state explicitly for the transparency requirement).

## Calendar

- **Mon 8/17:** GO ✓, workspace ✓, questions email to Bish (Joseph sends today).
- **Tue 8/18–Wed 8/20:** NOAA owns Joseph (send 8/19). Claude: prototype build starts;
  price model; DMP + AI plan full drafts.
- **Thu 8/21–Fri 8/22:** DoWEA Q&A amendment + final send owns the window. VAERS
  prototype continues as fill work.
- **Mon 8/25:** DoWEA deadline (should be long sent). VAERS full-week: Tab 2-1 + 3-1
  drafts; prototype feature-complete.
- **Tue 8/26–Thu 8/28:** Tab 4 + resumes; ACR; prototype polish + accessibility pass;
  render pass 1; Ethan verification of Region 4 $2M figure → finalize Similar Experience.
- **Fri 8/29:** Full package render, page check (15pp), internal red-team read.
- **Tue 9/2:** Joseph signs; SEND (Thu 9/4 10am ET deadline = 2-day buffer).
- Watch SAM for amendments throughout (same daily check as DoWEA).

## Risks

- Award-without-discussions + pass/fail gates: DMP/AI-plan/ACR omission is fatal — gate
  checklist runs at every render.
- 15pp is tight for this much PWS — write dense, tables for the phasing/metrics.
- Prototype hosting: our infra, synthetic data only, keep link alive through ~Nov;
  uptime-monitor it (a dead link during evaluation = dead bid).
- PRA could stretch the form timeline — flagged in questions; assumption in Tab 2-1.
- If RS demo invite lands mid-window (possible any day), prototype skills collide —
  the two prototypes share components deliberately (form-flow engine, chart/UX shell).
