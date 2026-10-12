import {
  describe,
  expect,
  test,
} from "vitest";

import {
  PROFILES,
} from "../../src/config/modelConfig";

import {
  filterComparisonPool,
} from "../../src/config/viewConfig";

import {
  buildMatches,
  leagueStats,
  pairSimilarity,
  percentile,
} from "../../src/model/similarity";

import {
  runKMeans,
} from "../../src/model/clustering";

import {
  nearestOnMap,
  runPCA,
} from "../../src/model/pca";

function makePlayers(count = 12) {
  const groups = [
    "Guard",
    "Wing",
    "Big",
  ];

  return Array.from(
    { length: count },
    (_, index) => ({
      id: index + 1,
      name: `Player ${index + 1}`,
      team: `T${index % 4}`,
      positionGroup:
        groups[index % groups.length],
      pts:
        8 +
        index * 1.7 +
        (index % 3) * 0.4,
      reb:
        2 +
        ((index * 3) % 9) *
          0.8,
      ast:
        1 +
        ((index * 5) % 10) *
          0.7,
      stl:
        0.4 +
        (index % 4) * 0.28,
      blk:
        0.2 +
        ((index * 2) % 6) *
          0.24,
      fgPct:
        42 +
        ((index * 7) % 15),
      threePct:
        28 +
        ((index * 4) % 14),
      ftPct:
        65 +
        ((index * 5) % 25),
      usage:
        15 +
        ((index * 3) % 17),
      tsPct:
        50 +
        ((index * 6) % 16),
    })
  );
}

const balanced =
  PROFILES.Balanced.weights;

describe("similarity model", () => {
  test("pair similarity is symmetric", () => {
    const players =
      makePlayers();

    const stats =
      leagueStats(players);

    const ab =
      pairSimilarity(
        players[0],
        players[7],
        balanced,
        stats
      );

    const ba =
      pairSimilarity(
        players[7],
        players[0],
        balanced,
        stats
      );

    expect(ab).toBeCloseTo(
      ba,
      10
    );
  });

  test("a non-degenerate player is a 100/100 self-match", () => {
    const players =
      makePlayers();

    const stats =
      leagueStats(players);

    expect(
      pairSimilarity(
        players[0],
        players[0],
        balanced,
        stats
      )
    ).toBeCloseTo(100, 10);
  });

  test("percentile ties use midrank handling", () => {
    const players = [
      { pts: 10 },
      { pts: 10 },
      { pts: 20 },
      { pts: 30 },
    ];

    expect(
      percentile(
        players,
        "pts",
        10
      )
    ).toBe(25);

    expect(
      percentile(
        players,
        "pts",
        20
      )
    ).toBe(63);
  });

  test("ranked matches exclude the primary player and sort descending", () => {
    const players =
      makePlayers();

    const stats =
      leagueStats(players);

    const matches =
      buildMatches(
        players,
        players[0],
        balanced,
        stats
      );

    expect(
      matches.some(
        (player) =>
          player.id ===
          players[0].id
      )
    ).toBe(false);

    for (
      let index = 1;
      index < matches.length;
      index += 1
    ) {
      expect(
        matches[index - 1]
          .similarity
      ).toBeGreaterThanOrEqual(
        matches[index]
          .similarity
      );
    }
  });
});

describe("comparison pool filters", () => {
  test("same-position and explicit position filters are deterministic", () => {
    const players =
      makePlayers(9);

    const selected =
      players[0];

    const same =
      filterComparisonPool(
        players,
        selected,
        "same"
      );

    expect(
      same.every(
        (player) =>
          player.positionGroup ===
          selected.positionGroup
      )
    ).toBe(true);

    const bigs =
      filterComparisonPool(
        players,
        selected,
        "Big"
      );

    expect(
      bigs.every(
        (player) =>
          player.positionGroup ===
          "Big"
      )
    ).toBe(true);

    expect(
      filterComparisonPool(
        players,
        selected,
        "all"
      )
    ).toHaveLength(
      players.length
    );
  });
});

describe("clustering", () => {
  test("K-means is deterministic for identical inputs", () => {
    const players =
      makePlayers(15);

    const first =
      runKMeans(
        players,
        balanced,
        3
      );

    const second =
      runKMeans(
        players,
        balanced,
        3
      );

    expect(first).not.toBeNull();
    expect(second).not.toBeNull();

    expect(
      first.assignments
    ).toEqual(
      second.assignments
    );

    expect(
      first.clusters.map(
        (cluster) =>
          cluster.memberIndexes
      )
    ).toEqual(
      second.clusters.map(
        (cluster) =>
          cluster.memberIndexes
      )
    );

    expect(
      first.silhouette
    ).toBeCloseTo(
      second.silhouette,
      12
    );

    expect(
      Number.isFinite(
        first.silhouette
      )
    ).toBe(true);

    expect(
      first.silhouette
    ).toBeGreaterThanOrEqual(-1);

    expect(
      first.silhouette
    ).toBeLessThanOrEqual(1);
  });
});

describe("PCA style map", () => {
  test("principal axes are unit length and orthogonal", () => {
    const players =
      makePlayers(18);

    const pca =
      runPCA(
        players,
        balanced
      );

    expect(pca).not.toBeNull();

    const dot =
      pca.axis1.vector.reduce(
        (sum, value, index) =>
          sum +
          value *
            pca.axis2
              .vector[index],
        0
      );

    const norm1 =
      Math.sqrt(
        pca.axis1.vector.reduce(
          (sum, value) =>
            sum + value ** 2,
          0
        )
      );

    const norm2 =
      Math.sqrt(
        pca.axis2.vector.reduce(
          (sum, value) =>
            sum + value ** 2,
          0
        )
      );

    expect(
      Math.abs(dot)
    ).toBeLessThan(1e-8);

    expect(norm1).toBeCloseTo(
      1,
      8
    );

    expect(norm2).toBeCloseTo(
      1,
      8
    );

    expect(
      pca.points
    ).toHaveLength(
      players.length
    );

    expect(
      pca.points.every(
        (point) =>
          Number.isFinite(
            point.x
          ) &&
          Number.isFinite(
            point.y
          )
      )
    ).toBe(true);

    expect(
      pca.explainedTotal
    ).toBeGreaterThanOrEqual(0);
  });

  test("nearest-map lookup never returns the origin player", () => {
    const players =
      makePlayers(12);

    const pca =
      runPCA(
        players,
        balanced
      );

    const neighbors =
      nearestOnMap(
        pca,
        players[0].id,
        5
      );

    expect(
      neighbors
    ).toHaveLength(5);

    expect(
      neighbors.some(
        (point) =>
          point.player.id ===
          players[0].id
      )
    ).toBe(false);
  });
});
