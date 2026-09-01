// VAERS 2.0-derived form schema — public + healthcare-provider paths.
//
// Every label/help has { clinical, plain } variants (PWS 1.6.1).
// Branch rules implement PWS 1.6.2 / PRS#1: a provider reporting a vaccine
// administration error with NO adverse event never sees AE-related fields.
// `vaers` keys drive the structured-output mapping (PWS 1.9 / PRS#6).
// `required: "critical"` marks VAERS required/critical data elements (PRS#5).

const HAS_AE = {
  any: [
    { field: "submitterType", op: "eq", value: "public" },
    { field: "reportType", op: "in", value: ["adverse_event", "both"] },
  ],
};
const IS_PROVIDER = { field: "submitterType", op: "eq", value: "provider" };
const IS_ERROR = {
  all: [
    IS_PROVIDER,
    { field: "reportType", op: "in", value: ["vaccine_error_no_ae", "both"] },
  ],
};

const US_STATES = [
  { value: "AL", label: "Alabama" },
  { value: "AK", label: "Alaska" },
  { value: "AZ", label: "Arizona" },
  { value: "AR", label: "Arkansas" },
  { value: "CA", label: "California" },
  { value: "CO", label: "Colorado" },
  { value: "CT", label: "Connecticut" },
  { value: "DE", label: "Delaware" },
  { value: "DC", label: "District of Columbia" },
  { value: "FL", label: "Florida" },
  { value: "GA", label: "Georgia" },
  { value: "HI", label: "Hawaii" },
  { value: "ID", label: "Idaho" },
  { value: "IL", label: "Illinois" },
  { value: "IN", label: "Indiana" },
  { value: "IA", label: "Iowa" },
  { value: "KS", label: "Kansas" },
  { value: "KY", label: "Kentucky" },
  { value: "LA", label: "Louisiana" },
  { value: "ME", label: "Maine" },
  { value: "MD", label: "Maryland" },
  { value: "MA", label: "Massachusetts" },
  { value: "MI", label: "Michigan" },
  { value: "MN", label: "Minnesota" },
  { value: "MS", label: "Mississippi" },
  { value: "MO", label: "Missouri" },
  { value: "MT", label: "Montana" },
  { value: "NE", label: "Nebraska" },
  { value: "NV", label: "Nevada" },
  { value: "NH", label: "New Hampshire" },
  { value: "NJ", label: "New Jersey" },
  { value: "NM", label: "New Mexico" },
  { value: "NY", label: "New York" },
  { value: "NC", label: "North Carolina" },
  { value: "ND", label: "North Dakota" },
  { value: "OH", label: "Ohio" },
  { value: "OK", label: "Oklahoma" },
  { value: "OR", label: "Oregon" },
  { value: "PA", label: "Pennsylvania" },
  { value: "PR", label: "Puerto Rico" },
  { value: "RI", label: "Rhode Island" },
  { value: "SC", label: "South Carolina" },
  { value: "SD", label: "South Dakota" },
  { value: "TN", label: "Tennessee" },
  { value: "TX", label: "Texas" },
  { value: "UT", label: "Utah" },
  { value: "VT", label: "Vermont" },
  { value: "VA", label: "Virginia" },
  { value: "WA", label: "Washington" },
  { value: "WV", label: "West Virginia" },
  { value: "WI", label: "Wisconsin" },
  { value: "WY", label: "Wyoming" },
  { value: "GU", label: "Guam" },
  { value: "VI", label: "U.S. Virgin Islands" },
  { value: "AS", label: "American Samoa" },
  { value: "MP", label: "Northern Mariana Islands" },
  { value: "FR", label: "Foreign" },
];

