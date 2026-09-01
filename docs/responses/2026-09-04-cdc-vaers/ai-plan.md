# AI Compliance and Risk Management Plan — DRAFT v1 (CDCL.03 / CDCH.10)

**Frasier Digital, LLC — RFQ 75D301-26-Q-00146, Modernized VAERS Reporting Application**
*(PASS/FAIL companion document — structure follows CDCH.10's eleven required elements in
order. Render as its own PDF; not counted against the 15-page technical cap [confirm via
Q&A #3].)*

> **⚠️ SUPERSEDED AS THE SUBMISSION ARTIFACT (2026-08-20).** CDC posted a required
> template on 8/18 ("Attachment 1 — AI Use Compliance and Risk Management Plan"). The
> completed template is **`atch1-ai-use-plan.md`** (two cards: in-app assistant + dev
> tooling) — that is what gets rendered and submitted. This narrative remains the
> CDCH.10 companion/appendix unless Q&A answers say the template alone suffices.

**AI Use Disclosure (CDCL.03):** Frasier Digital affirmatively discloses that AI,
including generative AI, is planned or may be used in performance of this contract in two
distinct ways: (A) an **in-application intelligent completion assistance capability**
(user-facing), subject to Government approval of design and deployed exclusively within
the CDC-managed FedRAMP-authorized Azure environment; and (B) **AI-assisted software
development tooling** (contractor-facing) used by our engineers for code drafting,
test generation, and documentation, with all output reviewed by the responsible senior
engineer before commit.

## 1. Specific tasks or functions where AI will be used
- **(A) In-application (pending Government design approval):** intelligent form-completion
  assistance — contextual guidance, plain-language explanation of VAERS fields, answer
  lookup against CDC-approved FAQ/help content, and navigation assistance (PWS Task 1.6–1.8
  "intelligent validation," "answers user questions"). Deterministic branching logic and
  field validation are rules-based, NOT AI. The AI assist layer NEVER: submits a report,
  alters submitted data, makes eligibility or adjudication determinations, or blocks a
  user from proceeding.
- **(B) Development tooling:** AI-assisted code drafting, characterization/unit test
  generation, documentation drafting, 508 remediation suggestions — all inside our
  standard review gates (author ≠ reviewer; senior review before merge; CI test +
  accessibility gates).

## 2. Logs, audits, and AI-generated data — storage, use, retention, deletion
In-application AI interactions (prompts, responses, associated metadata) are logged
within the CDC Azure environment only, retained per CDC records schedules and the
approved SSP, available to CDC in full, and never transmitted outside Government-
authorized boundaries. No AI training on Government data. Development-tooling logs
contain no Government data (synthetic data and public schemas only during development;
CDC data never leaves the CDC environment).

## 3. Open-source, proprietary, or other
Application code: open source (M-16-21). AI services: CDC's existing FedRAMP-authorized
**Azure OpenAI** offering (Government-licensed, within-boundary) — no new AI services,
licenses, or subscriptions introduced. Development tooling: commercial AI developer
tools used contractor-side only, never processing Government data.

## 4. Model cards / system documentation
Azure OpenAI model documentation (Microsoft-published model cards for the deployed model
version) incorporated by reference and attached to the delivered system documentation;
application-layer documentation (prompt templates, retrieval corpus = CDC-approved help
content only, guardrail configuration) delivered and version-controlled in the CDC
repository.

## 5. Bias identification, monitoring, mitigation (origin/quality/weighting of data)
The assistance layer generates no scores, rankings, or determinations about individuals;
it retrieves from CDC-approved content. Bias controls: retrieval restricted to curated
CDC-approved corpus; plain-language outputs A/B reviewed by CDC program staff before
deployment (low-code content workflow); periodic sampled transcript review with CDC;
satisfaction-survey signal monitored across submitter types; findings fed to corrective
action under the QCP.

## 6. Safeguards (compliance + risk management, unauthorized-access protections)
All AI processing inside CDC FedRAMP boundary under the ATD/ATO controls; role-based
access; encryption in transit/at rest (FIPS 140 validated); prompt-injection and content
guardrails (input sanitization, output filtering, no free-text system-prompt exposure);
rate limiting; kill-switch configuration flag allowing CDC to disable the assist layer
without redeployment; no PII/PHI required to use the assistant, with PII-redaction filter
on prompts as defense-in-depth.

## 7. Internal AI governance policies
Frasier Digital AI-use policy (transparency, accountability, data integrity, accuracy,
sensitive-information protection, foreseeable-risk review): named accountable owner
(PM/Lead Architect), documented review gates for AI-assisted work product, prohibition on
placing Government data in non-Government AI services, incident escalation through the
same 1-hour CDC incident-reporting channel as all other events.

## 8. Preventing unfair/disparate impacts; privacy, civil rights, civil liberties; misuse prevention
The application makes no automated decisions about individuals. Assistance is optional,
equivalent across public and provider paths, fully accessible (508/WCAG within the ACR
scope), and available in plain language; the non-AI path is always complete — no user is
required to interact with AI to submit a report. Misuse controls per §6; unauthorized-use
monitoring via CDC-visible logs.

## 9. Non-discrimination confirmation
Frasier Digital confirms the AI solution will not make or support decisions in violation
of federal civil rights laws, including Title VII, the ADA, and the ADEA. It makes no
decisions about individuals at all.

## 10. Consensus standards
NIST AI Risk Management Framework (AI RMF 1.0) governs risk identification and
treatment; NIST SP 800-53 controls per the SSP; WCAG 2.0 A/AA for the assist UI; OWASP
guidance (including LLM Top 10) in secure-coding practice.

## 11. Government data, outputs, prompts, logs — access, protection, retention, transfer
All Government data, prompts, outputs, and logs remain CDC property inside the CDC
environment, accessible to CDC on demand, retained/deleted per CDC records schedules,
never used for model training, never transferred outside the authorization boundary. No
limitations proposed on Government rights, access, or reuse.

**High-impact determination (OMB M-25-21 Appendix A):** Frasier Digital has assessed the
planned use and determined it is **not a high-impact AI use case**: the AI provides
optional informational assistance for voluntary form completion; it does not control or
materially influence decisions affecting rights, benefits, safety, or access to critical
services; human submitters author and submit all reports and CDC personnel perform all
downstream review. Descriptive information supporting the Government's own assessment is
provided throughout this plan; we will support any required AI impact assessment.

**Change management:** any anticipated change to AI use, functionality, model, or
deployment configuration will be reported immediately to the CO/COR with a revised plan,
and not incorporated before Government approval.
