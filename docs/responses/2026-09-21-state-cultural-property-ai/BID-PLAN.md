# BID PLAN — DOS RFQ 19AQMM26Q0468, Cultural Property AI Prototype

Sources: `solicitation/rfq.txt` (R:line), `solicitation/sow.txt` (S:line), `solicitation/cscrm-questionnaire.txt` (Q), `solicitation/attestation.txt` (A:line), `solicitation/sam-record.json`. Prepared 2026-09-15 for Frasier Digital, LLC. GO decision: Joseph, 9/15.

---

## 1. Vitals

| Item | Value | Cite |
|---|---|---|
| Buyer | Dept of State, Bureau of Global Acquisitions (GA), 1200 Wilson Blvd SA-6B, Arlington VA, for **Bureau of Educational and Cultural Affairs — Cultural Heritage Center (CHC)**, secretariat of the Cultural Heritage Coordinating Committee (CHCC; 15 agencies + Smithsonian) | R:12-15, S:5-7, S:28 |
| Contracting Officer | **Mary DiAngelo**, diangelome@state.gov (only POC; no phone) | R:1200, sam-record |
| COR | Martin Perschler, CHC Team Lead for Programs and Outreach | R:~870 (652.242-70) |
| **Questions due** | **Tue Sept 16, 2026, 10:00 AM EDT**, email to CO, subject header exactly `19AQMM26Q0468` | R:1346-1350 |
| **Quotes due** | **Mon Sept 21, 2026, 5:00 PM EDT**, email to diangelome@state.gov | R:1200-1202, sam-record deadlines.response |
| Vehicle | Single FFP purchase order, FAR Part 13 simplified acquisition (RFQ says "FAR 13.2" — almost certainly means Part 13 / 13.3; see Q-list) | R:233-236, R:1204-1205 |
| Set-aside | **Total Small Business**, NAICS 541511, size std $34M | R:235-236 |
| Period | 9 months from award; services start day after award | R:237, S:167 |
| Ceiling / magnitude | **Not stated anywhere.** Under SAT presumed from vehicle. Ask (Q1). | — |
| Format | 3 separate files: Vol 1 Go/No-Go, Vol 2 Technical, Vol 3 Price. 8.5x11, 1" margins, non-reduced. **Vol 2 ≤ 15 pages inclusive of charts/tables/figures; overage not evaluated.** No limit Vol 1/3. Whole package ≤ 20MB. | R:1221-1226 |
| Evaluation | Factor 1 Go/No-Go gate → Factor 2 Technical Approach & Work Plan (confidence rating: High/Some/Low) → price/technical tradeoff. **Technical significantly more important than price.** May award without exchanges; may eliminate without communication. | R:1257-1290, R:1315-1330 |
| Past performance | **No past-performance volume or references requested.** Factor 2 evaluates "each Contractor qualification listed under SOW Section 3" from the technical narrative. | R:1261-1264 |
| Proprietary marking | Mark proprietary info explicitly or it is FOIA-releasable | R:1203-1206 |
| Anomaly | SF18 block 6 "Deliver by 08/30/2026" predates issue date 09/14/2026 — placeholder. Note, optionally ask. | R:9-13 |
| Invoicing | IPP (ipp.gov) electronic invoicing | R:933-965 |

## 2. Factor 1 — Go/No-Go gate (Vol 1). Any miss = quote dead.

