# Bid board

Stages: GO → staffed → priced → drafted → built → sent → acked → decided → debriefed.
Update the row when a stage changes. Review at the start of every session with `npm run watch`.
A row that has not moved in 5 days is a lapse in progress.

## Live

| Pursuit | Sol # | Value | Due / decided | Stage | Next action | Owner |
|---|---|---|---|---|---|---|
| SSA Enterprise AI Strategy RFI | 28321326RI0000041 | RFI | 2026-09-28 17:00 ET | built | Joseph review → send ~9/24 (`out/EMAIL-DRAFT.md`) | Joseph |
| SSS Readiness Simulation | 90MC26Q0005 | $545k | award TBD | acked | FPDS award watch; status ping to Toussaint if nothing by ~10/3; demo invite possible | Joseph |
| USACE CWMS Authorization | PANHEC-26-P-0000-026407 | $360k TEP | award TBD | sent | FPDS award watch; auto-archived 9/18 (benign) | Joseph |
| CDC VAERS Modernization | 75D301-26-Q-00146 | $495k | award TBD | sent | FPDS award watch; keep prototype live; auto-archived 9/23 (benign) | Joseph |

## Debriefs owed

| Pursuit | Sol # | Result | Debrief | Next action |
|---|---|---|---|---|
| SSS Website Modernization | 90MC26R0004 | excluded from competitive range 7/29; Mobomo $1.23M signed 8/5 | requested 7/29, deferred per 15.505(d) | claimable since award — follow up with Hendricksen, cite award |
| NOAA COMPASS C++ | 1305M326Q0368 | lost 9/17 — Valinor Labs $90,510 total (23 offers); we bid $162k | not requested | ask CO for brief explanation (FAR 13.106-3(d)); log price lesson |

## Closed 2026 (lessons in memory `opportunity-verdicts`)

| Pursuit | Outcome | Lesson |
|---|---|---|
| VAMC COPEweb | missed deadline 7/28 | drafted ≠ built — `out/` rule in CLAUDE.md |
| DoWEA Data/AI RFP | cancelled 8/21 | watch monitor born here |
| SSS Moodle LMS | never seen; awarded 9/21 Moodle US $357k, 15 offers | NAICS 513210 blind spot → keyword leg + office watch |
| TTUHSC AI Adoption | no-bid 9/17 | — |
| DOS Cultural Property AI | lapsed 9/21 unbuilt | must-name SME never sourced → staffing alarm; lane = no-bid |
| NSF SBIR pitch | declined 9/11 | resubmit only with one named technical bet |

## RFIs submitted (office watch on; follow-on RFQs are fresh notice ids)

| RFI | Office | Submitted | Watch |
|---|---|---|---|
| ONC Argos | HHS/ONC | 7/30 | add `organizationId` |
| NCES DataLab | ED/NCES | 7/29 | add `organizationId` |
| USMC manpower modeling | USMC | 7/30 | add `organizationId` |
| SSS Moodle LMS | SSS | 7/10 | org 500000234 (on watchlist) |
