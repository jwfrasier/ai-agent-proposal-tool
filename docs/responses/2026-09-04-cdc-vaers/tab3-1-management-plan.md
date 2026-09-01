# Tab 3-1 — Management Plan

*(Draft for Vol I. Page budget: 4pp of the 15pp cap. Bracketed [FLAG] items need Joseph
verification before render. Eval criterion A2: org structure/PM authority; rapid
staffing + 3-year turnover table; metrics; QA/risk/comms; subcontractor management.)*

---

## 1. Organizational Structure and Program Manager Authority

Frasier Digital is a principal-led small business: the Program Manager is the company's
founder and managing member, and he personally leads this delivery. That structure is
CDC's management-risk mitigation. There is no account layer, no matrixed resource pool,
and no approval chain above the PM — **the person accountable to the COR has full,
immediate authority over staffing, budget, priorities, and corrective action**, and the
distance between a Government comment and a binding decision is one phone call.

**Joseph Frasier (PM / Lead Architect, Key Personnel)** directs the program, owns all
deliverables, chairs the bi-weekly technical reviews, and is the single point of contact
for the CO and COR. **Ryan Daley (Technical Lead, Key Personnel)** owns day-to-day
engineering execution and release quality; his healthcare-IT background (Optum/
UnitedHealthcare; Shuttle Health) anchors the team's PHI/PII and ADA-conformance
discipline. Supporting engineers report to Ryan; content and UX-research support report
to Joseph. The team communicates in a single shared channel with CDC-visible status —
no internal information asymmetry for the Government to penetrate.

Escalation path: any team member → PM within the same business day; PM → COR per the
communication plan below. For incidents, the 1-hour reporting channel operates
independently of the management chain so notification is never queued behind analysis.

## 2. Staffing Plan

The team is named, confirmed, and sized honestly for a nine-month FFP delivery
(~1.8 FTE average, weighted toward the build phase; commitments below reconcile exactly
with the labor hours itemized in Volume II):

| Person | Role | Commitment | Relevant depth |
|---|---|---|---|
| Joseph Frasier | PM / Lead Architect + Security & Compliance Lead (**KEY**) | 0.55 FTE (both roles) | Federal delivery lead; architecture; prototype author; SA&A/ATD/EPLC artifact ownership |
| Ryan Daley | Technical Lead — healthcare IT (**KEY**) | 0.25 FTE | Optum/UnitedHealth; Shuttle Health; ADA-conformant UI delivery; CI/CD ownership |
| Rahmin Shoukoohi | Integration & data engineer | 0.15 FTE | HolonHealth (60k-user healthcare platform, auditable ledger); state education data-exchange; **Atlanta-area — aligned to CDC core hours and available for coordinated on-site presence** |
| Andrew Frasier | Frontend engineer, test automation, 508 testing | 0.50 FTE | Component build-out; automated accessibility testing in CI |
| Seth Chesky | QA & accessibility engineer | 0.20 FTE | Release-candidate QA cycles; manual assistive-technology testing; current on our component stack |
| Rida Khazi | Plain-language content, UX research, satisfaction surveys | 0.12 FTE | Public-path language (Task 1.6.1); survey instruments (1.5/1.7) |

**Rapid staffing.** Our staffing risk is managed by design rather than by requisition:
every person above is identified by name today, has worked with this team's stack and
standards, and requires no recruiting pipeline. A pre-identified bench of additional
vetted engineers from our standing roster can be activated inside two weeks —
onboarding for this contract means Tier 2 (MRPT) paperwork, NDAs, and CDC trainings, not
finding a stranger. Roster submission 30 days before the effective date, background
investigations, and training compliance are managed by the PM as contract deliverables
with the same tracking as technical milestones.

**Capacity disclosure.** Frasier Digital currently has proposals under evaluation with
other agencies with periods of performance that could overlap this one. We size and
price every bid against total committed capacity: the FTE commitments above are net of
all potential concurrent awards, the named bench exists to absorb surge, and the PM's
combined 0.55 FTE on this contract is protected as a floor, not an average. We flag this
proactively because deliverable-based FFP work only functions when capacity claims are
honest. [FLAG: keep wording synced with actual award status at render time — mirrors
NOAA disclosure pattern.]

**Employee turnover — past three years.** Frasier Digital does not operate a
salaried-staff pool, so we answer this requirement transparently rather than
statistically: delivery is performed by the firm's principal together with named
associates who are individually committed to a specific engagement at proposal time and
engaged under written agreement at award. No Frasier Digital delivery-team member has
ever departed during an engagement.

| Year | Salaried technical employees | Departures (voluntary/involuntary) | Mid-engagement departures from delivery teams |
|---|---|---|---|
| 2024 | 0 | 0 / 0 | 0 |
| 2025 | 0 | 0 / 0 | 0 |
| 2026 (YTD) | 0 | 0 / 0 | 0 |

