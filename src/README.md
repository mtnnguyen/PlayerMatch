# PlayerMatch V3

## Product direction

PlayerMatch V3 is designed like an analyst presenting to a basketball decision-maker:

1. show the result
2. show the evidence
3. explain what it means in plain language
4. state the limitation
5. keep technical model controls available but out of the default workflow

## Views

### Matchup
The visual home screen and player-selection workflow.

### Analysis
Detailed evidence: raw stats, league percentiles, model contribution and sensitivity.

### Visuals
League-relative player profiles expressed in human language. Standardized z-scores remain available as methodology rather than requiring statistical knowledge from the user.

### Model
Advanced controls and custom weighting.

## Current model

- 10 statistical features
- league z-score standardization
- weighted cosine similarity
- Per Game / Per 36 / Per 100
- player-pool filtering
- deterministic model interpretation

## Future V3 work

The next major modelling step should use historical seasons before adding true forecasts. That can support trend analysis, aging curves and eventually a defensible projection screen.
