# Volume I — Technical: Outline (30-page cap)

*(Working outline, 8/26. Each bullet becomes prose Thu 8/27. Bracketed [RESEARCH] items are filled
from the repo research brief; [JOSEPH] items need his input. Cross-reference solicitation paragraphs
in parentheses per instr. 1.2 "Cross-Referencing". No price information anywhere in this volume.)*

Header/footer every page: *Frasier Digital, LLC · PANHEC-26-P-0000-026407 · [date]* · page N of M.
Volume opens with **Table of Contents** (excluded) and a **Summary Section** (≈½ page, counted).

---

## Summary Section (½ pp)

- Who we are in one paragraph: SDB, Tomball TX, NAICS 541511, principal-led; the five named key
  personnel; delivery from our facility (PWS Place of Performance).
- What we will do in one paragraph: finish and land the existing authorization work (PR #1461,
  PR #13), stand it up in CWBI-Dev (then Test under 3b), expand the React admin UI to TE1, build a
  locally runnable load-test harness (TE3), and carry maintenance at HEC's review cadence (TE4).
- Affirmation lines (Q22): SAM registration active (UEI PY8MJ4JPHJ45, CAGE 213L8, expires
  5/27/2027); representations and certifications current (RFO 4.203-1); no teaming partners.

---

## Factor 1 — Response to Project Technical Approach (instr. 2.1.1 / 3.2.1.1)

### TAB A — Technical Approach (≈9 pp) (instr. 2.1.1 TAB A; TE2; 3.2.1.1.1)

**A.1 Understanding of the baseline we inherit** (≈1.5 pp)
- CWMS transition from 32 district databases to a single cloud system; authorization moving from
  Oracle VPD/session context into CDA (PWS 1.2). Why that makes CDA the right enforcement point.
- RFC 0001 design as the accepted architecture: OPA policy decision, Redis-class cache, proxy
  [RESEARCH: exact components, decision points]. Q35: OPA and policies stay; cache is a given;
  proxy open with cost rationale.
- **Inherited work inventory table**: PR #1461 (auth flow into CDA — known to have worked, now
  stale), cwms-access-management PR #13, open `auth-contract` issues [RESEARCH: list], compose vs
  podman drift, TeamCity→GitHub Actions migration. For each: what it is, why it's not merged, what
  "done" looks like, which task funds it.
- Current effective authorization: office + role ("CWMS User", "TS ID Creator", else read-only) —
  the floor we must not break during cut-over.

**A.2 Approach by task** (≈4 pp)
- **Task 1a/1b — Development meetings.** Biweekly, ≤3 staff; notes within 1 business day as
  Confluence minutes + GitHub issues/milestones + skeleton PRs (the deliverable menu in PWS 2.1).
  Show a sample meeting-note template. Notes are the audit trail for Task 5 approvals.
- **Task 2 — Authorization + UI** (summary here; design detail in Tab B). Sequence: (1) rebase
  and land #1461 behind a feature flag; (2) policy model extension for time-series-scoped
  policies; (3) UI increments per TE1 tabs; (4) docs + training materials. Minimum successful
  product per PWS: interface + working access control for time series + docs.
- **Task 3a/3b — CWBI-Dev / Test stand-up.** The CWBI change path: we cannot create services;
  changes go through Platform1 Jira to the CWBI infrastructure contractor; possible PRs to dev CDK
  (Q11). Deliverable = functional policy-based authorization in Dev (3a), Test (3b). Show the
  container set to add to the CWMS-Data module (OPA, cache, proxy), health-check endpoints for CWBI
  uptime monitoring (TE2 Code), hardened/Chainguard images, STIG posture (Application Security &
  Development + Application Server STIGs — Q10), distroless-or-updatable images. Map who does what:
  CWBI scans / we respond; no eMASS interaction (Q10). [RESEARCH: CWBI standard-app pattern.]
- **Task 4 — Load testing** (summary; detail in Tab C).
- **Task 5a/5b — Maintenance.** The TE4 workflow as a state machine: classify (1 h) → direction →
  fix (2 h checkpoint, draft PR at 4 h) → docs → invoice log per GitHub issue with all six required
  fields (PWS Task 5a). Start within 5 days, first work unit within 2. Weekly volume tuned to HEC's
  6 h/wk review (Q47: HEC adding reviewers). Scope repos per Q46.
- **Work-unit discipline across all tasks**: small PRs sized to HEC's review ladder (≤200 LOC / 3
  days; ≤500 / 5; more / 10), tests required for code changes, "single item of truth" for compose
  and test setups (Q36).

