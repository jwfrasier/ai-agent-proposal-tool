// Narrative-to-form prefill (intelligent completion assistance).
// The user tells their story in plain language; the hardened endpoint
// extracts ONLY explicitly-stated facts into field suggestions; nothing is
// applied until the user reviews and confirms each one. Applied fields are
// tagged "AI-suggested" on the form until the user edits or confirms them.

import { useMemo, useState } from "react";
import { useConfig, useT } from "../engine/store.jsx";

function labelFor(schema, fieldId, lang) {
  for (const s of schema.sections) {
    const f = s.fields.find((x) => x.id === fieldId);
    if (f) {
      const l = typeof f.label === "string" ? f.label : f.label[lang] ?? f.label.clinical;
      return { label: l, field: f };
    }
  }
  return { label: fieldId, field: null };
}

function displayValue(field, value) {
  if (Array.isArray(value)) {
    return value
      .map((v) => field?.options?.find((o) => o.value === v)?.label ?? v)
      .join("; ");
  }
  const opt = field?.options?.find((o) => o.value === value);
  return opt ? opt.label : String(value);
}

function sectionTitle(title, lang) {
  return typeof title === "string" ? title : (title[lang] ?? title.clinical);
}

// Where did the applied answers land? [{title, count}] in schema order.
function receiptFor(schema, ids, lang) {
  const out = [];
  for (const s of schema.sections) {
    const count = s.fields.filter((f) => ids.includes(f.id)).length;
    if (count > 0) out.push({ title: sectionTitle(s.title, lang), count });
  }
  return out;
}

export function NarrativeStart({ schema, lang, onApply }) {
  const { locale } = useConfig();
  const { t } = useT();
  const [draft, setDraft] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);
  const [suggestions, setSuggestions] = useState(null); // {id: value}
  const [selected, setSelected] = useState({}); // {id: bool}
  const [applied, setApplied] = useState(null); // {total, steps: [{title, count}]}

  const rows = useMemo(() => {
    if (!suggestions) return [];
    return Object.entries(suggestions)
      .filter(([, v]) => v !== null && v !== "" && !(Array.isArray(v) && !v.length))
      .map(([id, value]) => {
        const { label, field } = labelFor(schema, id, lang);
        return { id, value, label, display: displayValue(field, value) };
      });
  }, [suggestions, schema, lang]);

  async function suggest() {
    if (!draft.trim() || busy) return;
    setBusy(true);
    setError(null);
    setSuggestions(null);
    setApplied(null);
    try {
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), 30_000);
      const resp = await fetch("/api/assist", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mode: "extract", draft: draft.trim().slice(0, 1500), locale }),
        signal: controller.signal,
      });
      clearTimeout(timer);
      if (!resp.ok) throw new Error("unavailable");
      const data = await resp.json();
      if (!data.fields) throw new Error(data.answer || "unavailable");
      setSuggestions(data.fields);
      const sel = {};
      for (const [id, v] of Object.entries(data.fields)) {
        if (v !== null && v !== "" && !(Array.isArray(v) && !v.length)) sel[id] = true;
      }
      setSelected(sel);
    } catch (e) {
      setError(
        typeof e?.message === "string" && e.message.length > 30
          ? e.message
          : t("narrUnavailable")
      );
    } finally {
      setBusy(false);
    }
  }

  function apply() {
    const chosen = {};
    for (const row of rows) {
      if (selected[row.id]) {
        chosen[row.id] =
          row.id === "ageAtVax" || row.id === "hospDays"
            ? String(row.value)
            : row.value;
      }
    }
    onApply(chosen);
    const ids = Object.keys(chosen);
    setApplied({ total: ids.length, steps: receiptFor(schema, ids, lang) });
    setSuggestions(null);
    setDraft("");
  }

  return (
    <details className="narrative-start">
      <summary>
        {t("narrSummary")} <span className="sim-tag">{t("narrTag")}</span>
      </summary>
      <p className="field-help">{t("narrHelp")}</p>
      <textarea
        aria-label={t("narrLabel")}
        value={draft}
        maxLength={1500}
        placeholder={t("narrPlaceholder")}
        onChange={(e) => setDraft(e.target.value)}
      />
      <div className="form-nav" style={{ marginTop: "0.75rem" }}>
        <button
          type="button"
          className="btn secondary"
          disabled={busy || draft.trim().length < 20}
          onClick={suggest}
        >
          {busy ? t("narrReading") : t("narrSuggest")}
        </button>
      </div>
      {error && (
        <p className="field-help" role="status">
          {error}
        </p>
      )}
      {rows.length > 0 && (
        <div className="suggest-card" role="region" aria-label={t("narrRegion")}>
          <h3>{t("narrReview")}</h3>
          <div className="narrative-rows">
            {rows.map((row) => (
              <label className="choice" key={row.id}>
                <input
                  type="checkbox"
                  checked={!!selected[row.id]}
                  onChange={(e) =>
                    setSelected((s) => ({ ...s, [row.id]: e.target.checked }))
                  }
                />
                <span className="choice-label">
                  {row.label}
                  <small>{row.display}</small>
                </span>
              </label>
            ))}
          </div>
          <div className="form-nav" style={{ marginTop: "0.75rem" }}>
            <button type="button" className="btn" onClick={apply}>
              {t("narrApply")}
            </button>
            <button
              type="button"
              className="btn ghost"
              onClick={() => setSuggestions(null)}
            >
              {t("narrDiscard")}
            </button>
          </div>
          <p className="field-help" style={{ marginTop: "0.5rem", marginBottom: 0 }}>
            {t("narrCaveat")}
          </p>
        </div>
      )}
      {suggestions && rows.length === 0 && (
        <p className="field-help" role="status">
          {t("narrNothing")}
        </p>
      )}
      {applied && (
        <div className="suggest-card apply-receipt" role="status">
          <h3>{t("narrApplied", applied.total)}</h3>
          <p className="receipt-steps">
            {applied.steps.map((s) => `${s.title} (${s.count})`).join(" · ")}
          </p>
          <p className="field-help" style={{ marginBottom: 0 }}>
            {t("narrMarkedA")} <span className="ai-tag">{t("aiSuggested")}</span>{" "}
            {t("narrMarkedB")}
          </p>
          <div className="form-nav" style={{ marginTop: "0.75rem" }}>
            <button
              type="button"
              className="btn ghost"
              onClick={() => setApplied(null)}
            >
              {t("gotIt")}
            </button>
          </div>
        </div>
      )}
    </details>
  );
}