On a nine-month contract, the turnover risk that matters is not a statistic but a
question: *will the people named in this proposal be the people doing the work?* Our
answer is structural, not historical — key personnel are contractually committed to this
engagement, substitution requires CO/COR approval under the contract terms, each named
associate has confirmed availability for this period of performance before being
proposed, and the accountable principal cannot leave his own firm. A named,
pre-identified bench (Section 2) backstops the commitment rather than a recruiting
pipeline.

## 3. Performance Metrics and Measurement

Our internal metrics mirror the Government's Performance Requirements Summary line for
line, measured continuously in CI and reported monthly — so Government acceptance
testing confirms numbers we already track rather than discovering new ones:

| PRS focus | Our internal metric and cadence |
|---|---|
| PRS#1 branching correctness | Scenario-matrix pass rate (100% target) — every commit, in CI |
| PRS#2 responsiveness | Device/browser matrix regression — every release candidate |
| PRS#3 landing/navigation | Access-path functional checks — every release |
| PRS#4 performance | Real-user page-load p95, submission-time median, abandonment funnel — continuous, reported monthly with methodology |
| PRS#5 data completeness | Required/critical field completeness on synthetic then live reports (≥90% target) — weekly analysis |
| PRS#6 VAERS-compatible output | Structured-output validation against data-dictionary mappings — every commit |
| PRS#7 surveys | Deployment status + response-data delivery per approved schedule |
| PRS#8 low-code editability | Government update-scenario rehearsal pass rate (≤1 dev intervention) — monthly from Alpha |
| PRS#9–11 upload/Phase 1 | Upload defect counts by severity; Phase 1 restriction enforcement tests — every release |
| PRS#12–13, #15 security/ATD | SA&A artifact status; scan findings burn-down (zero known critical/high at deployment) — bi-weekly |
| PRS#14 Section 508 | Automated axe pass (0 violations) every commit + manual AT testing every release; ACR currency |
| PRS#16 documentation | Guide completeness vs. final UX — at Beta and Final |
| PRS#17 PM reporting | On-time PM deliverable rate (≥95%); bi-weekly review attendance (100%) |
| PRS#18 transition readiness | Monthly readiness assessment delivered; repo/docs currency check |

Metrics appear in every monthly status report with trend lines, threshold status, and —
where a threshold is at risk — a named corrective action with an owner and a date.

## 4. Quality Assurance, Risk Management, and Communications

**Quality control.** Quality is enforced where it is cheapest — in the pipeline, before
Government review: author-≠-reviewer code review on every change; CI gates (unit,
integration, accessibility, cross-viewport, structured-output validation) that block
merge on failure; bi-weekly code delivery to the CDC repository so the Government always
reviews current, running software; severity-classified defect triage with remediation
SLAs through Beta and Final. The QA function is owned by the Technical Lead and audited
by the PM — findings, not assertions, drive release decisions.

**Risk management.** A living risk register (established at kickoff, reviewed at every
bi-weekly technical review, summarized monthly) tracks each risk with probability,
impact, trigger, owner, and mitigation. The top program risks and their mitigations are
detailed in Tab 2-1 §5 — notably ATD review timing (draft package 60+ days early with a
dedicated remediation window), multi-contractor integration (written interface
confirmation during Task 1.1), and the abandonment baseline (methodology co-signed at
kickoff). New risks enter the register through anyone on the team; only the PM retires
them.

**Change control.** Scope, architecture, and performance standards are protected by a
formal change process: any proposed change is written up with cost/schedule/performance
impact, reviewed by the PM, and — where it touches contract scope or Government-approved
baselines — submitted to the CO/COR for approval before implementation. Configuration
changes made through the Task 1.8 low-code interface are versioned with one-click
rollback, so CDC's own content changes are governed by the same discipline without
developer gatekeeping.

**Communications.** Bi-weekly technical reviews chaired by the PM against working
software; monthly status reports (by the 10th) covering accomplishments, schedule,
risks, staffing changes, and planned-vs-actual expenditure; a Cost Management Plan
maintained and current per Subsection C; ad-hoc access to the PM during CDC core hours
(8:30–5:00 ET) with same-business-day response; 1-hour incident reporting. We operate on
a no-surprises rule: any threshold at risk is in front of the COR before it is a
problem, with a proposed correction attached.

## 5. Subcontractor Management

Frasier Digital will perform this requirement entirely with its own personnel. **No
subcontracting opportunities exist under this effort**; accordingly, no subcontractor
management plan or draft subcontract agreement is required. Should the Government later
direct or approve a change to this posture, subcontracted work would be managed under
the same QA gates, metrics, and communication cadence described above, with a draft
agreement provided for Government review before execution.

*(End Tab 3-1 draft. Render check: target ≤4pp at TNR 12 with tables at 10pt.)*
