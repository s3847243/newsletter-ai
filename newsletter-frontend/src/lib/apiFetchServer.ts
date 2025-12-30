import "server-only";
import { cookies } from "next/headers";
import { API_BASE_URL } from "./config";

export async function apiFetchServer<T>(
  path: string,
  options: RequestInit = {}
): Promise<T> {
  const cookieStore = await cookies();       
  const cookieHeader = cookieStore.toString(); 

  const res = await fetch(`${API_BASE_URL}${path}`, {
    ...options,
    headers: {
      ...(options.headers || {}),
      Cookie: cookieHeader, 
    },
    cache: "no-store",
  });

  if (res.status === 204) {
    if (!res.ok) throw new Error(res.statusText || "Request failed");
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
    const message = (data && data.message) || res.statusText || "Request failed";
    const err = new Error(message) as Error & { status?: number };
    err.status = res.status;
    throw err;
  }


  return data as T;
}