export const baseSchema = {
  id: "vaers-modernized-demo",
  sections: [
    {
      id: "path",
      title: { clinical: "About this report", plain: "About this report" },
      fields: [
        {
          id: "submitterType",
          type: "radio-cards",
          required: "critical",
          vaers: "SUBMITTER_TYPE",
          label: {
            clinical: "Who is submitting this report?",
            plain: "Who is filling out this report?",
          },
          options: [
            {
              value: "public",
              label: "Patient, parent, or member of the public",
              detail:
                "You or someone you care for had a health problem after a vaccine. No medical training needed.",
            },
            {
              value: "provider",
              label: "Healthcare professional",
              detail:
                "You are a clinician, pharmacist, or vaccine administrator reporting for a patient.",
            },
          ],
          tooltip:
            "Your answer tailors the rest of the form. The public version uses everyday language; the professional version uses clinical terms.",
        },
        {
          id: "reportType",
          type: "radio-cards",
          required: "critical",
          vaers: "REPORT_TYPE",
          showIf: IS_PROVIDER,
          label: {
            clinical: "What are you reporting?",
            plain: "What are you reporting?",
          },
          options: [
            {
              value: "adverse_event",
              label: "An adverse event after vaccination",
              detail: "The patient experienced a health problem after a vaccine.",
            },
            {
              value: "vaccine_error_no_ae",
              label: "A vaccine administration error with no adverse event",
              detail:
                "Wrong dose, product, site, schedule, or storage issue, with no health problem for the patient. Adverse-event questions will be skipped.",
            },
            {
              value: "both",
              label: "An administration error AND an adverse event",
              detail: "Both an error occurred and the patient had a health problem.",
            },
          ],
          tooltip:
            "If you select an error with no adverse event, the form removes every adverse-event question so the report takes just a few minutes.",
        },
      ],
    },

    {
      id: "patient",
      title: { clinical: "Patient information", plain: "Who got the vaccine" },
      fields: [
        {
          id: "patientName",
          type: "text",
          required: "critical",
          vaers: "PATIENT_NAME",
          autocomplete: "name",
          label: {
            clinical: "Patient name (last, first)",
            plain: "Name of the person who got the vaccine",
          },
          help: {
            clinical: null,
            plain: "This can be you, your child, or someone you care for.",
          },
          tooltip:
            "VAERS keeps names confidential. Patient identity helps CDC and FDA follow up if more information is needed.",
        },
        {
          id: "dob",
          type: "date",
          required: "critical",
          vaers: "DATE_OF_BIRTH",
          label: { clinical: "Date of birth", plain: "Their date of birth" },
          validate: [
            { type: "dateNotFuture", message: "Date of birth can't be in the future." },
          ],
        },
        {
          id: "sex",
          type: "radio",
          required: "critical",
          vaers: "SEX",
          label: { clinical: "Sex", plain: "Sex" },
          options: [
            { value: "female", label: "Female" },
            { value: "male", label: "Male" },
            { value: "unknown", label: "Unknown" },
          ],
        },
        {
          id: "pregnant",
          type: "radio",
          vaers: "PREGNANT",
          showIf: { field: "sex", op: "eq", value: "female" },
          label: {
            clinical: "Pregnant at time of vaccination?",
            plain: "Was she pregnant when she got the vaccine?",
          },
          options: [
            { value: "yes", label: "Yes" },
            { value: "no", label: "No" },
            { value: "unknown", label: "Not sure" },
          ],
        },
        {
          id: "ageAtVax",
          type: "number",
          required: "critical",
          vaers: "AGE_YRS",
          label: {
            clinical: "Age at vaccination (years)",
            plain: "How old were they when they got the vaccine?",
          },
          validate: [
            {
              type: "pattern",
              pattern: "^\\d{1,3}$",
              message: "Enter age in years as a number (use 0 for under 1 year).",
            },
          ],
        },
        {
          id: "race",
          type: "checkboxes",
          vaers: "RACE",
          label: {
            clinical: "Race (select all that apply)",
            plain: "Race (optional, select all that apply)",
          },
          help: {
            clinical: null,
            plain: "This helps CDC make sure vaccine safety monitoring covers everyone.",
          },
          options: [
            { value: "aian", label: "American Indian or Alaska Native" },
            { value: "asian", label: "Asian" },
            { value: "black", label: "Black or African American" },
            { value: "nhpi", label: "Native Hawaiian or Other Pacific Islander" },
            { value: "white", label: "White" },
            { value: "other", label: "Other" },
            { value: "unknown", label: "Prefer not to say / unknown" },
          ],
        },
        {
          id: "ethnicity",
          type: "radio",
          vaers: "ETHNICITY",
          label: {
            clinical: "Ethnicity",
            plain: "Ethnicity (optional)",
          },
          options: [
            { value: "hispanic", label: "Hispanic or Latino" },
            { value: "not_hispanic", label: "Not Hispanic or Latino" },
            { value: "unknown", label: "Prefer not to say / unknown" },
          ],
        },
        {
          id: "patientAddress",
          type: "text",
          required: true,
          vaers: "PATIENT_ADDRESS",
          autocomplete: "street-address",
          label: {
            clinical: "Address (street, city, ZIP)",
            plain: "Their home address",
          },
        },
        {
          id: "patientState",
          type: "select",
          required: true,
          vaers: "STATE",
          label: { clinical: "State", plain: "State" },
          options: US_STATES,
        },
        {
          id: "patientPhone",
          type: "tel",
          vaers: "PATIENT_PHONE",
          autocomplete: "tel",
          label: { clinical: "Phone number", plain: "Phone number (if any)" },
        },
        {
          id: "patientEmail",
          type: "email",
          vaers: "PATIENT_EMAIL",
          autocomplete: "email",
          label: { clinical: "Email address", plain: "Email address (if any)" },
          validate: [
            {
              type: "pattern",
              pattern: "^[^@\\s]+@[^@\\s]+\\.[^@\\s]+$",
              message: "Enter an email like name@example.com.",
            },
          ],
        },
      ],
    },

    {
      id: "vaccine",
      title: { clinical: "Vaccine details", plain: "About the vaccine" },
      fields: [
        {
          id: "vaxDate",
          type: "date",
          required: "critical",
          vaers: "VAX_DATE",
          label: {
            clinical: "Date of vaccination",
            plain: "What day was the vaccine given?",
          },
          validate: [
            { type: "dateNotFuture", message: "Vaccination date can't be in the future." },
          ],
          tooltip:
            "An exact date matters most. If you're not sure, your vaccination card, pharmacy receipt, or patient portal will have it.",
        },
        {
          id: "vaxTime",
          type: "time",
          vaers: "VAX_TIME",
          label: {
            clinical: "Time of vaccination (if known)",
            plain: "About what time of day was it given? (optional)",
          },
        },
        {
          id: "vaccineName",
          type: "select",
          required: "critical",
          vaers: "VAX_TYPE",
          label: {
            clinical: "Vaccine (type / brand)",
            plain: "Which vaccine was it?",
          },
          help: {
            clinical: null,
            plain: "Check the vaccination card or ask the place that gave it.",
          },
          options: [
            { value: "covid19", label: "COVID-19" },
            { value: "influenza", label: "Influenza (flu)" },
            { value: "mmr", label: "MMR (measles, mumps, rubella)" },
            { value: "tdap", label: "Tdap (tetanus, diphtheria, pertussis)" },
            { value: "hpv", label: "HPV" },
            { value: "shingles", label: "Shingles (zoster)" },
            { value: "pneumococcal", label: "Pneumococcal" },
            { value: "hepb", label: "Hepatitis B" },
            { value: "rsv", label: "RSV" },
            { value: "other", label: "Other / not sure" },
          ],
        },
        {
          id: "vaccineBrand",
          type: "text",
          vaers: "VAX_NAME",
          label: {
            clinical: "Brand name (as recorded)",
            plain: "Brand name, if you know it",
          },
        },
        {
          id: "manufacturer",
          type: "text",
          required: true,
          vaers: "VAX_MANU",
          label: {
            clinical: "Manufacturer",
            plain: "Who makes it? (if you know)",
          },
        },
        {
          id: "lotNumber",
          type: "text",
          vaers: "VAX_LOT",
          label: {
            clinical: "Lot number",
            plain: "Lot number (from the vaccination card, if you have it)",
          },
          tooltip:
            "The lot number ties a report to a specific batch of vaccine, one of the most valuable fields for safety monitoring. It's printed on the vaccination card or the provider's record.",
        },
        {
          id: "doseNumber",
          type: "select",
          vaers: "VAX_DOSE_SERIES",
          label: {
            clinical: "Dose number in series",
            plain: "Which dose was this?",
          },
          options: [
            { value: "1", label: "1st" },
            { value: "2", label: "2nd" },
            { value: "3", label: "3rd" },
            { value: "4+", label: "4th or later" },
            { value: "unknown", label: "Not sure" },
          ],
        },
        {
          id: "route",
          type: "select",
          vaers: "VAX_ROUTE",
          showIf: IS_PROVIDER,
          label: { clinical: "Route of administration", plain: "Route" },
          options: [
            { value: "IM", label: "Intramuscular (IM)" },
            { value: "SC", label: "Subcutaneous (SC)" },
            { value: "ID", label: "Intradermal (ID)" },
            { value: "IN", label: "Intranasal (IN)" },
            { value: "PO", label: "Oral (PO)" },
            { value: "other", label: "Other" },
          ],
        },
        {
          id: "bodySite",
          type: "select",
          vaers: "VAX_SITE",
          showIf: IS_PROVIDER,
          label: { clinical: "Body site", plain: "Body site" },
          options: [
            { value: "LA", label: "Left arm" },
            { value: "RA", label: "Right arm" },
            { value: "LL", label: "Left leg" },
            { value: "RL", label: "Right leg" },
            { value: "other", label: "Other / unknown" },
          ],
        },
        {
          id: "otherVaccines",
          type: "textarea",
          vaers: "OTHER_VAX_4WK",
          label: {
            clinical: "Other vaccines administered within 4 weeks prior",
            plain: "Any other vaccines in the 4 weeks before this one?",
          },
          help: {
            clinical: "Include product, date, and site if known.",
            plain: "If none, leave this blank.",
          },
        },
        {
          id: "facilityName",
          type: "text",
          required: true,
          vaers: "VAX_FACILITY",
          label: {
            clinical: "Facility where vaccine was administered",
            plain: "Where was the vaccine given? (doctor's office, pharmacy, clinic…)",
          },
        },
        {
          id: "facilityType",
          type: "select",
          vaers: "VAX_FACILITY_TYPE",
          showIf: IS_PROVIDER,
          label: { clinical: "Facility type", plain: "Facility type" },
          options: [
            { value: "doctor_office", label: "Doctor's office / clinic" },
            { value: "hospital", label: "Hospital" },
            { value: "pharmacy", label: "Pharmacy" },
            { value: "public_health", label: "Public health clinic" },
            { value: "workplace", label: "Workplace clinic" },
            { value: "school", label: "School / student health" },
            { value: "other", label: "Other" },
          ],
        },
        {
          id: "bestDoctor",
          type: "text",
          vaers: "BEST_DOCTOR",
          label: {
            clinical: "Best doctor or healthcare professional to contact about this event (name, phone)",
            plain: "A doctor or clinic we could ask about what happened (optional)",
          },
          tooltip:
            "Used only if CDC or FDA safety staff need clinical details to complete the review.",
        },
      ],
    },

    {
      id: "error",
      title: {
        clinical: "Vaccine administration error",
        plain: "Vaccine administration error",
      },
      showIf: IS_ERROR,
      fields: [
        {
          id: "errorType",
          type: "checkboxes",
          required: "critical",
          vaers: "ERROR_TYPE",
          label: {
            clinical: "Type of administration error (select all that apply)",
            plain: "Type of administration error (select all that apply)",
          },
          options: [
            { value: "wrong_product", label: "Wrong vaccine or product given" },
            { value: "wrong_dose", label: "Incorrect dose (too much / too little)" },
            { value: "wrong_route", label: "Wrong route or body site" },
            { value: "wrong_schedule", label: "Given outside recommended schedule / interval" },
            { value: "expired", label: "Expired or improperly stored product" },
            { value: "wrong_patient", label: "Wrong patient / mix-up" },
            { value: "other_error", label: "Other error" },
          ],
        },
        {
          id: "errorDescription",
          type: "textarea",
          required: "critical",
          vaers: "ERROR_DESCRIPTION",
          label: {
            clinical: "Describe the error and how it was identified",
            plain: "Describe the error and how it was identified",
          },
          help: {
            clinical:
              "Include what was intended, what occurred, and any corrective action taken.",
            plain: null,
          },
        },
      ],
    },

    {
      id: "event",
      title: {
        clinical: "Adverse event",
        plain: "What happened after the vaccine",
      },
      showIf: HAS_AE,
      suppressedNote:
        "Adverse-event questions are hidden because this report is an administration error with no adverse event.",
      fields: [
        {
          id: "symptoms",
          type: "textarea",
          required: "critical",
          vaers: "SYMPTOM_TEXT",
          label: {
            clinical: "Describe the adverse event(s), treatment, and outcome",
            plain: "Tell us what happened. What symptoms did they have?",
          },
          help: {
            clinical:
              "Signs, symptoms, time course, clinically relevant treatment, and current status.",
            plain:
              "Describe it in your own words: what you noticed, when it started, and how it went. You don't need medical terms.",
          },
          tooltip:
            "This is the single most important field in the report. More detail, even in everyday words, makes the report more useful to CDC and FDA safety scientists.",
        },
        {
          id: "onsetDate",
          type: "date",
          required: "critical",
          vaers: "ONSET_DATE",
          label: {
            clinical: "Date adverse event started",
            plain: "What day did the symptoms start?",
          },
          validate: [
            { type: "dateNotFuture", message: "Onset date can't be in the future." },
            {
              type: "dateAfterField",
              field: "vaxDate",
              message:
                "The symptom start date is before the vaccination date. Double-check both dates.",
            },
          ],
        },
        {
          id: "outcomes",
          type: "checkboxes",
          required: "critical",
          vaers: "OUTCOMES",
          label: {
            clinical: "Adverse event outcomes (select all that apply)",
            plain: "Did any of these happen? (select all that apply)",
          },
          options: [
            { value: "er_visit", label: "Emergency room or urgent care visit" },
            { value: "doctor_visit", label: "Doctor or clinic visit" },
            { value: "hospitalization", label: "Hospitalization" },
            { value: "prolonged_hosp", label: "Existing hospital stay was prolonged" },
            { value: "life_threatening", label: "Life-threatening event" },
            { value: "disability", label: "Disability or permanent damage" },
            { value: "birth_defect", label: "Congenital anomaly / birth defect" },
            { value: "death", label: "Patient died" },
            { value: "none", label: "None of the above" },
          ],
          tooltip:
            "These checkboxes determine whether the report is classified as serious under federal regulations.",
        },
        {
          id: "hospDays",
          type: "number",
          required: true,
          vaers: "HOSPDAYS",
          showIf: { field: "outcomes", op: "includes", value: "hospitalization" },
          label: {
            clinical: "Number of days hospitalized",
            plain: "How many days were they in the hospital?",
          },
          validate: [
            {
              type: "pattern",
              pattern: "^\\d{1,3}$",
              message: "Enter the number of days as a number.",
            },
          ],
        },
        {
          id: "deathDate",
          type: "date",
          required: true,
          vaers: "DEATH_DATE",
          showIf: { field: "outcomes", op: "includes", value: "death" },
          label: { clinical: "Date of death", plain: "Date of death" },
        },
        {
          id: "recovered",
          type: "radio",
          required: true,
          vaers: "RECOVERED",
          label: {
            clinical: "Has the patient recovered?",
            plain: "Have they gotten better?",
          },
          options: [
            { value: "yes", label: "Yes" },
            { value: "no", label: "No" },
            { value: "unknown", label: "Not sure" },
          ],
        },
        {
          id: "labs",
          type: "textarea",
          vaers: "LAB_DATA",
          label: {
            clinical: "Relevant diagnostic tests / laboratory data",
            plain: "Any medical tests related to what happened? (optional)",
          },
          help: {
            clinical: "Include dates and results.",
            plain: "For example blood tests or scans. Leave blank if none or not sure.",
          },
        },
      ],
    },

    {
      id: "health",
      title: {
        clinical: "Medical background",
        plain: "Health background",
      },
      showIf: HAS_AE,
      fields: [
        {
          id: "conditions",
          type: "textarea",
          vaers: "MEDICAL_HISTORY",
          label: {
            clinical: "Chronic or long-standing health conditions",
            plain: "Any ongoing health conditions? (asthma, diabetes, etc.)",
          },
          help: { clinical: null, plain: "If none, leave this blank." },
        },
        {
          id: "allergies",
          type: "textarea",
          vaers: "ALLERGIES",
          label: {
            clinical: "Allergies to medications, food, or other products",
            plain: "Any allergies? (medicines, foods, latex…)",
          },
        },
        {
          id: "medications",
          type: "textarea",
          vaers: "MEDICATIONS",
          label: {
            clinical: "Medications at time of vaccination",
            plain: "What medicines were they taking when they got the vaccine?",
          },
          help: {
            clinical: "Include prescriptions, OTC, supplements.",
            plain: "Include vitamins and over-the-counter medicines too.",
          },
        },
        {
          id: "illness",
          type: "textarea",
          vaers: "ILLNESS_AT_VAX",
          label: {
            clinical: "Illness at time of vaccination (or within 1 month prior)",
            plain: "Were they sick around the time of the vaccine?",
          },
        },
        {
          id: "priorAE",
          type: "radio",
          vaers: "PRIOR_AE",
          label: {
            clinical: "History of adverse events following prior vaccination?",
            plain: "Have they ever had a reaction to a vaccine before?",
          },
          options: [
            { value: "yes", label: "Yes" },
            { value: "no", label: "No" },
            { value: "unknown", label: "Not sure" },
          ],
        },
        {
          id: "priorAEDetails",
          type: "textarea",
          required: true,
          vaers: "PRIOR_VAX",
          showIf: { field: "priorAE", op: "eq", value: "yes" },
          label: {
            clinical: "Describe the prior adverse event (event, vaccine, dose in series, age at the time)",
            plain: "Tell us about that earlier reaction (what happened, which vaccine, how old they were)",
          },
        },
      ],
    },

    {
      id: "docs",
      title: {
        clinical: "Supporting documents",
        plain: "Supporting documents",
      },
      fields: [
        {
          id: "uploads",
          type: "upload",
          vaers: "ATTACHMENTS",
          label: {
            clinical: "Upload medical records or vaccine documents",
            plain: "Add records if you have them (optional)",
          },
          help: {
            clinical:
              "Phase 1 accepts medical records and vaccine documents related to the vaccination or the reported event.",
            plain:
              "Things like a visit summary, vaccination record, or discharge paperwork. You can also add documents later; reports are useful with or without them.",
          },
        },
        {
          id: "additionalInfo",
          type: "textarea",
          vaers: "FREE_TEXT",
          label: {
            clinical: "Additional information (free text)",
            plain: "Anything else you want to tell us?",
          },
        },
      ],
    },

    {
      id: "reporter",
      title: {
        clinical: "About you (person completing this form)",
        plain: "About you",
      },
      fields: [
        {
          id: "reporterName",
          type: "text",
          required: "critical",
          vaers: "REPORTER_NAME",
          autocomplete: "name",
          label: { clinical: "Your name", plain: "Your name" },
        },
        {
          id: "reporterRelation",
          type: "select",
          required: true,
          vaers: "REPORTER_RELATION",
          showIf: { field: "submitterType", op: "eq", value: "public" },
          label: {
            clinical: "Relationship to patient",
            plain: "Who are you to the person who got the vaccine?",
          },
          options: [
            { value: "self", label: "I am the patient" },
            { value: "parent", label: "Parent or guardian" },
            { value: "family", label: "Other family member" },
            { value: "other", label: "Other" },
          ],
        },
        {
          id: "reporterCredentials",
          type: "select",
          required: true,
          vaers: "REPORTER_TYPE",
          showIf: IS_PROVIDER,
          label: { clinical: "Professional role", plain: "Professional role" },
          options: [
            { value: "md_do", label: "Physician (MD/DO)" },
            { value: "np_pa", label: "NP / PA" },
            { value: "rn", label: "Nurse (RN/LPN)" },
            { value: "pharmacist", label: "Pharmacist" },
            { value: "other_hcp", label: "Other healthcare professional" },
          ],
        },
        {
          id: "reporterPhone",
          type: "tel",
          required: true,
          vaers: "REPORTER_PHONE",
          autocomplete: "tel",
          label: { clinical: "Phone number", plain: "Phone number" },
          tooltip:
            "Used only if CDC or FDA follow-up is needed to complete the safety review.",
        },
        {
          id: "reporterEmail",
          type: "email",
          required: true,
          vaers: "REPORTER_EMAIL",
          autocomplete: "email",
          label: { clinical: "Email address", plain: "Email address" },
          validate: [
            {
              type: "pattern",
              pattern: "^[^@\\s]+@[^@\\s]+\\.[^@\\s]+$",
              message: "Enter an email like name@example.com.",
            },
          ],
        },
        {
          id: "attestation",
          type: "checkboxes",
          required: "critical",
          vaers: "ATTESTATION",
          label: {
            clinical: "Certification",
            plain: "Before you send",
          },
          options: [
            {
              value: "true_correct",
              label:
                "The information in this report is true and correct to the best of my knowledge.",
            },
          ],
        },
      ],
    },
  ],
};

