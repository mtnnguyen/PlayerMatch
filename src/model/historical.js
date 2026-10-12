import {
  FEATURES,
} from "../config/modelConfig";

import {
  withStatBasis,
} from "../config/viewConfig";

import {
  leagueStats,
  pairSimilarity,
} from "./similarity";

export function getHistorySeasons(
  historyDataset
) {
  return (
    historyDataset?.seasons ??
    []
  );
}

export function getPlayerHistory(
  historyDataset,
  playerId,
  statBasis = "perGame"
) {
  return getHistorySeasons(
    historyDataset
  )
    .map((seasonEntry) => {
      const rawPlayer =
        seasonEntry.players?.find(
          (player) =>
            player.id ===
            playerId
        );

      if (!rawPlayer) {
        return null;
      }

      return {
        season:
          seasonEntry.season,
        player:
          withStatBasis(
            rawPlayer,
            statBasis
          ),
        rawPlayer,
      };
    })
    .filter(Boolean);
}

export function seasonLabel(
  season
) {
  return season;
}

export function getFeature(
  key
) {
  return (
    FEATURES.find(
      (feature) =>
        feature.key === key
    ) ?? FEATURES[0]
  );
}

export function formatHistoricalValue(
  feature,
  value
) {
  const numeric =
    Number(value ?? 0);

  const rendered =
    Number.isInteger(numeric)
      ? `${numeric}`
      : numeric.toFixed(1);

  return feature?.percentage
    ? `${rendered}%`
    : rendered;
}

function changeThreshold(
  feature
) {
  if (
    feature?.percentage
  ) {
    return 1.0;
  }

  if (
    ["stl", "blk"].includes(
      feature?.key
    )
  ) {
    return 0.15;
  }

  return 0.5;
}

function direction(
  change,
  threshold
) {
  if (
    change > threshold
  ) {
    return "up";
  }

  if (
    change < -threshold
  ) {
    return "down";
  }

  return "stable";
}

function directionText(
  state
) {
  if (state === "up") {
    return "trending upward";
  }

  if (state === "down") {
    return "trending downward";
  }

  return "relatively stable";
}

export function summarizePlayerTrend(
  historyRows,
  feature
) {
  if (!historyRows?.length) {
    return null;
  }

  const values =
    historyRows.map(
      (row) => ({
        season: row.season,
        value: Number(
          row.player[
            feature.key
          ] ?? 0
        ),
        team:
          row.player.team,
        age:
          row.rawPlayer.age,
        gp:
          row.rawPlayer.gp,
        min:
          row.rawPlayer.min,
      })
    );

  const first =
    values[0];

  const latest =
    values[
      values.length - 1
    ];

  const change =
    latest.value -
    first.value;

  const recentChange =
    values.length >= 2
      ? latest.value -
        values[
          values.length - 2
        ].value
      : 0;

  const threshold =
    changeThreshold(
      feature
    );

  const overallDirection =
    direction(
      change,
      threshold
    );

  const recentDirection =
    direction(
      recentChange,
      threshold
    );

  const peak =
    [...values].sort(
      (a, b) =>
        b.value - a.value
    )[0];

  const low =
    [...values].sort(
      (a, b) =>
        a.value - b.value
    )[0];

  const seasonChanges =
    values
      .slice(1)
      .map(
        (row, index) =>
          Math.abs(
            row.value -
              values[index]
                .value
          )
      );

  const averageMovement =
    seasonChanges.length
      ? seasonChanges.reduce(
          (sum, value) =>
            sum + value,
          0
        ) /
        seasonChanges.length
      : 0;

  let consistency =
    "Not enough seasons";

  if (
    seasonChanges.length
  ) {
    if (
      averageMovement <=
      threshold
    ) {
      consistency =
        "Very steady";
    } else if (
      averageMovement <=
      threshold * 2
    ) {
      consistency =
        "Moderately steady";
    } else {
      consistency =
        "Variable year to year";
    }
  }

  return {
    values,
    first,
    latest,
    peak,
    low,
    change,
    recentChange,
    direction:
      overallDirection,
    directionText:
      directionText(
        overallDirection
      ),
    recentDirection,
    recentDirectionText:
      directionText(
        recentDirection
      ),
    averageMovement,
    consistency,
    seasonCount:
      values.length,
  };
}

