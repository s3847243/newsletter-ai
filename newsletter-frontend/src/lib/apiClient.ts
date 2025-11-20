import { API_BASE_URL } from "./config";

export interface ApiError {
  message: string;
  status: number;
}

export async function apiFetch<T>(
  path: string,
  options: RequestInit = {},
  accessToken?: string | null
): Promise<T> {
  const url = `${API_BASE_URL}${path}`;

  const headers: HeadersInit = {
    "Content-Type": "application/json",
    ...(options.headers as Record<string, string> | undefined),
  };

  if (accessToken) {
    headers["Authorization"] = `Bearer ${accessToken}`;
  }

  const res = await fetch(url, {
    ...options,
    headers,
  });

  if (!res.ok) {
    let message = res.statusText;
    try {
      const data = await res.json();
      if (data?.message) message = data.message;
    } catch {
      // ignore
    }

    const error: ApiError = {
      message,
      status: res.status,
    };
    throw error;
  }

  // No content
  if (res.status === 204) {
    return {} as T;
  }

  return (await res.json()) as T;
}
