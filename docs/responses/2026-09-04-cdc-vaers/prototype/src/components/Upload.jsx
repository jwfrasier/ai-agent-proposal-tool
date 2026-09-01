// Medical-record upload widget (PWS 2.1/2.2, PRS#9) with Phase 1 document
// restrictions and Phase 2-ready messaging (PWS 2.4, PRS#11).
// Demonstration: file metadata only — nothing is uploaded or stored.

import { useId, useRef, useState } from "react";

const PHASE1_EXTENSIONS = ["pdf", "doc", "docx", "rtf", "txt"];
const IMAGE_EXTENSIONS = ["jpg", "jpeg", "png", "gif", "heic", "tif", "tiff", "bmp", "webp", "dcm"];

function classify(file) {
  const ext = file.name.split(".").pop().toLowerCase();
  if (PHASE1_EXTENSIONS.includes(ext)) return "accepted";
  if (IMAGE_EXTENSIONS.includes(ext)) return "image";
  return "unsupported";
}

export function Upload({ field, lang, value, onChange, onFocusField }) {
  const id = useId();
  const inputRef = useRef(null);
  const [rejection, setRejection] = useState(null);
  const files = Array.isArray(value) ? value : [];
  const label =
    typeof field.label === "string" ? field.label : field.label[lang];
  const help = field.help
    ? typeof field.help === "string"
      ? field.help
      : field.help[lang]
    : null;

  function addFiles(fileList) {
    const incoming = Array.from(fileList);
    const accepted = [];
    let rejected = null;
    for (const f of incoming) {
      const kind = classify(f);
      if (kind === "accepted") {
        accepted.push({ name: f.name, size: f.size });
      } else if (kind === "image") {
        rejected = {
          name: f.name,
          reason:
            "Pictures and medical images aren't accepted in Phase 1. This system is designed so image upload can be enabled in a future phase without rework. For now, please attach records as PDF or document files.",
        };
      } else {
        rejected = {
          name: f.name,
          reason: `This file type isn't accepted. Phase 1 accepts medical records and vaccine documents as: ${PHASE1_EXTENSIONS.map((e) => e.toUpperCase()).join(", ")}.`,
        };
      }
    }
    if (accepted.length) onChange([...files, ...accepted]);
    setRejection(rejected);
  }

  return (
    <div className="field">
      <span className="field-label" id={`${id}-label`}>
        {label}
      </span>
      {help && (
        <p className="field-help" id={`${id}-help`}>
          {help}
        </p>
      )}
      <div className="upload-box">
        <button
          type="button"
          className="btn secondary"
          aria-describedby={`${id}-help`}
          onClick={() => inputRef.current?.click()}
          onFocus={() => onFocusField?.(field)}
        >
          Choose files
        </button>
        <input
          ref={inputRef}
          type="file"
          multiple
          hidden
          aria-labelledby={`${id}-label`}
          accept={PHASE1_EXTENSIONS.map((e) => "." + e).join(",")}
          onChange={(e) => {
            addFiles(e.target.files);
            e.target.value = "";
          }}
        />
        <p>
          Accepted in Phase 1: medical records and vaccine documents (
          {PHASE1_EXTENSIONS.map((e) => e.toUpperCase()).join(", ")}). Max 25 MB
          per file. Demonstration only: files are listed, never transmitted.
        </p>
      </div>
      {rejection && (
        <div className="upload-reject" role="alert">
          <strong>{rejection.name}</strong>: {rejection.reason}
        </div>
      )}
      {files.length > 0 && (
        <ul className="upload-list">
          {files.map((f, i) => (
            <li key={`${f.name}-${i}`}>
              <span>
                {f.name}{" "}
                <span style={{ color: "var(--c-muted)" }}>
                  ({Math.max(1, Math.round(f.size / 1024))} KB)
                </span>
              </span>
              <button
                type="button"
                className="btn ghost"
                onClick={() => onChange(files.filter((_, j) => j !== i))}
              >
                Remove
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
