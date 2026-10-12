import { FEATURES } from "../config/modelConfig";

export function leagueStats(players) {
  const out = {};

  for (const { key } of FEATURES) {
    const values = players.map(
      (player) => Number(player[key] ?? 0)
    );

    const mean =
      values.reduce((sum, value) => sum + value, 0) /
      Math.max(values.length, 1);

    const variance =
      values.reduce(
        (sum, value) => sum + (value - mean) ** 2,
        0
      ) / Math.max(values.length, 1);

    out[key] = {
      mean,
      std: Math.sqrt(variance) || 1,
    };
  }

  return out;
}

export function percentile(players, key, value) {
  if (!players.length) {
    return 0;
  }

  const target = Number(value ?? 0);

  let below = 0;
  let equal = 0;

  for (const player of players) {
    const current = Number(player[key] ?? 0);

    if (current < target) {
      below += 1;
    } else if (current === target) {
      equal += 1;
    }
  }

  return Math.round(
    ((below + 0.5 * equal) / players.length) * 100
  );
}

function vector(player, stats, weights) {
  return FEATURES.map(({ key }) => {
    const zScore =
      (Number(player[key] ?? 0) - stats[key].mean) /
      stats[key].std;

    return zScore * Math.sqrt(weights[key] ?? 1);
  });
}

function cosine(a, b) {
  let dot = 0;
  let magnitudeA = 0;
  let magnitudeB = 0;

  for (let index = 0; index < a.length; index += 1) {
    dot += a[index] * b[index];
    magnitudeA += a[index] ** 2;
    magnitudeB += b[index] ** 2;
  }

  const denominator =
    Math.sqrt(magnitudeA) * Math.sqrt(magnitudeB);

  return denominator ? dot / denominator : 0;
}

export function pairSimilarity(left, right, weights, stats) {
  if (!left || !right) {
    return 0;
  }

  const raw = cosine(
    vector(left, stats, weights),
    vector(right, stats, weights)
  );

  return Math.max(0, Math.min(100, raw * 100));
}

export function buildMatches(
  players,
  selectedPlayer,
  weights,
  stats
) {
  if (!selectedPlayer || players.length < 2) {
    return [];
  }

  return players
    .filter(
      (player) => player.id !== selectedPlayer.id
    )
    .map((player) => ({
      ...player,
      similarity: pairSimilarity(
        selectedPlayer,
        player,
        weights,
        stats
      ),
    }))
    .sort(
      (a, b) => b.similarity - a.similarity
    );
}

export function similarityLabel(value) {
  if (value >= 92) return "Near twin";
  if (value >= 84) return "Very similar";
  if (value >= 72) return "Strong match";
  if (value >= 58) return "Related profile";

  return "Loose match";
}

export function explainFeatures(
  left,
  right,
  stats,
  weights
) {
  if (!left || !right) {
    return [];
  }

  const leftVector = vector(
    left,
    stats,
    weights
  );

  const rightVector = vector(
    right,
    stats,
    weights
  );

  const denominator =
    Math.sqrt(
      leftVector.reduce(
        (sum, value) => sum + value ** 2,
        0
      )
    ) *
    Math.sqrt(
      rightVector.reduce(
        (sum, value) => sum + value ** 2,
        0
      )
    );

  const rows = FEATURES.map((feature, index) => {
    const { key } = feature;

    const leftZ =
      (Number(left[key] ?? 0) - stats[key].mean) /
      stats[key].std;

    const rightZ =
      (Number(right[key] ?? 0) - stats[key].mean) /
      stats[key].std;

    const contribution = denominator
      ? (leftVector[index] * rightVector[index]) /
        denominator
      : 0;

    return {
      ...feature,
      weightedGap:
        Math.abs(leftZ - rightZ) *
        Math.sqrt(weights[key] ?? 1),
      contribution,
    };
  });

  const positiveTotal = rows.reduce(
    (sum, row) =>
      sum + Math.max(0, row.contribution),
    0
  );

  return rows.map((row) => ({
    ...row,
    contributionShare:
      row.contribution > 0 && positiveTotal > 0
        ? (row.contribution / positiveTotal) * 100
        : 0,
  }));
}
