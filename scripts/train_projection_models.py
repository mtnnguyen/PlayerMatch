"""
Train and evaluate PlayerMatch V5 next-season projection models.

Input:
    public/player_history.json

Output:
    public/projections.json

This script deliberately uses time-based evaluation instead of a random split.

Workflow:
    1. Build season-t -> season-(t+1) player examples.
    2. Choose the model family using expanding-window validation.
    3. Evaluate the selected model on the latest fully observed season.
    4. Refit on all observed transitions.
    5. Project the season after the latest season.

Targets:
    PTS, REB, AST, TS%, USG%

Models:
    Baseline             next season = current season
    Ridge Regression     linear / interpretable
    Gradient Boosting    nonlinear

The output includes evaluation metrics, an empirical historical error band,
feature importance, and player-level projections.

Important:
    This is an educational portfolio model, not a betting or medical model.
    The training set contains only player-seasons that remain eligible in the
    following season, so survivorship/availability bias is an explicit
    limitation.
"""

from __future__ import annotations

import argparse
import json
from dataclasses import dataclass
from datetime import datetime, timezone
from pathlib import Path
from typing import Callable

import numpy as np
import pandas as pd
from sklearn.ensemble import GradientBoostingRegressor
from sklearn.linear_model import Ridge
from sklearn.metrics import mean_absolute_error, mean_squared_error
from sklearn.pipeline import Pipeline
from sklearn.preprocessing import StandardScaler


ROOT = Path(__file__).resolve().parents[1]
PUBLIC = ROOT / "public"
DEFAULT_HISTORY = PUBLIC / "player_history.json"
DEFAULT_OUTPUT = PUBLIC / "projections.json"

TARGETS = {
    "pts": {
        "label": "Points",
        "percentage": False,
        "min": 0.0,
        "max": 60.0,
        "directionThreshold": 1.0,
    },
    "reb": {
        "label": "Rebounds",
        "percentage": False,
        "min": 0.0,
        "max": 30.0,
        "directionThreshold": 0.6,
    },
    "ast": {
        "label": "Assists",
        "percentage": False,
        "min": 0.0,
        "max": 20.0,
        "directionThreshold": 0.5,
    },
    "tsPct": {
        "label": "True shooting percentage",
        "percentage": True,
        "min": 0.0,
        "max": 100.0,
        "directionThreshold": 1.0,
    },
    "usage": {
        "label": "Usage rate",
        "percentage": True,
        "min": 0.0,
        "max": 100.0,
        "directionThreshold": 1.0,
    },
}

CORE_STATS = [
    "pts",
    "reb",
    "ast",
    "stl",
    "blk",
    "fgPct",
    "threePct",
    "ftPct",
    "usage",
    "tsPct",
]

DELTA_STATS = [
    "pts",
    "reb",
    "ast",
    "tsPct",
    "usage",
    "min",
]

FEATURE_COLUMNS = (
    [f"current_{key}" for key in CORE_STATS]
    + ["age", "min", "gp"]
    + [f"delta_{key}" for key in DELTA_STATS]
    + ["previousSeasonAvailable", "eligibleHistorySeasons"]
)


@dataclass
class ModelResult:
    name: str
    estimator: object | None
    validation_mae: float
    validation_rmse: float
    validation_residuals: list[float]


def season_start(season: str) -> int:
    return int(season.split("-")[0])


def next_season(season: str) -> str:
    first = season_start(season) + 1
    second = (first + 1) % 100
    return f"{first}-{second:02d}"


def sorted_seasons(payload: dict) -> list[dict]:
    seasons = payload.get("seasons", [])
    return sorted(seasons, key=lambda row: season_start(row["season"]))


def player_lookup(season_entry: dict) -> dict[int, dict]:
    return {
        int(player["id"]): player
        for player in season_entry.get("players", [])
    }


def numeric(player: dict | None, key: str) -> float:
    if not player:
        return 0.0

    value = player.get(key, 0)

    try:
        return float(value or 0)
    except (TypeError, ValueError):
        return 0.0


