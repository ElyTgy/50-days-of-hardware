import EditableMarkdown from "./EditableMarkdown";
import Markdown from "./Markdown";

interface Props {
  title: string;
  /** the section key used to store notes and day content, e.g. "intro" */
  section: string;
  dayId: string;
  /** fixed content (markdown + LaTeX + media) */
  content?: string;
  /** owner edit mode: fixed content becomes click-to-edit */
  editable?: boolean;
  onSave?: (next: string) => void;
}

/** One section of a day: fixed content on top, your inline notes below. */
export default function DaySection({
  title,
  section,
  dayId,
  content,
  editable,
  onSave,
}: Props) {
  return (
    <section className="day-section">
      <h2 className="day-section-title">{title}</h2>
      {editable && onSave ? (
        <EditableMarkdown
          value={content ?? ""}
          onSave={onSave}
          placeholder={`Write the ${title.toLowerCase()}…`}
          imagePrefix={`day-${dayId}/${section}`}
        />
      ) : content ? (
        <Markdown>{content}</Markdown>
      ) : (
        <p className="day-section-empty">Not written yet.</p>
      )}
    </section>
  );
}
