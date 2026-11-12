"""Build the PlayerMatch case study from the fixed artifact; no API calls or retraining."""
from __future__ import annotations

import argparse
import csv
import hashlib
import json
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
TARGETS = [("pts", "PTS", "PPG"), ("reb", "REB", "RPG"), ("ast", "AST", "APG"),
           ("tsPct", "TS%", "pp"), ("usage", "USG%", "pp")]


def summarize(payload):
    rows = []
    for key, label, unit in TARGETS:
        evaluation = payload["evaluation"][key]
        top = next(group for group in evaluation["diagnostics"]["dimensions"]["scoringLevel"]["groups"] if group["key"] == "top")
        for group, n, model, baseline, signed in [
            ("All eligible", evaluation["holdout"]["selected"]["sampleCount"],
             evaluation["holdout"]["selected"]["mae"], evaluation["holdout"]["baseline"]["mae"], None),
            ("Top 10% scorers", top["sampleCount"], top["selectedMAE"], top["baselineMAE"], top["meanSignedError"]),
        ]:
            rows.append(dict(target=label, unit=unit, group=group, n=n, model=evaluation["selectedModel"],
                             model_mae=model, baseline_mae=baseline,
                             improvement_pct=(baseline - model) / baseline * 100,
                             mean_signed_error=signed))
    return rows


def write_chart(rows, output):
    import matplotlib
    matplotlib.use("Agg")
    import matplotlib.pyplot as plt
    matplotlib.rcParams.update({"font.family": "DejaVu Sans", "svg.fonttype": "none", "svg.hashsalt": "playermatch-case-study"})
    fig, ax = plt.subplots(figsize=(9, 4.8), layout="constrained")
    groups = [("All eligible", "#2f5d8a", -0.18), ("Top 10% scorers", "#ad7845", 0.18)]
    for group, color, offset in groups:
        values = [row["improvement_pct"] for row in rows if row["group"] == group]
        positions = [index + offset for index in range(len(TARGETS))]
        ax.barh(positions, values, height=0.31, color=color, label=group)
        for y, value in zip(positions, values):
            ax.text(value + (0.35 if value >= 0 else -0.35), y, f"{value:+.1f}%",
                    va="center", ha="left" if value >= 0 else "right", fontsize=9)
    ax.set_yticks(range(len(TARGETS)), [label for _, label, _ in TARGETS])
    ax.invert_yaxis()
    ax.axvline(0, color="#333333", linewidth=0.8)
    ax.set_xlim(-17, 17)
    ax.set_xlabel("MAE improvement over persistence (%) · positive means lower error")
    ax.set_title("2025–26 holdout: overall and top-scorer performance", loc="left", pad=24)
    ax.spines[["top", "right", "left"]].set_visible(False)
    ax.legend(loc="upper center", bbox_to_anchor=(0.5, 1.08), ncol=2, frameon=False)
    ax.tick_params(axis="y", length=0)
    fig.savefig(output, metadata={"Date": None})
    plt.close(fig)
    if output.suffix == ".svg":
        output.write_text("\n".join(line.rstrip() for line in output.read_text().splitlines()) + "\n")


