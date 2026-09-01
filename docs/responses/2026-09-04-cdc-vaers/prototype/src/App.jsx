import { useEffect, useRef, useState } from "react";
import { ConfigProvider } from "./engine/store.jsx";
import { Landing, FaqPage, DownloadsPage } from "./components/Landing.jsx";
import { ReportFlow } from "./components/ReportFlow.jsx";
import { AdminPage } from "./components/Admin.jsx";
import { EvaluatorPage } from "./components/Evaluator.jsx";
import { evaluatorAttention } from "./engine/motion.js";
import { SurveyModal } from "./components/SurveyModal.jsx";

const PAGES = ["home", "report", "faq", "downloads", "admin", "evaluator"];

function pageFromHash() {
  const h = window.location.hash.replace(/^#\/?/, "");
  return PAGES.includes(h) ? h : "home";
}

export default function App() {
  const [page, setPage] = useState(pageFromHash);
  const [navSurvey, setNavSurvey] = useState(false);
  const evalPillRef = useRef(null);

  useEffect(() => {
    evaluatorAttention(evalPillRef.current);
  }, []);

  useEffect(() => {
    const onHash = () => {
      setPage(pageFromHash());
      window.scrollTo({ top: 0 });
    };
    window.addEventListener("hashchange", onHash);
    return () => window.removeEventListener("hashchange", onHash);
  }, []);

  function navigate(next) {
    window.location.hash = next === "home" ? "/" : `/${next}`;
  }

  return (
    <ConfigProvider>
      <a className="skip-link" href="#main">
        Skip to main content
      </a>

      <div className="demo-banner">
        <div className="container">
          <strong>Demonstration prototype</strong>
          <span>
            Built by Frasier Digital for CDC RFQ 75D301-26-Q-00146 evaluation.
            Synthetic data only; no PHI/PII is collected, transmitted, or
            stored. Not an official government website.
          </span>
          <button
            type="button"
            className="eval-pill"
            ref={evalPillRef}
            onClick={() => navigate("evaluator")}
          >
            Evaluator's guide →
          </button>
        </div>
      </div>

      <header className="site-header">
        <div className="container">
          <a
            className="brand"
            href="#/"
            onClick={(e) => {
              e.preventDefault();
              navigate("home");
            }}
          >
            <span className="brand-name">VAERS</span>
            <span className="brand-sub">
              Vaccine Adverse Event Reporting System modernization concept
            </span>
          </a>
          <nav className="site-nav" aria-label="Primary">
            {[
              ["home", "Home"],
              ["report", "Submit a report"],
              ["faq", "FAQs"],
              ["downloads", "Data"],
              ["admin", "Admin"],
            ].map(([key, label]) => (
              <button
                key={key}
                type="button"
                aria-current={page === key ? "page" : undefined}
                onClick={() => navigate(key)}
              >
                {label}
              </button>
            ))}
          </nav>
        </div>
      </header>

      {page === "home" && <Landing navigate={navigate} />}
      {page === "report" && <ReportFlow />}
      {page === "faq" && <FaqPage />}
      {page === "downloads" && <DownloadsPage />}
      {page === "admin" && <AdminPage />}
      {page === "evaluator" && <EvaluatorPage navigate={navigate} />}

      <footer className="site-footer">
        <div className="container">
          <span>
            Demonstration prototype · Frasier Digital · synthetic data only ·{" "}
            <button type="button" onClick={() => navigate("evaluator")}>
              For RFQ evaluators
            </button>
          </span>
          <button type="button" onClick={() => setNavSurvey(true)}>
            Tell us about your experience on this site
          </button>
        </div>
      </footer>

      {navSurvey && (
        <SurveyModal
          title="How easy was it to find what you needed?"
          prompt="Site-navigation satisfaction survey (PWS Task 1.5)."
          onClose={() => setNavSurvey(false)}
        />
      )}
    </ConfigProvider>
  );
}
