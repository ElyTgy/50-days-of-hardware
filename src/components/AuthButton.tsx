import { useAuth } from "../lib/auth";
import { isSupabaseConfigured } from "../lib/supabase";

/** Sign in / out control. Hidden entirely when Supabase isn't configured. */
export default function AuthButton() {
  const { user, canEdit, loading, signIn, signOut } = useAuth();

  if (!isSupabaseConfigured || loading) return null;

  if (!user) {
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
