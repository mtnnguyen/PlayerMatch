# PlayerMatch

**NBA player similarity, visual analytics, historical development, and backtested next-season projections.**

PlayerMatch is an interactive NBA analytics lab built to answer more than “who has similar box-score numbers?” It combines league-relative similarity, interpretable visual analysis, data-driven archetypes, multi-season trends, and next-season projection models in one front-office-style interface.

The product is built around a simple rule: **do the technical work underneath, then explain the result in basketball language without hiding the limitations.**

## What PlayerMatch can answer

- Which NBA players have the most similar statistical profiles?
- Why does the model think two players are similar?
- Which statistics separate them most?
- How unusual is each player relative to the league?
- Where do players sit on a two-dimensional style map?
- Which data-driven archetype does a player resemble?
- How has a player’s profile changed across seasons?
- Has a player comparison become more or less similar over time?
- What does the historical data suggest for next season?
- Did the projection model actually beat a simple baseline?

## Product views

| View | Purpose |
| --- | --- |
| **Matchup** | Search players, compare a primary player with statistical matches, and read the decision brief. |
| **Analysis** | Inspect similarity drivers, category differences, stability, and standardized evidence. |
| **Visuals** | Explore league profiles, scatter plots, distributions, PCA style maps, match drivers, and K-means archetypes. |
| **Trends** | Compare multi-season development and similarity-over-time. |
| **Outlook** | View next-season projections, archetype journeys, and held-out model performance. |
| **Model** | Change similarity profile, stat basis, comparison pool, and custom feature weights. |

## Analytics stack

PlayerMatch currently demonstrates:

```text
NBA Stats API ingestion
→ data cleaning and eligibility filtering
→ per-game / per-36 / per-100 views
→ league standardization and percentiles
→ weighted cosine similarity
→ explainable similarity drivers
→ sensitivity analysis
→ interactive scatter and distribution analysis
→ principal component analysis (PCA)
→ K-means clustering and data-driven archetypes
→ multi-season player development
→ similarity through time
→ historical archetype movement
→ supervised regression
→ expanding-window validation
→ persistence-baseline comparison
→ held-out backtesting
→ feature importance
→ next-season projections
→ empirical historical error bands
```

## Similarity model

PlayerMatch uses ten features:

```text
PTS · REB · AST · STL · BLK · FG% · 3P% · FT% · USG% · TS%
```

For the active player pool, every feature is standardized into a z-score:

```text
z = (player value - league mean) / league standard deviation
```

The standardized values are weighted and compared with cosine similarity. Preset profiles include **Balanced, Scoring, Playmaking, Defense**, plus a fully custom mode.

The displayed match value is a **model similarity score**. It is not a probability, player-value rating, or claim that two players are interchangeable.

## Predictive outlook

V5 predicts next-season:

```text
PTS · REB · AST · TS% · USG%
```

Candidate models:

```text
Persistence baseline: next season = current season
Ridge Regression
Gradient Boosting
```

Model family is selected with **expanding-window validation** so later seasons are never used to predict earlier ones. The latest observed target season is then held out for a final backtest.

Current V5 evaluation uses:

```text
Historical seasons: 2020-21 through 2025-26
Training examples: 1,651 player-season transitions
Holdout target season: 2025-26
Projection season: 2026-27
```

### Held-out results

| Target | Selected model | Model MAE | Baseline MAE |
| --- | --- | ---: | ---: |
| PTS | Gradient Boosting | 2.644 | 2.843 |
| REB | Ridge | 0.814 | 0.865 |
| AST | Ridge | 0.733 | 0.746 |
| TS% | Gradient Boosting | 3.060 | 3.487 |
| USG% | Ridge | 2.141 | 2.314 |

The goal is not to make the most complicated model win. If a simple baseline is stronger, PlayerMatch is designed to report that result instead of hiding it.

See [MODEL_CARD_V5.md](MODEL_CARD_V5.md) for methodology, evaluation design, and limitations.

## Data

Source: **NBA Stats API** via `nba_api`.

Default player eligibility:

```text
Regular season
Minimum 15 games
Minimum 10 minutes per game
```

The deployed app uses generated static datasets:

```text
public/players.json
public/player_history.json
public/projections.json
```

The current build contains 420 eligible 2025-26 players and six regular seasons of history.

## Run locally

Frontend:

```powershell
npm install
npm run dev
```

Python environment:

```powershell
python -m venv .venv
.\.venv\Scripts\Activate.ps1
pip install -r requirements-v5.txt
```

Rebuild historical data and projections:

```powershell
python scripts/build_v5.py
```

If `player_history.json` is already current and you only want to retrain projection models:

```powershell
python scripts/build_v5.py --skip-history
```

For a fuller walkthrough, see [V5_SETUP.md](V5_SETUP.md).

## Technical choices

### Why z-scores?
They put statistics with different raw scales into comparable league-relative units.

### Why cosine similarity?
It compares the direction and shape of multi-feature statistical profiles rather than relying on one raw-distance scale.

### Why PCA?
It compresses the ten-dimensional standardized feature space into two display dimensions for visual exploration. The two-dimensional map is a summary, not the full model.

### Why K-means?
It provides a transparent way to discover recurring statistical profiles. Cluster names are generated from underlying cluster traits and should be interpreted as data-driven descriptions, not official basketball roles.

### Why time-based validation?
Future-season projections should be evaluated in chronological order. Randomly mixing player-seasons across train and test sets can create an unrealistically easy evaluation.

### Why a persistence baseline?
A forecasting model should prove it adds value over the simple rule that next season looks like the current season.

## Important limitations

PlayerMatch does **not** directly model:

- injuries or availability probability
- trades and roster changes
- coaching changes
- teammate and lineup context
- contract incentives
- playoff role
- detailed tracking data
- complete defensive impact
- total player value

Projection training also requires a player to remain eligible in the following season, which creates survivorship / availability bias. Historical error bands summarize past validation errors; they are not formal confidence intervals.

## Tech stack

**Frontend:** React, Vite, JavaScript, SVG, Lucide React  
**Data / ML:** Python, pandas, NumPy, scikit-learn, `nba_api`  
**Models:** weighted cosine similarity, PCA, K-means, Ridge Regression, Gradient Boosting  
**Deployment:** Vercel

## Repository structure

```text
PlayerMatch/
├── public/
│   ├── players.json
│   ├── player_history.json
│   └── projections.json
├── scripts/
│   ├── build_player_history.py
│   ├── build_v5.py
│   └── train_projection_models.py
├── src/
│   ├── components/
│   ├── config/
│   ├── hooks/
│   ├── model/
│   └── styles/
├── MODEL_CARD_V5.md
├── V5_SETUP.md
└── requirements-v5.txt
```

## Product principle

PlayerMatch is intentionally built as an **analysis tool rather than a prediction oracle**. Similarity is not player value, clustering is not objective basketball truth, correlation is not causation, and a projection is not a guaranteed outcome.

The useful question is not just *“what does the model output?”* but also *“why, how stable is it, how well did it backtest, and what should we not conclude from it?”*
