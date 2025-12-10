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

// // Main apiFetch with auto-refresh
// export async function apiFetch<T>(
//   path: string,
//   options: RequestInit = {},
//   accessTokenOverride?: string,
//   retry = true
// ): Promise<T> {
//   const token = accessTokenOverride ?? currentAccessToken;

//   const headers: HeadersInit = {
//     "Content-Type": "application/json",
    
//   };

//   if (token && headers) {
//     headers["Authorization"] = `Bearer ${token}`;
//   }


//   const res = await fetch(`${API_BASE_URL}${path}`, {
//     ...options,
//     headers,
//   });

//   // If access token expired, try refreshing once
//   if (res.status === 401 && retry && currentRefreshToken) {
//     const refreshed = await refreshTokens();

//     if (refreshed?.accessToken) {
//       // Retry original request with new token, but don't loop forever
//       return apiFetch<T>(path, options, refreshed.accessToken, false);
//     }
//   }
//     // 🔹 Special case: 204 No Content → no body, nothing to parse
//   if (res.status === 204) {
//     if (!res.ok) {
//       throw new ApiError(res.statusText || "Request failed", res.status, null);
//     }
//     // Return null/undefined depending on preference
//     return null as T;
//   }
//   if (!res.ok) {
//     const errorBody = await res.text();
//     let data: any = null;

//     if (errorBody.trim().length > 0) {
//       try {
//         data = JSON.parse(errorBody);
//       } catch (e) {
//         // Not valid JSON – leave as raw text or null
//         data = errorBody;
//       }
//     }

//     let message = "Request failed";
//     try {
//       const parsed = JSON.parse(errorBody);
//       if (parsed?.message) message = parsed.message;
//     } catch {
//       // ignore
//     }

//     throw new ApiError(message, res.status, data);
//   }
//   console.log(res)
//   return res.json() as Promise<T>;
// }
async function internalFetch<T>(
  path: string,
  options: RequestInit,
  allowRetry: boolean
): Promise<T> {
  const { accessToken } = loadAuth();

  const headers: HeadersInit = {
    "Content-Type": "application/json",
    ...(options.headers as Record<string, string> || {}),
  };

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