// ---------------------------------------------------------------------------
// FAQ content — surfaces on the FAQ page AND as reactive popups in the form.
export const faqContent = [
  {
    q: "What is VAERS?",
    a: "The Vaccine Adverse Event Reporting System is the national early-warning system co-managed by CDC and FDA. Anyone can report a health problem that happened after a vaccination: patients, family members, and healthcare professionals.",
  },
  {
    q: "Does reporting mean the vaccine caused the problem?",
    a: "No. A VAERS report does not mean the vaccine caused the event, only that the event happened after vaccination. Scientists use the pattern of reports to detect possible safety signals for deeper study.",
  },
  {
    q: "Do I need medical records to submit a report?",
    a: "No. Submit what you know; a report is valuable even without documents. You can add records now or after you submit.",
  },
  {
    q: "Is my information kept private?",
    a: "Yes. Personal identifying information is kept confidential and protected under federal privacy law. Public VAERS data releases never include names or contact information.",
  },
  {
    q: "How long does a report take?",
    a: "Most people finish in under 10 minutes. Your progress is saved on your device as you go, so you can step away and come back.",
  },
  {
    q: "Who is required to report?",
    a: "Healthcare providers are required by law to report certain adverse events after vaccination, and vaccine manufacturers must report all adverse events that come to their attention. Everyone else is encouraged to report anything of concern.",
  },
  {
    q: "What is a vaccine administration error?",
    a: "An error in how a vaccine was given: wrong dose, product, site, schedule, or storage. Healthcare professionals can report an error even when the patient had no health problem, and the form skips all adverse-event questions in that case.",
  },
];

