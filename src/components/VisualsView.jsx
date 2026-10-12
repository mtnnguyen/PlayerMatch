import {
  useState,
} from "react";

import {
  AlertTriangle,
  CheckCircle2,
  Lightbulb,
} from "lucide-react";

import ArchetypeMap from "./ArchetypeMap";
import DistributionChart from "./DistributionChart";
import LeagueProfile from "./LeagueProfile";
import MatchContext from "./MatchContext";
import MatchDriversChart from "./MatchDriversChart";
import PlayerStyleMap from "./PlayerStyleMap";
import ScatterPlot from "./ScatterPlot";
import VisualSwitcher from "./VisualSwitcher";

export default function VisualsView({
  model,
  statBasisLabel,
  onEditMatchup,
}) {
  const [
    activeVisual,
    setActiveVisual,
  ] = useState("profile");

  const summary =
    model.friendlyProfileSummary;

  return (
    <section className="v3-view visuals-view visuals-view--expanded">
      <MatchContext
        left={model.selectedPlayer}
        right={model.comparisonPlayer}
        similarity={
          model.comparisonPlayer
            .similarity ?? 0
        }
        profile={model.profile}
        statBasisLabel={
          statBasisLabel
        }
        onSwap={
          model.swapPlayers
        }
        onEditMatchup={
          onEditMatchup
        }
      />

      <VisualSwitcher
        activeView={
          activeVisual
        }
        onChange={
          setActiveVisual
        }
      />

      <div className="visual-workspace">
        {activeVisual ===
          "profile" && (
          <div className="visuals-view-grid">
            <LeagueProfile
              rows={
                model.zScoreProfile
              }
              left={
                model.selectedPlayer
              }
              right={
                model.comparisonPlayer
              }
              summary={
                summary
              }
            />

            <aside className="human-read-card v3-card">
              <div className="v3-card-title">
                <div>
                  <span>
                    PLAIN-LANGUAGE READ
                  </span>
                  <h3>
                    What should I take from this?
                  </h3>
                </div>

                <Lightbulb
                  size={19}
                  aria-hidden="true"
                />
              </div>

              <article>
                <span>Overall</span>
                <p>
                  {summary?.headline}
                </p>
              </article>

              <article>
                <span>
                  Most important difference
                </span>
                <p>
                  {summary?.difference}
                </p>
              </article>

              <article>
                <span>
                  Where they look alike
                </span>
                <p>
                  {summary?.similarity}
                </p>
              </article>

              <article className="human-read-decision">
                <CheckCircle2
                  size={17}
                  aria-hidden="true"
                />

                <div>
                  <span>
                    How to use this
                  </span>
                  <p>
                    Use this view to understand the shape of each player's current profile, not to decide who is universally better.
                  </p>
                </div>
              </article>

              <article className="human-read-warning">
                <AlertTriangle
                  size={17}
                  aria-hidden="true"
                />

                <div>
                  <span>
                    Do not overread it
                  </span>
                  <p>
                    {summary?.caveat}
                  </p>
                </div>
              </article>
            </aside>
          </div>
        )}

        {activeVisual ===
          "scatter" && (
          <ScatterPlot
            players={
              model.players
            }
            left={
              model.selectedPlayer
            }
            right={
              model.comparisonPlayer
            }
            onSelectComparison={
              model.selectComparison
            }
          />
        )}

        {activeVisual ===
          "distribution" && (
          <DistributionChart
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
        )}

        {activeVisual ===
          "drivers" && (
          <MatchDriversChart
            featureRows={
              model.featureRows
            }
            left={
              model.selectedPlayer
            }
            right={
              model.comparisonPlayer
            }
            profile={
              model.profile
            }
          />
        )}

        {activeVisual ===
          "styleMap" && (
          <PlayerStyleMap
            players={
              model.players
            }
            left={
              model.selectedPlayer
            }
            right={
              model.comparisonPlayer
            }
            weights={
              model.effectiveWeights
            }
            profile={
              model.profile
            }
            onSelectComparison={
              model.selectComparison
            }
          />
        )}

        {activeVisual ===
          "archetypes" && (
          <ArchetypeMap
            players={
              model.players
            }
            left={
              model.selectedPlayer
            }
            right={
              model.comparisonPlayer
            }
            weights={
              model.effectiveWeights
            }
            profile={
              model.profile
            }
            onSelectComparison={
              model.selectComparison
            }
          />
        )}
      </div>
    </section>
  );
}
