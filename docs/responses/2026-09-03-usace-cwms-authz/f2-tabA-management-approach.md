# Factor 2 — Management Approach, Key Personnel, and Transition Plan

## TAB A — Management Approach

*(Instr. 2.1.2 TAB A; evaluated per instr. 3.2.1.2.1: risk reduction, responsiveness, customer service, timeliness; hierarchy, responsibilities, and a staffing plan showing simultaneous performance of all tasks without degradation.)*

### A.1 Organization and lines of authority

Frasier Digital, LLC is a principal-led small disadvantaged business. The Project Manager is the company's founder and managing member; there is no account layer between the Contracting Officer's Representative and the person with authority over staffing, priorities, and corrective action. The organization for this contract is shown in Figure A-1.

**Figure A-1. Organization chart and lines of communication.**

<table>
<tr><th colspan="2" style="text-align:center">Government</th><th colspan="2" style="text-align:center">Contracting</th></tr>
<tr><td colspan="2" style="text-align:center">USACE HEC — Technical POC / Technical Supervisor<br>CWBI-PMO — Platform1, ISSO/ISSM<br><em>code review · priorities · approvals · scans</em></td><td colspan="2" style="text-align:center">CEHEC-CT — Contracting Officer / Contract Specialist<br><em>contract administration · invoices</em></td></tr>
<tr><td colspan="4" style="text-align:center"><strong>Joseph Frasier — Project Manager (KEY)</strong><br>single point of contact · owns every deliverable · chairs biweekly meetings · approves every submission</td></tr>
<tr><td style="text-align:center"><strong>Scott Carpenter</strong><br>System Engineer / Architect (KEY)<br>CWBI, CDK, sidecars (proxy, OPA, cache), images, STIG</td><td style="text-align:center"><strong>Randy Chong</strong><br>Senior Java Developer (KEY)<br>CDA, PR #1461, <code>auth/</code> endpoints, integration tests</td><td colspan="2" style="text-align:center"><strong>Zachary Antosko</strong><br>Senior Forms (React/TypeScript) Developer + Senior Oracle DBA (KEY, dual role — Q&A 9)<br>management UI, management API, TE1 increments · schema, VPD interaction, test images</td></tr>
<tr><td colspan="4" style="text-align:center"><strong>Delivery pod (non-key)</strong> — reports to the PM; day-to-day direction from the senior owner of each stream<br>Andrew Frasier, associate engineer — Task 2 UI components · Seth Chesky, associate engineer — Task 5a maintenance and tests</td></tr>
</table>

Authority runs one way: every team member reports to the Project Manager, who is the only person who commits the company to the Government. Communication runs on one shared channel visible to the whole team, so that a question asked of any engineer is seen by the PM the same day. Technical direction from HEC arrives through pull-request review, GitHub issues, and the biweekly meeting; we do not create side channels that the Government cannot see.

### A.2 Staffing plan and simultaneity

The team is named, confirmed, and sized against the level of effort in Factor 1, Table A-2, which Volume III prices. Table A-3 shows how the base-period tasks run concurrently across the 360-day period of performance without any task starving another: Task 2 and Task 3a run in parallel through month six on different people (the UI and CDA developers on Task 2; the architect on Task 3a), Task 5a runs at a steady fractional rate from the first approved issue, and Task 1a is a fixed cadence.

**Table A-3. Base-period staffing by task and quarter (average hours per week).** [FLAG: reconcile with Vol III]

| Person (role) | Q1 (days 1–90) | Q2 (91–180) | Q3 (181–270) | Q4 (271–360) | Tasks |
|---|---|---|---|---|---|
| Joseph Frasier (PM) | 6 | 5 | 4 | 4 | 1a, 2, 3a, 5a |
| Scott Carpenter (Architect) | 6 | 5 | 1 | 1 | 1a, 3a |
| Randy Chong (Sr Java) | 8 | 7 | 5 | 5 | 1a, 2, 5a |
| Zachary Antosko (Sr Forms Dev + Sr Oracle DBA) | 12 | 11 | 6 | 4 | 1a, 2, 5a |
| Andrew Frasier (associate) | 4 | 4 | — | — | 2 |
| Seth Chesky (associate) | 6 | 8 | 10 | 8 | 5a |
| **Team total** | **42** | **40** | **26** | **22** | |

Task 5a's weekly volume is held under the 20-hour planning figure the PWS suggests and is tuned in each biweekly meeting to HEC's review capacity (PWS Rate of Work; Q&A 47). Option tasks add hours without adding people: Task 3b reuses the architect once 3a is stable; Task 4 uses the architect and the Java developer with the associate engineers running sweeps; Task 5b continues the 5a pattern.

