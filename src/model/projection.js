const TARGET_META = {
  pts: {
    label: "Points",
    shortLabel: "PTS",
    percentage: false,
  },
  reb: {
    label: "Rebounds",
    shortLabel: "REB",
    percentage: false,
  },
  ast: {
    label: "Assists",
    shortLabel: "AST",
    percentage: false,
  },
  tsPct: {
    label: "True shooting percentage",
    shortLabel: "TS%",
    percentage: true,
  },
  usage: {
    label: "Usage rate",
    shortLabel: "USG%",
    percentage: true,
  },
};

export const PROJECTION_TARGETS = Object.keys(
  TARGET_META
);

export function projectionMeta(key) {
  return TARGET_META[key] ?? {
    label: key,
    shortLabel: key,
    percentage: false,
  };
}

export function formatProjectionValue(
  key,
  value
) {
  const meta =
    projectionMeta(key);

  const numeric =
    Number(value ?? 0);

  const rendered =
    Number.isInteger(numeric)
      ? `${numeric}`
      : numeric.toFixed(1);

  return meta.percentage
    ? `${rendered}%`
    : rendered;
}


export function formatProjectionChange(
  key,
  value
) {
  const meta =
    projectionMeta(key);

  const numeric =
    Number(value ?? 0);

  const sign =
    numeric > 0
      ? "+"
      : "";

  const rendered =
    Number.isInteger(numeric)
      ? `${numeric}`
      : numeric.toFixed(1);

  return meta.percentage
    ? `${sign}${rendered} percentage points`
    : `${sign}${rendered}`;
}

export function formatProjectionError(
  key,
  value
) {
  const numeric =
    Math.abs(Number(value ?? 0));

  const rendered =
    Number.isInteger(numeric)
      ? `${numeric}`
      : numeric.toFixed(1);

  const units = {
    pts: "PPG",
    reb: "RPG",
    ast: "APG",
    tsPct: "pp",
    usage: "pp",
  };

  return `±${rendered} ${units[key] ?? ""}`.trim();
}

export function projectionErrorBadge(
  target,
  row
) {
  if (!row) {
    return {
      label: "Error unavailable",
      tone: "neutral",
    };
  }

  return {
    label: `Hist. error ${formatProjectionError(
      target,
      row.historicalErrorBand80
    )}`,
    tone: "neutral",
  };
}

export function projectionForPlayer(
  dataset,
  playerId
) {
  return (
    dataset?.players?.find(
      (player) =>
        player.id ===
        playerId
    ) ?? null
  );
}

export function projectionDirectionCopy(
  row
) {
  if (!row) {
    return "No projection";
  }

  if (
    row.direction ===
    "Increase"
  ) {
    return "Projected higher";
  }

  if (
    row.direction ===
    "Decrease"
  ) {
    return "Projected lower";
  }

  return "Projected stable";
}

export function featureLabel(
  feature
) {
  const map = {
    current_pts:
      "Current points",
    current_reb:
      "Current rebounds",
    current_ast:
      "Current assists",
    current_stl:
      "Current steals",
    current_blk:
      "Current blocks",
    current_fgPct:
      "Current FG%",
    current_threePct:
      "Current 3P%",
    current_ftPct:
      "Current FT%",
    current_usage:
      "Current usage",
    current_tsPct:
      "Current TS%",
    age: "Age",
    min: "Minutes",
    gp: "Games played",
    delta_pts:
      "Recent points change",
    delta_reb:
      "Recent rebounds change",
    delta_ast:
      "Recent assists change",
    delta_tsPct:
      "Recent TS% change",
    delta_usage:
      "Recent usage change",
    delta_min:
      "Recent minutes change",
    previousSeasonAvailable:
      "Prior-season availability",
    eligibleHistorySeasons:
      "Historical sample",
  };

  return (
    map[feature] ??
    feature
  );
}

