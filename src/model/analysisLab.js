import { FEATURES } from "../config/modelConfig";

function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value));
}

export function zScore(value, mean, std) {
  if (!std) {
    return 0;
  }

  return (Number(value ?? 0) - mean) / std;
}

export function buildZScoreProfile(
  left,
  right,
  stats
) {
  if (!left || !right || !stats) {
    return [];
  }

  return FEATURES.map((feature) => {
    const leftZ = zScore(
      left[feature.key],
      stats[feature.key].mean,
      stats[feature.key].std
    );

    const rightZ = zScore(
      right[feature.key],
      stats[feature.key].mean,
      stats[feature.key].std
    );

    return {
      ...feature,
      leftZ,
      rightZ,
      gap: Math.abs(leftZ - rightZ),
      leftPlot: clamp(leftZ, -3, 3),
      rightPlot: clamp(rightZ, -3, 3),
    };
  });
}

function directionText(value) {
  if (value >= 1.5) {
    return "well above the league average";
  }

  if (value >= 0.5) {
    return "above the league average";
  }

  if (value <= -1.5) {
    return "well below the league average";
  }

  if (value <= -0.5) {
    return "below the league average";
  }

  return "close to the league average";
}

function magnitudeText(value) {
  const magnitude = Math.abs(value);

  if (magnitude >= 2) {
    return "very unusual";
  }

  if (magnitude >= 1) {
    return "meaningfully different from average";
  }

  return "fairly typical relative to the player pool";
}

export function buildZScoreInterpretation(
  left,
  right,
  rows
) {
  if (!left || !right || !rows.length) {
    return null;
  }

  const largestGap = [...rows].sort(
    (a, b) => b.gap - a.gap
  )[0];

  const closest = [...rows].sort(
    (a, b) => a.gap - b.gap
  )[0];

  const leftExtreme = [...rows].sort(
    (a, b) =>
      Math.abs(b.leftZ) -
      Math.abs(a.leftZ)
  )[0];

  const rightExtreme = [...rows].sort(
    (a, b) =>
      Math.abs(b.rightZ) -
      Math.abs(a.rightZ)
  )[0];

  const sharedAbove = rows
    .filter(
      (row) =>
        row.leftZ >= 0.75 &&
        row.rightZ >= 0.75
    )
    .sort(
      (a, b) =>
        Math.min(b.leftZ, b.rightZ) -
        Math.min(a.leftZ, a.rightZ)
    )[0];

  const sharedBelow = rows
    .filter(
      (row) =>
        row.leftZ <= -0.75 &&
        row.rightZ <= -0.75
    )
    .sort(
      (a, b) =>
        Math.max(a.leftZ, a.rightZ) -
        Math.max(b.leftZ, b.rightZ)
    )[0];

  const evidence = [];

  if (sharedAbove) {
    evidence.push(
      `Both players are notably above the league average in ${sharedAbove.longLabel.toLowerCase()} (${left.name}: z = ${sharedAbove.leftZ.toFixed(
        2
      )}, ${right.name}: z = ${sharedAbove.rightZ.toFixed(
        2
      )}).`
    );
  }

  if (sharedBelow) {
    evidence.push(
      `Both players are below the league average in ${sharedBelow.longLabel.toLowerCase()} (${left.name}: z = ${sharedBelow.leftZ.toFixed(
        2
      )}, ${right.name}: z = ${sharedBelow.rightZ.toFixed(
        2
      )}).`
    );
  }

  evidence.push(
    `Their largest standardized difference is ${largestGap.longLabel.toLowerCase()}, with a ${largestGap.gap.toFixed(
      2
    )} standard-deviation gap.`
  );

  evidence.push(
    `Their closest standardized feature is ${closest.longLabel.toLowerCase()}, separated by ${closest.gap.toFixed(
      2
    )} standard deviations.`
  );

  return {
    observation:
      `${left.name}'s most statistically unusual feature is ${leftExtreme.longLabel.toLowerCase()} (z = ${leftExtreme.leftZ.toFixed(
        2
      )}), which is ${directionText(
        leftExtreme.leftZ
      )}. ${right.name}'s most unusual feature is ${rightExtreme.longLabel.toLowerCase()} (z = ${rightExtreme.rightZ.toFixed(
        2
      )}), which is ${directionText(
        rightExtreme.rightZ
      )}.`,

    evidence,

    conclusion:
      `The two players share some league-relative tendencies, but the strongest difference in their standardized profiles is ${largestGap.longLabel.toLowerCase()}. This supports describing them as statistically similar in selected dimensions rather than interchangeable overall players.`,

    limitation:
      `These z-scores describe where each player sits relative to this eligible player pool for the selected stat basis. They do not establish causation, role equivalence, complete defensive impact, lineup fit or total player value.`,

    teaching: {
      left: `${left.name}'s ${leftExtreme.longLabel.toLowerCase()} z-score of ${leftExtreme.leftZ.toFixed(
        2
      )} is ${magnitudeText(
        leftExtreme.leftZ
      )}.`,
      right: `${right.name}'s ${rightExtreme.longLabel.toLowerCase()} z-score of ${rightExtreme.rightZ.toFixed(
        2
      )} is ${magnitudeText(
        rightExtreme.rightZ
      )}.`,
    },
  };
}
