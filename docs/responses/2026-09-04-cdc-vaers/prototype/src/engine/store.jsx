// Configuration store — demonstrates the low-code/configurable interface
// (PWS 1.8 / PRS#8) and the bilingual content model (PWS 1.13 / PRS#19).
//
// Content resolves in layers, all keyed by the same content PATHS:
//   base schema (English)
//     → Spanish content layer (src/i18n/es-content.js) when locale is "es"
//       → admin overrides for the active locale (English edits are stored
//         under the bare key, Spanish edits under "es:<key>")
// In production this is a CDC-authorized configuration service with audit
// logging and per-locale review; here it persists to localStorage.

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import {
  baseSchema,
  faqContent,
  suggestionRules,
  assistantAnswers,
  assistantFallback,
} from "../schema/vaers.js";
import { esContent, esAssistantMatches } from "../i18n/es-content.js";
import { UI, LOCALES } from "../i18n/ui.js";

const STORAGE_KEY = "vaers-demo-config";
const LOCALE_KEY = "vaers-demo-locale";

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

// Initial locale: ?lang= on the URL wins (shareable Spanish deep link), then
// the viewer's saved choice, then English.
function initialLocale() {
  try {
    const fromUrl = new URLSearchParams(window.location.search).get("lang");
    if (LOCALES.includes(fromUrl)) return fromUrl;
    const saved = localStorage.getItem(LOCALE_KEY);
    if (LOCALES.includes(saved)) return saved;
  } catch {
    /* demo only */
  }
  return "en";
}

// ---------------------------------------------------------------------------
// Layer application: one function for every content path.

function pick(layer, key) {
  return Object.prototype.hasOwnProperty.call(layer, key) ? layer[key] : undefined;
}

function applyLayer(schema, layer) {
  const has = (prefix) => Object.keys(layer).some((k) => k.startsWith(prefix));
  return {
    ...schema,
    sections: schema.sections.map((s) => {
      const sp = `section.${s.id}.`;
      const titleClin = pick(layer, `${sp}title.clinical`);
      const titlePlain = pick(layer, `${sp}title.plain`);
      const suppressed = pick(layer, `${sp}suppressedNote`);
      const title =
        titleClin !== undefined || titlePlain !== undefined
          ? {
              clinical: titleClin ?? s.title.clinical,
              plain: titlePlain ?? s.title.plain,
            }
          : s.title;
      return {
        ...s,
        title,
        suppressedNote: suppressed ?? s.suppressedNote,
        fields: s.fields.map((f) => {
          const fp = `field.${f.id}.`;
          if (!has(fp)) return f;
          const tooltip = pick(layer, `${fp}tooltip`);
          const labelClin = pick(layer, `${fp}label.clinical`);
          const labelPlain = pick(layer, `${fp}label.plain`);
          const helpClin = pick(layer, `${fp}help.clinical`);
          const helpPlain = pick(layer, `${fp}help.plain`);
          const hidden = pick(layer, `${fp}hidden`);
          let options = f.options;
          if (Array.isArray(options)) {
            options = options.map((opt) => {
              const label = pick(layer, `${fp}option.${opt.value}`);
              const detail = pick(layer, `${fp}option.${opt.value}.detail`);
              if (label === undefined && detail === undefined) return opt;
              return {
                ...opt,
                label: label ?? opt.label,
                detail: detail ?? opt.detail,
              };
            });
            const extra = pick(layer, `${fp}extraOptions`);
            if (Array.isArray(extra) && extra.length) {
              options = [...options, ...extra];
            }
          }
          let validate = f.validate;
          if (Array.isArray(validate)) {
            validate = validate.map((rule, i) => {
              const message = pick(layer, `${fp}validate.${i}`);
              return message !== undefined ? { ...rule, message } : rule;
            });
          }
          const label =
            labelClin !== undefined || labelPlain !== undefined
              ? {
                  clinical: labelClin ?? f.label?.clinical ?? f.label,
                  plain: labelPlain ?? f.label?.plain ?? f.label,
                }
              : f.label;
          const help =
            helpClin !== undefined || helpPlain !== undefined
              ? {
                  clinical: helpClin ?? f.help?.clinical ?? null,
                  plain: helpPlain ?? f.help?.plain ?? null,
                }
              : f.help;
          return {
            ...f,
            tooltip: tooltip !== undefined ? tooltip : f.tooltip,
            label,
            help,
            hidden: hidden === true && !f.required ? true : undefined,
            options,
            validate,
          };
        }),
      };
    }),
  };
}

function applyFaqLayer(faq, layer) {
  return faq.map((item, i) => ({
    q: pick(layer, `faq.${i}.q`) ?? item.q,
    a: pick(layer, `faq.${i}.a`) ?? item.a,
  }));
}

