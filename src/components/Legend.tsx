import { blocks } from "../data/blocks";

interface Props {
  active: number | null;
  onToggle: (id: number) => void;
}

/** Clickable legend: selecting a block spotlights its days in the calendar. */
export default function Legend({ active, onToggle }: Props) {
  return (
    <div className="legend">
      {blocks.map((b) => (
        <button
          key={b.id}
          type="button"
          className={`legend-chip${active === b.id ? " active" : ""}`}
          style={{ "--chip-accent": b.accent } as React.CSSProperties}
          aria-pressed={active === b.id}
          onClick={() => onToggle(b.id)}
        >
          <span className="legend-swatch" style={{ background: b.accent }} />
          {b.name}
        </button>
      ))}
      {active !== null && (
        <button type="button" className="legend-clear" onClick={() => onToggle(active)}>
          clear ✕
        </button>
      )}
    </div>
  );
}
