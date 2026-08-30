## TAB C — Transition Plan

*(Instr. 2.1.2 TAB C; evaluated per instr. 3.2.1.2.3: the process, details, and schedule for an orderly transition for HEC to continue any uncompleted work.)*

### C.1 Principle: nothing of value ever lives only with us

The simplest transition plan is the one that never has to be executed as an event. From the first day of performance, every artifact this contract produces lives in HEC's own repositories, issue trackers, and Confluence: code in USACE's GitHub Enterprise (TE2 Code), decisions as ADRs in `docs/source/decisions`, work status as GitHub issues with the PWS log fields, meeting notes in Confluence, security posture in the repository's security folder, and the load-test harness beside the code it tests. There is no Frasier-Digital-side wiki, backlog, or environment that HEC would need to recover. Transition-out is therefore a matter of closing the loop on work in flight, not of handing over a body of knowledge.

### C.2 Transition-in (award to day 30)

Two tracks run in parallel so that access paperwork never idles the engineering work (Q&A 11, 13, 18, 19).

**Table C-1. Transition-in schedule.**

| When | Access track (Government-dependent) | Engineering track (independent of access) |
|---|---|---|
| Award week | DD 7798 and DD 2875 submitted for all named staff; Public Trust initiated; Platform1 access request filed; Frasier Digital's fixed egress IP delivered to CWBI for bastion access; read access to the dev CDK requested | Local stacks running on every engineer's machine from the public repositories and docker-compose (Q&A 18); PR #1461 rebase started; `auth-contract` issue triage drafted |
| Kickoff meeting (week 1–2) | GitHub Enterprise repository access granted (1–2 days after kickoff) | Kickoff is acceptance to start the technical approach (Q&A 48); first ADR drafts (embargo home, office data source, cache topology) presented; first meeting notes posted within 1 business day |
| Weeks 2–4 | Platform1 access (≈1 week+); bastion access when CWBI completes onboarding (≤1 month) | PR #1461 rebase submitted in review-ladder-sized pieces; UI increment U1 in progress; minimal PMP with the standard-app diagram delivered (Q&A 48, 50); first Platform1 ticket drafted and reviewed with HEC before submission |
| Day 30 | All paperwork complete; CWBI-Dev reachable | First accepted work units; Task 5a ready to accept issues; Task 3a change request submitted through Platform1 |

Onboarding does not gate delivery: the Government confirmed that a contractor "should be able to get started on additional work and planning within existing tools" before console or bastion access lands (Q&A 19), and the first month's engineering is scoped to exactly that.

### C.3 Continuity during performance

Three standing practices make any point in the contract a clean handoff point:

- **Every open item is an issue with a status.** Work in progress is a GitHub issue that says what is done, what remains, which branch holds it, and what the next step is. The PWS log fields (requestor, date, notes, status, fix description with tests, hours) are filled as work proceeds, not at invoice time.
- **Every design-bearing choice is an ADR.** Someone who did not attend the meeting can read why the embargo table exists, why the sidecars are in the CDA task, and why the cache has one TTL policy, and can reverse the decision with full context.
- **Every increment is behind a flag until HEC turns it on.** `develop` is releasable at every commit; there is never a half-integrated state that only the contractor knows how to finish.

### C.4 Transition-out (final 30 days and close-out)

**Table C-2. Transition-out schedule.**

| When | Activity | Output |
|---|---|---|
| T−30 days | Inventory of uncompleted work: every open issue and branch reviewed with HEC in the biweekly meeting; each marked *finish*, *hand off*, or *close* | Handoff list in Confluence with owner and state for each item |
| T−30 to T−14 | *Finish* items completed as work units; *hand off* items brought to a documented stopping point: passing tests, a draft PR with a written "to complete this" section, and an ADR if design-bearing | PRs in review or merged; issues updated |
| T−14 | Documentation audit: administrator guide and training materials (Task 2), load-test README and baseline report (Task 4), security folder and STIG checklist (Task 3), PMP diagram current | Documentation work units accepted |
| T−14 to T−7 | Two handoff sessions inside the biweekly-meeting cadence — one for the authorization system (proxy, OPA, cache, CDA integration, UI), one for the harness and maintenance backlog — recorded as meeting notes with the questions asked and answered | Notes in Confluence; follow-up issues filed |
| T−7 | Maintenance log reconciled: every invoice-referenced issue resolved or annotated with its state; final Task 5 invoice log delivered | Complete log per PWS Task 5a |
| T−0 | Credentials and access returned per CWBI process; final meeting notes; Frasier Digital retains nothing the Government needs | Close-out confirmed in writing to the COR |

**Option tasks.** If Task 3b, 4, or 5b is exercised, the same practices continue and the transition-out schedule shifts to the end of the last exercised task's period of performance (Q&A 32). If an option is not exercised, the base-period close-out above already leaves the Dev deployment, the harness, and the maintenance backlog in a state HEC can carry forward with its own staff or a successor.

**Unforeseen early termination.** Because the practices in C.3 hold throughout, a transition at any point follows Table C-2 compressed to the notice period; nothing in it depends on a minimum lead time beyond the handoff sessions, which can be held within a week.