**Why this staffing does not degrade under concurrency.** Three properties, each structural rather than aspirational: (1) the two build streams — UI/CDA (Task 2) and CWBI (Task 3a) — have different owners and different repositories, so they contend only for HEC's review time, which we manage by submitting small units; (2) maintenance has a dedicated owner whose time is not borrowed from the build streams, and a senior engineer behind him for major fixes; (3) the Project Manager's hours are a floor, not an average — the meeting cadence, note delivery, and Task 5 approvals are fixed obligations and are scheduled first.

**Capacity disclosure.** Frasier Digital has proposals under evaluation with other agencies whose periods of performance could overlap this one. We size and price every bid against total committed capacity: the hours above are net of every potential concurrent award, the named delivery pod exists to absorb surge, and the Project Manager's commitment to this contract is protected as a floor. [FLAG: Joseph — confirm wording against current award status at render; DoWEA is cancelled, SSS RS and NOAA remain under evaluation, VAERS submits the same week.] We state this proactively because fixed-price, deliverable-based work only functions when capacity claims are honest.

### A.3 Responsiveness, customer service, and timeliness

The PWS sets clocks, and we have built our operating rhythm on them rather than on our own:

| Obligation | PWS source | How we meet it |
|---|---|---|
| Meeting notes within 1 business day | Task 1a | Notes drafted during the meeting from a fixed template; posted same day |
| Start a maintenance task within 5 days; first work unit within 2 days of starting | Task 5a | Issue triage twice weekly; classification (≤1 h) is the first work unit |
| Respond to HEC review comments within 5 days | Task 5a | Reviewer comments are the top of the queue; unaddressed comments block new submissions |
| Status after 1 h classification / 2 h bug work / 4 h modification; draft PR at 4 h | TE4 | Time-boxed by the engineer; the PR template carries the elapsed-hours field |
| STIG state and scan-result responses "promptly" | TE2; Q&A 10 | Security folder in the repository is current before each Dev deployment; CWBI requests answered within 2 business days |
| Notice to proceed before work over 2 h | Task 5a | We ask in the issue; we do not start without the label |

Customer service on a contract like this means not consuming the customer's time. HEC has six hours a week for review; our internal review happens before HEC's, every PR is small enough to review in one sitting, and every submission states what it does, what it touches, and how it was tested in the first three lines of the description.

### A.4 Reducing performance risk

**Table A-4. Risk register.**

| Risk | Likelihood / impact | Mitigation | Owner |
|---|---|---|---|
| PR #1461 rework is larger than a rebase (161 commits behind; failing CI) | Med / Med | Rebase in the first two weeks on public repos before CWBI access; scope the rework in the first meeting; feature flag keeps `develop` releasable throughout | Randy |
| CWBI access takes the full month (Q&A 11) | High / Low | Month-one work is all local (Factor 2, Tab C); Platform1 ticket templates prepared before award | Scott |
| Source-of-truth decisions (embargo, offices, constraints) stall in discussion | Med / High | Written comparison with a recommendation at meeting one; ADR with a comment window; the UI increment order puts the dependent work (P1) second, not first | Joseph |
| Concurrent changes by HEC or other vendors conflict with ours (Q&A 46) | Med / Low | Daily rebase on `develop`; "first merged wins"; design conflicts escalated same day | Randy |
| HEC review bandwidth limits acceptance rate (Q&A 47) | Med / Med | Small PRs; weekly volume set in the meeting; HEC adding reviewers | Joseph |
| Oracle RDS behaves differently from the local `oracle-free` image | Low / Med | Every schema PR validated against the integration-test Oracle images and, before Test promotion, in CloudStack or CWBI-Dev; RDS-specific behaviour raised to HEC in the biweekly meeting | Zach |
| Moonlighting team members' availability shifts | Low / Med | Letters of commitment; hours sized to what each person can sustain; the delivery pod absorbs surge; PM approval required for any substitution, with CO/COR notification | Joseph |
| Fixed-IP egress for bastion access not ready at award (Q&A 13) | Low / Low | Provisioned before award [FLAG: Joseph] | Joseph |

**Quality.** Definition of done is an accepted work unit. Every code change carries tests in the PWS's preferred locations; OWASP ZAP runs in CI; STIG self-checks precede every Dev deployment; documentation is a work unit, not an afterthought — and the PWS's own list of what counts as documentation (a manual test case anyone can perform, Javadocs, an automated test, formal project documentation) is the checklist in our PR template.

**SAM registration and representations.** Frasier Digital, LLC is registered and active in SAM.gov (UEI PY8MJ4JPHJ45, CAGE 213L8; registration expires 27 May 2027), and its Representations and Certifications in SAM are current (RFO 4.203-1). No subcontractors or teaming partners are proposed; all personnel named in this proposal perform as members of the Frasier Digital team. [FLAG: Joseph — confirm the "no subcontractors" characterization of the 1099 team is the wording you want.]