def build_features(
    current: dict,
    previous: dict | None,
    eligible_history_seasons: int,
) -> dict[str, float]:
    row: dict[str, float] = {}

    for key in CORE_STATS:
        row[f"current_{key}"] = numeric(current, key)

    row["age"] = numeric(current, "age")
    row["min"] = numeric(current, "min")
    row["gp"] = numeric(current, "gp")

    for key in DELTA_STATS:
        if previous:
            row[f"delta_{key}"] = numeric(current, key) - numeric(previous, key)
        else:
            row[f"delta_{key}"] = 0.0

    row["previousSeasonAvailable"] = 1.0 if previous else 0.0
    row["eligibleHistorySeasons"] = float(eligible_history_seasons)

    return row


def build_transition_frame(history: dict) -> tuple[pd.DataFrame, list[dict]]:
    seasons = sorted_seasons(history)

    if len(seasons) < 3:
        raise RuntimeError(
            "V5 needs at least three historical seasons. "
            "Run the V5 history builder first."
        )

    lookups = [player_lookup(entry) for entry in seasons]
    rows: list[dict] = []

    for index in range(len(seasons) - 1):
        source = seasons[index]
        target = seasons[index + 1]
        source_lookup = lookups[index]
        target_lookup = lookups[index + 1]
        previous_lookup = lookups[index - 1] if index > 0 else {}

        for player_id, current_player in source_lookup.items():
            target_player = target_lookup.get(player_id)

            if not target_player:
                continue

            previous_player = previous_lookup.get(player_id)

            history_count = sum(
                1
                for earlier_lookup in lookups[: index + 1]
                if player_id in earlier_lookup
            )

            feature_row = build_features(
                current_player,
                previous_player,
                history_count,
            )

            row = {
                "playerId": player_id,
                "playerName": current_player.get("name", ""),
                "sourceSeason": source["season"],
                "targetSeason": target["season"],
                **feature_row,
            }

            for key in TARGETS:
                row[f"target_{key}"] = numeric(target_player, key)

            rows.append(row)

    frame = pd.DataFrame(rows)

    if frame.empty:
        raise RuntimeError("No season-to-season training examples were created.")

    return frame, seasons


def make_ridge() -> Pipeline:
    return Pipeline(
        [
            ("scale", StandardScaler()),
            ("model", Ridge(alpha=10.0)),
        ]
    )


def make_gradient_boosting() -> GradientBoostingRegressor:
    return GradientBoostingRegressor(
        random_state=42,
        n_estimators=160,
        learning_rate=0.04,
        max_depth=2,
        min_samples_leaf=8,
        loss="huber",
    )


MODEL_FACTORIES: dict[str, Callable[[], object]] = {
    "Ridge": make_ridge,
    "Gradient Boosting": make_gradient_boosting,
}

MODEL_COMPLEXITY = {
    "Baseline": 0,
    "Ridge": 1,
    "Gradient Boosting": 2,
}

# If a simpler model lands within 2% of the best expanding-window
# validation MAE, prefer the simpler model rather than treating a tiny
# validation difference as evidence that extra complexity is worthwhile.
SIMPLICITY_TOLERANCE = 0.02


def baseline_predictions(frame: pd.DataFrame, target: str) -> np.ndarray:
    return frame[f"current_{target}"].to_numpy(dtype=float)


def model_predictions(
    name: str,
    estimator: object | None,
    frame: pd.DataFrame,
    target: str,
) -> np.ndarray:
    if name == "Baseline":
        return baseline_predictions(frame, target)

    assert estimator is not None
    return np.asarray(
        estimator.predict(frame[FEATURE_COLUMNS]),
        dtype=float,
    )


def fit_model(name: str, train: pd.DataFrame, target: str) -> object | None:
    if name == "Baseline":
        return None

    estimator = MODEL_FACTORIES[name]()
    estimator.fit(
        train[FEATURE_COLUMNS],
        train[f"target_{target}"],
    )
    return estimator


def metric_payload(actual: np.ndarray, predicted: np.ndarray) -> dict:
    return {
        "mae": float(mean_absolute_error(actual, predicted)),
        "rmse": float(
            mean_squared_error(actual, predicted) ** 0.5
        ),
        "sampleCount": int(len(actual)),
    }


def select_validation_model(
    validation_results: list[ModelResult],
) -> tuple[ModelResult, ModelResult, list[ModelResult], float]:
    finite = [
        result
        for result in validation_results
        if np.isfinite(result.validation_mae)
    ]

    if not finite:
        raise RuntimeError("No model produced a finite validation MAE.")

    best = min(
        finite,
        key=lambda result: result.validation_mae,
    )

    tolerance_cutoff = best.validation_mae * (
        1.0 + SIMPLICITY_TOLERANCE
    )

    eligible = [
        result
        for result in finite
        if result.validation_mae <= tolerance_cutoff
    ]

    selected = min(
        eligible,
        key=lambda result: (
            MODEL_COMPLEXITY.get(result.name, 99),
            result.validation_mae,
        ),
    )

    return selected, best, eligible, tolerance_cutoff


