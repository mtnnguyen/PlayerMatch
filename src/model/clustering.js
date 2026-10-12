import {
  CATEGORIES,
  FEATURES,
} from "../config/modelConfig";

function squaredDistance(a, b) {
  return a.reduce(
    (sum, value, index) =>
      sum + (value - b[index]) ** 2,
    0
  );
}

function distance(a, b) {
  return Math.sqrt(
    squaredDistance(a, b)
  );
}

function meanVector(vectors) {
  if (!vectors.length) {
    return [];
  }

  const dimensions =
    vectors[0].length;

  return Array.from(
    { length: dimensions },
    (_, index) =>
      vectors.reduce(
        (sum, vector) =>
          sum + vector[index],
        0
      ) / vectors.length
  );
}

function standardizePlayers(
  players,
  weights
) {
  const means = {};
  const stds = {};

  for (const feature of FEATURES) {
    const values =
      players.map(
        (player) =>
          Number(
            player[
              feature.key
            ] ?? 0
          )
      );

    const mean =
      values.reduce(
        (sum, value) =>
          sum + value,
        0
      ) /
      Math.max(
        1,
        values.length
      );

    const variance =
      values.reduce(
        (sum, value) =>
          sum +
          (value - mean) ** 2,
        0
      ) /
      Math.max(
        1,
        values.length
      );

    means[feature.key] =
      mean;

    stds[feature.key] =
      Math.sqrt(
        variance
      ) || 1;
  }

  const vectors =
    players.map(
      (player) =>
        FEATURES.map(
          (feature) => {
            const z =
              (Number(
                player[
                  feature.key
                ] ?? 0
              ) -
                means[
                  feature.key
                ]) /
              stds[
                feature.key
              ];

            return (
              z *
              Math.sqrt(
                weights[
                  feature.key
                ] ?? 1
              )
            );
          }
        )
    );

  return {
    vectors,
    means,
    stds,
  };
}

function farthestFirstSeeds(
  vectors,
  k
) {
  if (!vectors.length) {
    return [];
  }

  let firstIndex = 0;
  let firstMagnitude = -Infinity;

  for (
    let index = 0;
    index < vectors.length;
    index += 1
  ) {
    const magnitude =
      squaredDistance(
        vectors[index],
        Array(
          vectors[index].length
        ).fill(0)
      );

    if (
      magnitude >
      firstMagnitude
    ) {
      firstMagnitude =
        magnitude;
      firstIndex =
        index;
    }
  }

  const selected = [
    firstIndex,
  ];

  while (
    selected.length < k
  ) {
    let bestIndex = 0;
    let bestDistance = -Infinity;

    for (
      let index = 0;
      index <
      vectors.length;
      index += 1
    ) {
      if (
        selected.includes(
          index
        )
      ) {
        continue;
      }

      const nearest =
        Math.min(
          ...selected.map(
            (seedIndex) =>
              squaredDistance(
                vectors[index],
                vectors[
                  seedIndex
                ]
              )
          )
        );

      if (
        nearest >
        bestDistance
      ) {
        bestDistance =
          nearest;
        bestIndex =
          index;
      }
    }

    selected.push(
      bestIndex
    );
  }

  return selected.map(
    (index) =>
      [...vectors[index]]
  );
}

function assignClusters(
  vectors,
  centroids
) {
  return vectors.map(
    (vector) => {
      let bestCluster = 0;
      let bestDistance =
        Infinity;

      for (
        let cluster = 0;
        cluster <
        centroids.length;
        cluster += 1
      ) {
        const current =
          squaredDistance(
            vector,
            centroids[
              cluster
            ]
          );

        if (
          current <
          bestDistance
        ) {
          bestDistance =
            current;
          bestCluster =
            cluster;
        }
      }

      return bestCluster;
    }
  );
}

function rebuildCentroids(
  vectors,
  assignments,
  k,
  previousCentroids
) {
  return Array.from(
    { length: k },
    (_, cluster) => {
      const members =
        vectors.filter(
          (_, index) =>
            assignments[
              index
            ] === cluster
        );

      if (members.length) {
        return meanVector(
          members
        );
      }

      // If a cluster empties out, preserve the old centroid.
      return [
        ...previousCentroids[
          cluster
        ],
      ];
    }
  );
}

