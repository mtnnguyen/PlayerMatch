import { FEATURES } from "../config/modelConfig";

export function getFeature(key) {
  return FEATURES.find((feature) => feature.key === key) ?? FEATURES[0];
}

export function featureValue(player, key) {
  return Number(player?.[key] ?? 0);
}

export function formatFeatureValue(feature, value) {
  const numeric = Number(value ?? 0);

  const text = Number.isInteger(numeric)
    ? `${numeric}`
    : numeric.toFixed(1);

  return feature?.percentage
    ? `${text}%`
    : text;
}

export function summarizeValues(players, key) {
  const values = players
    .map((player) => featureValue(player, key))
    .filter(Number.isFinite)
    .sort((a, b) => a - b);

  if (!values.length) {
    return {
      values: [],
      min: 0,
      max: 1,
      mean: 0,
      std: 1,
      median: 0,
      q1: 0,
      q3: 0,
    };
  }

  const mean =
    values.reduce((sum, value) => sum + value, 0) /
    values.length;

  const variance =
    values.reduce(
      (sum, value) => sum + (value - mean) ** 2,
      0
    ) / values.length;

  function quantile(q) {
    const position =
      (values.length - 1) * q;

    const base =
      Math.floor(position);

    const remainder =
      position - base;

    const next =
      values[base + 1];

    return next === undefined
      ? values[base]
      : values[base] +
          remainder *
            (next - values[base]);
  }

  return {
    values,
    min: values[0],
    max: values[values.length - 1],
    mean,
    std: Math.sqrt(variance) || 1,
    median: quantile(0.5),
    q1: quantile(0.25),
    q3: quantile(0.75),
  };
}

