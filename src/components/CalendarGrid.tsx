import { days } from "../data/days";
import DayCell from "./DayCell";

const WEEKDAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

/**
 * Day 1 is Mon Jul 20, 2026, so the grid starts flush on a Monday.
 * The final week is padded with empty cells to keep columns aligned.
 * `active` is the spotlighted block id, or null.
 */
export default function CalendarGrid({ active }: { active: number | null }) {
  const trailing = (7 - (days.length % 7)) % 7;
  return (
    <div>
      <div className="cal-weekdays">
        {WEEKDAYS.map((w) => (
          <span key={w}>{w}</span>
        ))}
      </div>
      <div className="cal-grid">
        {days.map((d) => (
          <DayCell key={d.day} day={d} active={active} />
        ))}
        {Array.from({ length: trailing }, (_, i) => (
          <div key={i} className="cal-empty" />
        ))}
      </div>
    </div>
  );
}
