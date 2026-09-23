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

## Subcontract pursuits (`docs/subcontracting/`)

| Prime | Their award | Contact | Sent | Reply | Status |
|---|---|---|---|---|---|
| Swingtech Consulting | DOL Enterprise AI 1605TA26F00036 $9.7M | CEO jbhargava@ (published) | 9/23 | | sent — follow up 9/30 |
| Ekasys | ATF BATS 15A00026FAQA00227 $2.6M | info@ "Teaming inquiry" + EVP svyas@ (published) | 9/23 | | sent — follow up 9/30 |
| Easy Dynamics | USDA NIFA GMRS 1232SA26F0338 $8.1M | VP BD Harrison Smith (inferred) + info@ | 9/23 | | sent 9/23 — follow up 9/30 |
| Bridgecross | NOAA MCD GIS 1305M226F0424 $4.2M | CEO mdcoll@ (published) | | | sent 9/23 — follow up 9/30 |
| Southpoint Consulting | DOJ EOIR LSU 15JPSS26F00001715 $2.3M | CEO (inferred) + info@ | | | sent 9/23 — follow up 9/30 |
| Nüvitek | DOL UIRS Ph3 1605TA26F00028 $8.8M | Dir Growth Antoine Remy (inferred) + getintouch@ | | | sent 9/23 — follow up 9/30 |
| AttainX | NOAA IFA 1305M326F0158 $9.5M | EVP MJ@attainx.com (published) | | | sent 9/23 — follow up 9/30 |
| DSFederal | NOAA NWPS BPA 1305M326A0007 | BD Mgr Chen Zhou (inferred) + form | | | sent 9/23 — follow up 9/30 |
| Integrated Monitoring | NWFSC ML EM 1305M326P0406 $627k | VP BD josh@ (published) | | | sent 9/23 — follow up 9/30 |
| Koniag Tech Solutions | APHIS via STRATUS | GM sskakavac@ (published) via Partner Program | | | sent 9/23 — follow up 9/30 |

## Texas / cooperative (not on SAM — see `docs/texas/COOP-WATCH.md`)

| Vehicle | Next date | Action | Owner |
|---|---|---|---|
| Choice Partners Technology RFP | ~Oct 1, 2026 post | register on bidder portal, respond | Joseph → Claude |
| TIPS monthly posting | Oct 1 / Nov 5 | register at tips.ionwave.net; check for Staffing/Consulting | Joseph → Claude |
| CMBL | this week | $70 registration via eSystems | Joseph |
| OMNIA / Region 4 ESC 26-14 AI & Cloud | closed 9/8 | ask Region 4 about re-open / piggyback | Joseph |
