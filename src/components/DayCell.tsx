import { Link } from "react-router-dom";
import type { Day } from "../types";
import { blockById, dateForDay, formatDate } from "../data/blocks";

export default function DayCell({ day }: { day: Day }) {
  const block = blockById(day.blockId);
  return (
    <Link
      to={`/day/${day.day}`}
      className="day-cell"
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
