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
