import {
  useMemo,
  useState,
} from "react";

import {
  FEATURES,
} from "../config/modelConfig";

import {
  buildDistributionSummary,
  buildHistogram,
  formatFeatureValue,
  getFeature,
} from "../model/visualAnalytics";

const WIDTH = 760;
const HEIGHT = 400;

const PADDING = {
  left: 54,
  right: 26,
  top: 28,
  bottom: 60,
};

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

export default function DistributionChart({
  players,
  left,
  right,
}) {
  const [featureKey, setFeatureKey] =
    useState("ast");

  const feature =
    getFeature(featureKey);

  const histogram =
    useMemo(
      () =>
        buildHistogram(
          players,
          featureKey,
          12
        ),
      [
        players,
        featureKey,
      ]
    );

  const summary =
    buildDistributionSummary({
      players,
      feature,
      left,
      right,
    });

  const maxCount =
    Math.max(
      1,
      ...histogram.bins.map(
        (bin) => bin.count
      )
    );

  const xScale =
    makeScale(
      histogram.min,
      histogram.max,
      PADDING.left,
      WIDTH - PADDING.right
    );

  const yScale =
    makeScale(
      0,
      maxCount,
      HEIGHT - PADDING.bottom,
      PADDING.top
    );

  const barWidth =
    (WIDTH -
      PADDING.left -
      PADDING.right) /
    histogram.bins.length;

  const leftX =
    xScale(
      Number(
        left[
          featureKey
        ] ?? 0
      )
    );

  const rightX =
    xScale(
      Number(
        right[
          featureKey
        ] ?? 0
      )
    );

  return (
    <div className="visual-analytics-grid">
      <section className="v3-card analytics-chart-card">
        <div className="v3-card-title analytics-chart-title">
          <div>
            <span>LEAGUE DISTRIBUTION</span>
            <h3>
              Where does this number sit in the NBA?
            </h3>
            <p>
              The bars show how common each range is across the eligible player pool.
            </p>
          </div>

          <label className="single-chart-selector">
            <span>Stat</span>

            <select
              value={featureKey}
              onChange={(event) =>
                setFeatureKey(
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
                    {
                      item.longLabel
                    }
                  </option>
                )
              )}
            </select>
          </label>
        </div>

        <div className="distribution-wrap">
          <svg
            className="distribution-chart"
            viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
            role="img"
            aria-label={`${feature.longLabel} distribution across ${players.length} NBA players`}
          >
            {histogram.bins.map(
              (bin) => {
                const x =
                  PADDING.left +
                  bin.index *
                    barWidth +
                  2;

                const top =
                  yScale(
                    bin.count
                  );

                const height =
                  HEIGHT -
                  PADDING.bottom -
                  top;

                return (
                  <rect
                    key={
                      bin.index
                    }
                    x={x}
                    y={top}
                    width={Math.max(
                      2,
                      barWidth - 4
                    )}
                    height={height}
                    className="distribution-bar"
                  >
                    <title>
                      {bin.count} players
                    </title>
                  </rect>
                );
              }
            )}

            <line
              x1={
                PADDING.left
              }
              x2={
                WIDTH -
                PADDING.right
              }
              y1={
                HEIGHT -
                PADDING.bottom
              }
              y2={
                HEIGHT -
                PADDING.bottom
              }
              className="distribution-axis"
            />

            <line
              x1={xScale(
                histogram.median
              )}
              x2={xScale(
                histogram.median
              )}
              y1={
                PADDING.top
              }
              y2={
                HEIGHT -
                PADDING.bottom
              }
              className="distribution-median"
            />

            <text
              x={xScale(
                histogram.median
              )}
              y={20}
              textAnchor="middle"
              className="distribution-median-label"
            >
              League median
            </text>

            <line
              x1={leftX}
              x2={leftX}
              y1={
                PADDING.top + 18
              }
              y2={
                HEIGHT -
                PADDING.bottom +
                6
              }
              className="distribution-player-line distribution-player-line--left"
            />

            <line
              x1={rightX}
              x2={rightX}
              y1={
                PADDING.top + 18
              }
              y2={
                HEIGHT -
                PADDING.bottom +
                6
              }
              className="distribution-player-line distribution-player-line--right"
            />

            <text
              x={leftX}
              y={
                HEIGHT - 28
              }
              textAnchor="middle"
              className="distribution-player-label distribution-player-label--left"
            >
              {left.name}
            </text>

            <text
              x={rightX}
              y={
                HEIGHT - 12
              }
              textAnchor="middle"
              className="distribution-player-label distribution-player-label--right"
            >
              {right.name}
            </text>

            <text
              x={
                PADDING.left
              }
              y={
                HEIGHT - 45
              }
              textAnchor="start"
              className="distribution-tick"
            >
              {formatFeatureValue(
                feature,
                histogram.min
              )}
            </text>

            <text
              x={
                WIDTH -
                PADDING.right
              }
              y={
                HEIGHT - 45
              }
              textAnchor="end"
              className="distribution-tick"
            >
              {formatFeatureValue(
                feature,
                histogram.max
              )}
            </text>
          </svg>

          <div className="distribution-key">
            <span>
              <i className="distribution-key-bar" />
              Player count
            </span>

            <span>
              <i className="distribution-key-left" />
              {left.name}
            </span>

            <span>
              <i className="distribution-key-right" />
              {right.name}
            </span>
          </div>
        </div>
      </section>

      <aside className="v3-card visual-insight-card">
        <div className="v3-card-title">
          <div>
            <span>ANALYST READ</span>
            <h3>
              Is this stat actually unusual?
            </h3>
          </div>
        </div>

        <article>
          <span>Typical league range</span>
          <p>
            {summary.typicalRange}
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

        <article>
          <span>
            Comparison takeaway
          </span>
          <p>
            {summary.comparison}
          </p>
        </article>

        <article className="visual-insight-caution">
          <span>
            Do not overread it
          </span>
          <p>{summary.caveat}</p>
        </article>
      </aside>
    </div>
  );
}
