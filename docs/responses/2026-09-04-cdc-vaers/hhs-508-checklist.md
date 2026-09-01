# HHS Section 508 Accessibility Conformance Checklist

**RFQ 75D301-26-Q-00146 — Modernized Application for Consumer and Healthcare Provider VAERS Reporting**
**Offeror: Frasier Digital, LLC · UEI PY8MJ4JPHJ45 · CAGE 213L8**
Submitted per HHSAR 352.239-78(b)/(d) and Amendment 0001 Q&A 187, 239, and 256: this checklist
describes the proposed development approach and planned conformance for a custom application that
does not yet exist; the full ACR/VPAT is delivered in draft with the Beta Release and updated at
Final Release (PWS Section 8; Q&A 23). Our prototype's Accessibility Conformance Report is attached
separately as present-tense evidence of the practices claimed here.

## 1. Product and standards

| | |
|---|---|
| ICT item | Custom responsive web application (public + healthcare-provider VAERS reporting), including branching form, document upload, FAQ/help, satisfaction surveys, and the administrative configuration interface |
| Applicable standards | Revised Section 508 Standards (36 CFR Part 1194, incorporating WCAG 2.0 Level A and AA); HHS Section 508 policy |
| Conformance target | WCAG 2.0 A/AA — full conformance for all end-user-facing interfaces and the administrative interface; WCAG 2.1 AA used as the working target in CI (a superset of the requirement) |
| Evaluation methods planned | Automated scanning in CI on every commit (axe-core ruleset); manual keyboard-only walkthroughs of every task flow; manual assistive-technology testing (NVDA + Chrome, VoiceOver + Safari, TalkBack + Chrome on Android) at each release gate — manual AT testing per Q&A 23; color-contrast verification at design time; 508 review as an acceptance criterion on every user-story |

## 2. Conformance approach by criterion group (WCAG 2.0 A/AA)

| Criterion group | Planned conformance | How it is engineered, not inspected-in |
|---|---|---|
| 1.1 Text alternatives | Supports | Alt text required props on image components; decorative images marked presentational; upload previews carry descriptive labels |
| 1.2 Time-based media | Supports | No audio/video planned; any instructional media added will carry captions and transcripts |
| 1.3 Adaptable structure | Supports | Semantic HTML landmarks; form fields programmatically associated with labels and instructions; branching sections announced via `aria-live`; reading order equals DOM order |
| 1.4 Distinguishable | Supports | Token-based palette with ≥4.5:1 text contrast enforced at the design-system level; no color-only meaning; text resizable to 200 % without loss; no images of text |
| 2.1 Keyboard | Supports | Every interactive element reachable and operable by keyboard; no traps; custom widgets follow WAI-ARIA Authoring Practices; tested in CI with keyboard-simulation tests |
| 2.2 Enough time | Supports | Session timeout warnings with extension; autosave of in-progress reports so a timeout never destroys a submission (also a PWS abandonment-reduction measure) |
| 2.3 Seizures | Supports | Nothing flashes more than three times per second |
| 2.4 Navigable | Supports | Skip links; unique page titles per step; visible focus indicator; descriptive headings and link text; breadcrumb/step indicator on the branching form |
| 3.1 Readable | Supports | Language attributes set per page and per passage; **English and Spanish parity** (Amendment 0001 Q&A 270) with `lang` switching |
| 3.2 Predictable | Supports | No context changes on focus/input; consistent navigation and identification; branching reveals fields without moving focus unexpectedly |
| 3.3 Input assistance | Supports | Inline validation with error text tied to fields by `aria-describedby`; error summary with links; plain-language error copy; suggestions on format errors; confirmation step before submission |
| 4.1 Compatible | Supports | Valid, parseable markup; name/role/value for all custom components; status messages via live regions |

## 3. Functional performance criteria (36 CFR 1194, Appendix C, Chapter 3)

Use without vision, with limited vision, without perception of color, without hearing, with limited
hearing, without speech, with limited manipulation, with limited reach and strength, and with
limited language, cognitive, and learning abilities: **Supports (planned)** — carried by the
criterion groups above plus plain-language content (PWS Task 1.6.1), the assisted-completion
features, and mobile-responsive touch targets ≥44 px.

## 4. Support documentation and services (Chapter 6)

Product help, FAQ content, and user guides delivered under this contract will themselves conform to
WCAG 2.0 A/AA and be available in accessible electronic formats; support channels documented in the
application do not require vision or hearing to use.

## 5. Present-tense evidence

The evaluation prototype at **https://vaers-demo.frasierdigital.com** was built under these same
practices and its automated audit results show **0 WCAG 2.1 AA violations across all tested
states**; the attached Accessibility Conformance Report documents the methodology and results.
Accessibility is an acceptance criterion in our definition of done (Volume I, Tabs 2-1 and 3-1),
and the ACR/VPAT deliverable schedule (draft at Beta, final at Final Release, with remediation
plan) is priced into CLIN 0001.

**Certified by:** Joseph Frasier, Founder and Managing Member, Frasier Digital, LLC ·
joseph@frasierdigital.com · (850) 356-2382 · Date: [FLAG: sign date]
