import { CATEGORIES } from "../config/modelConfig";
import { percentile } from "./similarity";

export function categoryComparisons(players, left, right) {
  return CATEGORIES.map((category) => {
    const score = (player) =>
      Math.round(
        category.features
          .map((key) => percentile(players, key, player[key]))
          .reduce((a, b) => a + b, 0) / category.features.length
      );
    return { ...category, left: score(left), right: score(right) };
  });
}

export function archetype(players, player) {
  const p = (key) => percentile(players, key, player[key]);
  const pts = p("pts"), ast = p("ast"), reb = p("reb");
  const stl = p("stl"), blk = p("blk"), usage = p("usage");
  const ts = p("tsPct"), three = p("threePct");

  let name = "Balanced contributor";
  if (ast >= 90 && usage >= 85) name = "Primary creator";
  else if (pts >= 90 && three >= 75) name = "Scoring engine";
  else if (reb >= 88 && blk >= 80) name = "Interior anchor";
  else if (stl >= 85 && pts >= 70) name = "Two-way disruptor";
  else if (three >= 85 && ts >= 80) name = "Efficiency spacer";
  else if (reb >= 80 && ast >= 70) name = "Playmaking forward";

  const tags = [
    [usage, "High usage"], [ast, "Playmaking"], [pts, "Scoring"],
    [reb, "Rebounding"], [Math.max(stl, blk), "Defensive activity"],
    [ts, "Efficiency"], [three, "Perimeter shooting"],
  ].sort((a, b) => b[0] - a[0]).slice(0, 3).map((x) => x[1]);

  return { name, tags };
}

export function analystSummary(left, right, similarity, categories, profile, drivers) {
  if (!left || !right || !categories.length) return null;

  const edge = [...categories].sort(
    (a, b) => Math.abs(b.left - b.right) - Math.abs(a.left - a.right)
  )[0];

  const closest = [...categories].sort(
    (a, b) => Math.abs(a.left - a.right) - Math.abs(b.left - b.right)
  )[0];

  const leftBest = [...categories].sort((a, b) => b.left - a.left)[0];
  const rightBest = [...categories].sort((a, b) => b.right - a.right)[0];
  const driver = drivers[0];

  const edgeText =
    Math.abs(edge.left - edge.right) <= 4
      ? "Neither player owns a large category-level edge."
      : `${edge.left > edge.right ? left.name : right.name} has the clearest edge in ${edge.name.toLowerCase()} (${Math.max(edge.left, edge.right)}th vs ${Math.min(edge.left, edge.right)}th percentile).`;

  return {
    paragraph:
      `${right.name} matches ${left.name} at ${similarity.toFixed(1)}% under the ${profile.toLowerCase()} model. ` +
      `${driver ? `${driver.longLabel} is the largest positive similarity contributor. ` : ""}${edgeText}`,
    leftEdge: `${leftBest.name} · ${leftBest.left}th`,
    rightEdge: `${rightBest.name} · ${rightBest.right}th`,
    closest: `${closest.name} · ${Math.abs(closest.left - closest.right)} pt gap`,
  };
}
