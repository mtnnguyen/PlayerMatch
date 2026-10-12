import { ArrowRight } from "lucide-react";
import PlayerPortrait from "./PlayerPortrait";
import { similarityLabel } from "../model/similarity";

export default function MatchPool({ selectedPlayer, comparisonPlayer, matches, onSelect }) {
  return (
    <section className="match-pool" id="matches">
      <div className="match-pool-heading">
        <div><span>PLAYER POOL</span><h2>Closest matches to {selectedPlayer.name}</h2></div>
        <p>{matches.length} eligible comparison players</p>
      </div>

      <div className="match-card-grid">
        {matches.slice(0, 6).map((player, index) => (
          <button
            key={player.id}
            className={`match-card ${player.id === comparisonPlayer.id ? "active" : ""}`}
            onClick={() => onSelect(player)}
          >
            <div className="match-card-top">
              <span>{String(index + 1).padStart(2, "0")}</span>
              <strong>{(player.similarity ?? 0).toFixed(0)}%</strong>
            </div>

            <PlayerPortrait player={player} variant="card" />

            <div className="match-card-name">
              <strong>{player.name}</strong><span>{player.team}</span>
            </div>

            <div className="match-card-stats">
              <span><strong>{player.pts}</strong>PTS</span>
              <span><strong>{player.reb}</strong>REB</span>
              <span><strong>{player.ast}</strong>AST</span>
            </div>

            <div className="match-card-footer">
              {similarityLabel(player.similarity ?? 0)} <ArrowRight size={13} />
            </div>
          </button>
        ))}
      </div>
    </section>
  );
}