def subgroup_metrics(
    holdout: pd.DataFrame,
    target: str,
    mask: np.ndarray,
    selected_predictions: np.ndarray,
    baseline_predictions_array: np.ndarray,
    actual: np.ndarray,
) -> dict:
    mask = np.asarray(mask, dtype=bool)
    sample_count = int(mask.sum())

    if sample_count == 0:
        return {
            "sampleCount": 0,
            "selectedMAE": None,
            "baselineMAE": None,
            "maeImprovementPct": None,
            "meanSignedError": None,
            "meanProjectionChange": None,
        }

    selected_group = selected_predictions[mask]
    baseline_group = baseline_predictions_array[mask]
    actual_group = actual[mask]

    selected_mae = float(
        mean_absolute_error(actual_group, selected_group)
    )
    baseline_mae = float(
        mean_absolute_error(actual_group, baseline_group)
    )

    improvement = (
        (baseline_mae - selected_mae) / baseline_mae * 100
        if baseline_mae
        else 0.0
    )

    current_target = holdout[
        f"current_{target}"
    ].to_numpy(dtype=float)[mask]

    return {
        "sampleCount": sample_count,
        "selectedMAE": selected_mae,
        "baselineMAE": baseline_mae,
        "maeImprovementPct": float(improvement),
        "meanSignedError": float(
            np.mean(selected_group - actual_group)
        ),
        "meanProjectionChange": float(
            np.mean(selected_group - current_target)
        ),
    }


def holdout_diagnostics(
    holdout: pd.DataFrame,
    target: str,
    selected_predictions: np.ndarray,
    baseline_predictions_array: np.ndarray,
    actual: np.ndarray,
) -> dict:
    pts_rank = holdout["current_pts"].rank(
        method="average",
        pct=True,
    ).to_numpy(dtype=float)

    age = holdout["age"].to_numpy(dtype=float)
    minutes = holdout["min"].to_numpy(dtype=float)

    dimensions = {
        "scoringLevel": {
            "label": "Scoring level",
            "basis": "Source-season PTS rank within the held-out sample.",
            "groups": [
                {
                    "key": "bottom",
                    "label": "Bottom 10% scorers",
                    "mask": pts_rank <= 0.10,
                },
                {
                    "key": "middle",
                    "label": "Middle 80% scorers",
                    "mask": (pts_rank > 0.10) & (pts_rank <= 0.90),
                },
                {
                    "key": "top",
                    "label": "Top 10% scorers",
                    "mask": pts_rank > 0.90,
                },
            ],
        },
        "age": {
            "label": "Age",
            "basis": "Source-season age.",
            "groups": [
                {
                    "key": "young",
                    "label": "Age 23 or younger",
                    "mask": age <= 23,
                },
                {
                    "key": "prime",
                    "label": "Age 24–29",
                    "mask": (age >= 24) & (age < 30),
                },
                {
                    "key": "veteran",
                    "label": "Age 30+",
                    "mask": age >= 30,
                },
            ],
        },
        "minutes": {
            "label": "Minutes",
            "basis": "Source-season minutes per game.",
            "groups": [
                {
                    "key": "low",
                    "label": "Under 20 MPG",
                    "mask": minutes < 20,
                },
                {
                    "key": "rotation",
                    "label": "20–29.9 MPG",
                    "mask": (minutes >= 20) & (minutes < 30),
                },
                {
                    "key": "high",
                    "label": "30+ MPG",
                    "mask": minutes >= 30,
                },
            ],
        },
    }

    output_dimensions: dict[str, dict] = {}

    for dimension_key, dimension in dimensions.items():
        groups = []

        for group in dimension["groups"]:
            metrics = subgroup_metrics(
                holdout,
                target,
                group["mask"],
                selected_predictions,
                baseline_predictions_array,
                actual,
            )

            groups.append(
                {
                    "key": group["key"],
                    "label": group["label"],
                    **metrics,
                }
            )

        output_dimensions[dimension_key] = {
            "label": dimension["label"],
            "basis": dimension["basis"],
            "groups": groups,
        }

    return {
        "notes": [
            (
                "All subgroup definitions use source-season information "
                "from the held-out sample; target-season outcomes are not "
                "used to define the groups."
            ),
            (
                "Mean signed error is prediction minus actual; negative "
                "values indicate underprediction on average."
            ),
            (
                "Subgroup results are descriptive diagnostics, not "
                "statistical significance tests."
            ),
        ],
        "dimensions": output_dimensions,
    }


