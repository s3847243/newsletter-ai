// src/lib/apiClient.ts
import { clearAuth, loadAuth, saveAuth } from "./authStorage";
import { API_BASE_URL } from "./config";

// You might want to inject these from context in a nicer way,
// but this gives the structure.
let currentAccessToken: string | null = null;
let currentRefreshToken: string | null = null;

// Optionally export setters so AuthContext can keep them in sync
export function setTokens(access: string | null, refresh: string | null) {
  currentAccessToken = access;
  currentRefreshToken = refresh;
}

async function refreshTokens() {
  const { refreshToken } = loadAuth();

  if (!refreshToken) {
    clearAuth();
    throw new ApiError("No refresh token", 401);
  }

  const res = await fetch(`${API_BASE_URL}/auth/refresh`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ refreshToken: currentRefreshToken }),
  });
  const text = await res.text();
  const data = text ? JSON.parse(text) : null;
  if (!res.ok) {
    clearAuth();
    const message =
      (data && data.message) || res.statusText || "Failed to refresh token";
    throw new ApiError(message, res.status, data);
  }

  // const data = await res.json() as {
  //   user: { id: string; email: string; name?: string };
  //   accessToken: string;
  //   refreshToken: string;
  // };

  // currentAccessToken = data.accessToken;
  // currentRefreshToken = data.refreshToken;
  saveAuth(data);

  // You should also update AuthContext here via a callback from outside.
  return data.accessToken as string;
}

async function internalFetch<T>(
  path: string,
  options: RequestInit,
  allowRetry: boolean
): Promise<T> {
  const { accessToken } = loadAuth();

 const isFormData = options.body instanceof FormData;

  // Build headers as a plain object so we can safely assign keys
  const headers: Record<string, string> = {
    ...((options.headers as Record<string, string>) || {}),
  };

  // Only set JSON content-type when NOT uploading FormData
  if (!isFormData && !headers["Content-Type"]) {
    headers["Content-Type"] = "application/json";
  }

  if (accessToken) {
    headers["Authorization"] = `Bearer ${accessToken}`;
  }

  const res = await fetch(`${API_BASE_URL}${path}`, {
    ...options,
    headers,
  });

  if (res.status === 401 && allowRetry) {
    try {
      const newAccessToken = await refreshTokens();

      const retryHeaders: HeadersInit = {
        "Content-Type": "application/json",
        ...(options.headers || {}),
        Authorization: `Bearer ${newAccessToken}`,
      };

      const retryRes = await fetch(`${API_BASE_URL}${path}`, {
        ...options,
        headers: retryHeaders,
      });

      return await parseResponse<T>(retryRes);
    } catch (err) {
      throw err;
    }
  }

  return await parseResponse<T>(res);
}

async function parseResponse<T>(res: Response): Promise<T> {
  if (res.status === 204) {
    if (!res.ok) {
      throw new ApiError(res.statusText || "Request failed", res.status, null);
    }
    return null as T;
  }

  const text = await res.text();
  let data: any = null;

  if (text.trim()) {
    try {
      data = JSON.parse(text);
    } catch {
      data = text;
    }
  }

  if (!res.ok) {
    const message =
      (data && data.message) || res.statusText || "Request failed";
    throw new ApiError(message, res.status, data);
  }

  return data as T;
}

export async function apiFetch<T>(
  path: string,
  options: RequestInit = {}
): Promise<T> {
  return internalFetch<T>(path, options, true);
}
export class ApiError extends Error {
  status: number;
  data: any;

  constructor(message: string, status: number, data?: any) {
    super(message);
    this.status = status;
    this.data = data;
  }
}