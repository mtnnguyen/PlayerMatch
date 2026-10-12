import React from "react";

import {
  Activity,
  AlertTriangle,
  ArrowRight,
  History,
  TrendingUp,
} from "lucide-react";

import {
  formatHistoricalValue,
} from "../model/historical";

import MatchContext from "./MatchContext";
import SimilarityHistoryChart from "./SimilarityHistoryChart";
import TrendLineChart from "./TrendLineChart";

function TrendCard({
  title,
  name,
  trend,
  feature,
}) {
  return (
    <article className="trend-read-player">
      <span>{title}</span>

      <strong>{name}</strong>

      {trend ? (
        <>
          <div className="trend-read-values">
            <b>
              {formatHistoricalValue(
                feature,
                trend.first.value
              )}
            </b>

            <ArrowRight
              size={14}
              aria-hidden="true"
            />

            <b>
              {formatHistoricalValue(
                feature,
                trend.latest.value
              )}
            </b>
          </div>

          <p>
            {trend.first.season}
            {" → "}
            {trend.latest.season}
            {" · "}
            {trend.directionText}
          </p>

          <small>
            Peak:{" "}
            {formatHistoricalValue(
              feature,
              trend.peak.value
            )}
            {" in "}
            {trend.peak.season}
            {" · "}
            {trend.consistency}
          </small>
        </>
      ) : (
        <p>
          Not enough eligible seasons in the historical dataset.
        </p>
      )}
    </article>
  );
}

function HistoryMissing({
  message,
}) {
  return (
    <section className="history-missing v3-card">
      <div>
        <History
          size={28}
          aria-hidden="true"
        />

        <span>
          HISTORICAL DATA REQUIRED
        </span>

        <h2>
          Build the V4 season history once
        </h2>

        <p>
          {message ||
            "The current-season app still works. Trends needs the new multi-season dataset."}
        </p>
      </div>

      <code>
        python scripts/build_player_history.py
      </code>
    </section>
  );
}

