// Branch-condition evaluator for the schema-driven form engine.
// A condition is { field, op, value } or { all: [...] } / { any: [...] }.
// Ops: eq, neq, in, notIn, truthy, includes (for checkbox arrays).

export function evaluateCondition(cond, answers) {
  if (!cond) return true;
  if (cond.all) return cond.all.every((c) => evaluateCondition(c, answers));
  if (cond.any) return cond.any.some((c) => evaluateCondition(c, answers));

  const actual = answers[cond.field];
  switch (cond.op) {
    case "eq":
      return actual === cond.value;
    case "neq":
      return actual !== cond.value;
    case "in":
      return cond.value.includes(actual);
    case "notIn":
      return !cond.value.includes(actual);
    case "truthy":
      return Boolean(actual) && (!Array.isArray(actual) || actual.length > 0);
    case "includes":
      return Array.isArray(actual) && actual.includes(cond.value);
    default:
      return true;
  }
}

export function visibleSections(schema, answers) {
  return schema.sections
    .filter((s) => evaluateCondition(s.showIf, answers))
    .map((s) => ({
      ...s,
      fields: s.fields.filter(
        (f) => !f.hidden && evaluateCondition(f.showIf, answers)
      ),
    }));
}

function isAnswered(field, answers) {
  const v = answers[field.id];
  if (v === undefined || v === null) return false;
  if (typeof v === "string") return v.trim() !== "";
  if (Array.isArray(v)) return v.length > 0;
  return true;
}

// Completeness across currently-visible required fields.
// `critical` fields are the VAERS required/critical data elements (PRS#5);
// `required` are form-required. Both count toward the meter.
export function completeness(schema, answers) {
  const sections = visibleSections(schema, answers);
  const perSection = sections.map((s) => {
    const tracked = s.fields.filter((f) => f.required);
    const done = tracked.filter((f) => isAnswered(f, answers));
    return {
      id: s.id,
      title: s.title,
      total: tracked.length,
      done: done.length,
    };
  });
  const total = perSection.reduce((n, s) => n + s.total, 0);
  const done = perSection.reduce((n, s) => n + s.done, 0);
  const critical = sections
    .flatMap((s) => s.fields)
    .filter((f) => f.required === "critical");
  const criticalDone = critical.filter((f) => isAnswered(f, answers));
  return {
    pct: total === 0 ? 0 : Math.round((done / total) * 100),
    total,
    done,
    criticalTotal: critical.length,
    criticalDone: criticalDone.length,
    perSection,
  };
}

// Field-level validation. Returns a message or null.
export function validateField(field, value, answers) {
  const empty =
    value === undefined ||
    value === null ||
    (typeof value === "string" && value.trim() === "") ||
    (Array.isArray(value) && value.length === 0);
  if (field.required && empty) {
    return field.requiredMessage || "This information is needed for your report.";
  }
  if (empty) return null;
  if (field.validate) {
    for (const rule of field.validate) {
      if (rule.type === "pattern" && !new RegExp(rule.pattern).test(value)) {
        return rule.message;
      }
      if (rule.type === "dateNotFuture" && value > todayISO()) {
        return rule.message || "This date can't be in the future.";
      }
      if (
        rule.type === "dateAfterField" &&
        answers[rule.field] &&
        value < answers[rule.field]
      ) {
        return rule.message;
      }
    }
  }
  return null;
}

export function validateSection(section, answers) {
  const errors = {};
  for (const f of section.fields) {
    const msg = validateField(f, answers[f.id], answers);
    if (msg) errors[f.id] = msg;
  }
  return errors;
}

export function todayISO() {
  return new Date().toISOString().slice(0, 10);
}

// Build the VAERS-compatible structured output (PWS 1.9 / PRS#6).
// Mirrors the shape of the published VAERS datasets: VAERSDATA-style flags
// and column names, a VAERSVAX-style vaccine row, and a confidential section
// for the identifiers that never appear in public data releases — the same
// de-identification split the real system applies.

const outcomeFlag = (answers, value) =>
  Array.isArray(answers.outcomes) && answers.outcomes.includes(value)
    ? "Y"
    : "";

const VAX_TYPE_CODES = {
  covid19: "COVID19",
  influenza: "FLU",
  mmr: "MMR",
  tdap: "TDAP",
  hpv: "HPV9",
  shingles: "VARZOS",
  pneumococcal: "PNC",
  hepb: "HEP",
  rsv: "RSV",
  other: "UNK",
};

const V_ADMINBY_CODES = {
  doctor_office: "PVT",
  hospital: "PVT",
  pharmacy: "PHM",
  public_health: "PUB",
  workplace: "WRK",
  school: "SCH",
  other: "OTH",
};

const RECOVD_CODES = { yes: "Y", no: "N", unknown: "U" };
const SEX_CODES = { female: "F", male: "M", unknown: "U" };

function daysBetween(a, b) {
  if (!a || !b) return null;
  const ms = new Date(b) - new Date(a);
  return Number.isFinite(ms) && ms >= 0 ? Math.round(ms / 86_400_000) : null;
}

