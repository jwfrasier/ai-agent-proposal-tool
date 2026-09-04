# Amendment 0002 — impacts digest (posted 9/3/2026 4:59 pm ET; notice 440023c72e794374b4df5375068d1441)

**Deadline unchanged: Tue 9/8/2026 10:00 AM ET.** Files: `solicitation/amend2/` (SF30 + full Q&A re-issued; solicitation re-issued 9.3.2026). Word-level diff vs 8/31: only the items below changed.

| Change | Where | Package response |
|---|---|---|
| **PWS 1.13 (new):** form, customer satisfaction survey, landing page + navigation must support English and Spanish | Solicitation 9.3 | Tab 2-1 §1.6 cites PWS 1.13/PRS 19; 508 checklist 3.1 row; **prototype fully bilingual** (`?lang=es`, EN/ES header toggle; Spanish = content layer in the same schema, editable in Admin) |
| **PRS #19 Bilingual Support (new):** fully functional EN/ES; 100% correct field presentation/suppression across both submitter types; 100% inspection during Government acceptance testing | Solicitation 9.3 PRS | Acceptance scenario matrix runs both languages; prototype `es-e2e.js` exercises the provider error branch in Spanish |
| **Q116 answered:** 2,256,501 visits/yr; 22,016 reports/yr; 6,183 visits/day; 60 reports/day; ≈64 avg concurrent (15-min session); peaks several× higher; no baselines | Amend 2 Q&A | Tab 2-1 capacity paragraph (design point 10× avg concurrency, 20× surge headroom; first-30-day telemetry establishes the peak profile) |
| SF30 Amendment 0002 acknowledgment | Amend 2 p.1 | `out/Frasier-Digital-SF30-Amend0002-signed.pdf` (blocks 8, 15A/B/C), attachment 9; EMAIL-DRAFT acknowledges both amendments |
