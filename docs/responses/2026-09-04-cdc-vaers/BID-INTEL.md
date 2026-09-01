# BID-INTEL — CDC VAERS Reporting Modernization

**RFQ 75D301-26-Q-00146 · CDC Office of Acquisition Services (Atlanta) · Total Small Business set-aside · NAICS n/a-stated (SF18)**
**DUE: Thursday, September 4, 2026, 10:00 AM ET** — email to **H. Dale Bish, uwo8@cdc.gov** (ALL communication exclusively through him; ≤12MB per email, split if larger, label "Email 1 of N")
Full 72pp RFQ: `solicitation/CDC-VAERS-RFQ-75D301-26-Q-00146.pdf` (screener fit 82 — tied for highest ever)

## What it is
Design/build/deploy a **modernized, mobile-friendly public + healthcare-provider VAERS
reporting web app** inside CDC's FedRAMP Azure environment: redesigned landing page +
navigation, **branching-logic submission form** (public vs provider; provider vaccine-error-no-AE
path suppresses AE fields), plain-language public version, **intelligent completion
assistance** (answers questions, assists navigation — AI-flavored), medical-record upload
(Phase 1 restricted; Phase 2 designed-for but not in scope), customer-satisfaction surveys,
**low-code/configurable UI** so CDC staff edit content without devs, VAERS-compatible
structured data outputs, performance targets (≤3s page loads, ≤10min median submission,
≥30% abandonment reduction), Section 508 + ACR, ATD→ATO support, transition-out.
Existing stack: ColdFusion/Tomcat/Node/.NET on Azure SQL MI/VMs (their words — i.e., the
legacy is old; we build the modern replacement experience).

## Contract shape
- **FFP, severable services, monthly payments in arrears.** PoP **9/28/2026 – 6/27/2027 (9 months)**.
- CLIN 0001 = the job (one price); CLINs 0002/0003 travel NTE **$31,500 each** (onboarding + meetings, direct reimbursement) — CDC expects some Atlanta presence but performance is **remote-primary** (contractor facility, CDC core hours 8:30–5 ET).
- GFE: PIV cards + laptops furnished. CDC Azure environment furnished. **52.217-8** 6-month extension option in clauses. No IGCE visible.
- Deliverable clock (from Date of Award): wireframes DOA+21d · alpha DOA+45d · beta DOA+90d · production build DOA+150d. Monthly status; bi-weekly tech reviews.
- **Custom code = OPEN SOURCE by policy** (M-16-21, FAR 52.227-14/-17 unlimited rights, code to CDC repo bi-weekly) — matches our house posture exactly.
- Security: FIPS 199 **Moderate**; **Tier 2 (MRPT)** background investigations w/ subject interview; NDAs before work; CDC trainings; roster 30d before effective date; SA&A package (SSP/RAR/POA&M/CP+CPT/PTA-PIA) within 120d of go-live; 1-hour incident reporting; SSN elimination request if SSNs handled.

## Evaluation (best-value tradeoff, award WITHOUT discussions)
Descending importance; **non-price factors combined significantly > price**:
1. **Factor 1 Technical**: A1 Technical Approach = **Tab 2-1 Technical Plan + Tab 2-2 PROTOTYPE (submitted as an accessible electronic LINK, evaluated on understanding, soundness, innovation/originality, risk mitigation, alignment w/ performance reqs, scalability)**; A2 Management (org structure/PM authority; rapid staffing + **employee turnover table for past 3 years**; metrics; QA/risk/comms; subcontractor mgmt + draft sub agreement if any); A3 Similar Experience (similar scope/size/complexity + **healthcare IT domain expertise** + documented evidence — project summaries, references, artifacts).
2. **Factor 2 Price** (note: price ABOVE past performance).
3. **Factor 3 Past Performance** — CPARS or **POC feedback on other federal/commercial contracts**; positive/negative/neutral; no record = neutral.

**PASS/FAIL GATES (non-responsive without them):**
- **Data Management Plan (DMP)** — CDCL.10; "a proposal received without a DMP will be deemed Unacceptable."
- **AI Use Disclosure (CDCL.03)** — must affirmatively state whether AI will/may be used in performance; if yes (we will — AI-assisted delivery + likely AI-powered completion assistance), MUST submit **AI Compliance and Risk Management Plan per CDCH.10 template** — rated pass/fail; missing = ineligible.
- Section 508 ACR/checklist with the proposal (HHSAR 352.239-78).
- Price proposal must itemize labor cats/hours/rates per CLIN — bottom-line-only Excel = non-responsive.
- CPARS rep contact block (CDCL.09) to fill in.

