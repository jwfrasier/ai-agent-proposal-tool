# Bid Plan — USACE HEC CWMS Database Authorization Maintenance and Improvements

**Solicitation PANHEC-26-P-0000-026407** (combined synopsis/solicitation, SAP, FFP, total SB set-aside,
NAICS 541511 / $34.0M). Current SAM revision `5a59cdcff71a44a7bee6e88c05dd03cf` (Amendment 003, 8/26).
**DUE: Thursday, September 3, 2026, 4:30 PM ET** — email to Quan.Nguyen@usace.army.mil, cc
David.A.Kaplan@usace.army.mil. Separate native files (PDF/Word/Excel), **no zip, 25 MB per email**,
single or multiple emails OK. Government acknowledges receipt by email.
**Target send: Wednesday, September 2** (one day early; VAERS sends Tuesday 9/1 to clear the lane).
GO decision: Joseph, 2026-08-26, after Amendment 003 Q&A cleared the key-personnel gate.

Source docs: `amend003/` (Amend 003 CSS, Q&A answers, submission instructions 8/26, PWS 8/18, PPQ form).
Questions we sent 8/21: `QUESTIONS-EMAIL.md`. Memory: `cwms-usace-authz-opportunity`.

## What the Q&A settled (drive everything below)

| Item | Answer | Source |
|---|---|---|
| Oracle Forms / APEX | Not used, not planned. React + NodeJS/TypeScript + REST API, "expanded, not replaced" | Q7 |
| Equivalence for Forms Dev / Oracle DBA slots | Accepted **if resumes show direct use of the technologies already in use** | Q8 |
| One person, multiple key roles | Yes | Q9 |
| Minimum quals | Any combination of education/cert/experience showing knowledge of the tasks | Q6 |
| Incumbent / predecessor | W912HQ25P0049, **Solid Logix LLC, $241,435**, 5/15/25–2/14/26 (USAspending) | Q29 |
| Volume IV | Not required. SAM affirmation goes in the technical volume | Q22 |
| Cover letter | Signed letter preferred; CAGE, UEI, TIN, reps&certs current, teaming; not counted in pages | Q3 |
| Page-count exclusions (Vol I) | Cover, TOC, resumes (≤2 pp each), letters of commitment. Summary + org chart COUNT | Q20 |
| LOC placement | In Vol I only | Q21 |
| Factor 2 tabs | A Management Approach · B Key Personnel · C Transition Plan | Q23 |
| Past performance | Min 1, max 3 refs; commercial PPQs OK; prime must have its own | Q25–27 |
| Excel price sheet | All 8 CLINs, separate file; assumptions in the PDF price volume | Q5, Q24 |
| CUI / NIST / CMMC | None required (public information) — 252.240-7997 still applies | Q14–17 |
| Access | Public Trust; DD 7798 + DD 2875; ≤1 month onboarding; **fixed IP for bastion access** | Q11, Q13 |
| On-site / travel / SCA / RACI | Boilerplate from CWBI — none required | Q12, Q50, Q51 |
| OPA / cache / proxy | OPA required; Redis-class cache is a given; proxy open to change with cost rationale | Q35 |
| Auth-method report | Dead — RFC 0001 exists; award + kickoff = go on the technical approach | Q34, Q44, Q48 |
| Baseline to finish | cwms-data-api PR #1461 (stale, needs rework), access-management PR #13, `auth-contract` issues, compose/podman unification | Q36, Q45 |
| Load test | Open-source, locally runnable, baseline only; 30–40 humans + bots; bursts to a few million reads; 1/2/3-instance as a config property | Q38–40 |
| Task 5a/5b payment | **Only for delivered, accepted work units** — not equal monthly | Q33 |
| HEC review capacity | Will add staff; 20 h/wk is a planning target, not a limit | Q47 |
| Non-price vs price | Factors 1–3 equal; combined significantly > price. Need ≥ Acceptable on 1 and 2, ≥ Neutral on 3 | Amend 003 |

## Win strategy

1. **Lead with the baseline, not with us.** Tab A opens on PR #1461, PR #13, the `auth-contract`
   issues and the compose/podman drift — the four things the Government told us the awardee inherits —
   and sequences them. Evaluators score "understanding"; nothing demonstrates it like naming their
   own open PRs and what it takes to land them.
