// Configuration store — demonstrates the low-code/configurable interface
// (PWS 1.8 / PRS#8). Content overrides are keyed strings applied on top of
// the base schema; in production this is a CDC-authorized configuration
// service with audit logging. Here it persists to localStorage.

import { createContext, useCallback, useContext, useMemo, useState } from "react";
import { baseSchema, faqContent } from "../schema/vaers.js";

const STORAGE_KEY = "vaers-demo-config";

export const defaultSiteContent = {
  heroTitle: "Report a possible reaction or vaccine error in minutes, from any device.",
  heroLede:
    "The Vaccine Adverse Event Reporting System (VAERS) is the nation's early-warning system for vaccine safety. Your report matters, whether or not you're sure the vaccine was the cause.",
  noticeText:
    "Call 911 or contact your healthcare provider now. VAERS collects safety reports; it does not provide medical care or advice.",
};

function loadOverrides() {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY)) || {};
  } catch {
    return {};
  }
}

function applySchemaOverrides(schema, overrides) {
  const hasFieldOverride = (id) =>
    Object.keys(overrides).some((k) => k.startsWith(`field.${id}.`));
  return {
    ...schema,
    sections: schema.sections.map((s) => ({
      ...s,
      fields: s.fields.map((f) => {
        if (!hasFieldOverride(f.id)) return f;
        const tooltip = overrides[`field.${f.id}.tooltip`];
        const plainLabel = overrides[`field.${f.id}.label.plain`];
        const hidden = overrides[`field.${f.id}.hidden`];
        let options = f.options;
        if (Array.isArray(options)) {
          options = options.map((opt) => {
            const label = overrides[`field.${f.id}.option.${opt.value}`];
            return label !== undefined ? { ...opt, label } : opt;
          });
          const extra = overrides[`field.${f.id}.extraOptions`];
          if (Array.isArray(extra) && extra.length) {
            options = [...options, ...extra];
          }
        }
        return {
          ...f,
          tooltip: tooltip !== undefined ? tooltip : f.tooltip,
          label:
            plainLabel !== undefined
              ? { ...f.label, plain: plainLabel }
              : f.label,
          hidden: hidden === true && !f.required ? true : undefined,
          options,
        };
      }),
    })),
  };
}

function applyFaqOverrides(faq, overrides) {
  return faq.map((item, i) => ({
    q: overrides[`faq.${i}.q`] ?? item.q,
    a: overrides[`faq.${i}.a`] ?? item.a,
  }));
}

const ConfigContext = createContext(null);

export function ConfigProvider({ children }) {
  const [overrides, setOverrides] = useState(loadOverrides);

  const setOverride = useCallback((key, value) => {
    setOverrides((prev) => {
      const next = { ...prev };
      if (
        value === undefined ||
        value === null ||
        value === "" ||
        value === false ||
        (Array.isArray(value) && value.length === 0)
      )
        delete next[key];
      else next[key] = value;
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      } catch {
        /* demo only */
      }
      return next;
    });
  }, []);

  const resetAll = useCallback(() => {
    setOverrides({});
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch {
      /* demo only */
    }
  }, []);

  const value = useMemo(
    () => ({
      schema: applySchemaOverrides(baseSchema, overrides),
      faq: applyFaqOverrides(faqContent, overrides),
      site: {
        heroTitle: overrides["site.heroTitle"] ?? defaultSiteContent.heroTitle,
        heroLede: overrides["site.heroLede"] ?? defaultSiteContent.heroLede,
        noticeText: overrides["site.noticeText"] ?? defaultSiteContent.noticeText,
      },
      overrides,
      setOverride,
      resetAll,
    }),
    [overrides, setOverride, resetAll]
  );

  return <ConfigContext.Provider value={value}>{children}</ConfigContext.Provider>;
}

export function useConfig() {
  const ctx = useContext(ConfigContext);
  if (!ctx) throw new Error("useConfig must be used inside ConfigProvider");
  return ctx;
}

// Save-and-resume for report answers (burden reduction, Task 1.10).
export function loadAnswers() {
  try {
    return JSON.parse(localStorage.getItem("vaers-demo-answers")) || {};
  } catch {
    return {};
  }
}

export function persistAnswers(answers) {
  try {
    localStorage.setItem("vaers-demo-answers", JSON.stringify(answers));
  } catch {
    /* demo only */
  }
}

export function clearAnswers() {
  try {
    localStorage.removeItem("vaers-demo-answers");
  } catch {
    /* demo only */
  }
}
