# Prototype Spec — Tab 2-2, CDC VAERS RFQ 75D301-26-Q-00146

Derived line-by-line from the RFQ (`solicitation/rfq.txt` extract of the 72pp PDF):
Section 1 background (rfq.txt:120–129), Section 2 objectives (:270–290), Section 3 scope
(:291–305), Section 4 PWS tasks (:322–470), PRS matrix (:596–724), Tab 2-2 instructions
(:3084–3112), evaluation criteria (:3402–3410).

## What the RFQ says the prototype IS

- Submitted as an **accessible electronic link** the Government can open and evaluate
  (no login wall; if auth is unavoidable, credentials in Tab 2-2 text).
- Must demonstrate "to the maximum extent practicable" the proposed capabilities
  **relevant to the PWS**, with **accompanying documentation** tying prototype → solution.
- Evaluated on six areas: (1) understanding of problem/objectives, (2) soundness/
  feasibility, (3) **innovation/originality**, (4) risks + mitigation, (5) **alignment with
  performance requirements** (= the PRS), (6) scalability/extensibility.

Criterion 5 is the key: the PRS matrix is the checklist the evaluators will hold the
prototype against. Everything demoable in PRS#1–#11 should be visibly present.

## Must-show features (traceability: PWS task → PRS row)

Ordered by evaluability — 100%-Inspection PRS rows first.

| # | Feature | PWS | PRS | What the demo must visibly do |
|---|---------|-----|-----|-------------------------------|
| 1 | **Branching submission form, public vs provider** | 1.6 | PRS#1 (100% insp.) | Entry choice public/provider; field sets tailored by submitter type; **provider "vaccine error, no adverse event" path suppresses ALL AE fields** (1.6.2) — this exact scenario is named in PRS#1 and must be clickable end-to-end |
| 2 | **Plain-language public version** | 1.6.1 | PRS#1 | Public path wording requires no health expertise; show side-by-side/toggle vs clinical phrasing so evaluators see the substitution |
| 3 | **Real VAERS data elements** | 1.6, 1.1 | PRS#5, #6 | Form uses the current VAERS 2.0 form's data elements (patient, vaccine(s), event, dates, facility, reporter) — not lorem-ipsum fields |
| 4 | **Mobile-first responsive** | 1.3 | PRS#2 (100% insp.) | Core reporting flow completes on a phone viewport; evaluators WILL open it on a phone |
| 5 | **Redesigned landing page + nav** | 1.4 | PRS#3 (100% insp.) | Landing page with clear paths to: report submission form, FAQs, data downloads — the three access paths PRS#3 names |
| 6 | **Intelligent completion assistance** | Scope §1/§2/§3 | — (objective) | RFQ's own definition (rfq.txt:127): "intelligent validation that assists with form completion, customer-centric tooltips, informational popups, reactive popup FAQ features" + "answers user questions, supports site navigation." Floor = smart inline validation + tooltips + reactive FAQ popups; ceiling = assistant panel. Show BOTH (covers either answer to the pending Bish scope question) |
| 7 | **Form validation / error handling / burden reduction** | 1.3, 1.10 | PRS#4, #5 | Inline validation, friendly errors, progress indicator, save-and-resume affordance; **required/critical-field completeness meter** (PRS#5's ≥90% completeness metric made visible — strong innovation play: the metric CDC will measure, surfaced to the user in real time) |
| 8 | **Medical record upload + free-text box** | 2.1, 2.2 | PRS#9 (100% insp.) | Upload widget inside the form + "additional information" free-text box |
| 9 | **Phase 1 upload restriction, Phase 2-ready** | 2.4.1/2.4.2 | PRS#11 (100% insp.) | Upload accepts only medical-record/vaccine-document types; rejects images with a message noting Phase 2 design accommodation — restriction enforcement is the inspected behavior |
| 10 | **Supplemental-document suggestion tool** | 2.3 | PRS#10 (100% insp.) | On provider path, tool scans the entered submission and suggests documents to upload (e.g., vaccination record for error reports, lab results/discharge summary for serious AE) — highly demoable, directly scores "innovation" |
| 11 | **Customer satisfaction surveys ×2** | 1.5, 1.7 | PRS#7 (100% insp.) | Site-navigation survey (accessible from nav) AND post-submission popup survey — both, they're counted separately |
| 12 | **Low-code admin editability** | 1.8 | PRS#8 (100% insp.) | Admin peek: edit a tooltip/label/FAQ entry and watch the live form change without code — PRS#8's test is literally "update scenarios completed by program personnel without developer code changes" |
| 13 | **VAERS-compatible structured output** | 1.9 | PRS#5, #6 (100% insp.) | On submit, show/download the generated structured VAERS-compatible record (field-mapped JSON) — proves the data-capture story without claiming live integration |
| 14 | **Section 508 / WCAG conformance** | 3.5 | PRS#14 | The prototype itself keyboard-navigable, screen-reader labeled, contrast-clean — evaluators may run an axe scan on the link; a 508 defect in the prototype undercuts win-theme #4 |
| 15 | **Performance ≤3s loads** | 1.10 | PRS#4 | Prototype must be objectively fast; show submission-time/abandonment instrumentation angle (ties to the "usage metrics" Beta deliverable, rfq.txt:554–556) |