export function buildTrendRead({
  leftName,
  rightName,
  leftTrend,
  rightTrend,
  feature,
}) {
  if (
    !leftTrend &&
    !rightTrend
  ) {
    return null;
  }

  function playerSentence(
    name,
    trend
  ) {
    if (!trend) {
      return `${name} does not have enough eligible historical seasons in this dataset for this view.`;
    }

    return (
      `${name} is ${trend.directionText} in ${feature.longLabel.toLowerCase()} across the available sample, moving from ` +
      `${formatHistoricalValue(
        feature,
        trend.first.value
      )} in ${trend.first.season} to ${formatHistoricalValue(
        feature,
        trend.latest.value
      )} in ${trend.latest.season}.`
    );
  }

  const leftChange =
    leftTrend?.change ?? 0;

  const rightChange =
    rightTrend?.change ?? 0;

  let comparison;

  if (
    leftTrend &&
    rightTrend
  ) {
    const gap =
      Math.abs(
        leftChange -
        rightChange
      );

    if (
      gap <=
      changeThreshold(
        feature
      )
    ) {
      comparison =
        `The two players have moved in a broadly similar direction over the available seasons for this stat.`;
    } else {
      const leader =
        leftChange >
        rightChange
          ? leftName
          : rightName;

      comparison =
        `${leader} has shown the larger net increase in ${feature.longLabel.toLowerCase()} across the available historical sample.`;
    }
  } else {
    comparison =
      "A direct trend comparison is limited because one player has fewer eligible seasons in the dataset.";
  }

  return {
    left:
      playerSentence(
        leftName,
        leftTrend
      ),
    right:
      playerSentence(
        rightName,
        rightTrend
      ),
    comparison,
    caveat:
      "This is descriptive trend analysis. Changes can reflect age, role, teammates, injuries, minutes, coaching and team context; they should not automatically be interpreted as player development caused by one factor.",
  };
}

export function buildPairSimilarityHistory({
  historyDataset,
  leftId,
  rightId,
  statBasis,
  weights,
}) {
  const rows = [];

  for (
    const seasonEntry of getHistorySeasons(
      historyDataset
    )
  ) {
    const basisPlayers =
      (seasonEntry.players ?? []).map(
        (player) =>
          withStatBasis(
            player,
            statBasis
          )
      );

    const left =
      basisPlayers.find(
        (player) =>
          player.id === leftId
      );

    const right =
      basisPlayers.find(
        (player) =>
          player.id === rightId
      );

    if (
      !left ||
      !right ||
      basisPlayers.length < 2
    ) {
      continue;
    }

    const stats =
      leagueStats(
        basisPlayers
      );

    rows.push({
      season:
        seasonEntry.season,
      score:
        pairSimilarity(
          left,
          right,
          weights,
          stats
        ),
      left,
      right,
      playerCount:
        basisPlayers.length,
    });
  }

  return rows;
}

export function summarizeSimilarityHistory(
  rows
) {
  if (!rows?.length) {
    return null;
  }

  const first =
    rows[0];

  const latest =
    rows[
      rows.length - 1
    ];

  const change =
    latest.score -
    first.score;

  const peak =
    [...rows].sort(
      (a, b) =>
        b.score - a.score
    )[0];

  const low =
    [...rows].sort(
      (a, b) =>
        a.score - b.score
    )[0];

  let trend =
    "Similarity has been fairly stable.";

  if (change >= 8) {
    trend =
      "The two players have become meaningfully more similar over the available seasons.";
  } else if (
    change <= -8
  ) {
    trend =
      "The two players have become meaningfully less similar over the available seasons.";
  } else if (
    change >= 3
  ) {
    trend =
      "The two players have become somewhat more similar.";
  } else if (
    change <= -3
  ) {
    trend =
      "The two players have become somewhat less similar.";
  }

  const scoreRange =
    peak.score - low.score;

  let stability =
    "Historically stable";

  if (scoreRange > 20) {
    stability =
      "Historically volatile";
  } else if (
    scoreRange > 10
  ) {
    stability =
      "Moderately variable";
  }

  return {
    first,
    latest,
    peak,
    low,
    change,
    range:
      scoreRange,
    trend,
    stability,
    seasonCount:
      rows.length,
    caveat:
      "Each season is standardized against that season's eligible player pool. A changing score can reflect changes in either player and changes in the league around them.",
  };
}
