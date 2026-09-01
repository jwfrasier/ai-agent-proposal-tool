# Tab 4 — Similar Experience

*(Draft. Budget: 2pp of the 15pp cap. Eval criterion A3: similar scope/size/complexity +
healthcare-IT domain expertise + documented evidence. [FLAG] items before render.)*

---

## 1. Anchor Engagement — Region 4 Education Service Center (Houston, TX)

**Certification training and completion-tracking platform, built from scratch and
operated at scale. July 2024 – October 2025 · total engagement approximately $2 million
· Frasier Digital principal-delivered (PM + development).**
[FLAG: $2M figure conditional on reference verification per consistency map — fallback
wording "a multi-year, seven-figure engagement" if unconfirmed at render.]

Region 4 ESC engaged Frasier Digital to replace manual certification processes with a
statewide-scale online platform serving school districts across all of Harris County and
every additional entity dependent on Region 4's SCORM-based training system. Frasier
built the entire system with no inherited codebase: full authentication backend, SCORM
Cloud API integration, course loading/ingestion and validation, and end-to-end
completion tracking — delivered and operated for **thousands of concurrent
non-technical users** (school bus drivers, teachers, district staff).

The parallel to this requirement is structural, not cosmetic:

| Region 4 (delivered) | VAERS modernization (required) |
|---|---|
| Public-facing workflows for non-technical users at population scale | Public + provider reporting for the general population |
| Guided flows, validation, and error recovery to protect data quality | Branching form, validation, intelligent assistance (Tasks 1.3–1.6) |
| Completion tracking with structured records feeding institutional reporting | VAERS-compatible structured capture and transmission (Task 1.9) |
| Privacy-sensitive education records context | PHI/PII HIPAA/Privacy Act context (Task 3) |
| Integration with an incumbent ecosystem (SCORM Cloud, district systems) | Integration with existing VAERS systems and contracts |
| Built from scratch to production under a small named team | 9-month design-build-deploy with fixed clocks |

At roughly four times the size of this requirement's anticipated value, Region 4
demonstrates the firm delivering the same shape of work — new-build, public-facing,
data-quality-critical, integration-constrained — at greater scale than CDC is buying
here.

**Reference (customer POC):** Ethan Gula, Software Developer II, Region 4 ESC ·
(832) 585-3947 · ethan.gula@esc4.net
[FLAG: swap/augment with durable contact + backup Region 4 POC before render —
evaluation runs past the POC's Region 4 tenure.]

## 2. Healthcare-IT Domain Expertise (Named Delivery Team)

The RFQ emphasizes healthcare-IT domain expertise. Ours is carried by the named people
who will perform, not a corporate claims sheet:

| Team member (role on this contract) | Healthcare-IT experience |
|---|---|
| **Ryan Daley** (Technical Lead, KEY) | **Optum / UnitedHealthcare**: engineered ADA-compliant member-facing UIs on Azure with enterprise CI/CD. **Shuttle Health** (healthtech): micro-frontend platform architecture, AWS serverless services, 90%+ automated test coverage — production healthcare software discipline |
| **Rahmin Shoukoohi** (Integration & data engineer) | **HolonHealth** (current): senior engineer on a healthcare rewards platform serving 60,000+ clients; designed its ground-up auditable points-ledger — audit-grade data integrity in a healthcare compliance context. State education agency (2024–present): led 3-person team, 20+ secure data-exchange features, 69 districts |
| **Joseph Frasier** (PM / Lead Architect, KEY) | Principal experience architecting and delivering enterprise platforms including current Fortune 100–500 AI implementations (full-stack, end-to-end) and production generative-AI features; regulated-data discipline across education (FERPA-adjacent) and government delivery |

Collectively: member-facing healthcare UI at national-payer scale, healthcare platform
data integrity, and PHI/PII-adjacent engineering habits — resident in the exact people
staffed on this contract (Tab 3-1).

## 3. Documented Evidence

- **Working prototype of this requirement** — https://vaers-demo.frasierdigital.com
  (Tab 2-2): the most direct evidence offered — similar experience made inspectable,
  built on the VAERS 2.0 data elements with 0 WCAG 2.1 AA violations across all tested
  states.
- **Region 4 project summary and reference POC** (§1 above); the reference is available
  for Government feedback per the RFQ's past-performance provisions.
- **Federal delivery artifacts on request**: recent federal proposal deliverables and
  past-performance questionnaire responses completed by the Region 4 customer.
  [FLAG: confirm we want this line — it invites the ask; delete if not.]
- **Engineering evidence embedded in the prototype**: automated accessibility audit
  results, end-to-end test suite, and open-source-ready codebase demonstrating the CI
  discipline described in Tabs 2-1/3-1.

*(End Tab 4 draft. Render check: ≤2pp.)*
