## TAB B — Key Personnel Resumes and Experience

*(Instr. 2.1.2 TAB B; evaluated per instr. 3.2.1.2.2. Resumes (≤2 pages each) and letters of commitment for all five key personnel follow this tab as an annex and do not count against the page limit (Q&A 20).)*

### B.1 How we read the five roles after the Q&A

The solicitation names five key personnel roles: Project Manager, Senior Oracle DBA, System Engineer/Architect, Senior Forms Developer, and Senior APEX or Java Developer. The Government's answers to questions 7 and 8 settle how two of them apply here: Oracle APEX and Oracle Forms are not used and not planned; the existing components are React, NodeJS/TypeScript, and a Java REST API, "to be expanded, not replaced"; and equivalent experience is acceptable for the Forms Developer and Oracle DBA positions when the person can show "sufficient experience in the direct use of the technologies already in use." We have staffed to that test. The Senior Forms Developer role is filled by a senior React/TypeScript developer whose recent work is exactly the kind of data-management web interface TE1 describes; the Senior Oracle DBA role is filled by a database engineer with Oracle, Oracle Cloud, and AWS experience who owns the schema side of this design; the Java option of the fifth role is taken. Each resume in the annex opens with the technologies in use on this contract and where the person has used them.

### B.2 Role-to-requirement matrix

**Table B-1. Key personnel against the technologies in use (Q&A 7–8) and the PWS knowledge areas (instr. 3.2.1.1.1).**

| Role | Person | Direct use of the technologies in this system | Years | Relevant depth for this contract |
|---|---|---|---|---|
| **Project Manager** | Joseph Frasier | React/TypeScript and Node (WeWork, Ecotone, Region 4); authentication and role-based-access backends (Region 4); REST API design; CI/CD; federal and state delivery (USDA-facing app at Deloitte; Louisiana Dept. of Education) | 11+ | Program manager and hands-on developer on a ground-up platform for thousands of users with role-based access (Region 4, 2024–25); current enterprise AI implementations end-to-end (PwC); single accountable point for a small named team |
| **Senior Oracle DBA** | Efrain Rocha | Oracle (enterprise data warehouses at JPMorgan; Oracle Cloud Infrastructure platform delivery at Gene by Gene); PostgreSQL at 90+ TB; AWS; Java, Python, SQL; Docker and CI/CD | 25+ | Led database and DevOps teams in regulated, data-intensive environments; partitioning, replication, retention, and migration at scale — the profile needed for the schema, VPD interaction, RDS behaviour, and test-image maintenance in this design [FLAG: add Oracle versions / DBA duties from Efrain's reply] |
| **System Engineer / Architect** | Scott Carpenter | AWS services and infrastructure-as-code (Amazon SDE; AWS apprenticeship — automated IaC cutting deployment time 96 %); Java and Python; distributed backend systems; Docker; secure-coding and vulnerability documentation for new endpoints | 5 | Owns the CWBI-side work: sidecar containers, CDK change requests through Platform1, hardened images, health checks, STIG self-assessment. U.S. Army veteran (2014–18) [FLAG: add CDK/ECS specifics from Scott's reply] |
| **Senior Forms Developer** (React/TypeScript web forms) | Zachary Antosko | React/Redux and TypeScript; Node/NestJS REST backends; PostgreSQL/MySQL with TypeORM; AWS (RDS, DynamoDB, Lambda, S3); Docker; RabbitMQ streaming | 5 | Built a database-migration framework with automated ETL and a validation engine across 1.15 M records (ID Plans); led a four-engineer platform redesign to pilot in three months (Honeywell); data-management UIs for property, lease, and CRM systems — the shape of the TE1 administrator interface [FLAG: add form/admin-UI and testing-tool specifics from Zach's reply] |
| **Senior APEX or Java Developer** (Java) | Randy Chong | Java / Spring Boot REST services; AWS ECS, EKS, RDS, CloudWatch in production, including multi-region failover exercises; JUnit; Angular with React exposure; prior QA engineering | 4+ | Software Engineer II on JPMorgan Chase's digital forms platform (100+ forms): sole developer on a production multi-form completion feature; self-service form-onboarding system; production support and deployment of infrastructure and code. AWS Certified Cloud Practitioner. Owns CDA: the PR #1461 rebase, new `auth/` endpoints, integration tests [FLAG: add JUnit/REST-Assured/Oracle specifics from Randy's reply] |

All five are U.S. citizens. Public Trust is the clearance level the Government stated (Q&A 11); no team member has a known impediment.

### B.3 Why this person for this role

**Joseph Frasier, Project Manager.** The management risk on a small-business award is the distance between the customer and the decision. Here it is zero: the PM is the owner, ran the last ground-up platform the company delivered as both PM and developer, and will chair every biweekly meeting personally. His hands-on React/TypeScript and authentication-backend background means he reads every pull request, not just the status.

**Efrain Rocha, Senior Oracle DBA.** The authorization design succeeds or fails at the schema: where embargo lives, how masks are evaluated, and whether CDA-level filtering ever contradicts a VPD policy. That needs someone who has run production Oracle at enterprise scale and has also lived through platform migrations — the PWS says CWMS will move data to storage matched to its use, and our DBA has led exactly that kind of transition.

**Scott Carpenter, System Engineer/Architect.** The CWBI work is infrastructure-as-code inside someone else's pipeline, with hardened images and a security posture to document. Scott's AWS background is operational (deployments, IaC automation, backend services on distributed systems) and his Army service is a straightforward fit with a Corps of Engineers customer's expectations of discipline in a change process.

**Zachary Antosko, Senior Forms Developer.** TE1 is a data-administration interface: users, roles, policies, masks, bulk operations, validation. Zach's last two roles were building and migrating data-management systems with React front ends and TypeScript backends, including the validation engineering that keeps bulk operations safe.

**Randy Chong, Senior Java Developer.** CDA is a Java REST API, and the first job is landing an open pull request that is 161 commits behind on a codebase with a four-schema CI matrix. Randy works in a large-bank Java/AWS production environment where that kind of disciplined rebase-test-deploy loop is daily practice, and his forms-platform work gives him the domain sense for the authorization endpoints the UI will call.

### B.4 Substitution

Key personnel are committed by the letters in the annex. Any substitution during performance requires the Project Manager's approval and written notice to the Contracting Officer and COR with the proposed replacement's resume, and the replacement will meet or exceed the qualifications shown here.

*(Annex follows: five resumes at two pages each; five letters of commitment.)*
