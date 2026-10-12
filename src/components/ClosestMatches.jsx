import PlayerPortrait from "./PlayerPortrait";

import {
  similarityLabel,
} from "../model/similarity";

export default function ClosestMatches({
  matches,
  comparisonPlayer,
  onSelect,
}) {
  return (
    <section
      className="analysis-card closest-card"
      id="closest-matches"
      aria-labelledby="closest-matches-title"
    >
      <div className="analysis-card-title">
        <div>
          <span>Player pool</span>
          <h3 id="closest-matches-title">
            Closest matches
          </h3>
        </div>

        <strong
          className="candidate-count"
          aria-label={`${matches.length} comparison candidates`}
        >
          {matches.length}
        </strong>
      </div>

      <div className="closest-list">
        {matches
          .slice(0, 6)
          .map(
            (
              player,
              index
            ) => {
              const active =
                player.id ===
                comparisonPlayer.id;

              return (
                <button
                  type="button"
                  key={
                    player.id
                  }
                  aria-pressed={
                    active
                  }
                  aria-label={`Compare with ${player.name}, ${player.team}, ${(
                    player.similarity ??
                    0
                  ).toFixed(
                    0
                  )} percent similarity`}
                  className={
                    active
                      ? "closest-row active"
                      : "closest-row"
                  }
                  onClick={() =>
                    onSelect(
                      player
                    )
                  }
                >
                  <span className="closest-rank">
                    {String(
                      index + 1
                    ).padStart(
                      2,
                      "0"
                    )}
                  </span>

                  <PlayerPortrait
                    player={
                      player
                    }
                    variant="search"
                  />

                  <span className="closest-player">
                    <strong>
                      {
                        player.name
                      }
                    </strong>

                    <small>
                      {
                        player.team
                      }
                      {player.position
                        ? ` · ${player.position}`
                        : ""}
                      {" · "}
                      {similarityLabel(
                        player.similarity ??
                          0
                      )}
                    </small>
                  </span>

                  <strong className="closest-score">
                    {(
                      player.similarity ??
                      0
                    ).toFixed(
                      0
                    )}
                    %
                  </strong>
                </button>
              );
            }
          )}
      </div>
    </section>
  );
}
