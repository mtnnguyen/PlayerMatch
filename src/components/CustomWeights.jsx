import { FEATURES } from "../config/modelConfig";

export default function CustomWeights({
  weights,
  onChange,
  onReset,
}) {
  return (
    <section
      className="custom-weights"
      aria-labelledby="custom-weights-title"
    >
      <div className="custom-weights-heading">
        <div>
          <span>CUSTOM MODEL</span>
          <h2 id="custom-weights-title">
            Feature weights
          </h2>
        </div>

        <button
          type="button"
          onClick={onReset}
        >
          Reset to 1.0
        </button>
      </div>

      <div className="weight-control-grid">
        {FEATURES.map((feature) => {
          const value =
            weights[feature.key] ?? 1;

          return (
            <label
              key={feature.key}
              className="weight-control"
            >
              <span>
                <strong>{feature.label}</strong>
                <small>{feature.longLabel}</small>
              </span>

              <input
                type="range"
                min="0"
                max="3"
                step="0.1"
                value={value}
                onChange={(event) =>
                  onChange(
                    feature.key,
                    event.target.value
                  )
                }
                aria-label={`${feature.longLabel} weight`}
              />

              <output>
                {Number(value).toFixed(1)}
              </output>
            </label>
          );
        })}
      </div>

      <p className="custom-weights-note">
        A weight of 0 removes the feature from the similarity model.
        Higher values make that feature more influential.
      </p>
    </section>
  );
}
