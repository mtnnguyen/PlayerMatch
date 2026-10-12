import MatchContext from "./MatchContext";
import LeagueProfile from "./LeagueProfile";
import { Lightbulb, AlertTriangle, CheckCircle2 } from "lucide-react";

export default function VisualsView({
  model,
  statBasisLabel,
  onEditMatchup,
}) {
  const summary = model.friendlyProfileSummary;

  return (
    <section className="v3-view visuals-view">
      <MatchContext
        left={model.selectedPlayer}
        right={model.comparisonPlayer}
        similarity={model.comparisonPlayer.similarity ?? 0}
        profile={model.profile}
        statBasisLabel={statBasisLabel}
        onSwap={model.swapPlayers}
        onEditMatchup={onEditMatchup}
      />

      <div className="visuals-view-grid">
        <LeagueProfile
          rows={model.zScoreProfile}
          left={model.selectedPlayer}
          right={model.comparisonPlayer}
          summary={summary}
        />

        <aside className="human-read-card v3-card">
          <div className="v3-card-title">
            <div>
              <span>PLAIN-LANGUAGE READ</span>
              <h3>What should I take from this?</h3>
            </div>
            <Lightbulb size={19} aria-hidden="true" />
          </div>

          <article>
            <span>Overall</span>
            <p>{summary?.headline}</p>
          </article>

          <article>
            <span>Most important difference</span>
            <p>{summary?.difference}</p>
          </article>

          <article>
            <span>Where they look alike</span>
            <p>{summary?.similarity}</p>
          </article>

          <article className="human-read-decision">
            <CheckCircle2 size={17} aria-hidden="true" />
            <div>
              <span>How to use this</span>
              <p>
                Use this view to understand the shape of each player's current
                profile, not to decide who is universally better.
              </p>
            </div>
          </article>

          <article className="human-read-warning">
            <AlertTriangle size={17} aria-hidden="true" />
            <div>
              <span>Do not overread it</span>
              <p>{summary?.caveat}</p>
            </div>
          </article>
        </aside>
      </div>
    </section>
  );
}
