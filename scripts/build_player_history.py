r"""
Build PlayerMatch multi-season data from the NBA Stats API.

This script writes:

    public/players.json
        The latest/current season in the existing PlayerMatch schema.

    public/player_history.json
        Multiple seasons in the same player schema for historical analysis.

Recommended first run from the project root:

    .\.venv\Scripts\Activate.ps1
    pip install -r requirements.txt
    python scripts/build_player_history.py

Optional custom seasons:

    python scripts/build_player_history.py ^
        --seasons 2021-22 2022-23 2023-24 2024-25 2025-26 ^
        --current-season 2025-26 ^
        --min-games 15 ^
        --min-minutes 10

The NBA Stats API can occasionally throttle or time out. The script retries each
request and pauses between calls to reduce pressure on the endpoint.
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
PUBLIC = ROOT / "public"
CURRENT_OUTPUT = PUBLIC / "players.json"
HISTORY_OUTPUT = PUBLIC / "player_history.json"

DEFAULT_SEASONS = [
    "2020-21",
    "2021-22",
    "2022-23",
    "2023-24",
    "2024-25",
    "2025-26",
]

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


def request_with_retry(label, fn, attempts: int = 4):
    last_error = None

    for attempt in range(1, attempts + 1):
        try:
            print(f"{label} (attempt {attempt}/{attempts})...")
            return fn()
        except Exception as exc:  # noqa: BLE001
            last_error = exc

            if attempt < attempts:
                wait_seconds = attempt * 5
                print(
                    f"Request failed: {exc}\n"
                    f"Retrying in {wait_seconds}s..."
                )
                time.sleep(wait_seconds)

    raise RuntimeError(
        f"{label} failed after {attempts} attempts: {last_error}"
    )


def fetch_player_stats(
    season: str,
    per_mode: str,
    measure_type: str = "Base",
) -> pd.DataFrame:
    return request_with_retry(
        f"Fetching {season} · {measure_type} · {per_mode}",
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
        f"Fetching {season} · player positions",
        lambda: playerindex.PlayerIndex(
            season=season,
            timeout=60,
        ).get_data_frames()[0],
    )


def require_columns(frame: pd.DataFrame, columns: list[str], label: str) -> None:
    missing = [column for column in columns if column not in frame.columns]

    if missing:
        raise RuntimeError(
            f"{label} response is missing expected columns: {missing}"
        )


def broad_position(position: str) -> str:
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


def prepare_numeric(frame: pd.DataFrame) -> pd.DataFrame:
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

    for column in numeric_columns:
        if column in frame.columns:
            frame[column] = pd.to_numeric(
                frame[column],
                errors="coerce",
            )

    return frame


def build_season(
    season: str,
    min_games: int,
    min_minutes: float,
    request_delay: float,
) -> dict:
    print(f"\n=== Building {season} ===")

    per_game = fetch_player_stats(season, "PerGame", "Base")
    time.sleep(request_delay)

    per_36 = fetch_player_stats(season, "Per36", "Base")
    time.sleep(request_delay)

    per_100 = fetch_player_stats(
        season,
        "Per100Possessions",
        "Base",
    )
    time.sleep(request_delay)

    advanced = fetch_player_stats(season, "PerGame", "Advanced")
    time.sleep(request_delay)

    positions = fetch_player_index(season)

    require_columns(per_game, BASE_COLUMNS, f"{season} PerGame")
    require_columns(per_36, BASE_COLUMNS, f"{season} Per36")
    require_columns(per_100, BASE_COLUMNS, f"{season} Per100")
    require_columns(advanced, ADVANCED_COLUMNS, f"{season} Advanced")
    require_columns(positions, POSITION_COLUMNS, f"{season} PlayerIndex")

    per_game = prepare_numeric(per_game[BASE_COLUMNS].copy())
    per_36 = prepare_numeric(per_36[BASE_COLUMNS].copy())
    per_100 = prepare_numeric(per_100[BASE_COLUMNS].copy())

    advanced = advanced[ADVANCED_COLUMNS].copy()

    for column in ["PLAYER_ID", "USG_PCT", "TS_PCT"]:
        advanced[column] = pd.to_numeric(
            advanced[column],
            errors="coerce",
        )

    positions = (
        positions[POSITION_COLUMNS]
        .drop_duplicates(subset=["PERSON_ID"])
        .rename(columns={"PERSON_ID": "PLAYER_ID"})
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

    eligible = eligible.fillna(
        {
            "USG_PCT": 0,
            "TS_PCT": 0,
            "POSITION": "",
            "HEIGHT": "",
            "WEIGHT": "",
        }
    )

    per_36_lookup = per_36.set_index("PLAYER_ID")
    per_100_lookup = per_100.set_index("PLAYER_ID")
    advanced_lookup = advanced.set_index("PLAYER_ID")

    eligible = eligible.sort_values(
        ["PTS", "MIN"],
        ascending=[False, False],
    )

    records = []

    for _, row in eligible.iterrows():
        player_id = int(row["PLAYER_ID"])

        if (
            player_id not in per_36_lookup.index
            or player_id not in per_100_lookup.index
        ):
            continue

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

        per_game_stats = stats_object(row, adv_row)
        per_36_stats = stats_object(p36_row, adv_row)
        per_100_stats = stats_object(p100_row, adv_row)

        position = str(row.get("POSITION", "") or "").strip()

        records.append(
            {
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
                **per_game_stats,
            }
        )

    print(f"{season}: {len(records)} eligible players")

    return {
        "season": season,
        "playerCount": len(records),
        "players": records,
    }


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument(
        "--seasons",
        nargs="+",
        default=DEFAULT_SEASONS,
        help="Space-separated NBA seasons, oldest to newest.",
    )
    parser.add_argument(
        "--current-season",
        default="2025-26",
        help="Season to also write to public/players.json.",
    )
    parser.add_argument("--min-games", type=int, default=15)
    parser.add_argument("--min-minutes", type=float, default=10)
    parser.add_argument(
        "--request-delay",
        type=float,
        default=1.25,
        help="Seconds to pause between NBA Stats API calls.",
    )
    args = parser.parse_args()

    if args.current_season not in args.seasons:
        raise SystemExit(
            "--current-season must also appear in --seasons."
        )

    generated_at = datetime.now(timezone.utc).isoformat()

    season_payloads = []

    for season in args.seasons:
        season_payloads.append(
            build_season(
                season=season,
                min_games=args.min_games,
                min_minutes=args.min_minutes,
                request_delay=args.request_delay,
            )
        )

        time.sleep(args.request_delay)

    history_payload = {
        "meta": {
            "source": "NBA Stats API",
            "generatedAt": generated_at,
            "seasons": args.seasons,
            "currentSeason": args.current_season,
            "seasonCount": len(args.seasons),
            "minimumGames": args.min_games,
            "minimumMinutesPerGame": args.min_minutes,
            "statBases": [
                "perGame",
                "per36",
                "per100",
            ],
        },
        "seasons": season_payloads,
    }

    current = next(
        season
        for season in season_payloads
        if season["season"] == args.current_season
    )

    current_payload = {
        "meta": {
            "season": current["season"],
            "source": "NBA Stats API",
            "demo": False,
            "generatedAt": generated_at,
            "minimumGames": args.min_games,
            "minimumMinutesPerGame": args.min_minutes,
            "playerCount": current["playerCount"],
            "statBases": [
                "perGame",
                "per36",
                "per100",
            ],
        },
        "players": current["players"],
    }

    PUBLIC.mkdir(parents=True, exist_ok=True)

    HISTORY_OUTPUT.write_text(
        json.dumps(history_payload, indent=2),
        encoding="utf-8",
    )

    CURRENT_OUTPUT.write_text(
        json.dumps(current_payload, indent=2),
        encoding="utf-8",
    )

    print("\n=== Complete ===")
    print(
        f"Saved {len(season_payloads)} seasons to {HISTORY_OUTPUT}"
    )
    print(
        f"Saved {current['playerCount']} current players to {CURRENT_OUTPUT}"
    )
    print(
        "Historical file size: "
        f"{HISTORY_OUTPUT.stat().st_size / 1024 / 1024:.2f} MB"
    )


if __name__ == "__main__":
    main()
