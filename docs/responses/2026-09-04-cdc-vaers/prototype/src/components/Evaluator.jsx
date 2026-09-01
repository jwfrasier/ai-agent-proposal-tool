// Evaluator's guide — a walkthrough of the demonstration mapped to the RFQ's
// Performance Requirements Summary, plus one-click sample scenarios so every
// scored behavior can be seen without hand-typing a full report.

import { useEffect, useRef } from "react";
import { persistAnswers } from "../engine/store.jsx";
import { enterStagger } from "../engine/motion.js";

const PARENT_SCENARIO = {
  submitterType: "public",
  patientName: "Rivera, Maya",
  dob: "2019-03-14",
  ageAtVax: "7",
  sex: "female",
  patientAddress: "44 Peachtree Ln, Decatur",
  patientState: "GA",
  patientEmail: "sofia.rivera@example.com",
  vaxDate: "2026-08-04",
  vaccineName: "influenza",
  manufacturer: "Demo Pharma",
  lotNumber: "FL2026-4417",
  doseNumber: "1",
  facilityName: "Northside Pediatrics",
  symptoms:
    "About six hours after the flu shot she developed a fever of 102 and her arm was swollen and warm where she got the shot. The fever lasted two days. Our pediatrician saw her the next morning and said to use children's acetaminophen. She is back to normal now.",
  onsetDate: "2026-08-04",
  outcomes: ["doctor_visit"],
  recovered: "yes",
  conditions: "Mild asthma",
  medications: "Children's multivitamin",
  reporterName: "Rivera, Sofia",
  reporterRelation: "parent",
  reporterPhone: "555-0117",
  reporterEmail: "sofia.rivera@example.com",
  attestation: ["true_correct"],
};

const PHARMACIST_SCENARIO = {
  submitterType: "provider",
  reportType: "vaccine_error_no_ae",
  patientName: "Chen, Robert",
  dob: "1954-06-02",
  ageAtVax: "72",
  sex: "male",
  patientAddress: "902 Lakeside Dr, Tomball",
  patientState: "TX",
  vaxDate: "2026-08-12",
  vaxTime: "14:30",
  vaccineName: "shingles",
  manufacturer: "Demo Pharma",
  lotNumber: "VZ-88231",
  doseNumber: "1",
  route: "IM",
  bodySite: "LA",
  facilityName: "Lakeside Pharmacy #8",
  facilityType: "pharmacy",
  errorType: ["expired"],
  errorDescription:
    "During reconciliation we identified that the dose was drawn from a vial stored one day past its beyond-use date after reconstitution. Patient was contacted and monitored; no adverse event observed. Storage log has been corrected and staff re-trained on beyond-use dating.",
  reporterName: "Patel, Anika",
  reporterCredentials: "pharmacist",
  reporterPhone: "555-0164",
  reporterEmail: "a.patel@example.com",
  attestation: ["true_correct"],
};

const STEPS = [
  {
    title: "Open the landing page",
    prs: ["PRS#3", "PRS#4"],
    text: "Note the three access paths (report, FAQs, data downloads) and the load time. The demonstration banner declares synthetic data up front.",
  },
  {
    title: "Start a public report and watch it adapt",
    prs: ["PRS#1"],
    text: "Choose \"patient, parent, or member of the public\" and note the plain-language wording. Flip the Plain language / Clinical toggle: the substitution is engineered per field, not rewritten copy.",
  },
  {
    title: "Use the intelligent assistance",
    prs: ["PRS#5"],
    text: "Ask the assistant a question (try \"where do I find the lot number?\") — answers are generated live by an AI model behind a safety classifier; emergencies, medical-advice requests, and personal information get fixed approved responses. On the event-description field, write a brief draft and use \"Check my description for missing details.\" Watch the completeness meter as you answer.",
  },
  {
    title: "Run the provider error path",
    prs: ["PRS#1", "PRS#10"],
    text: "Start over as a healthcare professional and select \"administration error with no adverse event.\" Every adverse-event question disappears, and the form says how many were removed. At review, the supplemental-document suggestions are generated from the entered answers.",
  },
  {
    title: "Try the uploads",
    prs: ["PRS#9", "PRS#11"],
    text: "Attach a PDF (accepted). Attempt an image (declined, with the Phase 2 design accommodation explained in the message).",
  },
  {
    title: "Submit and inspect the record",
    prs: ["PRS#6", "PRS#7"],
    text: "Submit and open the structured record: field names mirror the published VAERS data dictionary (VAERSDATA / VAERSVAX), with identifiers grouped to match the public-release de-identification split. The post-submission survey appears; the site-navigation survey is in the footer.",
  },
  {
    title: "Edit the form without a developer",
    prs: ["PRS#8"],
    text: "Open Admin. Change a tooltip, a plain-language label, a choice option, or hide an optional field — the live preview and the real form update immediately.",
  },
  {
    title: "Repeat anything on a phone, or keyboard-only",
    prs: ["PRS#2", "PRS#14"],
    text: "All flows complete on a phone viewport. The application passes automated WCAG 2.1 AA and Section 508 checks across every page and form state; keyboard focus is always visible.",
  },
];

