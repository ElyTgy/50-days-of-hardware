import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import CalendarGrid from "../components/CalendarGrid";
import Legend from "../components/Legend";
import { CHALLENGE_START, dateForDay } from "../data/blocks";
import { useDays } from "../lib/days";

const fmt = (d: Date) =>
  d.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" });

export default function CalendarPage() {
  const { total, editing, addDay } = useDays();
  const navigate = useNavigate();

  // Which block is spotlighted in the calendar, or null for none.
  const [active, setActive] = useState<number | null>(null);
  const toggle = (id: number) => setActive((cur) => (cur === id ? null : id));

  // Escape clears the spotlight.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setActive(null);
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  const end = total > 0 ? dateForDay(total) : CHALLENGE_START;

  return (
    <main>
      <div className="page-head">
        <h1 className="page-title">The calendar</h1>
        <p className="page-sub">
          {fmt(CHALLENGE_START)} → {fmt(end)}, {end.getFullYear()} · 1 hr/day ·
          sit down and go
        </p>
      </div>
      <Legend active={active} onToggle={toggle} />
      <CalendarGrid active={active} />

      {editing && (
        <button
          type="button"
          className="fab"
          title="Draft a new day (lands in staging)"
          onClick={() => navigate(`/day/draft/${addDay()}`)}
        >
          +
        </button>
      )}
    </main>
  );
}
