function ordinal(value) {
  const rounded = Math.round(value);
  const mod100 = rounded % 100;

  if (mod100 >= 11 && mod100 <= 13) {
    return `${rounded}th`;
  }

  switch (rounded % 10) {
    case 1:
      return `${rounded}st`;
    case 2:
      return `${rounded}nd`;
    case 3:
      return `${rounded}rd`;
    default:
      return `${rounded}th`;
  }
}

export function leagueBand(z) {
  if (z >= 1.5) return { label: "Far above average", short: "Far above" };
  if (z >= 0.5) return { label: "Above average", short: "Above" };
  if (z > -0.5) return { label: "Around average", short: "Average" };
  if (z > -1.5) return { label: "Below average", short: "Below" };
  return { label: "Far below average", short: "Far below" };
}

export function buildDecisionBrief({
  left,
  right,
  similarity,
  categories,
  drivers,
  differences,
  stability,
}) {
  if (!left || !right || !categories?.length) return null;

  const biggestCategory = [...categories].sort(
    (a, b) => Math.abs(b.left - b.right) - Math.abs(a.left - a.right)
  )[0];

  const closestCategory = [...categories].sort(
    (a, b) => Math.abs(a.left - a.right) - Math.abs(b.left - b.right)
  )[0];

  const leftBest = [...categories].sort((a, b) => b.left - a.left)[0];
  const rightBest = [...categories].sort((a, b) => b.right - a.right)[0];

  const categoryWinner =
    biggestCategory.left >= biggestCategory.right ? left : right;
  const categoryLoser = categoryWinner.id === left.id ? right : left;

  const high = Math.max(biggestCategory.left, biggestCategory.right);
  const low = Math.min(biggestCategory.left, biggestCategory.right);

  const driver = drivers?.[0];
  const difference = differences?.[0];

  let reliability = "This comparison is based on the current stat view.";
  let reliabilityLabel = "Context check unavailable";

  if (stability) {
    if (stability.range <= 5) {
      reliabilityLabel = "Very stable comparison";
      reliability =
        "The match barely changes after adjusting for minutes and possessions, so it looks fairly robust.";
    } else if (stability.range <= 10) {
      reliabilityLabel = "Moderately stable comparison";
      reliability =
        "The match moves somewhat after adjusting for minutes and possessions, so role and playing time matter.";
    } else {
      reliabilityLabel = "Context-sensitive comparison";
      reliability =
        "The match changes a lot after adjusting for minutes and possessions, so the headline score needs extra caution.";
    }
  }

  return {
    summary:
      `${right.name} is a ${similarity.toFixed(0)}% statistical match for ${left.name}. ` +
      `Their profiles line up most closely in ${closestCategory.name.toLowerCase()}, while ${biggestCategory.name.toLowerCase()} is the clearest category-level difference.`,

    why:
      driver
        ? `${driver.longLabel} is the strongest positive reason the model connects these two players.`
        : "The similarity comes from several features rather than one dominant stat.",

    edge:
      `${categoryWinner.name} has the clearer ${biggestCategory.name.toLowerCase()} edge (${ordinal(high)} percentile vs ${ordinal(low)} for ${categoryLoser.name}).`,

    strengths: [
      `${left.name}: ${leftBest.name} is the strongest category (${ordinal(leftBest.left)} percentile).`,
      `${right.name}: ${rightBest.name} is the strongest category (${ordinal(rightBest.right)} percentile).`,
    ],

    reliabilityLabel,
    reliability,

    watch:
      difference
        ? `Watch ${difference.longLabel.toLowerCase()}. It is currently the largest standardized separation between the two players.`
        : "Watch whether their roles and minutes stay similar over a larger sample.",

    decision:
      similarity >= 84
        ? "This is a useful comparison, but the players should not be treated as interchangeable. Use the biggest differences as the deciding context."
        : "This is better used as a reference point than as a direct substitute comparison.",

    forecast:
      "Historical trends are available in Trends, while backtested next-season estimates live in Outlook. Projections should be read together with the model-performance and historical-error information.",
  };
}

export function buildFriendlyProfileSummary(left, right, rows) {
  if (!left || !right || !rows?.length) return null;

  const largestGap = [...rows].sort((a, b) => b.gap - a.gap)[0];
  const closest = [...rows].sort((a, b) => a.gap - b.gap)[0];
  const leftHigh = [...rows].sort((a, b) => b.leftZ - a.leftZ)[0];
  const rightHigh = [...rows].sort((a, b) => b.rightZ - a.rightZ)[0];

  return {
    headline:
      `${left.name} stands out most in ${leftHigh.longLabel.toLowerCase()}, while ${right.name} stands out most in ${rightHigh.longLabel.toLowerCase()}.`,
    difference:
      `${largestGap.longLabel} is the biggest league-relative difference between them.`,
    similarity:
      `${closest.longLabel} is where their profiles look most alike relative to the league.`,
    caveat:
      "This describes current statistical production relative to the player pool. It does not measure every part of defense, role, health, lineup fit or future development.",
  };
}
