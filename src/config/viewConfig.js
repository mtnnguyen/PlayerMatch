export const STAT_BASES = {
  perGame: {
    label: "Per Game",
    shortLabel: "PG",
  },
  per36: {
    label: "Per 36",
    shortLabel: "P36",
  },
  per100: {
    label: "Per 100",
    shortLabel: "P100",
  },
};

export const POOL_FILTERS = [
  { key: "all", label: "All players" },
  { key: "same", label: "Same position group" },
  { key: "Guard", label: "Guards" },
  { key: "Wing", label: "Wings" },
  { key: "Big", label: "Bigs" },
];

export function withStatBasis(player, basis) {
  if (!player) {
    return null;
  }

  const basisStats =
    player.stats?.[basis] ??
    player.stats?.perGame ??
    null;

  if (!basisStats) {
    return player;
  }

  return {
    ...player,
    ...basisStats,
  };
}

export function filterComparisonPool(
  players,
  selectedPlayer,
  poolFilter
) {
  if (!selectedPlayer || poolFilter === "all") {
    return players;
  }

  const hasPositionData = players.some(
    (player) =>
      player.positionGroup &&
      player.positionGroup !== "Unknown"
  );

  if (!hasPositionData) {
    return players;
  }

  if (poolFilter === "same") {
    const group =
      selectedPlayer.positionGroup;

    if (!group || group === "Unknown") {
      return players;
    }

    return players.filter(
      (player) =>
        player.positionGroup === group
    );
  }

  return players.filter(
    (player) =>
      player.positionGroup === poolFilter
  );
}
