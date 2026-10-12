import {
  BarChart3,
  CircleHelp,
  FlaskConical,
  Gauge,
  SlidersHorizontal,
  Sparkles,
  Swords,
  TrendingUp,
} from "lucide-react";

const VIEWS = [
  ["matchup", "Matchup", Swords],
  ["analysis", "Analysis", BarChart3],
  ["visuals", "Visuals", Gauge],
  ["trends", "Trends", TrendingUp],
  ["outlook", "Outlook", Sparkles],
  ["model", "Model", SlidersHorizontal],
];

export default function Header({
  season,
  activeView,
  onViewChange,
  profile,
  statBasisLabel,
  onOpenMethodology,
}) {
  return (
    <>
      <a className="skip-link" href="#main-content">
        Skip to main content
      </a>

      <header className="workbench-header v3-header">
        <div className="workbench-brand">
          <div className="brand-mark" aria-hidden="true">
            PM
          </div>

          <div>
            <strong>PlayerMatch</strong>
            <span>NBA player similarity lab</span>
          </div>
        </div>

        <nav className="v3-nav" aria-label="PlayerMatch views">
          {VIEWS.map(([key, label, Icon]) => (
            <button
              type="button"
              key={key}
              className={activeView === key ? "active" : ""}
              aria-current={activeView === key ? "page" : undefined}
              onClick={() => onViewChange(key)}
            >
              <Icon size={15} aria-hidden="true" />
              {label}
            </button>
          ))}
        </nav>

        <div className="workbench-meta">
          <span className="header-model v3-model-status">
            <FlaskConical size={14} aria-hidden="true" />
            {profile} · {statBasisLabel}
          </span>

          <span
            className="season-chip"
            aria-label={`Season ${season ?? "unknown"}`}
          >
            {season ?? "—"}
          </span>

          <button
            type="button"
            className="header-help"
            onClick={onOpenMethodology}
            aria-label="Open model methodology"
            title="How PlayerMatch works"
          >
            <CircleHelp size={19} aria-hidden="true" />
          </button>
        </div>
      </header>
    </>
  );
}
