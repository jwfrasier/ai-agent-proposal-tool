# Tab 2-1 — Technical Plan

*(Draft for Vol I. Page budget: 7pp of the 15pp cap, TNR 12, tables ≥10pt. Bracketed
[FLAG] items need Joseph decision/verification before render. Companion tabs: 2-2
prototype, 3-1 management. Written to eval criteria: understanding, soundness,
innovation, risk mitigation, alignment with performance requirements, scalability.)*

---

## 1. Understanding of the Requirement

VAERS is the nation's front door for vaccine safety signals, and that front door is hard
to walk through. A parent reporting a child's reaction and a pharmacist reporting a
vaccine error today face the same experience: a long, expert-oriented form served by a
legacy ColdFusion/Java stack, a writable PDF alternative, and navigation that predates
modern mobile use. The predictable results are the ones this RFQ targets: abandoned
submissions, incomplete critical fields, and provider reports forced through
adverse-event questions that do not apply. Every abandoned report is a data point the
Immunization Safety Office never sees.

CDC is not buying a website refresh. It is buying **data quality and completeness at the
point of capture**, delivered as a modern reporting experience: branching logic that asks
each submitter only what applies (Task 1.6), plain language for the public path (1.6.1),
AE-field suppression for provider vaccine-error reports (1.6.2), intelligent completion
assistance (Section 2), integrated medical-record upload with a disciplined Phase 1 scope
(Task 2), and VAERS-compatible structured outputs that feed existing downstream systems
without disrupting them (Task 1.9) — all inside CDC's FedRAMP-authorized Azure
environment, under an ATD CDC can defend, conforming to Section 508, and editable by CDC
program personnel without a developer in the loop (Task 1.8).

Three constraints shape our approach. **First, the new application is a guest in a
working ecosystem**: existing VAERS support contracts, downstream data workflows, CXone
and eFax channels, and the post-submission upload tool all continue operating; our
integration surface is VAERS-compatible structured data and coordination through CDC, not
replacement of back-end systems. **Second, the nine-month period of performance with
fixed deliverable clocks (wireframes DOA+21, alpha DOA+45, beta DOA+90, production
DOA+150) leaves no room for a discovery phase that produces only documents** — which is
why we arrive with a working, tested prototype (Tab 2-2) rather than a promise of one.
**Third, trust requirements are asymmetric**: a public submitter must never be given
medical advice or a causality opinion by an assistance feature, and PHI/PII discipline
must be engineered in from the first wireframe, not audited in at the end.

We have already reduced this understanding to working software. The prototype at
**vaers-demo.frasierdigital.com** (Tab 2-2) implements the branching form on the actual
VAERS 2.0 data elements, the provider vaccine-error path with AE suppression, the
plain-language/clinical toggle, completion assistance with guardrails, the low-code admin
surface, and VAERS-compatible structured output — evaluated at 0 WCAG 2.1 AA violations
across every page state. Every technical claim in this tab can be inspected there today.

## 2. Technical Approach and Architecture

**Architecture in one paragraph.** A responsive single-page web application (React +
TypeScript, USWDS-based design system) served from CDC's Azure environment, backed by a
lightweight API tier (Node.js) and Azure SQL within the CDC tenancy. The submission form
is **schema-driven**: form structure, branching rules, field text, tooltips, and help
content live in versioned configuration, not code — this single design decision is what
makes the low-code interface (Task 1.8) real rather than aspirational, because CDC
program personnel edit the same configuration the form engine reads. Intelligent
completion assistance runs against **CDC's existing enterprise Azure OpenAI service
(EDAV)** behind a deterministic safety gate — no new AI services, no data leaving the
boundary (our completed AI Use Compliance and Risk Management Plan, Attachment 1,
governs this in detail). All custom code is delivered open source under M-16-21 to a
CDC repository on a bi-weekly cadence. [FLAG: final stack wording pending Bish Q&A on
EDAV availability; prototype covers both smart-validation-only and assistant answers.]

