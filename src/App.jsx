import { useEffect, useMemo, useState } from "react";
import {
  Activity,
  ArrowRight,
  BarChart3,
  CircleHelp,
  Search,
  Shield,
  Sparkles,
  Target,
  Users,
  X,
} from "lucide-react";

const FEATURES = [
  { key: "pts", label: "PTS", group: "scoring" },
  { key: "reb", label: "REB", group: "size" },
  { key: "ast", label: "AST", group: "playmaking" },
  { key: "stl", label: "STL", group: "defense" },
  { key: "blk", label: "BLK", group: "defense" },
  { key: "fgPct", label: "FG%", group: "efficiency" },
  { key: "threePct", label: "3P%", group: "efficiency" },
  { key: "ftPct", label: "FT%", group: "efficiency" },
  { key: "usage", label: "USG%", group: "scoring" },
  { key: "tsPct", label: "TS%", group: "efficiency" },
];

const PROFILES = {
  Balanced: {
    icon: Users,
    description: "Equal emphasis across the full statistical profile.",
    weights: {
      pts: 1,
      reb: 1,
      ast: 1,
      stl: 1,
      blk: 1,
      fgPct: 1,
      threePct: 1,
      ftPct: 1,
      usage: 1,
      tsPct: 1,
    },
  },
  Scoring: {
    icon: Target,
    description: "Prioritizes scoring volume, efficiency and usage.",
    weights: {
      pts: 2.2,
      reb: 0.5,
      ast: 0.7,
      stl: 0.4,
      blk: 0.35,
      fgPct: 1.15,
      threePct: 1.4,
      ftPct: 0.7,
      usage: 1.7,
      tsPct: 1.55,
    },
  },
  Playmaking: {
    icon: Activity,
    description: "Prioritizes creation, assists and offensive responsibility.",
    weights: {
      pts: 0.8,
      reb: 0.55,
      ast: 2.6,
      stl: 0.65,
      blk: 0.3,
      fgPct: 0.6,
      threePct: 0.55,
      ftPct: 0.4,
      usage: 1.3,
      tsPct: 0.65,
    },
  },
  Defense: {
    icon: Shield,
    description: "Prioritizes steals, blocks and rebounding.",
    weights: {
      pts: 0.35,
      reb: 1.55,
      ast: 0.45,
      stl: 2.25,
      blk: 2.25,
      fgPct: 0.4,
      threePct: 0.25,
      ftPct: 0.2,
      usage: 0.25,
      tsPct: 0.35,
    },
  },
};

