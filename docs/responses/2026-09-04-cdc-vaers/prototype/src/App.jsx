import { useEffect, useRef, useState } from "react";
import { ConfigProvider, useT, useConfig } from "./engine/store.jsx";
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

function LangToggle() {
  const { locale, setLocale, t } = useConfig();
  return (
    <div className="lang-toggle" role="group" aria-label={`${t("langLabel")} / Idioma`}>
      <button
        type="button"
        lang="en"
        aria-pressed={locale === "en"}
        onClick={() => setLocale("en")}
      >
        EN
      </button>
      <button
        type="button"
        lang="es"
        aria-pressed={locale === "es"}
        onClick={() => setLocale("es")}
      >
        ES
      </button>
    </div>
  );
}

export default function App() {
  return (
    <ConfigProvider>
      <Shell />
    </ConfigProvider>
  );
}

function Shell() {
  const { t } = useT();
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
    <>
      <a className="skip-link" href="#main">
        {t("skip")}
      </a>

      <div className="demo-banner">
        <div className="container">
          <strong>{t("bannerTitle")}</strong>
          <span>{t("bannerText")}</span>
          <button
            type="button"
            className="eval-pill"
            ref={evalPillRef}
            onClick={() => navigate("evaluator")}
          >
            {t("evalPill")}
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
            <span className="brand-sub">{t("brandSub")}</span>
          </a>
          <nav className="site-nav" aria-label={t("navPrimary")}>
            {[
              ["home", t("navHome")],
              ["report", t("navReport")],
              ["faq", t("navFaq")],
              ["downloads", t("navData")],
              ["admin", t("navAdmin")],
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
            <LangToggle />
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
            {t("footerLead")}{" "}
            <button type="button" onClick={() => navigate("evaluator")}>
              {t("footerEval")}
            </button>
          </span>
          <button type="button" onClick={() => setNavSurvey(true)}>
            {t("footerSurvey")}
          </button>
        </div>
      </footer>

      {navSurvey && (
        <SurveyModal
          title={t("navSurveyTitle")}
          prompt={t("navSurveyPrompt")}
          onClose={() => setNavSurvey(false)}
        />
      )}
    </>
  );
}
