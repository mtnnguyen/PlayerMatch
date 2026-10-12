import { ArrowLeftRight } from "lucide-react";
import PlayerPortrait from "./PlayerPortrait";
import PlayerSearch from "./PlayerSearch";
import { similarityLabel } from "../model/similarity";

function PlayerSide({ player, side, players, excludeId, role, onSelect }) {
  return (
    <div className={`stage-player stage-player--${side}`}>
      {side === "right" && <PlayerPortrait player={player} />}

      <div className="stage-player-copy">
        <span className="stage-kicker">
          {side === "left" ? "Primary player" : "Comparison"}
        </span>
        <h1>{player.name}</h1>
        <p>{player.team} · {player.gp} GP · {player.min} MPG</p>

        <div className="archetype-row">
          <strong>{role.name}</strong>
          <span>{role.tags.join(" · ")}</span>
        </div>

        <div className="stage-line">
          <span><strong>{player.pts}</strong>PTS</span>
          <span><strong>{player.reb}</strong>REB</span>
          <span><strong>{player.ast}</strong>AST</span>
          <span><strong>{player.tsPct}%</strong>TS</span>
        </div>

        <PlayerSearch
          players={players}
          excludeId={excludeId}
          onSelect={onSelect}
          align={side}
          placeholder={side === "left" ? "Change primary player..." : "Change comparison..."}
        />
      </div>

      {side === "left" && <PlayerPortrait player={player} />}
    </div>
  );
}

export default function MatchupStage({
  players,
  selectedPlayer,
  comparisonPlayer,
  selectedRole,
  comparisonRole,
  profile,
  onSelectPrimary,
  onSelectComparison,
  onSwap,
}) {
  const similarity = comparisonPlayer.similarity ?? 0;

  return (
    <section className="matchup-stage" id="matchup">
      <PlayerSide
        player={selectedPlayer}
        side="left"
        players={players}
        excludeId={comparisonPlayer.id}
        role={selectedRole}
        onSelect={onSelectPrimary}
      />

      <div className="matchup-center">
        <span className="model-label">MODEL MATCH</span>
        <div className="similarity-dial" style={{ "--score": `${similarity}%` }}>
          <div><strong>{similarity.toFixed(0)}</strong><span>%</span></div>
        </div>
        <strong className="match-label">{similarityLabel(similarity)}</strong>
        <span className="match-profile-label">{profile} profile</span>
        <button className="swap-button" onClick={onSwap}>
          <ArrowLeftRight size={15} /> Swap
        </button>
      </div>

      <PlayerSide
        player={comparisonPlayer}
        side="right"
        players={players}
        excludeId={selectedPlayer.id}
        role={comparisonRole}
        onSelect={onSelectComparison}
      />
    </section>
  );
}
