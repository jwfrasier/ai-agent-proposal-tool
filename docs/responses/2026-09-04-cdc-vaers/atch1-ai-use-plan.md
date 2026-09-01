# Attachment 1 — Artificial Intelligence (AI) Use Compliance and Risk Management Plan

**Frasier Digital, LLC — RFQ 75D301-26-Q-00146, Modernized VAERS Reporting Application**

*Completed on the Government-provided template (Attachment 1, posted 2026-08-18). Frasier
Digital discloses two distinct AI uses and completes one card for each: **Card A** — the
in-application intelligent completion assistance capability (a Government-approved
application feature delivered under the PWS), and **Card B** — contractor-side AI-assisted
software development tooling. The CDCH.10 eleven-element narrative plan (`ai-plan.md`)
is retained as a companion appendix.*

---

## CARD A — In-Application Intelligent Completion Assistance

### 1. Background

| | |
|---|---|
| Name of AI tool/system | Intelligent completion assistance layer of the Modernized VAERS Reporting Application (application feature built by Frasier Digital on CDC's enterprise Azure OpenAI service, EDAV) |
| Contractor using the AI | Frasier Digital, LLC |
| Subcontractor or service provider, if any | None. The AI service is CDC's existing FedRAMP-authorized Azure OpenAI offering (EDAV); no third-party AI service is introduced |
| Contract task/function supported | PWS §1.6–1.8: intelligent completion assistance, plain-language field guidance, answering user questions, narrative review for completeness |
| Describe how AI will be used in contract performance | An optional, user-facing assistance layer: contextual guidance and plain-language explanation of VAERS fields; answers to user questions drawn from CDC-approved help content; optional narrative-to-form suggestions in which every AI-proposed answer is individually reviewed and confirmed by the user and visibly tagged until verified. Deterministic branching logic and field validation are rules-based, not AI. The AI layer never submits a report, alters submitted data, makes any determination, or blocks a user from proceeding. Design subject to Government approval at the wireframe/design review |
| Is AI use required to perform the work, or optional? | ☒ Required (the PWS requires intelligent completion assistance; generative AI is our proposed implementation, subject to CO/COR design approval) ☐ Optional ☐ Unknown |
| AI classification | ☒ Generative AI ☒ Natural Language Processing ☐ Agentic AI ☐ Classical/Predictive ML ☐ Computer Vision ☐ Reinforcement Learning |
| Is this use limited to contractor internal operations? | ☐ Yes ☒ No |
| Will the AI touch Government information, systems, identities, networks, or operations? | ☒ Yes (deployed entirely within the CDC-managed Azure environment; processes user-entered report assistance content inside the authorization boundary) ☐ No ☐ Unknown |
| Was the AI system procured to support this particular contract per requirements in the Statement of Work? | No new AI procurement. The application uses CDC's existing enterprise Azure OpenAI (EDAV) service consistent with the SOW; no new AI services, licenses, or subscriptions are introduced |

### 2. Who owns and supports this use?

| | |
|---|---|
| Contractor AI owner | Joseph Frasier, Program Manager / Lead Architect |
| Contractor technical support contact | Ryan Daley, Senior Engineer |
| Contractor privacy/security contact | Joseph Frasier, Security & Compliance Lead |
| CDC/HHS program office using or receiving outputs | CDC VAERS program office per RFQ 75D301-26-Q-00146 (Immunization Safety Office) |
| Expected users | ☒ Public users ☒ Beneficiaries, patients, applicants, regulated entities, or other external parties (healthcare providers) ☒ CDC/HHS staff ☐ Contractor staff only |

### 3. Tool background

| | |
|---|---|
| Tool or product name | Azure OpenAI Service via CDC EDAV; Frasier-built application assistance layer |
| Developer/vendor | Microsoft (service); OpenAI (models); Frasier Digital (application layer, delivered open source per M-16-21) |
| Open-source, proprietary, Government-furnished, or other? | ☒ Government-furnished (EDAV Azure OpenAI service) ☒ Contractor-developed (application layer; open source per M-16-21) ☐ Open-source ☐ Proprietary/commercial ☐ Subcontractor-provided |
| If the system uses an LLM or foundation model, what is the primary model? | A GPT-family model from the CDC EDAV Azure OpenAI catalog; specific model/version selected with the COR at design review, pinned and documented in the delivered system documentation |
| Who provides the LLM/foundation model? | Microsoft Azure OpenAI, within the CDC authorization boundary |
| What model options are available? | Models available in CDC's EDAV Azure OpenAI catalog; configurable without code change |
| Does it require an API key? | ☒ Yes — managed identity/keys held entirely within the CDC environment; no external keys, no calls leaving the boundary |
| Attach or link, if available | ☒ Model card (Microsoft-published, incorporated by reference and attached to delivered system documentation) ☒ Vendor security documentation (Azure FedRAMP package, via CDC) ☒ Audit-log documentation (delivered with SSP artifacts) ☒ Terms of service / privacy policy (per HHS enterprise agreement) ☐ System card ☐ Data card ☐ Evaluation summary |

### 4. Where is it hosted and authorized?

| | |
|---|---|
| Hosting environment | ☒ FedRAMP-authorized cloud ☒ CDC/HHS environment (CDC-managed Azure) ☐ Contractor environment ☐ Commercial SaaS ☐ Local/offline |
| Where is the system hosted? | United States Azure regions under CDC tenancy (EDAV) |
| Is the product directly FedRAMP authorized or available through a FedRAMP-authorized instance? | ☒ Yes ☐ No ☐ Not applicable ☐ Unknown |
| If no, is it undergoing FedRAMP authorization? | Not applicable |

### 5. What data will be used?

| | |
|---|---|
| Will the AI process, store, transmit, summarize, analyze, or generate Government information? | ☒ Yes (within the CDC boundary only) ☐ No ☐ Unknown |
| Types of data involved | ☒ Public information (CDC-approved help/FAQ corpus) ☒ PII ☒ PHI (user-authored narrative content in a vaccine adverse-event context may contain health information; design minimizes — no identifiers are required to use the assistant, with PII-redaction filtering as defense-in-depth) ☐ Government nonpublic ☐ Procurement-sensitive ☐ Proprietary |
| What information will be entered into the AI tool? | User-typed questions; optional user-authored narrative drafts; non-identifying field context needed for guidance. All within the CDC boundary |
| What outputs will the AI generate? | Plain-language guidance and explanations; suggested field values (each individually user-reviewed, confirmed, and tagged until verified); missing-detail prompts for narrative completeness |
| Will prompts, uploads, outputs, logs, or user interactions be stored? | ☒ Yes — logged within the CDC Azure environment only, fully accessible to CDC |
| Retention period | Per CDC records schedules and the approved SSP |
| Will Government data, prompts, outputs, or logs be used to train, fine-tune, improve, or benchmark any model? | ☒ No |
| Will any data, prompts, outputs, or logs be shared with other users, tenants, vendors, subcontractors, or third parties? | ☒ No |
| Explain storage, use, retention, deletion, and sharing | All Government data, prompts, outputs, and logs remain CDC property inside the CDC authorization boundary; accessible to CDC on demand; retained and deleted per CDC records schedules; never used for model training; never transferred outside the boundary. No limitations proposed on Government rights, access, or reuse |

### 6. Is this high-impact?

| | |
|---|---|
| Could the AI output materially affect an individual's or organization's rights, benefits, services, health, safety, access, eligibility, enforcement status, or other significant interests? | ☒ No |
| Could CDC/HHS personnel rely on the AI output as a principal basis for a decision or action? | ☒ No — human submitters author and submit all reports; CDC personnel perform all downstream review of reports, not AI outputs |
| Is the AI used only for internal drafting, summarization, or administrative support with human review before use? | ☐ Yes ☒ No (public-facing assistance; every suggestion is human-reviewed by the submitter before any use, and the non-AI path is always complete) |
| High-impact rationale | Assessed **not high-impact** (OMB M-25-21 App. A): the AI provides optional informational assistance for voluntary form completion; it does not control or materially influence decisions affecting rights, benefits, safety, or access; assistance is equivalent across public and provider paths and fully accessible; no user is required to interact with AI to submit a report. Descriptive information supporting the Government's own assessment is provided throughout; we will support any required AI impact assessment |

### 7. What safeguards are in place?

| | |
|---|---|
| How will contractor personnel verify AI outputs before relying on them? | No AI output enters a report without the submitter's individual review and confirmation; applied suggestions carry a visible "AI-suggested — verify" marking until confirmed or edited. Retrieval-based answers draw only from the CDC-approved content corpus |
| What human review is required before AI-generated content is submitted to CDC/HHS? | The human submitter authors and submits every report. Assistant content configuration (help corpus, prompt templates, guardrails) passes CDC program-staff approval through the low-code content workflow before deployment |
| How will the contractor prevent unauthorized disclosure of Government information? | All processing inside the CDC FedRAMP boundary under ATD/ATO controls; role-based access; FIPS 140-validated encryption in transit and at rest; no external service calls |
| How will the contractor prevent misuse, unauthorized use, or corruption of the AI system? | Input sanitization and prompt-injection guardrails; a classification stage routes safety-critical inputs (medical emergencies, requests for medical advice, causality questions, shared personal information, injection attempts) to fixed approved responses before any generative model is involved; output filtering under a strict cannot-say policy; rate limiting; kill-switch configuration flag letting CDC disable the assist layer without redeployment |
| How will the contractor protect privacy, civil rights, and civil liberties? | Assistance is optional and equivalent across paths; the non-AI path is always complete; 508/WCAG conformance within the ACR scope; no identifiers required to use the assistant; PII-redaction filter on prompts; no scores, rankings, or determinations about any individual |
| What internal policies govern this AI use? | Frasier Digital AI-use policy: transparency, accountability, data integrity, accuracy, sensitive-information protection, foreseeable-risk review; named accountable owner; documented review gates; prohibition on Government data in unapproved AI tools |

### 8. Monitoring and misuse protection

| | |
|---|---|
| What is monitored? | ☒ Accuracy/performance ☒ Performance degradation or drift ☒ Data leakage signals ☒ Abuse/misuse ☒ Prompt injection ☒ Unauthorized access |
| Does CDC/HHS have access to monitoring information, audit logs, or summary reports? | ☒ Yes — logs live in the CDC environment and are fully CDC-accessible; sampled transcript reviews conducted jointly with CDC; satisfaction-survey signal monitored across submitter types |
| How are issues detected, escalated, and corrected? | Automated monitoring and periodic sampled review detect issues; findings enter corrective action under the QCP; escalation through the PM to the COR |
| When will CDC/HHS be informed? | Incidents reported through the same 1-hour CDC incident-reporting channel as all other events; anticipated AI changes reported to CO/COR before incorporation |
| What is the standard operating procedure for incidents or unacceptable outputs? | Immediate containment via the kill-switch flag (assist layer disabled without redeployment; form remains fully usable); incident report within 1 hour; root-cause analysis and corrective action under the QCP; Government approval before re-enable |

### 9. Required contractor affirmation

Frasier Digital, LLC affirms that: AI will not be used unless approved by the Contracting
Officer; the contractor has disclosed all planned or potential AI use; the contractor
will not enter Government information into unapproved AI tools; the contractor will not
use Government data to train, fine-tune, or improve an AI model unless expressly
authorized; the contractor will maintain and update this AI Use Card throughout contract
performance; the contractor will notify the Contracting Officer and COR before changed,
expanded, or new AI use; the contractor will prevent unlawful discriminatory use or
outputs; and the contractor will comply with applicable privacy, security, data rights,
records, civil rights, and AI requirements.

---

## CARD B — Contractor-Side AI-Assisted Software Development Tooling

### 1. Background

| | |
|---|---|
| Name of AI tool/system | Commercial AI development assistants (Anthropic Claude / Claude Code and comparable code-assistance tools) |
| Contractor using the AI | Frasier Digital, LLC |
| Subcontractor or service provider, if any | None |
| Contract task/function supported | Software development under the PWS: code drafting, test generation, documentation drafting, 508 remediation suggestions |
| Describe how AI will be used in contract performance | Contractor engineers use AI assistants during development. All AI-assisted work product passes our standard review gates: author ≠ reviewer, senior-engineer review before merge, CI test and accessibility gates. Development uses synthetic data and public schemas only; CDC data never enters these tools |
| Is AI use required to perform the work, or optional? | ☒ Optional (internal productivity tooling) ☐ Required ☐ Unknown |
| AI classification | ☒ Generative AI ☒ Natural Language Processing ☐ Others |
| Is this use limited to contractor internal operations? | ☒ Yes ☐ No |
| Will the AI touch Government information, systems, identities, networks, or operations? | ☒ No (synthetic data and public schemas only; no Government information, credentials, or system access) ☐ Yes ☐ Unknown |
| Was the AI system procured to support this particular contract per requirements in the Statement of Work? | No — contractor-furnished internal tooling, not a contract deliverable or Government procurement |

### 2. Who owns and supports this use?

| | |
|---|---|
| Contractor AI owner | Joseph Frasier, Program Manager / Lead Architect |
| Contractor technical support contact | Ryan Daley, Senior Engineer |
| Contractor privacy/security contact | Joseph Frasier, Security & Compliance Lead |
| CDC/HHS program office using or receiving outputs | None directly; outputs are contractor work product delivered through normal review-gated deliverables |
| Expected users | ☒ Contractor staff only |

### 3. Tool background

| | |
|---|---|
| Tool or product name | Anthropic Claude / Claude Code (primary); comparable commercial code-assistance tools |
| Developer/vendor | Anthropic (primary); other established commercial vendors as adopted under policy |
| Open-source, proprietary, Government-furnished, or other? | ☒ Proprietary/commercial (contractor-licensed) |
| If the system uses an LLM or foundation model, what is the primary model? | Anthropic Claude model family (current production models) |
| Who provides the LLM/foundation model? | Anthropic |
| What model options are available? | Vendor production model catalog |
| Does it require an API key? | ☒ Yes — contractor-held accounts/keys; no Government credentials involved |
| Attach or link, if available | ☒ Terms of service ☒ Privacy/data retention policy (vendor-published, available on request) |

### 4. Where is it hosted and authorized?

| | |
|---|---|
| Hosting environment | ☒ Commercial SaaS (contractor-side) |
| Where is the system hosted? | Vendor-operated United States cloud infrastructure |
| Is the product directly FedRAMP authorized or available through a FedRAMP-authorized instance? | ☒ Not applicable — no Government information enters these tools |
| If no, is it undergoing FedRAMP authorization? | Not applicable |

### 5. What data will be used?

| | |
|---|---|
| Will the AI process, store, transmit, summarize, analyze, or generate Government information? | ☒ No |
| Types of data involved | ☒ Public information (open-source application code per M-16-21, public schemas, synthetic test data only) |
| What information will be entered into the AI tool? | Application source code (open source by contract policy), synthetic data, public documentation |
| What outputs will the AI generate? | Draft code, tests, and documentation — all reviewed by the responsible senior engineer before commit |
| Will prompts, uploads, outputs, logs, or user interactions be stored? | ☒ Yes — vendor-side per vendor retention policy; contains no Government information |
| Retention period | Per vendor policy; contractor accounts configured for no-training/limited-retention options where offered |
| Will Government data, prompts, outputs, or logs be used to train, fine-tune, improve, or benchmark any model? | ☒ No Government data is present to be used |
| Will any data, prompts, outputs, or logs be shared with other users, tenants, vendors, subcontractors, or third parties? | ☒ No |
| Explain storage, use, retention, deletion, and sharing | The controlling safeguard is data separation: CDC data never leaves the CDC environment and never enters contractor AI tooling. Tool-side storage therefore contains only open-source code and synthetic material |

### 6. Is this high-impact?

| | |
|---|---|
| Could the AI output materially affect an individual's or organization's rights, benefits, services, health, safety, access, eligibility, enforcement status, or other significant interests? | ☒ No |
| Could CDC/HHS personnel rely on the AI output as a principal basis for a decision or action? | ☒ No |
| Is the AI used only for internal drafting, summarization, or administrative support with human review before use? | ☒ Yes |
| High-impact rationale | Not high-impact: internal development assistance with mandatory human review; no Government data, no decisions about individuals |

### 7. What safeguards are in place?

| | |
|---|---|
| How will contractor personnel verify AI outputs before relying on them? | Author ≠ reviewer; senior-engineer review before merge; CI test, lint, and accessibility gates; characterization tests for AI-drafted changes |
| What human review is required before AI-generated content is submitted to CDC/HHS? | All deliverables pass the same review gates regardless of drafting method; the responsible senior engineer owns every commit |
| How will the contractor prevent unauthorized disclosure of Government information? | Hard prohibition on Government data in contractor AI tools (Frasier AI-use policy); development on synthetic data and public schemas only |
| How will the contractor prevent misuse, unauthorized use, or corruption of the AI system? | Contractor-managed accounts, access control, and policy training; periodic policy compliance review |
| How will the contractor protect privacy, civil rights, and civil liberties? | No personal data enters the tools; deliverable-level protections are governed by Card A and the SSP |
| What internal policies govern this AI use? | Frasier Digital AI-use policy (as in Card A §7) |

### 8. Monitoring and misuse protection

| | |
|---|---|
| What is monitored? | ☒ Abuse/misuse (policy compliance) ☒ Data leakage signals (repo scanning for secrets/sensitive content) |
| Does CDC/HHS have access to monitoring information, audit logs, or summary reports? | ☒ Upon request |
| How are issues detected, escalated, and corrected? | Repo scanning and review gates; escalation to the PM; corrective action under the QCP |
| When will CDC/HHS be informed? | Any suspected touch of Government information by an unapproved tool is reported through the 1-hour incident channel |
| What is the standard operating procedure for incidents or unacceptable outputs? | Contain (revoke access/rotate credentials), report within 1 hour, root-cause, corrective action |

### 9. Required contractor affirmation

Card A §9 affirmation applies in full to this use.

---

**Signature:**

Joseph Frasier, Founder & Managing Member, Frasier Digital, LLC
Date: ______________
