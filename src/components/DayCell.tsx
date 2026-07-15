import { Link } from "react-router-dom";
import type { Day } from "../types";
import { blockById, dateForDay, formatDate } from "../data/blocks";

interface Props {
  day: Day;
  /** spotlighted block id, or null for no spotlight */
  active: number | null;
}

export default function DayCell({ day, active }: Props) {
  const block = blockById(day.blockId);
  const mode =
    active === null ? "" : day.blockId === active ? " is-highlight" : " is-dim";

  return (
    <Link
      to={`/day/${day.day}`}
      className={`day-cell${mode}`}
      style={{ "--cell-accent": block.accent } as React.CSSProperties}
    >
      <div className="day-cell-top">
        <span className="day-cell-num">{day.day}</span>
        {day.puzzle && (
          <span className="day-cell-puzzle" title="Puzzle day">
            🧩
          </span>
        )}
        <span className="day-cell-date">{formatDate(dateForDay(day.day))}</span>
      </div>
      <span className="day-cell-topic">{day.topic}</span>
    </Link>
  );
}
