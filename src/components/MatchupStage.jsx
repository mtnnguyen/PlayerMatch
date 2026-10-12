import {
  ArrowLeftRight,
} from "lucide-react";

import {
  STAT_BASES,
} from "../config/viewConfig";

import PlayerPortrait from "./PlayerPortrait";
import PlayerSearch from "./PlayerSearch";

import {
  similarityLabel,
} from "../model/similarity";

function PlayerSide({
  player,
  side,
  players,
  excludeId,
  role,
  onSelect,
}) {
  const isLeft =
    side === "left";

  return (
    <div
      className={`stage-player stage-player--${side}`}
    >
      {!isLeft && (
        <PlayerPortrait
          player={player}
        />
      )}

      <div className="stage-player-copy">
        <span className="stage-kicker">
          {isLeft
            ? "Primary player"
            : "Comparison"}
        </span>

        <h1>{player.name}</h1>

        <p className="player-meta">
          {player.team}
          {player.position
            ? ` · ${player.position}`
            : ""}
          {" · "}
          {player.gp} GP
          {" · "}
          {player.min} MPG
        </p>

        <div className="archetype-row">
          <strong>
            {role.name}
          </strong>

          <span>
            {role.tags.join(
              " · "
            )}
          </span>
        </div>

        <div
          className="stage-line"
          aria-label={`${player.name} headline statistics`}
        >
          <span>
            <strong>
              {player.pts}
            </strong>
            <small>PTS</small>
          </span>

          <span>
            <strong>
              {player.reb}
            </strong>
            <small>REB</small>
          </span>

          <span>
            <strong>
              {player.ast}
            </strong>
            <small>AST</small>
          </span>

          <span>
            <strong>
              {player.tsPct}%
            </strong>
            <small>TS%</small>
          </span>
        </div>

        <PlayerSearch
          players={players}
          excludeId={excludeId}
          onSelect={onSelect}
          align={side}
          label={
            isLeft
              ? "Search for the primary player"
              : "Search for the comparison player"
          }
          placeholder={
            isLeft
              ? "Change primary player..."
              : "Change comparison..."
          }
        />
      </div>

      {isLeft && (
        <PlayerPortrait
          player={player}
        />
      )}
    </div>
  );
}

export default function MatchupStage({
  allPlayers,
  comparisonPool,
  selectedPlayer,
  comparisonPlayer,
  selectedRole,
  comparisonRole,
  profile,
  statBasis,
  onSelectPrimary,
  onSelectComparison,
  onSwap,
}) {
  const similarity =
    comparisonPlayer.similarity ??
    0;

  return (
    <section
      className="matchup-stage"
      id="matchup"
      aria-labelledby="matchup-title"
    >
      <h2
        id="matchup-title"
        className="sr-only"
      >
        Player comparison
      </h2>

      <PlayerSide
        player={selectedPlayer}
        side="left"
        players={allPlayers}
        excludeId={
          comparisonPlayer.id
        }
        role={selectedRole}
        onSelect={
          onSelectPrimary
        }
      />

      <div
        className="matchup-center"
        aria-live="polite"
      >
        <span className="model-label">
          Model match
        </span>

        <div
          className="similarity-dial"
          style={{
            "--score": `${similarity}%`,
          }}
          aria-label={`${similarity.toFixed(
            1
          )} percent similarity`}
        >
          <div>
            <strong>
              {similarity.toFixed(
                0
              )}
            </strong>

            <span>%</span>
          </div>
        </div>

        <strong className="match-label">
          {similarityLabel(
            similarity
          )}
        </strong>

        <span className="match-profile-label">
          {profile}
          {" · "}
          {
            STAT_BASES[
              statBasis
            ].label
          }
        </span>

        <button
          type="button"
          className="swap-button"
          onClick={onSwap}
          aria-label={`Swap ${selectedPlayer.name} and ${comparisonPlayer.name}`}
        >
          <ArrowLeftRight
            size={17}
            aria-hidden="true"
          />
          Swap players
        </button>
      </div>

      <PlayerSide
        player={comparisonPlayer}
        side="right"
        players={
          comparisonPool
        }
        excludeId={
          selectedPlayer.id
        }
        role={comparisonRole}
        onSelect={
          onSelectComparison
        }
      />
    </section>
  );
}
