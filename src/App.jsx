import { useEffect, useMemo, useState } from "react";

import Header from "./components/Header";
import MatchupStage from "./components/MatchupStage";
import MatchPool from "./components/MatchPool";
import MethodologyModal from "./components/MethodologyModal";
import {
  CategoryEdge,
  DifferencePanel,
  ModelDetails,
  SimilarityDrivers,
  StatBattle,
} from "./components/AnalysisPanels";

import { PROFILES } from "./config/modelConfig";
import {
  buildMatches,
  explainFeatures,
  leagueStats,
} from "./model/similarity";
import {
  analystSummary,
  archetype,
  categoryComparisons,
} from "./model/insights";

const PROFILE_ICONS = {
  Balanced: "Balanced",
  Scoring: "Scoring",
  Playmaking: "Playmaking",
  Defense: "Defense",
};

function ProfileSelector({ profile, onChange }) {
  return (
    <section className="profile-deck">
      <div className="profile-deck-copy">
        <span>SIMILARITY PROFILE</span>
        <strong>{profile}</strong>
        <p>{PROFILES[profile].description}</p>
      </div>

      <div className="profile-buttons">
        {Object.keys(PROFILE_ICONS).map((name) => (
          <button
            key={name}
            className={profile === name ? "active" : ""}
            onClick={() => onChange(name)}
          >
            {name}
          </button>
        ))}
      </div>
    </section>
  );
}

function AnalystReadout({ summary, leftName, rightName }) {
  if (!summary) return null;

  return (
    <section className="analyst-readout">
      <div className="analyst-badge">PM</div>

      <div className="analyst-copy">
        <span>MODEL INTERPRETATION</span>
        <p>{summary.paragraph}</p>
      </div>

      <div className="analyst-facts">
        <div>
          <span>{leftName} strength</span>
          <strong>{summary.leftEdge}</strong>
        </div>
        <div>
          <span>{rightName} strength</span>
          <strong>{summary.rightEdge}</strong>
        </div>
        <div>
          <span>Closest category</span>
          <strong>{summary.closest}</strong>
        </div>
      </div>
    </section>
  );
}

export default function App() {
  const [dataset, setDataset] = useState({ meta: null, players: [] });
  const [loadError, setLoadError] = useState("");
  const [selectedId, setSelectedId] = useState(null);
  const [comparisonId, setComparisonId] = useState(null);
  const [profile, setProfile] = useState("Balanced");
  const [showMethodology, setShowMethodology] = useState(false);

  useEffect(() => {
    fetch("/players.json")
      .then((response) => {
        if (!response.ok) throw new Error("Could not load player dataset.");
        return response.json();
      })
      .then((payload) => {
        const players = payload.players ?? [];
        setDataset({ meta: payload.meta ?? {}, players });
        if (players.length) setSelectedId(players[0].id);
      })
      .catch((error) => setLoadError(error.message));
  }, []);

  const players = dataset.players;
  const stats = useMemo(() => leagueStats(players), [players]);

  const selectedPlayer =
    players.find((player) => player.id === selectedId) ??
    players[0] ??
    null;

  const matches = useMemo(
    () => buildMatches(players, selectedPlayer, profile, stats),
    [players, selectedPlayer, profile, stats]
  );

  const comparisonPlayer =
    matches.find((player) => player.id === comparisonId) ??
    matches[0] ??
    null;

  const categories = useMemo(
    () =>
      selectedPlayer && comparisonPlayer
        ? categoryComparisons(players, selectedPlayer, comparisonPlayer)
        : [],
    [players, selectedPlayer, comparisonPlayer]
  );

  const featureRows = useMemo(
    () =>
      selectedPlayer && comparisonPlayer
        ? explainFeatures(
            selectedPlayer,
            comparisonPlayer,
            stats,
            profile
          )
        : [],
    [selectedPlayer, comparisonPlayer, stats, profile]
  );

  const drivers = useMemo(
    () =>
      [...featureRows]
        .filter((row) => row.contribution > 0)
        .sort((a, b) => b.contribution - a.contribution)
        .slice(0, 4),
    [featureRows]
  );

  const differences = useMemo(
    () =>
      [...featureRows]
        .sort((a, b) => b.weightedGap - a.weightedGap)
        .slice(0, 3),
    [featureRows]
  );

  const selectedRole = useMemo(
    () => (selectedPlayer ? archetype(players, selectedPlayer) : null),
    [players, selectedPlayer]
  );

  const comparisonRole = useMemo(
    () => (comparisonPlayer ? archetype(players, comparisonPlayer) : null),
    [players, comparisonPlayer]
  );

  const summary = useMemo(
    () =>
      selectedPlayer && comparisonPlayer
        ? analystSummary(
            selectedPlayer,
            comparisonPlayer,
            comparisonPlayer.similarity ?? 0,
            categories,
            profile,
            drivers
          )
        : null,
    [selectedPlayer, comparisonPlayer, categories, profile, drivers]
  );

  function selectPrimary(player) {
    setSelectedId(player.id);
    setComparisonId(null);
  }

  function selectComparison(player) {
    setComparisonId(player.id);
  }

  function swapPlayers() {
    if (!selectedPlayer || !comparisonPlayer) return;
    const previous = selectedPlayer.id;
    setSelectedId(comparisonPlayer.id);
    setComparisonId(previous);
  }

  if (loadError) {
    return (
      <div className="loading-screen">
        <strong>PlayerMatch could not start.</strong>
        <span>{loadError}</span>
      </div>
    );
  }

  if (!selectedPlayer || !comparisonPlayer || !selectedRole || !comparisonRole) {
    return (
      <div className="loading-screen">
        <strong>Loading PlayerMatch…</strong>
      </div>
    );
  }

  return (
    <div className="app-shell">
      <Header
        season={dataset.meta?.season}
        onOpenMethodology={() => setShowMethodology(true)}
      />

      <main className="workspace">
        <MatchupStage
          players={players}
          selectedPlayer={selectedPlayer}
          comparisonPlayer={comparisonPlayer}
          selectedRole={selectedRole}
          comparisonRole={comparisonRole}
          profile={profile}
          onSelectPrimary={selectPrimary}
          onSelectComparison={selectComparison}
          onSwap={swapPlayers}
        />

        <ProfileSelector
          profile={profile}
          onChange={setProfile}
        />

        <AnalystReadout
          summary={summary}
          leftName={selectedPlayer.name}
          rightName={comparisonPlayer.name}
        />

        <div className="analysis-grid" id="analysis">
          <StatBattle
            players={players}
            left={selectedPlayer}
            right={comparisonPlayer}
          />

          <aside className="model-analysis">
            <CategoryEdge categories={categories} />

            <SimilarityDrivers drivers={drivers} />

            <DifferencePanel
              differences={differences}
              left={selectedPlayer}
              right={comparisonPlayer}
            />

            <ModelDetails
              playerCount={players.length}
              profile={profile}
              season={dataset.meta?.season}
            />
          </aside>
        </div>

        <MatchPool
          selectedPlayer={selectedPlayer}
          comparisonPlayer={comparisonPlayer}
          matches={matches}
          onSelect={selectComparison}
        />
      </main>

      <MethodologyModal
        open={showMethodology}
        onClose={() => setShowMethodology(false)}
      />
    </div>
  );
}