function initials(name) {
  return name
    .split(" ")
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

function cosineSimilarity(a, b) {
  let dot = 0;
  let magA = 0;
  let magB = 0;

  for (let i = 0; i < a.length; i += 1) {
    dot += a[i] * b[i];
    magA += a[i] ** 2;
    magB += b[i] ** 2;
  }

  const denominator = Math.sqrt(magA) * Math.sqrt(magB);
  if (!denominator) return 0;

  return dot / denominator;
}

function computeLeagueStats(players) {
  const output = {};

  for (const { key } of FEATURES) {
    const values = players.map((player) => Number(player[key] ?? 0));
    const mean =
      values.reduce((sum, value) => sum + value, 0) /
      Math.max(values.length, 1);

    const variance =
      values.reduce((sum, value) => sum + (value - mean) ** 2, 0) /
      Math.max(values.length, 1);

    output[key] = {
      mean,
      std: Math.sqrt(variance) || 1,
    };
  }

  return output;
}

function playerVector(player, leagueStats, weights) {
  return FEATURES.map(({ key }) => {
    const { mean, std } = leagueStats[key];
    const zScore = (Number(player[key] ?? 0) - mean) / std;

    return zScore * Math.sqrt(weights[key] ?? 1);
  });
}

function buildMatches(players, selectedPlayer, profileName) {
  if (!selectedPlayer || players.length < 2) return [];

  const leagueStats = computeLeagueStats(players);
  const weights = PROFILES[profileName].weights;
  const selectedVector = playerVector(selectedPlayer, leagueStats, weights);

  return players
    .filter((player) => player.id !== selectedPlayer.id)
    .map((player) => {
      const vector = playerVector(player, leagueStats, weights);
      const raw = cosineSimilarity(selectedVector, vector);

      // Converts [-1, 1] cosine similarity into an intuitive [0, 100] score.
      const similarity = Math.max(0, Math.min(100, ((raw + 1) / 2) * 100));

      return {
        ...player,
        similarity,
      };
    })
    .sort((a, b) => b.similarity - a.similarity);
}

function similarityLabel(value) {
  if (value >= 94) return "Near twin";
  if (value >= 88) return "Very similar";
  if (value >= 80) return "Strong match";
  return "Similar profile";
}

function StatCell({ label, value }) {
  return (
    <div className="hero-stat">
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  );
}

function DifferenceBar({ left, right }) {
  const max = Math.max(Math.abs(left), Math.abs(right), 1);
  const leftWidth = Math.max(8, (Math.abs(left) / max) * 100);
  const rightWidth = Math.max(8, (Math.abs(right) / max) * 100);

  return (
    <div className="difference-bar">
      <span style={{ width: `${leftWidth}%` }} />
      <span style={{ width: `${rightWidth}%` }} />
    </div>
  );
}

export default function App() {
  const [dataset, setDataset] = useState({
    meta: null,
    players: [],
  });
  const [loadError, setLoadError] = useState("");
  const [query, setQuery] = useState("");
  const [selectedId, setSelectedId] = useState(null);
  const [profile, setProfile] = useState("Balanced");
  const [comparisonId, setComparisonId] = useState(null);
  const [showMethodology, setShowMethodology] = useState(false);

  useEffect(() => {
    fetch("/players.json")
      .then((response) => {
        if (!response.ok) {
          throw new Error("Could not load player dataset.");
        }
        return response.json();
      })
      .then((payload) => {
        const players = payload.players ?? [];
        setDataset({
          meta: payload.meta ?? {},
          players,
        });

        if (players.length) {
          setSelectedId(players[0].id);
        }
      })
      .catch((error) => {
        setLoadError(error.message);
      });
  }, []);

  const players = dataset.players;

  const selectedPlayer =
    players.find((player) => player.id === selectedId) ?? players[0] ?? null;

  const matches = useMemo(
    () => buildMatches(players, selectedPlayer, profile),
    [players, selectedPlayer, profile]
  );

  const comparisonPlayer =
    players.find((player) => player.id === comparisonId) ?? matches[0] ?? null;

  const searchResults = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    if (!normalized) return [];

    return players
      .filter((player) =>
        player.name.toLowerCase().includes(normalized)
      )
      .slice(0, 7);
  }, [players, query]);

  function selectPlayer(player) {
    setSelectedId(player.id);
    setComparisonId(null);
    setQuery("");
  }

  if (loadError) {
    return (
      <div className="loading-screen">
        <strong>PlayerMatch could not start.</strong>
        <span>{loadError}</span>
      </div>
    );
  }

  if (!selectedPlayer) {
    return (
      <div className="loading-screen">
        <strong>Loading PlayerMatch…</strong>
      </div>
    );
  }

  return (
    <div className="app-shell">
      <header className="topbar">
        <div className="brand">
          <div className="brand-mark">PM</div>
          <div>
            <strong>PlayerMatch</strong>
            <span>NBA similarity explorer</span>
          </div>
        </div>

        <div className="player-search">
          <Search size={17} />
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search a player..."
            onKeyDown={(event) => {
              if (event.key === "Enter" && searchResults[0]) {
                selectPlayer(searchResults[0]);
              }
              if (event.key === "Escape") {
                setQuery("");
              }
            }}
          />

          {query.trim() && (
            <div className="search-menu">
              {searchResults.length ? (
                searchResults.map((player) => (
                  <button
                    key={player.id}
                    onClick={() => selectPlayer(player)}
                  >
                    <span className="mini-avatar">{initials(player.name)}</span>
                    <span>
                      <strong>{player.name}</strong>
                      <small>
                        {player.team} · {player.pts} PPG · {player.ast} APG
                      </small>
                    </span>
                    <ArrowRight size={14} />
                  </button>
                ))
              ) : (
                <div className="search-empty">No matching players</div>
              )}
            </div>
          )}
        </div>

        <div className="topbar-meta">
          <span className="season-chip">{dataset.meta?.season ?? "—"}</span>
          <button
            className="icon-button"
            onClick={() => setShowMethodology(true)}
            title="Methodology"
          >
            <CircleHelp size={17} />
          </button>
        </div>
      </header>

      {dataset.meta?.demo && (
        <div className="demo-banner">
          <Sparkles size={14} />
          <span>
            Demo dataset is active. Run{" "}
            <code>python scripts/build_player_data.py</code> to replace it with
            NBA Stats API data.
          </span>
        </div>
      )}

      <main className="workspace">
        <section className="selected-card">
          <div className="selected-main">
            <div className="player-avatar">{initials(selectedPlayer.name)}</div>
            <div>
              <span className="eyebrow">Selected player</span>
              <h1>{selectedPlayer.name}</h1>
              <p>
                {selectedPlayer.team} · {selectedPlayer.gp} GP ·{" "}
                {selectedPlayer.min} MPG
              </p>
            </div>
          </div>

          <div className="hero-stats">
            <StatCell label="PTS" value={selectedPlayer.pts} />
            <StatCell label="REB" value={selectedPlayer.reb} />
            <StatCell label="AST" value={selectedPlayer.ast} />
            <StatCell label="TS%" value={selectedPlayer.tsPct} />
          </div>
        </section>

        <section className="profile-strip">
          <div className="profile-heading">
            <div>
              <span className="eyebrow">Similarity model</span>
              <strong>{profile} profile</strong>
            </div>
            <p>{PROFILES[profile].description}</p>
          </div>

          <div className="profile-buttons">
            {Object.entries(PROFILES).map(([name, config]) => {
              const Icon = config.icon;

              return (
                <button
                  key={name}
                  className={profile === name ? "active" : ""}
                  onClick={() => setProfile(name)}
                >
                  <Icon size={15} />
                  {name}
                </button>
              );
            })}
          </div>
        </section>

        <div className="content-grid">
          <section className="matches-panel">
            <div className="section-header">
              <div>
                <span className="eyebrow">Model output</span>
                <h2>Closest matches</h2>
              </div>
              <span>{matches.length} candidates</span>
            </div>

            <div className="match-list">
              {matches.slice(0, 8).map((player, index) => {
                const active = comparisonPlayer?.id === player.id;

                return (
                  <button
                    key={player.id}
                    className={`match-row ${active ? "active" : ""}`}
                    onClick={() => setComparisonId(player.id)}
                  >
                    <span className="match-rank">
                      {String(index + 1).padStart(2, "0")}
                    </span>

                    <span className="mini-avatar">{initials(player.name)}</span>

                    <span className="match-player">
                      <strong>{player.name}</strong>
                      <small>
                        {player.team} · {similarityLabel(player.similarity)}
                      </small>
                    </span>

                    <span className="match-snapshot">
                      <small>PTS</small>
                      <strong>{player.pts}</strong>
                    </span>

                    <span className="match-snapshot">
                      <small>AST</small>
                      <strong>{player.ast}</strong>
                    </span>

                    <span className="similarity-score">
                      <strong>{player.similarity.toFixed(0)}%</strong>
                      <small>match</small>
                    </span>
                  </button>
                );
              })}
            </div>
          </section>

          <aside className="comparison-panel">
            {comparisonPlayer && (
              <>
                <div className="section-header compact">
                  <div>
                    <span className="eyebrow">Head-to-head</span>
                    <h2>Stat comparison</h2>
                  </div>
                  <BarChart3 size={18} />
                </div>

                <div className="comparison-names">
                  <div>
                    <span className="mini-avatar large">
                      {initials(selectedPlayer.name)}
                    </span>
                    <strong>{selectedPlayer.name}</strong>
                    <small>{selectedPlayer.team}</small>
                  </div>

                  <span>VS</span>

                  <div>
                    <span className="mini-avatar large alt">
                      {initials(comparisonPlayer.name)}
                    </span>
                    <strong>{comparisonPlayer.name}</strong>
                    <small>{comparisonPlayer.team}</small>
                  </div>
                </div>

                <div className="comparison-table">
                  {FEATURES.map(({ key, label }) => {
                    const left = Number(selectedPlayer[key] ?? 0);
                    const right = Number(comparisonPlayer[key] ?? 0);

                    return (
                      <div className="comparison-row" key={key}>
                        <strong className={left > right ? "winner" : ""}>
                          {left}
                        </strong>

                        <div>
                          <span>{label}</span>
                          <DifferenceBar left={left} right={right} />
                        </div>

                        <strong className={right > left ? "winner" : ""}>
                          {right}
                        </strong>
                      </div>
                    );
                  })}
                </div>

                <div className="comparison-footer">
                  <span>Similarity</span>
                  <strong>{comparisonPlayer.similarity.toFixed(1)}%</strong>
                </div>
              </>
            )}
          </aside>
        </div>

        <section className="model-note">
          <div>
            <Sparkles size={18} />
            <div>
              <strong>What PlayerMatch measures</strong>
              <p>
                Players are standardized against the league, weighted by the
                selected profile, then compared using cosine similarity.
              </p>
            </div>
          </div>

          <button onClick={() => setShowMethodology(true)}>
            View methodology
            <ArrowRight size={14} />
          </button>
        </section>
      </main>

      {showMethodology && (
        <div
          className="modal-backdrop"
          onMouseDown={() => setShowMethodology(false)}
        >
          <div
            className="method-modal"
            onMouseDown={(event) => event.stopPropagation()}
          >
            <div className="modal-header">
              <div>
                <span className="eyebrow">Methodology</span>
                <h2>How PlayerMatch works</h2>
              </div>
              <button
                className="icon-button"
                onClick={() => setShowMethodology(false)}
              >
                <X size={18} />
              </button>
            </div>

            <div className="method-steps">
              <article>
                <span>01</span>
                <div>
                  <strong>Feature selection</strong>
                  <p>
                    PlayerMatch uses points, rebounds, assists, steals, blocks,
                    shooting percentages, usage rate and true shooting.
                  </p>
                </div>
              </article>

              <article>
                <span>02</span>
                <div>
                  <strong>League standardization</strong>
                  <p>
                    Each feature is converted to a z-score so a stat with a
                    larger numeric range does not automatically dominate the
                    similarity model.
                  </p>
                </div>
              </article>

              <article>
                <span>03</span>
                <div>
                  <strong>Profile weighting</strong>
                  <p>
                    Balanced, scoring, playmaking and defense modes change how
                    strongly each feature influences the comparison.
                  </p>
                </div>
              </article>

              <article>
                <span>04</span>
                <div>
                  <strong>Cosine similarity</strong>
                  <p>
                    Weighted player vectors are compared by direction. The
                    resulting cosine score is converted into a 0–100 match
                    score for presentation.
                  </p>
                </div>
              </article>
            </div>

            <p className="method-warning">
              PlayerMatch measures statistical profile similarity, not overall
              player quality, role fit, scouting grade or projected value.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
