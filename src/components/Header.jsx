import {
  CircleHelp,
  FlaskConical,
} from "lucide-react";

export default function Header({
  season,
  onOpenMethodology,
}) {
  return (
    <>
      <a
        className="skip-link"
        href="#main-content"
      >
        Skip to main content
      </a>

      <header className="workbench-header">
        <div className="workbench-brand">
          <div
            className="brand-mark"
            aria-hidden="true"
          >
            PM
          </div>

          <div>
            <strong>
              PlayerMatch
            </strong>

            <span>
              NBA player similarity lab
            </span>
          </div>
        </div>

        <nav
          className="workbench-nav"
          aria-label="Primary navigation"
        >
          <a href="#matchup">
            Matchup
          </a>

          <a href="#analysis">
            Analysis
          </a>

          <a href="#closest-matches">
            Player pool
          </a>
        </nav>

        <div className="workbench-meta">
          <span className="header-model">
            <FlaskConical
              size={15}
              aria-hidden="true"
            />

            Weighted cosine model
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
            onClick={
              onOpenMethodology
            }
            aria-label="Open model methodology"
            title="Methodology"
          >
            <CircleHelp
              size={19}
              aria-hidden="true"
            />
          </button>
        </div>
      </header>
    </>
  );
}
