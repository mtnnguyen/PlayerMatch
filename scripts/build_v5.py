"""
One-command PlayerMatch V5 data build.

Runs:
    1. build_player_history.py
    2. train_projection_models.py

Usage:
    python scripts/build_v5.py

If player_history.json is already current and you only want to retrain models:
    python scripts/build_v5.py --skip-history
"""

from __future__ import annotations

import argparse
import subprocess
import sys
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]
SCRIPTS = ROOT / "scripts"


def run(script: str) -> None:
    command = [
        sys.executable,
        str(SCRIPTS / script),
    ]

    print("\n>", " ".join(command))
    subprocess.run(
        command,
        cwd=ROOT,
        check=True,
    )


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument(
        "--skip-history",
        action="store_true",
        help="Reuse public/player_history.json and only retrain projections.",
    )
    args = parser.parse_args()

    if not args.skip_history:
        run("build_player_history.py")

    run("train_projection_models.py")

    print("\nPlayerMatch V5 data build complete.")
    print("Generated:")
    print("  public/players.json")
    print("  public/player_history.json")
    print("  public/projections.json")


if __name__ == "__main__":
    main()
