# PlayerMatch src architecture

- `App.jsx` — state, data loading, and composition only.
- `components/` — UI pieces.
- `config/modelConfig.js` — features, categories, and profile weights.
- `model/similarity.js` — z-scores, cosine similarity, percentiles, feature contributions.
- `model/insights.js` — archetypes, category comparisons, deterministic interpretation.
- `styles/` — split by page responsibility.

Current model: 10 per-game features → league z-scores → profile weights → cosine similarity.

The next data-pipeline upgrades should be position fields and per-36/per-100 stats before adding those controls to the UI.
