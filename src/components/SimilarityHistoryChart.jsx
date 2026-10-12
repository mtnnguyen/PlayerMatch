const WIDTH = 760;
const HEIGHT = 410;

const PADDING = {
  left: 58,
  right: 28,
  top: 28,
  bottom: 54,
};

function xScale(index, count) {
  if (count <= 1) {
    return WIDTH / 2;
  }

  return (
    PADDING.left +
    (index /
      (count - 1)) *
      (WIDTH -
        PADDING.left -
        PADDING.right)
  );
}

function yScale(value) {
  return (
    HEIGHT -
    PADDING.bottom -
    (value / 100) *
      (HEIGHT -
        PADDING.top -
        PADDING.bottom)
  );
}

export default function SimilarityHistoryChart({
  rows,
  left,
  right,
}) {
  const path =
    rows
      .map(
        (row, index) =>
          `${index === 0 ? "M" : "L"} ${xScale(
            index,
            rows.length
          )} ${yScale(
            row.score
          )}`
      )
      .join(" ");

  return (
    <section className="v3-card historical-chart-card">
      <div className="v3-card-title historical-chart-title">
        <div>
          <span>SIMILARITY OVER TIME</span>
          <h3>
            Did these players become more or less alike?
          </h3>
          <p>
            Each season is re-standardized against that season's eligible league before calculating the pair similarity.
          </p>
        </div>
      </div>

      <div className="historical-chart-wrap">
        <svg
          className="historical-line-chart"
          viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
          role="img"
          aria-label={`Historical PlayerMatch similarity between ${left.name} and ${right.name}`}
        >
          {[0, 25, 50, 75, 100].map(
            (value) => {
              const y =
                yScale(value);

              return (
                <g key={value}>
                  <line
                    x1={PADDING.left}
                    x2={
                      WIDTH -
                      PADDING.right
                    }
                    y1={y}
                    y2={y}
                    className="historical-grid-line"
                  />

                  <text
                    x={
                      PADDING.left -
                      10
                    }
                    y={y + 3}
                    textAnchor="end"
                    className="historical-axis-tick"
                  >
                    {value}%
                  </text>
                </g>
              );
            }
          )}

          {rows.map(
            (row, index) => {
              const x =
                xScale(
                  index,
                  rows.length
                );

              return (
                <g key={row.season}>
                  <line
                    x1={x}
                    x2={x}
                    y1={PADDING.top}
                    y2={
                      HEIGHT -
                      PADDING.bottom
                    }
                    className="historical-season-line"
                  />

                  <text
                    x={x}
                    y={
                      HEIGHT - 24
                    }
                    textAnchor="middle"
                    className="historical-axis-tick"
                  >
                    {row.season}
                  </text>
                </g>
              );
            }
          )}

          {path && (
            <path
              d={path}
              className="historical-similarity-series"
            />
          )}

          {rows.map(
            (row, index) => (
              <g key={`point-${row.season}`}>
                <circle
                  cx={xScale(
                    index,
                    rows.length
                  )}
                  cy={yScale(
                    row.score
                  )}
                  r="5"
                  className="historical-similarity-point"
                >
                  <title>
                    {row.season}:{" "}
                    {row.score.toFixed(
                      1
                    )}
                    % similarity
                  </title>
                </circle>

                <text
                  x={xScale(
                    index,
                    rows.length
                  )}
                  y={
                    yScale(
                      row.score
                    ) - 12
                  }
                  textAnchor="middle"
                  className="historical-score-label"
                >
                  {row.score.toFixed(
                    0
                  )}
                  %
                </text>
              </g>
            )
          )}
        </svg>

        <div className="historical-legend historical-legend--single">
          <span>
            Current model weights are applied separately within each historical season.
          </span>
        </div>
      </div>
    </section>
  );
}