Not prototype-demoable (cover in the Tab 2-2 accompanying page instead): ATD/SA&A
(PRS#12–13, #15), documentation deliverables (PRS#16), PM/transition (PRS#17–18),
Azure/CDC-environment deployment (Task 3.2), real VAERS transmission (1.9 "as directed
by CDC").

## How the six evaluation criteria get satisfied

1. **Understanding** — real VAERS 2.0 fields, both submitter journeys, the named
   vaccine-error-no-AE scenario, burden-reduction features everywhere.
2. **Soundness/feasibility** — a working deployed app IS the feasibility proof; built on
   the exact open-source stack proposed in Tab 2-1.
3. **Innovation** — completeness meter, suggestion tool, assistant panel, live low-code
   editing. (AI framing: prototype runs self-hosted synthetic-data demo; Tab 2-2 text maps
   it to CDC's EDAV Azure OpenAI for delivery — no new AI services in the Gov environment.)
4. **Risk mitigation** — accompanying doc: PRA timeline, AI-scope ambiguity hedged by
   dual-mode assist, Phase-2 upload accommodation, legacy-coexistence.
5. **Alignment with performance requirements** — the traceability table above, printed
   as the feature→PWS/PRS map in Tab 2-2 (BID-PLAN budget: 1.5pp).
6. **Scalability/extensibility** — form defined as a config schema (the same mechanism
   as low-code editability = one architecture serving two criteria); Phase-2 upload slot;
   architecture sketch in accompanying doc.

## Constraints on the artifact itself

- **Synthetic data only**, banner-labeled "DEMONSTRATION — synthetic data, no PHI/PII
  collected or stored" (house simulated-connectors rule + PHI discipline story).
- Hosted on Frasier infra; **link stays alive + uptime-monitored through ~Nov 2026**
  (BID-PLAN risk: dead link during evaluation = dead bid).
- No third-party trackers; nothing that actually persists a submitted "report."
- Open-source stack matching Tab 2-1 (React + Node), since the prototype doubles as
  evidence of the proposed stack.
- Form-flow engine built schema-driven and app-agnostic so it's reusable for the SSS
  Readiness Sim demo (deliberate component sharing per BID-PLAN).

## Build plan (docs/responses/2026-09-04-cdc-vaers/prototype/)

1. Vite + React scaffold, schema-driven form engine (JSON schema drives sections,
   fields, branch conditions, plain/clinical text variants, tooltips).
2. VAERS 2.0 field schema (public + provider variants) with branch rules incl.
   vaccine-error-no-AE suppression.
3. Landing page + nav (reporting tools / FAQs / data downloads).
4. Validation + completeness meter + tooltips + FAQ popups; assistant panel (scripted
   demo responses, labeled simulated).
5. Upload widget w/ Phase-1 type restriction + free-text; suggestion tool (rule-based
   scan of entered data).
6. Surveys ×2; admin low-code peek (edit schema text live).
7. Structured-output viewer on submit.
8. Accessibility pass (keyboard, ARIA, contrast, axe clean); mobile pass; perf pass.
9. Deploy + uptime monitor; feature→PRS map doc for Tab 2-2.

Feature-complete target per BID-PLAN calendar: **Mon 8/25 week**, polish 8/26–28.
