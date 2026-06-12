/**
 * Auth context — talks to the SalesCoach backend at http://localhost:8000.
 *
 * Login flow:
 *   1. POST /auth/login  → get JWT
 *   2. GET  /auth/me     → get role + profile
 *
 * Logout calls POST /auth/logout (best-effort; local state is always cleared).
 * Token is mirrored to localStorage so the api client can attach the header.
 * On every fresh page load the persisted token is wiped (strict refresh rule).
 */
import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { authLogin, authLogout, authMe } from "./api";

export type Role = "DSP" | "Manager" | "Admin";

export interface AuthUser {
  id?: string;
  email: string;
  username: string;
  role: Role;
  // Anything else the backend returns is preserved here for downstream UI.
  [extra: string]: any;
}

interface AuthState {
  user: AuthUser | null;
  token: string | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<AuthUser>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthState | null>(null);

const STORAGE_KEYS = { token: "sc_access_token", user: "sc_user" } as const;

export function formatUsername(email: string): string {
  return email.replace(/@[^@]+$/i, "").replace(/[._-]+/g, " ").trim();
}

function normalizeRole(raw: any): Role {
  const r = String(raw ?? "").toLowerCase();
  if (r.startsWith("admin")) return "Admin";
  if (r.startsWith("manager") || r.includes("lead") || r.includes("supervisor")) return "Manager";
  return "DSP";
}

function toAuthUser(profile: any, fallbackEmail: string): AuthUser {
  const email = profile?.email ?? fallbackEmail;
  const username =
    profile?.username ?? profile?.name ?? profile?.full_name ?? formatUsername(email);
  return {
    ...profile,
    id: profile?.id ?? profile?.user_id,
    email,
    username,
    role: normalizeRole(profile?.role ?? profile?.user_role),
  };
}

export function AuthProvider({ children }: { children: ReactNode }) {
  // Strict rule: wipe persisted auth on every app boot (page refresh).
  useEffect(() => {
    try {
      localStorage.removeItem(STORAGE_KEYS.token);
      localStorage.removeItem(STORAGE_KEYS.user);
    } catch {}
  }, []);

  const [user, setUser] = useState<AuthUser | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const value = useMemo<AuthState>(
    () => ({
      user,
      token,
      loading,
      async login(email, password) {
        setLoading(true);
        try {
          const loginRes: any = await authLogin(email, password);
          const accessToken: string | null =
            loginRes?.access_token ?? loginRes?.token ?? loginRes?.jwt ?? null;
          if (!accessToken) throw new Error("Login response did not include a token");

          // Persist token immediately so apiFetch() picks it up for /auth/me.
          try { localStorage.setItem(STORAGE_KEYS.token, accessToken); } catch {}
          setToken(accessToken);

          let profile: any = null;
          try { profile = await authMe(); } catch { /* tolerate */ }

          const next = toAuthUser(profile ?? loginRes?.user ?? {}, email);
          setUser(next);
          try { localStorage.setItem(STORAGE_KEYS.user, JSON.stringify(next)); } catch {}
          return next;
        } finally {
          setLoading(false);
        }
      },
      async logout() {
        try { await authLogout(); } catch { /* best effort */ }
        setUser(null);
        setToken(null);
        try {
          localStorage.removeItem(STORAGE_KEYS.token);
          localStorage.removeItem(STORAGE_KEYS.user);
        } catch {}
      },
    }),
    [user, token, loading],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthState {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside AuthProvider");
  return ctx;
}

export function getStoredToken(): string | null {
  try { return localStorage.getItem(STORAGE_KEYS.token); } catch { return null; }
}