**Why this is sound.** Every load-bearing element is boring on purpose: React and Node
are already present in CDC's VAERS environment; Azure SQL MI is the incumbent data
platform; USWDS is the federal design standard; the AI layer is CDC's own service. The
innovation is concentrated where it pays — branching schema engine, assistance
guardrails, low-code editing — and the risk is concentrated where we can retire it early,
which the schedule below does.

**Scalability and Phase 2 posture.** The schema-driven engine scales sideways (new
submitter types, new form versions, additional languages) without re-architecture.
The upload subsystem is built with Phase 1 restrictions enforced in configuration, so
Phase 2 expansion to images (2.4.2) is a policy change plus review, not a rebuild.
Stateless application tier scales horizontally under Azure load balancing; surge events
(a safety communication driving reporting spikes) are a capacity configuration, not an
engineering project.

## 3. Approach by PWS Task

### Task 1 — Design and Develop the Web Application

**1.1–1.2 Requirements confirmation and UX artifacts.** Weeks 1–3 are structured
stakeholder sessions with the VAERS program office to confirm data elements, integration
constraints, and success metrics — anchored on our prototype as the strawman. Reviewing
working software instead of static wireframes gets CDC to real decisions ("suppress
these three fields on this branch," "this tooltip is wrong") in the first session.
UX deliverables (user flows, wireframes, clickable prototype, landing/navigation
redesign) are due DOA+21; we hit that clock by iterating the existing prototype under
CDC direction, and we capture the abandonment-rate baseline methodology with CDC at
kickoff (feeding 1.10/PRS#4).

**1.3 Responsive application.** Mobile-first build against a Government-agreed
device/browser matrix (PRS#2), with field-level validation, inline error recovery, and
save-and-resume so an interrupted submitter does not become an abandoned report.
Automated cross-viewport regression tests run in CI on every commit.

**1.4 Landing page and navigation redesign.** Three clear front doors — report an
adverse event, check on a report, find data — with reporting tools, FAQs, and data
downloads reachable in ≤2 clicks (PRS#3). Redesign ships in the DOA+21 UX package.

**1.5 / 1.7 Satisfaction surveys.** Two instruments: site-navigation survey and
post-submission pop-up (focus-trapped, 508-conformant, dismissible without penalty).
Instruments delivered with Beta; response data reported per the approved schedule
(PRS#7) and summarized in monthly status reports.

**1.6 Branching-logic submission form.** The core of the job. One schema, two rendered
experiences: a plain-language public path written to a general reading level (1.6.1) and
a clinical provider path — with branching that presents and suppresses fields per
submitter type and report characteristics, including the mandated provider
vaccine-error-no-AE path (1.6.2, PRS#1). Branching rules are table-driven and unit-tested
against a scenario matrix we expect the Government to extend during acceptance; the
prototype already passes the vaccine-error-no-AE scenario, visibly announcing
"N questions removed" so submitters trust the shortening form. The application delivers
**full English and Spanish parity** (Amendment 0001, Q&A 270): every public-path screen,
field label, instruction, validation message, and help entry carries a reviewed Spanish
translation managed as content in the same schema, with `lang` attributes switching
per passage for assistive technology.

**1.8 Low-code/configurable interface.** Authorized CDC personnel edit field text,
tooltips, help/FAQ content, choice options, and field visibility — and, per Amendment
0001 Q&A 165, **the submission form itself: adding and modifying form fields and the
branching-logic rules that show or suppress them** — through an administrative interface
with live preview, validation against the scenario matrix, role-based access,
versioning, and one-click rollback — no developer, no deployment (PRS#8). Static
content changes publish directly; field and branching changes pass a built-in
consistency check and a preview-approve step before release. We will jointly script the Government's
update scenarios early so acceptance testing runs against rehearsed reality. The change
and configuration process is documented as part of Task 1.8 and taught to program
personnel in a hands-on session before Beta.

**1.9 VAERS-compatible data capture and transmission.** Structured outputs mapped
field-for-field to the VAERS data dictionary (the prototype already emits
VAERSDATA/VAERSVAX-shaped records including derived flags and computed fields), with
transmission mechanics (format, channel, cadence) confirmed with CDC and the existing
system contractors during 1.1 and proven in Government acceptance testing (PRS#6).
De-identification boundaries mirror the published public-data split.

**1.10 Performance.** ≤3s page loads, ≤10min median submission, ≥30% abandonment
reduction versus the kickoff baseline — engineered (static-first delivery, code
splitting, CDN caching per CDC architecture) and then **measured and reported** with an
approved methodology (PRS#4): real-user timing metrics, funnel analytics on abandonment,
monthly reporting with deviations explained. The current prototype loads in ~1.2s on
commodity hosting.

**1.11 Iterative builds.** Working builds delivered for Government review from Alpha
(DOA+45) onward on a bi-weekly cadence aligned to technical reviews; defect triage with
severity SLAs runs continuously through Beta (DOA+90) and Final (DOA+150).

**1.12 User documentation.** Public, provider, and administrator guides written against
the final UX (PRS#16), plain-language reviewed, 508-conformant, delivered with Final.

### Task 2 — Medical Record Upload and Document Management

Integrated upload lands in the form flow (2.1) while the existing post-submission tool
continues untouched — its users lose nothing. A free-text box (2.2) captures narrative
detail the structured fields miss. The **supplemental-document suggestion tool (2.3)**
scans provider submissions against a transparent, configurable rule set (report
characteristics → suggested document types) and reaches ≥90% suggestion coverage across
Government-defined scenarios (PRS#10); the rules live in the same low-code configuration
as the form, so CDC can tune suggestions as reporting patterns evolve. **Phase 1
restrictions (2.4.1) are enforced server-side** — accepted document categories are
configuration, giving CDC a designed, documented Phase 2 expansion path (2.4.2, PRS#11)
without a rebuild. All upload handling is PHI-grade: encryption in transit and at rest,
type/size validation, malware scanning per CDC standards, audit logging, least-privilege
access (2.5, PRS#9). Defect remediation and upload performance optimization continue
through Beta and Final (2.6).

### Task 3 — Security, Privacy, Compliance, and ATD

Compliance runs as an engineering workstream from day one, not a documentation phase at
the end. **Privacy by architecture (3.1):** PII/PHI minimization, no identifiers required
for assistance features, de-identification split mirrored from VAERS public-data
practice, HIPAA/Privacy Act protections documented in the PTA/PIA path. **CDC
environment only (3.2):** all development, testing, and deployment inside the
CDC-managed FedRAMP Azure boundary; we coordinate environment stand-up with CDC/OCIO and
existing VAERS hosting teams in month one. **ATD package (3.3, PRS#12):** security and
privacy documentation drafted with Beta and submitted in advance of deployment, with a
named owner (PM) for Government review comments and remediation — our schedule holds a
dedicated remediation window so ATD review does not sit on the critical path unbuffered.
**Safeguards (3.4, PRS#13):** access control, FIPS-validated encryption, audit logging,
secure configuration baselines, and vulnerability scanning in CI during development plus
pre-deployment scans with zero known critical/high findings at deployment. **Section 508
(3.5, PRS#14):** automated accessibility testing on every commit plus manual assistive-
technology testing each release; ACR/VPAT delivered with Beta and updated at Final —
the prototype's 0-violation axe results across all page states show this is our default
engineering posture, not a remediation activity. Compliance documentation package (3.6,
PRS#15), functional/security/accessibility test-and-remediate cycles before Beta and
Final (3.7), and administrator/technical guides including Task 1.8 configuration
guidance (3.8, PRS#16) complete the task.

### Task 4 — Transition-Out

Transition readiness is a standing condition, not an end-of-contract scramble: because
code goes to CDC's repository bi-weekly under M-16-21 with documentation maintained in
the same repo, the Government holds current source, configuration, and process assets
at all times. We assess and report transition readiness monthly to the COR (4.1,
PRS#18), deliver the detailed Transition-out Plan at least two months before contract
end (4.4), lead TEMs and shadowing with any successor (4.5, 4.10), and deliver final
documentation, asset inventory reconciliation, account/access handover, and closeout
(4.2–4.3, 4.6–4.11) with no degradation of support through the final day.

## 4. Schedule and Milestones

| Clock (from DOA) | Milestone / Deliverable | Our internal target | Key activities in window |
|---|---|---|---|
| DOA+10 | Project Plan + Deployment & Hosting Plan | DOA+7 | Kickoff; baseline methodology agreed; OCIO environment coordination begins |
| DOA+21 | UX wireframes, user flows, landing/nav redesign | DOA+18 | Stakeholder sessions on live prototype; abandonment baseline captured |
| DOA+30 | Technical Design Document (branching logic; low-code approach) | DOA+27 | Schema + integration design confirmed with existing-system contractors |
| DOA+45 | **Alpha** demonstration build | DOA+40 | Branching form + landing on CDC infrastructure; ATD documentation started |
| DOA+90 | **Beta** release + survey instruments, Phase 1 upload + Phase 2 provisions, draft ATD package, compliance package, ACR/VPAT | DOA+80 | Full functionality; Government scenario testing; remediation window |
| Pre-deployment | **ATD issued** (PRS#12) | Beta+30 | Review-comment remediation; pre-deployment vulnerability scan |
| DOA+150 | **Production-ready Final Release** + source/build artifacts, user guides, O&M docs | DOA+140 | Acceptance testing; defect burn-down; updated ACR |
| Monthly / bi-weekly | Status reports (10th of month); technical reviews; transition-readiness assessments | — | Continuous |

Internal targets run 3–10 days ahead of every contractual clock; the margin is our
schedule risk reserve. Bi-weekly Government technical reviews fall on the same cadence
as code delivery to the CDC repository, so review is always of current, running software.

## 5. Challenges and Solutions

| # | Challenge | Solution |
|---|---|---|
| 1 | **ATD timing risk** — Government review cycles are outside contractor control, and production deployment waits on ATD | Draft package with Beta (60+ days before needed); dedicated remediation window; PM-owned comment turnaround ≤5 business days; SA&A artifacts begun at kickoff, not Beta |
| 2 | **Coordination with existing VAERS contracts** — integration constraints surface late in multi-contractor environments | Named integration contact requested at kickoff; transmission format/channel confirmed in writing during 1.1; VAERS-compatible output validated against Government-furnished samples before Alpha |
| 3 | **Abandonment baseline (≥30% reduction) depends on a measurable starting point** | Baseline methodology co-signed with CDC at kickoff per Task 1.10; PRS#4 is measure-and-report with approved methodology; funnel analytics designed in from wireframe stage |
| 4 | **Assistance-feature trust and safety** — a public-facing AI feature in a vaccine-safety context invites misuse and misinformation risk | Deterministic safety gate ahead of any generative response (emergency, medical-advice, causality, and injection inputs receive fixed approved responses); CDC-approved content corpus; kill-switch configuration; full plan in Attachment 1 — and the guardrails are live and testable in the prototype today |
| 5 | **PRA implications for surveys/form changes** could stretch timelines outside the PoP | Confirmed by the Government: PRA clearance is a Government responsibility, worked with the awardee with timeline adjustments where appropriate (Amendment 0001, Q&A 5); survey instruments delivered to clock regardless; milestone dates adjust for Government-caused delays per standard FAR provisions (Q&A 42) |
| 6 | **Nine-month PoP with fixed clocks** leaves no absorption room for a slow start | We start from working, tested software (Tab 2-2), a confirmed team (Tab 3-1), and internal targets ahead of every clock; week 1 is stakeholder sessions on a running system |

*(End Tab 2-1 draft. Render check: target ≤7pp at TNR 12 with tables at 10pt.)*
