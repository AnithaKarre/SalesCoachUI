/**
 * Auth context — in-memory store backed by localStorage so the API client
 * can read the token. We deliberately wipe both stores on every fresh page
 * load (see AuthProvider) so any refresh kicks the user back to /login.
 */
import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";

export type Role = "DSP" | "Manager";

export interface AuthUser {
  email: string;
  username: string;
  role: Role;
}

interface AuthState {
  user: AuthUser | null;
  token: string | null;
  login: (email: string, password: string) => Promise<AuthUser>;
  logout: () => void;
}

const AuthContext = createContext<AuthState | null>(null);

const STORAGE_KEYS = { token: "sc_access_token", user: "sc_user" } as const;

export function formatUsername(email: string): string {
  return email.replace(/@(gcash|gmail)\.com$/i, "").replace(/[._-]+/g, " ").trim();
}

function inferRole(email: string): Role {
  return /manager|lead|head|supervisor/i.test(email) ? "Manager" : "DSP";
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

  const value = useMemo<AuthState>(
    () => ({
      user,
      token,
      async login(email, password) {
        // Try real backend first; if unavailable, fall back to demo auth so
        // the prototype works without the FastAPI service running.
        let accessToken: string | null = null;
        try {
          const res = await fetch("http://localhost:8080/api/v1/auth/login", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ email, password }),
            // small timeout via AbortController
          });
          if (res.ok) {
            const data = await res.json();
            accessToken = data.access_token ?? data.token ?? null;
          }
        } catch {
          /* offline / endpoint not implemented — fall through to demo */
        }
        if (!accessToken) {
          if (!email || !password) throw new Error("Email and password are required");
          accessToken = `demo.${btoa(email)}.${Date.now()}`;
        }

        const next: AuthUser = {
          email,
          username: formatUsername(email),
          role: inferRole(email),
        };
        setUser(next);
        setToken(accessToken);
        try {
          localStorage.setItem(STORAGE_KEYS.token, accessToken);
          localStorage.setItem(STORAGE_KEYS.user, JSON.stringify(next));
        } catch {}
        return next;
      },
      logout() {
        setUser(null);
        setToken(null);
        try {
          localStorage.removeItem(STORAGE_KEYS.token);
          localStorage.removeItem(STORAGE_KEYS.user);
        } catch {}
      },
    }),
    [user, token],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthState {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside AuthProvider");
  return ctx;
}

export function getStoredToken(): string | null {
  try {
    return localStorage.getItem(STORAGE_KEYS.token);
  } catch {
    return null;
  }
}
