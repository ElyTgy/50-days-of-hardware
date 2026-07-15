import Markdown from "./Markdown";

interface Props {
  title: string;
  content?: string;
}

/** One titled section of a day page. Empty until filled in days.ts. */
export default function DaySection({ title, content }: Props) {
  return (
    <section className="day-section">
      <h2 className="day-section-title">{title}</h2>
      {content ? (
        <Markdown>{content}</Markdown>
      ) : (
        <p className="day-section-empty">Not written yet.</p>
      )}
    </section>
  );
}
