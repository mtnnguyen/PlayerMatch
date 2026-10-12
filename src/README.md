# PlayerMatch V5

PlayerMatch is an NBA similarity, visual analytics, player-development and predictive-modelling project.

## Product philosophy

The technical work happens underneath.

The user-facing product answers:

```text
Who is similar?
Why?
Where are they different?
How unusual are the numbers?
What kind of player is this?
How has the profile changed?
What does the historical evidence suggest next?
How accurate has the model actually been?
What should we not conclude?
```

## Analytics progression

PlayerMatch now demonstrates:

```text
NBA Stats API ingestion
data cleaning
feature engineering
league standardization
percentiles
weighted cosine similarity
model explainability
sensitivity analysis
interactive scatter analysis
distributions
PCA
K-means clustering
data-driven archetypes
multi-season trend analysis
historical similarity
historical archetype movement
supervised regression
time-based validation
baseline comparison
held-out backtesting
feature importance
next-season projections
empirical error bands
```

## Main views

### Matchup
Fast player-to-player comparison.

### Analysis
Evidence behind the comparison.

### Visuals
League profile, scatter, distributions, model drivers, PCA Style Map and data-driven archetypes.

### Trends
Historical player development and pair similarity.

### Outlook
Next-season projections, archetype journey and model-performance reporting.

### Model
Control how statistical similarity is defined.

## V5 prediction principle

PlayerMatch does not assume machine learning is automatically better.

Every target is compared against:

```text
next season = current season
```

If a simple baseline is strongest during time-based model selection, the product reports that result.

See:

```text
MODEL_CARD_V5.md
V5_SETUP.md
```

for the complete methodology and setup.
