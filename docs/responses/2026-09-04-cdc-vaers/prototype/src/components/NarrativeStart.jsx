// Narrative-to-form prefill (intelligent completion assistance).
// The user tells their story in plain language; the hardened endpoint
// extracts ONLY explicitly-stated facts into field suggestions; nothing is
// applied until the user reviews and confirms each one. Applied fields are
// tagged "AI-suggested" on the form until the user edits or confirms them.

import { useMemo, useState } from "react";

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
        body: JSON.stringify({ mode: "extract", draft: draft.trim().slice(0, 1500) }),
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
          : "The suggestion service isn't available right now. You can fill the form directly; nothing is lost."
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
        Prefer to start by telling us what happened?{" "}
        <span className="sim-tag">optional · live AI</span>
      </summary>
      <p className="field-help">
        Write what happened in your own words. We'll suggest form answers drawn
        only from what you write — you review and confirm each one, and every
        field stays editable. Don't include names or contact details here.
      </p>
      <textarea
        aria-label="Tell us what happened in your own words"
        value={draft}
        maxLength={1500}
        placeholder="Example: My daughter got a flu shot on August 4th. That evening she had a fever of 102 and her arm was swollen. Our doctor saw her the next day. She's fine now."
        onChange={(e) => setDraft(e.target.value)}
      />
      <div className="form-nav" style={{ marginTop: "0.75rem" }}>
        <button
          type="button"
          className="btn secondary"
          disabled={busy || draft.trim().length < 20}
          onClick={suggest}
        >
          {busy ? "Reading your story…" : "Suggest form answers"}
        </button>
      </div>
      {error && (
        <p className="field-help" role="status">
          {error}
        </p>
      )}
      {rows.length > 0 && (
        <div className="suggest-card" role="region" aria-label="Suggested answers">
          <h3>Suggested answers — review each before applying</h3>
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
              Apply selected answers
            </button>
            <button
              type="button"
              className="btn ghost"
              onClick={() => setSuggestions(null)}
            >
              Discard
            </button>
          </div>
          <p className="field-help" style={{ marginTop: "0.5rem", marginBottom: 0 }}>
            Suggestions come only from your words and may be incomplete or
            wrong. Applied answers are marked on the form so you can verify
            them.
          </p>
        </div>
      )}
      {suggestions && rows.length === 0 && (
        <p className="field-help" role="status">
          Nothing could be confidently drawn from that description — the form
          will walk you through everything step by step.
        </p>
      )}
      {applied && (
        <div className="suggest-card apply-receipt" role="status">
          <h3>
            {applied.total} answer{applied.total === 1 ? "" : "s"} applied to
            the steps ahead
          </h3>
          <p className="receipt-steps">
            {applied.steps.map((s) => `${s.title} (${s.count})`).join(" · ")}
          </p>
          <p className="field-help" style={{ marginBottom: 0 }}>
            You'll see them marked{" "}
            <span className="ai-tag">AI-suggested · verify</span> as you go —
            the form only asks about what your story didn't cover. Your progress
            is also shown in the completeness panel.
          </p>
          <div className="form-nav" style={{ marginTop: "0.75rem" }}>
            <button
              type="button"
              className="btn ghost"
              onClick={() => setApplied(null)}
            >
              Got it
            </button>
          </div>
        </div>
      )}
    </details>
  );
}
