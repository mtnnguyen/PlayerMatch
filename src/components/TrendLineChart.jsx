import {
  FEATURES,
} from "../config/modelConfig";

import {
  formatHistoricalValue,
} from "../model/historical";

const WIDTH = 760;
const HEIGHT = 410;

const PADDING = {
  left: 64,
  right: 28,
  top: 28,
  bottom: 54,
};

function extent(values) {
  if (!values.length) {
    return { min: 0, max: 1 };
  }

  const min = Math.min(...values);
  const max = Math.max(...values);
  const range = max - min || 1;
  const pad = range * 0.12;

  return {
    min: min - pad,
    max: max + pad,
  };
}

function scale(min, max, start, end) {
  const range = max - min || 1;

  return (value) =>
    start +
    ((value - min) / range) *
      (end - start);
}

function buildPath(rows, seasons, xScale, yScale, featureKey) {
  const points = rows
    .map((row) => {
      const seasonIndex =
        seasons.indexOf(row.season);

      if (seasonIndex < 0) {
        return null;
      }

      return {
        x: xScale(seasonIndex),
        y: yScale(
          Number(
            row.player[
              featureKey
            ] ?? 0
          )
        ),
      };
    })
    .filter(Boolean);

  if (!points.length) {
    return "";
  }

  return points
    .map(
      (point, index) =>
        `${index === 0 ? "M" : "L"} ${point.x} ${point.y}`
    )
    .join(" ");
}

export default function TrendLineChart({
  left,
  right,
  leftHistory,
  rightHistory,
  feature,
  onFeatureChange,
  allSeasons,
}) {
  const values = [
    ...leftHistory.map(
      (row) =>
        Number(
          row.player[
            feature.key
          ] ?? 0
        )
    ),
    ...rightHistory.map(
      (row) =>
        Number(
          row.player[
            feature.key
          ] ?? 0
        )
    ),
  ];

  const yExtent = extent(values);

  const xScale =
    scale(
      0,
      Math.max(
        1,
        allSeasons.length - 1
      ),
      PADDING.left,
      WIDTH - PADDING.right
    );

  const yScale =
    scale(
      yExtent.min,
      yExtent.max,
      HEIGHT - PADDING.bottom,
      PADDING.top
    );

  const yTicks =
    Array.from(
      { length: 5 },
      (_, index) =>
        yExtent.min +
        ((yExtent.max -
          yExtent.min) *
          index) /
          4
    );

  const leftPath =
    buildPath(
      leftHistory,
      allSeasons,
      xScale,
      yScale,
      feature.key
    );

  const rightPath =
    buildPath(
      rightHistory,
      allSeasons,
      xScale,
      yScale,
      feature.key
    );

  return (
    <section className="v3-card historical-chart-card">
      <div className="v3-card-title historical-chart-title">
        <div>
          <span>DEVELOPMENT TREND</span>
          <h3>
            How has this stat changed over time?
          </h3>
          <p>
            Each point is one regular season where the player met the historical eligibility filters.
          </p>
        </div>

        <label className="historical-stat-select">
          <span>Stat</span>
          <select
            value={feature.key}
            onChange={(event) =>
              onFeatureChange(
                event.target.value
              )
            }
          >
            {FEATURES.map(
              (item) => (
                <option
                  key={item.key}
                  value={item.key}
                >
                  {item.longLabel}
                </option>
              )
            )}
          </select>
        </label>
      </div>

      <div className="historical-chart-wrap">
        <svg
          className="historical-line-chart"
          viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
          role="img"
          aria-label={`${feature.longLabel} trend for ${left.name} and ${right.name}`}
        >
          {yTicks.map(
            (value, index) => {
              const y =
                yScale(value);

              return (
                <g key={`y-${index}`}>
                  <line
                    x1={PADDING.left}
                    x2={
                      WIDTH -
                      PADDING.right
                    }
                    y1={y}
                    y2={y}
                    className="historical-grid-line"
                  />

                  <text
                    x={
                      PADDING.left -
                      10
                    }
                    y={y + 3}
                    textAnchor="end"
                    className="historical-axis-tick"
                  >
                    {formatHistoricalValue(
                      feature,
                      value
                    )}
                  </text>
                </g>
              );
            }
          )}

          {allSeasons.map(
            (season, index) => {
              const x =
                xScale(index);

              return (
                <g key={season}>
                  <line
                    x1={x}
                    x2={x}
                    y1={PADDING.top}
                    y2={
                      HEIGHT -
                      PADDING.bottom
                    }
                    className="historical-season-line"
                  />

                  <text
                    x={x}
                    y={
                      HEIGHT - 24
                    }
                    textAnchor="middle"
                    className="historical-axis-tick"
                  >
                    {season}
                  </text>
                </g>
              );
            }
          )}

          {leftPath && (
            <path
              d={leftPath}
              className="historical-series historical-series--left"
            />
          )}

          {rightPath && (
            <path
              d={rightPath}
              className="historical-series historical-series--right"
            />
          )}

          {leftHistory.map(
            (row) => {
              const index =
                allSeasons.indexOf(
                  row.season
                );

              if (index < 0) {
                return null;
              }

              return (
                <circle
                  key={`left-${row.season}`}
                  cx={xScale(index)}
                  cy={yScale(
                    Number(
                      row.player[
                        feature.key
                      ] ?? 0
                    )
                  )}
                  r="5"
                  className="historical-point historical-point--left"
                >
                  <title>
                    {left.name} · {row.season}:{" "}
                    {formatHistoricalValue(
                      feature,
                      row.player[
                        feature.key
                      ]
                    )}
                  </title>
                </circle>
              );
            }
          )}

          {rightHistory.map(
            (row) => {
              const index =
                allSeasons.indexOf(
                  row.season
                );

              if (index < 0) {
                return null;
              }

              return (
                <circle
                  key={`right-${row.season}`}
                  cx={xScale(index)}
                  cy={yScale(
                    Number(
                      row.player[
                        feature.key
                      ] ?? 0
                    )
                  )}
                  r="5"
                  className="historical-point historical-point--right"
                >
                  <title>
                    {right.name} · {row.season}:{" "}
                    {formatHistoricalValue(
                      feature,
                      row.player[
                        feature.key
                      ]
                    )}
                  </title>
                </circle>
              );
            }
          )}
        </svg>

        <div className="historical-legend">
          <span>
            <i className="historical-legend-left" />
            {left.name}
          </span>

          <span>
            <i className="historical-legend-right" />
            {right.name}
          </span>
        </div>
      </div>
    </section>
  );
}