export function performanceRead(
  evaluation
) {
  if (!evaluation) {
    return null;
  }

  const selected =
    evaluation.holdout?.selected;

  const baseline =
    evaluation.holdout?.baseline;

  if (!selected || !baseline) {
    return null;
  }

  const improvement =
    baseline.mae
      ? ((baseline.mae - selected.mae) / baseline.mae) * 100
      : 0;

  if (evaluation.selectedModel === "Baseline") {
    return {
      improvement: 0,
      resultLabel: "Baseline selected",
      tone: "neutral",
      headline:
        "The persistence baseline was the strongest model during time-based validation.",
      detail:
        "For this target, keeping the latest value unchanged was more defensible than adding model complexity.",
    };
  }

  if (!evaluation.holdout?.beatsBaseline || improvement <= 0) {
    return {
      improvement,
      resultLabel: "Baseline stronger",
      tone: "loss",
      headline:
        `${evaluation.selectedModel} did not beat the persistence baseline on the held-out season.`,
      detail:
        "The baseline remains the stronger held-out benchmark for this target.",
    };
  }

  let resultLabel = "Strong improvement";
  let headline =
    `${evaluation.selectedModel} produced a strong held-out improvement over the baseline.`;

  if (improvement < 2) {
    resultLabel = "Essentially tied";
    headline =
      `${evaluation.selectedModel} was only marginally better than the baseline.`;
  } else if (improvement < 5) {
    resultLabel = "Small improvement";
    headline =
      `${evaluation.selectedModel} produced a small held-out improvement over the baseline.`;
  } else if (improvement < 10) {
    resultLabel = "Meaningful improvement";
    headline =
      `${evaluation.selectedModel} produced a meaningful held-out improvement over the baseline.`;
  }

  return {
    improvement,
    resultLabel,
    tone: improvement < 2 ? "neutral" : "win",
    headline,
    detail:
      `Holdout MAE improved by ${improvement.toFixed(1)}% relative to the persistence baseline. ` +
      (improvement < 2
        ? "Treat this as effectively tied rather than a major forecasting gain."
        : "This is evidence of added predictive value on the held-out season, not a guarantee that the advantage will persist."),
  };
}

export function projectionComparisonRead(
  target,
  left,
  right,
  leftRow,
  rightRow
) {
  if (!leftRow || !rightRow) {
    return null;
  }

  const leftHigher =
    Number(leftRow.projected) >=
    Number(rightRow.projected);

  const leader =
    leftHigher ? left : right;

  const gap =
    Math.abs(
      Number(leftRow.projected) -
      Number(rightRow.projected)
    );

  const errorBand =
    Math.max(
      Number(leftRow.historicalErrorBand80 ?? 0),
      Number(rightRow.historicalErrorBand80 ?? 0)
    );

  const gapText =
    formatProjectionChange(
      target,
      gap
    ).replace(/^\+/, "");

  const detail =
    `${left.name}: ${formatProjectionValue(target, leftRow.projected)} · ` +
    `${right.name}: ${formatProjectionValue(target, rightRow.projected)}. ` +
    `Point-estimate gap: ${gapText}.`;

  if (errorBand > 0 && gap < errorBand) {
    return {
      headline:
        `${leader.name} has the higher point estimate, but the gap is smaller than the model's historical error-band magnitude.`,
      detail:
        `${detail} Historical 80th-percentile absolute error is ${formatProjectionError(
          target,
          errorBand
        )}, so this should not be treated as a clear separation.`,
    };
  }

  return {
    headline:
      `${leader.name} has the higher point estimate for ${projectionMeta(
        target
      ).label.toLowerCase()}.`,
    detail:
      `${detail} The gap is at least as large as the model's historical error-band magnitude, but this is still not a formal significance test.`,
  };
}

export function playerProjectionStory(
  playerName,
  projection
) {
  const rows =
    projection?.projections;

  if (!rows) {
    return null;
  }

  const usage =
    Number(
      rows.usage?.change ?? 0
    );

  const scoring =
    Number(
      rows.pts?.change ?? 0
    );

  const playmaking =
    Number(
      rows.ast?.change ?? 0
    );

  const efficiency =
    Number(
      rows.tsPct?.change ?? 0
    );

  if (
    usage >= 1 &&
    efficiency <= -1
  ) {
    return {
      headline:
        `${playerName} projects toward a larger offensive role with some efficiency pressure.`,
      watch:
        "Watch whether the player can absorb added usage without the efficiency decline becoming larger than the model expects.",
    };
  }

  if (
    usage >= 1 &&
    (scoring >= 1 ||
      playmaking >= 0.5)
  ) {
    return {
      headline:
        `${playerName} projects toward modest offensive-role expansion.`,
      watch:
        "Watch usage, minutes and efficiency together. More volume is most valuable if efficiency remains stable.",
    };
  }

  if (usage <= -1) {
    return {
      headline:
        `${playerName} projects toward a somewhat smaller offensive role.`,
      watch:
        "Watch whether reduced usage reflects team context or an actual change in the player's role and production.",
    };
  }

  if (
    efficiency >= 1 &&
    Math.abs(usage) < 1
  ) {
    return {
      headline:
        `${playerName} projects to keep a similar role with better scoring efficiency.`,
      watch:
        "Watch whether the efficiency improvement holds without a major change in usage.",
    };
  }

  return {
    headline:
      `${playerName}'s projected offensive profile is broadly stable.`,
    watch:
      "The model does not see a large role-level change. Monitor minutes, usage and efficiency for evidence that the current profile is breaking in a new direction.",
  };
}
