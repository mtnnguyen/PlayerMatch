import PlayerPortrait from "./PlayerPortrait";

export default function CompactMatches({
  matches,
  comparisonPlayer,
  onSelect,
  limit = 4,
}) {
  const visible = matches
    .filter((player) => player.id !== comparisonPlayer.id)
    .slice(0, limit);

  return (
    <section className="v3-card compact-matches-card">
      <div className="v3-card-title">
        <div>
          <span>PLAYER POOL</span>
          <h3>Other close matches</h3>
        </div>
        <strong>{matches.length}</strong>
      </div>

      <div className="compact-matches-list">
        {visible.map((player, index) => (
          <button
            type="button"
            key={player.id}
            onClick={() => onSelect(player)}
          >
            <span className="compact-match-rank">
              {String(index + 1).padStart(2, "0")}
            </span>
            <PlayerPortrait player={player} variant="search" />
            <span className="compact-match-copy">
              <strong>{player.name}</strong>
              <small>{player.team}{player.position ? ` · ${player.position}` : ""}</small>
            </span>
            <strong className="compact-match-score">
              {player.similarity.toFixed(0)}%
            </strong>
          </button>
        ))}
      </div>
    </section>
  );
}