**A.3 How we work with CWBI-PMO, HEC, and other contractors** (≈1 pp) (TAB A prompt; 3.2.1.1.1
"dynamic project contributed to by other Government staff and contractors")
- Interaction model: HEC technical POC (code review, priorities), CWBI-PMO (infrastructure via
  Platform1, scans, ATO artifacts on request through ISSO/ISSM), other vendors (merge-conflict
  rule: first merged wins; design conflicts → ADR in docs/source/decisions — Q46).
- Onboarding path and timeline: DD 7798, DD 2875, Public Trust, Platform1 (~1 week+), GitHub
  access after kickoff (1–2 days), bastion access via our fixed IP (Q11, Q13, Q19). Productive
  from day one on the public repos + docker-compose stacks (Q18, Q19).

**A.4 Knowledge areas the evaluators score** (≈1.5 pp) (3.2.1.1.1) — one tight subsection each,
each tied to a concrete thing we will do on this contract, not a capability claim:
- Full SDLC + agile: cadence, definition of done = accepted work unit, CI on GitHub Actions.
- Database administration: Oracle RDS in GovCloud, VPD/session-context legacy, schema changes
  in cwms-database when CDA needs them (PWS Coordination), testcontainers Oracle image.
- REST API development: Javalin, AccessManager, OpenAPI exposure (TE2 Data Exchange).
- Access control: OPA/Rego, policy model (district, role, policy, time-series group, embargo),
  Keycloak/OIDC/Login.gov/EAMS-A, API keys, deny-by-default, tests that prove both allow and deny.
- Configuration management: GitHub Enterprise, feature flags, ADRs, compose parity, image
  updates.
- Cybersecurity: OWASP Top 10 + ZAP in CI, STIG checklist items we own, audit-record content
  (TE2 Infrastructure auditing bullets), NSA-approved encryption in transit/at rest via CWBI.
- CWBI processes: Platform1 change requests, hardened images, health checks, CWBI logo/banner,
  CW Data Catalog registration of the API (TE2 Metadata).
- Communicating security needs succinctly: the one-page "authorization change summary" we attach
  to each policy-affecting PR.

**A.5 Level of effort per task** (≈½ pp) (instr. 2.1.1 "proposed level of effort per task")
- Table: Task × role × hours. Totals per task. **No dollars.** Must reconcile exactly with Vol III.

### TAB B — UI Improvements (≈6 pp) (instr. 2.1.1 TAB B; TE1; 3.2.1.1.3)

**B.1 Current state of cwms-access-management** (≈1 pp) [RESEARCH: stack, dirs, policy model,
API calls, tests] — what exists, what is stubbed, perceived shortcomings (evaluators score
"details of any perceived or apparent shortcoming of the current systems").

**B.2 TE1 requirement-by-requirement gap table** (≈1.5 pp) — Users tab (5 items), Roles tab (5),
Policy tab (6): exists / partial / missing; component or file affected; task increment.

**B.3 Deep-dive requirement: "Assign a time series to a policy — LOC/parameter/version scoping and
embargo"** (≈2.5 pp)
- Data model: policy → selectors (time-series group | LOC/parameter/version pattern) →
  allow/deny → embargo window. Where it lives (access-management store vs CWMS DB time-series
  groups — TE1 says either; recommend and justify).
- OPA input shape and Rego rule sketch (pseudo-code allowed per instr. 2.1.1).
- CDA enforcement point: where in the request path the time-series identity is resolved and
  checked; cache key; what happens on embargoed reads (deny vs delayed-visibility).
- React UI: Policy tab flow — select policy → add selector (group picker or LOC/parameter/version
  form with validation against the catalog) → embargo picker → preview of affected time series →
  save; bulk assignment; district scoping of what the admin can see/edit.
- Tests: policy unit tests (Rego), CDA integration tests proving allow **and** deny, UI component
  tests, one end-to-end scenario.
- 508: keyboard path, labels, error messaging — Q49 (HEC requires 508; Storybook-friendly).

**B.4 Second requirement in brief: "Show new users that do not have assigned privileges yet"**
(≈½ pp) — registration creates account without roles; query + Users-tab list + district filter +
assign-from-list action.

**B.5 Delivery progression through the contract** (≈½ pp) — the increment order and why (Task 2
180-day PoP; minimum product first).

### TAB C — Load Testing (≈4 pp) (instr. 2.1.1 TAB C; TE3; 3.2.1.1.4)

