import { useState } from "react";

import AnalysisView from "./components/AnalysisView";
import Header from "./components/Header";
import MatchupView from "./components/MatchupView";
import MethodologyModal from "./components/MethodologyModal";
import ModelView from "./components/ModelView";
import OutlookView from "./components/OutlookView";
import TrendsView from "./components/TrendsView";
import VisualsView from "./components/VisualsView";

import { STAT_BASES } from "./config/viewConfig";
import usePlayerMatch from "./hooks/usePlayerMatch";

export default function App() {
  const [activeView, setActiveView] = useState("matchup");
  const [showMethodology, setShowMethodology] = useState(false);

  const model = usePlayerMatch();

  if (model.loadError) {
    return (
      <div className="loading-screen">
        <strong>PlayerMatch could not start.</strong>
        <span>{model.loadError}</span>
      </div>
    );
  }

  if (
    !model.selectedPlayer ||
    !model.comparisonPlayer ||
    !model.selectedRole ||
    !model.comparisonRole
  ) {
    return (
      <div className="loading-screen">
        <strong>Loading PlayerMatch…</strong>
      </div>
    );
  }

  const statBasisLabel = STAT_BASES[model.statBasis].label;

  return (
    <div className="app-shell v3-shell">
      <Header
        season={model.dataset.meta?.season}
        activeView={activeView}
        onViewChange={setActiveView}
        profile={model.profile}
        statBasisLabel={statBasisLabel}
        onOpenMethodology={() => setShowMethodology(true)}
      />

      <main className="v3-stage" id="main-content" tabIndex="-1">
        {activeView === "matchup" && (
          <MatchupView model={model} />
        )}

        {activeView === "analysis" && (
          <AnalysisView
            model={model}
            statBasisLabel={statBasisLabel}
            onEditMatchup={() => setActiveView("matchup")}
          />
        )}

        {activeView === "visuals" && (
          <VisualsView
            model={model}
            statBasisLabel={statBasisLabel}
            onEditMatchup={() => setActiveView("matchup")}
          />
        )}

        {activeView === "trends" && (
          <TrendsView
            model={model}
            statBasisLabel={statBasisLabel}
            onEditMatchup={() => setActiveView("matchup")}
          />
        )}

        {activeView === "outlook" && (
          <OutlookView
            model={model}
            statBasisLabel={statBasisLabel}
            onEditMatchup={() => setActiveView("matchup")}
          />
        )}

        {activeView === "model" && (
          <ModelView
            model={model}
            statBasisLabel={statBasisLabel}
            onEditMatchup={() => setActiveView("matchup")}
          />
        )}
      </main>

      <MethodologyModal
        open={showMethodology}
        onClose={() => setShowMethodology(false)}
      />
    </div>
  );
}
