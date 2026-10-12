import { Info } from "lucide-react";

function positionFor(z) {
  return `${((z + 3) / 6) * 100}%`;
}

function zLabel(value) {
  const rounded = value.toFixed(2);

  return value > 0
    ? `+${rounded}`
    : rounded;
}

export default function ZScoreProfile({
  rows,
  left,
  right,
  statBasisLabel,
}) {
  return (
    <section
      className="visual-card zscore-card"
      aria-labelledby="zscore-title"
    >
      <div className="visual-card-heading">
        <div>
          <span>STANDARDIZED PROFILE</span>

          <h2 id="zscore-title">
            Z-score comparison
          </h2>

          <p>
            How far each player sits above or below the
            league average for every model feature.
          </p>
        </div>

        <div className="visual-heading-meta">
          <span>{statBasisLabel}</span>
          <span>League mean = 0</span>
        </div>
      </div>

      <div className="zscore-legend">
        <span className="legend-player legend-player--left">
          <i />
          {left.name}
        </span>

        <span className="legend-player legend-player--right">
          <i />
          {right.name}
        </span>

        <span className="zscore-help">
          <Info size={16} aria-hidden="true" />
          +1 means one standard deviation above the
          league mean.
        </span>
      </div>

      <div className="zscore-axis" aria-hidden="true">
        <span />

        <span />

        <div className="zscore-axis-track">
          <span>-3</span>
          <span>-2</span>
          <span>-1</span>
          <strong>0</strong>
          <span>+1</span>
          <span>+2</span>
          <span>+3</span>
        </div>

        <span />
      </div>

      <div className="zscore-table">
        {rows.map((row) => (
          <div
            className="zscore-row"
            key={row.key}
            aria-label={`${row.longLabel}. ${left.name}: z score ${zLabel(
              row.leftZ
            )}. ${right.name}: z score ${zLabel(
              row.rightZ
            )}.`}
          >
            <div className="zscore-feature">
              <strong>{row.label}</strong>
              <span>{row.longLabel}</span>
            </div>

            <strong className="zscore-number zscore-number--left">
              {zLabel(row.leftZ)}
            </strong>

            <div
              className="zscore-track"
              aria-hidden="true"
            >
              <span className="zscore-grid zscore-grid--1" />
              <span className="zscore-grid zscore-grid--2" />
              <span className="zscore-grid zscore-grid--3" />
              <span className="zscore-grid zscore-grid--4" />
              <span className="zscore-grid zscore-grid--5" />

              <i className="zscore-zero" />

              <span
                className="zscore-dot zscore-dot--left"
                style={{
                  left: positionFor(row.leftPlot),
                }}
              />

              <span
                className="zscore-dot zscore-dot--right"
                style={{
                  left: positionFor(row.rightPlot),
                }}
              />
            </div>

            <strong className="zscore-number zscore-number--right">
              {zLabel(row.rightZ)}
            </strong>
          </div>
        ))}
      </div>

      <div className="zscore-reading-guide">
        <strong>How to read this</strong>

        <p>
          Values near 0 are close to the league average.
          Positive z-scores are above average; negative
          z-scores are below average. Values beyond ±2 are
          relatively unusual in this player pool.
        </p>
      </div>
    </section>
  );
}
