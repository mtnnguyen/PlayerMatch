import { FEATURES, PROFILES } from "../config/modelConfig";

export function leagueStats(players) {
  const out = {};
  for (const { key } of FEATURES) {
    const values = players.map((p) => Number(p[key] ?? 0));
    const mean = values.reduce((a, b) => a + b, 0) / Math.max(values.length, 1);
    const variance = values.reduce((s, v) => s + (v - mean) ** 2, 0) / Math.max(values.length, 1);
    out[key] = { mean, std: Math.sqrt(variance) || 1 };
  }
  return out;
}

export function percentile(players, key, value) {
  if (!players.length) return 0;
  const target = Number(value ?? 0);
  let below = 0;
  let equal = 0;
  for (const p of players) {
    const current = Number(p[key] ?? 0);
    if (current < target) below += 1;
    else if (current === target) equal += 1;
  }
  return Math.round(((below + 0.5 * equal) / players.length) * 100);
}

function vector(player, stats, weights) {
  return FEATURES.map(({ key }) => {
    const z = (Number(player[key] ?? 0) - stats[key].mean) / stats[key].std;
    return z * Math.sqrt(weights[key] ?? 1);
  });
}

function cosine(a, b) {
  let dot = 0, aa = 0, bb = 0;
  for (let i = 0; i < a.length; i += 1) {
    dot += a[i] * b[i];
    aa += a[i] ** 2;
    bb += b[i] ** 2;
  }
  const d = Math.sqrt(aa) * Math.sqrt(bb);
  return d ? dot / d : 0;
}

export function buildMatches(players, selected, profile, stats) {
  if (!selected || players.length < 2) return [];
  const weights = PROFILES[profile].weights;
  const a = vector(selected, stats, weights);

  return players
    .filter((p) => p.id !== selected.id)
    .map((p) => {
      const raw = cosine(a, vector(p, stats, weights));
      return { ...p, similarity: Math.max(0, Math.min(100, raw * 100)) };
    })
    .sort((a, b) => b.similarity - a.similarity);
}

export function similarityLabel(v) {
  if (v >= 92) return "Near twin";
  if (v >= 84) return "Very similar";
  if (v >= 72) return "Strong match";
  if (v >= 58) return "Related profile";
  return "Loose match";
}

export function explainFeatures(left, right, stats, profile) {
  if (!left || !right) return [];
  const weights = PROFILES[profile].weights;
  const lv = vector(left, stats, weights);
  const rv = vector(right, stats, weights);
  const denom =
    Math.sqrt(lv.reduce((s, v) => s + v ** 2, 0)) *
    Math.sqrt(rv.reduce((s, v) => s + v ** 2, 0));

  const rows = FEATURES.map((feature, i) => {
    const { key } = feature;
    const lz = (Number(left[key] ?? 0) - stats[key].mean) / stats[key].std;
    const rz = (Number(right[key] ?? 0) - stats[key].mean) / stats[key].std;
    const contribution = denom ? (lv[i] * rv[i]) / denom : 0;
    return {
      ...feature,
      weightedGap: Math.abs(lz - rz) * Math.sqrt(weights[key] ?? 1),
      contribution,
    };
  });

  const positive = rows.reduce((s, r) => s + Math.max(0, r.contribution), 0);
  return rows.map((r) => ({
    ...r,
    contributionShare:
      r.contribution > 0 && positive > 0 ? (r.contribution / positive) * 100 : 0,
  }));
}
