import { PROJECTION_TARGETS } from "./projection";
import { FEATURES } from "../config/modelConfig";

const isRecord = (value) => value !== null && typeof value === "object" && !Array.isArray(value);
const hasPlayerIdentity = (player) => isRecord(player) && Number.isFinite(player.id) &&
  typeof player.name === "string" && Boolean(player.name.trim());

function validateMetadata(meta) {
  if (meta === undefined || meta === null) return {};
  if (!isRecord(meta)) throw new Error("Dataset metadata is invalid. Please try again.");
  for (const key of ["season", "currentSeason", "projectionSeason", "sourceSeason", "holdoutSeason"]) {
    if (meta[key] !== undefined && typeof meta[key] !== "string") {
      throw new Error("Dataset season metadata is invalid. Please try again.");
    }
  }
  for (const key of ["seasons", "statBases"]) {
    if (meta[key] !== undefined && (!Array.isArray(meta[key]) || meta[key].some((value) => typeof value !== "string"))) {
      throw new Error("Dataset season metadata is invalid. Please try again.");
    }
  }
  return meta;
}

export function validatePlayers(payload) {
  if (!isRecord(payload) || !Array.isArray(payload.players) || payload.players.length < 2) {
    throw new Error("PlayerMatch needs at least two players to build a comparison. Please try again.");
  }
  const ids = new Set();
  for (const player of payload.players) {
    if (!hasPlayerIdentity(player) || ids.has(player.id) ||
        FEATURES.some(({ key }) => !Number.isFinite(player[key]))) {
      throw new Error("The player dataset contains incomplete or invalid records. Please try again.");
    }
    ids.add(player.id);
  }
  return { meta: validateMetadata(payload.meta), players: payload.players };
}

export function validateHistory(payload) {
  if (!isRecord(payload) || !Array.isArray(payload.seasons) || !payload.seasons.length ||
      payload.seasons.some((row) => !isRecord(row) || typeof row.season !== "string" ||
        !Array.isArray(row.players) || row.players.some((player) => !hasPlayerIdentity(player)))) {
    throw new Error("Historical data is incomplete or unavailable. Please try again.");
  }
  for (const season of payload.seasons) validatePlayers(season);
  return { meta: validateMetadata(payload.meta), seasons: payload.seasons };
}

export function validateProjections(payload) {
  if (!isRecord(payload) || !Array.isArray(payload.players) || !payload.players.length ||
      !isRecord(payload.evaluation) || payload.players.some((row) => !hasPlayerIdentity(row) || !isRecord(row.projections))) {
    throw new Error("Projection data is incomplete or unavailable. Please try again.");
  }
  for (const player of payload.players) {
    if (player.projectionSeason !== undefined && typeof player.projectionSeason !== "string") {
      throw new Error("Player projection season is invalid. Please try again.");
    }
    for (const target of PROJECTION_TARGETS) {
      const row = player.projections[target];
      if (!isRecord(row) || !["Increase", "Decrease", "Stable"].includes(row.direction)) {
        throw new Error("Player projection records are incomplete or invalid. Please try again.");
      }
    }
  }
  for (const target of PROJECTION_TARGETS) {
    const evaluation = payload.evaluation[target];
    const dimensions = evaluation?.diagnostics?.dimensions;
    if (dimensions !== undefined && (!isRecord(dimensions) || Object.values(dimensions).some(
      (dimension) => !isRecord(dimension) || typeof dimension.label !== "string" ||
        !Array.isArray(dimension.groups) || dimension.groups.some((group) => !isRecord(group) ||
          typeof group.key !== "string" || typeof group.label !== "string" ||
          ["sampleCount", "selectedMAE", "baselineMAE", "meanSignedError"].some((key) => !Number.isFinite(group[key])))
    ))) throw new Error("Projection diagnostics are incomplete or invalid. Please try again.");
    const metric = (value) => isRecord(value) && Number.isFinite(value.mae) && Number.isFinite(value.rmse);
    if (!isRecord(evaluation) || typeof evaluation.selectedModel !== "string" ||
        !isRecord(evaluation.holdout) || !metric(evaluation.holdout.selected) || !metric(evaluation.holdout.baseline) ||
        !isRecord(evaluation.selection) || !Number.isFinite(evaluation.selection.tolerancePct) ||
        !isRecord(evaluation.validation) || Object.values(evaluation.validation).some((row) => !metric(row)) ||
        !Array.isArray(evaluation.topFeatures) || evaluation.topFeatures.some((row) => !isRecord(row) ||
          typeof row.feature !== "string" || !Number.isFinite(row.share))) {
      throw new Error("Projection evaluation data is incomplete or invalid. Please try again.");
    }
  }
  return { meta: validateMetadata(payload.meta), evaluation: payload.evaluation, players: payload.players };
}

export async function readDataset(url, validate, signal) {
  const response = await fetch(url, { signal });
  if (!response.ok) throw new Error("We couldn't load this dataset. Please try again.");
  return validate(await response.json());
}
