import { useCallback, useEffect, useRef, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import DayNotes from "../components/DayNotes";
import DaySection from "../components/DaySection";
import { blockById, blocks, dateForDay, formatDateLong } from "../data/blocks";
import { useAuth } from "../lib/auth";
import { fetchDayNote } from "../lib/dayNotes";
import { useDays } from "../lib/days";
import { CORE_SECTIONS, DAY_SECTIONS } from "../types";

const NOTES_WIDTH_KEY = "day-notes-width";
const DEFAULT_NOTES_WIDTH = 460;
const MIN_NOTES_WIDTH = 320;

function readStoredWidth() {
  const raw = Number(localStorage.getItem(NOTES_WIDTH_KEY));
  return Number.isFinite(raw) && raw > 0 ? raw : DEFAULT_NOTES_WIDTH;
}

/** Drag-to-resize divider between the instructions and the notes panel.
 *  Width is stored in px and persisted so it stays put next visit. */
function useNotesWidth() {
  const [width, setWidth] = useState(readStoredWidth);
  const widthRef = useRef(width);
  widthRef.current = width;
  const [dragging, setDragging] = useState(false);

  const onResizerPointerDown = useCallback((e: React.PointerEvent<HTMLDivElement>) => {
    const handle = e.currentTarget;
    handle.setPointerCapture(e.pointerId);
    const startX = e.clientX;
    const startWidth = widthRef.current;
    setDragging(true);

    const clamp = (w: number) => {
      const max = Math.max(MIN_NOTES_WIDTH, window.innerWidth * 0.7 - 320);
      return Math.min(max, Math.max(MIN_NOTES_WIDTH, w));
    };

    const onMove = (ev: PointerEvent) => {
      setWidth(clamp(startWidth + (startX - ev.clientX)));
    };
    const onUp = () => {
      setDragging(false);
      handle.removeEventListener("pointermove", onMove);
      handle.removeEventListener("pointerup", onUp);
      localStorage.setItem(NOTES_WIDTH_KEY, String(widthRef.current));
    };
    handle.addEventListener("pointermove", onMove);
    handle.addEventListener("pointerup", onUp);
  }, []);

  useEffect(() => {
    if (!dragging) return;
    document.body.style.userSelect = "none";
    document.body.style.cursor = "col-resize";
    return () => {
      document.body.style.userSelect = "";
      document.body.style.cursor = "";
    };
  }, [dragging]);

  return { width, onResizerPointerDown, dragging };
}

export default function DayPage() {
  const { n, id } = useParams();
  const navigate = useNavigate();
  const { canEdit } = useAuth();
  const [mobileView, setMobileView] = useState<"read" | "write">("read");
  const { width: notesWidth, onResizerPointerDown, dragging } = useNotesWidth();
  const {
    loaded,
    total,
    editing,
    dayByNumber,
    dayById,
    updateDay,
    moveDay,
    stageDay,
    deleteDay,
  } = useDays();

  const day = id ? dayById(id) : dayByNumber(Number(n));

  // Whether this day already has a note, fetched once up front so the
  // instructions/notes split only appears when there's something to show —
  // an empty day doesn't reserve half the screen for nothing. `started`
  // lets the owner open a blank note on purpose.
  const [noteContent, setNoteContent] = useState<string | null>(null);
  const [writtenAt, setWrittenAt] = useState<string | null>(null);
  const [started, setStarted] = useState(false);
  useEffect(() => {
    if (!day) return;
    let cancelled = false;
    setNoteContent(null);
    setWrittenAt(null);
    setStarted(false);
    fetchDayNote(day.id).then((note) => {
      if (cancelled) return;
      setNoteContent(note.content);
      setWrittenAt(note.writtenAt);
    });
    return () => {
      cancelled = true;
    };
    // Deliberately keyed on the id, not the day object — it gets a new
    // reference on every edit (topic, block, …) and none of that should
    // re-trigger a notes re-fetch.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [day?.id]);

  if (!day) {
    return (
      <main className="read">
        {loaded && (
          <p className="empty-note">
            No such day. <Link to="/">Back to the calendar.</Link>
          </p>
        )}
      </main>
    );
  }

  const isDraft = day.position === null;
  const number = isDraft ? null : Number(n);
  const block = blockById(day.blockId);
  const hasNotes = !!noteContent;
  const notesExpanded = hasNotes || (canEdit && started);
  // Whether the Writing side has anything to offer at all — either real
  // content, or (for the owner) the option to start some.
  const showNotesUI = notesExpanded || canEdit;

  const remove = () => {
    if (!confirm(`Delete “${day.topic || "this day"}” permanently?`)) return;
    deleteDay(day.id);
    navigate("/");
  };

  return (
    <main
      className="read day-page"
      style={{ "--day-accent": block.accent } as React.CSSProperties}
    >
      <nav className="day-nav">
        {number && number > 1 ? (
          <Link to={`/day/${number - 1}`}>← Day {number - 1}</Link>
        ) : (
          <span />
        )}
        <Link to="/">Calendar</Link>
        {number && number < total ? (
          <Link to={`/day/${number + 1}`}>Day {number + 1} →</Link>
        ) : (
          <span />
        )}
      </nav>

      {showNotesUI && (
        <div className="day-view-tabs" role="tablist" aria-label="Day view">
          <button
            type="button"
            role="tab"
            aria-selected={mobileView === "read"}
            className={`day-view-tab${mobileView === "read" ? " active" : ""}`}
            onClick={() => setMobileView("read")}
          >
            Instructions
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={mobileView === "write"}
            className={`day-view-tab${mobileView === "write" ? " active" : ""}`}
            onClick={() => setMobileView("write")}
          >
            Writing
          </button>
        </div>
      )}

      <div className="day-layout" data-active={showNotesUI ? mobileView : "read"}>
        <div className="day-content">
          <header className="day-head">
            {isDraft ? (
              <h1 className="day-head-num draft">
                draft<span> / staged</span>
              </h1>
            ) : (
              <h1 className="day-head-num">
                {number}
                <span> / {total}</span>
              </h1>
            )}

            {editing ? (
              <input
                key={day.id}
                className="day-topic-input"
                defaultValue={day.topic}
                placeholder="Topic…"
                onBlur={(e) => {
                  if (e.target.value !== day.topic) {
                    updateDay(day.id, { topic: e.target.value });
                  }
                }}
              />
            ) : (
              <p className="day-head-topic">
                {day.puzzle && "🧩 "}
                {day.topic || "Untitled"}
              </p>
            )}

            <div className="day-head-meta">
              {editing ? (
                <>
                  <select
                    className="chip-select"
                    value={day.blockId}
                    onChange={(e) =>
                      updateDay(day.id, { blockId: Number(e.target.value) })
                    }
                    aria-label="Block"
                  >
                    {blocks.map((b) => (
                      <option key={b.id} value={b.id}>
                        {b.name}
                      </option>
                    ))}
                  </select>
                  <label className="puzzle-toggle">
                    <input
                      type="checkbox"
                      checked={day.puzzle}
                      onChange={(e) =>
                        updateDay(day.id, { puzzle: e.target.checked })
                      }
                    />
                    🧩 puzzle day
                  </label>
                </>
              ) : (
                <span
                  className="block-chip"
                  style={{ "--chip-accent": block.accent } as React.CSSProperties}
                >
                  <span className="legend-swatch" />
                  {block.name}
                </span>
              )}
              {!isDraft && number && (
                <span>{formatDateLong(dateForDay(number))}</span>
              )}
              {isDraft && <span>staged — not on the calendar</span>}
            </div>

            {editing && (
              <div className="day-admin">
                {isDraft ? (
                  <button
                    className="add-btn"
                    onClick={() => {
                      moveDay(day.id, null);
                      navigate(`/day/${total + 1}`);
                    }}
                  >
                    schedule at the end
                  </button>
                ) : (
                  <button
                    className="add-btn"
                    onClick={() => {
                      stageDay(day.id);
                      navigate(`/day/draft/${day.id}`);
                    }}
                  >
                    move to staging
                  </button>
                )}
                <button className="add-btn danger" onClick={remove}>
                  delete day
                </button>
              </div>
            )}
          </header>

          {DAY_SECTIONS.map(([field, title]) => {
            const content = day[field];
            const core = CORE_SECTIONS.includes(field);
            if (!core && !content && !editing) return null;
            return (
              <DaySection
                key={field}
                title={title}
                section={field}
                dayId={day.id}
                content={content}
                editable={editing}
                onSave={(next) => updateDay(day.id, { [field]: next })}
              />
            );
          })}
        </div>

        {notesExpanded && (
          <div
            className={`day-notes-resizer${dragging ? " dragging" : ""}`}
            onPointerDown={onResizerPointerDown}
            role="separator"
            aria-orientation="vertical"
            aria-label="Resize notes panel"
          />
        )}

        <aside
          className={`day-notes-panel${notesExpanded ? "" : " day-notes-panel-collapsed"}`}
          style={
            notesExpanded
              ? ({ "--notes-width": `${notesWidth}px` } as React.CSSProperties)
              : undefined
          }
        >
          {notesExpanded ? (
            <DayNotes
              dayId={day.id}
              initialContent={noteContent ?? ""}
              writtenAt={writtenAt}
              autoFocus={started}
            />
          ) : (
            // Wait for the initial fetch before offering "start" so a day
            // that already has notes doesn't flash the button first.
            canEdit &&
            noteContent !== null && (
              <button
                type="button"
                className="add-btn day-notes-start"
                onClick={() => setStarted(true)}
              >
                + start today's notes
              </button>
            )
          )}
        </aside>
      </div>
    </main>
  );
}
