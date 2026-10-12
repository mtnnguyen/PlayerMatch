# PlayerMatch V2.1

This `src/` folder builds on the V2 data pipeline you already ran successfully.

## V2.1 changes

### Accessibility / usability
- larger stat labels and UI text
- larger click/tap targets
- visible keyboard focus states
- skip-to-content link
- keyboard-navigable player search
- ARIA labels for matchup controls and comparison rows
- Escape-to-close methodology modal
- reduced-motion support
- higher-contrast text colors

### Workflow
The sticky right rail is now ordered around the user's investigation flow:

1. Closest matches
2. Why they match
3. Biggest differences
4. Match stability
5. Category edge
6. Model details

### Match Stability
The same player pair is re-evaluated with:

- Per Game
- Per 36
- Per 100

The spread shows how sensitive the comparison is to minutes / pace normalization.

### Custom model
Choose the `Custom` similarity profile to reveal sliders for all 10 model features.

Weights range from `0.0` to `3.0`:
- `0.0` removes a feature
- `1.0` is neutral
- values above `1.0` increase influence

Similarity rankings and all explainability outputs recalculate live.

## Data

You do **not** need to rebuild `players.json` if you already successfully ran the PlayerMatch V2 builder and have:

- `stats.perGame`
- `stats.per36`
- `stats.per100`
- `position`
- `positionGroup`

Your existing V2 dataset is enough.