// ---------------------------------------------------------------------------
// Supplemental-document suggestion rules (PWS 2.3 / PRS#10) — rule-based scan
// of the entered submission; provider path only.
export const suggestionRules = [
  {
    id: "hospital-records",
    when: { field: "outcomes", op: "includes", value: "hospitalization" },
    suggest:
      "Hospital discharge summary for the admission related to this event",
  },
  {
    id: "er-records",
    when: { field: "outcomes", op: "includes", value: "er_visit" },
    suggest: "Emergency department visit note",
  },
  {
    id: "death-records",
    when: { field: "outcomes", op: "includes", value: "death" },
    suggest: "Death certificate and autopsy report, if performed",
  },
  {
    id: "lab-results",
    when: { field: "labs", op: "truthy" },
    suggest: "Laboratory or diagnostic test results you referenced",
  },
  {
    id: "vax-record-error",
    when: {
      field: "reportType",
      op: "in",
      value: ["vaccine_error_no_ae", "both"],
    },
    suggest:
      "Vaccine administration record showing product, lot, dose, and site",
  },
  {
    id: "lot-doc",
    when: { field: "errorType", op: "includes", value: "expired" },
    suggest: "Storage/temperature log or product expiration documentation",
  },
  {
    id: "office-visit",
    when: { field: "outcomes", op: "includes", value: "doctor_visit" },
    suggest: "Office visit note documenting evaluation of the event",
  },
];

