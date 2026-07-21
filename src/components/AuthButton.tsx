import { useAuth } from "../lib/auth";
import { isSupabaseConfigured } from "../lib/supabase";

/** Whether the visitor has opted in to seeing the sign-in control. Casual
 *  visitors never see it; add `?edit` to any URL to reveal it. This isn't a
 *  security boundary (auth + RLS are) — just keeps the login out of sight. */
function editRequested() {
  return new URLSearchParams(window.location.search).has("edit");
}

/** Sign in / out control. Hidden entirely when Supabase isn't configured, and
 *  the Sign in button is hidden from casual visitors unless `?edit` is present. */
export default function AuthButton() {
  const { user, canEdit, loading, signIn, signOut } = useAuth();

  if (!isSupabaseConfigured || loading) return null;

  if (!user) {
    // Only reveal the entry point to someone who explicitly asked for it.
    if (!editRequested()) return null;
    return (
      <button className="auth-btn" onClick={signIn}>
        Sign in
      </button>
    );
  }

  return (
    <button
      className="auth-btn"
      onClick={signOut}
      title={canEdit ? `Signed in as ${user.email}` : `${user.email} — no edit access`}
    >
      {canEdit ? "Sign out" : "No access"}
    </button>
  );
}
