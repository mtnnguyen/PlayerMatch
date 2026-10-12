import {
  AlertTriangle,
  CheckCircle2,
  Lightbulb,
  SearchCheck,
} from "lucide-react";

export default function InterpretationPanel({
  interpretation,
  left,
  right,
}) {
  if (!interpretation) {
    return null;
  }

  return (
    <section
      className="visual-card interpretation-card"
      aria-labelledby="interpretation-title"
    >
      <div className="visual-card-heading">
        <div>
          <span>MODEL INTERPRETATION</span>

          <h2 id="interpretation-title">
            What the numbers suggest
          </h2>

          <p>
            A plain-language read of the standardized
            profile for {left.name} and {right.name}.
          </p>
        </div>
      </div>

      <div className="interpretation-stack">
        <article className="interpretation-block">
          <div className="interpretation-icon">
            <Lightbulb
              size={18}
              aria-hidden="true"
            />
          </div>

          <div>
            <span>Observation</span>
            <p>{interpretation.observation}</p>
          </div>
        </article>

        <article className="interpretation-block">
          <div className="interpretation-icon">
            <SearchCheck
              size={18}
              aria-hidden="true"
            />
          </div>

          <div>
            <span>Evidence</span>

            <ul>
              {interpretation.evidence.map(
                (item) => (
                  <li key={item}>
                    {item}
                  </li>
                )
              )}
            </ul>
          </div>
        </article>

        <article className="interpretation-block">
          <div className="interpretation-icon">
            <CheckCircle2
              size={18}
              aria-hidden="true"
            />
          </div>

          <div>
            <span>Conclusion</span>
            <p>{interpretation.conclusion}</p>
          </div>
        </article>

        <article className="interpretation-block interpretation-block--warning">
          <div className="interpretation-icon">
            <AlertTriangle
              size={18}
              aria-hidden="true"
            />
          </div>

          <div>
            <span>Limitation</span>
            <p>{interpretation.limitation}</p>
          </div>
        </article>
      </div>

      <div className="interpretation-language">
        <strong>
          Statistical language
        </strong>

        <p>
          {interpretation.teaching.left}
          {" "}
          {interpretation.teaching.right}
        </p>
      </div>
    </section>
  );
}
