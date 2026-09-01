import { useId, useState } from "react";
import { Upload } from "./Upload.jsx";

function text(variant, lang) {
  if (variant == null) return null;
  if (typeof variant === "string") return variant;
  return variant[lang] ?? variant.clinical ?? variant.plain;
}

export function Field({ field, lang, value, error, onChange, onFocusField, aiSuggested = false }) {
  const id = useId();
  const [tipOpen, setTipOpen] = useState(false);
  const label = text(field.label, lang);
  const help = text(field.help, lang);
  const errId = `${id}-err`;
  const helpId = `${id}-help`;
  const describedBy =
    [help ? helpId : null, error ? errId : null].filter(Boolean).join(" ") ||
    undefined;

  const requiredMark =
    field.required === "critical" ? (
      <>
        <span className="req-flag" aria-hidden="true">
          {" "}
          *
        </span>
        <span className="crit-flag">critical</span>
      </>
    ) : field.required ? (
      <span className="req-flag" aria-hidden="true">
        {" "}
        *
      </span>
    ) : null;

  const aiTag = aiSuggested ? (
    <span className="ai-tag">AI-suggested · verify</span>
  ) : null;

  const tooltipButton = field.tooltip ? (
    <button
      type="button"
      className="tooltip-btn"
      aria-expanded={tipOpen}
      aria-controls={`${id}-tip`}
      onClick={() => setTipOpen((o) => !o)}
    >
      Why we ask
    </button>
  ) : null;

  const common = {
    id,
    "aria-describedby": describedBy,
    "aria-invalid": error ? true : undefined,
    "aria-required": field.required ? true : undefined,
    onFocus: () => onFocusField?.(field),
  };

  let control;
  switch (field.type) {
    case "radio-cards":
    case "radio":
      control = (
        <fieldset
          aria-describedby={describedBy}
          onFocus={() => onFocusField?.(field)}
        >
          <legend>
            {label}
            {requiredMark}
            {aiTag}
            {tooltipButton}
          </legend>
          {help && (
            <p className="field-help" id={helpId}>
              {help}
            </p>
          )}
          {field.tooltip && tipOpen && (
            <div className="tooltip-pop" id={`${id}-tip`}>
              {field.tooltip}
            </div>
          )}
          <div className="choice-list">
            {field.options.map((opt) => (
              <label className="choice" key={opt.value}>
                <input
                  type="radio"
                  name={id}
                  value={opt.value}
                  checked={value === opt.value}
                  aria-invalid={error ? true : undefined}
                  onChange={() => onChange(opt.value)}
                />
                <span className="choice-label">
                  {opt.label}
                  {opt.detail && <small>{opt.detail}</small>}
                </span>
              </label>
            ))}
          </div>
          {error && (
            <p className="field-error" id={errId}>
              {error}
            </p>
          )}
        </fieldset>
      );
      return <div className={`field${error ? " invalid" : ""}`}>{control}</div>;

    case "checkboxes":
      control = (
        <fieldset
          aria-describedby={describedBy}
          onFocus={() => onFocusField?.(field)}
        >
          <legend>
            {label}
            {requiredMark}
            {aiTag}
            {tooltipButton}
          </legend>
          {help && (
            <p className="field-help" id={helpId}>
              {help}
            </p>
          )}
          {field.tooltip && tipOpen && (
            <div className="tooltip-pop" id={`${id}-tip`}>
              {field.tooltip}
            </div>
          )}
          <div className="choice-list">
            {field.options.map((opt) => {
              const arr = Array.isArray(value) ? value : [];
              const checked = arr.includes(opt.value);
              return (
                <label className="choice" key={opt.value}>
                  <input
                    type="checkbox"
                    value={opt.value}
                    checked={checked}
                    onChange={() => {
                      const next = checked
                        ? arr.filter((v) => v !== opt.value)
                        : [...arr, opt.value];
                      onChange(next);
                    }}
                  />
                  <span className="choice-label">
                    {opt.label}
                    {opt.detail && <small>{opt.detail}</small>}
                  </span>
                </label>
              );
            })}
          </div>
          {error && (
            <p className="field-error" id={errId}>
              {error}
            </p>
          )}
        </fieldset>
      );
      return <div className={`field${error ? " invalid" : ""}`}>{control}</div>;

    case "select":
      control = (
        <select
          {...common}
          value={value ?? ""}
          onChange={(e) => onChange(e.target.value)}
        >
          <option value="">Select one</option>
          {field.options.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
      );
      break;

    case "textarea":
      control = (
        <textarea
          {...common}
          value={value ?? ""}
          onChange={(e) => onChange(e.target.value)}
        />
      );
      break;

    case "upload":
      return (
        <Upload
          field={field}
          lang={lang}
          value={value}
          onChange={onChange}
          onFocusField={onFocusField}
        />
      );

    default:
      control = (
        <input
          {...common}
          type={
            ["date", "email", "tel", "time", "number"].includes(field.type)
              ? field.type
              : "text"
          }
          inputMode={field.type === "number" ? "numeric" : undefined}
          min={field.type === "number" ? 0 : undefined}
          autoComplete={field.autocomplete}
          value={value ?? ""}
          onChange={(e) => onChange(e.target.value)}
        />
      );
  }

  return (
    <div className={`field${error ? " invalid" : ""}`}>
      <label className="field-label" htmlFor={id}>
        {label}
        {requiredMark}
        {aiTag}
        {tooltipButton}
      </label>
      {help && (
        <p className="field-help" id={helpId}>
          {help}
        </p>
      )}
      {field.tooltip && tipOpen && (
        <div className="tooltip-pop" id={`${id}-tip`}>
          {field.tooltip}
        </div>
      )}
      {control}
      {error && (
        <p className="field-error" id={errId}>
          {error}
        </p>
      )}
    </div>
  );
}
