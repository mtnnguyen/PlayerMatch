import React, {
  useMemo,
  useState,
} from "react";

import {
  Activity,
  AlertTriangle,
  ArrowRight,
  BrainCircuit,
  CheckCircle2,
  History,
  Sparkles,
  Target,
  TrendingDown,
  TrendingUp,
} from "lucide-react";

import MatchContext from "./MatchContext";

import {
  featureLabel,
  formatProjectionError,
  formatProjectionValue,
  performanceRead,
  playerProjectionStory,
  PROJECTION_TARGETS,
  projectionComparisonRead,
  projectionDirectionCopy,
  projectionErrorBadge,
  projectionMeta,
} from "../model/projection";

function OutlookMissing({
  message,
}) {
  return (
    <section className="outlook-missing v3-card">
      <BrainCircuit
        size={31}
        aria-hidden="true"
      />

      <span>
        PREDICTION DATA REQUIRED
      </span>

      <h2>
        Train and evaluate V5 once
      </h2>

      <p>
        {message ||
          "The rest of PlayerMatch works normally. Outlook needs the generated projection dataset."}
      </p>

      <div>
        <code>
          python scripts/build_player_history.py
        </code>

        <code>
          python scripts/train_projection_models.py
        </code>
      </div>
    </section>
  );
}

function DirectionIcon({
  direction,
}) {
  if (direction === "Increase") {
    return (
      <TrendingUp
        size={15}
        aria-hidden="true"
      />
    );
  }

  if (direction === "Decrease") {
    return (
      <TrendingDown
        size={15}
        aria-hidden="true"
      />
    );
  }

  return (
    <Activity
      size={15}
      aria-hidden="true"
    />
  );
}

function ProjectionMetric({
  target,
  row,
  evaluation,
  active,
  onSelect,
}) {
  const meta =
    projectionMeta(target);

  const errorBadge =
    projectionErrorBadge(
      target,
      row
    );

  return (
    <button
      type="button"
      className={`projection-metric ${
        active
          ? "active"
          : ""
      }`}
      onClick={onSelect}
    >
      <div className="projection-metric-label">
        <span>
          {meta.shortLabel}
        </span>

        <small>
          {meta.label}
        </small>
      </div>

      <div className="projection-metric-values">
        <strong>
          {formatProjectionValue(
            target,
            row.current
          )}
        </strong>

        <ArrowRight
          size={13}
          aria-hidden="true"
        />

        <strong>
          {formatProjectionValue(
            target,
            row.projected
          )}
        </strong>
      </div>

      <div className="projection-metric-footer">
        <span
          className={`projection-direction projection-direction--${row.direction.toLowerCase()}`}
        >
          <DirectionIcon
            direction={
              row.direction
            }
          />

          {projectionDirectionCopy(
            row
          )}
        </span>

        <span
          className={`projection-confidence projection-confidence--${errorBadge.tone}`}
        >
          {errorBadge.label}
        </span>
      </div>
    </button>
  );
}

function PlayerProjectionPanel({
  title,
  player,
  projection,
  evaluation,
  activeTarget,
  onTargetChange,
}) {
  return (
    <section className="v3-card player-projection-panel">
      <div className="player-projection-heading">
        <div>
          <span>{title}</span>
          <h3>{player.name}</h3>
          <small>
            {player.team}
            {player.position
              ? ` · ${player.position}`
              : ""}
          </small>
        </div>

        <div>
          <span>
            {
              projection
                .projectionSeason
            }
          </span>
          <strong>
            Per-game outlook
          </strong>
        </div>
      </div>

      <div className="projection-metric-grid">
        {PROJECTION_TARGETS.map(
          (target) => (
            <ProjectionMetric
              key={target}
              target={target}
              row={
                projection
                  .projections[
                  target
                ]
              }
              evaluation={
                evaluation[
                  target
                ]
              }
              active={
                activeTarget ===
                target
              }
              onSelect={() =>
                onTargetChange(
                  target
                )
              }
            />
          )
        )}
      </div>
    </section>
  );
}

