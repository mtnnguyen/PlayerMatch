import {
  Activity,
  BarChart3,
  Database,
  Gauge,
  Waves,
} from "lucide-react";

import { FEATURES } from "../config/modelConfig";

import {
  POOL_FILTERS,
  STAT_BASES,
} from "../config/viewConfig";

import { percentile } from "../model/similarity";

function display(feature, value) {
  const numeric = Number(value ?? 0);

  const text = Number.isInteger(numeric)
    ? `${numeric}`
    : numeric.toFixed(1);

  return feature.percentage
    ? `${text}%`
    : text;
}

export function StatBattle({
  players,
  left,
  right,
}) {
  return (
    <section
      className="stat-battle-panel"
      aria-labelledby="stat-battle-title"
    >
      <div className="analysis-heading">
        <div>
          <span>Head-to-head</span>
          <h2 id="stat-battle-title">
            Statistical battle
          </h2>
        </div>

        <div
          className="analysis-player-labels"
          aria-hidden="true"
        >
          <strong>{left.name}</strong>
          <i />
          <strong>{right.name}</strong>
        </div>
      </div>

      <div className="battle-table">
        {FEATURES.map((feature) => {
          const leftValue = Number(
            left[feature.key] ?? 0
          );

          const rightValue = Number(
            right[feature.key] ?? 0
          );

          const leftPercentile =
            percentile(
              players,
              feature.key,
              leftValue
            );

          const rightPercentile =
            percentile(
              players,
              feature.key,
              rightValue
            );

          return (
            <div
              className="battle-row"
              key={feature.key}
              aria-label={`${feature.longLabel}: ${left.name} ${display(
                feature,
                leftValue
              )}, ${leftPercentile}th percentile. ${right.name} ${display(
                feature,
                rightValue
              )}, ${rightPercentile}th percentile.`}
            >
              <div className="battle-value">
                <strong
                  className={
                    leftValue > rightValue
                      ? "stat-winner"
                      : ""
                  }
                >
                  {display(
                    feature,
                    leftValue
                  )}
                </strong>

                <span>
                  {leftPercentile}th percentile
                </span>
              </div>

              <div className="battle-middle">
                <div className="battle-label">
                  <strong>{feature.label}</strong>
                  <span>
                    {feature.longLabel}
                  </span>
                </div>

                <div
                  className="battle-bars"
                  aria-hidden="true"
                >
                  <div className="battle-half battle-half--left">
                    <span
                      style={{
                        width: `${leftPercentile}%`,
                      }}
                    />
                  </div>

                  <i />

                  <div className="battle-half battle-half--right">
                    <span
                      style={{
                        width: `${rightPercentile}%`,
                      }}
                    />
                  </div>
                </div>
              </div>

              <div className="battle-value battle-value--right">
                <strong
                  className={
                    rightValue > leftValue
                      ? "stat-winner stat-winner--right"
                      : ""
                  }
                >
                  {display(
                    feature,
                    rightValue
                  )}
                </strong>

                <span>
                  {rightPercentile}th percentile
                </span>
              </div>
            </div>
          );
        })}
      </div>

      <div className="percentile-key">
        <span>
          Bars show league percentile, not raw value.
        </span>
        <span>Higher percentile →</span>
      </div>
    </section>
  );
}

export function CategoryEdge({
  categories,
}) {
  return (
    <section className="analysis-card">
      <div className="analysis-card-title">
        <div>
          <span>League percentiles</span>
          <h3>Category edge</h3>
        </div>

        <BarChart3 size={20} />
      </div>

      <div className="category-list">
        {categories.map((category) => (
          <div
            className="category-row"
            key={category.name}
          >
            <strong
              className={
                category.left >
                category.right
                  ? "edge-left"
                  : ""
              }
            >
              {category.left}
            </strong>

            <div>
              <span>{category.name}</span>

              <div
                className="category-track"
                aria-hidden="true"
              >
                <i />

                <span
                  className="category-left"
                  style={{
                    width: `${category.left}%`,
                  }}
                />

                <span
                  className="category-right"
                  style={{
                    width: `${category.right}%`,
                  }}
                />
              </div>
            </div>

            <strong
              className={
                category.right >
                category.left
                  ? "edge-right"
                  : ""
              }
            >
              {category.right}
            </strong>
          </div>
        ))}
      </div>
    </section>
  );
}

