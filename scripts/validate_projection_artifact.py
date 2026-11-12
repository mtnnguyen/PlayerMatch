"""Validate every player in a committed projection artifact, without network access."""
from __future__ import annotations

import argparse
import json
import math
from pathlib import Path

TARGETS = {"pts", "reb", "ast", "tsPct", "usage"}
FIELDS = ("current", "projected", "change", "historicalErrorBand80")


def validate_artifact(payload: dict) -> list[str]:
    errors = []
    if not isinstance(payload, dict):
        return ["artifact must be an object"]
    meta = payload.get("meta")
    targets = meta.get("targets") if isinstance(meta, dict) else None
    if not isinstance(targets, list) or any(not isinstance(target, str) for target in targets) or len(targets) != len(TARGETS) or set(targets) != TARGETS:
        errors.append("meta.targets must contain exactly the five projection targets")
    evaluation = payload.get("evaluation")
    if not isinstance(evaluation, dict) or set(evaluation) != TARGETS:
        errors.append("evaluation must contain exactly the five projection targets")
    players = payload.get("players")
    if not isinstance(players, list) or not players:
        return errors + ["players must be a nonempty list"]
    seen = set()
    for index, player in enumerate(players):
        where = f"players[{index}]"
        if not isinstance(player, dict):
            errors.append(f"{where}: player must be an object")
            continue
        player_id = player.get("id")
        name = player.get("name")
        where += f" ({name or 'unnamed'}, id={player_id})"
        if not isinstance(player_id, int) or isinstance(player_id, bool):
            errors.append(f"{where}: id must be an integer")
        elif player_id in seen:
            errors.append(f"{where}: duplicate id")
        else:
            seen.add(player_id)
        if not isinstance(name, str) or not name.strip():
            errors.append(f"{where}: name is required")
        rows = player.get("projections")
        if not isinstance(rows, dict):
            errors.append(f"{where}: projections must be an object")
            continue
        for target in sorted(TARGETS):
            row = rows.get(target)
            if not isinstance(row, dict):
                errors.append(f"{where}.{target}: projection is required")
                continue
            for field in FIELDS:
                value = row.get(field)
                numeric = isinstance(value, (int, float)) and not isinstance(value, bool)
                if not numeric or not math.isfinite(value):
                    errors.append(f"{where}.{target}.{field}: finite number is required")
                elif field == "historicalErrorBand80" and value < 0:
                    errors.append(f"{where}.{target}.{field}: error magnitude cannot be negative")
    return errors


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("path", nargs="?", type=Path,
                        default=Path(__file__).resolve().parents[1] / "public/projections.json")
    args = parser.parse_args()
    try:
        payload = json.loads(args.path.read_text(encoding="utf-8"))
    except (OSError, ValueError) as error:
        parser.exit(1, f"Cannot read projection artifact: {error}\n")
    errors = validate_artifact(payload)
    if errors:
        parser.exit(1, "\n".join(errors) + "\n")
    print(f"Validated {len(payload['players'])} players × {len(TARGETS)} targets.")


if __name__ == "__main__":
    main()
