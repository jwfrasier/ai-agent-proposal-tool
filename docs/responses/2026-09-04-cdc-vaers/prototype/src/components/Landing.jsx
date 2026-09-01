// Redesigned landing page + navigation (PWS 1.4 / PRS#3): clear access paths
// to the report form, FAQs, and data downloads.

import { useEffect, useRef } from "react";
import { useConfig } from "../engine/store.jsx";
import { enterStagger } from "../engine/motion.js";

export function Landing({ navigate }) {
  const { site } = useConfig();
  const rootRef = useRef(null);
  useEffect(() => {
    const root = rootRef.current;
    if (!root) return;
    enterStagger(root.querySelectorAll(".hero h1, .hero .lede, .hero-actions, .hero-card"));
    enterStagger(root.querySelectorAll(".path-card"), { delay: 0.15 });
  }, []);
  return (
    <main id="main" ref={rootRef}>
      <section className="hero">
        <div className="container hero-grid">
          <div>
            <h1>{site.heroTitle}</h1>
            <p className="lede">{site.heroLede}</p>
            <div className="hero-actions">
              <button
                type="button"
                className="btn big"
                onClick={() => navigate("report")}
              >
                Start a report
              </button>
              <button
                type="button"
                className="btn secondary"
                onClick={() => navigate("faq")}
              >
                Learn how VAERS works
              </button>
            </div>
          </div>
          <div className="hero-card">
            <h2>What to expect</h2>
            <ol>
              <li>Answer questions about the vaccine and what happened. About 10 minutes.</li>
              <li>The form adapts to you: plain language for the public, clinical detail for providers.</li>
              <li>Attach records if you have them. Reports are valuable without them.</li>
              <li>Progress saves on your device, so you can pause and come back.</li>
            </ol>
          </div>
        </div>
      </section>

      <section className="access-paths">
        <div className="container">
          <div className="notice-strip" role="note">
            <span className="callout-lead">Emergency?</span>
            {site.noticeText}
          </div>
          <h2>Reporting tools and resources</h2>
          <div className="path-grid">
            <button
              type="button"
              className="path-card primary"
              onClick={() => navigate("report")}
            >
              <h3>Submit a report</h3>
              <p>
                Report an adverse event after vaccination, or, for healthcare
                professionals, a vaccine administration error with or without an
                adverse event.
              </p>
              <span className="cta">Start a report →</span>
            </button>
            <button
              type="button"
              className="path-card"
              onClick={() => navigate("faq")}
            >
              <h3>Frequently asked questions</h3>
              <p>
                What VAERS is (and isn't), who should report, what happens to
                your report, and how privacy is protected.
              </p>
              <span className="cta">Read the FAQs →</span>
            </button>
            <button
              type="button"
              className="path-card"
              onClick={() => navigate("downloads")}
            >
              <h3>VAERS data</h3>
              <p>
                Download de-identified VAERS datasets and documentation for
                research and analysis.
              </p>
              <span className="cta">Get the data →</span>
            </button>
          </div>
        </div>
      </section>
    </main>
  );
}

export function FaqPage() {
  const { faq } = useConfig();
  return (
    <main id="main" className="container">
      <div className="page">
        <h1>Frequently asked questions</h1>
        {faq.map((item, i) => (
          <details className="faq-item" key={i}>
            <summary>{item.q}</summary>
            <p>{item.a}</p>
          </details>
        ))}
      </div>
    </main>
  );
}

export function DownloadsPage() {
  const sets = [
    {
      name: "VAERS domestic data (annual ZIP)",
      desc: "De-identified reports, symptoms, and vaccine tables. Demonstration placeholder.",
    },
    {
      name: "VAERS data use guide (PDF)",
      desc: "How to interpret VAERS data, its strengths, and its limitations.",
    },
    {
      name: "Data dictionary (CSV)",
      desc: "Field-level definitions for every published column.",
    },
  ];
  return (
    <main id="main" className="container">
      <div className="page">
        <h1>VAERS data downloads</h1>
        <p style={{ color: "var(--c-ink-soft)" }}>
          De-identified VAERS data is public. Personal information is never
          included in published datasets.
        </p>
        <ul className="download-list">
          {sets.map((s) => (
            <li key={s.name}>
              <div>
                <strong>{s.name}</strong>
                <p style={{ fontSize: "var(--fs-sm)", color: "var(--c-muted)" }}>
                  {s.desc}
                </p>
              </div>
              <button
                type="button"
                className="btn secondary"
                onClick={() =>
                  alert("Demonstration only. Dataset downloads are placeholders.")
                }
              >
                Download
              </button>
            </li>
          ))}
        </ul>
      </div>
    </main>
  );
}