export function percentileRank(players, key, value) {
  if (!players.length) {
    return 0;
  }

  const target = Number(value ?? 0);

  let below = 0;
  let equal = 0;

  for (const player of players) {
    const current = featureValue(player, key);

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

export function ordinal(value) {
  const rounded = Math.round(value);
  const mod100 = rounded % 100;

  if (mod100 >= 11 && mod100 <= 13) {
    return `${rounded}th`;
  }

  switch (rounded % 10) {
    case 1:
      return `${rounded}st`;
    case 2:
      return `${rounded}nd`;
    case 3:
      return `${rounded}rd`;
    default:
      return `${rounded}th`;
  }
}

export function pearsonCorrelation(players, xKey, yKey) {
  if (!players.length) {
    return 0;
  }

  const pairs = players
    .map((player) => [
      featureValue(player, xKey),
      featureValue(player, yKey),
    ])
    .filter(
      ([x, y]) =>
        Number.isFinite(x) &&
        Number.isFinite(y)
    );

  if (pairs.length < 2) {
    return 0;
  }

  const meanX =
    pairs.reduce((sum, [x]) => sum + x, 0) /
    pairs.length;

  const meanY =
    pairs.reduce((sum, [, y]) => sum + y, 0) /
    pairs.length;

  let numerator = 0;
  let sumX = 0;
  let sumY = 0;

  for (const [x, y] of pairs) {
    const dx = x - meanX;
    const dy = y - meanY;

    numerator += dx * dy;
    sumX += dx ** 2;
    sumY += dy ** 2;
  }

  const denominator =
    Math.sqrt(sumX * sumY);

  return denominator
    ? numerator / denominator
    : 0;
}

export function relationshipLabel(r) {
  const magnitude = Math.abs(r);

  let strength = "Very weak";

  if (magnitude >= 0.7) {
    strength = "Strong";
  } else if (magnitude >= 0.45) {
    strength = "Moderate";
  } else if (magnitude >= 0.25) {
    strength = "Mild";
  }

  if (magnitude < 0.1) {
    return "Almost no linear relationship";
  }

  return `${strength} ${
    r >= 0 ? "positive" : "negative"
  } relationship`;
}

export function buildScatterSummary({
  players,
  xFeature,
  yFeature,
  left,
  right,
}) {
  const r = pearsonCorrelation(
    players,
    xFeature.key,
    yFeature.key
  );

  const leftXPercentile =
    percentileRank(
      players,
      xFeature.key,
      left[xFeature.key]
    );

  const leftYPercentile =
    percentileRank(
      players,
      yFeature.key,
      left[yFeature.key]
    );

  const rightXPercentile =
    percentileRank(
      players,
      xFeature.key,
      right[xFeature.key]
    );

  const rightYPercentile =
    percentileRank(
      players,
      yFeature.key,
      right[yFeature.key]
    );

  let leagueRead;

  if (Math.abs(r) < 0.1) {
    leagueRead =
      `Across this player pool, ${xFeature.longLabel.toLowerCase()} and ${yFeature.longLabel.toLowerCase()} do not move together in a clear linear pattern.`;
  } else if (r > 0) {
    leagueRead =
      `Across this player pool, players with higher ${xFeature.longLabel.toLowerCase()} also tend to have higher ${yFeature.longLabel.toLowerCase()}, although this is an association rather than proof that one causes the other.`;
  } else {
    leagueRead =
      `Across this player pool, higher ${xFeature.longLabel.toLowerCase()} tends to come with lower ${yFeature.longLabel.toLowerCase()}, although this is an association rather than proof that one causes the other.`;
  }

  return {
    relationship: relationshipLabel(r),
    correlation: r,
    leagueRead,
    leftRead:
      `${left.name} is in the ${ordinal(
        leftXPercentile
      )} percentile for ${xFeature.longLabel.toLowerCase()} and the ${ordinal(
        leftYPercentile
      )} percentile for ${yFeature.longLabel.toLowerCase()}.`,
    rightRead:
      `${right.name} is in the ${ordinal(
        rightXPercentile
      )} percentile for ${xFeature.longLabel.toLowerCase()} and the ${ordinal(
        rightYPercentile
      )} percentile for ${yFeature.longLabel.toLowerCase()}.`,
    caveat:
      "Position on this chart describes two variables only. Players close together here can still differ substantially in the rest of their statistical profile.",
  };
}

export function buildHistogram(players, key, binCount = 12) {
  const summary =
    summarizeValues(players, key);

  const range =
    summary.max - summary.min;

  const width =
    range === 0
      ? 1
      : range / binCount;

  const bins = Array.from(
    { length: binCount },
    (_, index) => ({
      index,
      start:
        summary.min +
        index * width,
      end:
        index === binCount - 1
          ? summary.max
          : summary.min +
            (index + 1) * width,
      count: 0,
    })
  );

  for (const value of summary.values) {
    const rawIndex =
      width === 0
        ? 0
        : Math.floor(
            (value - summary.min) /
              width
          );

    const index =
      Math.min(
        binCount - 1,
        Math.max(0, rawIndex)
      );

    bins[index].count += 1;
  }

  return {
    ...summary,
    bins,
  };
}

export function buildDistributionSummary({
  players,
  feature,
  left,
  right,
}) {
  const summary =
    summarizeValues(
      players,
      feature.key
    );

  const leftPct =
    percentileRank(
      players,
      feature.key,
      left[feature.key]
    );

  const rightPct =
    percentileRank(
      players,
      feature.key,
      right[feature.key]
    );

  const typicalLow =
    formatFeatureValue(
      feature,
      summary.q1
    );

  const typicalHigh =
    formatFeatureValue(
      feature,
      summary.q3
    );

  return {
    typicalRange:
      `The middle half of eligible NBA players sit between ${typicalLow} and ${typicalHigh} in ${feature.longLabel.toLowerCase()}.`,
    leftRead:
      `${left.name} is at ${formatFeatureValue(
        feature,
        left[feature.key]
      )}, which ranks around the ${ordinal(
        leftPct
      )} percentile.`,
    rightRead:
      `${right.name} is at ${formatFeatureValue(
        feature,
        right[feature.key]
      )}, which ranks around the ${ordinal(
        rightPct
      )} percentile.`,
    comparison:
      Math.abs(leftPct - rightPct) <= 8
        ? `The two players sit in a similar part of the league distribution for this stat.`
        : `${
            leftPct > rightPct
              ? left.name
              : right.name
          } sits much farther toward the high end of the league distribution for this stat.`,
    caveat:
      "A percentile describes league standing, not why the player produced that number or whether it will continue.",
  };
}

export function buildDriverSummary(
  featureRows,
  left,
  right
) {
  const positive = [...featureRows]
    .filter(
      (row) =>
        row.contributionShare > 0
    )
    .sort(
      (a, b) =>
        b.contributionShare -
        a.contributionShare
    );

  const top = positive.slice(0, 3);

  const topShare =
    top.reduce(
      (sum, row) =>
        sum +
        row.contributionShare,
      0
    );

  const names =
    top.map(
      (row) => row.longLabel
    );

  return {
    headline:
      top.length
        ? `${names.join(
            top.length > 1 ? ", " : ""
          )} ${
            top.length > 1
              ? "are"
              : "is"
          } doing most of the work in pulling these two standardized profiles together.`
        : "No single feature is providing strong positive evidence for the match.",
    concentration:
      top.length
        ? `The top ${top.length} similarity drivers account for ${topShare.toFixed(
            0
          )}% of the positive model contribution.`
        : "",
    takeaway:
      top[0]
        ? `${top[0].longLabel} is the strongest individual similarity signal for ${left.name} and ${right.name} under the current model settings.`
        : "",
    caveat:
      "These percentages split the model's positive similarity evidence. They are not percentages of a player's overall basketball value.",
  };
}
