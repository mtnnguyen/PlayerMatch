import { X } from "lucide-react";

const steps = [
  ["01", "Feature selection", "Points, rebounds, assists, steals, blocks, shooting percentages, usage and true shooting."],
  ["02", "League standardization", "Every feature becomes a z-score relative to the current player pool."],
  ["03", "Profile weighting", "Balanced, Scoring, Playmaking and Defense change feature importance."],
  ["04", "Cosine similarity", "Weighted player vectors are compared using cosine similarity on a 0–100 display scale."],
  ["05", "Percentile context", "The battle table adds league percentiles so raw stats have context."],
  ["06", "Model interpretation", "The written readout is deterministic and derived from model outputs, not an external LLM."],
];

export default function MethodologyModal({ open, onClose }) {
  if (!open) return null;

  return (
    <div className="modal-backdrop" onMouseDown={onClose}>
      <div className="method-modal" onMouseDown={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div><span>MODEL DOCUMENTATION</span><h2>How PlayerMatch works</h2></div>
          <button onClick={onClose}><X size={18} /></button>
        </div>

        <div className="method-grid">
          {steps.map(([n, title, body]) => (
            <article key={n}>
              <span>{n}</span>
              <div><strong>{title}</strong><p>{body}</p></div>
            </article>
          ))}
        </div>

        <div className="method-warning">
          PlayerMatch measures statistical profile similarity, not total player value,
          complete defensive impact, contract value, lineup fit or scouting projection.
        </div>
      </div>
    </div>
  );
}
