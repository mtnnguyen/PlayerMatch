import { describe, expect, test } from "vitest";
import { projectionComparisonRead } from "../../src/model/projection";

const left = { name: "Left player" };
const right = { name: "Right player" };

function compare(leftValue, rightValue, errorBand = 2) {
  return projectionComparisonRead(
    "pts",
    left,
    right,
    { projected: leftValue, historicalErrorBand80: errorBand },
    { projected: rightValue, historicalErrorBand80: errorBand }
  );
}

describe("projection comparison wording", () => {
  test.each([0, 2])("equal estimates have no leader with an error band of %s", (errorBand) => {
    const comparison = compare(20, 20, errorBand);

    expect(comparison.headline).toBe("Both players have the same point estimate for points.");
    expect(comparison.detail).toContain("Left player: 20 · Right player: 20.");
    expect(comparison.detail).toContain("Point-estimate gap: 0.");
    expect(comparison.detail).toContain("do not imply identical actual outcomes");
  });

  test("numeric strings with equal values also have no leader", () => {
    expect(compare("20", 20).headline).toBe(
      "Both players have the same point estimate for points."
    );
  });

  test("unequal estimates still identify the correct player", () => {
    expect(compare(25, 20).headline).toBe("Left player has the higher point estimate for points.");
    expect(compare(20, 25).headline).toBe("Right player has the higher point estimate for points.");
  });

  test("a small nonzero gap still includes the historical-error caveat", () => {
    expect(compare(20, 21).headline).toContain(
      "Right player has the higher point estimate, but the gap is smaller"
    );
  });
});

import {
  formatProjectionValue, formatProjectionChange, formatProjectionError,
  formatProjectionErrorMagnitude, formatProjectionSignedError,
  projectionErrorBadge, projectionDirectionCopy, playerProjectionStory,
} from "../../src/model/projection";

describe("unavailable projections", () => {
  const invalid = [null, undefined, "", "  ", "bad", NaN, Infinity, -Infinity, true, [], {}];
  test.each(invalid)("does not render %j as a number", (value) => {
    for (const format of [formatProjectionValue, formatProjectionChange,
      formatProjectionErrorMagnitude, formatProjectionSignedError, formatProjectionError]) {
      expect(format("pts", value)).toBe("Unavailable");
    }
    expect(projectionErrorBadge("pts", { historicalErrorBand80: value }).label).toBe("Error unavailable");
    expect(projectionDirectionCopy({ projected: value, direction: "Increase" })).toBe("No projection");
    const comparison = projectionComparisonRead("pts", left, right,
      { projected: value }, { projected: 20 });
    expect(comparison.headline).toBe("Projection comparison unavailable.");
  });
  test("preserves zero and valid numeric strings", () => {
    expect(formatProjectionValue("pts", 0)).toBe("0");
    expect(formatProjectionValue("tsPct", "58.5")).toBe("58.5%");
    expect(formatProjectionChange("pts", "2")).toBe("+2");
    expect(formatProjectionError("pts", 0)).toBe("±0 PPG");
    expect(formatProjectionErrorMagnitude("pts", -2)).toBe("2 PPG");
  });
  test("does not invent historical uncertainty from missing bands", () => {
    const comparison = projectionComparisonRead("pts", left, right,
      { projected: 20 }, { projected: 25, historicalErrorBand80: 2 });
    expect(comparison.headline).toContain("Right player has the higher");
    expect(comparison.detail).toContain("Historical error is unavailable");
  });
  test("does not invent a stable story from missing changes", () => {
    expect(playerProjectionStory("Player", { projections: { pts: { change: 1 } } })).toBeNull();
  });
});
