import { Link, useNavigate, useParams } from "react-router-dom";
import DaySection from "../components/DaySection";
import { blockById, blocks, dateForDay, formatDateLong } from "../data/blocks";
import { useDays } from "../lib/days";
import { CORE_SECTIONS, DAY_SECTIONS } from "../types";

export default function DayPage() {
  const { n, id } = useParams();
  const navigate = useNavigate();
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

  const remove = () => {
    if (!confirm(`Delete “${day.topic || "this day"}” permanently?`)) return;
    deleteDay(day.id);
    navigate("/");
  };

  return (
    <main
      className="read"
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
                  onChange={(e) => updateDay(day.id, { puzzle: e.target.checked })}
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
    </main>
  );
}
