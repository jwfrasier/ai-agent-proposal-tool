# Data Management Plan — DRAFT v1 (CDCL.10 / CDCM.03)

**Frasier Digital, LLC — RFQ 75D301-26-Q-00146, Modernized VAERS Reporting Application**
*(PASS/FAIL companion document — "a proposal received without a DMP will be deemed
Unacceptable." Structure follows the CDCL.10 required elements.)*

## 1. Public health data to be collected or generated during performance
The application collects **VAERS adverse-event report submissions** from public and
healthcare-provider submitters using the data elements of the current VAERS form (as
furnished by CDC at kickoff), plus: uploaded medical-record documents (Phase 1 scope:
medical records and vaccine documents related to the administration or adverse event),
free-text supplemental information, customer-satisfaction survey responses (site
navigation + post-submission), and operational usage metrics supporting the PWS
performance targets (completion rates, abandonment, submission timing). The data may
include PII and PHI. Frasier Digital generates no independent research data; all data is
collected on CDC's behalf, inside CDC's environment, as an instrument of the VAERS
program.

## 2. Standards
Data capture conforms to the **Government-furnished VAERS data element definitions,
business rules, and integration requirements** (PWS Section 9, provided at kickoff);
outputs are **VAERS-compatible structured data** with documented mappings (PWS Task 1.9)
for transmission to existing VAERS systems as directed by CDC. Metadata and export
formats use open, machine-readable standards (JSON/CSV/XML per the furnished integration
specifications). Records management follows NARA-approved CDC schedules (CDCH.14).

## 3. Access and sharing — mechanisms, limitations, protections
All collected data is **CDC-owned and resides exclusively within the CDC-managed
FedRAMP-authorized Azure environment**; Frasier Digital asserts no rights and imposes no
limitations (FAR 52.227-17 unlimited Government rights; HHS/CDC retain unrestricted
rights to all data). Access is need-to-know, role-based, and logged, under the controls
of the SSP and the ATD/ATO. **This DMP proposes no public access mechanism:** VAERS
submission data contains PII/PHI protected by the Privacy Act and HIPAA; public
availability of VAERS data remains governed by CDC's existing de-identified VAERS data
release processes, which are outside this contract's scope — this justification is
provided per the CDCL.10 instruction that protections precluding accessibility be
explained. De-identified, aggregate operational metrics (e.g., satisfaction and
performance reporting) are delivered to CDC and may be released at CDC's discretion.
Custom-developed source code (non-data) is open source per M-16-21 and delivered to the
CDC-recognized repository.

## 4. Archiving and long-term preservation
Data persists in CDC-managed storage under CDC's NARA-approved records schedules; the
application implements retention/disposition configuration as directed by CDC records
authorities rather than contractor-defined schedules. At transition-out or contract
end, all data, documentation, and configurations are delivered per PWS Task 4 with
certification of sanitization of any contractor-side copies per NIST SP 800-88 (no
contractor-side copies are anticipated: development uses synthetic data and Government
data never leaves the CDC environment). Long-term preservation responsibility rests with
CDC as data owner; we deliver the technical documentation (schemas, mappings, metadata)
sufficient for preservation and future use.

## 5. Costs
No separate data-management costs: DMP implementation is inherent in the proposed
firm-fixed price (schema/mapping documentation, retention configuration, transition
deliverables). No archiving infrastructure is purchased — storage is the CDC-furnished
environment.

**Lifecycle maintenance:** the DMP will be updated throughout performance as data
collections evolve (e.g., Phase 2 upload expansion if exercised), per CDCL.10.
