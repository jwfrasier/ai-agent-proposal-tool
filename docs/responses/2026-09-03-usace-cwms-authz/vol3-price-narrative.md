# Volume III — Price (Factor 4)

## Summary

Frasier Digital, LLC proposes a firm-fixed price for each task in the PWS, with subtotals per task and a grand total for the base tasks and all options, as instr. 2.3.1 requires. Fully burdened labor rates, the level of effort per labor category per task, and the resulting subtotals are itemized below and in the accompanying Excel workbook (`Vol-III-Price-FrasierDigital.xlsx`), which the Government asked to be submitted as a separate file covering all eight contract line items (Q&A 5). Hours are identical to Volume I, Factor 1, Table A-2, and to the staffing plan in Factor 2, Tab A. This PDF is the binding price volume; assumptions are stated here (Q&A 24).

## CLIN price schedule

| CLIN | Task | Description | Qty | Unit | Price |
|---|---|---|---|---|---|
| 1001 | Task 1a | Development meetings (26) | 1 | Job | $19,970 |
| 2001 | Task 2 | Improve authorization web UI and CDA integration | 1 | Job | $75,250 |
| 3001 | Task 3a | Implement authorization in CWBI-Dev | 1 | Job | $29,800 |
| 5001 | Task 5a | Maintenance (not to exceed 803 hours) | 1 | Job | $92,500 |
| | | **Base tasks subtotal** | | | **$217,520** |
| 1002 | Task 1b | Development meetings, additional 26 (option) | 1 | Job | $19,970 |
| 3002 | Task 3b | Implement authorization in CWBI-Test (option) | 1 | Job | $17,800 |
| 4001 | Task 4 | Load testing (option) | 1 | Job | $24,300 |
| 5002 | Task 5b | Maintenance, not to exceed 704 hours (option) | 1 | Job | $80,550 |
| | | **Option tasks subtotal** | | | **$142,620** |
| | | **Grand total — base and all options** | | | **$360,140** |

## Labor categories and fully burdened hourly rates (instr. 2.3.1, 3.2.3.2)

| Labor category | Key personnel | Fully burdened rate |
|---|---|---|
| Project Manager | Joseph Frasier | $165.00 |
| Senior Oracle DBA | Zachary Antosko (dual role per Q&A 9) | $145.00 |
| System Engineer / Architect | Scott Carpenter | $145.00 |
| Senior Forms (React/TypeScript) Developer | Zachary Antosko | $145.00 |
| Senior Java Developer | Randy Chong | $145.00 |
| Associate Software Engineer | Andrew Frasier, Seth Chesky | $90.00 |

Rates are fully burdened (direct labor, fringe, overhead, G&A, and profit) and are the same in every task and option — the Government's unbalanced-pricing check (instr. 3.2.3.1) will find per-task prices that follow hours only. The three-tier structure reflects differences in skill and responsibility: the Project Manager carries contractual accountability and review authority; the four senior categories carry design ownership in their area; associate engineers perform implementation and maintenance work units under senior review. The rates are set to retain the named individuals for the full period of performance and any options (instr. 3.2.3.2).

## Level of effort per labor category per task (hours)

| Task | PM | Sr Oracle DBA | Sys Eng / Architect | Sr Forms Dev | Sr Java Dev | Associate | Total hours | Price |
|---|---|---|---|---|---|---|---|---|
| 1a | 78 | 8 | 12 | 12 | 12 | 8 | 130 | $19,970 |
| 2 | 50 | 30 | — | 220 | 150 | 100 | 550 | $75,250 |
| 3a | 40 | — | 120 | — | 40 | — | 200 | $29,800 |
| 5a | 70 | 60 | — | 100 | 150 | 400 | 780 | $92,500 |
| **Base** | **238** | **98** | **132** | **332** | **352** | **508** | **1,660** | **$217,520** |
| 1b (opt) | 78 | 8 | 12 | 12 | 12 | 8 | 130 | $19,970 |
| 3b (opt) | 20 | — | 80 | — | 20 | — | 120 | $17,800 |
| 4 (opt) | 20 | 20 | 60 | — | 40 | 40 | 180 | $24,300 |
| 5b (opt) | 60 | 50 | — | 90 | 130 | 350 | 680 | $80,550 |
| **All options** | **416** | **176** | **284** | **434** | **554** | **906** | **2,770** | **$360,140** |

Blended rate across all tasks: $130.01 per hour.

## Assumptions and conditions

1. **Contract type and payment.** Firm-fixed price per task CLIN. For Tasks 1a/1b, 2, 3a/3b, and 4, invoicing follows delivered and accepted work units against the task price. For Tasks 5a and 5b, consistent with the Government's answer to question 33, deliverables are completed work units invoiced monthly with the log the PWS requires; invoicing is proportional to accepted work units, not in equal monthly amounts, and no payment is requested for work not performed. The hour figures in Tasks 5a and 5b are treated as not-to-exceed planning ceilings; if Government-directed demand is materially above or below them, the parties will address scope by change order as the Government indicated.
2. **Options.** Each option task's period of performance begins when the option is exercised (Q&A 32). Option prices are firm for exercise at any time within the base period of performance and for ten days before contract expiration per RFO 52.217-7.
3. **Place of performance and travel.** The contractor's facility; no travel is required or priced (Q&A 12, 43, 51). Any Security Control Assessment participation is virtual.
4. **Other direct costs.** None. Development uses the public repositories and docker-compose stacks on contractor equipment (Q&A 18); Government-furnished access to CWBI, GitHub Enterprise, Platform1, Confluence, and Jira; HEC's CloudStack environment at no cost for load testing (Q&A 39). All software used is open source. No CUI or CDI is handled (Q&A 14); no NIST SP 800-171 assessment or CMMC certification is required (Q&A 15, 17).
5. **Government review capacity.** Weekly submission volume is planned against HEC's stated review capacity (PWS Rate of Work; Q&A 47); hours above include the contractor's response to review comments within five days.
6. **Price validity.** Prices are firm for 90 calendar days from the proposal due date.
7. **Representations.** Frasier Digital, LLC is a small disadvantaged business, registered and active in SAM.gov (UEI PY8MJ4JPHJ45, CAGE 213L8, TIN 41-3497002), with current Representations and Certifications. No subcontractors are proposed.

## Reasonableness

The base-task price of $217,520 covers the completion and deployment of the authorization system, the TE1 interface, and a year of maintenance, on a foundation the previous effort established at $241,435 (contract W912HQ25P0049, per USAspending). The all-options total of $360,140 adds a second meeting series, the Test-environment promotion, the load-test harness and baseline, and a second maintenance ceiling. Every hour is assigned to a named person whose commitment letter is in Volume I.