def build(source, output):
    raw = source.read_bytes()
    payload = json.loads(raw)
    rows = summarize(payload)
    # This narrative describes a fixed research snapshot. Fail visibly if supplied
    # different evidence rather than attaching stale prose to a new chart.
    # The complete input hash is checked below; the CSV and chart derive their numbers.
    snapshot_hash = "12acfb2c313204dae4a9b3cc60ce81d7254f507a17683691c5d13b26a89ac8d3"
    if hashlib.sha256(raw).hexdigest() != snapshot_hash:
        raise ValueError("This case study describes the fixed committed snapshot. Review and update the narrative before using a different artifact.")
    output.mkdir(parents=True, exist_ok=True)
    with (output / "case-study.csv").open("w", newline="") as handle:
        writer = csv.DictWriter(handle, fieldnames=list(rows[0]), lineterminator="\n")
        writer.writeheader(); writer.writerows(rows)
    write_chart(rows, output / "case-study.svg")
    lines = ["# Does a better average forecast help the NBA's top scorers?", "",
        "PlayerMatch compares next-season NBA forecasts with persistence: predict that the player keeps their current-season value. "
        "This case study asks whether an overall improvement also appears among the highest-scoring players.", "",
        "## Finding", "",
        "On the 2025–26 holdout, Ridge lowers true-shooting-percentage MAE from **3.487 to 3.107 percentage points** overall "
        "(**10.9% improvement**, 327 players). Among the source-season top-scoring decile, it increases MAE from "
        "**2.318 to 2.456 percentage points** (**6.0% worse**, 33 players).", "",
        "The top-decile mean signed TS% error is **−1.039 percentage points** (prediction minus actual). "
        "That describes average underprediction in this sample; it does not establish why it happened.", "",
        "![MAE improvement by target and group](case-study.svg)", "",
        "## Evidence", "",
        "| Target | Unit | Group | n | Ridge MAE | Persistence MAE | Improvement |",
        "| --- | --- | --- | ---: | ---: | ---: | ---: |"]
    for row in rows:
        lines.append(f"| {row['target']} | {row['unit']} | {row['group']} | {row['n']} | {row['model_mae']:.3f} | {row['baseline_mae']:.3f} | {row['improvement_pct']:+.1f}% |")
    lines += ["", "Improvement = (persistence MAE − model MAE) / persistence MAE × 100. "
        "The groups overlap: the top decile is part of the overall sample. pp means percentage points, not relative percent error.", "",
        "## Method", "",
        "- Source: the fixed `public/projections.json` artifact, using its holdout evaluation and scoring-level diagnostics.",
        "- Historical inputs span 2020–21 through 2025–26, producing 1,651 eligible season-to-season transitions.",
        "- Model-family selection uses expanding-window validation before the held-out 2025–26 target season. "
        "A 2% validation tolerance prefers simpler competitive models; Ridge was selected for all five targets.",
        "- The top decile is defined by source-season scoring among the eligible holdout sample, not future outcomes. The holdout contains 327 eligible players, including 33 in this subgroup.",
        "- The displayed current projections are refitted 2026–27 forecasts. They are separate from the heldout observations used in this table.", "",
        "## What I would conclude", "",
        "The overall result supports using Ridge as a modest improvement over persistence on this holdout. "
        "The top-scorer TS% result supports keeping the baseline visible and reviewing performance by subgroup before trusting an aggregate score. "
        "It does not justify changing model selection using this same holdout.", "",
        "## Limits", "",
        "This is one season's descriptive subgroup comparison, not a significance test. No causal explanation is established. "
        "Transitions require eligibility in both seasons, creating availability/survivorship bias. Injuries, trades, coaching changes, and teammate context are absent. "
        "Historical error bands are pooled residual summaries, not player-specific confidence intervals.", "",
        "Code inspection found that the trainer assumes consecutive historical seasons and substitutes zeros for invalid numeric inputs. "
        "Those are robustness risks for a future ingest; the current input has contiguous seasons and passed the current-data checks. "
        "The review did not find evidence that these risks altered the committed results.", "",
        "## Reproduce", "", "```bash", "python -m venv .venv", "# Activate the environment for your operating system.",
        "python -m pip install -r requirements-case-study.txt", "python scripts/build_case_study.py", "```", "",
        "The command reads the committed artifact and writes this page, `case-study.csv`, and `case-study.svg`; it does not fetch NBA data or retrain. "
        "The CSV retains full numeric precision. See [reproducibility](REPRODUCIBILITY.md) to retrain against the cached historical input.", "",
        f"Input SHA-256: `{hashlib.sha256(raw).hexdigest()}`.", "",
        "Generated from checked-in evidence by `scripts/build_case_study.py`."]
    (output / "CASE_STUDY.md").write_text("\n".join(lines) + "\n", encoding="utf-8")
    print(f"Wrote {len(rows)} evidence rows, case study, and chart to {output}.")


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--source", type=Path, default=ROOT / "public/projections.json")
    parser.add_argument("--output-dir", type=Path, default=ROOT / "docs")
    args = parser.parse_args()
    build(args.source, args.output_dir)


if __name__ == "__main__":
    main()
