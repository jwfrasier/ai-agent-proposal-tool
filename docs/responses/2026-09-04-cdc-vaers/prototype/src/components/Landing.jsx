// Redesigned landing page + navigation (PWS 1.4 / PRS#3): clear access paths
// to the report form, FAQs, and data downloads.

import { useEffect, useRef } from "react";
import { useConfig, useT } from "../engine/store.jsx";
import { enterStagger } from "../engine/motion.js";

export function Landing({ navigate }) {
  const { site } = useConfig();
  const { t } = useT();
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
                {t("startReport")}
              </button>
              <button
                type="button"
                className="btn secondary"
                onClick={() => navigate("faq")}
              >
                {t("learnVaers")}
              </button>
            </div>
          </div>
          <div className="hero-card">
            <h2>{t("expectTitle")}</h2>
            <ol>
              <li>{t("expect1")}</li>
              <li>{t("expect2")}</li>
              <li>{t("expect3")}</li>
              <li>{t("expect4")}</li>
            </ol>
          </div>
        </div>
      </section>

      <section className="access-paths">
        <div className="container">
          <div className="notice-strip" role="note">
            <span className="callout-lead">{t("emergencyLead")}</span>
            {site.noticeText}
          </div>
          <h2>{t("toolsTitle")}</h2>
          <div className="path-grid">
            <button
              type="button"
              className="path-card primary"
              onClick={() => navigate("report")}
            >
              <h3>{t("pathReportTitle")}</h3>
              <p>{t("pathReportText")}</p>
              <span className="cta">{t("pathReportCta")}</span>
            </button>
            <button
              type="button"
              className="path-card"
              onClick={() => navigate("faq")}
            >
              <h3>{t("pathFaqTitle")}</h3>
              <p>{t("pathFaqText")}</p>
              <span className="cta">{t("pathFaqCta")}</span>
            </button>
            <button
              type="button"
              className="path-card"
              onClick={() => navigate("downloads")}
            >
              <h3>{t("pathDataTitle")}</h3>
              <p>{t("pathDataText")}</p>
              <span className="cta">{t("pathDataCta")}</span>
            </button>
          </div>
        </div>
      </section>
    </main>
  );
}

export function FaqPage() {
  const { faq } = useConfig();
  const { t } = useT();
  return (
    <main id="main" className="container">
      <div className="page">
        <h1>{t("faqTitle")}</h1>
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
  const { t } = useT();
  const sets = [
    { name: t("ds1Name"), desc: t("ds1Desc") },
    { name: t("ds2Name"), desc: t("ds2Desc") },
    { name: t("ds3Name"), desc: t("ds3Desc") },
  ];
  return (
    <main id="main" className="container">
      <div className="page">
        <h1>{t("downloadsTitle")}</h1>
        <p style={{ color: "var(--c-ink-soft)" }}>{t("downloadsLede")}</p>
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
                onClick={() => alert(t("downloadDemo"))}
              >
                {t("download")}
              </button>
            </li>
          ))}
        </ul>
      </div>
    </main>
  );
}