function ProjectionRead({
  target,
  left,
  right,
  leftProjection,
  rightProjection,
  evaluation,
}) {
  const meta =
    projectionMeta(target);

  const leftRow =
    leftProjection
      ?.projections?.[
      target
    ];

  const rightRow =
    rightProjection
      ?.projections?.[
      target
    ];

  const performance =
    performanceRead(
      evaluation
    );

  const leftStory =
    playerProjectionStory(
      left.name,
      leftProjection
    );

  const rightStory =
    playerProjectionStory(
      right.name,
      rightProjection
    );

  if (
    !leftRow ||
    !rightRow
  ) {
    return null;
  }

  const comparisonRead =
    projectionComparisonRead(
      target,
      left,
      right,
      leftRow,
      rightRow
    );

  return (
    <aside className="v3-card projection-read-card">
      <div className="v3-card-title">
        <div>
          <span>
            PROJECTION READ
          </span>

          <h3>
            {meta.label}
          </h3>
        </div>

        <Sparkles
          size={19}
          aria-hidden="true"
        />
      </div>

      <article className="projection-read-lead">
        <span>
          Point-estimate comparison
        </span>

        <strong>
          {comparisonRead?.headline}
        </strong>

        <p>
          {comparisonRead?.detail}
        </p>
      </article>

      <article>
        <span>
          Planning signal
        </span>

        <p>
          {leftStory?.headline}
          {" "}
          {rightStory?.headline}
        </p>

        <small className="projection-watch-note">
          Watch: {leftStory?.watch}
        </small>
      </article>

      <article>
        <span>
          Historical error band
        </span>

        <p>
          The selected model's historical 80th-percentile absolute error is about{" "}
          <strong>
            {formatProjectionError(
              target,
              leftRow.historicalErrorBand80
            )}
          </strong>
          {" "}for this target.
        </p>
      </article>

      <article>
        <span>
          Backtest check
        </span>

        <strong>
          {
            performance
              ?.headline
          }
        </strong>

        <p>
          {
            performance
              ?.detail
          }
        </p>
      </article>

      <article>
        <span>
          Model scope
        </span>

        <p>
          These projections use historical per-game production, age, minutes, games played and recent changes. The Balanced / Scoring / Defense similarity profile does not change the forecast.
        </p>
      </article>

      <article className="projection-read-warning">
        <AlertTriangle
          size={16}
          aria-hidden="true"
        />

        <div>
          <span>
            Decision caution
          </span>

          <p>
            Treat the projection as a model estimate, not a guaranteed outcome. Role changes, injuries, trades, coaching and lineup context are not directly modelled.
          </p>
        </div>
      </article>
    </aside>
  );
}

function ProjectionView({
  model,
}) {
  const [
    activeTarget,
    setActiveTarget,
  ] = useState("pts");

  return (
    <div className="outlook-projection-grid">
      <div className="outlook-player-stack">
        <PlayerProjectionPanel
          title="Primary player"
          player={
            model.selectedPlayer
          }
          projection={
            model.selectedProjection
          }
          evaluation={
            model.projectionDataset
              .evaluation
          }
          activeTarget={
            activeTarget
          }
          onTargetChange={
            setActiveTarget
          }
        />

        <PlayerProjectionPanel
          title="Comparison player"
          player={
            model.comparisonPlayer
          }
          projection={
            model.comparisonProjection
          }
          evaluation={
            model.projectionDataset
              .evaluation
          }
          activeTarget={
            activeTarget
          }
          onTargetChange={
            setActiveTarget
          }
        />
      </div>

      <ProjectionRead
        target={activeTarget}
        left={
          model.selectedPlayer
        }
        right={
          model.comparisonPlayer
        }
        leftProjection={
          model.selectedProjection
        }
        rightProjection={
          model.comparisonProjection
        }
        evaluation={
          model.projectionDataset
            .evaluation[
            activeTarget
          ]
        }
      />
    </div>
  );
}

function JourneyTimeline({
  title,
  player,
  journey,
  summary,
}) {
  return (
    <section className="v3-card archetype-journey-card">
      <div className="archetype-journey-heading">
        <div>
          <span>{title}</span>
          <h3>{player.name}</h3>
        </div>

        <History
          size={19}
          aria-hidden="true"
        />
      </div>

      <div className="archetype-journey-line">
        {journey.map(
          (row, index) => (
            <React.Fragment
              key={row.season}
            >
              <article>
                <span>
                  {row.season}
                </span>

                <strong>
                  {row.name}
                </strong>

                <small>
                  {row.traits
                    .slice(0, 2)
                    .map(
                      (trait) =>
                        trait.shortLabel
                    )
                    .join(" · ")}
                </small>
              </article>

              {index <
                journey.length -
                  1 && (
                <ArrowRight
                  size={16}
                  aria-hidden="true"
                />
              )}
            </React.Fragment>
          )
        )}
      </div>

      <div className="archetype-journey-summary">
        <strong>
          {summary?.headline}
        </strong>

        <p>
          Latest:{" "}
          <b>
            {
              summary?.latest
                ?.name
            }
          </b>
          {" · "}
          {summary?.changes ?? 0}{" "}
          label change
          {(summary?.changes ?? 0) ===
          1
            ? ""
            : "s"}
        </p>
      </div>
    </section>
  );
}

