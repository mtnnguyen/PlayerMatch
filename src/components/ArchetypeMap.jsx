import {
  useMemo,
  useState,
} from "react";

import {
  Boxes,
  Info,
} from "lucide-react";

import {
  clusterForPlayer,
  nearestClusterMates,
  runKMeans,
} from "../model/clustering";

import {
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

function traitLabel(
  trait
) {
  const direction =
    trait.value >= 0
      ? "Higher"
      : "Lower";

  return `${direction} ${trait.label.toLowerCase()}`;
}

function sameClusterText(
  left,
  right,
  leftCluster,
  rightCluster
) {
  if (
    !leftCluster ||
    !rightCluster
  ) {
    return "";
  }

  if (
    leftCluster.id ===
    rightCluster.id
  ) {
    return `${left.name} and ${right.name} are assigned to the same data-driven group: ${leftCluster.name}.`;
  }

  return `${left.name} is grouped as ${leftCluster.name}, while ${right.name} is grouped as ${rightCluster.name}. That suggests their broader statistical roles differ even if the similarity model still sees meaningful overlap.`;
}

export default function ArchetypeMap({
  players,
  left,
  right,
  weights,
  profile,
  onSelectComparison,
}) {
  const [
    clusterCount,
    setClusterCount,
  ] = useState(6);

  const [
    hoveredId,
    setHoveredId,
  ] = useState(null);

  const clustering =
    useMemo(
      () =>
        runKMeans(
          players,
          weights,
          clusterCount
        ),
      [
        players,
        weights,
        clusterCount,
      ]
    );

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

  if (
    !clustering ||
    !pca
  ) {
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

  const leftCluster =
    clusterForPlayer(
      clustering,
      players,
      left.id
    );

  const rightCluster =
    clusterForPlayer(
      clustering,
      players,
      right.id
    );

  const neighbors =
    nearestClusterMates(
      clustering,
      players,
      left.id,
      5
    );

  const hovered =
    players.find(
      (player) =>
        player.id ===
        hoveredId
    ) ?? null;

  return (
    <div className="visual-analytics-grid">
      <section className="v3-card analytics-chart-card">
        <div className="v3-card-title analytics-chart-title">
          <div>
            <span>
              UNSUPERVISED PLAYER GROUPS
            </span>

            <h3>
              Data-Driven Archetypes
            </h3>

            <p>
              K-means groups players using the full weighted statistical profile. The map uses PCA only to display those groups in two dimensions.
            </p>
          </div>

          <div className="archetype-controls">
            <label>
              <span>
                Number of groups
              </span>

              <select
                value={
                  clusterCount
                }
                onChange={(
                  event
                ) =>
                  setClusterCount(
                    Number(
                      event.target
                        .value
                    )
                  )
                }
              >
                <option value="5">
                  5 groups
                </option>
                <option value="6">
                  6 groups
                </option>
                <option value="7">
                  7 groups
                </option>
              </select>
            </label>

            <div className="archetype-profile-chip">
              {profile} model
            </div>
          </div>
        </div>

        <div className="archetype-map-wrap">
          <svg
            className="archetype-map-chart"
            viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
            role="img"
            aria-label={`${clusterCount} K-means player groups plotted on the PCA style map`}
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

            {pca.points.map(
              (
                point,
                index
              ) => {
                const player =
                  point.player;

                const clusterId =
                  clustering
                    .assignments[
                    index
                  ];

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
                  "archetype-point",
                  `archetype-point--cluster-${clusterId}`,
                  isLeft
                    ? "archetype-point--left"
                    : "",
                  isRight
                    ? "archetype-point--right"
                    : "",
                  isHovered
                    ? "archetype-point--hovered"
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
                        ? 6.5
                        : isHovered
                        ? 5
                        : 2.8
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
                      {player.name}
                      {" · "}
                      {
                        clustering
                          .clusters[
                          clusterId
                        ].name
                      }
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
                    key={`cluster-label-${player.id}`}
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

          <div className="archetype-map-hover">
            {hovered ? (
              <>
                <strong>
                  {hovered.name}
                </strong>

                <span>
                  {
                    clustering
                      .clusters[
                      clustering
                        .assignments[
                        players.findIndex(
                          (player) =>
                            player.id ===
                            hovered.id
                        )
                      ]
                    ].name
                  }
                  {" · "}
                  click to compare
                </span>
              </>
            ) : (
              <>
                <strong>
                  Explore player groups
                </strong>

                <span>
                  Each color is a data-driven group. Hover a player to see the assigned archetype.
                </span>
              </>
            )}
          </div>
        </div>
      </section>

      <aside className="v3-card archetype-insight-card">
        <div className="v3-card-title">
          <div>
            <span>
              DATA-DRIVEN ARCHETYPE
            </span>

            <h3>
              {leftCluster?.name}
            </h3>
          </div>

          <Boxes
            size={19}
            aria-hidden="true"
          />
        </div>

        <article className="archetype-summary">
          <span>
            What defines this group
          </span>

          <p>
            {
              leftCluster?.description
            }
          </p>
        </article>

        <article>
          <span>
            Strongest defining traits
          </span>

          <div className="archetype-traits">
            {leftCluster?.traits.map(
              (trait) => (
                <div
                  key={
                    trait.key
                  }
                >
                  <strong>
                    {
                      trait.shortLabel
                    }
                  </strong>

                  <span>
                    {
                      traitLabel(
                        trait
                      )
                    }
                  </span>
                </div>
              )
            )}
          </div>
        </article>

        <article>
          <span>
            Group size & position mix
          </span>

          <p>
            {leftCluster?.members.length} players are in this group.{" "}
            {leftCluster?.positions.dominant.name !==
            "Unknown"
              ? `${Math.round(
                  leftCluster
                    .positions
                    .dominant
                    .share *
                    100
                )}% are ${leftCluster.positions.dominant.name.toLowerCase()}s.`
              : "The position mix is broad."}
          </p>

          {leftCluster?.representative && (
            <p className="archetype-representative">
              Most central example:{" "}
              <strong>
                {
                  leftCluster
                    .representative
                    .name
                }
              </strong>
            </p>
          )}
        </article>

        <article>
          <span>
            Matchup interpretation
          </span>

          <p>
            {sameClusterText(
              left,
              right,
              leftCluster,
              rightCluster
            )}
          </p>
        </article>

        <article className="archetype-neighbors">
          <span>
            Similar players inside this group
          </span>

          <div>
            {neighbors.map(
              (
                row,
                index
              ) => (
                <button
                  type="button"
                  key={
                    row.player.id
                  }
                  onClick={() =>
                    onSelectComparison(
                      row.player
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
                    {row.player.name}
                  </strong>

                  <small>
                    {row.player.team}
                  </small>
                </button>
              )
            )}
          </div>
        </article>

        <article className="archetype-quality">
          <span>
            Group separation
          </span>

          <strong>
            {clustering.separation}
          </strong>

          <p>
            This summarizes how cleanly the model separates the league into groups. Stronger separation means the archetypes are more distinct; overlap means some players sit between styles.
          </p>
        </article>

        <article className="visual-insight-caution">
          <span>
            Important limitation
          </span>

          <p>
            These groups are discovered from the current feature set and model weights. They are useful statistical archetypes, not official basketball positions or permanent labels. Changing the profile or number of groups can change a player's assignment.
          </p>
        </article>

        <details className="visual-advanced-detail">
          <summary>
            Advanced clustering details
          </summary>

          <p>
            <Info
              size={13}
              aria-hidden="true"
            />
            {" "}K-means runs on the same standardized, weighted 10-feature space used by PlayerMatch. Deterministic farthest-first initialization is used so the same settings produce the same groups.
          </p>

          <p>
            Average silhouette score:{" "}
            <strong>
              {clustering.silhouette.toFixed(
                2
              )}
            </strong>
            . This diagnostic ranges from about -1 to 1; higher values indicate cleaner separation.
          </p>
        </details>
      </aside>
    </div>
  );
}