export function SimilarityDrivers({
  drivers,
}) {
  return (
    <section className="analysis-card">
      <div className="analysis-card-title">
        <div>
          <span>Model contribution</span>
          <h3>Why they match</h3>
        </div>

        <Gauge size={20} />
      </div>

      <div className="driver-list">
        {drivers.map(
          (driver, index) => (
            <div
              className="driver-row"
              key={driver.key}
            >
              <span className="driver-rank">
                {String(
                  index + 1
                ).padStart(2, "0")}
              </span>

              <div>
                <strong>
                  {driver.longLabel}
                </strong>

                <small>
                  Share of positive cosine contribution
                </small>
              </div>

              <span className="driver-score">
                {driver.contributionShare.toFixed(
                  0
                )}
                %
              </span>
            </div>
          )
        )}
      </div>
    </section>
  );
}

export function DifferencePanel({
  differences,
  left,
  right,
}) {
  return (
    <section className="analysis-card">
      <div className="analysis-card-title">
        <div>
          <span>Separation</span>
          <h3>Biggest differences</h3>
        </div>

        <Activity size={20} />
      </div>

      <div className="difference-list">
        {differences.map((difference) => (
          <div key={difference.key}>
            <span>
              {difference.longLabel}
            </span>

            <strong>
              {display(
                difference,
                left[difference.key]
              )}
              {" ↔ "}
              {display(
                difference,
                right[difference.key]
              )}
            </strong>
          </div>
        ))}
      </div>
    </section>
  );
}

export function MatchStability({
  stability,
}) {
  if (!stability) {
    return null;
  }

  return (
    <section className="analysis-card">
      <div className="analysis-card-title">
        <div>
          <span>Robustness check</span>
          <h3>Match stability</h3>
        </div>

        <Waves size={20} />
      </div>

      <div className="stability-list">
        {stability.scores.map((item) => (
          <div
            key={item.key}
            className="stability-row"
          >
            <span>{item.label}</span>

            <div
              className="stability-track"
              aria-hidden="true"
            >
              <i
                style={{
                  width: `${item.score}%`,
                }}
              />
            </div>

            <strong>
              {item.score.toFixed(1)}%
            </strong>
          </div>
        ))}
      </div>

      <div className="stability-summary">
        <strong>{stability.label}</strong>

        <span>
          {stability.range.toFixed(1)} point spread
          across stat bases
        </span>
      </div>
    </section>
  );
}

export function ModelDetails({
  playerCount,
  candidateCount,
  profile,
  statBasis,
  poolFilter,
  season,
  weights,
}) {
  const poolLabel =
    POOL_FILTERS.find(
      (option) =>
        option.key === poolFilter
    )?.label ?? poolFilter;

  return (
    <section className="analysis-card">
      <div className="analysis-card-title">
        <div>
          <span>Model details</span>
          <h3>Current configuration</h3>
        </div>

        <Database size={20} />
      </div>

      <dl className="model-detail-grid">
        <div>
          <dt>Algorithm</dt>
          <dd>Weighted cosine</dd>
        </div>

        <div>
          <dt>League pool</dt>
          <dd>{playerCount}</dd>
        </div>

        <div>
          <dt>Candidates</dt>
          <dd>{candidateCount}</dd>
        </div>

        <div>
          <dt>Features</dt>
          <dd>{FEATURES.length}</dd>
        </div>

        <div>
          <dt>Stat basis</dt>
          <dd>
            {STAT_BASES[statBasis].label}
          </dd>
        </div>

        <div>
          <dt>Comparison pool</dt>
          <dd>{poolLabel}</dd>
        </div>

        <div>
          <dt>Standardization</dt>
          <dd>League z-score</dd>
        </div>

        <div>
          <dt>Profile</dt>
          <dd>{profile}</dd>
        </div>

        <div>
          <dt>Season</dt>
          <dd>{season ?? "—"}</dd>
        </div>
      </dl>

      <details className="weight-drawer">
        <summary>Feature weights</summary>

        <div>
          {FEATURES.map((feature) => (
            <span key={feature.key}>
              <strong>{feature.label}</strong>
              {Number(
                weights[feature.key] ?? 0
              ).toFixed(2)}
            </span>
          ))}
        </div>
      </details>
    </section>
  );
}
