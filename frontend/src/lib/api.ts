export const API_BASE = import.meta.env.VITE_API_URL || "/api/v1";

interface ApiOptions extends RequestInit {
  json?: unknown;
}

class ApiError extends Error {
  status: number;
  constructor(message: string, status: number) {
    super(message);
    this.name = "ApiError";
    this.status = status;
  }
}

function parseDetail(body: string, fallback: string): string {
  if (!body) return fallback;
  let parsed: unknown;
  try {
    parsed = JSON.parse(body);
  } catch {
    return fallback;
  }
  if (parsed && typeof parsed === "object") {
    const detail = (parsed as { detail?: unknown }).detail;
    if (typeof detail === "string" && detail.trim()) return detail;
    if (Array.isArray(detail)) {
      const parts = detail
        .map((item) => {
          if (!item || typeof item !== "object") return null;
          const { loc, msg } = item as { loc?: unknown; msg?: unknown };
          const field =
            Array.isArray(loc) && loc.length
              ? String(loc[loc.length - 1])
              : null;
          return field
            ? `${field}: ${msg}`
            : typeof msg === "string"
              ? msg
              : null;
        })
        .filter((part): part is string => Boolean(part));
      if (parts.length) return parts.join("; ");
    }
    const message = (parsed as { message?: unknown }).message;
    if (typeof message === "string" && message.trim()) return message;
  }
  return fallback;
}

export function errorMessage(e: unknown, fallback: string): string {
  return e instanceof ApiError ? e.message : fallback;
}

export async function api<T = unknown>(
  path: string,
  options: ApiOptions = {},
): Promise<T> {
  const { json, ...fetchOptions } = options;
  const headers = new Headers(fetchOptions.headers);

  if (json !== undefined) {
    headers.set("Content-Type", "application/json");
    fetchOptions.body = JSON.stringify(json);
  }

  const res = await fetch(`${API_BASE}${path}`, {
    ...fetchOptions,
    headers,
    credentials: "include",
  });

  if (!res.ok) {
    const body = await res.text().catch(() => "");
    throw new ApiError(
      parseDetail(body, `Request failed (${res.status})`),
      res.status,
    );
  }

  return res.json();
}

export async function apiStream(
  path: string,
  options: ApiOptions = {},
): Promise<ReadableStream<Uint8Array>> {
  const { json, ...fetchOptions } = options;
  const headers = new Headers(fetchOptions.headers);

  if (json !== undefined) {
    headers.set("Content-Type", "application/json");
    fetchOptions.body = JSON.stringify(json);
  }

  const res = await fetch(`${API_BASE}${path}`, {
    ...fetchOptions,
    headers,
    credentials: "include",
  });

  if (!res.ok) {
    const body = await res.text().catch(() => "");
    throw new ApiError(
      parseDetail(body, `Request failed (${res.status})`),
      res.status,
    );
  }

  return res.body!;
}

export async function apiUpload<T = unknown>(
  path: string,
  file: File,
): Promise<T> {
  const formData = new FormData();
  formData.append("file", file);

  const res = await fetch(`${API_BASE}${path}`, {
    method: "POST",
    credentials: "include",
    body: formData,
  });

  if (!res.ok) {
    const body = await res.text().catch(() => "");
    throw new ApiError(
      parseDetail(body, `Request failed (${res.status})`),
      res.status,
    );
  }

  return res.json();
}
