# Letter-of-commitment + resume requests — CWMS key personnel

**Send today (Wed 8/26). Ask for replies by Sat 8/29; hard stop Mon 8/31.** All four are moonlighters
or between roles — keep the ask small and concrete. Each email carries the same three attachments:

1. `LOC-TEMPLATE.md` rendered as a one-page letter on Frasier letterhead with their name/role filled in
   (they sign — Preview signature or print/scan is fine).
2. The role description block below for their slot (so they know what the Government reads for).
3. The PWS technical-resources list (so they can look at the public repos before answering the
   "direct use" questions).

Why the resume questions matter: the Government's Q&A answer (Q8) accepts non-Oracle-Forms/DBA
people **only "if it can be shown … sufficient experience in the direct use of the technologies
already in use"**. Those technologies are: **React, TypeScript/Node, Java REST APIs (Javalin),
Oracle database, Open Policy Agent/Rego, Keycloak/OIDC (Login.gov), Docker/docker-compose, AWS
(GovCloud) with CDK, JUnit 5 / REST-Assured / testcontainers, GitHub/GitHub Actions.** Resumes must
name these by name with duties and dates. Claude drafts the 2-page proposal resume from each
person's card + their answers; they review it before it ships.

Common footer for all four:

> Practical notes: this is a firm-fixed-price, fully remote contract with USACE's Hydrologic
> Engineering Center (Davis, CA) — no travel, no clearance beyond Public Trust, no CUI. Period of
> performance is 360 days from award; award is expected in September/October. Your commitment is to
> be available for the role at the hours we agree, not to leave your current job. Your time is
> billed to us as 1099 at the rate we've discussed. Proposal is due September 3, so I need the
> signed letter and your answers by **Saturday, August 29** if at all possible.

---

## 1. Efrain Rocha — Senior Oracle DBA (key)

**To:** efrain.rocha@gmail.com · **Subject:** USACE CWMS proposal — letter of commitment + a few
resume questions (by Sat 8/29)

Efrain,

Following up on our conversation — I'm naming you as **Senior Oracle DBA** on our proposal to the
U.S. Army Corps of Engineers for the CWMS Database Authorization contract (the water-management
system that runs on Oracle; they're consolidating 32 district databases into one Oracle RDS instance
in AWS GovCloud behind a Java REST API). The Government just answered our questions and the role is
exactly the database-engineering work you do, not an Oracle Forms job.

Two things I need from you by Saturday:

**1. Sign the attached letter of commitment** (one page) and send it back.

**2. Answer these so I can write your 2-page proposal resume** (short bullets are fine — I'll do the
writing):
- Oracle specifically: versions you've administered (11g/12c/19c/23ai?), and the DBA duties you've
  personally performed — schema management, performance tuning, partitioning, backup/recovery, RDS
  or OCI-managed Oracle, VPD/session-context security, PL/SQL. Years and where.
- AWS RDS experience (any engine) and anything with AWS GovCloud.
- Java exposure (even reading/reviewing) and Docker/docker-compose in daily use.
- Any CI/CD with GitHub Actions; any policy-as-code (OPA) or Keycloak/OIDC exposure.
- Anything at Gene by Gene or JPMC that involved authorization/row-level data access controls.
- Confirm your title/dates at U.S. LawShield and whether there's any outside-work restriction I
  should know about.

Rate: we discussed ~$100/hr 1099 — confirm that works and we'll put it in writing with the letter.

[footer]

Thanks — Joseph

---

## 2. Zachary Antosko — Senior Forms Developer (key; React/TypeScript web forms)

**To:** zachary.antosko@gmail.com · **Subject:** USACE proposal — letter of commitment + resume
questions (by Sat 8/29)

Zach,

I'm naming you as the senior front-end developer on our USACE proposal (the solicitation calls
the slot "Senior Forms Developer"; the Government confirmed in Q&A that the actual work is expanding
an existing **React + TypeScript/Node** admin UI for managing data-access roles and policies — no
Oracle Forms anywhere). Your NestJS/React work at ID Plans and Honeywell is the right shape.

By Saturday:

**1. Sign the attached letter of commitment.**

**2. Resume inputs** — the evaluators will read for these by name:
- React work: which projects, TypeScript or JS, state management (Redux/other), form-heavy UIs
  (validation, bulk edit, admin consoles), component testing tools (Jest/RTL/Cypress/Playwright).
