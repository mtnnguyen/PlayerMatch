import { useMemo, useState } from "react";
import { ArrowRight, Search } from "lucide-react";
import PlayerPortrait from "./PlayerPortrait";

export default function PlayerSearch({
  players,
  excludeId,
  onSelect,
  placeholder,
  align = "left",
}) {
  const [query, setQuery] = useState("");

  const results = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return [];
    return players
      .filter((p) => p.id !== excludeId && p.name.toLowerCase().includes(q))
      .slice(0, 7);
  }, [players, query, excludeId]);

  const choose = (player) => {
    onSelect(player);
    setQuery("");
  };

  return (
    <div className={`slot-search slot-search--${align}`}>
      <Search size={14} />
      <input
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder={placeholder}
        onKeyDown={(e) => {
          if (e.key === "Enter" && results[0]) choose(results[0]);
          if (e.key === "Escape") setQuery("");
        }}
      />

      {query.trim() && (
        <div className="slot-search-menu">
          {results.length ? (
            results.map((player) => (
              <button key={player.id} onClick={() => choose(player)}>
                <PlayerPortrait player={player} variant="search" />
                <span>
                  <strong>{player.name}</strong>
                  <small>{player.team} · {player.pts} PTS · {player.ast} AST</small>
                </span>
                <ArrowRight size={13} />
              </button>
            ))
          ) : (
            <div className="slot-search-empty">No matching players</div>
          )}
        </div>
      )}
    </div>
  );
}
