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

export function projectionConfidence(
  row,
  evaluation
) {
  if (
    !row ||
    !evaluation
  ) {
    return {
      label: "Unavailable",
      tone: "neutral",
    };
  }

  const current =
    Math.max(
      Math.abs(
        Number(
          row.current ?? 0
        )
      ),
      1
    );

  const relativeError =
    Number(
      row.historicalErrorBand80 ??
        0
    ) / current;

  const beatsBaseline =
    Boolean(
      evaluation.holdout
        ?.beatsBaseline
    );

  if (
    beatsBaseline &&
    relativeError <= 0.12
  ) {
    return {
      label: "Higher confidence",
      tone: "high",
    };
  }

  if (
    relativeError <= 0.25
  ) {
    return {
      label: "Moderate confidence",
      tone: "moderate",
    };
  }

  return {
    label: "Use caution",
    tone: "caution",
  };
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

  if (
    !selected ||
    !baseline
  ) {
    return null;
  }

  const improvement =
    baseline.mae
      ? ((baseline.mae -
          selected.mae) /
          baseline.mae) *
        100
      : 0;

  if (
    evaluation.selectedModel ===
    "Baseline"
  ) {
    return {
      improvement: 0,
      headline:
        "The persistence baseline was the strongest model during time-based validation.",
      detail:
        "For this target, the most defensible forecast is currently to keep the player's latest value unchanged rather than add unnecessary model complexity.",
    };
  }

  return {
    improvement,
    headline:
      evaluation.holdout
        .beatsBaseline
        ? `${evaluation.selectedModel} beat the simple baseline on the held-out season.`
        : `${evaluation.selectedModel} did not beat the simple baseline on the held-out season.`,
    detail:
      evaluation.holdout
        .beatsBaseline
        ? `Holdout MAE improved by ${Math.max(
            0,
            improvement
          ).toFixed(
            0
          )}% relative to predicting that the player's current value simply stays the same.`
        : `The baseline remains difficult to beat for this target. PlayerMatch keeps showing that result instead of hiding it.`,
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
