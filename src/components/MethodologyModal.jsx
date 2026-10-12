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
  [
    "07",
    "Z-score visual analysis",
    "The Visuals section exposes the same league-standardized values used by the model. A z-score of 0 is the league mean, +1 is one standard deviation above it, and -1 is one standard deviation below it.",
  ],
  [
    "08",
    "Model interpretation",
    "The Visuals section translates the standardized profile into an observation, supporting evidence, a defensible conclusion and an explicit limitation. The interpretation is deterministic and based only on the model outputs shown in the app.",
  ],
  [
    "09",
    "Player Style Map",
    "Principal component analysis compresses the ten standardized features into two display dimensions. Players close together on the map have similar overall statistical shapes, but the two-dimensional map is only a summary of the full feature space.",
  ],
  [
    "10",
    "Data-driven archetypes",
    "K-means clustering groups players in the same standardized, weighted ten-feature space. The archetype labels are generated from each cluster's strongest traits and position mix, so they describe patterns found in the current data rather than fixed basketball identities.",
  ],
  [
    "11",
    "Historical development",
    "The Trends view compares the same player across multiple regular seasons using the selected Per Game, Per 36 or Per 100 stat basis. The trend is descriptive: changes may reflect development, role, minutes, health, teammates or team context.",
  ],
  [
    "12",
    "Similarity over time",
    "Historical pair similarity is recalculated separately inside each season after standardizing against that season's eligible league. This makes the year-to-year comparison league-relative instead of applying one modern league baseline to every season.",
  ],
  [
    "13",
    "Historical archetype journey",
    "For each eligible season, PlayerMatch reruns the data-driven archetype analysis against that season's league. A changing label is treated as evidence of a changing statistical profile, not proof that a player's basketball role changed for one specific reason.",
  ],
  [
    "14",
    "Next-season projection",
    "The Outlook model predicts next-season points, rebounds, assists, true shooting percentage and usage rate from current production, age, playing time and recent season-to-season changes. The model never sees future-season inputs when creating a historical training example.",
  ],
  [
    "15",
    "Time-based model evaluation",
    "PlayerMatch selects between a persistence baseline, Ridge Regression and Gradient Boosting using expanding-window validation. The latest observed season is then held out for a final backtest. The displayed error band is based on historical absolute validation errors and is not a formal confidence interval.",
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
