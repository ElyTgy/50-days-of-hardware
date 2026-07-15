import { NavLink, Outlet } from "react-router-dom";
import { isSupabaseConfigured } from "../lib/supabase";
import ThemeToggle from "./ThemeToggle";

export default function Layout() {
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
