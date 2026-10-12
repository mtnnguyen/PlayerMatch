import {
  buildDriverSummary,
} from "../model/visualAnalytics";

export default function MatchDriversChart({
  featureRows,
  left,
  right,
  profile,
}) {
  const rows =
    [...featureRows]
      .sort(
        (a, b) =>
          b.contributionShare -
          a.contributionShare
      );

  const summary =
    buildDriverSummary(
      featureRows,
      left,
      right
    );

  const max =
    Math.max(
      1,
      ...rows.map(
        (row) =>
          row.contributionShare
      )
    );

  return (
    <div className="visual-analytics-grid">
      <section className="v3-card analytics-chart-card">
        <div className="v3-card-title analytics-chart-title">
          <div>
            <span>MODEL EXPLAINABILITY</span>
            <h3>
              What is pulling these players together?
            </h3>
            <p>
              Bars show each feature's share of the positive similarity evidence under the {profile} model.
            </p>
          </div>

          <div className="driver-model-chip">
            {profile} profile
          </div>
        </div>

        <div className="driver-chart">
          {rows.map(
            (row, index) => (
              <div
                className="driver-chart-row"
                key={row.key}
              >
                <span className="driver-chart-rank">
                  {String(
                    index + 1
                  ).padStart(
                    2,
                    "0"
                  )}
                </span>

                <div className="driver-chart-label">
                  <strong>
                    {row.label}
                  </strong>
                  <span>
                    {row.longLabel}
                  </span>
                </div>

                <div className="driver-chart-track">
                  <i
                    style={{
                      width: `${
                        (row.contributionShare /
                          max) *
                        100
                      }%`,
                    }}
                  />
                </div>

                <strong className="driver-chart-value">
                  {row.contributionShare.toFixed(
                    0
                  )}
                  %
                </strong>
              </div>
            )
          )}
        </div>

        <div className="driver-chart-footer">
          Higher bars mean that feature provides more of the model's positive evidence for the match.
        </div>
      </section>

      <aside className="v3-card visual-insight-card">
        <div className="v3-card-title">
          <div>
            <span>ANALYST READ</span>
            <h3>
              Why did the model return this match?
            </h3>
          </div>
        </div>

        <article>
          <span>Main story</span>
          <p>{summary.headline}</p>
        </article>

        <article>
          <span>
            Concentration
          </span>
          <p>
            {summary.concentration}
          </p>
        </article>

        <article>
          <span>
            Strongest signal
          </span>
          <p>{summary.takeaway}</p>
        </article>

        <article className="visual-insight-decision">
          <span>
            How to use this
          </span>
          <p>
            If the result surprises you, check whether the top drivers make basketball sense for the question you are asking. You can then test a different profile in the Model tab.
          </p>
        </article>

        <article className="visual-insight-caution">
          <span>
            Do not overread it
          </span>
          <p>{summary.caveat}</p>
        </article>
      </aside>
    </div>
  );
}
