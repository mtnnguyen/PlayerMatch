# PlayerMatch V5 Model Card

## Purpose

PlayerMatch V5 estimates selected NBA per-game statistics for the following season and exposes how the models were evaluated.

Targets:

- PTS
- REB
- AST
- TS%
- USG%

The projections are intended as a sports-analytics portfolio model and decision aid, not as guaranteed forecasts.

## Data

Source: NBA Stats API.

Default historical range:

```text
2020-21 through 2025-26
```

Default eligibility:

```text
at least 15 games
at least 10 minutes per game
```

The current V5 build creates:

```text
1,651 season-to-season training examples
```

## Prediction unit

One training observation represents:

```text
one eligible player in season t
→ that same player's eligible outcome in season t+1
```

## Features

Current statistical profile:

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

Context:

- age
- minutes per game
- games played

Recent movement:

- ΔPTS
- ΔREB
- ΔAST
- ΔTS%
- ΔUSG%
- ΔMIN

History indicators:

- prior eligible season available
- count of eligible historical seasons

The model feature row for season `t` is built only from information available at or before season `t`.

## Candidate models

### Persistence baseline

```text
next season = current season
```

This baseline matters because a predictive model should demonstrate value over a simple, strong rule.

### Ridge Regression

Included because it provides:

- a regularized linear benchmark
- stable behavior with correlated basketball features
- interpretable coefficients

### Gradient Boosting

Included because it can:

- capture nonlinear relationships
- model interactions without manually specifying them
- provide feature-importance values

## Model selection

PlayerMatch does **not** use a random player-season train/test split.

Candidate models are compared using expanding-window validation:

```text
train on earlier transitions
→ validate on the next target season
→ expand the training window
→ repeat
```

This preserves chronological order.

### Simplicity-aware selection

PlayerMatch does not treat microscopic validation differences as strong evidence for extra model complexity.

After expanding-window validation, it applies a **2% simplicity tolerance**:

```text
find the best validation MAE
→ keep every candidate within 2% of that result
→ choose the simplest competitive model
```

Complexity order:

```text
Persistence baseline
Ridge
Gradient Boosting
```

This is a transparent practical tolerance, not the formal one-standard-error rule. The output records both the raw best-validation model and the model selected after the simplicity rule.

## Final holdout

The latest fully observed target season is excluded from model-family selection.

Current V5 holdout:

```text
2025-26
```

The selected model is then evaluated against the persistence baseline on that held-out season.

## Final training and projection

After the holdout evaluation is recorded, the selected model is refit on all observed historical transitions and used to project:

```text
2026-27
```

## Held-out results

| Target | Selected model | Model MAE | Baseline MAE | Model RMSE | MAE improvement |
| --- | --- | ---: | ---: | ---: | ---: |
| PTS | Ridge | 2.634 | 2.843 | 3.365 | 7.4% |
| REB | Ridge | 0.814 | 0.865 | 1.052 | 5.9% |
| AST | Ridge | 0.733 | 0.746 | 1.022 | 1.7% |
| TS% | Ridge | 3.107 | 3.487 | 4.057 | 10.9% |
| USG% | Ridge | 2.141 | 2.314 | 2.817 | 7.5% |

AST improves MAE by only 1.7% and should be treated as **essentially tied** with the persistence baseline rather than as a major forecasting gain.

The 2% simplicity rule selected **Ridge** for PTS instead of the raw best-validation model **Gradient Boosting**, and **Ridge** for TS% instead of **Gradient Boosting**. This keeps model complexity proportional to the strength of the validation evidence.

## Holdout subgroup diagnostics

The final holdout is also sliced using **source-season information only** across scoring level, age, and minutes per game.

For the source-season **top 10% of scorers**:

| Target | n | Model MAE | Baseline MAE | Mean signed error | Mean projection change |
| --- | ---: | ---: | ---: | ---: | ---: |
| PTS | 33 | 2.935 | 3.288 | +0.465 | -1.241 |
| REB | 33 | 0.873 | 0.773 | +0.458 | +0.007 |
| AST | 33 | 0.804 | 0.870 | +0.433 | -0.091 |
| TS% | 33 | 2.456 | 2.318 | -1.039 | -0.297 |
| USG% | 33 | 2.148 | 2.442 | +0.135 | -1.053 |

Interpretation:

- `mean signed error = prediction - actual`
- negative signed error means underprediction on average
- `mean projection change = prediction - source-season value`
- subgroup diagnostics are descriptive and are not significance tests

The PTS model regresses the top-scoring decile downward on average, but the held-out signed error for that group is slightly positive rather than negative. In this holdout, regression toward the mean did **not** translate into systematic scoring underprediction for elite scorers.

The TS% result is less favorable at the top end: the persistence baseline is stronger for the top-scoring decile, and the negative signed error indicates some underprediction of next-season efficiency in that group.

## Evaluation metrics

PlayerMatch reports:

- MAE
- RMSE

The app foregrounds MAE because it maps directly to basketball units.

For example:

```text
PTS MAE = 2.64
```

means the selected model missed held-out next-season scoring averages by about 2.64 points per game on average.

## Historical error band

The Outlook view reports the 80th percentile of historical absolute validation errors.

This is an empirical historical error summary.

It is **not** a formal confidence interval and should not be interpreted as calibrated player-specific uncertainty.

## Feature importance

For Ridge, PlayerMatch uses the absolute standardized coefficients.

For Gradient Boosting, PlayerMatch uses model feature importances.

Feature importance describes how strongly the fitted model used an input. It does not establish causation.

## Leakage controls

- season `t+1` target values are never included in season `t` features
- chronological validation is used instead of random transition splitting
- the final holdout target season is excluded during model-family selection
- final projections are created only after evaluation is complete

## Known limitations

### Survivorship / availability bias

A training transition exists only when the player remains eligible in the following season.

Players who retire, miss substantial time, or fall below the games/minutes threshold can disappear from the target sample.

### Missing basketball context

The model does not directly include:

- injuries
- transactions
- coaching changes
- teammate quality
- lineup combinations
- detailed tracking data
- contract context
- playoff usage

### Small number of seasons

The default project intentionally uses a manageable multi-season sample rather than claiming long-run structural stability.

### Structural change

NBA pace, style, rules, team strategy, and player roles change over time.

Historical relationships may not persist.

### Tail behavior

Regression models can behave differently for extreme player profiles than for the middle of the league. V5.1 therefore reports descriptive holdout error by source-season scoring level, age group, and playing-time group. These slices help expose uneven model behavior but are not formal statistical tests.

### Model-selection uncertainty

Two models can have nearly identical validation error. V5.1 addresses this with a transparent 2% simplicity tolerance, but that threshold is still a modelling choice and should be revisited with a longer history and repeated out-of-time evaluation.

## Responsible interpretation

Good:

> The model projects 27.4 PPG, while its historical validation errors indicate substantial uncertainty around that point estimate.

Bad:

> The player will score 27.4 PPG.

Good:

> Ridge slightly beat the persistence baseline on the held-out season for assists.

Bad:

> Ridge definitively solves assist forecasting.

Good:

> This model is useful as a historical decision aid.

Bad:

> This model accounts for all basketball context.

## Reproducibility

Run:

```powershell
python scripts/build_v5.py
```

to rebuild historical data and projections.

Use:

```powershell
python scripts/build_v5.py --skip-history
```

to retrain from an existing historical dataset.
