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

/** GET /merchants — fetch all merchants list */
export async function getMerchants() {
  return apiFetch<any[]>("/merchants");
}

/** GET /merchants/{id} — fetch single merchant by ID */
export async function getMerchantById(id: string) {
  return apiFetch<any>(`/merchants/${encodeURIComponent(id)}`);
}

/** GET /merchants/{id}/score — fetch merchant priority score */
export async function getMerchantScore(id: string) {
  return apiFetch<{
    priorityScore: number;
    breakdown: Array<{ label: string; value: number }>;
  }>(`/merchants/${encodeURIComponent(id)}/score`);
}

/** PATCH /merchants/{id}/status — update merchant status */
export async function updateMerchantStatus(id: string, status: string) {
  return apiFetch<{ status: string }>(`/merchants/${encodeURIComponent(id)}/status`, {
    method: "PATCH",
    body: JSON.stringify({ status }),
  });
}

/** GET /dashboard/dsp — fetch DSP dashboard summary */
export async function getDspDashboard(userId?: string) {
  return apiFetch<{
    agentName: string;
    visitsToday: number;
    visitsGoal: number;
    conversionRate: number;
    pendingActions: number;
    weeklyVisits: Array<{ day: string; visits: number; goal: number }>;
  }>(`/dashboard/dsp${userId ? `?user_id=${encodeURIComponent(userId)}` : ""}`);
}

/** GET /dashboard/manager — fetch manager dashboard summary */
export async function getManagerDashboard() {
  return apiFetch<{
    totalDsps: number;
    totalMerchants: number;
    avgPriorityScore: number;
    weeklyVisits: number;
    team: Array<{
      id: string;
      name: string;
      area: string;
      visits: number;
      conversion: number;
      score: number;
    }>;
    visitsByArea: Array<{ area: string; visits: number; target: number }>;
  }>("/dashboard/manager");
}
