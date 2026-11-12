"""Compare a rebuild with the committed artifact, ignoring only its generation timestamp."""
import argparse
import json
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]


def without_timestamp(path):
    payload = json.loads(path.read_text(encoding="utf-8"))
    payload["meta"].pop("generatedAt", None)
    return payload


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("rebuilt", type=Path)
    parser.add_argument("--reference", type=Path, default=ROOT / "public/projections.json")
    args = parser.parse_args()
    if without_timestamp(args.reference) != without_timestamp(args.rebuilt):
        parser.exit(1, "Rebuild differs beyond meta.generatedAt. Inspect outputs; do not overwrite published results.\n")
    print("Exact match for every field except meta.generatedAt.")


if __name__ == "__main__":
    main()