function ArchetypeJourneyView({
  model,
}) {
  return (
    <div className="outlook-journey-grid">
      <div className="outlook-journey-stack">
        <JourneyTimeline
          title="Primary player"
          player={
            model.selectedPlayer
          }
          journey={
            model.selectedArchetypeJourney
          }
          summary={
            model.selectedArchetypeJourneySummary
          }
        />

        <JourneyTimeline
          title="Comparison player"
          player={
            model.comparisonPlayer
          }
          journey={
            model.comparisonArchetypeJourney
          }
          summary={
            model.comparisonArchetypeJourneySummary
          }
        />
      </div>

      <aside className="v3-card journey-read-card">
        <div className="v3-card-title">
          <div>
            <span>
              ROLE EVOLUTION
            </span>

            <h3>
              What changed?
            </h3>
          </div>

          <History
            size={19}
            aria-hidden="true"
          />
        </div>

        <article>
          <span>
            {model.selectedPlayer.name}
          </span>

          <p>
            {
              model
                .selectedArchetypeJourneySummary
                ?.headline
            }
          </p>
        </article>

        <article>
          <span>
            {model.comparisonPlayer.name}
          </span>

          <p>
            {
              model
                .comparisonArchetypeJourneySummary
                ?.headline
            }
          </p>
        </article>

        <article className="journey-read-decision">
          <CheckCircle2
            size={16}
            aria-hidden="true"
          />

          <div>
            <span>
              How to use this
            </span>

            <p>
              Archetype movement is useful for spotting a changing statistical role. Pair it with the Development trend chart to see which numbers moved with the label.
            </p>
          </div>
        </article>

        <article className="projection-read-warning">
          <AlertTriangle
            size={16}
            aria-hidden="true"
          />

          <div>
            <span>
              Important limitation
            </span>

            <p>
              {
                model
                  .selectedArchetypeJourneySummary
                  ?.caveat
              }
            </p>
          </div>
        </article>
      </aside>
    </div>
  );
}

function PerformanceView({
  model,
}) {
  const [
    activeTarget,
    setActiveTarget,
  ] = useState("pts");

  const evaluation =
    model.projectionDataset
      .evaluation;

  const active =
    evaluation[
      activeTarget
    ];

  const performance =
    performanceRead(active);

  const rows =
    useMemo(
      () =>
        PROJECTION_TARGETS.map(
          (target) => ({
            target,
            meta:
              projectionMeta(
                target
              ),
            evaluation:
              evaluation[
                target
              ],
          })
        ),
      [evaluation]
    );

  return (
    <div className="model-performance-grid">
      <section className="v3-card performance-table-card">
        <div className="v3-card-title">
          <div>
            <span>
              HELD-OUT BACKTEST
            </span>

            <h3>
              Does the model beat a simple baseline?
            </h3>
          </div>

          <Target
            size={19}
            aria-hidden="true"
          />
        </div>

        <div className="performance-table-head">
          <span>Target</span>
          <span>Selected model</span>
          <span>Model MAE</span>
          <span>Baseline MAE</span>
          <span>Result</span>
        </div>

        <div className="performance-table-body">
          {rows.map(
            (row) => (
              <button
                type="button"
                key={row.target}
                className={
                  activeTarget ===
                  row.target
                    ? "active"
                    : ""
                }
                onClick={() =>
                  setActiveTarget(
                    row.target
                  )
                }
              >
                <span>
                  <strong>
                    {
                      row.meta
                        .shortLabel
                    }
                  </strong>
                  <small>
                    {
                      row.meta
                        .label
                    }
                  </small>
                </span>

                <span>
                  {
                    row.evaluation
                      ?.selectedModel
                  }
                </span>

                <span>
                  {row.evaluation
                    ?.holdout
                    ?.selected
                    ?.mae?.toFixed(
                      2
                    ) ?? "—"}
                </span>

                <span>
                  {row.evaluation
                    ?.holdout
                    ?.baseline
                    ?.mae?.toFixed(
                      2
                    ) ?? "—"}
                </span>

                <span
                  className={`performance-${
                    performanceRead(
                      row.evaluation
                    )?.tone ?? "neutral"
                  }`}
                >
                  {performanceRead(
                    row.evaluation
                  )?.resultLabel ?? "—"}
                </span>
              </button>
            )
          )}
        </div>
      </section>

      <aside className="v3-card performance-read-card">
        <div className="v3-card-title">
          <div>
            <span>
              MODEL CARD
            </span>

            <h3>
              {
                projectionMeta(
                  activeTarget
                ).label
              }
            </h3>
          </div>

          <BrainCircuit
            size={19}
            aria-hidden="true"
          />
        </div>

        <article className="performance-read-lead">
          <span>
            Selected model
          </span>

          <strong>
            {
              active
                ?.selectedModel
            }
          </strong>

          <p>
            {
              performance
                ?.headline
            }
          </p>
        </article>

        <article>
          <span>
            Evaluation design
          </span>

          <p>
            Model family was chosen using expanding-window validation. The latest observed season was then held out and never used for model selection.
          </p>
        </article>

        <article>
          <span>
            Historical error band
          </span>

          <p>
            Roughly{" "}
            <strong>
              ±
              {formatProjectionValue(
                activeTarget,
                active
                  ?.historicalErrorBand80 ??
                  0
              )}
            </strong>
            {" "}at the 80th percentile of historical absolute validation errors.
          </p>
        </article>

        <article>
          <span>
            Strongest model inputs
          </span>

          <div className="performance-feature-list">
            {(active?.topFeatures ??
              [])
              .slice(0, 5)
              .map(
                (feature) => (
                  <div
                    key={
                      feature.feature
                    }
                  >
                    <span>
                      {featureLabel(
                        feature.feature
                      )}
                    </span>

                    <strong>
                      {feature.share.toFixed(
                        0
                      )}
                      %
                    </strong>
                  </div>
                )
              )}

            {!(active?.topFeatures
              ?.length) && (
              <p>
                The selected model is the persistence baseline, so it has no learned feature importance.
              </p>
            )}
          </div>
        </article>

        <article className="projection-read-warning">
          <AlertTriangle
            size={16}
            aria-hidden="true"
          />

          <div>
            <span>
              Why this matters
            </span>

            <p>
              A complicated model is not automatically better. If the baseline wins, PlayerMatch reports that result instead of presenting complexity as accuracy.
            </p>
          </div>
        </article>
      </aside>
    </div>
  );
}

