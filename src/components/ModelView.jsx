import CustomWeights from "./CustomWeights";
import MatchContext from "./MatchContext";
import ModelControls from "./ModelControls";

export default function ModelView({
  model,
  statBasisLabel,
  onEditMatchup,
}) {
  return (
    <section className="v3-view model-view">
      <MatchContext
        left={model.selectedPlayer}
        right={model.comparisonPlayer}
        similarity={model.comparisonPlayer.similarity ?? 0}
        profile={model.profile}
        statBasisLabel={statBasisLabel}
        onSwap={model.swapPlayers}
        onEditMatchup={onEditMatchup}
      />

      <div className="model-view-grid">
        <section className="v3-card model-controls-card">
          <div className="v3-card-title">
            <div>
              <span>MODEL SETTINGS</span>
              <h3>Change what “similar” means</h3>
            </div>
          </div>

          <ModelControls
            profile={model.profile}
            statBasis={model.statBasis}
            poolFilter={model.poolFilter}
            onProfileChange={model.setProfile}
            onStatBasisChange={model.setStatBasis}
            onPoolFilterChange={model.changePoolFilter}
            supportsAdvancedBases={model.supportsAdvancedBases}
            supportsPositions={model.supportsPositions}
          />

          {model.profile === "Custom" && (
            <CustomWeights
              weights={model.customWeights}
              onChange={model.changeCustomWeight}
              onReset={model.resetCustomWeights}
            />
          )}
        </section>

        <aside className="v3-card model-guide-card">
          <div className="v3-card-title">
            <div>
              <span>MODEL GUIDE</span>
              <h3>Which setting should I use?</h3>
            </div>
          </div>

          <div className="model-guide-list">
            <article>
              <strong>Balanced</strong>
              <p>Best default. Looks at the overall statistical profile.</p>
            </article>
            <article>
              <strong>Scoring / Playmaking / Defense</strong>
              <p>Use these when your question is specifically about one type of role.</p>
            </article>
            <article>
              <strong>Per Game</strong>
              <p>Shows what the player actually produces in the box score.</p>
            </article>
            <article>
              <strong>Per 36 / Per 100</strong>
              <p>Helps separate production from minutes and pace.</p>
            </article>
            <article>
              <strong>Custom</strong>
              <p>Use when you want to define your own version of similarity.</p>
            </article>
          </div>

          <div className="model-guide-warning">
            This model compares current statistical profiles. It is not a future
            projection model yet.
          </div>
        </aside>
      </div>
    </section>
  );
}