const clean = (obj) =>
  Object.fromEntries(
    Object.entries(obj).filter(
      ([, v]) => v !== undefined && v !== null && v !== ""
    )
  );

export function buildStructuredOutput(schema, answers) {
  const a = answers;
  const noAe =
    a.submitterType === "provider" && a.reportType === "vaccine_error_no_ae";
  const today = new Date().toISOString().slice(0, 10);

  // Public-dataset-shaped record (VAERSDATA.csv column names)
  const VAERSDATA = clean({
    RECVDATE: today,
    STATE: a.patientState,
    AGE_YRS: a.ageAtVax !== undefined ? Number(a.ageAtVax) : undefined,
    SEX: SEX_CODES[a.sex],
    SYMPTOM_TEXT: noAe
      ? [
          "Vaccine administration error with no adverse event.",
          Array.isArray(a.errorType) ? `Error type(s): ${a.errorType.join(", ")}.` : "",
          a.errorDescription || "",
        ]
          .filter(Boolean)
          .join(" ")
      : a.symptoms,
    DIED: outcomeFlag(a, "death"),
    DATEDIED: a.deathDate,
    L_THREAT: outcomeFlag(a, "life_threatening"),
    ER_ED_VISIT: outcomeFlag(a, "er_visit"),
    OFC_VISIT: outcomeFlag(a, "doctor_visit"),
    HOSPITAL: outcomeFlag(a, "hospitalization"),
    HOSPDAYS: a.hospDays !== undefined ? Number(a.hospDays) : undefined,
    X_STAY: outcomeFlag(a, "prolonged_hosp"),
    DISABLE: outcomeFlag(a, "disability"),
    BIRTH_DEFECT: outcomeFlag(a, "birth_defect"),
    RECOVD: noAe ? undefined : RECOVD_CODES[a.recovered],
    VAX_DATE: a.vaxDate,
    ONSET_DATE: a.onsetDate,
    NUMDAYS: daysBetween(a.vaxDate, a.onsetDate) ?? undefined,
    LAB_DATA: a.labs,
    V_ADMINBY: V_ADMINBY_CODES[a.facilityType] || (a.facilityName ? "UNK" : undefined),
    OTHER_MEDS: a.medications,
    CUR_ILL: a.illness,
    HISTORY: a.conditions,
    PRIOR_VAX: a.priorAE === "yes" ? a.priorAEDetails || "Y" : undefined,
    ALLERGIES: a.allergies,
    FORM_VERS: 2,
    TODAYS_DATE: today,
  });

  // Vaccine row (VAERSVAX.csv column names)
  const VAERSVAX = clean({
    VAX_TYPE: VAX_TYPE_CODES[a.vaccineName],
    VAX_MANU: a.manufacturer,
    VAX_LOT: a.lotNumber,
    VAX_DOSE_SERIES: a.doseNumber,
    VAX_ROUTE: a.route,
    VAX_SITE: a.bodySite,
    VAX_NAME: a.vaccineBrand,
  });

  // Identifiers and contact information: collected on the form, never
  // included in public VAERS data releases.
  const CONFIDENTIAL_NOT_IN_PUBLIC_DATA = clean({
    PATIENT_NAME: a.patientName,
    DATE_OF_BIRTH: a.dob,
    PATIENT_ADDRESS: a.patientAddress,
    PATIENT_PHONE: a.patientPhone,
    PATIENT_EMAIL: a.patientEmail,
    PREGNANT: a.pregnant,
    RACE: Array.isArray(a.race) ? a.race.join(";") : a.race,
    ETHNICITY: a.ethnicity,
    VAX_TIME: a.vaxTime,
    FACILITY_NAME: a.facilityName,
    BEST_DOCTOR: a.bestDoctor,
    OTHER_VAX_4WK: a.otherVaccines,
    ERROR_TYPE: Array.isArray(a.errorType) ? a.errorType.join(";") : undefined,
    ERROR_DESCRIPTION: a.errorDescription,
    FREE_TEXT: a.additionalInfo,
    ATTACHMENT_COUNT: Array.isArray(a.uploads) ? a.uploads.length : undefined,
    REPORTER_NAME: a.reporterName,
    REPORTER_RELATION: a.reporterRelation,
    REPORTER_TYPE: a.reporterCredentials,
    REPORTER_PHONE: a.reporterPhone,
    REPORTER_EMAIL: a.reporterEmail,
  });

  return {
    reportMeta: {
      schema: "VAERS-2.0-compatible/demo",
      generated: new Date().toISOString(),
      submitterPath: a.submitterType || "unknown",
      reportType: a.reportType || "adverse_event",
      demonstration: true,
      note: "Synthetic demonstration record. No data transmitted or stored. Field names mirror the published VAERS data dictionary (VAERSDATA/VAERSVAX); identifiers are grouped separately, matching the public-release de-identification split.",
    },
    VAERSDATA,
    VAERSVAX: [VAERSVAX],
    CONFIDENTIAL_NOT_IN_PUBLIC_DATA,
  };
}