- Node/TypeScript backends: NestJS, REST API design, auth (JWT/OIDC/role checks) you've built.
- Docker/docker-compose in daily use? GitHub Actions or other CI?
- Any Java (even bootcamp-level), any Oracle or SQL work beyond MySQL/Postgres.
- Accessibility (508/WCAG) work, if any.
- Confirm current title/dates at ID Plans, and your availability in hours/week.

Rate: $75/hr 1099 as we've discussed — confirm.

[footer]

Thanks — Joseph

---

## 3. Scott Carpenter — System Engineer / Architect (key)

**To:** carpenter.scott22@gmail.com · **Subject:** USACE proposal — letter of commitment + resume
questions (by Sat 8/29)

Scott,

I'm naming you as **System Engineer/Architect** on our proposal to the Army Corps of Engineers.
The job: get an authorization service (Open Policy Agent + a Redis-class cache + a proxy) running
alongside an existing Java REST API inside the Corps' AWS GovCloud environment, where infrastructure
is defined in **AWS CDK (Python)** and changes go through the platform team's Jira. Your AWS IaC and
deployment-automation background is the fit, and the Army service reads well here.

By Saturday:

**1. Sign the attached letter of commitment.**

**2. Resume inputs:**
- AWS specifics: services you've deployed (ECS/Fargate, EKS, ALB, RDS, IAM), IaC tooling by name
  (CDK? CloudFormation? Terraform?), the 96% deployment-time reduction — what it was and how.
- Containers: Docker, hardened/distroless images, image patching, health checks.
- Java and Python work (production code, not just scripts).
- Security: vulnerability documentation you did at AWS, any STIG/scan-remediation exposure, OWASP.
- CI/CD: GitHub Actions or equivalent.
- Any Keycloak/OIDC, OPA, or reverse-proxy (Traefik/nginx/Envoy) work.
- Confirm dates for Amazon/AWS and current availability (full-time available, or hours/week).

Rate: $60/hr 1099 as discussed — confirm.

[footer]

Thanks — Joseph

---

## 4. Randy Chong — Senior Java Developer (key; "Senior APEX or Java Developer")

**To:** mr.randy.chong@gmail.com · **Subject:** USACE proposal — letter of commitment + resume
questions (by Sat 8/29)

Randy,

Thanks for the resume — I'm naming you as **Senior Java Developer** on our USACE proposal. The
codebase is a public Java REST API (Javalin) — https://github.com/USACE/cwms-data-api — and the
work is finishing an authorization integration (there's an open PR the Government wants landed),
adding tests, and maintenance. Your Spring/AWS/production-support background at JPMC is the fit.

By Saturday:

**1. Sign the attached letter of commitment.** (Fractional/evenings is understood and is how the
role is sized.)

**2. Resume inputs:**
- Java REST API work by name: frameworks (Spring Boot; any Javalin/Jersey/Micronaut), OpenAPI,
  JUnit 5, REST-Assured, testcontainers, Mockito.
- Auth you've implemented: JWT/OIDC, role checks, API keys, anything policy-based.
- Database: Oracle or other SQL from Java (JDBC/JPA), migrations, tuning.
- AWS operations detail: ECS/EKS/RDS/CloudWatch, the multi-region failover exercises.
- React exposure (you noted "some React" alongside Angular) — how much, where.
- Docker/docker-compose daily use; CI/CD tooling.
- Hours/week you can commit in evenings/weekends, and confirm JPMC outside-activity is cleared on
  your side.

Rate: $65/hr 1099 as confirmed — no change.

[footer]

Thanks — Joseph

---

# LOC-TEMPLATE (render one per person on letterhead)

**LETTER OF COMMITMENT**

Solicitation PANHEC-26-P-0000-026407 — CWMS Database Authorization Maintenance and Improvements
U.S. Army Corps of Engineers, Institute for Water Resources, Hydrologic Engineering Center

Date: ____________

I, **[Full Name]**, confirm that I have agreed to serve as **[Role Title]** on the Frasier Digital,
LLC team for the above solicitation, and that I will be available to perform in that role for the
full period of performance (360 calendar days from award, plus any exercised option tasks) at the
level of effort proposed by Frasier Digital, LLC, if Frasier Digital, LLC is awarded the contract.

I have reviewed the Performance Work Statement for this requirement and the duties of the role. I am
a United States citizen, and I understand that performance is at the contractor's facility with no
travel required.

I authorize Frasier Digital, LLC to include my name, resume, and this letter in its proposal.

Signature: ______________________________

Printed name: [Full Name]

Email · Phone: [contact]

Acknowledged for Frasier Digital, LLC:

Joseph Frasier, Founder and Managing Member — Signature: ______________________ Date: ________
