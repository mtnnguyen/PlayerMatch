import {
  withStatBasis,
} from "../config/viewConfig";

import {
  clusterForPlayer,
  runKMeans,
} from "./clustering";

export function buildArchetypeJourneys({
  historyDataset,
  playerIds,
  statBasis,
  weights,
  clusterCount = 6,
}) {
  const uniqueIds = [
    ...new Set(
      (playerIds ?? []).filter(
        (id) => id != null
      )
    ),
  ];

  const journeys =
    Object.fromEntries(
      uniqueIds.map(
        (id) => [id, []]
      )
    );

  if (
    !historyDataset?.seasons?.length ||
    !uniqueIds.length
  ) {
    return journeys;
  }

  for (
    const seasonEntry of historyDataset.seasons
  ) {
    const players =
      (seasonEntry.players ?? [])
        .map((player) =>
          withStatBasis(
            player,
            statBasis
          )
        );

    if (
      players.length <
      clusterCount
    ) {
      continue;
    }

    const presentIds =
      uniqueIds.filter(
        (id) =>
          players.some(
            (player) =>
              player.id === id
          )
      );

    if (!presentIds.length) {
      continue;
    }

    // One clustering run per season. Both player journeys
    // reuse the same fitted season-level cluster result.
    const result =
      runKMeans(
        players,
        weights,
        clusterCount
      );

    for (const playerId of presentIds) {
      const cluster =
        clusterForPlayer(
          result,
          players,
          playerId
        );

      if (!cluster) {
        continue;
      }

      journeys[playerId].push({
        season:
          seasonEntry.season,
        name:
          cluster.name,
        description:
          cluster.description,
        size:
          cluster.members.length,
        representative:
          cluster.representative
            ?.name ??
          null,
        traits:
          cluster.traits,
        separation:
          result.separation,
        silhouette:
          result.silhouette,
      });
    }
  }

  return journeys;
}

export function buildArchetypeJourney({
  historyDataset,
  playerId,
  statBasis,
  weights,
  clusterCount = 6,
}) {
  const journeys =
    buildArchetypeJourneys({
      historyDataset,
      playerIds: [playerId],
      statBasis,
      weights,
      clusterCount,
    });

  return journeys[playerId] ?? [];
}

export function summarizeArchetypeJourney(
  journey
) {
  if (!journey?.length) {
    return null;
  }

  const names =
    journey.map(
      (row) => row.name
    );

  let changes = 0;

  for (
    let index = 1;
    index < names.length;
    index += 1
  ) {
    if (
      names[index] !==
      names[index - 1]
    ) {
      changes += 1;
    }
  }

  const unique =
    [...new Set(names)];

  const latest =
    journey[
      journey.length - 1
    ];

  const first =
    journey[0];

  let headline;

  if (changes === 0) {
    headline =
      `This player's data-driven archetype has been stable across the available eligible seasons.`;
  } else if (changes === 1) {
    headline =
      `This player's statistical archetype changed once across the available eligible seasons.`;
  } else {
    headline =
      `This player's statistical archetype moved through ${unique.length} different labels across the available eligible seasons.`;
  }

  return {
    first,
    latest,
    changes,
    unique,
    headline,
    caveat:
      "Each season is clustered against that season's eligible league using the active model settings. A label change can reflect the player changing, the league changing, or the cluster boundaries changing.",
  };
}