| # | Item | Pass condition | Cite | Owner / status |
|---|---|---|---|---|
| 1 | Verification of active SAM.gov registration | Attach SAM entity record PDF (UEI PY8MJ4JPHJ45, CAGE 213L8) | R:1229 | Joseph — pull from SAM "Entity Information" |
| 2 | **Attachment 2, C-SCRM Questionnaire (.xlsx)** | Section 1 contact rows filled; **every question in Sections 2 (2.1–2.4) and 3 (3.1–3.3) answered "Yes"** via dropdown | R:1230-1234, R:1290-1300, Q | Joseph. 2.1–2.4 carry a "no suppliers → answer Yes" note; we DO have suppliers (cloud, model APIs) so we need a real, defensible SCRM stance. 3.1 background-check policy, 3.2 ICT inventory tamper procedures, 3.3 insider-threat literacy training: we need written policies on file before we sign "Yes" — Government "may request documentation." **Action: draft 3 one-page policies this week (SCRM/supplier, background check, insider-threat awareness).** |
| 3 | **Attachment 3, Secure Software Development Attestation Form** (CISA common form, DOS-branded) | For "critical software": producer name, product(s) named (§I), attestation that products in §I follow SSDF/NIST SP 800-218, signed by CEO/designee. Alt: public website link (not POA&M). | R:1231-1234, R:1300-1315, A:476-565 | Joseph signs as Managing Member. **Open question (Q3): the deliverable is software we will *build under the contract* — attest to Frasier Digital's SSDF practices company-wide (Type: Company-wide) naming "Cultural Property Identification Prototype v0.x, TBD".** Return as PDF named `FrasierDigital_CulturalPropertyPrototype_0.1_2026-09-21.pdf` per A:432-439. |

