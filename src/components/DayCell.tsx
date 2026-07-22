import { Link } from "react-router-dom";
import type { ScheduledDay } from "../types";
import { blockById, dateForDay, formatDate } from "../data/blocks";

interface Props {
  day: ScheduledDay;
  /** spotlighted block id, or null for no spotlight */
  active: number | null;
  /** edit-mode drag & drop (wired by CalendarGrid) */
  draggable?: boolean;
  dragging?: boolean;
  dropTarget?: boolean;
  onDragStart?: () => void;
  onDragEnd?: () => void;
  onDragOver?: (e: React.DragEvent) => void;
  onDrop?: (e: React.DragEvent) => void;
}

/**
 * One calendar cell. The DnD handlers live on a wrapper div, not the Link:
 * several browsers (Safari in particular) won't reliably accept drops onto
 * anchor elements, while plain divs work everywhere.
 */
export default function DayCell({
  day,
  active,
  draggable,
  dragging,
  dropTarget,
  onDragStart,
  onDragEnd,
  onDragOver,
  onDrop,
}: Props) {
  const block = blockById(day.blockId);
  const mode =
    active === null ? "" : day.blockId === active ? " is-highlight" : " is-dim";
  const dnd =
    (dragging ? " dragging" : "") + (dropTarget ? " drop-target" : "");

  return (
    <div
      className="day-cell-slot"
      draggable={draggable}
      onDragStart={(e) => {
        // setData is required for the drag to start at all in Safari/Firefox.
        e.dataTransfer.setData("text/plain", day.id);
        e.dataTransfer.effectAllowed = "move";
        onDragStart?.();
      }}
      onDragEnd={onDragEnd}
      onDragOver={onDragOver}
      onDrop={(e) => {
        e.preventDefault();
        onDrop?.(e);
      }}
    >
      <Link
        to={`/day/${day.number}`}
        className={`day-cell${mode}${dnd}`}
        style={{ "--cell-accent": block.accent } as React.CSSProperties}
        // In edit mode the wrapper owns the drag; stop the anchor's native
        // link-drag from hijacking it.
        draggable={draggable ? false : undefined}
        onClick={(e) => {
          // A drag that ends on the cell shouldn't navigate.
          if (dragging) e.preventDefault();
        }}
      >
        <div className="day-cell-top">
          <span className="day-cell-num">{day.number}</span>
          {day.puzzle && (
            <span className="day-cell-puzzle" title="Puzzle day">
              🧩
            </span>
          )}
          <span className="day-cell-date">{formatDate(dateForDay(day.number))}</span>
        </div>
        <span className="day-cell-topic">{day.topic || "Untitled"}</span>
      </Link>
    </div>
  );
}
