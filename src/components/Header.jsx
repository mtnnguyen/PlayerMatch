import { CircleHelp, FlaskConical } from "lucide-react";

export default function Header({ season, onOpenMethodology }) {
  return (
    <header className="workbench-header">
      <div className="workbench-brand">
        <div className="brand-mark">PM</div>
        <div>
          <strong>PlayerMatch</strong>
          <span>NBA player similarity lab</span>
        </div>
      </div>

      <nav className="workbench-nav">
        <a href="#matchup">Matchup</a>
        <a href="#analysis">Analysis</a>
        <a href="#matches">Player pool</a>
      </nav>

      <div className="workbench-meta">
        <span className="header-model">
          <FlaskConical size={13} />
          Weighted cosine model
        </span>
        <span className="season-chip">{season ?? "—"}</span>
        <button className="header-help" onClick={onOpenMethodology}>
          <CircleHelp size={17} />
        </button>
      </div>
    </header>
  );
}
