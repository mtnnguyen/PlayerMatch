import {
  useMemo,
  useState,
} from "react";

import {
  Info,
} from "lucide-react";

import {
  nearestOnMap,
  runPCA,
} from "../model/pca";

const WIDTH = 760;
const HEIGHT = 430;

const PADDING = {
  left: 54,
  right: 28,
  top: 34,
  bottom: 48,
};

function extent(
  values
) {
  const min =
    Math.min(...values);

  const max =
    Math.max(...values);

  const range =
    max - min || 1;

  const pad =
    range * 0.08;

  return {
    min: min - pad,
    max: max + pad,
  };
}

function scale(
  min,
  max,
  start,
  end
) {
  const range =
    max - min || 1;

  return (value) =>
    start +
    ((value - min) /
      range) *
      (end - start);
}

function loadingText(
  axis
) {
  return axis.loadings
    .map(
      (item) =>
        item.shortLabel
    )
    .join(" · ");
}

export default function PlayerStyleMap({
  players,
  left,
  right,
  weights,
  profile,
  onSelectComparison,
}) {
  const [
    hoveredId,
    setHoveredId,
  ] = useState(null);

  const [
    positionLens,
    setPositionLens,
  ] = useState("All");

  const pca =
    useMemo(
      () =>
        runPCA(
          players,
          weights
        ),
      [
        players,
        weights,
      ]
    );

  if (!pca) {
    return null;
  }

  const xExtent =
    extent(
      pca.points.map(
        (point) => point.x
      )
    );

  const yExtent =
    extent(
      pca.points.map(
        (point) => point.y
      )
    );

  const xScale =
    scale(
      xExtent.min,
      xExtent.max,
      PADDING.left,
      WIDTH -
        PADDING.right
    );

  const yScale =
    scale(
      yExtent.min,
      yExtent.max,
      HEIGHT -
        PADDING.bottom,
      PADDING.top
    );

  const hovered =
    pca.points.find(
      (point) =>
        point.player.id ===
        hoveredId
    ) ?? null;

  const nearest =
    nearestOnMap(
      pca,
      left.id,
      5
    );

  function visible(
    player
  ) {
    return (
      positionLens ===
        "All" ||
      player.positionGroup ===
        positionLens
    );
  }

  return (
    <div className="visual-analytics-grid">
      <section className="v3-card analytics-chart-card">
        <div className="v3-card-title analytics-chart-title">
          <div>
            <span>
              MULTIVARIATE PLAYER MAP
            </span>

            <h3>
              Player Style Map
            </h3>

            <p>
              All ten model features are compressed into two dimensions. Players closer together have more similar overall statistical shapes.
            </p>
          </div>

          <div className="style-map-controls">
            <label>
              <span>
                Position lens
              </span>

              <select
                value={
                  positionLens
                }
                onChange={(
                  event
                ) =>
                  setPositionLens(
                    event.target
                      .value
                  )
                }
              >
                <option>
                  All
                </option>
                <option>
                  Guard
                </option>
                <option>
                  Wing
                </option>
                <option>
                  Big
                </option>
              </select>
            </label>

            <div className="style-map-profile-chip">
              {profile} map
            </div>
          </div>
        </div>

        <div className="style-map-wrap">
          <svg
            className="style-map-chart"
            viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
            role="img"
            aria-label={`PCA player style map showing ${players.length} NBA players`}
          >
            <line
              x1={
                PADDING.left
              }
              x2={
                WIDTH -
                PADDING.right
              }
              y1={yScale(0)}
              y2={yScale(0)}
              className="style-map-zero-line"
            />

            <line
              x1={xScale(0)}
              x2={xScale(0)}
              y1={
                PADDING.top
              }
              y2={
                HEIGHT -
                PADDING.bottom
              }
              className="style-map-zero-line"
            />

            <text
              x={
                WIDTH -
                PADDING.right
              }
              y={
                HEIGHT - 9
              }
              textAnchor="end"
              className="style-map-axis-label"
            >
              Style axis 1 →
            </text>

            <text
              x="12"
              y={
                PADDING.top
              }
              className="style-map-axis-label"
            >
              ↑ Style axis 2
            </text>

            {pca.points.map(
              (point) => {
                const player =
                  point.player;

                const isLeft =
                  player.id ===
                  left.id;

                const isRight =
                  player.id ===
                  right.id;

                const isHovered =
                  player.id ===
                  hoveredId;

                const isVisible =
                  visible(
                    player
                  );

                const className = [
                  "style-map-point",
                  isLeft
                    ? "style-map-point--left"
                    : "",
                  isRight
                    ? "style-map-point--right"
                    : "",
                  isHovered
                    ? "style-map-point--hovered"
                    : "",
                  !isVisible
                    ? "style-map-point--dimmed"
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
                      point.x
                    )}
                    cy={yScale(
                      point.y
                    )}
                    r={
                      isLeft ||
                      isRight
                        ? 6
                        : isHovered
                        ? 5
                        : 2.7
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
                      {player.name} ·{" "}
                      {player.team}
                      {player.position
                        ? ` · ${player.position}`
                        : ""}
                    </title>
                  </circle>
                );
              }
            )}

            {[left, right].map(
              (player) => {
                const point =
                  pca.points.find(
                    (item) =>
                      item.player
                        .id ===
                      player.id
                  );

                if (!point) {
                  return null;
                }

                return (
                  <text
                    key={`map-label-${player.id}`}
                    x={
                      xScale(
                        point.x
                      ) + 9
                    }
                    y={
                      yScale(
                        point.y
                      ) - 8
                    }
                    className="style-map-player-label"
                  >
                    {player.name}
                  </text>
                );
              }
            )}
          </svg>

          <div className="style-map-hover">
            {hovered ? (
              <>
                <strong>
                  {
                    hovered.player
                      .name
                  }
                </strong>

                <span>
                  {
                    hovered.player
                      .team
                  }
                  {hovered.player
                    .position
                    ? ` · ${hovered.player.position}`
                    : ""}
                  {" · "}
                  click to compare
                </span>
              </>
            ) : (
              <>
                <strong>
                  Explore player styles
                </strong>

                <span>
                  Hover any dot for the player. Click a dot to make them the comparison.
                </span>
              </>
            )}
          </div>
        </div>
      </section>

      <aside className="v3-card style-map-insight-card">
        <div className="v3-card-title">
          <div>
            <span>
              ANALYST READ
            </span>

            <h3>
              How should I read this map?
            </h3>
          </div>
        </div>

        <article className="style-map-explained">
          <span>
            Map coverage
          </span>

          <strong>
            {pca.explainedTotal.toFixed(
              0
            )}
            % of profile variation
          </strong>

          <p>
            These two axes summarize {pca.explainedTotal.toFixed(
              0
            )}% of the variation across all ten features. The rest is intentionally left out so the profiles can be shown on a flat screen.
          </p>
        </article>

        <article>
          <span>
            Horizontal direction
          </span>

          <strong>
            {loadingText(
              pca.axis1
            )}
          </strong>

          <p>
            Moving right is most associated with {pca.axis1.description}.
          </p>
        </article>

        <article>
          <span>
            Vertical direction
          </span>

          <strong>
            {loadingText(
              pca.axis2
            )}
          </strong>

          <p>
            Moving upward is most associated with {pca.axis2.description}.
          </p>
        </article>

        <article className="style-map-neighbors">
          <span>
            Closest map neighbors to {left.name}
          </span>

          <div>
            {nearest.map(
              (
                point,
                index
              ) => (
                <button
                  type="button"
                  key={
                    point.player
                      .id
                  }
                  onClick={() =>
                    onSelectComparison(
                      point.player
                    )
                  }
                >
                  <span>
                    {String(
                      index + 1
                    ).padStart(
                      2,
                      "0"
                    )}
                  </span>

                  <strong>
                    {
                      point.player
                        .name
                    }
                  </strong>

                  <small>
                    {
                      point.player
                        .team
                    }
                  </small>
                </button>
              )
            )}
          </div>
        </article>

        <article className="visual-insight-caution">
          <span>
            Important limitation
          </span>

          <p>
            Nearby dots are similar in this two-dimensional summary, not automatically identical in the full model. Use the regular similarity score and Match Drivers before making a final comparison.
          </p>
        </article>

        <details className="visual-advanced-detail">
          <summary>
            Advanced PCA details
          </summary>

          <p>
            Axis 1 explains{" "}
            <strong>
              {pca.axis1.explained.toFixed(
                1
              )}
              %
            </strong>
            {" "}of total variance. Axis 2 explains{" "}
            <strong>
              {pca.axis2.explained.toFixed(
                1
              )}
              %
            </strong>
            .
          </p>

          <p>
            <Info
              size={13}
              aria-hidden="true"
            />
            {" "}The map uses standardized features and the active {profile} model weights before PCA.
          </p>
        </details>
      </aside>
    </div>
  );
}
