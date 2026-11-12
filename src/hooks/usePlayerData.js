import { useCallback, useEffect, useRef, useState } from "react";
import { readDataset, validatePlayers, validateHistory, validateProjections } from "../model/datasets";

const EMPTY_PLAYERS = { meta: null, players: [] };
const EMPTY_HISTORY = { meta: null, seasons: [] };
const EMPTY_PROJECTIONS = { meta: null, evaluation: {}, players: [] };

function useDataset(url, validate, initial) {
  const [data, setData] = useState(initial);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const loaded = useRef(false);
  const request = useRef(null);

  const load = useCallback(async (force = false) => {
    if (request.current || (loaded.current && !force)) return;
    const controller = new AbortController();
    request.current = controller;
    setLoading(true);
    setError("");
    try {
      const payload = await readDataset(url, validate, controller.signal);
      if (!controller.signal.aborted) {
        setData(payload);
        loaded.current = true;
      }
    } catch (failure) {
      if (!controller.signal.aborted) {
        setError(failure instanceof Error ? failure.message : "We couldn't load this dataset. Please try again.");
      }
    } finally {
      if (request.current === controller) {
        request.current = null;
        setLoading(false);
      }
    }
  }, [url, validate]);

  useEffect(() => () => {
    request.current?.abort();
    request.current = null;
  }, []);

  return { data, error, loading, load };
}

export default function usePlayerData() {
  const players = useDataset("/players.json", validatePlayers, EMPTY_PLAYERS);
  const history = useDataset("/player_history.json", validateHistory, EMPTY_HISTORY);
  const projections = useDataset("/projections.json", validateProjections, EMPTY_PROJECTIONS);

  useEffect(() => { players.load(); }, [players.load]);

  return {
    dataset: players.data,
    loadError: players.error,
    reloadPlayers: () => players.load(true),
    historyDataset: history.data,
    historyAvailable: history.data.seasons.length > 0,
    historyError: history.error,
    historyLoading: history.loading,
    loadHistory: history.load,
    projectionDataset: projections.data,
    projectionsAvailable: projections.data.players.length > 0,
    projectionError: projections.error,
    projectionLoading: projections.loading,
    loadProjections: projections.load,
  };
}
