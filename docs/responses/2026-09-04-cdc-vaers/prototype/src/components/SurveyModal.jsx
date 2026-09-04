// Customer-satisfaction survey (PWS 1.5 site navigation + 1.7 post-submission,
// PRS#7). Demonstration: responses acknowledged, not stored.

import { useEffect, useRef, useState } from "react";
import { useT } from "../engine/store.jsx";

export function SurveyModal({ title, prompt, onClose }) {
  const { t } = useT();
  const [rating, setRating] = useState(null);
  const [comment, setComment] = useState("");
  const [done, setDone] = useState(false);
  const dialogRef = useRef(null);

  useEffect(() => {
    const opener = document.activeElement;
    dialogRef.current?.focus();
    // Everything behind the dialog is inert while it is open.
    const overlay = dialogRef.current?.parentElement;
    const siblings = overlay ? [...overlay.parentElement.children].filter((el) => el !== overlay) : [];
    siblings.forEach((el) => el.setAttribute("inert", ""));
    function onKey(e) {
      if (e.key === "Escape") onClose();
      if (e.key === "Tab") {
        // keep keyboard focus inside the dialog
        const focusables = dialogRef.current?.querySelectorAll(
          "button, textarea, input, [tabindex]:not([tabindex='-1'])"
        );
        if (!focusables?.length) return;
        const first = focusables[0];
        const last = focusables[focusables.length - 1];
        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault();
          last.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      }
    }
    window.addEventListener("keydown", onKey);
    return () => {
      window.removeEventListener("keydown", onKey);
      siblings.forEach((el) => el.removeAttribute("inert"));
      opener?.focus?.();
    };
  }, [onClose]);

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div
        className="modal"
        role="dialog"
        aria-modal="true"
        aria-label={title}
        tabIndex={-1}
        ref={dialogRef}
        onClick={(e) => e.stopPropagation()}
      >
        {done ? (
          <>
            <h2>{t("thankYou")}</h2>
            <p style={{ fontSize: "var(--fs-sm)", color: "var(--c-ink-soft)" }}>
              {t("surveyRecorded")}
            </p>
            <div className="form-nav">
              <button type="button" className="btn" onClick={onClose}>
                {t("close")}
              </button>
            </div>
          </>
        ) : (
          <>
            <h2>{title}</h2>
            <p style={{ fontSize: "var(--fs-sm)", color: "var(--c-ink-soft)" }}>
              {prompt}
            </p>
            <div
              className="rating-row"
              role="group"
              aria-label={t("ratingGroup")}
            >
              {[1, 2, 3, 4, 5].map((n) => (
                <button
                  key={n}
                  type="button"
                  aria-pressed={rating === n}
                  aria-label={t("outOf5", n)}
                  onClick={() => setRating(n)}
                >
                  {n}
                </button>
              ))}
            </div>
            <div className="field" style={{ maxWidth: "none" }}>
              <label className="field-label" htmlFor="survey-comment">
                {t("surveyComment")}
              </label>
              <textarea
                id="survey-comment"
                value={comment}
                style={{ minHeight: "4.5rem" }}
                onChange={(e) => setComment(e.target.value)}
              />
            </div>
            <div className="form-nav" style={{ marginTop: 0 }}>
              <button
                type="button"
                className="btn"
                disabled={rating === null}
                onClick={() => setDone(true)}
              >
                {t("sendFeedback")}
              </button>
              <button type="button" className="btn ghost" onClick={onClose}>
                {t("noThanks")}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
