import { Link, useParams } from "react-router-dom";
import DaySection from "../components/DaySection";
import { blockById, dateForDay, formatDateLong } from "../data/blocks";
import { dayByNumber, days } from "../data/days";

export default function DayPage() {
  const { n } = useParams();
  const num = Number(n);
  const day = dayByNumber(num);

  if (!day) {
    return (
      <main className="read">
        <p className="empty-note">
          No such day. <Link to="/">Back to the calendar.</Link>
        </p>
      </main>
    );
  }

  const block = blockById(day.blockId);

  return (
    <main
      className="read"
      style={{ "--day-accent": block.accent } as React.CSSProperties}
    >
      <nav className="day-nav">
        {num > 1 ? <Link to={`/day/${num - 1}`}>← Day {num - 1}</Link> : <span />}
        <Link to="/">Calendar</Link>
        {num < days.length ? <Link to={`/day/${num + 1}`}>Day {num + 1} →</Link> : <span />}
      </nav>

      <header className="day-head">
        <h1 className="day-head-num">
          {day.day}
          <span> / 50</span>
        </h1>
        <p className="day-head-topic">
          {day.puzzle && "🧩 "}
          {day.topic}
        </p>
        <div className="day-head-meta">
          <span
            className="block-chip"
            style={{ "--chip-accent": block.accent } as React.CSSProperties}
          >
            <span className="legend-swatch" />
            {block.name}
          </span>
          <span>{formatDateLong(dateForDay(day.day))}</span>
        </div>
      </header>

      <DaySection title="Introduction & background" section="intro" day={day.day} content={day.intro} />
      <DaySection title="Activity" section="activity" day={day.day} content={day.activity} />
      <DaySection title="Question to answer" section="question" day={day.day} content={day.question} />
      <DaySection title="X post" section="xpost" day={day.day} content={day.xPost} />
      <DaySection title="Additional resources" section="resources" day={day.day} content={day.resources} />
    </main>
  );
}
