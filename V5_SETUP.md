# PlayerMatch V5 Setup

## Requirements

### Frontend

- Node.js
- npm

### Data / ML

- Python 3.10+
- `nba_api`
- pandas
- NumPy
- scikit-learn

## 1. Install frontend dependencies

```powershell
npm install
```

## 2. Create and activate a Python virtual environment

```powershell
python -m venv .venv
.\.venv\Scripts\Activate.ps1
```

## 3. Install Python dependencies

```powershell
pip install -r requirements.txt
```

## 4. Build all V5 data

```powershell
python scripts/build_v5.py
```

This runs:

```text
build_player_history.py
train_projection_models.py
```

and produces:

```text
public/players.json
public/player_history.json
public/projections.json
```

The historical builder defaults to:

```text
2020-21
2021-22
2022-23
2023-24
2024-25
2025-26
```

Default eligibility:

```text
minimum 15 games
minimum 10 minutes per game
```

NBA Stats API requests can occasionally throttle or time out. The builder includes retry handling.

If the historical file is already current and you only want to retrain the projection models:

```powershell
python scripts/build_v5.py --skip-history
```

## 5. Run the app

```powershell
npm run dev
```

Vite will print a localhost URL, usually:

```text
http://localhost:5173/
```

## Product navigation

```text
Matchup
Analysis
Visuals
Trends
Outlook
Model
```

### Matchup
Search and compare players.

### Analysis
Inspect model evidence, drivers, differences, and stability.

### Visuals
Explore league profile, scatter, distribution, match drivers, PCA style map, and K-means archetypes.

### Trends
Explore player development and pair similarity over time.

### Outlook
Explore next-season projections, statistical archetype journeys, and model performance.

### Model
Adjust similarity profile, stat basis, comparison pool, and custom weights.

## Projection methodology

Targets:

```text
PTS
REB
AST
TS%
USG%
```

Candidate models:

```text
Persistence baseline
Ridge Regression
Gradient Boosting
```

Model family is selected with expanding-window validation. If a simpler candidate is within 2% of the best validation MAE, PlayerMatch prefers the simpler model.

The latest observed target season is held out from model selection for a final backtest.

With the current default history:

```text
holdout target season = 2025-26
projection season = 2026-27
```

After evaluation, the selected model is refit on all observed transitions.

## Validation commands

Before committing model or UI changes:

```powershell
npm test
python -m unittest discover -s tests/python -p "test_*.py" -v
npm run build
git diff --check
```

GitHub Actions runs the JavaScript tests, Python projection-pipeline tests, and production build automatically on pushes to `main` and on pull requests.

## Runtime data loading

The static app loads data on demand:

```text
initial app → players.json
Trends → player_history.json
Outlook → projections.json
Outlook / Archetype Journey → player_history.json if needed
```

## Deployment

The deployed app is static.

The Python models are trained locally. Generated JSON is committed to the repository and served by Vercel:

```text
players.json
player_history.json
projections.json
```

No production Python model server or database is required.

## Recommended smoke test

After rebuilding data:

1. Open Matchup and compare two established players.
2. Open Visuals → Player Style Map.
3. Open Trends → Development.
4. Open Trends → Similarity over time.
5. Open Outlook → Projection.
6. Open Outlook → Model performance.
7. Switch between Per Game / Per 36 / Per 100.
8. Change similarity profile and confirm the comparison model reacts.
