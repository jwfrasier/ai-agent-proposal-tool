import { useEffect, useMemo, useRef, useState } from "react";
import {
  visibleSections,
  completeness,
  validateSection,
  buildStructuredOutput,
} from "../engine/conditions.js";
import { useConfig, loadAnswers, persistAnswers, clearAnswers } from "../engine/store.jsx";
import { suggestionRules } from "../schema/vaers.js";
import { evaluateCondition } from "../engine/conditions.js";
import { Field } from "./Field.jsx";
import { CompletenessMeter, AssistPanel } from "./Rail.jsx";
import { SurveyModal } from "./SurveyModal.jsx";
import { NarrativeStart } from "./NarrativeStart.jsx";
import { stepEnter } from "../engine/motion.js";

function t(variant, lang) {
  if (variant == null) return null;
  if (typeof variant === "string") return variant;
  return variant[lang] ?? variant.clinical;
}

function optionLabel(field, value) {
  if (!field.options) return null;
  const found = field.options.find((o) => o.value === value);
  return found ? found.label : null;
}

function formatValue(field, value) {
  if (Array.isArray(value)) {
    if (field.type === "upload")
      return value.map((f) => f.name).join(", ") || "—";
    return value.map((v) => optionLabel(field, v) ?? v).join("; ");
  }
  return optionLabel(field, value) ?? String(value);
}