**C.1 Tool choice and why** — [RESEARCH: anything already in repos]. Candidate: k6 (open source,
scriptable, runs on a laptop, distributed mode available) vs JMeter (named in TE3, GUI-heavy, JVM).
Criteria straight from Q38: open-source/unrestricted license; local run for correctness; same
tool scales to a real environment; CDA response time is the metric.
**C.2 Harness layout** — repo location, config-as-code for target host(s), auth modes
(authenticated/unauthenticated/API key), data seeding, result export (JSON → CSV/notebook).
**C.3 Scenario matrix from TE3** — the five load rows × read/write × 1/2/3-instance topology
(topology as a config property, not a separate run — Q40); catalogs, time series, locations, the
`rate` endpoint; several time-window lengths.
**C.4 Environments** — local docker-compose (CDA + Oracle free image), HEC CloudStack (no cost,
optional), and how 2/3-instance round-robin is stood up (reverse proxy in front of N CDA
containers). CPU/memory fixed at 1 vCPU / 2 GB per TE3.
**C.5 What the baseline answers** — RDS vertical vs read replica; CDA horizontal scaling; the
"write amplification" and bot-download observations from Q38 as first analyses; report format.

---

## Factor 2 — Management Approach, Key Personnel, Transition Plan (instr. 2.1.2 / 3.2.1.2)

### TAB A — Management Approach (≈5 pp) (3.2.1.2.1)

- **Org chart** (counts against pages): CO/CS ↔ Joseph (PM, single POC) ↔ HEC technical POC;
  under Joseph: Scott (architecture/CWBI), Randy (CDA/Java), Zach (UI), Efrain (database),
  delivery pod Andrew + Seth. Lines of authority and communication explicit.
- **Staffing plan by task with simultaneity** — table: person × task × hours/week across the
  360-day PoP showing Tasks 2, 3a, 4, 5a running concurrently without degradation (3.2.1.2.1
  second bullet). Reconciles with A.5 and Vol III.
- **Responsiveness and customer service** — 5-day start / 2-day first submittal on Task 5;
  1-business-day meeting notes; 5-day turnaround on HEC review comments; one shared channel.
- **Reducing performance risk** — feature flags, small PRs, tests-as-documentation, ADRs for design
  changes, weekly internal review before HEC review to protect HEC's 6 h/wk.
- **Risk register** (table): onboarding latency; #1461 rework larger than expected; CWBI change
  lead time; Oracle RDS behavior differences; HEC review bandwidth; team moonlighting capacity.
- **Capacity disclosure** paragraph (NOAA/VAERS pattern) [JOSEPH: current award status wording].
- **Quality**: definition of done, test locations in HEC's preferred order (PWS Source Code
  Updates), ZAP scans, STIG self-checks before each Dev deployment.

### TAB B — Key Personnel Resumes and Experience (≈2 pp narrative + annex) (3.2.1.2.2)

- **Role → requirement matrix**: five solicitation titles → person → the technologies in use they
  have directly used (Q8 test) → relevant years. State plainly that Oracle Forms/APEX are not in
  use (Q7) and that the Senior Forms Developer role is filled by a senior React/TypeScript
  web-forms developer per Q8.
- Half-paragraph per person on why this person for this role.
- Annex (excluded): five resumes ≤2 pp each — job title proposed, education, certifications,
  special qualifications, experience with duties and dates (3.2.1.2.2); five letters of commitment.

### TAB C — Transition Plan (≈2 pp) (3.2.1.2.3)

- **Transition-in (first 30 days)**: access paperwork week 1 (DD 7798, DD 2875, Platform1 request,
  fixed IP provided to CWBI), kickoff → GitHub access → #1461 rebase started on public repos and
  compose stacks while CWBI access lands; PMP-lite with standard-app diagram (Q48/Q50).
- **Transition-out / continuity** (the prompt: "schedule for HEC to continue any uncompleted
  work"): everything lives in HEC repos from day one; open work is an issue with status, a branch,
  and an ADR if design-bearing; final 30 days: handoff sessions in the biweekly meetings, docs
  audit, training materials delivered (Task 2), load-test harness runbook (Task 4), maintenance
  log closed out with every invoice-referenced issue resolved or annotated.
- Schedule table: T-30, T-14, T-0.

---

## Page reconciliation

| Section | Budget |
|---|---|
| Summary | 0.5 |
| F1-A | 9 |
| F1-B | 6 |
| F1-C | 4 |
| F2-A | 5 |
| F2-B | 2 |
| F2-C | 2 |
| **Total** | **28.5 / 30** |

Excluded: cover, TOC, resumes (≤2 pp × 5), letters of commitment (5).
