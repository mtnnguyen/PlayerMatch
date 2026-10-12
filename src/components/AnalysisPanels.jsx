import { Activity, BarChart3, Database, Gauge } from "lucide-react";
import { FEATURES, PROFILES } from "../config/modelConfig";
import { percentile } from "../model/similarity";

const display = (feature, value) => {
  const n = Number(value ?? 0);
  const text = Number.isInteger(n) ? `${n}` : n.toFixed(1);
  return feature.percentage ? `${text}%` : text;
};

export function StatBattle({ players, left, right }) {
  return (
    <section className="stat-battle-panel">
      <div className="analysis-heading">
        <div><span>HEAD-TO-HEAD</span><h2>Statistical battle</h2></div>
        <div className="analysis-player-labels">
          <strong>{left.name}</strong><i /><strong>{right.name}</strong>
        </div>
      </div>

      <div className="battle-table">
        {FEATURES.map((feature) => {
          const lv = Number(left[feature.key] ?? 0);
          const rv = Number(right[feature.key] ?? 0);
          const lp = percentile(players, feature.key, lv);
          const rp = percentile(players, feature.key, rv);

          return (
            <div className="battle-row" key={feature.key}>
              <div className="battle-value">
                <strong className={lv > rv ? "stat-winner" : ""}>{display(feature, lv)}</strong>
                <span>{lp}th pct</span>
              </div>

              <div className="battle-middle">
                <div className="battle-label">
                  <strong>{feature.label}</strong>
                  <span>{feature.longLabel}</span>
                </div>
                <div className="battle-bars">
                  <div className="battle-half battle-half--left"><span style={{ width: `${lp}%` }} /></div>
                  <i />
                  <div className="battle-half battle-half--right"><span style={{ width: `${rp}%` }} /></div>
                </div>
              </div>

              <div className="battle-value battle-value--right">
                <strong className={rv > lv ? "stat-winner stat-winner--right" : ""}>{display(feature, rv)}</strong>
                <span>{rp}th pct</span>
              </div>
            </div>
          );
        })}
      </div>

      <div className="percentile-key">
        <span>Bars show league percentile, not raw value.</span>
        <span>Higher percentile →</span>
      </div>
    </section>
  );
}

export function CategoryEdge({ categories }) {
  return (
    <section className="analysis-card">
      <div className="analysis-card-title">
        <div><span>LEAGUE PERCENTILES</span><h3>Category edge</h3></div>
        <BarChart3 size={18} />
      </div>

      <div className="category-list">
        {categories.map((c) => (
          <div className="category-row" key={c.name}>
            <strong className={c.left > c.right ? "edge-left" : ""}>{c.left}</strong>
            <div>
              <span>{c.name}</span>
              <div className="category-track">
                <i />
                <span className="category-left" style={{ width: `${c.left}%` }} />
                <span className="category-right" style={{ width: `${c.right}%` }} />
              </div>
            </div>
            <strong className={c.right > c.left ? "edge-right" : ""}>{c.right}</strong>
          </div>
        ))}
      </div>
    </section>
  );
}

export function SimilarityDrivers({ drivers }) {
  return (
    <section className="analysis-card">
      <div className="analysis-card-title">
        <div><span>MODEL CONTRIBUTION</span><h3>Why they match</h3></div>
        <Gauge size={18} />
      </div>

      <div className="driver-list">
        {drivers.map((d, i) => (
          <div className="driver-row" key={d.key}>
            <span className="driver-rank">{String(i + 1).padStart(2, "0")}</span>
            <div><strong>{d.longLabel}</strong><small>Positive cosine contribution</small></div>
            <span className="driver-score">{d.contributionShare.toFixed(0)}%</span>
          </div>
        ))}
      </div>
    </section>
  );
}

export function DifferencePanel({ differences, left, right }) {
  return (
    <section className="analysis-card">
      <div className="analysis-card-title">
        <div><span>SEPARATION</span><h3>Biggest differences</h3></div>
        <Activity size={18} />
      </div>

      <div className="difference-list">
        {differences.map((d) => (
          <div key={d.key}>
            <span>{d.longLabel}</span>
            <strong>{display(d, left[d.key])} ↔ {display(d, right[d.key])}</strong>
          </div>
        ))}
      </div>
    </section>
  );
}

export function ModelDetails({ playerCount, profile, season }) {
  const weights = PROFILES[profile].weights;

  return (
    <section className="analysis-card">
      <div className="analysis-card-title">
        <div><span>MODEL DETAILS</span><h3>Current configuration</h3></div>
        <Database size={18} />
      </div>

      <dl className="model-detail-grid">
        <div><dt>Algorithm</dt><dd>Weighted cosine</dd></div>
        <div><dt>Player pool</dt><dd>{playerCount}</dd></div>
        <div><dt>Features</dt><dd>{FEATURES.length}</dd></div>
        <div><dt>Standardization</dt><dd>Z-score</dd></div>
        <div><dt>Profile</dt><dd>{profile}</dd></div>
        <div><dt>Season</dt><dd>{season ?? "—"}</dd></div>
      </dl>

      <details className="weight-drawer">
        <summary>Feature weights</summary>
        <div>
          {FEATURES.map((f) => (
            <span key={f.key}><strong>{f.label}</strong>{weights[f.key].toFixed(2)}</span>
          ))}
        </div>
      </details>
    </section>
  );
}
