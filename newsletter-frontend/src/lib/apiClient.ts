import { API_BASE_URL } from "./config";

// let currentAccessToken: string | null = null;
// let currentRefreshToken: string | null = null;
function shouldSkipRefresh(path: string) {
  return (
    // path.startsWith("/auth/login") ||
    // path.startsWith("/auth/register") ||
    // path.startsWith("/auth/refresh") ||
    path.startsWith("/public/")
  );
}
// export function setTokens(access: string | null, refresh: string | null) {
//   currentAccessToken = access;
//   currentRefreshToken = refresh;
// }

async function refreshTokens() {

  // const cookieRes = await fetch(`${API_BASE_URL}/auth/refresh`, {
  //   method: "POST",
  //   credentials: "include",
  // });
  // it is now a next route
  const res = await fetch(`/api/auth/refresh`, {
    method: "POST",
    credentials: "include",
  });
  
  // if (cookieRes.ok) {
  //   return null;
  // }
  if (res.ok) return null;

  // const res = await fetch(`${API_BASE_URL}/auth/refresh`, {
  //   method: "POST",
  //   credentials: "include",
  // });

    // if (!res.ok) {
    //   const text = await res.text().catch(() => "");
    //   let data: any = null;

    //   if (text.trim()) {
    //     try {
    //       data = JSON.parse(text);
    //     } catch {
    //       data = text;
    //     }
    //   }

    //   const message =
    //     (data && data.message) || res.statusText || "Failed to refresh token";

    //   throw new ApiError(message, res.status, data);
    // }
    const text = await res.text().catch(() => "");
    let data: any = null;

    if (text.trim()) {
      try {
        data = JSON.parse(text);
      } catch {
        data = text;
      }
    }

    const message =
      (data && data.message) || res.statusText || "Failed to refresh token";
    throw new ApiError(message, res.status, data);
  }

async function internalFetch<T>(
  path: string,
  options: RequestInit,
  allowRetry: boolean
): Promise<T> {

 const isFormData = options.body instanceof FormData;

  const headers: Record<string, string> = {
    ...((options.headers as Record<string, string>) || {}),
  };

  if (!isFormData && !headers["Content-Type"]) {
    headers["Content-Type"] = "application/json";
  }
  // const res = await fetch(`${API_BASE_URL}${path}`, {
  //   ...options,
  //   headers,
  //   credentials: "include", 
  // });
  // MAIN CHANGE: call the Next proxy
  const res = await fetch(`/api/proxy${path}`, {
    ...options,
    headers,
    credentials: "include", 
  });

  if (res.status === 401 &&
    allowRetry &&
    !shouldSkipRefresh(path) 
    ) {
    try {
      await refreshTokens();

      const retryHeaders: Record<string, string> = {
        ...(options.headers as Record<string, string> | undefined),
      };

      if (!isFormData && options.body && !retryHeaders["Content-Type"]) {
        retryHeaders["Content-Type"] = "application/json";
      }

      // const retryRes = await fetch(`${API_BASE_URL}${path}`, {
      //   ...options,
      //   headers: retryHeaders,
      //   credentials: "include",
      // });
       const retryRes = await fetch(`/api/proxy${path}`, {
          ...options,
          headers: retryHeaders,
          credentials: "include",
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