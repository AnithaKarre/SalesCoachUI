/**
 * SalesCoach AI backend client.
 *
 * Base URL: http://localhost:8000/api/v1
 * All requests include `Authorization: Bearer <token>` when a token is present
 * in localStorage. Errors are thrown as ApiError so callers / React Query can
 * surface a toast.
 */
import { getStoredToken } from "./auth";

export const API_BASE = "http://localhost:8000/api/v1";

export class ApiError extends Error {
  constructor(public status: number, message: string) {
    super(message);
    this.name = "ApiError";
  }
}

export async function apiFetch<T = any>(
  path: string,
  init: RequestInit = {},
): Promise<T> {
  const token = getStoredToken();
  const headers = new Headers(init.headers);
  if (!headers.has("Content-Type") && init.body && typeof init.body === "string") {
    headers.set("Content-Type", "application/json");
  }
  if (token && !headers.has("Authorization")) {
    headers.set("Authorization", `Bearer ${token}`);
  }
  headers.set("Accept", "application/json");

  let res: Response;
  try {
    res = await fetch(`${API_BASE}${path}`, { ...init, headers });
  } catch (e) {
    throw new ApiError(0, `Network error reaching backend (${API_BASE}${path}).`);
  }

  const text = await res.text();
  const data = text ? safeParse(text) : null;
  if (!res.ok) {
    const msg =
      (data && (data.detail || data.message || data.error)) ||
      res.statusText ||
      "Request failed";
    throw new ApiError(res.status, typeof msg === "string" ? msg : JSON.stringify(msg));
  }
  return data as T;
}

function safeParse(text: string): any {
  try { return JSON.parse(text); } catch { return text; }
}

/* ----------------------------- Auth ----------------------------- */

export async function authLogin(email: string, password: string) {
  return apiFetch<{ access_token?: string; token?: string; [k: string]: any }>(
    "/auth/login",
    { method: "POST", body: JSON.stringify({ email, password }) },
  );
}

export async function authMe() {
  return apiFetch<any>("/auth/me");
}

export async function authLogout() {
  return apiFetch<any>("/auth/logout", { method: "POST" });
}

/* --------------------------- Dashboards ------------------------- */

export async function getDashboard(role: "dsp" | "manager" | "admin") {
  return apiFetch<any>(`/dashboard/${role}`);
}

/* ---------------------------- Merchants ------------------------- */

export async function getPrioritizedMerchants() {
  return apiFetch<any[]>("/merchants/prioritized");
}

export async function getMerchantDetail(id: string) {
  return apiFetch<any>(`/merchants/${encodeURIComponent(id)}/detail`);
}

export async function getMerchantHistory(id: string) {
  return apiFetch<any[]>(`/merchants/${encodeURIComponent(id)}/history`);
}

export async function updateRecommendationStatus(
  recommendationId: string,
  status: string,
) {
  return apiFetch<any>(
    `/recommendations/${encodeURIComponent(recommendationId)}/status`,
    { method: "PATCH", body: JSON.stringify({ status }) },
  );
}

/* ------------------------------- Chat --------------------------- */

export async function getChatHistory() {
  return apiFetch<any[]>("/chat/history");
}

export async function postChat(message: string) {
  return apiFetch<any>("/chat", {
    method: "POST",
    body: JSON.stringify({ message }),
  });
}

/* ----------------------------- Manager -------------------------- */

export async function getManagerAreaSummary() {
  return apiFetch<any>("/manager/area-summary");
}

export async function getManagerTeam() {
  return apiFetch<any[]>("/manager/team");
}

/* ------------------------------ Admin --------------------------- */

export async function adminListUsers() {
  return apiFetch<any[]>("/admin/users");
}

export async function adminCreateUser(payload: Record<string, any>) {
  return apiFetch<any>("/admin/users", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export async function adminUpdateUser(id: string, payload: Record<string, any>) {
  return apiFetch<any>(`/admin/users/${encodeURIComponent(id)}`, {
    method: "PATCH",
    body: JSON.stringify(payload),
  });
}

export async function adminDeactivateUser(id: string) {
  return apiFetch<any>(`/admin/users/${encodeURIComponent(id)}`, {
    method: "DELETE",
  });
}

export async function adminChangeUserRole(id: string, role: string) {
  return apiFetch<any>(`/admin/users/${encodeURIComponent(id)}/role`, {
    method: "PATCH",
    body: JSON.stringify({ role }),
  });
}

export async function adminGetAuditLogs() {
  return apiFetch<any[]>("/admin/audit-logs");
}
