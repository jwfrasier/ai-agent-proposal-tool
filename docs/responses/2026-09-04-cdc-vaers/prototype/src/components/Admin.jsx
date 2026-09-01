// Low-code content administration (PWS 1.8 / PRS#8): authorized CDC program
// personnel edit user-facing content — labels, tooltips, FAQ entries, site
// text — with no developer involvement. Edits apply live across the app.

import { useMemo, useState } from "react";
import { useConfig, defaultSiteContent } from "../engine/store.jsx";
import { Field } from "./Field.jsx";

export function AdminPage() {
  const { schema, faq, site, overrides, setOverride, resetAll } = useConfig();
  const [previewFieldId, setPreviewFieldId] = useState("lotNumber");
  const [newOption, setNewOption] = useState("");

  const editableFields = useMemo(
    () =>
      schema.sections.flatMap((s) =>
        s.fields
          .filter((f) => f.tooltip || f.label?.plain)
          .map((f) => ({ ...f, sectionTitle: s.title }))
      ),
    [schema]
  );
  const previewField = editableFields.find((f) => f.id === previewFieldId);
  const changedCount = Object.keys(overrides).length;

  return (
    <main id="main" className="container">
      <div className="admin-grid">
        <div className="admin-panel">
          <h1>Content administration</h1>
          <p style={{ color: "var(--c-ink-soft)", fontSize: "var(--fs-sm)" }}>
            Program-personnel view (PWS Task 1.8). Edit form language, tooltips,
            FAQs, site text, choice options, and field visibility. Content and
            interface changes apply immediately, with no developer or
            deployment involved. In production, edits are role-restricted,
            versioned, and audit-logged.{" "}
            <span className="sim-tag">demo · saved on this device</span>
          </p>

          <div className="form-nav" style={{ marginTop: "1rem" }}>
            <button
              type="button"
              className="btn secondary"
              disabled={changedCount === 0}
              onClick={resetAll}
            >
              Reset all changes{changedCount > 0 ? ` (${changedCount})` : ""}
            </button>
          </div>

          <h2 style={{ fontSize: "var(--fs-md)", margin: "2rem 0 0.5rem" }}>
            Site text
          </h2>
          <div className="admin-list">
            {[
              ["site.heroTitle", "Landing page headline", site.heroTitle, defaultSiteContent.heroTitle],
              ["site.heroLede", "Landing page introduction", site.heroLede, defaultSiteContent.heroLede],
              ["site.noticeText", "Emergency notice banner", site.noticeText, defaultSiteContent.noticeText],
            ].map(([key, label, current, fallback]) => (
              <div className="admin-item" key={key}>
                <label htmlFor={`admin-${key}`}>
                  {label}
                  {overrides[key] !== undefined && (
                    <span className="applied-tag">applied live</span>
                  )}
                </label>
                <textarea
                  id={`admin-${key}`}
                  value={current}
                  onChange={(e) =>
                    setOverride(key, e.target.value === fallback ? "" : e.target.value)
                  }
                />
              </div>
            ))}
          </div>

          <h2 style={{ fontSize: "var(--fs-md)", margin: "2rem 0 0.5rem" }}>
            Form field content
          </h2>
          <div className="admin-list">
            <div className="admin-item">
              <label htmlFor="admin-field-picker">Choose a field</label>
              <select
                id="admin-field-picker"
                value={previewFieldId}
                style={{ width: "100%", padding: "0.45rem 0.6rem" }}
                onChange={(e) => setPreviewFieldId(e.target.value)}
              >
                {editableFields.map((f) => (
                  <option key={f.id} value={f.id}>
                    {typeof f.label === "string" ? f.label : f.label.clinical}
                  </option>
                ))}
              </select>
            </div>
            {previewField && (
              <>
                {previewField.label?.plain && (
                  <div className="admin-item">
                    <label htmlFor="admin-plain-label">
                      Plain-language label (public version)
                      {overrides[`field.${previewField.id}.label.plain`] !==
                        undefined && (
                        <span className="applied-tag">applied live</span>
                      )}
                    </label>
                    <textarea
                      id="admin-plain-label"
                      value={previewField.label.plain}
                      onChange={(e) =>
                        setOverride(
                          `field.${previewField.id}.label.plain`,
                          e.target.value
                        )
                      }
                    />
                  </div>
                )}
                {!previewField.required && (
                  <div className="admin-item">
                    <label>
                      Field visibility
                      {overrides[`field.${previewField.id}.hidden`] === true && (
                        <span className="applied-tag">hidden live</span>
                      )}
                    </label>
                    <label className="choice" style={{ marginTop: "0.25rem" }}>
                      <input
                        type="checkbox"
                        checked={
                          overrides[`field.${previewField.id}.hidden`] !== true
                        }
                        onChange={(e) =>
                          setOverride(
                            `field.${previewField.id}.hidden`,
                            e.target.checked ? "" : true
                          )
                        }
                      />
                      <span className="choice-label">
                        Show this field on the form (optional fields can be
                        hidden without a developer)
                      </span>
                    </label>
                  </div>
                )}
                {Array.isArray(previewField.options) && (
                  <div className="admin-item">
                    <label>
                      Choice options
                      {(Object.keys(overrides).some((k) =>
                        k.startsWith(`field.${previewField.id}.option.`)
                      ) ||
                        overrides[`field.${previewField.id}.extraOptions`]) && (
                        <span className="applied-tag">applied live</span>
                      )}
                    </label>
                    {previewField.options.slice(0, 12).map((opt) => (
                      <input
                        key={opt.value}
                        aria-label={`Label for option ${opt.value}`}
                        value={opt.label}
                        style={{ marginBottom: "0.35rem" }}
                        onChange={(e) =>
                          setOverride(
                            `field.${previewField.id}.option.${opt.value}`,
                            e.target.value
                          )
                        }
                      />
                    ))}
                    <div style={{ display: "flex", gap: "0.5rem" }}>
                      <input
                        aria-label="New option label"
                        placeholder="Add an option…"
                        value={newOption}
                        onChange={(e) => setNewOption(e.target.value)}
                      />
                      <button
                        type="button"
                        className="btn secondary"
                        disabled={!newOption.trim()}
                        onClick={() => {
                          const label = newOption.trim();
                          const value =
                            "custom_" +
                            label.toLowerCase().replace(/[^a-z0-9]+/g, "_");
                          const existing =
                            overrides[
                              `field.${previewField.id}.extraOptions`
                            ] || [];
                          setOverride(`field.${previewField.id}.extraOptions`, [
                            ...existing,
                            { value, label },
                          ]);
                          setNewOption("");
                        }}
                      >
                        Add
                      </button>
                    </div>
                  </div>
                )}
                {previewField.tooltip !== undefined && (
                  <div className="admin-item">
                    <label htmlFor="admin-tooltip">
                      "Why we ask" tooltip
                      {overrides[`field.${previewField.id}.tooltip`] !==
                        undefined && (
                        <span className="applied-tag">applied live</span>
                      )}
                    </label>
                    <textarea
                      id="admin-tooltip"
                      value={previewField.tooltip || ""}
                      onChange={(e) =>
                        setOverride(
                          `field.${previewField.id}.tooltip`,
                          e.target.value
                        )
                      }
                    />
                  </div>
                )}
              </>
            )}
          </div>

          <h2 style={{ fontSize: "var(--fs-md)", margin: "2rem 0 0.5rem" }}>
            FAQ entries
          </h2>
          <div className="admin-list">
            {faq.slice(0, 3).map((item, i) => (
              <div className="admin-item" key={i}>
                <label htmlFor={`admin-faq-q-${i}`}>Question {i + 1}</label>
                <input
                  id={`admin-faq-q-${i}`}
                  value={item.q}
                  onChange={(e) => setOverride(`faq.${i}.q`, e.target.value)}
                />
                <label
                  htmlFor={`admin-faq-a-${i}`}
                  style={{ marginTop: "0.5rem" }}
                >
                  Answer
                </label>
                <textarea
                  id={`admin-faq-a-${i}`}
                  value={item.a}
                  onChange={(e) => setOverride(`faq.${i}.a`, e.target.value)}
                />
              </div>
            ))}
          </div>
        </div>

        <div className="admin-preview" aria-label="Live preview">
          <p className="admin-preview-tag">Live preview: public form view</p>
          {previewField ? (
            <Field
              field={previewField}
              lang="plain"
              value={undefined}
              error={null}
              onChange={() => {}}
              onFocusField={() => {}}
            />
          ) : (
            <p>Select a field to preview.</p>
          )}
          <p
            style={{
              fontSize: "var(--fs-xs)",
              color: "var(--c-muted)",
              marginTop: "1rem",
            }}
          >
            This is the exact component the public form renders. The edit you
            make on the left is live here and in the real form.
          </p>
        </div>
      </div>
    </main>
  );
}
