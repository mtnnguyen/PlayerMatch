import {
  Activity,
  BarChart3,
  CircleDot,
  Map,
  Boxes,
  SlidersHorizontal,
} from "lucide-react";

const VIEWS = [
  {
    key: "profile",
    label: "League Profile",
    icon: Activity,
  },
  {
    key: "scatter",
    label: "Scatter",
    icon: CircleDot,
  },
  {
    key: "distribution",
    label: "Distribution",
    icon: BarChart3,
  },
  {
    key: "drivers",
    label: "Match Drivers",
    icon: SlidersHorizontal,
  },
  {
    key: "styleMap",
    label: "Style Map",
    icon: Map,
  },
  {
    key: "archetypes",
    label: "Archetypes",
    icon: Boxes,
  },
];

export default function VisualSwitcher({
  activeView,
  onChange,
}) {
  return (
    <nav
      className="visual-switcher"
      aria-label="Visual analysis views"
    >
      <div>
        <span>VISUAL ANALYSIS</span>
        <strong>
          Choose how you want to inspect the matchup
        </strong>
      </div>

      <div className="visual-switcher-buttons">
        {VIEWS.map((view) => {
          const Icon = view.icon;

          return (
            <button
              type="button"
              key={view.key}
              className={
                activeView === view.key
                  ? "active"
                  : ""
              }
              aria-pressed={
                activeView === view.key
              }
              onClick={() =>
                onChange(view.key)
              }
            >
              <Icon
                size={15}
                aria-hidden="true"
              />
              {view.label}
            </button>
          );
        })}
      </div>
    </nav>
  );
}