function assignmentsEqual(
  a,
  b
) {
  if (
    !a ||
    a.length !== b.length
  ) {
    return false;
  }

  return a.every(
    (value, index) =>
      value === b[index]
  );
}

function featureMapFromVector(
  vector
) {
  const map = {};

  FEATURES.forEach(
    (feature, index) => {
      map[feature.key] =
        vector[index];
    }
  );

  return map;
}

function categoryScores(
  centroid
) {
  const featureMap =
    featureMapFromVector(
      centroid
    );

  return CATEGORIES.map(
    (category) => ({
      name: category.name,
      score:
        category.features.reduce(
          (sum, key) =>
            sum +
            Number(
              featureMap[key] ??
                0
            ),
          0
        ) /
        category.features
          .length,
    })
  ).sort(
    (a, b) =>
      b.score - a.score
  );
}

function positionSummary(
  members
) {
  const counts = {
    Guard: 0,
    Wing: 0,
    Big: 0,
    Unknown: 0,
  };

  for (const member of members) {
    const group =
      member.positionGroup &&
      counts[
        member.positionGroup
      ] !== undefined
        ? member.positionGroup
        : "Unknown";

    counts[group] += 1;
  }

  const total =
    Math.max(
      1,
      members.length
    );

  const sorted =
    Object.entries(counts)
      .map(
        ([name, count]) => ({
          name,
          count,
          share:
            count / total,
        })
      )
      .sort(
        (a, b) =>
          b.count - a.count
      );

  return {
    counts,
    dominant:
      sorted[0],
    sorted,
  };
}

function pairKey(
  first,
  second
) {
  return [first, second]
    .sort()
    .join("|");
}

const GENERIC_NAMES = {
  "Efficiency|Playmaking":
    "Efficient Creators",
  "Playmaking|Scoring":
    "Scoring Creators",
  "Efficiency|Scoring":
    "Efficient Scorers",
  "Defense|Rebounding":
    "Interior Defenders",
  "Defense|Efficiency":
    "Efficient Defenders",
  "Defense|Scoring":
    "Two-Way Scorers",
  "Defense|Playmaking":
    "Two-Way Connectors",
  "Playmaking|Rebounding":
    "Playmaking Rebounders",
  "Rebounding|Scoring":
    "Physical Scorers",
  "Efficiency|Rebounding":
    "Efficient Rebounders",
};

function clusterName(
  categoryRows,
  position
) {
  const [first, second] =
    categoryRows;

  if (!first) {
    return "Balanced Contributors";
  }

  const topPair =
    pairKey(
      first.name,
      second?.name ??
        first.name
    );

  const dominant =
    position?.dominant;

  if (
    dominant?.share >= 0.55
  ) {
    if (
      dominant.name ===
      "Big"
    ) {
      if (
        topPair ===
        "Defense|Rebounding"
      ) {
        return "Interior Anchors";
      }

      if (
        first.name ===
          "Efficiency" &&
        categoryRows.some(
          (row) =>
            row.name ===
            "Scoring"
        )
      ) {
        return "Efficient Finishers";
      }

      if (
        first.name ===
        "Playmaking"
      ) {
        return "Playmaking Bigs";
      }

      if (
        first.name ===
        "Scoring"
      ) {
        return "Interior Scorers";
      }
    }

    if (
      dominant.name ===
      "Guard"
    ) {
      if (
        topPair ===
        "Playmaking|Scoring"
      ) {
        return "Primary Creators";
      }

      if (
        topPair ===
        "Efficiency|Scoring"
      ) {
        return "Efficient Guards";
      }

      if (
        topPair ===
        "Defense|Playmaking"
      ) {
        return "Two-Way Guards";
      }
    }

    if (
      dominant.name ===
      "Wing"
    ) {
      if (
        topPair ===
        "Defense|Efficiency"
      ) {
        return "Two-Way Wings";
      }

      if (
        topPair ===
        "Efficiency|Scoring"
      ) {
        return "Scoring Wings";
      }

      if (
        topPair ===
        "Playmaking|Rebounding"
      ) {
        return "Versatile Forwards";
      }
    }
  }

  return (
    GENERIC_NAMES[
      topPair
    ] ??
    `${first.name} ${
      second?.name ??
      "Profile"
    }`
  );
}

