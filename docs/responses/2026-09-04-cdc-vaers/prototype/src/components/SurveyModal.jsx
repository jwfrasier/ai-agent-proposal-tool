// Customer-satisfaction survey (PWS 1.5 site navigation + 1.7 post-submission,
// PRS#7). Demonstration: responses acknowledged, not stored.

import { useEffect, useRef, useState } from "react";

export function SurveyModal({ title, prompt, onClose }) {
  const [rating, setRating] = useState(null);
  const [comment, setComment] = useState("");
  const [done, setDone] = useState(false);
  const dialogRef = useRef(null);

  useEffect(() => {
    const opener = document.activeElement;
    dialogRef.current?.focus();
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
            <h2>Thank you</h2>
            <p style={{ fontSize: "var(--fs-sm)", color: "var(--c-ink-soft)" }}>
              Your feedback was recorded (demonstration only, not stored). Survey
              results are reported to CDC on the approved schedule.
            </p>
            <div className="form-nav">
              <button type="button" className="btn" onClick={onClose}>
                Close
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
              aria-label="Rating from 1 (poor) to 5 (excellent)"
            >
              {[1, 2, 3, 4, 5].map((n) => (
                <button
                  key={n}
                  type="button"
                  aria-pressed={rating === n}
                  aria-label={`${n} out of 5`}
                  onClick={() => setRating(n)}
                >
                  {n}
                </button>
              ))}
            </div>
            <div className="field" style={{ maxWidth: "none" }}>
              <label className="field-label" htmlFor="survey-comment">
                Anything we could improve? (optional)
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
                Send feedback
              </button>
              <button type="button" className="btn ghost" onClick={onClose}>
                No thanks
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
