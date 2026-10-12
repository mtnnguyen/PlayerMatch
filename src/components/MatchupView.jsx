import MatchupStage from "./MatchupStage";
import CompactMatches from "./CompactMatches";
import DecisionBrief from "./DecisionBrief";

export default function MatchupView({ model }) {
  return (
    <section className="v3-view matchup-view">
      <MatchupStage
        allPlayers={model.players}
        comparisonPool={model.comparisonPool}
        selectedPlayer={model.selectedPlayer}
        comparisonPlayer={model.comparisonPlayer}
        selectedRole={model.selectedRole}
        comparisonRole={model.comparisonRole}
        profile={model.profile}
        statBasis={model.statBasis}
        onSelectPrimary={model.selectPrimary}
        onSelectComparison={model.selectComparison}
        onSwap={model.swapPlayers}
      />

      <div className="matchup-view-bottom">
        <DecisionBrief brief={model.decisionBrief} />

        <CompactMatches
          matches={model.matches}
          comparisonPlayer={model.comparisonPlayer}
          onSelect={model.selectComparison}
          limit={4}
        />
      </div>
    </section>
  );
}