def walk_forward_validate(
    frame: pd.DataFrame,
    target: str,
    model_name: str,
    validation_target_seasons: list[str],
) -> ModelResult:
    actual_all: list[float] = []
    predicted_all: list[float] = []

    for validation_season in validation_target_seasons:
        validation_year = season_start(validation_season)

        train = frame[
            frame["targetSeason"].map(season_start) < validation_year
        ]

        validation = frame[
            frame["targetSeason"] == validation_season
        ]

        if train.empty or validation.empty:
            continue

        estimator = fit_model(model_name, train, target)
        predicted = model_predictions(
            model_name,
            estimator,
            validation,
            target,
        )

        actual = validation[f"target_{target}"].to_numpy(dtype=float)

        actual_all.extend(actual.tolist())
        predicted_all.extend(predicted.tolist())

    if not actual_all:
        return ModelResult(
            name=model_name,
            estimator=None,
            validation_mae=float("inf"),
            validation_rmse=float("inf"),
            validation_residuals=[],
        )

    actual_array = np.asarray(actual_all)
    predicted_array = np.asarray(predicted_all)

    metrics = metric_payload(actual_array, predicted_array)

    return ModelResult(
        name=model_name,
        estimator=None,
        validation_mae=metrics["mae"],
        validation_rmse=metrics["rmse"],
        validation_residuals=np.abs(actual_array - predicted_array).tolist(),
    )


def extract_feature_importance(name: str, estimator: object | None) -> list[dict]:
    if name == "Baseline" or estimator is None:
        return []

    if name == "Ridge":
        model = estimator.named_steps["model"]
        values = np.abs(model.coef_)
    elif name == "Gradient Boosting":
        values = estimator.feature_importances_
    else:
        return []

    rows = [
        {
            "feature": feature,
            "importance": float(value),
        }
        for feature, value in zip(FEATURE_COLUMNS, values)
    ]

    rows.sort(key=lambda row: row["importance"], reverse=True)

    total = sum(row["importance"] for row in rows) or 1.0

    return [
        {
            **row,
            "share": row["importance"] / total * 100,
        }
        for row in rows[:8]
    ]


