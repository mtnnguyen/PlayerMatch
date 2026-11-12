# Reproducing PlayerMatch

The app includes a fixed data snapshot. You can run it and verify the existing analysis without contacting NBA Stats. Refreshing the source data is a separate operation and may produce different results.

## Frontend

Use Node.js 20 or later (CI uses Node 20):

```bash
npm ci
npm test
npm run build
npm run dev
```

Open the local address printed by Vite. The committed JSON files are sufficient for Matchup, Analysis, Visuals, Trends, and Outlook. No model API key is required.

## Cached-data analysis

The pinned environment was verified with Python **3.12.14** on Linux. CI uses Python 3.12. Other platforms may produce small numerical differences; the exact-match check intentionally flags differences for inspection rather than silently accepting them.

```bash
python -m venv .venv
```

Activate it on macOS/Linux:

```bash
source .venv/bin/activate
```

Or in Windows PowerShell:

```powershell
.\.venv\Scripts\Activate.ps1
```

Then:

```bash
python -m pip install -r requirements-offline.txt
python scripts/validate_projection_artifact.py
python -m unittest discover -s tests/python -p "test_*.py" -v
python scripts/train_projection_models.py --output /tmp/playermatch-projections.json
python scripts/check_reproduction.py /tmp/playermatch-projections.json
```

On Windows, replace `/tmp/playermatch-projections.json` with a writable temporary path such as `$env:TEMP\playermatch-projections.json` in both commands.

`requirements-offline.txt` pins the cached-data training/test dependencies. “Offline” refers to the analysis after installation: the first package installation still needs a package index or predownloaded wheels. It does not install `nba_api`, because cached-data training does not import it.

On November 12, 2026, a fresh virtual environment installed these pins, passed the Python tests, and retrained all five targets from the committed historical input. Every evaluation field and all 420 player projections matched the committed artifact exactly. Only `meta.generatedAt` differed. The published artifact was not replaced.

The training command above writes to a temporary path. The default training command without `--output`, and `build_v5.py --skip-history`, overwrite `public/projections.json`; use them only when intentionally publishing a new artifact after review.

## Case study

```bash
python -m pip install -r requirements-case-study.txt
python scripts/build_case_study.py
```

This writes `docs/CASE_STUDY.md`, `docs/case-study.csv`, and `docs/case-study.svg` from the committed evaluation artifact. It does not retrain. CSV numbers retain full precision; the page and chart round for readability. The input hash is recorded in the page.

## Refreshing NBA source data

`requirements.txt` contains the broader ingestion dependencies, including `nba_api`. The original refresh route is:

```bash
python -m pip install -r requirements.txt
python scripts/build_v5.py
```

This contacts NBA Stats and replaces generated artifacts. Endpoint availability, timeouts, and data revisions are external dependencies. A fresh NBA API download was **not** verified as part of the cached-data reproduction check. The broad ingestion requirements remain separate from the tested cached-data pins.

Before publishing refreshed results, validate complete player records and consecutive seasons. The current trainer assumes chronological adjacent seasons are consecutive and can substitute zero for invalid numeric inputs. The committed snapshot has contiguous seasons and its current outputs reproduced, but this does not guarantee a future incomplete ingest is safe.

## Verification limits

The release's DOM tests cover keyboard selection, search closure, dialog focus containment/restoration, and recovery from failed primary loading. DOM tests do not verify CSS layout, real screen-reader output, or actual mobile rendering.

Real-browser/mobile QA is pending: local Chromium failed to launch with `socket() failed: Operation not permitted`; the separate browser could not connect to the local server. This is a verification gap, not a passing browser result. Interactive SVG map points also remain mouse-oriented; the core comparison controls have broader keyboard coverage than the visual maps.
