import CalendarGrid from "../components/CalendarGrid";
import Legend from "../components/Legend";

export default function CalendarPage() {
  return (
    <main>
      <div className="page-head">
        <h1 className="page-title">The calendar</h1>
        <p className="page-sub">Mon Jul 20 → Mon Sep 7, 2026 · 1 hr/day · sit down and go</p>
      </div>
      <Legend />
      <CalendarGrid />
    </main>
  );
}
