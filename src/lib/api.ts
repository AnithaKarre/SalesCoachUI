/**
 * Lightweight fetch wrapper for the SalesCoach AI backend.
 * Attaches Authorization: Bearer <token> automatically.
 */
import { getStoredToken } from "./auth";

export const API_BASE = "http://localhost:8080/api/v1";

export class ApiError extends Error {
  constructor(public status: number, message: string) {
    super(message);
  }
}

export async function apiFetch<T = unknown>(
  path: string,
  init: RequestInit = {},
): Promise<T> {
  const token = getStoredToken();
  const headers = new Headers(init.headers);
  if (!headers.has("Content-Type") && init.body) headers.set("Content-Type", "application/json");
  if (token) headers.set("Authorization", `Bearer ${token}`);

  const res = await fetch(`${API_BASE}${path}`, { ...init, headers });
  const text = await res.text();
  const data = text ? safeParse(text) : null;
  if (!res.ok) {
    const msg = (data && (data.detail || data.message)) || res.statusText || "Request failed";
    throw new ApiError(res.status, msg);
  }
  return data as T;
}

function safeParse(text: string): any {
  try {
    return JSON.parse(text);
  } catch {
    return text;
  }
}

/** POST /chat — real backend endpoint */
export async function askCoach(message: string, user?: { id?: string; role?: string }) {
  return apiFetch<{ agent: string; answer: string }>("/chat", {
    method: "POST",
    body: JSON.stringify({
      message,
      user_id: user?.id,
      user_role: user?.role,
    }),
  });
}

/** GET /merchants/{name}/brief — real backend endpoint */
export async function getMerchantBrief(name: string) {
  return apiFetch<{ answer: string }>(`/merchants/${encodeURIComponent(name)}/brief`);
}

export async function getMerchantScoreLive(name: string) {
  return apiFetch<{ answer: string }>(`/merchants/${encodeURIComponent(name)}/score`);
}

export async function getMerchantRecommendationLive(name: string) {
  return apiFetch<{ answer: string }>(`/merchants/${encodeURIComponent(name)}/recommendation`);
}
