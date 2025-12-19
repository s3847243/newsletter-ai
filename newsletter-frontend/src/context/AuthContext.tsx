"use client";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  ReactNode,
} from "react";
import { apiFetch, setTokens } from "@/lib/apiClient"; 
import { AuthUser, AuthResponse } from "@/types/auth";
import { clearAuth, loadAuth, saveAuth } from "@/lib/authStorage";
import { useRouter } from "next/navigation";

interface AuthContextValue {
  user: AuthUser | null;
  accessToken: string | null;
  refreshToken: string | null;
  setAuth: (resp: AuthResponse) => void;
  isAuthenticated: boolean;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (name: string, email: string, password: string) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [refreshToken, setRefreshToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const stored = loadAuth(); 
    setUser(stored.user || null);
    setAccessToken(stored.accessToken || null);
    setRefreshToken(stored.refreshToken || null);

    setTokens(stored.accessToken || null, stored.refreshToken || null);

    setLoading(false);
  }, []);

  const setAuth = useCallback((resp: AuthResponse) => {
    setUser(resp.user);
    setAccessToken(resp.accessToken);
    setRefreshToken(resp.refreshToken);

    // persist
    saveAuth({
      user: resp.user,
      accessToken: resp.accessToken,
      refreshToken: resp.refreshToken,
    });

    setTokens(resp.accessToken, resp.refreshToken);
  }, []);

  const login = useCallback(
    async (email: string, password: string) => {
      const resp = await apiFetch<AuthResponse>("/auth/login", {
        method: "POST",
        body: JSON.stringify({ email, password }),
      });

      setAuth(resp);
      router.push("/dashboard");
    },
    [setAuth, router]
  );

  const register = useCallback(
    async (name: string, email: string, password: string) => {
      const resp = await apiFetch<AuthResponse>("/auth/register", {
        method: "POST",
        body: JSON.stringify({ name, email, password }),
      });

      setAuth(resp);
      router.push(`/verify-email/sent?email=${encodeURIComponent(email)}`);
    },
    [setAuth, router]
  );

  const logout = useCallback(() => {
    setUser(null);
    setAccessToken(null);
    setRefreshToken(null);
    clearAuth();

    // clear tokens in apiClient too
    setTokens(null, null);

    router.push("/login");
  }, [router]);

  const value: AuthContextValue = {
    user,
    accessToken,
    refreshToken,
    setAuth,
    isAuthenticated: !!user && !!accessToken,
    loading,
    login,
    register,
    logout,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error("useAuth must be used within AuthProvider");
  }
  return ctx;
}
