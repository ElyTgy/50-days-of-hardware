import { blocks } from "../data/blocks";

export default function Legend() {
  return (
    <div className="legend">
      {blocks.map((b) => (
        <span key={b.id} className="legend-chip">
          <span className="legend-swatch" style={{ background: b.accent }} />
          {b.name}
        </span>
      ))}
    </div>
  );
}
