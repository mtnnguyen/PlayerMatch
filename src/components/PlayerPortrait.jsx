import { useEffect, useState } from "react";

const initials = (name = "") =>
  name.split(" ").filter(Boolean).map((p) => p[0]).join("").slice(0, 2).toUpperCase();

export default function PlayerPortrait({ player, variant = "large" }) {
  const [failed, setFailed] = useState(false);

  useEffect(() => setFailed(false), [player?.id]);

  if (!player) return null;

  return (
    <div className={`player-portrait player-portrait--${variant}`}>
      {!failed && (
        <img
          src={`https://cdn.nba.com/headshots/nba/latest/1040x760/${player.id}.png`}
          alt={player.name}
          onError={() => setFailed(true)}
        />
      )}
      {failed && <span>{initials(player.name)}</span>}
    </div>
  );
}
