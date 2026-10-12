export const FEATURES = [
  { key: "pts", label: "PTS", longLabel: "Points", group: "Scoring" },
  { key: "reb", label: "REB", longLabel: "Rebounds", group: "Rebounding" },
  { key: "ast", label: "AST", longLabel: "Assists", group: "Playmaking" },
  { key: "stl", label: "STL", longLabel: "Steals", group: "Defense" },
  { key: "blk", label: "BLK", longLabel: "Blocks", group: "Defense" },
  { key: "fgPct", label: "FG%", longLabel: "Field goal percentage", group: "Efficiency", percentage: true },
  { key: "threePct", label: "3P%", longLabel: "Three-point percentage", group: "Efficiency", percentage: true },
  { key: "ftPct", label: "FT%", longLabel: "Free-throw percentage", group: "Efficiency", percentage: true },
  { key: "usage", label: "USG%", longLabel: "Usage rate", group: "Scoring", percentage: true },
  { key: "tsPct", label: "TS%", longLabel: "True shooting percentage", group: "Efficiency", percentage: true },
];

export const CATEGORIES = [
  { name: "Scoring", features: ["pts", "usage"] },
  { name: "Playmaking", features: ["ast"] },
  { name: "Rebounding", features: ["reb"] },
  { name: "Defense", features: ["stl", "blk"] },
  { name: "Efficiency", features: ["tsPct", "fgPct", "threePct", "ftPct"] },
];

const BALANCED_WEIGHTS = {
  pts: 1,
  reb: 1,
  ast: 1,
  stl: 1,
  blk: 1,
  fgPct: 1,
  threePct: 1,
  ftPct: 1,
  usage: 1,
  tsPct: 1,
};

export const PROFILES = {
  Balanced: {
    description:
      "Equal emphasis across scoring, creation, defense and efficiency.",
    weights: BALANCED_WEIGHTS,
  },

  Scoring: {
    description:
      "Prioritizes scoring volume, efficiency, shooting and usage.",
    weights: {
      pts: 2.2,
      reb: 0.5,
      ast: 0.7,
      stl: 0.4,
      blk: 0.35,
      fgPct: 1.15,
      threePct: 1.4,
      ftPct: 0.7,
      usage: 1.7,
      tsPct: 1.55,
    },
  },

  Playmaking: {
    description:
      "Prioritizes assists, creation and offensive responsibility.",
    weights: {
      pts: 0.8,
      reb: 0.55,
      ast: 2.6,
      stl: 0.65,
      blk: 0.3,
      fgPct: 0.6,
      threePct: 0.55,
      ftPct: 0.4,
      usage: 1.3,
      tsPct: 0.65,
    },
  },

  Defense: {
    description:
      "Prioritizes steals, blocks and rebounding activity.",
    weights: {
      pts: 0.35,
      reb: 1.55,
      ast: 0.45,
      stl: 2.25,
      blk: 2.25,
      fgPct: 0.4,
      threePct: 0.25,
      ftPct: 0.2,
      usage: 0.25,
      tsPct: 0.35,
    },
  },

  Custom: {
    description:
      "Build your own model by changing the weight of each feature.",
    weights: { ...BALANCED_WEIGHTS },
  },
};