def fit_and_evaluate_target(
    frame: pd.DataFrame,
    target: str,
    holdout_season: str,
) -> tuple[dict, object | None]:
    holdout_year = season_start(holdout_season)

    pre_holdout = frame[
        frame["targetSeason"].map(season_start) < holdout_year
    ].copy()

    holdout = frame[
        frame["targetSeason"] == holdout_season
    ].copy()

    if pre_holdout.empty or holdout.empty:
        raise RuntimeError(
            f"Not enough data to evaluate {target} using holdout {holdout_season}."
        )

    training_target_seasons = sorted(
        pre_holdout["targetSeason"].unique(),
        key=season_start,
    )

    # The first observed transition has no earlier transition to train on.
    validation_target_seasons = training_target_seasons[1:]

    candidates = ["Baseline", "Ridge", "Gradient Boosting"]

    validation_results = [
        walk_forward_validate(
            pre_holdout,
            target,
            name,
            validation_target_seasons,
        )
        for name in candidates
    ]

    selected, best_validation, eligible_models, tolerance_cutoff = (
        select_validation_model(validation_results)
    )

    selected_estimator = fit_model(selected.name, pre_holdout, target)
    selected_holdout_predictions = model_predictions(
        selected.name,
        selected_estimator,
        holdout,
        target,
    )

    baseline_holdout_predictions = baseline_predictions(holdout, target)

    actual_holdout = holdout[f"target_{target}"].to_numpy(dtype=float)

    selected_holdout_metrics = metric_payload(
        actual_holdout,
        selected_holdout_predictions,
    )

    baseline_holdout_metrics = metric_payload(
        actual_holdout,
        baseline_holdout_predictions,
    )

    diagnostics = holdout_diagnostics(
        holdout,
        target,
        selected_holdout_predictions,
        baseline_holdout_predictions,
        actual_holdout,
    )

    residuals = selected.validation_residuals

    if not residuals:
        residuals = np.abs(
            actual_holdout - selected_holdout_predictions
        ).tolist()

    error_band_80 = float(np.quantile(residuals, 0.80)) if residuals else 0.0

    final_estimator = fit_model(selected.name, frame, target)

    importance = extract_feature_importance(
        selected.name,
        final_estimator,
    )

    return (
        {
            "target": target,
            "label": TARGETS[target]["label"],
            "selectedModel": selected.name,
            "selectionMethod": (
                "Expanding-window validation MAE with 2% "
                "simplicity tolerance"
            ),
            "selection": {
                "bestValidationModel": best_validation.name,
                "bestValidationMAE": best_validation.validation_mae,
                "tolerancePct": SIMPLICITY_TOLERANCE * 100,
                "toleranceCutoffMAE": tolerance_cutoff,
                "eligibleModels": [
                    result.name
                    for result in eligible_models
                ],
                "selectedBySimplicityRule": (
                    selected.name != best_validation.name
                ),
            },
            "validation": {
                result.name: {
                    "mae": result.validation_mae,
                    "rmse": result.validation_rmse,
                }
                for result in validation_results
            },
            "holdoutSeason": holdout_season,
            "holdout": {
                "selected": selected_holdout_metrics,
                "baseline": baseline_holdout_metrics,
                "beatsBaseline": (
                    selected_holdout_metrics["mae"]
                    < baseline_holdout_metrics["mae"]
                ),
            },
            "historicalErrorBand80": error_band_80,
            "diagnostics": diagnostics,
            "topFeatures": importance,
        },
        final_estimator,
    )


def current_feature_frame(
    latest_entry: dict,
    previous_entry: dict | None,
    history_entries: list[dict],
) -> tuple[pd.DataFrame, list[dict]]:
    latest_lookup = player_lookup(latest_entry)
    previous_lookup = (
        player_lookup(previous_entry)
        if previous_entry
        else {}
    )

    all_lookups = [player_lookup(entry) for entry in history_entries]

    rows = []
    metadata = []

    for player_id, player in latest_lookup.items():
        previous = previous_lookup.get(player_id)

        history_count = sum(
            1
            for lookup in all_lookups
            if player_id in lookup
        )

        features = build_features(
            player,
            previous,
            history_count,
        )

        rows.append(features)
        metadata.append(player)

    return pd.DataFrame(rows), metadata