function traitRows(
  centroid,
  count = 4
) {
  return FEATURES.map(
    (feature, index) => ({
      key: feature.key,
      label:
        feature.longLabel,
      shortLabel:
        feature.label,
      value:
        centroid[index],
      magnitude:
        Math.abs(
          centroid[index]
        ),
    })
  )
    .sort(
      (a, b) =>
        b.magnitude -
        a.magnitude
    )
    .slice(0, count)
    .map((row) => ({
      ...row,
      direction:
        row.value >= 0
          ? "Higher"
          : "Lower",
    }));
}

function clusterDescription(
  name,
  categories,
  traits,
  position
) {
  const topCategories =
    categories
      .slice(0, 2)
      .map(
        (row) =>
          row.name.toLowerCase()
      )
      .join(" and ");

  const traitText =
    traits
      .slice(0, 2)
      .map(
        (row) =>
          `${row.direction.toLowerCase()} ${row.label.toLowerCase()}`
      )
      .join(" with ");

  const positionText =
    position?.dominant
      ?.share >= 0.45 &&
    position.dominant
      .name !== "Unknown"
      ? ` The group is mostly ${position.dominant.name.toLowerCase()}s.`
      : "";

  return `${name} are separated from the league mostly by ${topCategories}. The cluster center is characterized by ${traitText}.${positionText}`;
}

function clusterRepresentative(
  cluster,
  vectors
) {
  let best = null;
  let bestDistance =
    Infinity;

  for (
    const memberIndex of cluster.memberIndexes
  ) {
    const current =
      distance(
        vectors[
          memberIndex
        ],
        cluster.centroid
      );

    if (
      current <
      bestDistance
    ) {
      bestDistance =
        current;
      best =
        memberIndex;
    }
  }

  return best;
}

export function silhouetteScore(
  vectors,
  assignments,
  k
) {
  if (
    !vectors.length ||
    k < 2
  ) {
    return 0;
  }

  const grouped =
    Array.from(
      { length: k },
      () => []
    );

  assignments.forEach(
    (cluster, index) => {
      grouped[
        cluster
      ].push(index);
    }
  );

  let total = 0;

  for (
    let index = 0;
    index <
    vectors.length;
    index += 1
  ) {
    const ownCluster =
      assignments[
        index
      ];

    const ownMembers =
      grouped[
        ownCluster
      ].filter(
        (memberIndex) =>
          memberIndex !==
          index
      );

    // Standard silhouette convention: singleton clusters score 0.
    if (!ownMembers.length) {
      continue;
    }

    const a =
      ownMembers.reduce(
        (sum, memberIndex) =>
          sum +
          distance(
            vectors[
              index
            ],
            vectors[
              memberIndex
            ]
          ),
        0
      ) /
      ownMembers.length;

    let b = Infinity;

    for (
      let cluster = 0;
      cluster < k;
      cluster += 1
    ) {
      if (
        cluster ===
          ownCluster ||
        !grouped[
          cluster
        ].length
      ) {
        continue;
      }

      const average =
        grouped[
          cluster
        ].reduce(
          (sum, memberIndex) =>
            sum +
            distance(
              vectors[
                index
              ],
              vectors[
                memberIndex
              ]
            ),
          0
        ) /
        grouped[
          cluster
        ].length;

      b = Math.min(
        b,
        average
      );
    }

    const denominator =
      Math.max(a, b);

    const score =
      Number.isFinite(b) &&
      denominator > 0
        ? (b - a) /
          denominator
        : 0;

    total += score;
  }

  return (
    total /
    vectors.length
  );
}

export function separationLabel(
  silhouette
) {
  if (
    silhouette >= 0.5
  ) {
    return "Strong separation";
  }

  if (
    silhouette >= 0.3
  ) {
    return "Meaningful separation";
  }

  if (
    silhouette >= 0.15
  ) {
    return "Moderate overlap";
  }

  return "Heavy overlap";
}