// ---------------------------------------------------------------------------
// Scripted assistant knowledge base (demonstration; production implementation
// targets CDC's FedRAMP Azure OpenAI service in the EDAV environment).
export const assistantAnswers = [
  {
    match: ["lot", "lot number"],
    a: "The lot number is printed on the vaccination card you received, and the clinic or pharmacy that gave the vaccine also has it on record. If you can't find it, leave it blank; you can still submit.",
  },
  {
    match: ["required", "have to", "skip", "leave blank"],
    a: "Fields marked with a red asterisk are needed to process the report. Everything else is optional: submit what you know. The completeness meter on this page shows what's still missing.",
  },
  {
    match: ["privacy", "private", "confidential", "who sees"],
    a: "Personal information in VAERS reports is confidential and protected under federal privacy law. Published VAERS data never includes names or contact details.",
  },
  {
    match: ["cause", "caused", "prove"],
    a: "Submitting a report doesn't require knowing whether the vaccine caused the problem. Report anything of concern that happened after vaccination, and safety scientists analyze the patterns.",
  },
  {
    match: ["save", "later", "come back", "resume"],
    a: "Your progress is saved on this device automatically. You can close this page and pick up where you left off.",
  },
  {
    match: ["error", "wrong dose", "administration"],
    a: "Healthcare professionals can report a vaccine administration error even if no health problem occurred. Choose 'administration error with no adverse event' at the start and the form skips all adverse-event questions.",
  },
  {
    match: ["document", "upload", "records", "photo", "picture", "image"],
    a: "You can attach medical records or vaccine documents (PDF or document files). Photos and medical images aren't accepted in this phase. Documents are optional; reports are useful without them.",
  },
  {
    match: ["serious", "hospital", "emergency"],
    a: "If this is a medical emergency, call 911 or contact a healthcare provider now; VAERS is a reporting system, not a medical service. For the report, check every outcome that applies. Those answers classify the report's seriousness.",
  },
];

export const assistantFallback =
  "I can help with questions about filling out this report, for example \"where do I find the lot number?\" or \"which fields are required?\". For medical advice, contact a healthcare provider.";
