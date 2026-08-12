const API_BASE = import.meta.env.VITE_API_URL || "/api/v1";

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
    const text = await res.text().catch(() => "Unknown error");
    throw new ApiError(text, res.status);
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
    const text = await res.text().catch(() => "Unknown error");
    throw new ApiError(text, res.status);
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
    const text = await res.text().catch(() => "Unknown error");
    throw new ApiError(text, res.status);
  }

  return res.json();
}