export function runKMeans(
  players,
  weights,
  k = 6,
  maxIterations = 80
) {
  if (
    !players?.length ||
    players.length < k
  ) {
    return null;
  }

  const {
    vectors,
  } =
    standardizePlayers(
      players,
      weights
    );

  let centroids =
    farthestFirstSeeds(
      vectors,
      k
    );

  let assignments = null;
  let iterations = 0;

  for (
    ;
    iterations <
    maxIterations;
    iterations += 1
  ) {
    const nextAssignments =
      assignClusters(
        vectors,
        centroids
      );

    if (
      assignmentsEqual(
        assignments,
        nextAssignments
      )
    ) {
      assignments =
        nextAssignments;
      break;
    }

    assignments =
      nextAssignments;

    centroids =
      rebuildCentroids(
        vectors,
        assignments,
        k,
        centroids
      );
  }

  const clusters =
    Array.from(
      { length: k },
      (_, clusterId) => {
        const memberIndexes =
          assignments
            .map(
              (
                value,
                index
              ) => ({
                value,
                index,
              })
            )
            .filter(
              (row) =>
                row.value ===
                clusterId
            )
            .map(
              (row) =>
                row.index
            );

        const members =
          memberIndexes.map(
            (index) =>
              players[index]
          );

        const categories =
          categoryScores(
            centroids[
              clusterId
            ]
          );

        const positions =
          positionSummary(
            members
          );

        const traits =
          traitRows(
            centroids[
              clusterId
            ]
          );

        const name =
          clusterName(
            categories,
            positions
          );

        return {
          id: clusterId,
          centroid:
            centroids[
              clusterId
            ],
          memberIndexes,
          members,
          categories,
          positions,
          traits,
          name,
          description:
            clusterDescription(
              name,
              categories,
              traits,
              positions
            ),
        };
      }
    );

  // Keep automatically generated archetype names readable and unique.
  const nameCounts = {};

  for (const cluster of clusters) {
    nameCounts[cluster.name] =
      (nameCounts[cluster.name] ?? 0) + 1;
  }

  const usedNames = new Set();

  for (const cluster of clusters) {
    if (nameCounts[cluster.name] > 1) {
      const baseName = cluster.name;
      const qualifiers =
        cluster.traits
          .slice(0, 3)
          .map((trait) => trait.shortLabel);

      let candidate =
        `${baseName} · ${qualifiers[0]}`;

      if (usedNames.has(candidate)) {
        candidate =
          `${baseName} · ${qualifiers
            .slice(0, 2)
            .join("/")}`;
      }

      if (usedNames.has(candidate)) {
        candidate =
          `${baseName} · Group ${cluster.id + 1}`;
      }

      cluster.name = candidate;
      cluster.description =
        clusterDescription(
          cluster.name,
          cluster.categories,
          cluster.traits,
          cluster.positions
        );
    }

    usedNames.add(cluster.name);

    const representativeIndex =
      clusterRepresentative(
        cluster,
        vectors
      );

    cluster.representative =
      representativeIndex ===
        null
        ? null
        : players[
            representativeIndex
          ];
  }

  const silhouette =
    silhouetteScore(
      vectors,
      assignments,
      k
    );

  return {
    assignments,
    clusters,
    vectors,
    k,
    iterations,
    silhouette,
    separation:
      separationLabel(
        silhouette
      ),
  };
}

export function clusterForPlayer(
  result,
  players,
  playerId
) {
  if (!result) {
    return null;
  }

  const index =
    players.findIndex(
      (player) =>
        player.id ===
        playerId
    );

  if (index < 0) {
    return null;
  }

  const clusterId =
    result.assignments[
      index
    ];

  return (
    result.clusters.find(
      (cluster) =>
        cluster.id ===
        clusterId
    ) ?? null
  );
}

export function nearestClusterMates(
  result,
  players,
  playerId,
  count = 5
) {
  if (!result) {
    return [];
  }

  const index =
    players.findIndex(
      (player) =>
        player.id ===
        playerId
    );

  if (index < 0) {
    return [];
  }

  const clusterId =
    result.assignments[
      index
    ];

  return result.clusters[
    clusterId
  ].memberIndexes
    .filter(
      (memberIndex) =>
        memberIndex !==
        index
    )
    .map(
      (memberIndex) => ({
        player:
          players[
            memberIndex
          ],
        distance:
          distance(
            result.vectors[
              index
            ],
            result.vectors[
              memberIndex
            ]
          ),
      })
    )
    .sort(
      (a, b) =>
        a.distance -
        b.distance
    )
    .slice(0, count);
}