def projection_direction(
    current: float,
    projected: float,
    threshold: float,
) -> str:
    change = projected - current

    if change > threshold:
        return "Increase"

    if change < -threshold:
        return "Decrease"

    return "Stable"


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument(
        "--history",
        default=str(DEFAULT_HISTORY),
        help="Path to player_history.json",
    )
    parser.add_argument(
        "--output",
        default=str(DEFAULT_OUTPUT),
        help="Path for projections.json",
    )
    args = parser.parse_args()

    history_path = Path(args.history)
    output_path = Path(args.output)

    if not history_path.exists():
        raise SystemExit(
            f"Historical dataset not found: {history_path}\n"
            "Run scripts/build_player_history.py first."
        )

    history = json.loads(history_path.read_text(encoding="utf-8"))

    frame, seasons = build_transition_frame(history)

    latest_entry = seasons[-1]
    previous_entry = seasons[-2] if len(seasons) >= 2 else None

    latest_season = latest_entry["season"]
    projection_season = next_season(latest_season)

    observed_target_seasons = sorted(
        frame["targetSeason"].unique(),
        key=season_start,
    )

    holdout_season = observed_target_seasons[-1]

    print("PlayerMatch V5 projection training")
    print(f"Historical seasons: {[entry['season'] for entry in seasons]}")
    print(f"Training examples: {len(frame)}")
    print(f"Final holdout season: {holdout_season}")
    print(f"Projection season: {projection_season}")

    evaluation: dict[str, dict] = {}
    final_models: dict[str, object | None] = {}

    for target in TARGETS:
        print(f"\n=== {TARGETS[target]['label']} ===")

        result, estimator = fit_and_evaluate_target(
            frame,
            target,
            holdout_season,
        )

        evaluation[target] = result
        final_models[target] = estimator

        print(
            f"Selected: {result['selectedModel']} | "
            f"holdout MAE {result['holdout']['selected']['mae']:.3f} | "
            f"baseline MAE {result['holdout']['baseline']['mae']:.3f}"
        )

        selection = result["selection"]

        if selection["selectedBySimplicityRule"]:
            print(
                "Simplicity rule: "
                f"{result['selectedModel']} selected instead of "
                f"{selection['bestValidationModel']} because it was "
                f"within {selection['tolerancePct']:.1f}% of the "
                "best validation MAE."
            )

        top_scorers = next(
            row
            for row in result["diagnostics"]["dimensions"][
                "scoringLevel"
            ]["groups"]
            if row["key"] == "top"
        )

        print(
            "Top-scoring decile holdout: "
            f"n={top_scorers['sampleCount']} | "
            f"model MAE {top_scorers['selectedMAE']:.3f} | "
            f"baseline MAE {top_scorers['baselineMAE']:.3f} | "
            f"signed error {top_scorers['meanSignedError']:+.3f} | "
            f"avg projection change "
            f"{top_scorers['meanProjectionChange']:+.3f}"
        )

    feature_frame, current_players = current_feature_frame(
        latest_entry,
        previous_entry,
        seasons,
    )

    predictions_by_target: dict[str, np.ndarray] = {}

    for target, config in TARGETS.items():
        selected_name = evaluation[target]["selectedModel"]
        estimator = final_models[target]

        predicted = model_predictions(
            selected_name,
            estimator,
            feature_frame,
            target,
        )

        predictions_by_target[target] = np.clip(
            predicted,
            config["min"],
            config["max"],
        )

    player_rows = []

    for index, player in enumerate(current_players):
        projection_payload = {}

        for target, config in TARGETS.items():
            current_value = numeric(player, target)
            projected_value = float(predictions_by_target[target][index])
            error_band = evaluation[target]["historicalErrorBand80"]

            projection_payload[target] = {
                "current": round(current_value, 2),
                "projected": round(projected_value, 2),
                "change": round(projected_value - current_value, 2),
                "direction": projection_direction(
                    current_value,
                    projected_value,
                    config["directionThreshold"],
                ),
                "historicalErrorBand80": round(error_band, 2),
                "model": evaluation[target]["selectedModel"],
            }

        player_rows.append(
            {
                "id": int(player["id"]),
                "name": player.get("name", ""),
                "team": player.get("team", ""),
                "position": player.get("position", ""),
                "positionGroup": player.get("positionGroup", "Unknown"),
                "age": numeric(player, "age"),
                "sourceSeason": latest_season,
                "projectionSeason": projection_season,
                "projections": projection_payload,
            }
        )

    payload = {
        "meta": {
            "generatedAt": datetime.now(timezone.utc).isoformat(),
            "source": "PlayerMatch historical NBA Stats dataset",
            "sourceSeason": latest_season,
            "projectionSeason": projection_season,
            "holdoutSeason": holdout_season,
            "targets": list(TARGETS.keys()),
            "trainingExampleCount": int(len(frame)),
            "featureCount": len(FEATURE_COLUMNS),
            "trainingTargetSeasons": observed_target_seasons,
            "evaluationDesign": (
                "Model family selected with expanding-window validation "
                "and a 2% simplicity tolerance; the latest observed target "
                "season is held out for final evaluation. Holdout performance "
                "is also reported across scoring-level, age and minutes groups."
            ),
            "limitations": [
                "Historical relationships may not persist into the projection season.",
                "The model does not directly include injuries, transactions, coaching changes, lineup context, contract incentives or playoff role.",
                "Training transitions require a player to remain eligible in the following season, creating survivorship/availability bias.",
                "The historical error band is an empirical prediction-error summary, not a formal statistical confidence interval.",
                "Subgroup holdout diagnostics are descriptive and are not statistical significance tests.",
            ],
        },
        "evaluation": evaluation,
        "players": player_rows,
    }

    output_path.parent.mkdir(parents=True, exist_ok=True)
    output_path.write_text(
        json.dumps(payload, indent=2),
        encoding="utf-8",
    )

    print("\n=== Complete ===")
    print(f"Saved projections for {len(player_rows)} players")
    print(f"Output: {output_path}")


if __name__ == "__main__":
    main()
