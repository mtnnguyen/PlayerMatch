import {
  useEffect,
  useId,
  useMemo,
  useState,
} from "react";

import {
  ArrowRight,
  Search,
} from "lucide-react";

import PlayerPortrait from "./PlayerPortrait";

export default function PlayerSearch({
  players,
  excludeId,
  onSelect,
  placeholder,
  align = "left",
  label,
}) {
  const [query, setQuery] =
    useState("");

  const [activeIndex, setActiveIndex] =
    useState(0);

  const listboxId =
    useId();

  const results = useMemo(() => {
    const normalized =
      query
        .trim()
        .toLowerCase();

    if (!normalized) {
      return [];
    }

    return players
      .filter(
        (player) =>
          player.id !==
            excludeId &&
          player.name
            .toLowerCase()
            .includes(
              normalized
            )
      )
      .slice(0, 7);
  }, [
    players,
    query,
    excludeId,
  ]);

  useEffect(() => {
    setActiveIndex(0);
  }, [query]);

  function choose(player) {
    onSelect(player);
    setQuery("");
  }

  function moveActive(direction) {
    if (!results.length) {
      return;
    }

    setActiveIndex(
      (current) =>
        (current +
          direction +
          results.length) %
        results.length
    );
  }

  return (
    <div
      className={`slot-search slot-search--${align}`}
    >
      <Search
        size={18}
        aria-hidden="true"
      />

      <label className="sr-only">
        {label}
      </label>

      <input
        value={query}
        onChange={(event) =>
          setQuery(
            event.target.value
          )
        }
        placeholder={placeholder}
        role="combobox"
        aria-label={label}
        aria-autocomplete="list"
        aria-expanded={
          Boolean(
            query.trim() &&
              results.length
          )
        }
        aria-controls={
          query.trim()
            ? listboxId
            : undefined
        }
        aria-activedescendant={
          query.trim() &&
          results[activeIndex]
            ? `${listboxId}-${results[activeIndex].id}`
            : undefined
        }
        onKeyDown={(event) => {
          if (
            event.key ===
            "ArrowDown"
          ) {
            event.preventDefault();
            moveActive(1);
          }

          if (
            event.key ===
            "ArrowUp"
          ) {
            event.preventDefault();
            moveActive(-1);
          }

          if (
            event.key ===
              "Enter" &&
            results[activeIndex]
          ) {
            event.preventDefault();
            choose(
              results[
                activeIndex
              ]
            );
          }

          if (
            event.key ===
            "Escape"
          ) {
            setQuery("");
          }
        }}
      />

      {query.trim() && (
        <div
          className="slot-search-menu"
          id={listboxId}
          role="listbox"
          aria-label={`${label} search results`}
        >
          {results.length ? (
            results.map(
              (
                player,
                index
              ) => (
                <button
                  type="button"
                  role="option"
                  aria-selected={
                    index ===
                    activeIndex
                  }
                  id={`${listboxId}-${player.id}`}
                  key={
                    player.id
                  }
                  className={
                    index ===
                    activeIndex
                      ? "active"
                      : ""
                  }
                  onMouseEnter={() =>
                    setActiveIndex(
                      index
                    )
                  }
                  onClick={() =>
                    choose(
                      player
                    )
                  }
                >
                  <PlayerPortrait
                    player={
                      player
                    }
                    variant="search"
                  />

                  <span>
                    <strong>
                      {
                        player.name
                      }
                    </strong>

                    <small>
                      {
                        player.team
                      }
                      {player.position
                        ? ` · ${player.position}`
                        : ""}
                      {" · "}
                      {
                        player.pts
                      }{" "}
                      PTS ·{" "}
                      {
                        player.ast
                      }{" "}
                      AST
                    </small>
                  </span>

                  <ArrowRight
                    size={16}
                    aria-hidden="true"
                  />
                </button>
              )
            )
          ) : (
            <div
              className="slot-search-empty"
              role="status"
            >
              No matching
              players
            </div>
          )}
        </div>
      )}
    </div>
  );
}