export default function OutlookView({
  model,
  statBasisLabel,
  onEditMatchup,
}) {
  const [
    activeOutlook,
    setActiveOutlook,
  ] =
    useState("projection");

  if (
    !model.projectionsAvailable ||
    !model.selectedProjection ||
    !model.comparisonProjection
  ) {
    return (
      <section className="v3-view outlook-view">
        <MatchContext
          left={
            model.selectedPlayer
          }
          right={
            model.comparisonPlayer
          }
          similarity={
            model.comparisonPlayer
              .similarity ?? 0
          }
          profile={
            model.profile
          }
          statBasisLabel={
            statBasisLabel
          }
          onSwap={
            model.swapPlayers
          }
          onEditMatchup={
            onEditMatchup
          }
        />

        <OutlookMissing
          message={
            model.projectionError
          }
        />
      </section>
    );
  }

  return (
    <section className="v3-view outlook-view">
      <MatchContext
        left={
          model.selectedPlayer
        }
        right={
          model.comparisonPlayer
        }
        similarity={
          model.comparisonPlayer
            .similarity ?? 0
        }
        profile={
          model.profile
        }
        statBasisLabel={
          statBasisLabel
        }
        onSwap={
          model.swapPlayers
        }
        onEditMatchup={
          onEditMatchup
        }
      />

      <nav
        className="outlook-switcher"
        aria-label="Outlook views"
      >
        <div>
          <span>
            PREDICTIVE ANALYTICS
          </span>

          <strong>
            Projection season{" "}
            {
              model
                .projectionDataset
                .meta
                ?.projectionSeason
            }
            {" · "}forecast model is separate from the similarity profile
          </strong>
        </div>

        <div>
          <button
            type="button"
            className={
              activeOutlook ===
              "projection"
                ? "active"
                : ""
            }
            onClick={() =>
              setActiveOutlook(
                "projection"
              )
            }
          >
            <Sparkles
              size={15}
              aria-hidden="true"
            />
            Projection
          </button>

          <button
            type="button"
            className={
              activeOutlook ===
              "journey"
                ? "active"
                : ""
            }
            onClick={() =>
              setActiveOutlook(
                "journey"
              )
            }
          >
            <History
              size={15}
              aria-hidden="true"
            />
            Archetype journey
          </button>

          <button
            type="button"
            className={
              activeOutlook ===
              "performance"
                ? "active"
                : ""
            }
            onClick={() =>
              setActiveOutlook(
                "performance"
              )
            }
          >
            <Target
              size={15}
              aria-hidden="true"
            />
            Model performance
          </button>
        </div>
      </nav>

      <div className="outlook-workspace">
        {activeOutlook ===
          "projection" && (
          <ProjectionView
            model={model}
          />
        )}

        {activeOutlook ===
          "journey" && (
          <ArchetypeJourneyView
            model={model}
          />
        )}

        {activeOutlook ===
          "performance" && (
          <PerformanceView
            model={model}
          />
        )}
      </div>
    </section>
  );
}
