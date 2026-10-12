r"""
Build public/players.json from the NBA Stats API.

Run from the project root:

    python -m venv .venv
    .\.venv\Scripts\Activate.ps1
    pip install -r requirements.txt
    python scripts/build_player_data.py

Optional:

    python scripts/build_player_data.py --season 2025-26 --min-games 15 --min-minutes 10
"""

from __future__ import annotations

import argparse
import json
import time
from datetime import datetime, timezone
from pathlib import Path

import pandas as pd
from nba_api.stats.endpoints import leaguedashplayerstats


ROOT = Path(__file__).resolve().parents[1]
OUTPUT = ROOT / "public" / "players.json"


def fetch_stats(season: str, measure_type: str) -> pd.DataFrame:
    """Fetch a LeagueDashPlayerStats table with a small retry loop."""
    last_error = None

    for attempt in range(1, 4):
        try:
            print(
                f"Fetching {measure_type} stats for {season} "
                f"(attempt {attempt}/3)..."
            )

            endpoint = leaguedashplayerstats.LeagueDashPlayerStats(
                season=season,
                season_type_all_star="Regular Season",
                per_mode_detailed="PerGame",
                measure_type_detailed_defense=measure_type,
                timeout=60,
            )

            return endpoint.get_data_frames()[0]

        except Exception as exc:  # noqa: BLE001
            last_error = exc
            if attempt < 3:
                wait_seconds = attempt * 4
                print(f"Request failed. Retrying in {wait_seconds}s...")
                time.sleep(wait_seconds)

    raise RuntimeError(
        f"NBA Stats API request failed after 3 attempts: {last_error}"
    )


def build_dataset(
    season: str,
    min_games: int,
    min_minutes: float,
) -> dict:
    base = fetch_stats(season, "Base")
    time.sleep(1.5)
    advanced = fetch_stats(season, "Advanced")

    base_columns = [
        "PLAYER_ID",
        "PLAYER_NAME",
        "TEAM_ABBREVIATION",
        "GP",
        "MIN",
        "PTS",
        "REB",
        "AST",
        "STL",
        "BLK",
        "FG_PCT",
        "FG3_PCT",
        "FT_PCT",
    ]

    advanced_columns = [
        "PLAYER_ID",
        "USG_PCT",
        "TS_PCT",
    ]

    missing_base = [column for column in base_columns if column not in base.columns]
    missing_advanced = [
        column for column in advanced_columns if column not in advanced.columns
    ]

    if missing_base:
        raise RuntimeError(f"Missing Base columns: {missing_base}")

    if missing_advanced:
        raise RuntimeError(f"Missing Advanced columns: {missing_advanced}")

    players = base[base_columns].merge(
        advanced[advanced_columns],
        on="PLAYER_ID",
        how="left",
    )

    numeric_columns = [
        "GP",
        "MIN",
        "PTS",
        "REB",
        "AST",
        "STL",
        "BLK",
        "FG_PCT",
        "FG3_PCT",
        "FT_PCT",
        "USG_PCT",
        "TS_PCT",
    ]

    for column in numeric_columns:
        players[column] = pd.to_numeric(players[column], errors="coerce")

    players = players[
        (players["GP"] >= min_games)
        & (players["MIN"] >= min_minutes)
    ].copy()

    players = players.fillna(0)
    players = players.sort_values(
        ["PTS", "MIN"],
        ascending=[False, False],
    )

    records = []

    for _, row in players.iterrows():
        records.append(
            {
                "id": int(row["PLAYER_ID"]),
                "name": str(row["PLAYER_NAME"]),
                "team": str(row["TEAM_ABBREVIATION"]),
                "gp": int(row["GP"]),
                "min": round(float(row["MIN"]), 1),
                "pts": round(float(row["PTS"]), 1),
                "reb": round(float(row["REB"]), 1),
                "ast": round(float(row["AST"]), 1),
                "stl": round(float(row["STL"]), 1),
                "blk": round(float(row["BLK"]), 1),
                "fgPct": round(float(row["FG_PCT"]) * 100, 1),
                "threePct": round(float(row["FG3_PCT"]) * 100, 1),
                "ftPct": round(float(row["FT_PCT"]) * 100, 1),
                "usage": round(float(row["USG_PCT"]) * 100, 1),
                "tsPct": round(float(row["TS_PCT"]) * 100, 1),
            }
        )

    return {
        "meta": {
            "season": season,
            "source": "NBA Stats API / LeagueDashPlayerStats",
            "demo": False,
            "generatedAt": datetime.now(timezone.utc).isoformat(),
            "minimumGames": min_games,
            "minimumMinutesPerGame": min_minutes,
            "playerCount": len(records),
        },
        "players": records,
    }


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--season", default="2025-26")
    parser.add_argument("--min-games", type=int, default=15)
    parser.add_argument("--min-minutes", type=float, default=10)
    args = parser.parse_args()

    payload = build_dataset(
        season=args.season,
        min_games=args.min_games,
        min_minutes=args.min_minutes,
    )

    OUTPUT.parent.mkdir(parents=True, exist_ok=True)
    OUTPUT.write_text(
        json.dumps(payload, indent=2),
        encoding="utf-8",
    )

    print(
        f"Saved {len(payload['players'])} players to {OUTPUT}"
    )


if __name__ == "__main__":
    main()