Also in Vol 1 (harmless, useful): cover letter with UEI/CAGE/NAICS/size, SDB statement, POC, quote validity (state 60 days — RFQ doesn't require, offering it costs nothing).

## 3. Scope digest (SOW)

**Mission:** proof-of-concept AI tool that helps CBP officers/HSI investigators identify cultural property (looted antiquities, ethnological material) at the border, supplementing the human Cultural Property Experts On Call (CPEOC) program run by UPenn (200+ experts). Legal frame: CPIA 19 U.S.C. §2601-2613; CBP import restrictions by country at **19 CFR §12.104g** (Ukraine mandatory + ≥1 other listed country). S:13-32, S:19, S:84.

**Hard constraints:** standalone; **not connected to DOS/USG networks; must not process or store DOS information** (5 FAH-11 H-413.3, 12 FAH-10 H-312.2-1); **no non-public USG info in training data**; architected for future FedRAMP extensibility; representative non-case-specific test inputs only. S:20, S:57, S:84, S:92-95.

**Data:** prefer CC0; else negotiate data-sharing with institutions/governments **at no additional cost to Government**; images, 3D models, metadata; curate = vet each object, normalize metadata terminology, edit/normalize/vectorize images. S:43, S:84-86.

**Software assurance (S:96-98):** version-controlled repo delivered; **≥90% test coverage** of contractor-written code; no medium/high SAST or DAST findings, clean scans from a static-testing SaaS + OSS web app scanner, false positives documented; **SCA at every deployment**; **draft Quality Assurance Plan (QAP) must be in the technical quote** (testing/validation protocols, performance & acceptance criteria, surveillance frequency, reporting, remediation/retest timelines) → becomes QASP at award.

**Rights (S:192-206):** FAR 52.227-14 Alt IV + Government Purpose Rights for ≤5 years then unlimited; we keep commercialization rights during GPR period. Contractor may assert copyright with Gov-sponsorship notice. **H-020 Safeguarding (R:~880-890) contradicts this** — "all documents and records ... become exclusive property of the U.S. Government" and bans any publication without CO approval. Flag in Q-list (Q7) and, if unresolved, note in Vol 1 that SOW §10 governs data rights.

**Security clause 652.239-71 (R:685-740):** ICT Security Plan within 30 days; **NIST 800-37 accreditation proof within 6 months** incl. SP, RA, ST&E, DR/COOP. Written for systems "connected to a DOS network or operated by the Contractor for DOS." The SOW insists the prototype is NOT such a system. Ask (Q4) whether (d) applies; if yes, it is a real cost line and schedule risk in a 9-month PoP. **652.239-800 C-SCRM (R:784-870):** artifacts within 48h of request, annual supply-chain info within 10 business days, incident notice to CO within 72h, flow-down to subs, re-attest on major version change.

### Tasks → deliverables → CLINs → due

| Task | Deliverable | CLIN | Due | Cite |
|---|---|---|---|---|
| 1 PM & Kickoff (risk mgmt procedures across 11 named risk categories) | Project Management Plan (risk register, schedule, comms plan) | 001 | Month 1, ≤15 days after award | S:65-72, S:137-139 |
| 1 | Monthly Progress Reports ×12 (CLIN qty 12 vs 9-month PoP — mismatch, Q6) | 002 | last business day monthly | S:73, S:140-142, R:99-110 |
| 2 Stakeholder Engagement & Requirements Validation (gov officials, LE, cultural institutions, CPEOC, SMEs) | Stakeholder Engagement Summary: validated scope, user workflows, training/testing plan | 003 | Month 2 | S:75-80, S:143-145 |
| 3 Data Sourcing & Curation | Data Sourcing & Curation Summary: inventory of sources + data-sharing arrangements | 004 | Month 2 | S:82-89, S:146-148 |
| 4 Prototype Design & Development (technical, governance, security specs; assurance regime; draft QAP in quote) | Prototype Application, working build, GPR | 005 | Month 6 | S:91-101, S:149-151 |
| 5 Internal Testing & Validation (spec verification + performance testing) | Internal Testing & Validation Report (data, scenarios, volumes, trending, results) | 006 | Month 7 | S:103-110, S:152-154 |
| 6 Simulated Field Testing & SME Validation (LE + CPEOC; **concordance rate vs CPEOC expert assessments**; usability feedback; fix issues) | Simulated Field Testing & Validation Report | 007 | Month 8 | S:112-117, S:155-157 |
| 7 Final Assessment Report (design, training, tech/governance/security specs, compliance, stakeholder interactions, testing, issue resolution → feasibility/desirability decision) | Final Assessment Report | 008 | Month 9 | S:119-123, S:158-160 |
| 8 Final Briefing to CHC/CHCC/stakeholders | Briefing/presentation materials | 009 | Month 9 | S:125-130, S:161-163 |

Success metrics (S:181-190): stakeholder breadth; functional standalone prototype meeting specs; **CPEOC concordance rate**; positive end-user feedback; decision-ready report; traceable requirements "covering all three required domains" (technical/governance/security); roadmap + realistic cost estimate; risks/constraints/data gaps; CHCC member-agency buy-in.

## 4. Factor 2 — what the evaluator scores (Vol 2, ≤15 pp)

Technical Approach must show (R:1235-1240): how we meet **SOW §1 minimum requirements** (S:15-22), how we are qualified against **each of the nine SOW §3 bullets** (S:40-48), and technical methods for every deliverable in §4/§5. Work Plan must give **team, schedule, actions** and the **draft QAP** (R:1242-1244).

### Nine §3 qualifications — honest self-rating and coverage plan

| # | Qualification (S:line) | Frasier today | Cover with |
|---|---|---|---|
| 1 | AI/ML image recognition & classification: training, validation, benchmarking (S:40) | Medium. LLM/RAG/agentic record is strong; classic CV fine-tuning record is thin. | Architecture built on vision-language embeddings (CLIP/SigLIP-class) + retrieval over a curated reference corpus, with a fine-tuned classifier head for 12.104g categories; benchmark plan (top-k accuracy, per-category recall, calibration). Stacy Hunt as AI-ML senior; Jayelon Rasmussen on pipeline. |
| 2 | Field-usable app for non-technical users, testable (S:41) | **Strong** (Region 4, VAERS prototype, Next.js/React) | Mobile-first responsive web app, offline-capable PWA option; camera capture; ≥90% coverage via Playwright/vitest. |
| 3 | Data/AI governance, trustworthy AI, FedRAMP-extensible architecture (S:42) | **Strong** (DoWEA data governance, SSA AI RFI, NIST AI RMF work) | NIST AI RMF 1.0 mapping, model cards, datasheets, chain-of-custody log per input, explainability (nearest-reference evidence), FedRAMP Moderate-aligned reference architecture on AWS GovCloud/Azure Gov (IaC delivered, not hosted on USG). John Swokowski for control mapping if he clears. |
| 4 | Sourcing/curating training data incl. images, 3D, metadata; data-sharing arrangements (S:43) | Medium (ETL/migration depth; no museum data deals yet) | Name concrete CC0/open sources up front: Smithsonian Open Access (CC0, ~4.5M records), Met Open Access (CC0), Cleveland Museum of Art (CC0), Rijksmuseum, Europeana, Wikimedia Commons, ICOM Red Lists (Ukraine emergency Red List, plus the second country), CBP designated-list image references at 19 CFR 12.104g. Data-sharing template MOU in appendix-free form (describe). |
| 5 | Illicit trafficking market, legal frameworks, SME identification standards (S:44) | **GAP.** | **Must name a cultural-property SME consultant** (archaeologist/art historian with provenance or law-enforcement liaison experience; ideal: prior CPEOC responder, ex-museum registrar, or academic in cultural heritage law). Without a named person this bullet rates Low. Recruit 9/16–9/17. |
| 6 | Federal LE & customs ops, records mgmt, InfoSec, field constraints (S:45) | **GAP** (Scott Carpenter Army vet is adjacent, not customs) | Name a retired CBP officer/HSI agent or ex-FBI Art Crime advisor as consultant, or a Fed LE-experienced advisor. Same recruiting push. |
| 7 | Liaise with cultural institutions for data-sharing (S:46) | Weak | SME from #5 carries this; Joseph's stakeholder-consultation record (Region 4 districts, LDOE 69 districts) shows the method. |
| 8 | Structured multi-sector stakeholder consultations (S:47) | **Strong** (Region 4/LDOE multi-district, DoWEA) | Consultation protocol: stakeholder map, interview guide, workflow mapping, requirements traceability matrix. |
| 9 | Federal PM & deliverables (S:48) | Medium-Strong | Region 4, DoE Genesis submission, current fed bids; PMP-free framing per roster rules. |

**Bottom line:** the technical half (2,3,8,9 plus 1 with the right architecture) can rate High; the domain half (5,6,7) rates Low unless we name two consultants. The evaluator is told to weigh "both technical and subject-matter expertise" (R:1263-1264). **Recruiting the SMEs is the critical path, not the writing.**

## 5. Vol 2 outline (15 pp budget)

| § | Content | Pages |
|---|---|---|
| 1 | Understanding of the requirement & solution summary (one architecture figure) | 1.5 |
| 2 | Qualifications vs SOW §1 minimums and §3 bullets 1–9 — table, named people per bullet | 2.5 |
| 3 | Technical approach by task: T2 consultation protocol · T3 data sourcing/curation pipeline & source list · T4 architecture (model, retrieval, explainability, standalone deployment, FedRAMP-extensible reference design, governance & security specs, assurance regime: SAST/DAST/SCA/90% coverage) · T5 internal test plan · T6 simulated field test & CPEOC concordance protocol · T7/T8 report & briefing | 6 |
| 4 | Work plan: team & roles, 9-month schedule table against S:137-163, risk register summary (11 SOW categories), communication cadence | 2.5 |
| 5 | **Draft Quality Assurance Plan** (required, S:98) | 2 |
| | Buffer | 0.5 |

Rendering: Times New Roman, 1" margins, Letter, build via `docs/responses/2026-07-30-onc-argos/build-pdf.js` pattern; footer page numbers 1–15; verify page count with the CLAUDE.md python one-liner; no `[FLAG` in out/.

## 6. Vol 3 — price (no page limit)

Required (R:1247-1256): FFP price for **every CLIN 001–009**, Total Evaluated Price, all-inclusive of labor/materials/equipment, **level of effort and labor mix clearly detailed**. CLIN 002 qty 12 monthly reports @ unit price; others qty 1 lot. Payment appears per-deliverable.

Structure: labor category × hours × rate per CLIN; ODCs line (cloud compute/GPU for training, scanning SaaS, SME consultants, any travel to Arlington/DC for kickoff & final briefing if not virtual — ask Q2). Price in the SME consultants as labor, not "subcontractors" unless they insist.

Pricing posture: no ceiling known. Working assumption until Q1 answered: **$180k–$300k** total, weighted to CLIN 005 (prototype). Revisit after Q&A.

## 7. Questions to send (by 9/16 10:00 EDT) — see `QUESTIONS-EMAIL.md`

1 magnitude/budget · 2 place of performance / on-site expectations · 3 SSDF attestation scope for to-be-built software · 4 applicability of 652.239-71(d) accreditation to a standalone non-DOS system · 5 hosting model: cloud-hosted standalone acceptable vs on-device · 6 CLIN 002 qty 12 vs 9-month PoP · 7 H-020 vs SOW §10 data rights · 8 Government facilitation of CPEOC/LE testers and stakeholder introductions · 9 3D models required or images sufficient · 10 paid-dataset licensing reimbursable? · 11 FAR "13.2" reference.

## 8. Compliance matrix (proposer)

| # | Requirement | Cite | Location |
|---|---|---|---|
| 1 | Received by CO email ≤ 5:00 PM EDT 9/21 | R:1200-1202 | Send log; target **noon EDT 9/21**, confirm receipt |
| 2 | Three separate files, Vol 1/2/3 | R:1221-1222 | out/ |
| 3 | 8.5x11, 1" margins, non-reduced; ≤20MB total | R:1223-1224 | build QA |
| 4 | Vol 2 ≤ 15 pages incl. graphics | R:1224-1226 | page-count check |
| 5 | SAM registration verification | R:1229 | Vol 1 |
| 6 | C-SCRM Questionnaire, all Yes §2–3, §1 complete | R:1230, R:1290-1300 | Vol 1 (xlsx + PDF print) |
| 7 | SSDF Attestation Form complete & signed, product named | R:1231-1234, A | Vol 1 |
| 8 | Technical approach addresses SOW §1, §3, all deliverables §4/§5 | R:1237-1240 | Vol 2 §2-3 |
| 9 | Work plan: team, schedule, actions | R:1242 | Vol 2 §4 |
| 10 | Draft QAP included | R:1243-1244, S:98 | Vol 2 §5 |
| 11 | FFP for every CLIN + Total Evaluated Price + LOE/labor mix | R:1247-1256 | Vol 3 |
| 12 | Proprietary markings | R:1203-1206 | all vols footer/legend |
| 13 | Subject header on question email `19AQMM26Q0468` | R:1349 | questions email |

## 9. Schedule to submission

| Date | Action |
|---|---|
| Mon 9/15 (tonight) | Joseph reviews & sends `QUESTIONS-EMAIL.md`. Start SME outreach (2 consultants). |
| Tue 9/16 | 10:00 EDT question cutoff. Draft the three C-SCRM policies. Pull SAM entity PDF. |
| Wed 9/17 | Vol 2 §1–3 draft. Confirm SMEs, get bios. |
| Thu 9/18 | Vol 2 §4–5 (work plan, QAP). Vol 3 price model. Watch for Q&A amendment. |
| Fri 9/19 | Vol 1 forms filled & signed. Full Vol 2 render, page check. |
| Sat 9/20 | Pre-send sweeps per CLAUDE.md (FLAG grep, mtime staleness, fonts). EMAIL-DRAFT.md. |
| Mon 9/21 | `npm run watch` first. Send by **noon EDT**. Request receipt confirmation. |

## 10. Risks to the bid itself

- **Domain SMEs not secured by 9/17** → bullets 5–7 rate Low; consider whether to still bid (technical-only story vs likely academic/museum-affiliated competitors).
- 652.239-71(d) accreditation held applicable → 9-month PoP absorbs a NIST 800-37 package; price it or take exception.
- Award timing unknown; 9 months fixed; monthly cadence means Month 2 deliverables land ~60 days after award regardless of holidays.
- Capacity: Joseph is named on DoWEA, SSS RS, NOAA, TTUHSC, SSA RFI. Name a delivery lead other than Joseph for day-to-day (Stacy or Jayelon) with Joseph as PM/architect.
