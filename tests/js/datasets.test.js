import { afterEach, describe, expect, test, vi } from "vitest";
import { readFileSync } from "node:fs";
import { createElement } from "react";
import { act, create } from "react-test-renderer";
import usePlayerData from "../../src/hooks/usePlayerData";
import { validatePlayers, validateHistory, validateProjections } from "../../src/model/datasets";

const fixture = (file) => JSON.parse(readFileSync(new URL(`../../public/${file}`, import.meta.url)));
const players = fixture("players.json");
const history = fixture("player_history.json");
const projections = fixture("projections.json");
let renderer;
afterEach(() => { if (renderer) act(() => renderer.unmount()); renderer = null; vi.unstubAllGlobals(); });

function mount() {
  let state;
  function Probe() { state = usePlayerData(); return null; }
  return { run: async () => { await act(async () => { renderer = create(createElement(Probe)); }); }, state: () => state };
}
const response = (payload, ok = true) => ({ ok, json: async () => payload });

describe("dataset validation", () => {
  test("accepts the actual committed datasets", () => {
    expect(validatePlayers(players).players.length).toBe(420);
    expect(validateHistory(history).seasons.length).toBe(6);
    expect(validateProjections(projections).players.length).toBe(420);
  });
  test.each([null, {}, { players: {} }, { players: [] }, { players: [players.players[0]] }])(
    "rejects malformed or insufficient primary data %j", (payload) => expect(() => validatePlayers(payload)).toThrow()
  );
  test("rejects duplicate IDs and invalid model inputs", () => {
    expect(() => validatePlayers({ players: [players.players[0], players.players[0]] })).toThrow();
    const broken = structuredClone(players);
    broken.players[0].pts = null;
    expect(() => validatePlayers(broken)).toThrow();
  });
});

describe("dataset loading and recovery", () => {
  test("failed request can be retried successfully", async () => {
    const fetcher = vi.fn().mockRejectedValueOnce(new Error("Network unavailable"))
      .mockResolvedValueOnce(response(players));
    vi.stubGlobal("fetch", fetcher);
    const probe = mount(); await probe.run();
    expect(probe.state().loadError).toContain("Network unavailable");
    await act(async () => { await probe.state().reloadPlayers(); });
    expect(probe.state().loadError).toBe("");
    expect(probe.state().dataset.players.length).toBe(420);
  });
  test("malformed success response becomes an error, then recovery works", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValueOnce(response({ players: {} }))
      .mockResolvedValueOnce(response(players)));
    const probe = mount(); await probe.run();
    expect(probe.state().loadError).not.toBe("");
    expect(probe.state().dataset.players).toEqual([]);
    await act(async () => { await probe.state().reloadPlayers(); });
    expect(probe.state().loadError).toBe("");
  });
  test("history and projections stay lazy and successful loads are cached", async () => {
    const fetcher = vi.fn(async (url) => response(url === "/players.json" ? players : url === "/player_history.json" ? history : projections));
    vi.stubGlobal("fetch", fetcher);
    const probe = mount(); await probe.run();
    expect(fetcher).toHaveBeenCalledTimes(1);
    await act(async () => { await probe.state().loadHistory(); await probe.state().loadProjections(); });
    await act(async () => { await probe.state().loadHistory(); await probe.state().loadProjections(); });
    expect(fetcher).toHaveBeenCalledTimes(3);
    expect(probe.state().historyAvailable).toBe(true);
    expect(probe.state().projectionsAvailable).toBe(true);
  });
  test("failed lazy request can be retried without reloading primary data", async () => {
    const fetcher = vi.fn().mockResolvedValueOnce(response(players))
      .mockResolvedValueOnce(response(null, false)).mockResolvedValueOnce(response(history));
    vi.stubGlobal("fetch", fetcher);
    const probe = mount(); await probe.run();
    await act(async () => { await probe.state().loadHistory(); });
    expect(probe.state().historyError).not.toBe("");
    expect(probe.state().historyLoading).toBe(false);
    await act(async () => { await probe.state().loadHistory(); });
    expect(probe.state().historyError).toBe("");
    expect(probe.state().historyAvailable).toBe(true);
  });
  test("unmount aborts an unfinished request", async () => {
    let signal;
    vi.stubGlobal("fetch", vi.fn((url, options) => { signal = options.signal; return new Promise(() => {}); }));
    const probe = mount(); await probe.run();
    act(() => renderer.unmount()); renderer = null;
    expect(signal.aborted).toBe(true);
  });
});

test("rejects malformed nested projection and metadata fields before rendering", () => {
  for (const corrupt of [
    (p) => { delete p.players[0].projections.pts; },
    (p) => { p.players[0].projections.pts.direction = null; },
    (p) => { p.evaluation.pts.holdout.selected.mae = "bad"; },
    (p) => { p.evaluation.pts.diagnostics.dimensions.scoringLevel.groups = "bad"; },
    (p) => { p.meta.projectionSeason = {}; },
  ]) {
    const payload = structuredClone(projections); corrupt(payload);
    expect(() => validateProjections(payload)).toThrow();
  }
  const brokenHistory = structuredClone(history); brokenHistory.meta.seasons = {};
  expect(() => validateHistory(brokenHistory)).toThrow();
});
