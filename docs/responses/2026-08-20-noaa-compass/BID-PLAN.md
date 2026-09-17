# Bid Plan — NOAA COMPASS C++ Programmer, RFQ 1305M326Q0368

> **✅ SUBMITTED 2026-08-20 ~2:25pm CT** — five attachments incl. signed SF30, both POCs,
> delivery-status on. Watch: receipt confirmation (~3hrs, else phone Grace 206-526-4382);
> Ethan PPQ by Fri 3pm ET.
>
> **STATUS 8/18 — PACKAGE COMPLETE, AWAITING SEND (target Wed 8/19).**
> Amendment 0001 (posted 8/17, in `solicitation/amendment1/`) extended the deadline to
> **Fri Aug 21, 3:00 PM ET** and answered the RFIs. Government LOE estimate: **225–275
> hrs/yr** — this killed the incumbent-history price anchor (CO: prior PO "not relevant...
> requirement redefined"). **PRICE DECIDED (Joseph, 8/18): $52,000 / $54,000 / $56,000**
> (TEP $190k; ≈$190–230/hr effective) — supersedes Scenarios A/B below. Degree RFI answer
> (#17): "depends on field of study + relevant experience" — resume's 3-yrs-CS-coursework
> line + 11 yrs carries it, neutral risk accepted. Remote confirmed, no travel, partial IPP
> invoicing OK. `out/` holds the full package (3 PDFs + PPQ Sections I–II copy +
> EMAIL-DRAFT.md + FORMAT-CHECK.md); Amendment 0001 acknowledged in the price doc and email
> (SF30 method (c)); optional SF30 signature copy staged in `to-sign/`.
> **Open before send:** (1) Ethan go-ahead SENT 8/18 (fixed docx attached) — awaiting his
> confirmation; direct-to-POCs deadline Fri 8/21 3pm ET, chase Thu AM if silent; (2) SAM
> verified Active by Joseph 8/18 ✅; (3) Joseph reads the three PDFs and hits send.

> **❌ LOST — Award Notice posted SAM 2026-09-17 12:43 CT.** Awardee VALINOR LABS, LLC (Woodinville WA, UEI SZPZWBE7EYB1), PO 1305M326P0344, **$28,665**. Notice 81af80cbbf1f4e9e9f2166be24194151. No email received. Option: request brief explanation of basis for award (FAR 13.106-3(d)) from the CO.

**Quote due: ~~Thursday, August 20~~ AMENDED: Friday, August 21, 2026, 3:00 PM ET.** Questions due **Mon Aug 11** in writing
to grace.lapierre@noaa.gov AND charles.kendall@noaa.gov (answers come via amendment).
CO: Charles Kendall (Seattle WAD-SAP, 206-526-4382). Customer: NWFSC Fish Ecology Division.

FFP, 3 lump-sum CLINs: Base 10/1/26–9/30/27, OY1, OY2. Total SB set-aside, NAICS 541511.
Award without discussions intended; prices firm 60 days. Best value: **Technical ≈ Price,
then Past Performance** (confidence ratings; PP neutral floor). PSC B516.

## Competitive picture

- **Incumbent: Valinor Labs, LLC** — PO 1305M324P0517, **$209,600, Sep 2024–Sep 2026
  (~$105k/yr)**, unrestricted award, same PSC/NAICS. This RFQ is their seamless recompete,
  now SB-set-aside. Assume they bid with Highly Confident technical + Favorable PP.
- Win path: match their price band or slightly under, put up a resume that earns
  Confident/Highly Confident, and be flawless on compliance. Est. P(win) 20–30%.

## Our quote (4 required parts, per 52.212-1 addendum)

1. **Technical Capabilities Statement — ≤2 pages.** Must cover ability to meet the SOW +
   experience presenting technical language on: C++ programming; ecological and wildlife
   behavioral modeling; custom software work.
   **⚠️ NO AI MENTION anywhere in this quote (Joseph's direction 8/8 — right read of a
   scientific buyer).** Frame instead as senior-engineer discipline:
   - C++ depth and currency: LDOE (current, comparably complex codebase), EOG. (NO Intuit —
     not on the authoritative resume, per Joseph 8/8.)
   - Method for entering a large unfamiliar codebase: read the build first (Qt 6/C++17/
     Boost, documented Qt setup), map module boundaries, characterization tests before
     changes, small reviewable commits in Git — all anchored to COMPASS's own
     **parity-based acceptance testing** (their words; prove the program still produces
     the correct answer for every test case).
   - Scientific-computing credibility: EOG production monitoring = physical-systems
     modeling with real-world data calibration (nearest ecological analog); comfort
     working WITH scientists who own the models (SOW: "decisions decided by the team,"
     calibration in collaboration with project scientists).
   - Delivery cadence: weekly-monthly written reports, deliverable summaries with
     evidence, documentation updates as part of definition-of-done.
   - Windows installer packaging + cross-platform (Win/Linux/macOS) Qt builds.
2. **Key Personnel resume — ≤2 pages: Joseph Frasier.** Required quals to hit explicitly:
   CS-field degree ✗ (B.S. Business Management, PCC 2013 — NOT CS; Q4 asks whether 10+ yrs
   experience substitutes; NEVER claim a CS degree), 10+ years applied programming ✓,
   C++ proficiency via completed projects (LDOE current + EOG — specifics now in the
   drafted resume; NO Intuit).
3. **Past Performance — max 3 contracts ≤3 years, PPQ (ATCH02) per reference.**
   Region 4 ESC is the one qualifying Frasier contract (custom software, ~$400k, ended
   October 2025 — inside window; similar magnitude to this award's TEP). PPQ Sections I–II
   completed by us → assessor (Region 4 customer POC = Ethan Gula, DECIDED 8/10 — he's off
   all bid teams; SAME contact as DoWEA Vol III + Readiness Sim PPQ) → assessor emails completed PPQ to
   grace.lapierre@noaa.gov + Charles.kendall@noaa.gov BY CLOSING. Copies of Sections I–II
   also go in our quote. If PPQ can't land in time: affirmatively state remaining refs =
   none → Neutral (not negative, but "may be considered less favorably").
4. **Price — 3 lump sums.** TEP = base + OY1 + OY2 + 50% of OY2 (52.217-8).
   - Scenario A (match history): 105,000 / 108,000 / 111,000 → TEP $379.5k
   - Scenario B (slight undercut): 99,500 / 102,500 / 105,500 → TEP $360.25k
   - Cost floor check: ~0.5–0.7 FTE realistic workload; Joseph's opportunity cost is the
     constraint, not cash cost. DECIDE with Joseph. Don't go below ~$95k/yr — signals
     misunderstanding of scope.
   Also required: reps/certs completion + statement of extent of agreement with all terms.

## Questions to submit (by Mon 8/11 — same email can carry both)

1. Place of performance: "The SOW describes collaboration via meetings, email, and phone,
   and Government-furnished access to NOAA systems and repositories. Please confirm remote
   performance is acceptable and no recurring on-site presence at NWFSC is required."
2. LOE calibration (helps price + shows sophistication): "Can the Government share the
   approximate level of effort (hours or FTE) expended under the predecessor effort, or the
   anticipated LOE for the base year?" (They may decline; costless to ask.)

## Risks / flags

- **PwC outside-business-activity policy + IP assignment — Joseph MUST check before award**
  (bid submission is lower-visibility; award is public record). LDOE outside-employment
  disclosure too. Joseph acknowledged 8/8; his call.
- Capacity: overlaps DoWEA TO1 if both win (Joseph = Sr Data Gov 2.5PM there + this at
  ~0.5 FTE). Mitigation: FFP deliverables both places, AI leverage, no meetings conflict
  (NOAA team is Pacific time). Named honestly here so we go in eyes-open.
- Incumbent advantage is real: they wrote the current GUI + adult passage module underway.
  Do not over-promise schedule in the tech statement; promise process + parity discipline.

## Calendar

- Sat–Sun 8/8–8/10: Joseph sends resume + degree details + C++ project specifics; draft
  tech statement + resume; draft questions email (send Mon 8/11 with DoWEA follow-ups).
- Mon 8/11: Questions OUT. Region 4 POC identified (Ethan) — send PPQ Sections I–II.
- Tue–Wed 8/12–8/13: full quote assembled + rendered. (DoWEA freeze 8/12 unaffected —
  this is a 6-page package.)
- Thu 8/14–Fri 8/15: hold for amendment/answers. DoWEA renders + sends 8/15.
- Mon 8/18–Tue 8/19: final price call w/ Joseph, sign, SEND (target Tue 8/19, one day early).
- Thu 8/20 3:00 PM ET: hard deadline. PPQ from Region 4 assessor must ALSO be in by now.
