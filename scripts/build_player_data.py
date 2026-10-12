r"""
Build PlayerMatch V2 player data.

V2 adds:
- player position / broad position group
- per-game stats
- per-36 stats
- per-100-possession stats
- age / height / weight metadata
- the original flat per-game fields for backwards compatibility

Run from the project root:

    .\.venv\Scripts\Activate.ps1
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
from nba_api.stats.endpoints import leaguedashplayerstats, playerindex


ROOT = Path(__file__).resolve().parents[1]
OUTPUT = ROOT / "public" / "players.json"


BASE_COLUMNS = [
    "PLAYER_ID",
    "PLAYER_NAME",
    "TEAM_ABBREVIATION",
    "AGE",
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

ADVANCED_COLUMNS = [
    "PLAYER_ID",
    "USG_PCT",
    "TS_PCT",
]

POSITION_COLUMNS = [
    "PERSON_ID",
    "POSITION",
    "HEIGHT",
    "WEIGHT",
]


def request_with_retry(label, fn):
    last_error = None

    for attempt in range(1, 4):
        try:
            print(f"{label} (attempt {attempt}/3)...")
            return fn()
        except Exception as exc:  # noqa: BLE001
            last_error = exc

            if attempt < 3:
                wait_seconds = attempt * 5
                print(
                    f"Request failed: {exc}\n"
                    f"Retrying in {wait_seconds}s..."
                )
                time.sleep(wait_seconds)

    raise RuntimeError(
        f"{label} failed after 3 attempts: {last_error}"
    )


def fetch_player_stats(
    season: str,
    per_mode: str,
    measure_type: str = "Base",
) -> pd.DataFrame:
    return request_with_retry(
        f"Fetching {measure_type} / {per_mode} stats for {season}",
        lambda: leaguedashplayerstats.LeagueDashPlayerStats(
            season=season,
            season_type_all_star="Regular Season",
            per_mode_detailed=per_mode,
            measure_type_detailed_defense=measure_type,
            timeout=60,
        ).get_data_frames()[0],
    )


def fetch_player_index(season: str) -> pd.DataFrame:
    return request_with_retry(
        f"Fetching player positions for {season}",
        lambda: playerindex.PlayerIndex(
            season=season,
            timeout=60,
        ).get_data_frames()[0],
    )


def broad_position(position: str) -> str:
    """
    Convert NBA position labels into a simple UI grouping.

    Examples handled:
    G / Guard -> Guard
    G-F / Guard-Forward -> Wing
    F / Forward -> Wing
    F-C / C-F / Forward-Center / Center-Forward -> Big
    C / Center -> Big
    """
    value = (position or "").strip().upper()

    if not value:
        return "Unknown"

    normalized = (
        value.replace("GUARD", "G")
        .replace("FORWARD", "F")
        .replace("CENTER", "C")
        .replace(" ", "")
    )

    if normalized in {"G", "PG", "SG"}:
        return "Guard"

    if normalized in {"F", "SF", "PF", "G-F", "F-G", "GF", "FG"}:
        return "Wing"

    if normalized in {
        "C",
        "F-C",
        "C-F",
        "FC",
        "CF",
        "PF-C",
        "C-PF",
    }:
        return "Big"

    if "C" in normalized and "G" not in normalized:
        return "Big"

    if "F" in normalized:
        return "Wing"

    if "G" in normalized:
        return "Guard"

    return "Unknown"


def percent(value) -> float:
    return round(float(value or 0) * 100, 1)


def round_stat(value) -> float:
    return round(float(value or 0), 1)


def stats_object(row: pd.Series, advanced_row: pd.Series) -> dict:
    return {
        "pts": round_stat(row["PTS"]),
        "reb": round_stat(row["REB"]),
        "ast": round_stat(row["AST"]),
        "stl": round_stat(row["STL"]),
        "blk": round_stat(row["BLK"]),
        "fgPct": percent(row["FG_PCT"]),
        "threePct": percent(row["FG3_PCT"]),
        "ftPct": percent(row["FT_PCT"]),
        "usage": percent(advanced_row["USG_PCT"]),
        "tsPct": percent(advanced_row["TS_PCT"]),
    }


def require_columns(frame: pd.DataFrame, columns: list[str], label: str) -> None:
    missing = [column for column in columns if column not in frame.columns]

    if missing:
        raise RuntimeError(
            f"{label} response is missing expected columns: {missing}"
        )


def build_dataset(
    season: str,
    min_games: int,
    min_minutes: float,
) -> dict:
    per_game = fetch_player_stats(season, "PerGame", "Base")
    time.sleep(1.2)

    per_36 = fetch_player_stats(season, "Per36", "Base")
    time.sleep(1.2)

    per_100 = fetch_player_stats(
        season,
        "Per100Possessions",
        "Base",
    )
    time.sleep(1.2)

    advanced = fetch_player_stats(season, "PerGame", "Advanced")
    time.sleep(1.2)

    positions = fetch_player_index(season)

    require_columns(per_game, BASE_COLUMNS, "PerGame")
    require_columns(per_36, BASE_COLUMNS, "Per36")
    require_columns(per_100, BASE_COLUMNS, "Per100Possessions")
    require_columns(advanced, ADVANCED_COLUMNS, "Advanced")
    require_columns(positions, POSITION_COLUMNS, "PlayerIndex")

    per_game = per_game[BASE_COLUMNS].copy()
    per_36 = per_36[BASE_COLUMNS].copy()
    per_100 = per_100[BASE_COLUMNS].copy()
    advanced = advanced[ADVANCED_COLUMNS].copy()

    positions = (
        positions[POSITION_COLUMNS]
        .drop_duplicates(subset=["PERSON_ID"])
        .rename(columns={"PERSON_ID": "PLAYER_ID"})
    )

    numeric_columns = [
        "PLAYER_ID",
        "AGE",
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

    for frame in [per_game, per_36, per_100]:
        for column in numeric_columns:
            if column in frame.columns:
                frame[column] = pd.to_numeric(
                    frame[column],
                    errors="coerce",
                )

    for column in ["PLAYER_ID", "USG_PCT", "TS_PCT"]:
        advanced[column] = pd.to_numeric(
            advanced[column],
            errors="coerce",
        )

    positions["PLAYER_ID"] = pd.to_numeric(
        positions["PLAYER_ID"],
        errors="coerce",
    )

    eligible = per_game[
        (per_game["GP"] >= min_games)
        & (per_game["MIN"] >= min_minutes)
    ].copy()

    eligible = eligible.merge(
        advanced,
        on="PLAYER_ID",
        how="left",
    ).merge(
        positions,
        on="PLAYER_ID",
        how="left",
    )

    per_36_lookup = per_36.set_index("PLAYER_ID")
    per_100_lookup = per_100.set_index("PLAYER_ID")
    advanced_lookup = advanced.set_index("PLAYER_ID")

    eligible = eligible.fillna(
        {
            "USG_PCT": 0,
            "TS_PCT": 0,
            "POSITION": "",
            "HEIGHT": "",
            "WEIGHT": "",
        }
    )

    eligible = eligible.sort_values(
        ["PTS", "MIN"],
        ascending=[False, False],
    )

    records = []

    for _, row in eligible.iterrows():
        player_id = int(row["PLAYER_ID"])

        if player_id not in per_36_lookup.index:
            continue

        if player_id not in per_100_lookup.index:
            continue

        pg_row = row
        p36_row = per_36_lookup.loc[player_id]
        p100_row = per_100_lookup.loc[player_id]

        if isinstance(p36_row, pd.DataFrame):
            p36_row = p36_row.iloc[0]

        if isinstance(p100_row, pd.DataFrame):
            p100_row = p100_row.iloc[0]

        if player_id in advanced_lookup.index:
            adv_row = advanced_lookup.loc[player_id]

            if isinstance(adv_row, pd.DataFrame):
                adv_row = adv_row.iloc[0]
        else:
            adv_row = pd.Series(
                {
                    "USG_PCT": 0,
                    "TS_PCT": 0,
                }
            )

        per_game_stats = stats_object(pg_row, adv_row)
        per_36_stats = stats_object(p36_row, adv_row)
        per_100_stats = stats_object(p100_row, adv_row)

        position = str(row.get("POSITION", "") or "").strip()

        record = {
            "id": player_id,
            "name": str(row["PLAYER_NAME"]),
            "team": str(row["TEAM_ABBREVIATION"]),
            "position": position or "—",
            "positionGroup": broad_position(position),
            "age": round_stat(row["AGE"]),
            "height": str(row.get("HEIGHT", "") or ""),
            "weight": str(row.get("WEIGHT", "") or ""),
            "gp": int(row["GP"]),
            "min": round_stat(row["MIN"]),
            "stats": {
                "perGame": per_game_stats,
                "per36": per_36_stats,
                "per100": per_100_stats,
            },
            # Backwards-compatible V1 fields.
            **per_game_stats,
        }

        records.append(record)

    return {
        "meta": {
            "season": season,
            "source": "NBA Stats API",
            "demo": False,
            "generatedAt": datetime.now(timezone.utc).isoformat(),
            "minimumGames": min_games,
            "minimumMinutesPerGame": min_minutes,
            "playerCount": len(records),
            "statBases": [
                "perGame",
                "per36",
                "per100",
            ],
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
        f"Saved {len(payload['players'])} V2 players to {OUTPUT}"
    )


if __name__ == "__main__":
    main()