2. **Tab B answers one requirement all the way down.** Pick "assign a time series to a policy
   (LOC/parameter/version) with embargo" and take it from data model → OPA input → React component →
   test. Second requirement (unassigned-users list) in half the depth. The rest as a gap table.
3. **Tab C is a tool decision with a reason.** k6 (or JMeter — decide after research) chosen for
   local-runnability and the 1/2/3-instance topology as a config property, exactly as Q40 asked.
   Include the harness layout, the scenarios table from TE3, and what the output feeds (RDS
   vertical vs read-replica vs CDA horizontal — TE3's stated intent).
4. **Key personnel pass the "direct use" test on paper.** Every resume is rewritten so the first
   half-page is the stack in use: React/TypeScript, Node, Java REST, Oracle, OPA/Rego, Keycloak/OIDC,
   Docker/compose, AWS CDK, JUnit5/REST-Assured/testcontainers. No Oracle Forms pretense.
5. **Price to the incumbent's number.** Solid Logix did ~9 months of "review and plan" for $241k.
   Base ≈ $213k for build + deploy + maintenance reads as the credible successor; ≈ $360k
   all-options. Task 5a priced at effort, with the pay-per-work-unit reality acknowledged.
6. **Honesty on capacity** — same disclosure paragraph pattern as NOAA/VAERS; the fixed-IP
   requirement and Public Trust onboarding are shown as a transition-in checklist, not hidden.

## Key personnel slate (Joseph, 8/24; confirmed for pursuit 8/26)

| Role (solicitation title) | Person | "Direct use" evidence to surface | Status |
|---|---|---|---|
| Project Manager | Joseph Frasier | Region 4 PM + dev; React/TS; Node; auth/RBAC backend; federal delivery | ✔ |
| Senior Oracle DBA | Efrain Rocha | Oracle (OCI partnership, Oracle DW at JPMC), Java, AWS, Docker; **needs explicit DBA duties/versions/RDS** | LOC + resume facts needed; rate TBD (~$100) |
| System Engineer / Architect | Scott Carpenter | AWS IaC (−96% deploy time), Java, Python, security docs; **ask: CDK? ECS? containers?** | LOC needed; $60/hr |
| Senior Forms Developer (→ React web-forms) | Zachary Antosko | React/Redux, Node/TypeScript/NestJS, REST, Docker, AWS RDS; **ask: forms-heavy UI, testing tools, any Java/Oracle** | LOC needed; $75/hr |
| Senior APEX **or Java** Developer | Randy Chong | Java/Spring REST, AWS ECS/EKS/RDS, JUnit; **ask: React exposure, Oracle/SQL, OIDC/JWT** | LOC needed; $65/hr; moonlight |

Non-key delivery pod (no resumes/LOCs): Andrew Frasier (Task 2 UI; RBAC/RLS at Irongrove), Seth
Chesky (Task 5a maintenance + tests; $50/hr, available now). Stacy Hunt held as surge. Alan Hong
free (DoWEA cancelled). All US citizens ✔.

Q9 option (not taken by default): Joseph could dual-hat PM + SE/Architect to drop a LOC. Keep Scott
unless his LOC slips past Monday 8/31.

## Volumes, page budgets, gates

**Cover letter** (signed, letterhead, not counted): offer statement; CAGE 213L8 · UEI PY8MJ4JPHJ45 ·
TIN 41-3497002; reps & certs current in SAM (RFO 4.203-1); SAM active (exp. 5/27/2027); no
teaming/subcontracting (all named staff are Frasier Digital 1099 team members — confirm wording);
acknowledges Amendments 001–003; no exceptions to terms; price validity 90 days; POC block.

**Volume I — Technical (30 pp cap)** — TNR 12, 1" margins, tables ≥10 pt, header/footer with
company name, date, RFP number; each file has TOC + Summary + Narrative (instr. 1.2).

| Tab | Content | Pages |
|---|---|---|
| — | Summary section (abstract of the volume) | 0.5 |
| F1-A | Technical Approach: baseline inventory; CWBI-Dev stand-up of OPA/cache/proxy alongside CDA; CDA integration (finish #1461); CDK/Platform1 change path; agile cadence w/ HEC's review schedule; DBA/REST/access-control/CM/cyber knowledge; STIG posture; LOE per task table (hours, no $) | 9 |
| F1-B | UI Improvements: current-state critique of cwms-access-management; TE1 gap table; deep-dive requirement; second requirement; 508 approach | 6 |
| F1-C | Load Testing: tool + why; harness layout; TE3 scenario matrix; 1/2/3-instance topology; local vs CloudStack; what the baseline informs | 4 |
| F2-A | Management Approach: org chart; staffing plan by task with simultaneity; comms/reporting; risk register; capacity disclosure; SAM affirmation line | 5 |
| F2-B | Key Personnel narrative + role→requirement matrix (resumes and LOCs follow as annex, excluded) | 2 |
| F2-C | Transition Plan: transition-in checklist (DD 7798/2875, fixed IP, GitHub, Platform1) and transition-out (ADRs, issue hygiene, handoff schedule for uncompleted work) | 2 |
| Annex | Five resumes ≤2 pp each + five LOCs | excluded |

**Volume II — Past Performance (25 pp cap)**: Region 4 ESC project data sheet with every field in
instr. 2.2.1.1; relevance narrative (REST API, auth/RBAC backend, React front end, Oracle-adjacent?
no — be honest: PostgreSQL/… check card); **USACE PPQ (Form PPQ-0) completed by Ethan Gula** attached
(excluded from count). Value figure: **"approximately $400,000"** — must match what Ethan verified on
the SSS/NOAA PPQs (consistency map in `frasier-past-performance`).

**Volume III — Price**: PDF narrative (CLIN table 1001–5002 with per-task totals and grand total incl.
options; labor categories and fully burdened rates; assumptions incl. Q33 work-unit invoicing, Q32
option PoP, no travel/ODCs, no CUI) + **Excel** with hours per person per task per CLIN.

## Price frame (refresh `vol3-price/pricing-model` — build)

Rate card: PM $165 · Senior $145 · Associate $90 (blended ≈ $131). Prior model: base ≈ $213k
(1a, 2, 3a, 5a), all-options ≈ $360k (+1b, 3b, 4, 5b). Incumbent anchor $241k. Task 2 (≈550 h) is the
estimating risk — size against the research brief. 5a at ~780 of 803 h. Margin target ≈ 50%+.

## Calendar

| Day | CWMS | Also |
|---|---|---|
| **Wed 8/26** | GO ✓ · plan ✓ · Vol I outline · LOC/resume requests to Efrain, Zach, Scott, Randy · **PPQ to Ethan** (his Region 4 email ends Mon 8/31) · repo research brief | — |
| Thu 8/27 | F1 Tabs A/B/C full drafts · price model refresh · resume rewrites v1 from cards + replies | Joseph: chase LOC replies, Efrain rate |
| Fri 8/28 | F2 Tabs A/B/C · Vol II · Vol III + Excel · cover letter · render pass 1 + page check | Ethan PPQ back (target) |
| Sat–Sun 8/29–30 | Team reviews resumes; fixes; render pass 2 | VAERS final review pass |
| Mon 8/31 | All five LOCs signed in hand · red-team read · FORMAT-CHECK.md | Ethan's last Region 4 day |
| Tue 9/1 | Final render; Joseph signs cover letter | **VAERS SEND** |
| **Wed 9/2** | **CWMS SEND** (Nguyen, cc Kaplan) — confirm Gov receipt ack | — |
| Thu 9/3 | Deadline 4:30 PM ET | Fri 9/4 VAERS deadline |

Watch: `npm run watch` every session; CI alarms every 6 h. An Amendment 004 with a deadline move is
plausible given the volume of Q&A corrections.

## Risks

- **LOC latency** — five signatures, four moonlighters. Requests go out today with a Sat 8/29 ask
  and Mon 8/31 hard stop; Q9 dual-hat is the fallback.
- **Resume "direct use" test** — evaluators will read for React/Node/Java/Oracle/OPA by name. Any
  resume that leans on titles instead of stack fails Q8. Rewrite, don't reformat.
- **Ethan timing** — PPQ must be completed and returned (to us or directly to Kaplan/Nguyen) before
  his Region 4 account closes 8/31. Backup: PPQ from personal email is still a valid client
  submission, but weaker. Send today.
- **Two sends in two days** — VAERS is already built; its 9/1 send is a review-and-sign, not a build.
- **Task 5a revenue is contingent** (Q33) — price it honestly; don't let it carry the margin.
- **Fixed IP** — Joseph needs a static IP or a VPN egress with a fixed address before award; state
  the plan in Transition-in.