## Format
- **Vol I Technical: 15 pages MAX** (TNR 12pt, 1" margins, 8.5×11; tables ≥10pt, graphics ≥8pt; cover/ToC/**resumes EXCLUDED** from cap; resumes ≤2pp each). Tabs: 1 Exec Summary (not evaluated — put substance elsewhere) · 2-1 Technical Plan · 2-2 Prototype (link) · 3-1 Management Plan · 3-2 Key Personnel Resumes · 4 Similar Experience.
- **Vol II Price: no page limit**, Excel AND PDF, editable tables (no screenshots), itemized.
- Signed by authorized official. Word/Excel/PDF via email.

## Fit assessment (why the 82 holds up)
**For us:**
- Public-facing government **form/UX modernization with branching logic + validation** = literally the Region 4 + VAERS-shape work we do; "state-of-the-art UI/UX" + React-class modern stack vs their ColdFusion legacy.
- **Prototype-as-evaluation-centerpiece** — our RS demo playbook: build a clickable branching VAERS form mock (public vs provider paths, plain-language toggle, tooltips, mobile) on synthetic data; innovation criterion rewards the AI-assisted completion angle (CDC's own EDAV offers Azure OpenAI — propose within their environment).
- **Open-source mandate, Gov-cloud-only, 508-first, remote-primary** — all house posture.
- **Healthcare informatics bench is real**: Ryan Daley (Optum/UnitedHealth; Shuttle Health healthtech startup), Rahmin Shoukoohi (HolonHealth 60k-user healthcare platform, auditable ledger), plus PHI/PII discipline story. Frame per team-experience rule.
- Past perf: Region 4 (+ Ethan POC feedback channel) → positive-to-neutral floor. **Region 4 total engagement ≈ $2M (Joseph 8/17) — use the corrected figure here (nothing submitted to CDC yet); makes the similar-size argument for a ~$500k bid trivially strong. Verify the figure with Ethan first (he must confirm it if CDC calls).** DoWEA/SSS submissions demonstrate momentum but aren't citable as past performance.
- Timing: due 9/4 — after DoWEA (8/25); PoP starts 9/28 — stacks with possible RS/DoWEA awards (capacity honesty needed in Management tab).

**Against / risks:**
- No Frasier-prime healthcare contract (mitigate: team experience + Region 4 scale story + documented evidence artifacts).
- ATO/SA&A compliance lift is real (SSP/RAR/POA&M/pen-test/PIA) — price it; RS Vol II security section is reusable DNA.
- Turnover table ask (3 years) — we're a young LLC; answer honestly: zero involuntary turnover, named-team model, principal-led.
- "Intelligent completion assistance" scope ambiguity — chatbot vs validation? Question opportunity (all questions via email to Bish; no stated Q&A deadline — send early).
- Incumbent unknown (existing VAERS support contracts exist; this appears to be NEW build alongside them — "coordinate with the other existing contracts supporting VAERS").

## Price thinking (preliminary — model before committing)
9-month FFP build + compliance package. Team shape: Joseph (arch/PM) + 2 seniors part-time + junior + fractional 508/design. Cost basis at 1099 rates suggests ~$180–260k cost → market-credible bid likely **$450k–$650k**; travel CLINs priced at the NTE estimates ($63k) on top. Validate against effort model before choosing. SAT-adjacent — inside our $350k target lane? NO — above it, but so were RS/DoWEA (deliberate step-ups).

## Immediate actions
1. GO/NO-GO with Joseph (recommend GO).
2. Questions email to Bish EARLY (no stated cutoff): intelligent-assistance scope (chatbot?), incumbent/existing contracts, IGCE/budget, EDAV Azure OpenAI availability for the app, PRA implications on survey/form timeline, page-limit confirmation that DMP/AI plan sit outside the 15pp.
3. Prototype build plan (the differentiator — start early, reuse RS demo toolchain).
4. Draft skeleton: 15pp budget across tabs; DMP + AI Plan (CDCH.10 template — find it in RFQ pages 37–54); price model.
