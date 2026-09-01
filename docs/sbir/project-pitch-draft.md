# NSF Project Pitch — draft v1 (2026-09-01)

**Company:** Frasier Digital, LLC · Tomball, TX · UEI PY8MJ4JPHJ45 · SBC Control ID [pending Step 1]
**Working title:** A Verifiable Safety-Gating Architecture for AI Assistance in High-Stakes Public Reporting
**Topic area (pick in form):** Artificial Intelligence — or Digital Health if the reviewer pool looks stronger there.

*(Paste each section into the matching Project Pitch box. Written to ~90% of the stated limits —
verify current limits on the live form. Tone rule: NSF funds research risk, not product features —
every claim below is framed as a question we don't yet know the answer to.)*

---

## 1. The Technology Innovation (~500 words)

Government agencies and regulated institutions increasingly want AI assistance inside their
public-facing reporting systems — vaccine adverse-event reporting, benefits applications, safety
complaints, clinical intake — because these forms fail their users measurably: high abandonment,
incomplete submissions, and call-center load. The same agencies cannot ship a general-purpose
chatbot into those settings, because a single hallucinated answer about a medical, legal, or
benefits question is a headline, a liability, and in federal settings a policy violation. Today's
resolution of that tension is binary: either no AI at all, or an AI wrapped in prompt-level
instructions that no one can verify. Prompting is not a safety property.

Frasier Digital is developing a **verifiable safety-gating architecture** for conversational
assistance in high-stakes form completion. The core idea: a deterministic, testable classification
layer stands in front of any generative model and owns the decision of *whether the model may
speak at all*. Inputs that touch defined hazard classes — emergencies, requests for medical or
legal judgment, causality questions, personal-information disclosure, prompt-injection attempts —
are routed to fixed, agency-approved responses before a generative model is ever invoked. The
generative layer operates only inside the residual space, grounded in the form's own schema and an
agency-approved content corpus, under a cannot-say policy whose coverage is *measured, not
asserted*.

The innovation is not the chatbot; it is making the gate a first-class, verifiable artifact:

- **Hazard classes as executable policy.** Each class is defined as a test suite plus a
  classifier ensemble (deterministic rules + embedding similarity + a small supervised model),
  with agency-auditable coverage metrics per class — the analogue of a safety case, not a prompt.
- **Schema-grounded generation.** The assistant's answerable domain is derived mechanically from
  the same machine-readable schema that drives the branching form (fields, validation rules, help
  content), so the boundary between "the form's business" and "not the form's business" is
  computed, not curated.
- **Quantified refusal quality.** We treat over-refusal as a measured failure mode alongside
  under-refusal, because a gate that blocks everything reproduces the abandonment problem the
  assistant exists to solve.

We have a working proof of concept: a production-grade prototype of a modernized federal
adverse-event reporting application (built for a live federal competition) with the gating
pattern implemented — classification stage, fixed-response hazard handling, schema-driven
branching, bilingual and WCAG-conformant delivery. What does not yet exist anywhere, and what this
project would build, is the general, measurable, agency-certifiable version of that gate: the
hazard-class specification language, the evaluation harness that certifies coverage against
adversarial inputs, and the evidence that gated assistance actually moves completion and accuracy
on real form-filling tasks.

## 2. The Technical Objectives and Challenges (~500 words)

**Objective 1 — Hazard-class specification and gate construction.** Develop a specification
format in which an agency defines its hazard classes (seed examples, boundary statements,
required fixed responses) and a compiler that produces the layered gate: deterministic pattern
tier, embedding-similarity tier, and a distilled classifier tier, with per-tier attribution so
every routing decision is explainable after the fact. *Challenge:* hazard classes are fuzzy at
the boundary (a question about symptom timing is form help; a question about whether the vaccine
caused the symptom is medical judgment). The research question is whether boundary fidelity high
enough for agency certification can be achieved with tractable per-agency effort — our target is
>95% recall on held-out hazard inputs at <5% over-refusal on benign inputs, per class.

**Objective 2 — Adversarial evaluation harness.** Build the red-team harness that certifies a
gate: automated adversarial input generation per hazard class (paraphrase, obfuscation,
multi-turn drift, injection composition, cross-lingual attack), coverage scoring, and regression
tracking so a gate's certificate is reproducible and versioned. *Challenge:* adversarial
generation that is representative of real public users rather than of security researchers;
we will combine LLM-generated attack corpora with de-identified query distributions from our
prototype's synthetic-user studies, and measure the gap.

**Objective 3 — Schema-grounded answer domain.** Derive the assistant's permitted knowledge
mechanically from the form schema (fields, branching rules, validation logic, help corpus) and
quantify grounding fidelity: what fraction of generated responses are traceable to schema or
corpus, and how often the correct behavior is a handoff to a human channel. *Challenge:*
schema-derived grounding must survive multi-turn conversation, where drift re-introduces the
open-domain behavior the gate exists to prevent.

**Objective 4 — Does it work on the human problem?** Controlled task studies on realistic
reporting scenarios (public and professional users, English and Spanish) measuring completion
rate, abandonment, data completeness, time-to-complete, and error rates for three arms: no
assistance, rules-based validation only, and gated assistance. *Challenge and honest risk:* the
gated assistant may not outperform well-designed deterministic validation — a negative result on
Objective 4 would itself be significant for federal AI-adoption policy, and we design the study
to make that answer credible either way.

Phase I success = a gate compiler and harness demonstrated on two distinct hazard-class sets
(vaccine adverse-event reporting; a benefits-style application), certified coverage numbers, and
task-study evidence with effect sizes, packaged so that Phase II can harden the toolchain into an
agency-deployable product with FedRAMP-aligned reference deployments.

## 3. The Market Opportunity (~250 words)

The near market is government digital services. Federal agencies operate thousands of
public-facing collections under explicit modernization mandates (21st Century IDEA;
agency-specific directives), and current federal AI guidance permits assistive AI in exactly this
posture — deterministic where stakes are high, generative where grounded — while providing no
tooling to prove that posture. We have direct evidence of demand: a current CDC solicitation for
modernized adverse-event reporting asks for "intelligent completion assistance" and answers
offeror questions by endorsing rules-based validation plus AI contextual guidance under an
approved risk-management plan — precisely the architecture this project generalizes. Each federal
form modernization is a six-to-seven-figure procurement; the gate and its certification harness
are the reusable, licensable core across them.

Adjacent markets share the same shape: healthcare intake and patient-reported outcomes, insurance
claims intake (FNOL), financial-services complaint and dispute processing, and legal-aid triage —
settings with regulated content, liability-bounded assistance, and measurable abandonment costs.
The business model is a licensed platform (gate compiler, harness, certified policy packs) plus
implementation services delivered by us and by systems integrators, with the certification
artifact — auditable safety evidence — as the differentiator no prompt-engineering competitor
produces. Beachhead: federal and state health agencies where we already compete as a prime.

## 4. The Company and Team (~250 words)

Frasier Digital, LLC is a small disadvantaged business in Tomball, Texas, founded by Joseph
Frasier, who serves as principal investigator. The company builds and operates production
software for public-sector and enterprise customers: a certification and completion-tracking
platform serving thousands of users across Texas school districts (built from scratch and
operated 2024–2025), current AI implementation work for Fortune 100–500 clients (full-stack,
architecture through CI/CD), and statewide education data systems for a state education agency.
The founder's delivery record spans eleven years across enterprise platforms (EOG Resources,
WeWork, Deloitte, Mailchimp generative-AI features) with hands-on experience shipping
production guardrailed AI features.

The proof-of-concept for this project exists and is public-facing: a working modernized federal
adverse-event reporting prototype — branching schema-driven forms, bilingual, WCAG-conformant,
with the safety-gating pattern live — built by this team in weeks for an active federal
competition. The company operates a named bench of senior engineers (enterprise Java/AWS,
React/TypeScript, data platforms, accessibility engineering) engaged per project, letting a
Phase I budget buy senior build capacity without carrying idle headcount. Advisory input for the
human-subjects task studies will come from the company's public-health-adjacent delivery partners;
university collaboration is an option under STTR if reviewers prefer it. Frasier Digital has no
prior SBIR/STTR awards; this project would convert a demonstrated production pattern into
certifiable, generalizable technology.

---

*Notes for Joseph:* (1) Thesis chosen: the guarded-AI reporting architecture — strongest overlap
of novelty, evidence-in-hand, and market story. Alternatives if you'd rather pivot: the
simulation/UQ readiness tooling (M-Day) or the schema-driven low-code form engine alone. (2) The
CDC references are deliberately anonymized-but-checkable; nothing confidential is used. (3) NSF
declines ~2/3 of pitches — a decline costs nothing and the content reuses for AFWERX almost
verbatim.