export function ReportFlow() {
  const { schema } = useConfig();
  const [answers, setAnswers] = useState(() => {
    const saved = loadAnswers();
    if (!saved._startedAt) saved._startedAt = Date.now();
    return saved;
  });
  const [stepIndex, setStepIndex] = useState(() => {
    try {
      if (sessionStorage.getItem("vaers-demo-jump") === "review") {
        sessionStorage.removeItem("vaers-demo-jump");
        return 99; // clamped to the review step
      }
    } catch {
      /* demo only */
    }
    return 0;
  });
  const [errors, setErrors] = useState({});
  const [langOverride, setLangOverride] = useState(null);
  const [focusedField, setFocusedField] = useState(null);
  const [submitted, setSubmitted] = useState(null);
  const [aiSuggested, setAiSuggested] = useState(() => new Set());
  const [showSurvey, setShowSurvey] = useState(false);
  const headingRef = useRef(null);
  const errorRef = useRef(null);

  const lang =
    langOverride ?? (answers.submitterType === "provider" ? "clinical" : "plain");

  const sections = useMemo(
    () => visibleSections(schema, answers),
    [schema, answers]
  );
  const steps = useMemo(
    () => [...sections, { id: "review", title: "Review and submit", review: true }],
    [sections]
  );
  const step = steps[Math.min(stepIndex, steps.length - 1)];
  const stats = useMemo(() => completeness(schema, answers), [schema, answers]);

  // How many questions the branch suppressed (PRS#1 made visible)
  const suppressedCount = useMemo(() => {
    const noAe =
      answers.submitterType === "provider" &&
      answers.reportType === "vaccine_error_no_ae";
    if (!noAe) return 0;
    const openAnswers = { ...answers, reportType: "both" };
    const withAe = visibleSections(schema, openAnswers).reduce(
      (n, s) => n + s.fields.length,
      0
    );
    const withoutAe = sections.reduce((n, s) => n + s.fields.length, 0);
    return withAe - withoutAe;
  }, [schema, answers, sections]);

  useEffect(() => {
    persistAnswers(answers);
  }, [answers]);

  const stepBodyRef = useRef(null);

  useEffect(() => {
    headingRef.current?.focus();
    stepEnter(stepBodyRef.current);
  }, [stepIndex]);

  function setAnswer(fieldId, value) {
    setAnswers((prev) => ({ ...prev, [fieldId]: value }));
    setAiSuggested((prev) => {
      if (!prev.has(fieldId)) return prev;
      const next = new Set(prev);
      next.delete(fieldId);
      return next;
    });
    setErrors((prev) => {
      if (!prev[fieldId]) return prev;
      const next = { ...prev };
      delete next[fieldId];
      return next;
    });
  }

  function goNext() {
    if (!step.review) {
      const stepErrors = validateSection(step, answers);
      setErrors(stepErrors);
      if (Object.keys(stepErrors).length > 0) {
        requestAnimationFrame(() => errorRef.current?.focus());
        return;
      }
    }
    setStepIndex((i) => Math.min(i + 1, steps.length - 1));
  }

  function goBack() {
    setErrors({});
    setStepIndex((i) => Math.max(i - 1, 0));
  }

  function submit() {
    // validate everything before generating the record
    for (let i = 0; i < sections.length; i++) {
      const errs = validateSection(sections[i], answers);
      if (Object.keys(errs).length > 0) {
        setStepIndex(i);
        setErrors(errs);
        return;
      }
    }
    const output = buildStructuredOutput(schema, answers);
    output.reportMeta.elapsedMinutes = answers._startedAt
      ? Math.max(1, Math.round((Date.now() - answers._startedAt) / 60000))
      : null;
    setSubmitted(output);
    clearAnswers();
    window.scrollTo({ top: 0 });
    setTimeout(() => setShowSurvey(true), 1200);
  }

  function applyNarrative(fields) {
    setAnswers((prev) => ({ ...prev, ...fields }));
    setAiSuggested((prev) => new Set([...prev, ...Object.keys(fields)]));
  }

  // Per-section count of AI-suggested answers awaiting verification, so the
  // completeness panel shows where applied narrative answers landed.
  const aiCounts = useMemo(() => {
    if (aiSuggested.size === 0) return {};
    const counts = {};
    for (const s of schema.sections) {
      const n = s.fields.filter((f) => aiSuggested.has(f.id)).length;
      if (n > 0) counts[s.id] = n;
    }
    return counts;
  }, [schema, aiSuggested]);

  const suggestions = useMemo(() => {
    if (answers.submitterType !== "provider") return [];
    return suggestionRules
      .filter((r) => evaluateCondition(r.when, answers))
      .map((r) => r.suggest);
  }, [answers]);

  if (submitted) {
    return (
      <div className="container">
        <div className="page" style={{ maxWidth: "46rem" }}>
          <div className="success-panel" role="status">
            <h1>Report received (demonstration)</h1>
            <p>
              In production this report would be assigned a VAERS ID and a
              confirmation email would be sent.
              {submitted.reportMeta.elapsedMinutes &&
                ` Completed in about ${submitted.reportMeta.elapsedMinutes} minute${submitted.reportMeta.elapsedMinutes === 1 ? "" : "s"}.`}{" "}
              Nothing was transmitted or stored; this is synthetic
              demonstration data.
            </p>
          </div>
          <h2 style={{ fontSize: "var(--fs-md)", marginBottom: "0.5rem" }}>
            VAERS-compatible structured record
          </h2>
          <p className="report-sub">
            Generated by the same field-mapping layer that would transmit to
            existing VAERS systems. Download or inspect below.
          </p>
          <pre className="output-json" tabIndex={0}>
            {JSON.stringify(submitted, null, 2)}
          </pre>
          <div className="form-nav">
            <a
              className="btn secondary"
              download="vaers-demo-record.json"
              href={`data:application/json;charset=utf-8,${encodeURIComponent(JSON.stringify(submitted, null, 2))}`}
            >
              Download record (JSON)
            </a>
            <a className="btn ghost" href="#/">
              Back to home
            </a>
          </div>
        </div>
        {showSurvey && (
          <SurveyModal
            title="How was the reporting experience?"
            prompt="Your feedback helps improve this form. (Post-submission satisfaction survey.)"
            onClose={() => setShowSurvey(false)}
          />
        )}
      </div>
    );
  }

  return (
    <div className="container">
      <div className="report-shell">
        <main className="report-main" id="main">
          <h1 tabIndex={-1} ref={headingRef}>
            Submit a VAERS report
          </h1>
          <p className="report-sub">
            Takes about 10 minutes or less. Progress saves on your device
            automatically. Fields marked <span className="req-flag">*</span> are
            needed; everything else is optional.
          </p>

          <div
            className="mode-toggle"
            role="group"
            aria-label="Form language style"
          >
            <button
              type="button"
              aria-pressed={lang === "plain"}
              onClick={() => setLangOverride("plain")}
            >
              Plain language
            </button>
            <button
              type="button"
              aria-pressed={lang === "clinical"}
              onClick={() => setLangOverride("clinical")}
            >
              Clinical
            </button>
          </div>

          <ol className="stepper">
            {steps.map((s, i) => (
              <li
                key={s.id}
                aria-current={i === stepIndex ? "step" : undefined}
                className={i < stepIndex ? "done" : undefined}
              >
                <span className="step-dot" aria-hidden="true" />
                {t(s.title, lang)}
              </li>
            ))}
          </ol>

          {suppressedCount > 0 && (
            <p className="branch-note">
              <strong>{suppressedCount} questions removed.</strong> Because this
              is an administration error with no adverse event, all
              adverse-event questions have been skipped.
            </p>
          )}

          {Object.keys(errors).length > 0 && (
            <div
              className="upload-reject"
              role="alert"
              tabIndex={-1}
              ref={errorRef}
              style={{ marginBottom: "1.5rem" }}
            >
              <strong>
                {Object.keys(errors).length} answer
                {Object.keys(errors).length === 1 ? " needs" : "s need"}{" "}
                attention before continuing.
              </strong>
            </div>
          )}

          {step.review ? (
            <>
              <div className="review-summary">
                {sections.map((s) => (
                  <section key={s.id}>
                    <h3>{t(s.title, lang)}</h3>
                    <dl>
                      {s.fields
                        .filter((f) => {
                          const v = answers[f.id];
                          return (
                            v !== undefined &&
                            v !== null &&
                            !(typeof v === "string" && v.trim() === "") &&
                            !(Array.isArray(v) && v.length === 0)
                          );
                        })
                        .map((f) => (
                          <div key={f.id} style={{ display: "contents" }}>
                            <dt>{t(f.label, lang)}</dt>
                            <dd>{formatValue(f, answers[f.id])}</dd>
                          </div>
                        ))}
                    </dl>
                  </section>
                ))}
              </div>
              {suggestions.length > 0 && (
                <div className="suggest-card">
                  <h3>
                    Suggested supporting documents{" "}
                    <span className="sim-tag">auto-generated</span>
                  </h3>
                  <p
                    style={{
                      fontSize: "var(--fs-xs)",
                      color: "var(--c-muted)",
                      marginBottom: "0.5rem",
                    }}
                  >
                    Based on a scan of this submission (PWS Task 2.3). Go back
                    to Supporting documents to attach any of these:
                  </p>
                  <ul>
                    {suggestions.map((s) => (
                      <li key={s}>{s}</li>
                    ))}
                  </ul>
                </div>
              )}
              <div className="form-nav">
                <button type="button" className="btn secondary" onClick={goBack}>
                  Back
                </button>
                <button type="button" className="btn big" onClick={submit}>
                  Submit report (demonstration)
                </button>
              </div>
            </>
          ) : (
            <form
              ref={stepBodyRef}
              onSubmit={(e) => {
                e.preventDefault();
                goNext();
              }}
            >
              <h2 style={{ fontSize: "var(--fs-lg)", marginBottom: "1rem" }}>
                {t(step.title, lang)}
              </h2>
              {step.fields.map((f) => (
                <Field
                  key={f.id}
                  field={f}
                  lang={lang}
                  value={answers[f.id]}
                  error={errors[f.id]}
                  aiSuggested={aiSuggested.has(f.id)}
                  onChange={(v) => setAnswer(f.id, v)}
                  onFocusField={setFocusedField}
                />
              ))}
              {stepIndex === 0 && (
                <NarrativeStart
                  schema={schema}
                  lang={lang}
                  onApply={applyNarrative}
                />
              )}
              <div className="form-nav">
                {stepIndex > 0 && (
                  <button
                    type="button"
                    className="btn secondary"
                    onClick={goBack}
                  >
                    Back
                  </button>
                )}
                <button type="submit" className="btn">
                  Continue
                </button>
                <button
                  type="button"
                  className="btn ghost"
                  onClick={() => {
                    clearAnswers();
                    setAnswers({ _startedAt: Date.now() });
                    setErrors({});
                    setStepIndex(0);
                  }}
                >
                  Start over
                </button>
              </div>
            </form>
          )}

          <div className="rail-mobile-assist">
            <AssistPanel focusedField={focusedField} lang={lang} answers={answers} mobile />
          </div>
        </main>

        <aside className="rail" aria-label="Report guidance">
          <CompletenessMeter stats={stats} lang={lang} aiCounts={aiCounts} />
          <AssistPanel focusedField={focusedField} lang={lang} answers={answers} />
        </aside>
      </div>
    </div>
  );
}
