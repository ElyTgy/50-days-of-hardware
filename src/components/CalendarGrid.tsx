import { useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { blockById } from "../data/blocks";
import { useDays } from "../lib/days";
import DayCell from "./DayCell";

const WEEKDAYS = ["Tue", "Wed", "Thu", "Fri", "Sat", "Sun", "Mon"];

/**
 * The calendar grid plus, in edit mode, drag-drop reordering and the staging
 * dock. Day 1 is Tue Jul 21, 2026, so the weekday header starts on Tuesday.
 * `active` is the spotlighted block id, or null.
 *
 * DnD robustness:
 * - Drag sources and drop targets are divs (anchors are unreliable in Safari).
 * - The dragged day's id travels in the dataTransfer payload, so drops work
 *   even if React state missed the dragstart.
 * - The WHOLE grid is one drop surface: dragover/drop are handled on the
 *   container and the insertion point is computed from the cursor, so the
 *   gaps between cells — where people naturally aim to "insert between two
 *   days" — accept drops instead of silently rejecting them.
 */
export default function CalendarGrid({ active }: { active: number | null }) {
  const { scheduled, staged, editing, dayById, moveDay, stageDay } = useDays();
  const navigate = useNavigate();
  const gridRef = useRef<HTMLDivElement>(null);
  const [draggingId, setDraggingId] = useState<string | null>(null);
  const [overId, setOverId] = useState<string | null>(null); // day id | "end" | "dock"

  const trailing = (7 - (scheduled.length % 7)) % 7;

  /** The dragged day's id from the drop event, with state fallback. Returns
   *  null for foreign payloads (e.g. a URL dragged in from elsewhere). */
  const droppedDayId = (e: React.DragEvent): string | null => {
    const raw = e.dataTransfer.getData("text/plain") || draggingId || "";
    return dayById(raw) ? raw : null;
  };

  /** Where a drop at cursor (x, y) would insert: the id of the day to insert
   *  before, or null for "at the end". Nearest cell wins; past its horizontal
   *  midpoint means after it. */
  const insertionAt = (x: number, y: number): string | null => {
    const slots = gridRef.current?.querySelectorAll<HTMLElement>(".day-cell-slot");
    if (!slots || slots.length === 0) return null;
    let best = 0;
    let bestD = Infinity;
    slots.forEach((el, i) => {
      const r = el.getBoundingClientRect();
      const d = (r.x + r.width / 2 - x) ** 2 + (r.y + r.height / 2 - y) ** 2;
      if (d < bestD) {
        bestD = d;
        best = i;
      }
    });
    const r = slots[best].getBoundingClientRect();
    const idx = x > r.x + r.width / 2 ? best + 1 : best;
    return idx >= scheduled.length ? null : scheduled[idx].id;
  };

  const endDrag = () => {
    setDraggingId(null);
    setOverId(null);
  };

  const dragProps = (id: string) =>
    editing
      ? {
          draggable: true,
          dragging: draggingId === id,
          dropTarget: overId === id && draggingId !== id,
          onDragStart: () => setDraggingId(id),
          onDragEnd: endDrag,
        }
      : {};

  return (
    <div>
      <div className="cal-weekdays">
        {WEEKDAYS.map((w) => (
          <span key={w}>{w}</span>
        ))}
      </div>
      <div
        ref={gridRef}
        className="cal-grid"
        onDragOver={
          editing
            ? (e) => {
                e.preventDefault();
                e.dataTransfer.dropEffect = "move";
                setOverId(insertionAt(e.clientX, e.clientY) ?? "end");
              }
            : undefined
        }
        onDrop={
          editing
            ? (e) => {
                e.preventDefault();
                const src = droppedDayId(e);
                if (src) {
                  const before = insertionAt(e.clientX, e.clientY);
                  if (before !== src) moveDay(src, before);
                }
                endDrag();
              }
            : undefined
        }
      >
        {scheduled.map((d) => (
          <DayCell key={d.id} day={d} active={active} {...dragProps(d.id)} />
        ))}

        {/* Always mounted in edit mode: mounting it on dragstart shifts the
            dock mid-drag, which makes Chromium cancel drags from dock cards. */}
        {editing && (
          <div className={`cal-dropend${overId === "end" ? " drop-hover" : ""}`}>
            drop to append
          </div>
        )}

        {Array.from({ length: trailing }, (_, i) => (
          <div key={i} className="cal-empty" />
        ))}
      </div>

      {editing && (
        <div
          className={`dock${overId === "dock" ? " drop-hover" : ""}`}
          onDragOver={(e) => {
            e.preventDefault();
            e.dataTransfer.dropEffect = "move";
            setOverId("dock");
          }}
          onDragLeave={() => setOverId(null)}
          onDrop={(e) => {
            e.preventDefault();
            const src = droppedDayId(e);
            if (src) stageDay(src);
            endDrag();
          }}
        >
          <p className="dock-label">Staging — not scheduled</p>
          {staged.length === 0 ? (
            <p className="dock-hint">
              Drag a day here to unschedule it, or press + to draft a new one.
            </p>
          ) : (
            <div className="dock-cards">
              {staged.map((d) => {
                const block = blockById(d.blockId);
                return (
                  <div
                    key={d.id}
                    className={`dock-card${draggingId === d.id ? " dragging" : ""}`}
                    style={{ "--cell-accent": block.accent } as React.CSSProperties}
                    role="link"
                    tabIndex={0}
                    draggable
                    onDragStart={(e) => {
                      // setData is required for the drag to start in
                      // Safari/Firefox, and carries the id to the drop.
                      e.dataTransfer.setData("text/plain", d.id);
                      e.dataTransfer.effectAllowed = "move";
                      setDraggingId(d.id);
                    }}
                    onDragEnd={endDrag}
                    onClick={() => {
                      if (draggingId !== d.id) navigate(`/day/draft/${d.id}`);
                    }}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") navigate(`/day/draft/${d.id}`);
                    }}
                  >
                    {d.puzzle && "🧩 "}
                    {d.topic || "Untitled"}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
