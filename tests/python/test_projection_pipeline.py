from __future__ import annotations

import importlib.util
import json
import math
import sys
import unittest
from pathlib import Path

import pandas as pd


ROOT = Path(__file__).resolve().parents[2]
MODULE_PATH = ROOT / "scripts" / "train_projection_models.py"

spec = importlib.util.spec_from_file_location(
    "player_match_projection_training",
    MODULE_PATH,
)

projection_training = importlib.util.module_from_spec(spec)
sys.modules[spec.name] = projection_training
assert spec.loader is not None
spec.loader.exec_module(projection_training)


def player(
    player_id: int,
    *,
    pts: float,
    reb: float = 5.0,
    ast: float = 4.0,
    age: float = 25.0,
    minutes: float = 30.0,
    gp: float = 70.0,
) -> dict:
    return {
        "id": player_id,
        "name": f"Player {player_id}",
        "team": "TST",
        "position": "G",
        "positionGroup": "Guard",
        "age": age,
        "min": minutes,
        "gp": gp,
        "pts": pts,
        "reb": reb,
        "ast": ast,
        "stl": 1.0,
        "blk": 0.5,
        "fgPct": 48.0,
        "threePct": 36.0,
        "ftPct": 80.0,
        "usage": 25.0,
        "tsPct": 58.0,
    }


class ProjectionPipelineTests(unittest.TestCase):
    def test_next_season_rolls_forward(self):
        self.assertEqual(
            projection_training.next_season(
                "2025-26"
            ),
            "2026-27",
        )

    def test_history_is_sorted_chronologically(self):
        history = {
            "seasons": [
                {
                    "season": "2024-25",
                    "players": [],
                },
                {
                    "season": "2022-23",
                    "players": [],
                },
                {
                    "season": "2023-24",
                    "players": [],
                },
            ]
        }

        seasons = (
            projection_training.sorted_seasons(
                history
            )
        )

        self.assertEqual(
            [
                row["season"]
                for row in seasons
            ],
            [
                "2022-23",
                "2023-24",
                "2024-25",
            ],
        )

    def test_transition_features_do_not_use_future_target_values(self):
        history = {
            "seasons": [
                {
                    "season": "2022-23",
                    "players": [
                        player(
                            1,
                            pts=10.0,
                        )
                    ],
                },
                {
                    "season": "2023-24",
                    "players": [
                        player(
                            1,
                            pts=20.0,
                        )
                    ],
                },
                {
                    "season": "2024-25",
                    "players": [
                        player(
                            1,
                            pts=35.0,
                        )
                    ],
                },
            ]
        }

        frame, _ = (
            projection_training
            .build_transition_frame(
                history
            )
        )

        row = frame[
            (
                frame["sourceSeason"]
                == "2023-24"
            )
            & (
                frame["targetSeason"]
                == "2024-25"
            )
        ].iloc[0]

        self.assertEqual(
            row["current_pts"],
            20.0,
        )

        self.assertEqual(
            row["target_pts"],
            35.0,
        )

        self.assertEqual(
            row["delta_pts"],
            10.0,
        )

        self.assertNotEqual(
            row["current_pts"],
            row["target_pts"],
        )

    def test_final_holdout_is_excluded_from_model_selection_frame(self):
        frame = pd.DataFrame(
            {
                "targetSeason": [
                    "2023-24",
                    "2024-25",
                    "2025-26",
                    "2025-26",
                ],
                "value": [
                    1,
                    2,
                    3,
                    4,
                ],
            }
        )

        pre_holdout, holdout = (
            projection_training
            .split_holdout_frame(
                frame,
                "2025-26",
            )
        )

        self.assertEqual(
            set(
                pre_holdout[
                    "targetSeason"
                ]
            ),
            {
                "2023-24",
                "2024-25",
            },
        )

        self.assertEqual(
            set(
                holdout[
                    "targetSeason"
                ]
            ),
            {"2025-26"},
        )

        self.assertTrue(
            (
                pre_holdout[
                    "targetSeason"
                ]
                != "2025-26"
            ).all()
        )

    def test_simplicity_rule_prefers_simpler_model_inside_tolerance(self):
        Result = (
            projection_training
            .ModelResult
        )

        results = [
            Result(
                name="Baseline",
                estimator=None,
                validation_mae=1.08,
                validation_rmse=1.1,
                validation_residuals=[],
            ),
            Result(
                name="Ridge",
                estimator=None,
                validation_mae=1.00,
                validation_rmse=1.05,
                validation_residuals=[],
            ),
            Result(
                name="Gradient Boosting",
                estimator=None,
                validation_mae=0.99,
                validation_rmse=1.04,
                validation_residuals=[],
            ),
        ]

        selected, best, eligible, cutoff = (
            projection_training
            .select_validation_model(
                results
            )
        )

        self.assertEqual(
            best.name,
            "Gradient Boosting",
        )

        self.assertEqual(
            selected.name,
            "Ridge",
        )

        self.assertIn(
            "Ridge",
            [
                row.name
                for row in eligible
            ],
        )

        self.assertGreater(
            cutoff,
            best.validation_mae,
        )

    def test_baseline_can_win_when_it_is_inside_simplicity_tolerance(self):
        Result = (
            projection_training
            .ModelResult
        )

        results = [
            Result(
                name="Baseline",
                estimator=None,
                validation_mae=1.01,
                validation_rmse=1.1,
                validation_residuals=[],
            ),
            Result(
                name="Ridge",
                estimator=None,
                validation_mae=1.00,
                validation_rmse=1.05,
                validation_residuals=[],
            ),
            Result(
                name="Gradient Boosting",
                estimator=None,
                validation_mae=0.995,
                validation_rmse=1.04,
                validation_residuals=[],
            ),
        ]

        selected, _, _, _ = (
            projection_training
            .select_validation_model(
                results
            )
        )

        self.assertEqual(
            selected.name,
            "Baseline",
        )


class ProjectionArtifactTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        path = (
            ROOT
            / "public"
            / "projections.json"
        )

        cls.payload = json.loads(
            path.read_text(
                encoding="utf-8"
            )
        )

    def test_projection_artifact_has_expected_targets(self):
        expected = {
            "pts",
            "reb",
            "ast",
            "tsPct",
            "usage",
        }

        self.assertEqual(
            set(
                self.payload[
                    "meta"
                ]["targets"]
            ),
            expected,
        )

        self.assertEqual(
            set(
                self.payload[
                    "evaluation"
                ].keys()
            ),
            expected,
        )

    def test_projection_evaluation_contains_holdout_and_diagnostics(self):
        for target, row in (
            self.payload[
                "evaluation"
            ].items()
        ):
            with self.subTest(
                target=target
            ):
                self.assertIn(
                    "selectedModel",
                    row,
                )

                self.assertGreater(
                    row["holdout"][
                        "selected"
                    ]["sampleCount"],
                    0,
                )

                self.assertGreaterEqual(
                    row[
                        "historicalErrorBand80"
                    ],
                    0,
                )

                dimensions = (
                    row[
                        "diagnostics"
                    ]["dimensions"]
                )

                self.assertEqual(
                    set(
                        dimensions.keys()
                    ),
                    {
                        "scoringLevel",
                        "age",
                        "minutes",
                    },
                )

    def test_player_projection_values_are_finite(self):
        targets = (
            self.payload[
                "meta"
            ]["targets"]
        )

        players = (
            self.payload[
                "players"
            ][:25]
        )

        self.assertGreater(
            len(players),
            0,
        )

        for row in players:
            for target in targets:
                projection = (
                    row[
                        "projections"
                    ][target]
                )

                for key in [
                    "current",
                    "projected",
                    "change",
                    "historicalErrorBand80",
                ]:
                    with self.subTest(
                        player=row["name"],
                        target=target,
                        field=key,
                    ):
                        self.assertTrue(
                            math.isfinite(
                                float(
                                    projection[
                                        key
                                    ]
                                )
                            )
                        )


if __name__ == "__main__":
    unittest.main()
