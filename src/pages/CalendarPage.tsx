import { useEffect, useState } from "react";
import CalendarGrid from "../components/CalendarGrid";
import Legend from "../components/Legend";

export default function CalendarPage() {
  // Which block is spotlighted in the calendar, or null for none.
  const [active, setActive] = useState<number | null>(null);
  const toggle = (id: number) => setActive((cur) => (cur === id ? null : id));

  // Escape clears the spotlight.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setActive(null);
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  return (
    <main>
      <div className="page-head">
        <h1 className="page-title">The calendar</h1>
        <p className="page-sub">Mon Jul 20 → Mon Sep 7, 2026 · 1 hr/day · sit down and go</p>
      </div>
      <Legend active={active} onToggle={toggle} />
      <CalendarGrid active={active} />
    </main>
  );
}
