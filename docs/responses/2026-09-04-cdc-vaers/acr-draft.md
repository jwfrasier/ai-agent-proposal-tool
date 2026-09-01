# Accessibility Conformance Report (ACR) — Draft

*(Companion gate document per HHSAR 352.239-78 / RFQ Section 508 requirements; submitted
with the quote, outside the 15pp cap. Based on VPAT® 2.5 WCAG edition structure. Honest
scope: this pre-award ACR reports evaluated conformance of the working prototype of the
proposed application plus the engineering commitments that carry conformance to
production; updated ACRs deliver with Beta and Final per PRS#14.)*

---

## Report information

| | |
|---|---|
| Name of product | Modernized VAERS Reporting Application (proposed) — evaluated build: working prototype at https://vaers-demo.frasierdigital.com |
| Report date | [render date] |
| Product description | Mobile-friendly, desktop-compatible web application for public and healthcare-provider VAERS report submission: branching submission form, plain-language public path, intelligent completion assistance, satisfaction surveys, low-code administrative interface, medical-record upload (Phase 1) |
| Vendor | Frasier Digital, LLC · joseph@frasierdigital.com · (850) 356-2382 |
| Evaluation methods used | Automated WCAG 2.1 A/AA testing (axe-core) across 12 application states — 0 violations; manual keyboard-only operation of all flows; focus-management review (modals focus-trapped, skip navigation); screen-reader spot checks; reduced-motion preference honored; color-contrast verification of all tokens including state variants; 44px minimum touch targets |
| Applicable standards | WCAG 2.1 Level A and AA; Revised Section 508 (36 CFR Part 1194); HHS ICT accessibility requirements |

## Summary of conformance

| Standard / level | Conformance level | Remarks |
|---|---|---|
| WCAG 2.1 Level A | Supports | All Level A success criteria pass automated + manual evaluation across every prototype state (landing, both form paths, branching states, assistance panel, narrative prefill, surveys, admin, evaluator guide) |
| WCAG 2.1 Level AA | Supports | 0 violations in automated audits; contrast, reflow, text spacing, orientation, and focus-visible verified manually |
| Section 508 functional performance criteria | Supports | Full keyboard operability without vision or fine-motor precision; no audio-only or timing-dependent content; assistance features optional with complete non-AI path |
| Section 508 support documentation (602) | Supports | User documentation delivered in accessible formats (Task 1.12/3.8); ACR maintained through delivery |

## Success criteria detail (condensed for quote; full criterion-by-criterion table in rendered ACR)

| Criteria group | Status | Evidence / remarks |
|---|---|---|
| Text alternatives; info & relationships; semantic structure (1.1.1, 1.3.x) | Supports | Semantic HTML + ARIA landmarks; form fields programmatically labeled; branching changes announced via live regions ("N questions removed") |
| Distinguishable content: contrast, resize, reflow, non-text contrast (1.4.x) | Supports | Token system verified ≥4.5:1 text / ≥3:1 UI components incl. success/error states; 400% zoom reflow without loss; no horizontal scroll |
| Keyboard accessible; no traps; visible focus (2.1.x, 2.4.7) | Supports | Every flow completable keyboard-only; modals (surveys) focus-trapped with escape; visible focus states on all interactive elements |
| Enough time; seizures; motion (2.2.x, 2.3.x) | Supports | No time limits on completion (save/resume provided); no flashing; all animation gated on prefers-reduced-motion |
| Navigable: titles, order, headings, skip, multiple ways (2.4.x) | Supports | Logical focus order across branching steps; descriptive headings; consistent navigation |
| Input assistance: labels, error identification/suggestion/prevention (3.3.x) | Supports | Inline validation with text error identification and correction suggestions; review step before submission (error prevention for legal/data commitments) |
| Readable & predictable (3.1.x, 3.2.x) | Supports | Plain-language public path (1.6.1); language of page set; no context changes on focus/input |
| Compatible: parsing, name/role/value, status messages (4.1.x) | Supports | Valid markup; custom components expose name/role/value; status messages via role=status (completion meter, applied-answers receipt) |
| AI-assistance features specifically | Supports | Assistant panel fully keyboard/screen-reader operable; AI-suggested values visibly and programmatically tagged until user-verified; complete non-AI path always available |

## Notes and commitments

1. Conformance carries to production via CI enforcement: automated accessibility gates
   block merge on any violation; manual assistive-technology testing each release.
2. All contract deliverables (documents, guides, reports) will conform to HHS ICT
   accessibility standards.
3. ACR/VPAT updated and delivered with Beta and again at Final Release, with a
   remediation plan for any nonconformity then identified (PRS#14 thresholds).
4. Legal disclaimer: [FLAG — standard VPAT disclaimer text to include at render.]

*(End ACR draft. Render decision: expand condensed groups into the full VPAT 2.5
criterion table (~7pp) or submit condensed with the full table as an appendix — check
RFQ wording for "checklist" expectations before choosing.)*
