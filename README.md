# PlayerMatch

PlayerMatch is an NBA statistical similarity explorer.

Choose a player, switch between similarity profiles, inspect the closest statistical matches, and compare two players side-by-side.

## What it demonstrates

- React / Vite product UI
- Python data pipeline
- pandas data cleaning
- NBA Stats API integration
- feature engineering
- z-score standardization
- weighted cosine similarity
- interactive search, ranking, and comparison
- explainable model design

## Important: demo data

The repository ships with a **synthetic demo dataset** so the interface works immediately.

The yellow banner in the app means the demo dataset is active.

Do not publish conclusions from the demo data.

Replace it with NBA data by running the included Python pipeline.

## Setup

### 1. Install frontend dependencies

```powershell
npm install
```

### 2. Run the interface

```powershell
npm run dev
```

Open the Vite localhost URL.

## Build the real NBA dataset

Create a virtual environment:

```powershell
python -m venv .venv
.\.venv\Scripts\Activate.ps1
```

Install the Python requirements:

```powershell
pip install -r requirements.txt
```

Build `public/players.json`:

```powershell
python scripts/build_player_data.py
```

The default configuration uses:

- Season: `2025-26`
- Regular season
- Minimum 15 games
- Minimum 10 minutes per game

You can change the filters:

```powershell
python scripts/build_player_data.py --season 2025-26 --min-games 20 --min-minutes 15
```

Restart or refresh Vite after the dataset is generated.

## Similarity model

V1 uses these features:

- PTS
- REB
- AST
- STL
- BLK
- FG%
- 3P%
- FT%
- USG%
- TS%

### 1. Standardization

Each feature is standardized relative to the current player pool:

```text
z = (player value - league mean) / league standard deviation
```

This prevents features with larger raw numeric ranges from automatically dominating the comparison.

### 2. Profile weights

The interface includes:

- Balanced
- Scoring
- Playmaking
- Defense

Each mode changes the weight applied to the standardized features.

### 3. Cosine similarity

PlayerMatch compares the weighted player vectors using cosine similarity.

The raw cosine score is converted to a 0–100 match score for presentation.

## Interpretation

PlayerMatch is a statistical-profile similarity tool.

It is **not** a claim that two players:

- are equally good
- play the same exact role
- have the same defensive impact
- have the same contract value
- have the same scouting projection
- would fit equally well on a team

Those are possible future modelling directions.

## V2 ideas

- age and position filters
- minimum-minute and game filters in the UI
- per-36 / per-100-possession views
- historical seasons
- custom user-controlled feature weights
- player archetype clustering
- PCA / UMAP player map
- contract value
- "find a cheaper replacement"
- draft prospect comparisons
- team-fit scoring

## Data source

The included data builder uses `nba_api` and the NBA Stats `LeagueDashPlayerStats` endpoint.

NBA endpoints can occasionally throttle or block automated requests. The script includes basic retry handling, but a failed request does not necessarily mean your code is broken.
