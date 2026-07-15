import Markdown from "./Markdown";
import NoteBlock from "./NoteBlock";

interface Props {
  title: string;
  /** the section key used to store notes, e.g. "intro" */
  section: string;
  day: number;
  /** fixed content, filled in days.ts later (markdown + LaTeX + media) */
  content?: string;
}

/** One section of a day: fixed content on top, your inline notes below. */
export default function DaySection({ title, section, day, content }: Props) {
  return (
    <section className="day-section">
      <h2 className="day-section-title">{title}</h2>
      {content ? (
        <Markdown>{content}</Markdown>
      ) : (
        <p className="day-section-empty">Not written yet.</p>
      )}
      <NoteBlock day={day} section={section} />
    </section>
  );
}
