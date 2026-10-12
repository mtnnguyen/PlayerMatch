import {
  useEffect,
  useMemo,
  useState,
} from "react";

import { PROFILES } from "../config/modelConfig";

import {
  STAT_BASES,
  filterComparisonPool,
  withStatBasis,
} from "../config/viewConfig";

import {
  buildMatches,
  explainFeatures,
  leagueStats,
  pairSimilarity,
} from "../model/similarity";

import {
  analystSummary,
  archetype,
  categoryComparisons,
} from "../model/insights";

import {
  buildZScoreInterpretation,
  buildZScoreProfile,
} from "../model/analysisLab";

import {
  buildDecisionBrief,
  buildFriendlyProfileSummary,
} from "../model/humanInsights";

export default function usePlayerMatch() {
  const [dataset, setDataset] = useState({
    meta: null,
    players: [],
  });

  const [loadError, setLoadError] =
    useState("");

  const [selectedId, setSelectedId] =
    useState(null);

  const [comparisonId, setComparisonId] =
    useState(null);

  const [profile, setProfile] =
    useState("Balanced");

  const [customWeights, setCustomWeights] =
    useState({
      ...PROFILES.Custom.weights,
    });

  const [statBasis, setStatBasis] =
    useState("perGame");

  const [poolFilter, setPoolFilter] =
    useState("all");

  useEffect(() => {
    fetch("/players.json")
      .then((response) => {
        if (!response.ok) {
          throw new Error(
            "Could not load player dataset."
          );
        }

        return response.json();
      })
      .then((payload) => {
        const players =
          payload.players ?? [];

        setDataset({
          meta: payload.meta ?? {},
          players,
        });

        if (players.length) {
          setSelectedId(players[0].id);
        }
      })
      .catch((error) => {
        setLoadError(error.message);
      });
  }, []);

  const rawPlayers = dataset.players;

  const supportsAdvancedBases = Boolean(
    rawPlayers[0]?.stats?.per36 &&
      rawPlayers[0]?.stats?.per100
  );

  const supportsPositions = rawPlayers.some(
    (player) =>
      player.positionGroup &&
      player.positionGroup !== "Unknown"
  );

  const effectiveWeights =
    profile === "Custom"
      ? customWeights
      : PROFILES[profile].weights;

  const players = useMemo(
    () =>
      rawPlayers.map((player) =>
        withStatBasis(player, statBasis)
      ),
    [rawPlayers, statBasis]
  );

  const stats = useMemo(
    () => leagueStats(players),
    [players]
  );

  const selectedPlayer =
    players.find(
      (player) => player.id === selectedId
    ) ??
    players[0] ??
    null;

  const comparisonPool = useMemo(
    () =>
      filterComparisonPool(
        players,
        selectedPlayer,
        poolFilter
      ),
    [players, selectedPlayer, poolFilter]
  );

  const matches = useMemo(
    () =>
      buildMatches(
        comparisonPool,
        selectedPlayer,
        effectiveWeights,
        stats
      ),
    [
      comparisonPool,
      selectedPlayer,
      effectiveWeights,
      stats,
    ]
  );

  const comparisonPlayer =
    matches.find(
      (player) => player.id === comparisonId
    ) ??
    matches[0] ??
    null;

  const categories = useMemo(
    () =>
      selectedPlayer && comparisonPlayer
        ? categoryComparisons(
            players,
            selectedPlayer,
            comparisonPlayer
          )
        : [],
    [
      players,
      selectedPlayer,
      comparisonPlayer,
    ]
  );

  const featureRows = useMemo(
    () =>
      selectedPlayer && comparisonPlayer
        ? explainFeatures(
            selectedPlayer,
            comparisonPlayer,
            stats,
            effectiveWeights
          )
        : [],
    [
      selectedPlayer,
      comparisonPlayer,
      stats,
      effectiveWeights,
    ]
  );

  const drivers = useMemo(
    () =>
      [...featureRows]
        .filter(
          (row) => row.contribution > 0
        )
        .sort(
          (a, b) =>
            b.contribution - a.contribution
        )
        .slice(0, 4),
    [featureRows]
  );

  const differences = useMemo(
    () =>
      [...featureRows]
        .sort(
          (a, b) =>
            b.weightedGap - a.weightedGap
        )
        .slice(0, 3),
    [featureRows]
  );

  const selectedRole = useMemo(
    () =>
      selectedPlayer
        ? archetype(players, selectedPlayer)
        : null,
    [players, selectedPlayer]
  );

  const comparisonRole = useMemo(
    () =>
      comparisonPlayer
        ? archetype(players, comparisonPlayer)
        : null,
    [players, comparisonPlayer]
  );

  const summary = useMemo(
    () =>
      selectedPlayer && comparisonPlayer
        ? analystSummary(
            selectedPlayer,
            comparisonPlayer,
            comparisonPlayer.similarity ?? 0,
            categories,
            profile,
            drivers
          )
        : null,
    [
      selectedPlayer,
      comparisonPlayer,
      categories,
      profile,
      drivers,
    ]
  );


  const zScoreProfile = useMemo(
    () =>
      selectedPlayer && comparisonPlayer
        ? buildZScoreProfile(
            selectedPlayer,
            comparisonPlayer,
            stats
          )
        : [],
    [
      selectedPlayer,
      comparisonPlayer,
      stats,
    ]
  );

  const zScoreInterpretation = useMemo(
    () =>
      selectedPlayer && comparisonPlayer
        ? buildZScoreInterpretation(
            selectedPlayer,
            comparisonPlayer,
            zScoreProfile
          )
        : null,
    [
      selectedPlayer,
      comparisonPlayer,
      zScoreProfile,
    ]
  );


  const friendlyProfileSummary = useMemo(
    () =>
      selectedPlayer && comparisonPlayer
        ? buildFriendlyProfileSummary(
            selectedPlayer,
            comparisonPlayer,
            zScoreProfile
          )
        : null,
    [
      selectedPlayer,
      comparisonPlayer,
      zScoreProfile,
    ]
  );

  const stability = useMemo(() => {
    if (
      !supportsAdvancedBases ||
      !selectedPlayer ||
      !comparisonPlayer
    ) {
      return null;
    }

    const scores = Object.entries(
      STAT_BASES
    ).map(([basis, config]) => {
      const basisPlayers = rawPlayers.map(
        (player) =>
          withStatBasis(player, basis)
      );

      const basisStats =
        leagueStats(basisPlayers);

      const left =
        basisPlayers.find(
          (player) =>
            player.id === selectedPlayer.id
        );

      const right =
        basisPlayers.find(
          (player) =>
            player.id === comparisonPlayer.id
        );

      return {
        key: basis,
        label: config.label,
        score: pairSimilarity(
          left,
          right,
          effectiveWeights,
          basisStats
        ),
      };
    });

    const values = scores.map(
      (item) => item.score
    );

    const range =
      Math.max(...values) -
      Math.min(...values);

    let label =
      "Highly stable comparison";

    if (range > 10) {
      label =
        "Stat-basis sensitive comparison";
    } else if (range > 5) {
      label =
        "Moderately stable comparison";
    }

    return {
      scores,
      range,
      label,
    };
  }, [
    supportsAdvancedBases,
    rawPlayers,
    selectedPlayer,
    comparisonPlayer,
    effectiveWeights,
  ]);


  const decisionBrief = useMemo(
    () =>
      selectedPlayer && comparisonPlayer
        ? buildDecisionBrief({
            left: selectedPlayer,
            right: comparisonPlayer,
            similarity:
              comparisonPlayer.similarity ?? 0,
            categories,
            drivers,
            differences,
            stability,
          })
        : null,
    [
      selectedPlayer,
      comparisonPlayer,
      categories,
      drivers,
      differences,
      stability,
    ]
  );

  function selectPrimary(player) {
    setSelectedId(player.id);
    setComparisonId(null);
  }

  function selectComparison(player) {
    setComparisonId(player.id);
  }

  function changePoolFilter(value) {
    setPoolFilter(value);
    setComparisonId(null);
  }

  function changeCustomWeight(key, value) {
    setCustomWeights((current) => ({
      ...current,
      [key]: Number(value),
    }));
  }

  function resetCustomWeights() {
    setCustomWeights({
      ...PROFILES.Custom.weights,
    });
  }

  function swapPlayers() {
    if (!selectedPlayer || !comparisonPlayer) {
      return;
    }

    const previous = selectedPlayer.id;

    setSelectedId(comparisonPlayer.id);
    setComparisonId(previous);
  }

  return {
    dataset,
    loadError,

    players,
    comparisonPool,
    matches,

    selectedPlayer,
    comparisonPlayer,

    selectedRole,
    comparisonRole,

    categories,
    drivers,
    differences,
    summary,
    stability,
    zScoreProfile,
    zScoreInterpretation,
    friendlyProfileSummary,
    decisionBrief,

    profile,
    setProfile,

    statBasis,
    setStatBasis,

    poolFilter,
    changePoolFilter,

    customWeights,
    effectiveWeights,
    changeCustomWeight,
    resetCustomWeights,

    supportsAdvancedBases,
    supportsPositions,

    selectPrimary,
    selectComparison,
    swapPlayers,
  };
}
