import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import type { User } from "@supabase/supabase-js";
import { supabase, isSupabaseConfigured } from "./supabase";

/** Optional: gate the *UI* to this email too, so a signed-in non-owner doesn't
 *  see edit controls that RLS would reject anyway. RLS is the real guard. */
const ownerEmail = import.meta.env.VITE_OWNER_EMAIL as string | undefined;

interface AuthState {
  user: User | null;
  /** whether edit controls should be shown/enabled */
  canEdit: boolean;
  loading: boolean;
  signIn: () => void;
  signOut: () => void;
}

const AuthContext = createContext<AuthState>({
  user: null,
  canEdit: !isSupabaseConfigured, // no backend → local preview stays editable
  loading: false,
  signIn: () => {},
  signOut: () => {},
});

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(isSupabaseConfigured);

  useEffect(() => {
    if (!supabase) return;
    supabase.auth.getSession().then(({ data }) => {
      setUser(data.session?.user ?? null);
      setLoading(false);
    });
    const { data: sub } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });
    return () => sub.subscription.unsubscribe();
  }, []);

  const canEdit = !isSupabaseConfigured
    ? true
    : !!user && (!ownerEmail || user.email === ownerEmail);

  const signIn = () =>
    supabase?.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: window.location.origin },
    });

  const signOut = () => supabase?.auth.signOut();

  return (
    <AuthContext.Provider value={{ user, canEdit, loading, signIn, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}

// eslint-disable-next-line react-refresh/only-export-components
export const useAuth = () => useContext(AuthContext);