function applySuggestionLayer(rules, layer) {
  return rules.map((r) => ({
    ...r,
    suggest: pick(layer, `suggest.${r.id}`) ?? r.suggest,
  }));
}

function applyAssistantLayer(answers, fallback, layer, locale) {
  const list = answers.map((entry, i) => ({
    ...entry,
    match:
      locale === "es"
        ? [...entry.match, ...(esAssistantMatches[i] || [])]
        : entry.match,
    a: pick(layer, `assistant.${i}`) ?? entry.a,
  }));
  return { answers: list, fallback: pick(layer, "assistant.fallback") ?? fallback };
}

// Overrides for one locale: bare keys are English edits, "es:" keys Spanish.
function overridesFor(overrides, locale) {
  const out = {};
  const prefix = `${locale}:`;
  for (const [k, v] of Object.entries(overrides)) {
    if (locale === "en") {
      if (!k.includes(":")) out[k] = v;
    } else if (k.startsWith(prefix)) {
      out[k.slice(prefix.length)] = v;
    }
  }
  return out;
}

const ConfigContext = createContext(null);

export function ConfigProvider({ children }) {
  const [overrides, setOverrides] = useState(loadOverrides);
  const [locale, setLocaleState] = useState(initialLocale);

  // <html lang>, document title, and a shareable ?lang= follow the locale.
  useEffect(() => {
    document.documentElement.lang = locale;
    document.title = UI[locale].docTitle;
    try {
      localStorage.setItem(LOCALE_KEY, locale);
      const url = new URL(window.location.href);
      if (locale === "en") url.searchParams.delete("lang");
      else url.searchParams.set("lang", locale);
      window.history.replaceState(null, "", url.toString());
    } catch {
      /* demo only */
    }
  }, [locale]);

  const setLocale = useCallback((next) => {
    if (LOCALES.includes(next)) setLocaleState(next);
  }, []);

  // Admin edits land in the active locale's layer.
  const setOverride = useCallback(
    (key, value) => {
      const storedKey = locale === "en" ? key : `${locale}:${key}`;
      setOverrides((prev) => {
        const next = { ...prev };
        if (
          value === undefined ||
          value === null ||
          value === "" ||
          value === false ||
          (Array.isArray(value) && value.length === 0)
        )
          delete next[storedKey];
        else next[storedKey] = value;
        try {
          localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
        } catch {
          /* demo only */
        }
        return next;
      });
    },
    [locale]
  );

  const resetAll = useCallback(() => {
    setOverrides({});
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch {
      /* demo only */
    }
  }, []);

  const value = useMemo(() => {
    const localeOverrides = overridesFor(overrides, locale);
    // Spanish: base → Spanish content → Spanish admin edits.
    // English: base → English admin edits.
    const layer = locale === "es" ? { ...esContent, ...localeOverrides } : localeOverrides;
    const siteDefaults =
      locale === "es"
        ? {
            heroTitle: esContent["site.heroTitle"],
            heroLede: esContent["site.heroLede"],
            noticeText: esContent["site.noticeText"],
          }
        : defaultSiteContent;
    const assistant = applyAssistantLayer(assistantAnswers, assistantFallback, layer, locale);
    const strings = UI[locale];
    const t = (key, ...args) => {
      const v = strings[key] ?? UI.en[key];
      if (typeof v === "function") return v(...args);
      return v ?? key;
    };
    return {
      locale,
      setLocale,
      t,
      schema: applyLayer(baseSchema, layer),
      faq: applyFaqLayer(faqContent, layer),
      suggestions: applySuggestionLayer(suggestionRules, layer),
      assistant,
      site: {
        heroTitle: localeOverrides["site.heroTitle"] ?? siteDefaults.heroTitle,
        heroLede: localeOverrides["site.heroLede"] ?? siteDefaults.heroLede,
        noticeText: localeOverrides["site.noticeText"] ?? siteDefaults.noticeText,
      },
      siteDefaults,
      // The active locale's overrides, bare-keyed, so Admin reads them the same way in both languages.
      overrides: localeOverrides,
      setOverride,
      resetAll,
    };
  }, [overrides, locale, setLocale, setOverride, resetAll]);

  return <ConfigContext.Provider value={value}>{children}</ConfigContext.Provider>;
}

export function useConfig() {
  const ctx = useContext(ConfigContext);
  if (!ctx) throw new Error("useConfig must be used inside ConfigProvider");
  return ctx;
}

/** Interface strings for the active locale: const { t } = useT(); t("continue") */
export function useT() {
  const { t, locale } = useConfig();
  return { t, locale };
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
