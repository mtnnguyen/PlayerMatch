import {
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";

const EMPTY_HISTORY = {
  meta: null,
  seasons: [],
};

const EMPTY_PROJECTIONS = {
  meta: null,
  evaluation: {},
  players: [],
};

export default function usePlayerData() {
  const [dataset, setDataset] =
    useState({
      meta: null,
      players: [],
    });

  const [
    historyDataset,
    setHistoryDataset,
  ] = useState(
    EMPTY_HISTORY
  );

  const [
    projectionDataset,
    setProjectionDataset,
  ] = useState(
    EMPTY_PROJECTIONS
  );

  const [loadError, setLoadError] =
    useState("");

  const [
    historyError,
    setHistoryError,
  ] = useState("");

  const [
    projectionError,
    setProjectionError,
  ] = useState("");

  const [
    historyLoading,
    setHistoryLoading,
  ] = useState(false);

  const [
    projectionLoading,
    setProjectionLoading,
  ] = useState(false);

  const historyRequestInFlight =
    useRef(false);

  const projectionRequestInFlight =
    useRef(false);

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
        setDataset({
          meta:
            payload.meta ?? {},
          players:
            payload.players ?? [],
        });
      })
      .catch((error) => {
        setLoadError(
          error.message
        );
      });
  }, []);

  const loadHistory =
    useCallback(() => {
      if (
        historyRequestInFlight.current ||
        historyDataset.seasons.length
      ) {
        return;
      }

      historyRequestInFlight.current = true;
      setHistoryLoading(true);
      setHistoryError("");

      fetch("/player_history.json")
        .then((response) => {
          if (!response.ok) {
            throw new Error(
              "Historical dataset not found. Run the V5 history builder to enable multi-season analysis."
            );
          }

          return response.json();
        })
        .then((payload) => {
          setHistoryDataset({
            meta:
              payload.meta ?? {},
            seasons:
              payload.seasons ?? [],
          });

          setHistoryError("");
        })
        .catch((error) => {
          setHistoryError(
            error.message
          );
        })
        .finally(() => {
          historyRequestInFlight.current = false;
          setHistoryLoading(false);
        });
    }, [
      historyDataset.seasons.length,
    ]);

  const loadProjections =
    useCallback(() => {
      if (
        projectionRequestInFlight.current ||
        projectionDataset.players.length
      ) {
        return;
      }

      projectionRequestInFlight.current = true;
      setProjectionLoading(true);
      setProjectionError("");

      fetch("/projections.json")
        .then((response) => {
          if (!response.ok) {
            throw new Error(
              "Projection dataset not found. Run the V5 training script to enable Outlook."
            );
          }

          return response.json();
        })
        .then((payload) => {
          setProjectionDataset({
            meta:
              payload.meta ?? {},
            evaluation:
              payload.evaluation ?? {},
            players:
              payload.players ?? [],
          });

          setProjectionError("");
        })
        .catch((error) => {
          setProjectionError(
            error.message
          );
        })
        .finally(() => {
          projectionRequestInFlight.current = false;
          setProjectionLoading(false);
        });
    }, [
      projectionDataset.players.length,
    ]);

  return {
    dataset,

    historyDataset,
    historyAvailable:
      historyDataset.seasons.length > 0,
    historyError,
    historyLoading,
    loadHistory,

    projectionDataset,
    projectionsAvailable:
      projectionDataset.players.length > 0,
    projectionError,
    projectionLoading,
    loadProjections,

    loadError,
  };
}
