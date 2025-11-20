import { AuthUser } from "@/types/auth";

const STORAGE_KEY = "newsletter_ai_auth";

interface StoredAuth {
  user: AuthUser | null;
  accessToken: string | null;
  refreshToken: string | null;
}

export function saveAuth(data: StoredAuth) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
}

export function loadAuth(): StoredAuth {
  if (typeof window === "undefined") {
    return { user: null, accessToken: null, refreshToken: null };
  }
  const raw = window.localStorage.getItem(STORAGE_KEY);
  if (!raw) {
    return { user: null, accessToken: null, refreshToken: null };
  }
  try {
    return JSON.parse(raw) as StoredAuth;
  } catch {
    return { user: null, accessToken: null, refreshToken: null };
  }
}

export function clearAuth() {
  if (typeof window === "undefined") return;
  window.localStorage.removeItem(STORAGE_KEY);
}
