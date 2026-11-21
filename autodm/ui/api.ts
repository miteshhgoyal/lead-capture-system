"use client";

/** Tiny fetch helper for the AutoDM UI: JSON in/out, one error shape, redirects to login on 401. */
export interface ApiResult<T> {
  ok: boolean;
  status: number;
  data: T & { ok?: boolean; error?: string };
}

export async function api<T = Record<string, unknown>>(path: string, init: { method?: string; body?: unknown; admin?: boolean } = {}): Promise<ApiResult<T>> {
  const base = init.admin ? "/api/admin/autodm" : "/api/autodm";
  try {
    const res = await fetch(`${base}/${path}`, {
      method: init.method ?? "GET",
      headers: init.body !== undefined ? { "Content-Type": "application/json" } : undefined,
      body: init.body !== undefined ? JSON.stringify(init.body) : undefined,
      cache: "no-store",
    });
    if (res.status === 401) {
      window.location.href = init.admin ? "/admin/login" : "/partner/login";
    }
    const data = (await res.json().catch(() => ({}))) as ApiResult<T>["data"];
    return { ok: res.ok && data.ok !== false, status: res.status, data };
  } catch {
    return { ok: false, status: 0, data: { ok: false, error: "Network error. Please try again." } as ApiResult<T>["data"] };
  }
}

export const fmt = (iso?: string | Date | null) => (iso ? new Date(iso).toLocaleString("en-IN", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" }) : "–");
