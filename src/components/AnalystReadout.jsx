export default function AnalystReadout({
  summary,
  leftName,
  rightName,
}) {
  if (!summary) {
    return null;
  }

  return (
    <section className="analyst-readout">
      <div className="analyst-badge">PM</div>

      <div className="analyst-copy">
        <span>MODEL INTERPRETATION</span>
        <p>{summary.paragraph}</p>
      </div>

      <div className="analyst-facts">
        <div>
          <span>{leftName} profile peak</span>
          <strong>{summary.leftEdge}</strong>
        </div>

        <div>
          <span>{rightName} profile peak</span>
          <strong>{summary.rightEdge}</strong>
        </div>

        <div>
          <span>Closest category</span>
          <strong>{summary.closest}</strong>
        </div>
      </div>
    </section>
  );
}
