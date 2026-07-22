import { NavLink, Outlet } from "react-router-dom";
import { useAuth } from "../lib/auth";
import { useDays } from "../lib/days";
import { isSupabaseConfigured } from "../lib/supabase";
import AuthButton from "./AuthButton";
import ThemeToggle from "./ThemeToggle";

export default function Layout() {
  const { canEdit } = useAuth();
  const { editing, setEditing } = useDays();

  return (
    <div className="shell">
      <header className="topbar">
        <NavLink to="/" className="topbar-title">
          50 Days of <em>Hardware</em>
        </NavLink>
        <div className="topbar-right">
          <nav className="topbar-nav">
            <NavLink to="/" end>
              Calendar
            </NavLink>
            <NavLink to="/shopping">Shopping</NavLink>
            <NavLink to="/resources">Resources</NavLink>
          </nav>
          {canEdit && (
            <button
              type="button"
              className={`edit-toggle${editing ? " active" : ""}`}
              aria-pressed={editing}
              onClick={() => setEditing(!editing)}
            >
              {editing ? "done" : "edit"}
            </button>
          )}
          <AuthButton />
          <ThemeToggle />
        </div>
      </header>
      {!isSupabaseConfigured && (
        <div className="config-banner">
          Supabase not connected — notes, shopping, and resources won't save. Add
          VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY to .env.local (see README).
        </div>
      )}
      <Outlet />
    </div>
  );
}
