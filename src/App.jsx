import { useState } from "react";

import {
  CategoryEdge,
  DifferencePanel,
  MatchStability,
  ModelDetails,
  SimilarityDrivers,
  StatBattle,
} from "./components/AnalysisPanels";

import AnalystReadout from "./components/AnalystReadout";
import ClosestMatches from "./components/ClosestMatches";
import CustomWeights from "./components/CustomWeights";
import Header from "./components/Header";
import MatchupStage from "./components/MatchupStage";
import MethodologyModal from "./components/MethodologyModal";
import ModelControls from "./components/ModelControls";
import usePlayerMatch from "./hooks/usePlayerMatch";

export default function App() {
  const [
    showMethodology,
    setShowMethodology,
  ] = useState(false);

  const model = usePlayerMatch();

  if (model.loadError) {
    return (
      <div className="loading-screen">
        <strong>
          PlayerMatch could not start.
        </strong>
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
        <strong>
          Loading PlayerMatch…
        </strong>
      </div>
    );
  }

  return (
    <div className="app-shell">
      <Header
        season={
          model.dataset.meta
            ?.season
        }
        onOpenMethodology={() =>
          setShowMethodology(
            true
          )
        }
      />

      <main
        className="workspace"
        id="main-content"
        tabIndex="-1"
      >
        <MatchupStage
          allPlayers={
            model.players
          }
          comparisonPool={
            model.comparisonPool
          }
          selectedPlayer={
            model.selectedPlayer
          }
          comparisonPlayer={
            model.comparisonPlayer
          }
          selectedRole={
            model.selectedRole
          }
          comparisonRole={
            model.comparisonRole
          }
          profile={
            model.profile
          }
          statBasis={
            model.statBasis
          }
          onSelectPrimary={
            model.selectPrimary
          }
          onSelectComparison={
            model.selectComparison
          }
          onSwap={
            model.swapPlayers
          }
        />

        <ModelControls
          profile={model.profile}
          statBasis={model.statBasis}
          poolFilter={
            model.poolFilter
          }
          onProfileChange={
            model.setProfile
          }
          onStatBasisChange={
            model.setStatBasis
          }
          onPoolFilterChange={
            model.changePoolFilter
          }
          supportsAdvancedBases={
            model.supportsAdvancedBases
          }
          supportsPositions={
            model.supportsPositions
          }
        />

        {model.profile ===
          "Custom" && (
          <CustomWeights
            weights={
              model.customWeights
            }
            onChange={
              model.changeCustomWeight
            }
            onReset={
              model.resetCustomWeights
            }
          />
        )}

        <AnalystReadout
          summary={model.summary}
          leftName={
            model.selectedPlayer.name
          }
          rightName={
            model.comparisonPlayer.name
          }
        />

        <div
          className="analysis-grid"
          id="analysis"
        >
          <StatBattle
            players={
              model.players
            }
            left={
              model.selectedPlayer
            }
            right={
              model.comparisonPlayer
            }
          />

          <aside
            className="model-analysis"
            aria-label="Comparison analysis"
          >
            <ClosestMatches
              matches={
                model.matches
              }
              comparisonPlayer={
                model.comparisonPlayer
              }
              onSelect={
                model.selectComparison
              }
            />

            <SimilarityDrivers
              drivers={
                model.drivers
              }
            />

            <DifferencePanel
              differences={
                model.differences
              }
              left={
                model.selectedPlayer
              }
              right={
                model.comparisonPlayer
              }
            />

            <MatchStability
              stability={
                model.stability
              }
            />

            <CategoryEdge
              categories={
                model.categories
              }
            />

            <ModelDetails
              playerCount={
                model.players.length
              }
              candidateCount={
                model.matches.length
              }
              profile={
                model.profile
              }
              statBasis={
                model.statBasis
              }
              poolFilter={
                model.poolFilter
              }
              season={
                model.dataset.meta
                  ?.season
              }
              weights={
                model.effectiveWeights
              }
            />
          </aside>
        </div>
      </main>

      <MethodologyModal
        open={
          showMethodology
        }
        onClose={() =>
          setShowMethodology(
            false
          )
        }
      />
    </div>
  );
}
