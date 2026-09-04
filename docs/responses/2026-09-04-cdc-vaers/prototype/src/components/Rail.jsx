// Guided-report rail — the prototype's signature element.
// Live completeness meter (PRS#5 made visible to the submitter) plus
// contextual field guidance and an assistant panel demonstrating
// "intelligent completion assistance" (RFQ Section 2 objective).
//
// The assistant is LIVE AI first (same-origin /api/assist, Claude), with the
// scripted knowledge base as an automatic fallback — the demo works even if
// the AI endpoint is unreachable. Only the typed question (or, for the
// coach, the draft text itself) is sent; never other form answers.

import { useRef, useState } from "react";
import { useConfig, useT } from "../engine/store.jsx";

// Fields whose narrative drafts the coach can review (PRS#5 completeness)
const COACHABLE_FIELDS = new Set(["symptoms", "errorDescription"]);

function sectionTitle(title, lang) {
  return typeof title === "string" ? title : (title[lang] ?? title.clinical);
}

function scriptedAnswer(q, assistant) {
  const lower = q.toLowerCase();
  const hit = assistant.answers.find((entry) =>
    entry.match.some((m) => lower.includes(m))
  );
  return hit ? hit.a : assistant.fallback;
}

async function callAssist(payload) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 20_000);
  try {
    const resp = await fetch("/api/assist", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
      signal: controller.signal,
    });
    if (!resp.ok) return null;
    const data = await resp.json();
    return data.answer || null;
  } catch {
    return null;
  } finally {
    clearTimeout(timer);
  }
}

export function CompletenessMeter({ stats, lang, aiCounts = {} }) {
  const { t } = useT();
  const complete = stats.total > 0 && stats.done === stats.total;
  return (
    <section
      className={`rail-card${complete ? " meter-complete" : ""}`}
      aria-label={t("meterLabel")}
    >
      <h2>{t("meterTitle")}</h2>
      <p className="meter-value">
        {stats.pct}
        <span aria-hidden="true">%</span>
      </p>
      <p className="meter-caption" aria-live="polite">
        {complete ? t("meterComplete") : t("meterProgress", stats)}
      </p>
      <div
        className="meter-track"
        role="progressbar"
        aria-valuenow={stats.pct}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label={t("meterOverall")}
      >
        <div className="meter-fill" style={{ width: `${stats.pct}%` }} />
      </div>
      <ul className="meter-sections">
        {stats.perSection
          .filter((s) => s.total > 0)
          .map((s) => (
            <li
              key={s.id}
              className={s.done === s.total ? "complete" : undefined}
            >
              <span>
                {sectionTitle(s.title, lang)}
                {aiCounts[s.id] > 0 && (
                  <span
                    className="ai-chip"
                    aria-label={t("aiChip", aiCounts[s.id])}
                  >
                    {aiCounts[s.id]} AI
                  </span>
                )}
              </span>
              <span className="count">
                {s.done}/{s.total}
              </span>
            </li>
          ))}
      </ul>
    </section>
  );
}

export function AssistPanel({ focusedField, lang, answers = {}, mobile = false }) {
  const { assistant, locale } = useConfig();
  const { t } = useT();
  const [log, setLog] = useState([]);
  const [draft, setDraft] = useState("");
  const [busy, setBusy] = useState(false);
  const logRef = useRef(null);

  const fieldLabel = focusedField
    ? typeof focusedField.label === "string"
      ? focusedField.label
      : (focusedField.label[lang] ?? focusedField.label.clinical)
    : null;

  function append(entries) {
    setLog((prev) => [...prev, ...entries]);
    requestAnimationFrame(() => {
      logRef.current?.scrollTo({ top: logRef.current.scrollHeight });
    });
  }

  async function ask(e) {
    e.preventDefault();
    const q = draft.trim();
    if (!q || busy) return;
    setDraft("");
    append([{ who: "user", text: q }]);
    setBusy(true);
    const live = await callAssist({
      mode: "ask",
      question: q,
      fieldLabel: fieldLabel || "",
      locale,
    });
    setBusy(false);
    append([
      live
        ? { who: "bot", text: live, live: true }
        : { who: "bot", text: scriptedAnswer(q, assistant), live: false },
    ]);
  }

  const coachTarget =
    focusedField &&
    COACHABLE_FIELDS.has(focusedField.id) &&
    typeof answers[focusedField.id] === "string" &&
    answers[focusedField.id].trim().length >= 20
      ? answers[focusedField.id].trim()
      : null;

  async function coach() {
    if (!coachTarget || busy) return;
    append([{ who: "user", text: t("coachAsk") }]);
    setBusy(true);
    const live = await callAssist({
      mode: "coach",
      draft: coachTarget.slice(0, 600),
      fieldLabel: fieldLabel || "",
      locale,
    });
    setBusy(false);
    append([
      live
        ? { who: "bot", text: live, live: true }
        : {
            who: "bot",
            text: t("coachFallback"),
            live: false,
          },
    ]);
  }

  return (
    <section
      className={`rail-card ${mobile ? "assist-card-mobile" : "assist-card"}`}
      aria-label={t("assistLabel")}
    >
      <h2>
        {t("assistTitle")} <span className="sim-tag">{t("liveDemo")}</span>
      </h2>
      <div className="assist-context" aria-live="polite">
        {focusedField ? (
          <>
            <span className="assist-field-name">{fieldLabel}</span>
            {focusedField.tooltip || t("assistDefaultTip")}
          </>
        ) : (
          t("assistIdle")
        )}
      </div>
      <div className="assist-chat">
        {coachTarget && (
          <button
            type="button"
            className="btn secondary coach-btn"
            disabled={busy}
            onClick={coach}
          >
            {t("coachBtn")}
          </button>
        )}
        {log.length > 0 && (
          <div
            className="assist-log"
            ref={logRef}
            role="log"
            aria-label={t("assistLog")}
          >
            {log.map((m, i) => (
              <p key={i} className={`assist-msg ${m.who}`}>
                {m.text}
                {m.who === "bot" && (
                  <span className="assist-source">
                    {m.live ? t("aiAnswer") : t("scriptedAnswer")}
                  </span>
                )}
              </p>
            ))}
            {busy && (
              <p className="assist-msg bot assist-busy" aria-live="polite">
                {t("thinking")}
              </p>
            )}
          </div>
        )}
        <form className="assist-input-row" onSubmit={ask}>
          <input
            type="text"
            value={draft}
            aria-label={t("askLabel")}
            placeholder={t("askPlaceholder")}
            onChange={(e) => setDraft(e.target.value)}
          />
          <button type="submit" className="btn secondary" disabled={busy}>
            {t("ask")}
          </button>
        </form>
        <p style={{ fontSize: "0.6875rem", color: "var(--c-muted)", margin: 0 }}>
          {t("assistFoot")}
        </p>
      </div>
    </section>
  );
}
