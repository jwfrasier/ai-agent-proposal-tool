# PRODUCT.md — VAERS Reporting Modernization Prototype

register: product

## What this is

A working demonstration prototype of a modernized VAERS (Vaccine Adverse Event
Reporting System) reporting web application, submitted as Tab 2-2 of Frasier
Digital's proposal for CDC RFQ 75D301-26-Q-00146. The prototype IS the bid's
centerpiece: evaluators open a link and file pretend vaccine-safety reports.

## Users

Two audiences, in priority order:

1. **CDC technical evaluators** (the real audience): federal IT and program
   staff scoring the proposal against a published Performance Requirements
   Summary. They will click the branching paths, open it on a phone, try to
   break validation, and possibly run an accessibility scanner. They have seen
   hundreds of slideware mockups; a real working app is the differentiator.
2. **Simulated end users** (the personas the demo portrays): a worried parent
   with no medical training reporting a child's reaction, and a busy pharmacist
   reporting a vaccine administration error between customers.

## Scene sentence (theme driver)

A parent at the kitchen table at 9pm on a phone, anxious about their kid's
fever after a flu shot; and an evaluator in a fluorescent-lit Atlanta office at
2pm on a government-issue monitor. Both need calm, light, unambiguous. Light
theme, high legibility, zero visual drama.

## Brand and tone

Federal civic-service design language: USWDS-derived, credible as a production
CDC property, but explicitly labeled a Frasier Digital demonstration (never
impersonating CDC — no CDC logos, no "official website" banner). Tone of all
copy: plain, calm, direct, reassuring without being soft. The app never blames
the user, never uses medical jargon on the public path, and always explains why
it asks for something.

## Strategic principles

- **The PRS is the plot.** Every demo-critical moment maps to a scored
  requirement row. Nothing decorative that doesn't serve a scored row.
- **Show, never claim.** Burden reduction is a visible questions-removed note;
  data quality is a live completeness meter; low-code is a live edit.
- **Honest demo.** Simulated pieces (assistant, submissions, downloads) are
  labeled as simulated. Synthetic data only. This discipline is itself a
  selling point (PHI/PII posture).
- **508 is engineering.** WCAG 2.1 AA is a hard floor verified by automated
  audit on every change; keyboard and screen-reader paths are first-class.

## Anti-references

- SaaS marketing gloss (gradient heroes, glassmorphism, drop-shadow cards).
- The unmodernized VAERS/legacy-gov look this bid exists to replace: dense
  fine-print forms, all-caps field labels, PDF-form-on-the-web energy.
- Chatbot-first design that buries the form behind an AI gimmick.
