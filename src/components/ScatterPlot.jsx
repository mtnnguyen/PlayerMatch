import {
  useMemo,
  useState,
} from "react";

import {
  FEATURES,
} from "../config/modelConfig";

import {
  buildScatterSummary,
  formatFeatureValue,
  getFeature,
  summarizeValues,
} from "../model/visualAnalytics";

const WIDTH = 760;
const HEIGHT = 420;

const PADDING = {
  left: 66,
  right: 28,
  top: 28,
  bottom: 54,
};

function paddedExtent(summary) {
  const range =
    summary.max - summary.min;

  const pad =
    range === 0
      ? 1
      : range * 0.08;

  return {
    min: summary.min - pad,
    max: summary.max + pad,
  };
}

function makeScale(
  min,
  max,
  start,
  end
) {
  const range =
    max - min || 1;

  return (value) =>
    start +
    ((value - min) / range) *
      (end - start);
}

function tickValues(min, max, count = 5) {
  const range = max - min;

  return Array.from(
    { length: count },
    (_, index) =>
      min +
      (range * index) /
        (count - 1)
  );
}

export default function ScatterPlot({
  players,
  left,
  right,
  onSelectComparison,
}) {
  const [xKey, setXKey] =
    useState("usage");

  const [yKey, setYKey] =
    useState("tsPct");

  const [hoveredId, setHoveredId] =
    useState(null);

  const xFeature =
    getFeature(xKey);

  const yFeature =
    getFeature(yKey);

  const xSummary =
    useMemo(
      () =>
        summarizeValues(
          players,
          xKey
        ),
      [players, xKey]
    );

  const ySummary =
    useMemo(
      () =>
        summarizeValues(
          players,
          yKey
        ),
      [players, yKey]
    );

  const xExtent =
    paddedExtent(xSummary);

  const yExtent =
    paddedExtent(ySummary);

  const xScale =
    makeScale(
      xExtent.min,
      xExtent.max,
      PADDING.left,
      WIDTH - PADDING.right
    );

  const yScale =
    makeScale(
      yExtent.min,
      yExtent.max,
      HEIGHT - PADDING.bottom,
      PADDING.top
    );

  const xTicks =
    tickValues(
      xExtent.min,
      xExtent.max
    );

  const yTicks =
    tickValues(
      yExtent.min,
      yExtent.max
    );

  const hovered =
    players.find(
      (player) =>
        player.id === hoveredId
    ) ?? null;

  const summary =
    buildScatterSummary({
      players,
      xFeature,
      yFeature,
      left,
      right,
    });

  return (
    <div className="visual-analytics-grid">
      <section className="v3-card analytics-chart-card">
        <div className="v3-card-title analytics-chart-title">
          <div>
            <span>PLAYER LANDSCAPE</span>
            <h3>
              How two stats move together
            </h3>
            <p>
              Every dot is an eligible NBA player. Click a dot to compare that player.
            </p>
          </div>

          <div className="chart-selectors">
            <label>
              <span>X axis</span>
              <select
                value={xKey}
                onChange={(event) =>
                  setXKey(
                    event.target.value
                  )
                }
              >
                {FEATURES.map(
                  (feature) => (
                    <option
                      key={
                        feature.key
                      }
                      value={
                        feature.key
                      }
                      disabled={
                        feature.key ===
                        yKey
                      }
                    >
                      {
                        feature.longLabel
                      }
                    </option>
                  )
                )}
              </select>
            </label>

            <label>
              <span>Y axis</span>
              <select
                value={yKey}
                onChange={(event) =>
                  setYKey(
                    event.target.value
                  )
                }
              >
                {FEATURES.map(
                  (feature) => (
                    <option
                      key={
                        feature.key
                      }
                      value={
                        feature.key
                      }
                      disabled={
                        feature.key ===
                        xKey
                      }
                    >
                      {
                        feature.longLabel
                      }
                    </option>
                  )
                )}
              </select>
            </label>
          </div>
        </div>

        <div className="scatter-wrap">
          <svg
            className="scatter-chart"
            viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
            role="img"
            aria-label={`${xFeature.longLabel} versus ${yFeature.longLabel} for ${players.length} NBA players`}
          >
            {xTicks.map(
              (value, index) => {
                const x =
                  xScale(value);

                return (
                  <g
                    key={`x-${index}`}
                  >
                    <line
                      x1={x}
                      x2={x}
                      y1={
                        PADDING.top
                      }
                      y2={
                        HEIGHT -
                        PADDING.bottom
                      }
                      className="scatter-grid-line"
                    />

                    <text
                      x={x}
                      y={
                        HEIGHT -
                        31
                      }
                      textAnchor="middle"
                      className="scatter-tick"
                    >
                      {formatFeatureValue(
                        xFeature,
                        value
                      )}
                    </text>
                  </g>
                );
              }
            )}

            {yTicks.map(
              (value, index) => {
                const y =
                  yScale(value);

                return (
                  <g
                    key={`y-${index}`}
                  >
                    <line
                      x1={
                        PADDING.left
                      }
                      x2={
                        WIDTH -
                        PADDING.right
                      }
                      y1={y}
                      y2={y}
                      className="scatter-grid-line"
                    />

                    <text
                      x={
                        PADDING.left -
                        10
                      }
                      y={y + 3}
                      textAnchor="end"
                      className="scatter-tick"
                    >
                      {formatFeatureValue(
                        yFeature,
                        value
                      )}
                    </text>
                  </g>
                );
              }
            )}

            <text
              x={
                (PADDING.left +
                  WIDTH -
                  PADDING.right) /
                2
              }
              y={
                HEIGHT - 7
              }
              textAnchor="middle"
              className="scatter-axis-label"
            >
              {xFeature.longLabel}
            </text>

            <text
              x="14"
              y={
                (PADDING.top +
                  HEIGHT -
                  PADDING.bottom) /
                2
              }
              textAnchor="middle"
              className="scatter-axis-label"
              transform={`rotate(-90 14 ${
                (PADDING.top +
                  HEIGHT -
                  PADDING.bottom) /
                2
              })`}
            >
              {yFeature.longLabel}
            </text>

            {players.map(
              (player) => {
                const isLeft =
                  player.id ===
                  left.id;

                const isRight =
                  player.id ===
                  right.id;

                const isHovered =
                  player.id ===
                  hoveredId;

                const className = [
                  "scatter-point",
                  isLeft
                    ? "scatter-point--left"
                    : "",
                  isRight
                    ? "scatter-point--right"
                    : "",
                  isHovered
                    ? "scatter-point--hovered"
                    : "",
                ]
                  .filter(Boolean)
                  .join(" ");

                return (
                  <circle
                    key={
                      player.id
                    }
                    cx={xScale(
                      Number(
                        player[
                          xKey
                        ] ?? 0
                      )
                    )}
                    cy={yScale(
                      Number(
                        player[
                          yKey
                        ] ?? 0
                      )
                    )}
                    r={
                      isLeft ||
                      isRight
                        ? 6
                        : isHovered
                        ? 5
                        : 2.5
                    }
                    className={
                      className
                    }
                    onMouseEnter={() =>
                      setHoveredId(
                        player.id
                      )
                    }
                    onMouseLeave={() =>
                      setHoveredId(
                        null
                      )
                    }
                    onClick={() => {
                      if (
                        player.id !==
                        left.id
                      ) {
                        onSelectComparison(
                          player
                        );
                      }
                    }}
                  >
                    <title>
                      {player.name}:{" "}
                      {formatFeatureValue(
                        xFeature,
                        player[
                          xKey
                        ]
                      )}{" "}
                      {xFeature.label},{" "}
                      {formatFeatureValue(
                        yFeature,
                        player[
                          yKey
                        ]
                      )}{" "}
                      {yFeature.label}
                    </title>
                  </circle>
                );
              }
            )}

            {[left, right].map(
              (player) => {
                const x =
                  xScale(
                    Number(
                      player[
                        xKey
                      ] ?? 0
                    )
                  );

                const y =
                  yScale(
                    Number(
                      player[
                        yKey
                      ] ?? 0
                    )
                  );

                return (
                  <text
                    key={`label-${player.id}`}
                    x={x + 9}
                    y={y - 8}
                    className="scatter-player-label"
                  >
                    {player.name}
                  </text>
                );
              }
            )}
          </svg>

          <div className="scatter-hover-readout">
            {hovered ? (
              <>
                <strong>
                  {hovered.name}
                </strong>
                <span>
                  {xFeature.label}:{" "}
                  {formatFeatureValue(
                    xFeature,
                    hovered[xKey]
                  )}
                  {" · "}
                  {yFeature.label}:{" "}
                  {formatFeatureValue(
                    yFeature,
                    hovered[yKey]
                  )}
                </span>
              </>
            ) : (
              <>
                <strong>
                  Explore the league
                </strong>
                <span>
                  Hover any dot for exact values. Click a player to make them the comparison.
                </span>
              </>
            )}
          </div>
        </div>
      </section>

      <aside className="v3-card visual-insight-card">
        <div className="v3-card-title">
          <div>
            <span>ANALYST READ</span>
            <h3>
              What does this chart say?
            </h3>
          </div>
        </div>

        <article>
          <span>
            League relationship
          </span>
          <strong>
            {
              summary.relationship
            }
          </strong>
          <p>
            {summary.leagueRead}
          </p>
        </article>

        <article>
          <span>{left.name}</span>
          <p>{summary.leftRead}</p>
        </article>

        <article>
          <span>{right.name}</span>
          <p>{summary.rightRead}</p>
        </article>

        <article className="visual-insight-caution">
          <span>
            Do not overread it
          </span>
          <p>{summary.caveat}</p>
        </article>

        <details className="visual-advanced-detail">
          <summary>
            Advanced detail
          </summary>
          <p>
            Pearson correlation:{" "}
            <strong>
              {summary.correlation.toFixed(
                2
              )}
            </strong>
          </p>
        </details>
      </aside>
    </div>
  );
}
