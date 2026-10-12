import {
  DifferencePanel,
  MatchStability,
  SimilarityDrivers,
  StatBattle,
} from "./AnalysisPanels";
import CompactMatches from "./CompactMatches";
import MatchContext from "./MatchContext";

export default function AnalysisView({
  model,
  statBasisLabel,
  onEditMatchup,
}) {
  return (
    <section className="v3-view analysis-view">
      <MatchContext
        left={model.selectedPlayer}
        right={model.comparisonPlayer}
        similarity={model.comparisonPlayer.similarity ?? 0}
        profile={model.profile}
        statBasisLabel={statBasisLabel}
        onSwap={model.swapPlayers}
        onEditMatchup={onEditMatchup}
      />

      <div className="analysis-view-grid">
        <StatBattle
          players={model.players}
          left={model.selectedPlayer}
          right={model.comparisonPlayer}
        />

        <aside className="analysis-view-rail">
          <CompactMatches
            matches={model.matches}
            comparisonPlayer={model.comparisonPlayer}
            onSelect={model.selectComparison}
            limit={3}
          />

          <SimilarityDrivers drivers={model.drivers} />

          <DifferencePanel
            differences={model.differences}
            left={model.selectedPlayer}
            right={model.comparisonPlayer}
          />

          <MatchStability stability={model.stability} />
        </aside>
      </div>
    </section>
  );
}
