# Amendment 0001 (8/31/2026) — impacts on our built package

Source: `solicitation/amend1/` (SF30 + 274 Q&A; amended RFQ 72 pp). New SAM revision
`159c9a54e4944e8fb0efce70da47edb6`. **Deadline: Tue Sep 8, 2026, 10:00 AM ET** (was Fri 9/4).
**New send target: Friday, Sep 4** (Mon 9/7 is Labor Day; Fri = 2 business days early).
CO signaled further amendment of Section F (Q&A 158/159) — keep the watch hot for Amendment 2.

## Changes that require package edits

| # | Change (source) | Impact | Status |
|---|---|---|---|
| 1 | Deadline 9/4 → 9/8 10am ET (SF30) | EMAIL-DRAFT, BID-PLAN dates | ⏳ edit |
| 2 | Section B now **Nonseverable Services**; 52.217-8 removed; no option pricing (Q13/14/46) | Vol II price PDF CLIN description; no other price change — CLIN 0001 $495k + 0002/0003 at $31,500 NTE exactly (Q67 confirms all offerors carry same NTE) | ✅ build-vaers.js edited |
| 3 | Custom code governed by **FAR 52.227-17**, not open-source release (Q91) | ODC line in price PDF said "open source per M-16-21" | ✅ edited |
| 4 | **HHS Section 508 Accessibility Conformance Checklist required at proposal, PASS/FAIL** (Q187, Q256); ACR/VPAT is post-award (draft at Beta, final at Final; Q23) | Our ACR alone doesn't match the named gate. Produce the HHS 508 checklist for the proposed approach; keep the prototype ACR as supporting evidence | ❗ NEW ARTIFACT — draft |
| 5 | **Incident Response Plan** "as part of Proposal" — Gov says not evaluated, Standard-4 territory (Q160), attachments OK (Q3) | Include a short IRP attachment; zero risk, closes the "unacceptable-omission" reading | ⏳ draft (2 pp) |
| 6 | Amended Section F adds **Tab 5 (excluded): DMP + AI Plan**; resumes explicitly excluded; **min 10-pt narrative font** (was 12); turnover table now required by F (was only G) | We already comply (separate DMP/AI-plan PDFs, 12-pt body, turnover table in Tab 3-1). Email lists DMP+AI plan as "Tab 5 attachments" | ✅ no change needed |
| 7 | Amendment must be **acknowledged** (SF30 block 11) | Sign SF30 block 15 (electronic OK per Q37) + acknowledgment sentence in email and price volume; SF-18 signed goes **with Price Proposal** (Q73), schedule may say "See Price Breakdown Worksheet" | ⏳ stamp SF30 → to-sign/ |
| 8 | Reps/certs + CDCL.09 CPARS block → submit **with Price Proposal** (Q69, Q203) | Confirm they're in Vol II price PDF (CPARS block was planned) | ⏳ verify at render |
| 9 | 12 MB per email; Gov will acknowledge **each** proposal email (Q201) | EMAIL-DRAFT note | ⏳ edit |

## Answers that validate our design (cite in final read-through)

- **Q1/Q30/Q105:** rules-based validation + AI for contextual guidance; EDAV or other FedRAMP provider OK; approved models may include OpenAI, **Claude**, Gemini, Copilot. Exactly our Tab 2-2 architecture.
- **Q28/41/267/214:** prototype on contractor-controlled infrastructure explicitly OK, synthetic data, public commercial domain reachable from CDC network; **stack must be what's available at CDC / FedRAMP scope** (React/Node are — say so in one sentence in Tab 2-2); link live through evaluation, **60 days** minimum.
- **Q78:** the prototype is a **scored element** — our whole strategy.
- **Q79/97/264:** prototype based on the public VAERS writable PDF + Data Use Guide — what we built from.
- **Q7/8/18/26/35/61/85:** commercial experience counts; new small businesses welcome; key-personnel experience can carry Similar Experience; comparable federal regulated-data systems qualify. Strengthens Region 4 + team framing.
- **Q2/236:** **no incumbent**; GDIT + EEC-Lukos hold adjacent VAERS contracts (coordination only).
- **Q13/54/136:** DOA+150 governs final release; months 6–9 = stabilization/support/transition — matches our phasing.
- **Q44:** contractor instruments the abandonment baseline — already in Tab 2-1 (DOA+21 baseline capture).
- **Q42/82/126/238:** env access may lag two weeks+; milestones adjust for Gov delays — matches our ramp plan; add the Q42 citation to the schedule assumptions.
- **Q55/248:** Alpha may use staged/simulated integration — matches prototype-first build.
- **Q53/251/58:** no separate FedRAMP/3PAO; app inherits CDC controls; we update the doc package. Matches Tab 2-1 security section.
- **Q64/143:** Public Trust **Tier 2** (as planned).
- **Q89:** payment by deliverable acceptance **or monthly increments** — monthly in arrears stays legal.
- **Q33/113/228:** key personnel at offeror's discretion; one person may fill multiple roles.
- **Q162:** factors: Technical (Approach > Mgmt > Similar Exp) > Price > Past Perf; non-price combined ≫ price.
- **Q240–245:** AI-assisted development tooling broadly approvable under the AI plan; **pre-award prototype AI tooling needs no approval** (Q245).
- **Q165:** low-code interface must cover **fields and branching logic**, not just static content — confirm Tab 2-1's admin-interface scope claims this (our low-code peek shows tooltip editing; the narrative should promise form/branching configurability).
- **Q270:** **English and Spanish** parity expected — verify Tab 2-1 mentions bilingual delivery; prototype's plain-language toggle ≠ Spanish.
- **Q116:** volume/concurrency baselines "to be answered as soon as possible" — possible Amendment 2 content.

## Risk notes

- **Q270 Spanish** and **Q165 low-code breadth** are the two spots our narrative could under-claim vs. the answers — fix in final pass.
- CO twice wrote "the solicitation will be amended" — do not render final until the watch is clean on send morning.