const PRS_MAP = [
  ["PRS#1", "Branching logic; provider error-no-AE path suppresses AE fields"],
  ["PRS#2", "Mobile and desktop responsiveness"],
  ["PRS#3", "Landing page and navigation redesign"],
  ["PRS#4", "Application performance"],
  ["PRS#5", "Data completeness (meter + AI completion assistance)"],
  ["PRS#6", "VAERS-compatible data capture (data-dictionary-mapped record)"],
  ["PRS#7", "Both customer satisfaction surveys"],
  ["PRS#8", "Program-personnel editability / low-code UI"],
  ["PRS#9", "Medical record upload + free-text"],
  ["PRS#10", "Supplemental document suggestion tool"],
  ["PRS#11", "Two-phase upload: Phase 1 enforced, Phase 2 designed-for"],
  ["PRS#14", "Section 508 conformance"],
];

export function EvaluatorPage({ navigate }) {
  const rootRef = useRef(null);
  useEffect(() => {
    const root = rootRef.current;
    if (!root) return;
    enterStagger(
      root.querySelectorAll(".eval-eyebrow, h1, .eval-lede, .eval-fast, .eval-scenarios .path-card")
    );
  }, []);

  function loadScenario(data) {
    persistAnswers({ ...data, _startedAt: Date.now() });
    try {
      sessionStorage.setItem("vaers-demo-jump", "review");
    } catch {
      /* demo only */
    }
    navigate("report");
  }

  return (
    <main id="main" className="container" ref={rootRef}>
      <div className="page eval-page">
        <p className="eval-eyebrow">For RFQ 75D301-26-Q-00146 evaluators</p>
        <h1>A guided look at this prototype</h1>
        <p className="eval-lede">
          Everything here is a working application, not a mockup: the same
          open-source stack proposed in the technical volume, on synthetic data.
          The steps below take about ten minutes and cover each scored
          performance requirement.
        </p>

        <div className="eval-fast">
          <h2>Only have two minutes?</h2>
          <ol>
            <li>
              Load the <strong>pharmacist error sample</strong> below — see the
              shortened no-adverse-event form (PRS#1) and the auto-suggested
              supporting documents at review (PRS#10), then submit to see the
              data-dictionary-mapped record (PRS#6).
            </li>
            <li>
              Start a fresh report and try{" "}
              <strong>"Prefer to start by telling us what happened?"</strong> —
              write two sentences and watch the form propose answers you review
              and confirm.
            </li>
            <li>
              Open <strong>Admin</strong>, change any tooltip or choice option,
              and see the live form change with no developer (PRS#8).
            </li>
          </ol>
        </div>

        <div className="eval-scenarios">
          <button
            type="button"
            className="path-card primary"
            onClick={() => loadScenario(PARENT_SCENARIO)}
          >
            <h3>Load sample: parent reports a reaction</h3>
            <p>
              A completed public-path report (child's post-flu-shot fever,
              recovered). Lands on the review step: inspect, then submit to see
              the structured record.
            </p>
            <span className="cta">Load and jump to review →</span>
          </button>
          <button
            type="button"
            className="path-card"
            onClick={() => loadScenario(PHARMACIST_SCENARIO)}
          >
            <h3>Load sample: pharmacist reports an error</h3>
            <p>
              The PRS#1 scenario: an administration error with no adverse
              event. Note the shortened form, then the auto-suggested
              supporting documents at review.
            </p>
            <span className="cta">Load and jump to review →</span>
          </button>
        </div>

        <h2 className="eval-h2">Suggested walkthrough</h2>
        <ol className="eval-steps">
          {STEPS.map((s, i) => (
            <li key={i}>
              <div className="eval-step-head">
                <strong>{s.title}</strong>
                <span className="eval-chips">
                  {s.prs.map((p) => (
                    <span className="eval-chip" key={p}>
                      {p}
                    </span>
                  ))}
                </span>
              </div>
              <p>{s.text}</p>
            </li>
          ))}
        </ol>

        <h2 className="eval-h2">Performance requirement coverage</h2>
        <table className="eval-table">
          <thead>
            <tr>
              <th scope="col">PRS row</th>
              <th scope="col">Demonstrated by</th>
            </tr>
          </thead>
          <tbody>
            {PRS_MAP.map(([prs, what]) => (
              <tr key={prs}>
                <td>{prs}</td>
                <td>{what}</td>
              </tr>
            ))}
          </tbody>
        </table>
        <p className="eval-note">
          PRS#12, #13, and #15–#18 (authority-to-develop support, security
          documentation, program management, transition-out) are contract
          deliverables rather than demonstrable interface behavior; they are
          addressed in the technical volume.
        </p>
        <p className="eval-note">
          Sample scenarios and report progress persist on this device only —
          use "Start over" on the report page to clear a loaded sample.
        </p>
      </div>
    </main>
  );
}
