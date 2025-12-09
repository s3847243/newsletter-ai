// src/lib/apiClient.ts
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
  if (!currentRefreshToken) return null;

  const res = await fetch(`${API_BASE_URL}/auth/refresh`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ refreshToken: currentRefreshToken }),
  });

  if (!res.ok) {
    return null;
  }

  const data = await res.json() as {
    user: { id: string; email: string; name?: string };
    accessToken: string;
    refreshToken: string;
  };

  currentAccessToken = data.accessToken;
  currentRefreshToken = data.refreshToken;

  // You should also update AuthContext here via a callback from outside.
  return { accessToken: data.accessToken, refreshToken: data.refreshToken };
}

// Main apiFetch with auto-refresh
export async function apiFetch<T>(
  path: string,
  options: RequestInit = {},
  accessTokenOverride?: string,
  retry = true
): Promise<T> {
  const token = accessTokenOverride ?? currentAccessToken;

  const headers: HeadersInit = {
    "Content-Type": "application/json",
    
  };

  if (token && headers) {
    headers["Authorization"] = `Bearer ${token}`;
  }


  const res = await fetch(`${API_BASE_URL}${path}`, {
    ...options,
    headers,
  });

  // If access token expired, try refreshing once
  if (res.status === 401 && retry && currentRefreshToken) {
    const refreshed = await refreshTokens();

    if (refreshed?.accessToken) {
      // Retry original request with new token, but don't loop forever
      return apiFetch<T>(path, options, refreshed.accessToken, false);
    }
  }

  if (!res.ok) {
    const errorBody = await res.text();
    let message = "Request failed";
    try {
      const parsed = JSON.parse(errorBody);
      if (parsed?.message) message = parsed.message;
    } catch {
      // ignore
    }

    const err: ApiError = {
      status: res.status,
      message,
    };
    throw err;
  }

  return res.json() as Promise<T>;
}

export type ApiError = {
  status: number;
  message: string;
};
