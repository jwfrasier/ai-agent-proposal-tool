# Tab 2-2: Prototype

**Prototype URL: `https://vaers-demo.frasierdigital.com`** *(no login required; desktop and mobile)*

Frasier Digital submits a **working web application**, not a mockup. The prototype was
built with the same open-source stack proposed in Tab 2-1 (React front end, schema-driven
form engine) and demonstrates the core PWS capabilities on synthetic data. Consistent
with Amendment 0001 Q&A 28 and 267, it is hosted on contractor-controlled infrastructure
using synthetic data only, and every component of its stack — React, Node.js, and
standard web services — is available to CDC within the FedRAMP audit scope of the
CDC-managed Azure environment where the production solution is developed and deployed.
The link will remain live and unchanged through the evaluation period and at least
60 days after the due date (Q&A 214), monitored continuously for availability.
The prototype collects, transmits, and stores no PHI/PII.

An in-application version of this walkthrough, with one-click sample scenarios
(a completed parent report and the PRS#1 pharmacist error case), is at the
**"For RFQ evaluators"** link in the site footer.

## Suggested evaluation walkthrough (10 minutes)

1. **Public path:** Start a report as a member of the public. Try "Prefer to start by
   telling us what happened?": describe the event in plain words and the assistant
   proposes form answers drawn only from what you wrote — each individually reviewed,
   confirmed, and tagged "AI-suggested, verify" until you edit or accept it, with a
   receipt showing where answers landed. Note plain-language questions, "Why we ask"
   tooltips, inline validation, and the live completeness meter. Submit and inspect the
   structured record: field names mirror the published VAERS data dictionary
   (VAERSDATA / VAERSVAX), grouped to match the public-release de-identification split.
2. **Provider path (PRS#1):** Start over as a healthcare professional and select
   *"vaccine administration error with no adverse event."* Every adverse-event question is
   suppressed and the form states how many questions were removed.
3. **Mobile:** Repeat either path on a phone.
4. **Low-code administration (PRS#8):** Open *Admin*, edit a field label, tooltip, or FAQ
   entry, and see the change live in the form — no developer involved.
5. **Uploads (PRS#9/#11):** Attach a PDF (accepted); attempt an image (rejected with
   Phase 2 explanation). At review, note auto-suggested supporting documents (PRS#10).

## Feature-to-requirement map

| Prototype feature (all working) | PWS | PRS |
|---|---|---|
| Branching submission form, public vs. provider; provider error-no-AE path suppresses all AE fields | 1.6, 1.6.2 | PRS#1 |
| Plain-language public version with clinical/plain toggle | 1.6.1 | PRS#1 |
| Full VAERS 2.0 data-element coverage (demographics through prior-event history); submission generates a record whose field names mirror the published VAERS data dictionary (VAERSDATA flags, VAERSVAX rows, computed NUMDAYS) with the public-release de-identification split | 1.6, 1.9 | PRS#5, #6 |
| Mobile-first responsive; full flows complete on phone viewports | 1.3 | PRS#2 |
| Redesigned landing page: clear paths to reporting form, FAQs, data downloads | 1.4 | PRS#3 |
| Intelligent completion assistance: smart inline validation, "Why we ask" tooltips, reactive FAQs, and a **live AI assistant** (form questions + narrative review, scripted fallback). Production-grade safety architecture: a classification stage routes safety-critical inputs (emergencies, medical-advice and causality questions, personal information, prompt injection) to fixed approved responses before any generative model runs, under a strict cannot-say policy. Production targets CDC's EDAV Azure OpenAI — no new AI services, Government environment only | Scope §2–3 | — |
| Live completeness meter surfacing required/critical VAERS data elements to the submitter — the same metric CDC measures, driving the ≥90% completeness and abandonment-reduction targets | 1.1, 1.10 | PRS#4, #5 |
| Medical-record upload + free-text box; Phase 1 type restrictions enforced; Phase 2 (images) accommodated by design | 2.1, 2.2, 2.4 | PRS#9, #11 |
| Supplemental-document suggestion tool scanning provider submissions | 2.3 | PRS#10 |
| Site-navigation survey + post-submission popup survey | 1.5, 1.7 | PRS#7 |
| Low-code administration with live preview: content (labels, tooltips, FAQs, site text) AND interface (field visibility, choice options) — the PWS's "content and interface updates" demonstrated literally | 1.8 | PRS#8 |
| Section 508: keyboard navigable, screen-reader labeled, WCAG 2.1 AA — automated audit passes with zero violations across all pages and form states | 3.5 | PRS#14 |
| Performance: <1s loads (75 KB compressed application), save-and-resume | 1.10 | PRS#4 |

## Architecture and scalability

The form is not hard-coded: sections, fields, branching conditions, plain/clinical text
variants, tooltips, and validation rules are a **declarative configuration schema**
rendered by a generic engine. One design decision serves four evaluation areas: branching
correctness is testable data, not scattered code (PRS#1); the low-code interface edits
the same configuration the form renders (PRS#8); VAERS field mappings live beside the
fields they map (PRS#6); and future changes — new vaccines, Phase 2 image upload, new
submitter types or languages — are configuration, not redevelopment. The demo persists
configuration locally; production uses a role-restricted, versioned, audit-logged
configuration service in CDC Azure. **Risks demonstrated and mitigated:** AI-scope
ambiguity is hedged (validation, tooltips, and FAQs work with no AI service; the
assistant is an additive layer); Phase 1/2 upload separation is enforced exactly as the
PWS directs; plain-language substitution is a content operation CDC staff perform
themselves, mitigating PRA-driven wording turnaround.
