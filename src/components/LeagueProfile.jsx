import { CircleHelp } from "lucide-react";
import { leagueBand } from "../model/humanInsights";

function positionFor(z) {
  const clamped = Math.max(-3, Math.min(3, z));
  return `${((clamped + 3) / 6) * 100}%`;
}

export default function LeagueProfile({
  rows,
  left,
  right,
  summary,
}) {
  return (
    <section className="v3-card league-profile-card">
      <div className="v3-card-title league-profile-title">
        <div>
          <span>LEAGUE PROFILE</span>
          <h3>How each player compares to the NBA</h3>
          <p>
            Center means roughly league average. Moving right means stronger
            production in this stat; moving left means lower production.
          </p>
        </div>

        <details className="profile-help">
          <summary>
            <CircleHelp size={16} aria-hidden="true" />
            How is this calculated?
          </summary>
          <div>
            PlayerMatch standardizes each stat against the eligible player pool.
            Analysts call this a z-score. The chart keeps the technical math in
            the background and shows the result in plain language.
          </div>
        </details>
      </div>

      <div className="friendly-scale" aria-hidden="true">
        <span>Far below</span>
        <span>Below</span>
        <strong>League average</strong>
        <span>Above</span>
        <span>Far above</span>
      </div>

      <div className="friendly-profile-rows">
        {rows.map((row) => {
          const leftBand = leagueBand(row.leftZ);
          const rightBand = leagueBand(row.rightZ);

          return (
            <div className="friendly-profile-row" key={row.key}>
              <div className="friendly-feature">
                <strong>{row.label}</strong>
                <span>{row.longLabel}</span>
              </div>

              <div className="friendly-read friendly-read--left">
                <strong>{leftBand.short}</strong>
                <span>{left[row.key]}{row.percentage ? "%" : ""}</span>
              </div>

              <div
                className="friendly-track"
                aria-label={`${row.longLabel}. ${left.name}: ${leftBand.label}. ${right.name}: ${rightBand.label}.`}
              >
                <i />
                <span className="friendly-grid friendly-grid--1" />
                <span className="friendly-grid friendly-grid--2" />
                <span className="friendly-grid friendly-grid--3" />
                <span className="friendly-grid friendly-grid--4" />
                <span
                  className="friendly-marker friendly-marker--left"
                  style={{ left: positionFor(row.leftZ) }}
                />
                <span
                  className="friendly-marker friendly-marker--right"
                  style={{ left: positionFor(row.rightZ) }}
                />
              </div>

              <div className="friendly-read friendly-read--right">
                <strong>{rightBand.short}</strong>
                <span>{right[row.key]}{row.percentage ? "%" : ""}</span>
              </div>
            </div>
          );
        })}
      </div>

      <div className="friendly-legend">
        <span><i className="friendly-dot friendly-dot--blue" />{left.name}</span>
        <span><i className="friendly-dot friendly-dot--orange" />{right.name}</span>
      </div>

      {summary && (
        <div className="friendly-summary-strip">
          <p><strong>Read:</strong> {summary.headline}</p>
          <p><strong>Key difference:</strong> {summary.difference}</p>
          <p><strong>Closest area:</strong> {summary.similarity}</p>
        </div>
      )}
    </section>
  );
}