export default function TrendsView({
  model,
  statBasisLabel,
  onEditMatchup,
}) {
  const [
    activeTrend,
    setActiveTrend,
  ] =
    React.useState(
      "development"
    );

  if (
    !model.historyAvailable
  ) {
    return (
      <section className="v3-view trends-view">
        <MatchContext
          left={model.selectedPlayer}
          right={model.comparisonPlayer}
          similarity={
            model.comparisonPlayer
              .similarity ?? 0
          }
          profile={model.profile}
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

        <HistoryMissing
          message={
            model.historyError
          }
        />
      </section>
    );
  }

  const allSeasons =
    model.historyDataset.meta
      ?.seasons ??
    model.historyDataset.seasons.map(
      (season) =>
        season.season
    );

  const similarity =
    model.similarityHistorySummary;

  return (
    <section className="v3-view trends-view">
      <MatchContext
        left={model.selectedPlayer}
        right={model.comparisonPlayer}
        similarity={
          model.comparisonPlayer
            .similarity ?? 0
        }
        profile={model.profile}
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
        className="trend-switcher"
        aria-label="Historical analysis views"
      >
        <div>
          <span>
            HISTORICAL ANALYSIS
          </span>

          <strong>
            {allSeasons.length} seasons loaded
          </strong>
        </div>

        <div>
          <button
            type="button"
            className={
              activeTrend ===
              "development"
                ? "active"
                : ""
            }
            onClick={() =>
              setActiveTrend(
                "development"
              )
            }
          >
            <TrendingUp
              size={15}
              aria-hidden="true"
            />
            Development
          </button>

          <button
            type="button"
            className={
              activeTrend ===
              "similarity"
                ? "active"
                : ""
            }
            onClick={() =>
              setActiveTrend(
                "similarity"
              )
            }
          >
            <Activity
              size={15}
              aria-hidden="true"
            />
            Similarity over time
          </button>
        </div>
      </nav>

      {activeTrend ===
        "development" && (
        <div className="historical-grid">
          <TrendLineChart
            left={
              model.selectedPlayer
            }
            right={
              model.comparisonPlayer
            }
            leftHistory={
              model.selectedHistory
            }
            rightHistory={
              model.comparisonHistory
            }
            feature={
              model.trendFeature
            }
            onFeatureChange={
              model.setTrendFeatureKey
            }
            allSeasons={
              allSeasons
            }
          />

          <aside className="v3-card historical-read-card">
            <div className="v3-card-title">
              <div>
                <span>
                  DEVELOPMENT READ
                </span>

                <h3>
                  What changed?
                </h3>
              </div>
            </div>

            <TrendCard
              title="Primary player"
              name={
                model.selectedPlayer
                  .name
              }
              trend={
                model.selectedTrend
              }
              feature={
                model.trendFeature
              }
            />

            <TrendCard
              title="Comparison player"
              name={
                model.comparisonPlayer
                  .name
              }
              trend={
                model.comparisonTrend
              }
              feature={
                model.trendFeature
              }
            />

            <article className="historical-comparison-read">
              <span>
                Comparison takeaway
              </span>

              <p>
                {
                  model.trendRead
                    ?.comparison
                }
              </p>
            </article>

            <article className="historical-caution">
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
                    model.trendRead
                      ?.caveat
                  }
                </p>
              </div>
            </article>
          </aside>
        </div>
      )}

      {activeTrend ===
        "similarity" && (
        <div className="historical-grid">
          <SimilarityHistoryChart
            rows={
              model.similarityHistory
            }
            left={
              model.selectedPlayer
            }
            right={
              model.comparisonPlayer
            }
          />

          <aside className="v3-card historical-read-card similarity-read-card">
            <div className="v3-card-title">
              <div>
                <span>
                  RELATIONSHIP OVER TIME
                </span>

                <h3>
                  Has the matchup changed?
                </h3>
              </div>
            </div>

            {similarity ? (
              <>
                <article className="similarity-history-lead">
                  <span>
                    Overall read
                  </span>

                  <strong>
                    {similarity.trend}
                  </strong>

                  <p>
                    {similarity.seasonCount} shared eligible seasons are available.
                  </p>
                </article>

                <article>
                  <span>
                    First available season
                  </span>

                  <div className="history-score-row">
                    <strong>
                      {
                        similarity
                          .first
                          .season
                      }
                    </strong>

                    <b>
                      {similarity.first.score.toFixed(
                        0
                      )}
                      %
                    </b>
                  </div>
                </article>

                <article>
                  <span>
                    Latest available season
                  </span>

                  <div className="history-score-row">
                    <strong>
                      {
                        similarity
                          .latest
                          .season
                      }
                    </strong>

                    <b>
                      {similarity.latest.score.toFixed(
                        0
                      )}
                      %
                    </b>
                  </div>
                </article>

                <article>
                  <span>
                    Historical range
                  </span>

                  <p>
                    Peak:{" "}
                    <strong>
                      {similarity.peak.score.toFixed(
                        0
                      )}
                      %
                    </strong>
                    {" in "}
                    {similarity.peak.season}
                    . Low:{" "}
                    <strong>
                      {similarity.low.score.toFixed(
                        0
                      )}
                      %
                    </strong>
                    {" in "}
                    {similarity.low.season}
                    .
                  </p>

                  <small>
                    {similarity.stability}
                  </small>
                </article>

                <article className="historical-caution">
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
                        similarity.caveat
                      }
                    </p>
                  </div>
                </article>
              </>
            ) : (
              <article className="history-no-overlap">
                <span>
                  Not enough overlap
                </span>

                <p>
                  These players do not have enough shared eligible historical seasons to calculate a similarity trend.
                </p>
              </article>
            )}
          </aside>
        </div>
      )}
    </section>
  );
}
