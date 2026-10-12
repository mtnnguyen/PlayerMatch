import { ArrowLeftRight, Pencil } from "lucide-react";

export default function MatchContext({
  left,
  right,
  similarity,
  profile,
  statBasisLabel,
  onSwap,
  onEditMatchup,
}) {
  return (
    <div className="match-context">
      <div className="match-context-player match-context-player--left">
        <span>Primary</span>
        <strong>{left.name}</strong>
        <small>{left.team}{left.position ? ` · ${left.position}` : ""}</small>
      </div>

      <div className="match-context-center">
        <strong>{similarity.toFixed(0)}%</strong>
        <span>{profile} · {statBasisLabel}</span>
      </div>

      <div className="match-context-player match-context-player--right">
        <span>Comparison</span>
        <strong>{right.name}</strong>
        <small>{right.team}{right.position ? ` · ${right.position}` : ""}</small>
      </div>

      <div className="match-context-actions">
        <button type="button" onClick={onSwap}>
          <ArrowLeftRight size={15} aria-hidden="true" />
          Swap
        </button>
        <button type="button" onClick={onEditMatchup}>
          <Pencil size={14} aria-hidden="true" />
          Change players
        </button>
      </div>
    </div>
  );
}
