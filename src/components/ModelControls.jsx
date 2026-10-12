import { PROFILES } from "../config/modelConfig";

import {
  POOL_FILTERS,
  STAT_BASES,
} from "../config/viewConfig";

export default function ModelControls({
  profile,
  statBasis,
  poolFilter,
  onProfileChange,
  onStatBasisChange,
  onPoolFilterChange,
  supportsAdvancedBases,
  supportsPositions,
}) {
  return (
    <section
      className="controls-deck"
      aria-label="PlayerMatch model controls"
    >
      <fieldset className="control-group control-group--profile">
        <legend>Similarity profile</legend>

        <div
          className="control-buttons"
          aria-label="Similarity profile"
        >
          {Object.keys(PROFILES).map((name) => (
            <button
              type="button"
              key={name}
              aria-pressed={profile === name}
              className={
                profile === name
                  ? "active"
                  : ""
              }
              onClick={() =>
                onProfileChange(name)
              }
            >
              {name}
            </button>
          ))}
        </div>

        <p>{PROFILES[profile].description}</p>
      </fieldset>

      <div
        className="control-divider"
        aria-hidden="true"
      />

      <fieldset className="control-group">
        <legend>Stat basis</legend>

        <div
          className="control-buttons"
          aria-label="Stat basis"
        >
          {Object.entries(STAT_BASES).map(
            ([key, config]) => {
              const disabled =
                key !== "perGame" &&
                !supportsAdvancedBases;

              return (
                <button
                  type="button"
                  key={key}
                  disabled={disabled}
                  aria-pressed={
                    statBasis === key
                  }
                  className={
                    statBasis === key
                      ? "active"
                      : ""
                  }
                  onClick={() =>
                    !disabled &&
                    onStatBasisChange(key)
                  }
                  title={
                    disabled
                      ? "Run the V2 data pipeline first"
                      : config.label
                  }
                >
                  {config.label}
                </button>
              );
            }
          )}
        </div>
      </fieldset>

      <div
        className="control-divider"
        aria-hidden="true"
      />

      <label className="control-group control-group--select">
        <span>Comparison pool</span>

        <select
          value={poolFilter}
          disabled={!supportsPositions}
          onChange={(event) =>
            onPoolFilterChange(
              event.target.value
            )
          }
          title={
            supportsPositions
              ? "Choose which players can appear as comparison candidates"
              : "Run the V2 data pipeline first"
          }
        >
          {POOL_FILTERS.map((option) => (
            <option
              key={option.key}
              value={option.key}
            >
              {option.label}
            </option>
          ))}
        </select>
      </label>
    </section>
  );
}
