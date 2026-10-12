import {
  useEffect,
  useRef,
} from "react";

import { X } from "lucide-react";

const steps = [
  [
    "01",
    "Feature selection",
    "PlayerMatch uses points, rebounds, assists, steals, blocks, field-goal percentage, three-point percentage, free-throw percentage, usage rate and true shooting.",
  ],
  [
    "02",
    "League standardization",
    "Every feature becomes a z-score relative to the eligible league player pool so variables with larger raw numeric ranges do not automatically dominate.",
  ],
  [
    "03",
    "Profile weighting",
    "Balanced, Scoring, Playmaking and Defense apply preset feature weights. Custom mode lets the user change every feature weight directly.",
  ],
  [
    "04",
    "Cosine similarity",
    "The weighted standardized player vectors are compared using cosine similarity. Positive cosine similarity is displayed on a 0–100 scale.",
  ],
  [
    "05",
    "Stat basis",
    "Per Game, Per 36 and Per 100 change the active counting-stat values before the league standardization and similarity model are recalculated.",
  ],
  [
    "06",
    "Robustness and interpretation",
    "Match Stability compares the same player pair across all three stat bases. The written interpretation is deterministic and comes from model outputs rather than an external LLM.",
  ],
];

export default function MethodologyModal({
  open,
  onClose,
}) {
  const closeRef =
    useRef(null);

  useEffect(() => {
    if (!open) {
      return undefined;
    }

    closeRef.current?.focus();

    function onKeyDown(event) {
      if (event.key === "Escape") {
        onClose();
      }
    }

    window.addEventListener(
      "keydown",
      onKeyDown
    );

    return () =>
      window.removeEventListener(
        "keydown",
        onKeyDown
      );
  }, [open, onClose]);

  if (!open) {
    return null;
  }

  return (
    <div
      className="modal-backdrop"
      onMouseDown={onClose}
    >
      <div
        className="method-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="methodology-title"
        onMouseDown={(event) =>
          event.stopPropagation()
        }
      >
        <div className="modal-header">
          <div>
            <span>
              Model documentation
            </span>

            <h2 id="methodology-title">
              How PlayerMatch works
            </h2>
          </div>

          <button
            type="button"
            ref={closeRef}
            onClick={onClose}
            aria-label="Close methodology"
          >
            <X
              size={20}
              aria-hidden="true"
            />
          </button>
        </div>

        <div className="method-grid">
          {steps.map(
            ([
              number,
              title,
              body,
            ]) => (
              <article
                key={number}
              >
                <span>
                  {number}
                </span>

                <div>
                  <strong>
                    {title}
                  </strong>

                  <p>
                    {body}
                  </p>
                </div>
              </article>
            )
          )}
        </div>

        <div className="method-warning">
          PlayerMatch measures statistical profile similarity,
          not total player value, complete defensive impact,
          contract value, lineup fit, playoff translation or
          scouting projection.
        </div>
      </div>
    </div>
  );
}
